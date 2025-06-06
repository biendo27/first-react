import React, { useState, useEffect, useCallback } from 'react';
import * as Yup from 'yup';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  Autocomplete,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { Formik, Form, FieldArray } from 'formik';
import FormField from '../../../components/common/FormField';
import { subjectClassService, subjectService, classRoomService, administrativeClassService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// Helper function to format date for form
const formatDateForForm = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Helper function to calculate end date based on start date and weeks
const calculateEndDate = (startDate, weeks) => {
  if (!startDate || !weeks) return '';
  const date = new Date(startDate);
  date.setDate(date.getDate() + (weeks * 7));
  return formatDateForForm(date);
};

// Helper function to format date in dd/MM/yyyy format
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { // en-GB gives dd/MM/yyyy format
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Helper function to calculate exam date (one week after end date)
const calculateExamDate = (endDate) => {
  if (!endDate) return '';
  const date = new Date(endDate);
  date.setDate(date.getDate() + 7); // Add one week
  return formatDateForDisplay(date);
};

// Create a default subject class item
const createDefaultItem = () => ({
  name: '',
  subjectId: '',
  classRoomId: '',
  startDate: formatDateForForm(new Date()),
  endDate: formatDateForForm(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days later
  numberOfWeeks: 4, // Default to 4 weeks
  startLesson: 1,
  endLesson: 2,
  studyType: 'Theory',
  dayOfWeek: 2, // Monday (as per API: 2-8 for Monday-Sunday)
  term: 1,
  administrativeClassIds: []
});

const SubjectClassForm = ({ open, onClose, subjectClass }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [error, setError] = useState({ show: false, message: '' });
  const [subjects, setSubjects] = useState([]);
  const [classRooms, setClassRooms] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [administrativeClasses, setAdministrativeClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedAdministrativeClassIds, setSelectedAdministrativeClassIds] = useState([]);

  // Initialize with a single item when creating, or the existing item when editing
  const initialValues = subjectClass 
    ? {
        items: [{
          name: subjectClass.name || '',
          subjectId: subjectClass.subject?.id || '',
          classRoomId: subjectClass.classRoom?.id || '',
          startDate: formatDateForForm(subjectClass.startDate) || formatDateForForm(new Date()),
          endDate: formatDateForForm(subjectClass.endDate) || formatDateForForm(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          numberOfWeeks: 4, // Default, will be overridden by calculated value
          startLesson: subjectClass.startLesson || 1,
          endLesson: subjectClass.endLesson || 2,
          studyType: subjectClass.studyType || 'Theory',
          dayOfWeek: subjectClass.dayOfWeek || 2,
          term: subjectClass.term || 1,
          administrativeClassIds: []
        }]
      }
    : {
        items: [createDefaultItem()]
      };

  // Calculate number of weeks from start and end date for editing mode
  if (subjectClass && initialValues.items[0].startDate && initialValues.items[0].endDate) {
    const startDate = new Date(initialValues.items[0].startDate);
    const endDate = new Date(initialValues.items[0].endDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    initialValues.items[0].numberOfWeeks = Math.ceil(diffDays / 7);
  }

  // Validation schema for a single item
  const subjectClassItemSchema = Yup.object({
    name: Yup.string()
      .required(t('common:fieldRequired', { field: t('subjectClass.name') }))
      .max(100, t('subjectClass.name') + t('common:invalidFormat')),
    subjectId: Yup.string()
      .required(t('common:fieldRequired', { field: t('subjectClass.subject') })),
    classRoomId: Yup.string()
      .required(t('common:fieldRequired', { field: t('subjectClass.classRoom') })),
    startDate: Yup.date()
      .required(t('common:fieldRequired', { field: t('subjectClass.startDate') })),
    endDate: Yup.date()
      .required(t('common:fieldRequired', { field: t('subjectClass.endDate') }))
      .min(
        Yup.ref('startDate'), 
        t('subjectClass.endDateAfterStart')
      ),
    numberOfWeeks: Yup.number()
      .min(1, t('subjectClass.minWeeks'))
      .required(t('common:fieldRequired', { field: t('subjectClass.numberOfWeeks') })),
    startLesson: Yup.number()
      .required(t('common:fieldRequired', { field: t('subjectClass.startLesson') }))
      .min(1, t('subjectClass.lessonsBetween', { min: 1, max: 15 }))
      .max(15, t('subjectClass.lessonsBetween', { min: 1, max: 15 }))
      .integer(),
    endLesson: Yup.number()
      .required(t('common:fieldRequired', { field: t('subjectClass.endLesson') }))
      .min(1, t('subjectClass.lessonsBetween', { min: 1, max: 15 }))
      .max(15, t('subjectClass.lessonsBetween', { min: 1, max: 15 }))
      .integer()
      .test(
        'greaterThanStartLesson',
        t('subjectClass.endAfterStart'),
        function (value) {
          return value > this.parent.startLesson;
        }
      ),
    studyType: Yup.string()
      .required(t('common:fieldRequired', { field: t('subjectClass.studyType') }))
      .oneOf(['Theory', 'Practice']),
    dayOfWeek: Yup.number()
      .required(t('common:fieldRequired', { field: t('subjectClass.dayOfWeek') }))
      .min(2, t('subjectClass.dayOfWeekRange', { min: 2, max: 8 }))
      .max(8, t('subjectClass.dayOfWeekRange', { min: 2, max: 8 }))
      .integer(),
    term: Yup.number()
      .required(t('common:fieldRequired', { field: t('subjectClass.term') }))
      .min(1, t('subjectClass.termRange', { min: 1, max: 4 }))
      .max(4, t('subjectClass.termRange', { min: 1, max: 4 }))
      .integer(),
  });

  // Validation schema for the entire form
  const validationSchema = Yup.object({
    items: Yup.array().of(subjectClassItemSchema).min(1, t('subjectClass.atLeastOneItem'))
  });

  // Add function to fetch administrative classes
  const fetchAdministrativeClasses = useCallback(async () => {
    if (subjectClass) return; // Skip if editing existing class
    
    setClassesLoading(true);
    try {
      const response = await administrativeClassService.getAll({ PageSize: 10000 });
      setAdministrativeClasses(response.data || []);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('subjectClass.administrativeClass') }));
      setError({
        show: true,
        message: formattedError.message,
        severity: 'error'
      });
    } finally {
      setClassesLoading(false);
    }
  }, [t, subjectClass]);

  const fetchFormOptions = useCallback(async () => {
    setFormLoading(true);
    try {
      const [subjectsResponse, classRoomsResponse] = await Promise.all([
        subjectService.getAll({ PageSize: 10000 }),
        classRoomService.getAll({ PageSize: 10000 })
      ]);
      
      setSubjects(subjectsResponse.data || []);
      setClassRooms(classRoomsResponse.data || []);
    } catch (error) {
      console.error('Error fetching form options:', error);
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('common:data') }));
      setError({
        show: true,
        message: formattedError.message,
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      fetchFormOptions();
      fetchAdministrativeClasses();
    }
  }, [open, fetchFormOptions, fetchAdministrativeClasses]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Apply the selected administrative class ids to all items
      const updatedItems = values.items.map(item => ({
        ...item,
        administrativeClassIds: selectedAdministrativeClassIds
      }));

      if (subjectClass) {
        // If editing an existing subject class, update it
        await subjectClassService.update(subjectClass.id, updatedItems[0]);
        setError({
          show: true,
          message: t('subjectClass.updateSuccess'),
          severity: 'success'
        });
      } else {
        // If creating new subject classes, send all items
        await subjectClassService.create({ items: updatedItems });
        setError({
          show: true,
          message: t('subjectClass.createSuccess'),
          severity: 'success'
        });
      }
      resetForm();
      onClose(true);
    } catch (error) {
      const formattedError = handleApiError(
        error, 
        subjectClass ? t('subjectClass.updateError') : t('subjectClass.createError')
      );
      setError({
        show: true,
        message: formattedError.message,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for administrative class selection
  const handleAdministrativeClassChange = (_, newValues) => {
    const selectedIds = newValues.map(item => item.value).filter(id => id !== '');
    setSelectedAdministrativeClassIds(selectedIds);
  };

  // Create an array of numbers from 1 to 15 for lessons
  const lessonOptions = Array.from({ length: 15 }, (_, i) => i + 1);
  
  // Create term options
  const termOptions = Array.from({ length: 4 }, (_, i) => i + 1);
  
  // Create day of week options (2-8 correspond to Monday-Sunday)
  const dayOfWeekOptions = [
    { value: 2, label: t('common:days.monday') },
    { value: 3, label: t('common:days.tuesday') },
    { value: 4, label: t('common:days.wednesday') },
    { value: 5, label: t('common:days.thursday') },
    { value: 6, label: t('common:days.friday') },
    { value: 7, label: t('common:days.saturday') },
    { value: 8, label: t('common:days.sunday') },
  ];

  // Get day of week label
  const getDayOfWeekLabel = (dayOfWeek) => {
    const day = dayOfWeekOptions.find(d => d.value === dayOfWeek);
    return day ? day.label : '';
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onClose(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {subjectClass ? t('subjectClass.editSubjectClass') : t('subjectClass.addSubjectClass')}
        </DialogTitle>
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, setFieldValue, isSubmitting, isValid, dirty }) => (
            <Form>
              <DialogContent dividers>
                {error.show && error.severity === 'error' && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="error">{error.message}</Alert>
                  </Box>
                )}
                
                {formLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    {/* Administrative class selection at the form level */}
                    {!subjectClass && (
                      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {t('subjectClass.selectAdministrativeClasses')}
                        </Typography>
                        <Autocomplete
                          multiple
                          options={[
                            ...administrativeClasses.map(adminClass => ({ 
                              value: adminClass.id, 
                              label: adminClass.name 
                            }))
                          ]}
                          getOptionLabel={(option) => option.label || ''}
                          value={
                            selectedAdministrativeClassIds.length > 0
                              ? selectedAdministrativeClassIds.map(id => {
                                  const adminClass = administrativeClasses.find(c => c.id === id);
                                  return adminClass 
                                    ? { value: id, label: adminClass.name }
                                    : { value: id, label: id }; // Fallback if class not found
                                })
                              : []
                          }
                          onChange={handleAdministrativeClassChange}
                          loading={classesLoading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={t('subjectClass.administrativeClass')}
                              variant="outlined"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {classesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </Paper>
                    )}
                    
                    <FieldArray name="items">
                      {({ push, remove }) => (
                        <Box>
                          {values.items.map((item, index) => (
                            <Paper 
                              key={index} 
                              elevation={0} 
                              variant="outlined" 
                              sx={{ p: 2, mb: 3, position: 'relative' }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                mb: 2 
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="h6" sx={{ mr: 2 }}>
                                    {t('subjectClass.title')} #{index + 1}
                                  </Typography>
                                  {item.dayOfWeek && (
                                    <Chip 
                                      color="primary" 
                                      variant="outlined"
                                      label={getDayOfWeekLabel(item.dayOfWeek)}
                                      size="small"
                                    />
                                  )}
                                  {subjectClass && (
                                    <Chip 
                                      color="secondary"
                                      sx={{ ml: 1 }}
                                      icon={<EditIcon />} 
                                      label={t('common:editing')}
                                      size="small"
                                    />
                                  )}
                                </Box>
                                
                                <Box>
                                  {/* Only show the delete button if there's more than one item or it's not an edit */}
                                  {(index > 0 || !subjectClass) && (
                                    <Tooltip title={t('common:delete')}>
                                      <IconButton 
                                        aria-label="delete"
                                        onClick={() => remove(index)}
                                        color="error"
                                        size="small"
                                        sx={{ ml: 1 }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {/* Only show the clone button if it's not an edit mode */}
                                  {!subjectClass && (
                                    <Tooltip title={t('common:duplicate')}>
                                      <IconButton 
                                        aria-label="clone"
                                        onClick={() => push({...item})}
                                        color="primary"
                                        size="small"
                                        sx={{ ml: 1 }}
                                      >
                                        <ContentCopyIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                              
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <FormField
                                    name={`items[${index}].name`}
                                    label={t('subjectClass.name')}
                                    required
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <Autocomplete
                                    id={`items[${index}].subjectId`}
                                    options={subjects}
                                    getOptionLabel={(option) => 
                                      option.name ? `${option.name} (${option.subjectCode})` : ''
                                    }
                                    value={subjects.find(option => option.id === item.subjectId) || null}
                                    onChange={(_, newValue) => {
                                      setFieldValue(`items[${index}].subjectId`, newValue ? newValue.id : '');
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        label={t('subjectClass.subject')}
                                        error={touched.items?.[index]?.subjectId && Boolean(errors.items?.[index]?.subjectId)}
                                        helperText={touched.items?.[index]?.subjectId && errors.items?.[index]?.subjectId}
                                        required
                                      />
                                    )}
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <Autocomplete
                                    id={`items[${index}].classRoomId`}
                                    options={classRooms}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={classRooms.find(option => option.id === item.classRoomId) || null}
                                    onChange={(_, newValue) => {
                                      setFieldValue(`items[${index}].classRoomId`, newValue ? newValue.id : '');
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        label={t('subjectClass.classRoom')}
                                        error={touched.items?.[index]?.classRoomId && Boolean(errors.items?.[index]?.classRoomId)}
                                        helperText={touched.items?.[index]?.classRoomId && errors.items?.[index]?.classRoomId}
                                        required
                                      />
                                    )}
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    id={`items[${index}].startDate`}
                                    name={`items[${index}].startDate`}
                                    label={t('subjectClass.startDate')}
                                    type="date"
                                    value={item.startDate}
                                    onChange={(e) => {
                                      const newStartDate = e.target.value;
                                      setFieldValue(`items[${index}].startDate`, newStartDate);
                                      
                                      // Recalculate end date when start date changes
                                      if (item.numberOfWeeks) {
                                        const newEndDate = calculateEndDate(newStartDate, item.numberOfWeeks);
                                        setFieldValue(`items[${index}].endDate`, newEndDate);
                                      }
                                    }}
                                    error={touched.items?.[index]?.startDate && Boolean(errors.items?.[index]?.startDate)}
                                    helperText={touched.items?.[index]?.startDate && errors.items?.[index]?.startDate}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <CalendarTodayIcon color="action" />
                                        </InputAdornment>
                                      ),
                                    }}
                                    required
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={3}>
                                  <TextField
                                    fullWidth
                                    id={`items[${index}].numberOfWeeks`}
                                    name={`items[${index}].numberOfWeeks`}
                                    label={t('subjectClass.numberOfWeeks')}
                                    type="number"
                                    value={item.numberOfWeeks}
                                    onChange={(e) => {
                                      const weeks = parseInt(e.target.value);
                                      setFieldValue(`items[${index}].numberOfWeeks`, weeks);
                                      
                                      // Calculate end date based on start date and weeks
                                      if (item.startDate && weeks) {
                                        const newEndDate = calculateEndDate(item.startDate, weeks);
                                        setFieldValue(`items[${index}].endDate`, newEndDate);
                                      }
                                    }}
                                    error={touched.items?.[index]?.numberOfWeeks && Boolean(errors.items?.[index]?.numberOfWeeks)}
                                    helperText={touched.items?.[index]?.numberOfWeeks && errors.items?.[index]?.numberOfWeeks}
                                    required
                                    InputProps={{
                                      inputProps: { min: 1 }
                                    }}
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={3}>
                                  <TextField
                                    fullWidth
                                    id={`items[${index}].endDate`}
                                    name={`items[${index}].endDate`}
                                    label={t('subjectClass.endDate')}
                                    type="date"
                                    value={item.endDate}
                                    disabled // End date is read-only, calculated from start date + weeks
                                    error={touched.items?.[index]?.endDate && Boolean(errors.items?.[index]?.endDate)}
                                    helperText={touched.items?.[index]?.endDate && errors.items?.[index]?.endDate}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <CalendarTodayIcon color="action" />
                                        </InputAdornment>
                                      ),
                                    }}
                                    required
                                  />
                                </Grid>
                                
                                {/* Exam Time Note */}
                                {item.endDate && (
                                  <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                      <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                                      <Typography variant="caption">
                                        {t('subjectClass.examTimeNote', {
                                          date: calculateExamDate(item.endDate)
                                        })}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                                
                                <Grid item xs={12} md={4}>
                                  <TextField
                                    fullWidth
                                    id={`items[${index}].startLesson`}
                                    name={`items[${index}].startLesson`}
                                    label={t('subjectClass.startLesson')}
                                    value={item.startLesson}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      // Handle manual input - only allow numbers between 1-15
                                      if (value !== '') {
                                        value = Math.max(1, Math.min(15, parseInt(value) || 1));
                                      }
                                      setFieldValue(`items[${index}].startLesson`, value);
                                    }}
                                    error={touched.items?.[index]?.startLesson && Boolean(errors.items?.[index]?.startLesson)}
                                    helperText={touched.items?.[index]?.startLesson && errors.items?.[index]?.startLesson}
                                    required
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <TextField
                                            select
                                            value={item.startLesson}
                                            onChange={(e) => {
                                              setFieldValue(`items[${index}].startLesson`, parseInt(e.target.value));
                                            }}
                                            variant="standard"
                                            sx={{ width: 20, '& .MuiInput-input': { display: 'none' } }}
                                            SelectProps={{
                                              IconComponent: ArrowDropDownIcon,
                                              MenuProps: {
                                                PaperProps: { style: { maxHeight: 250 } }
                                              }
                                            }}
                                          >
                                            {lessonOptions.map((option) => (
                                              <MenuItem key={option} value={option}>
                                                {option}
                                              </MenuItem>
                                            ))}
                                          </TextField>
                                        </InputAdornment>
                                      ),
                                    }}
                                    type="number"
                                    inputProps={{ min: 1, max: 15, step: 1 }}
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                  <TextField
                                    fullWidth
                                    id={`items[${index}].endLesson`}
                                    name={`items[${index}].endLesson`}
                                    label={t('subjectClass.endLesson')}
                                    value={item.endLesson}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      // Handle manual input - only allow numbers between 1-15 and greater than startLesson
                                      if (value !== '') {
                                        const startLesson = item.startLesson || 1;
                                        value = Math.max(startLesson + 1, Math.min(15, parseInt(value) || startLesson + 1));
                                      }
                                      setFieldValue(`items[${index}].endLesson`, value);
                                    }}
                                    error={touched.items?.[index]?.endLesson && Boolean(errors.items?.[index]?.endLesson)}
                                    helperText={touched.items?.[index]?.endLesson && errors.items?.[index]?.endLesson}
                                    required
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <TextField
                                            select
                                            value={item.endLesson}
                                            onChange={(e) => {
                                              setFieldValue(`items[${index}].endLesson`, parseInt(e.target.value));
                                            }}
                                            variant="standard"
                                            sx={{ width: 20, '& .MuiInput-input': { display: 'none' } }}
                                            SelectProps={{
                                              IconComponent: ArrowDropDownIcon,
                                              MenuProps: {
                                                PaperProps: { style: { maxHeight: 250 } }
                                              }
                                            }}
                                          >
                                            {lessonOptions
                                              .filter(option => option > (item.startLesson || 0))
                                              .map((option) => (
                                                <MenuItem key={option} value={option}>
                                                  {option}
                                                </MenuItem>
                                              ))
                                            }
                                          </TextField>
                                        </InputAdornment>
                                      ),
                                    }}
                                    type="number"
                                    inputProps={{ 
                                      min: item.startLesson ? item.startLesson + 1 : 2, 
                                      max: 15,
                                      step: 1
                                    }}
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                  <FormField
                                    name={`items[${index}].studyType`}
                                    label={t('subjectClass.studyType')}
                                    select
                                    required
                                  >
                                    <MenuItem value="Theory">
                                      {t('subjectClass.studyTypes.theory')}
                                    </MenuItem>
                                    <MenuItem value="Practice">
                                      {t('subjectClass.studyTypes.practice')}
                                    </MenuItem>
                                  </FormField>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                  <FormField
                                    name={`items[${index}].dayOfWeek`}
                                    label={t('subjectClass.dayOfWeek')}
                                    select
                                    required
                                  >
                                    {dayOfWeekOptions.map((option) => (
                                      <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                      </MenuItem>
                                    ))}
                                  </FormField>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                  <FormField
                                    name={`items[${index}].term`}
                                    label={t('subjectClass.term')}
                                    select
                                    required
                                  >
                                    {termOptions.map((option) => (
                                      <MenuItem key={option} value={option}>
                                        {option}
                                      </MenuItem>
                                    ))}
                                  </FormField>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}

                          {/* Only show the add button when creating new subject classes */}
                          {!subjectClass && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => push(createDefaultItem())}
                              >
                                {t('subjectClass.addItem')}
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </FieldArray>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => onClose(false)}
                  disabled={isSubmitting}
                >
                  {t('common:cancel')}
                </Button>
                <Button 
                  type="submit"
                  variant="contained" 
                  disabled={isSubmitting || formLoading || !(isValid && dirty)}
                  color="primary"
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    t('common:save')
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <Snackbar
        open={error.show && error.severity === 'success'}
        autoHideDuration={6000}
        onClose={() => setError(prev => ({ ...prev, show: false }))}
      >
        <Alert 
          onClose={() => setError(prev => ({ ...prev, show: false }))} 
          severity="success"
        >
          {error.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SubjectClassForm; 