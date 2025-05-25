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
  Tooltip
} from '@mui/material';
import { Formik, Form, FieldArray } from 'formik';
import FormField from '../../../components/common/FormField';
import { subjectClassService, subjectService, classRoomService, administrativeClassService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';

// Helper function to format date for form
const formatDateForForm = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Create a default subject class item
const createDefaultItem = () => ({
  name: '',
  subjectId: '',
  classRoomId: '',
  startDate: formatDateForForm(new Date()),
  endDate: formatDateForForm(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days later
  startLesson: 1,
  endLesson: 2,
  studyType: 'Theory',
  dayOfWeek: 2, // Monday (as per API: 2-7 for Monday-Saturday)
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

  // Initialize with a single item when creating, or the existing item when editing
  const initialValues = subjectClass 
    ? {
        items: [{
          name: subjectClass.name || '',
          subjectId: subjectClass.subject?.id || '',
          classRoomId: subjectClass.classRoom?.id || '',
          startDate: formatDateForForm(subjectClass.startDate) || formatDateForForm(new Date()),
          endDate: formatDateForForm(subjectClass.endDate) || formatDateForForm(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
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
      .min(2, t('subjectClass.dayOfWeekRange', { min: 2, max: 7 }))
      .max(7, t('subjectClass.dayOfWeekRange', { min: 2, max: 7 }))
      .integer(),
    term: Yup.number()
      .required(t('common:fieldRequired', { field: t('subjectClass.term') }))
      .min(1, t('subjectClass.termRange', { min: 1, max: 4 }))
      .max(4, t('subjectClass.termRange', { min: 1, max: 4 }))
      .integer(),
    administrativeClassIds: Yup.array()
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
      if (subjectClass) {
        // If editing an existing subject class, update it
        await subjectClassService.update(subjectClass.id, values.items[0]);
        setError({
          show: true,
          message: t('subjectClass.updateSuccess'),
          severity: 'success'
        });
      } else {
        // If creating new subject classes, send all items
        await subjectClassService.create({ items: values.items });
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
  const handleAdministrativeClassChange = (index, newValues, setFieldValue) => {
    const selectedIds = newValues.map(item => item.value).filter(id => id !== '');
    setFieldValue(`items[${index}].administrativeClassIds`, selectedIds);
  };

  // Create an array of numbers from 1 to 15 for lessons
  const lessonOptions = Array.from({ length: 15 }, (_, i) => i + 1);
  
  // Create term options
  const termOptions = Array.from({ length: 4 }, (_, i) => i + 1);
  
  // Create day of week options (2-7 correspond to Monday-Saturday)
  const dayOfWeekOptions = [
    { value: 2, label: t('common:days.monday') },
    { value: 3, label: t('common:days.tuesday') },
    { value: 4, label: t('common:days.wednesday') },
    { value: 5, label: t('common:days.thursday') },
    { value: 6, label: t('common:days.friday') },
    { value: 7, label: t('common:days.saturday') },
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
                                <FormField
                                  name={`items[${index}].startDate`}
                                  label={t('subjectClass.startDate')}
                                  type="date"
                                  required
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <FormField
                                  name={`items[${index}].endDate`}
                                  label={t('subjectClass.endDate')}
                                  type="date"
                                  required
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <FormField
                                  name={`items[${index}].startLesson`}
                                  label={t('subjectClass.startLesson')}
                                  select
                                  required
                                >
                                  {lessonOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  ))}
                                </FormField>
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <FormField
                                  name={`items[${index}].endLesson`}
                                  label={t('subjectClass.endLesson')}
                                  select
                                  required
                                >
                                  {lessonOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  ))}
                                </FormField>
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

                              {/* Only show administrative class selection when creating new subject classes */}
                              {!subjectClass && (
                                <Grid item xs={12}>
                                  <Autocomplete
                                    id={`items[${index}].administrativeClassIds`}
                                    multiple
                                    options={[
                                      ...administrativeClasses.map(adminClass => ({ 
                                        value: adminClass.id, 
                                        label: adminClass.name 
                                      }))
                                    ]}
                                    getOptionLabel={(option) => option.label || ''}
                                    value={
                                      item.administrativeClassIds && item.administrativeClassIds.length > 0
                                        ? item.administrativeClassIds.map(id => {
                                            const adminClass = administrativeClasses.find(c => c.id === id);
                                            return adminClass 
                                              ? { value: id, label: adminClass.name }
                                              : { value: id, label: id }; // Fallback if class not found
                                          })
                                        : []
                                    }
                                    onChange={(_, newValues) => {
                                      handleAdministrativeClassChange(index, newValues, setFieldValue);
                                    }}
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
                                </Grid>
                              )}
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