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
} from '@mui/material';
import { Formik, Form } from 'formik';
import FormField from '../../../components/common/FormField';
import { subjectClassService, subjectService, classRoomService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';

// Helper function to format date for form
const formatDateForForm = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const SubjectClassForm = ({ open, onClose, subjectClass }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classRooms, setClassRooms] = useState([]);
  const [error, setError] = useState({ show: false, message: '' });
  const [formLoading, setFormLoading] = useState(false);

  const initialValues = {
    name: subjectClass?.name || '',
    subjectId: subjectClass?.subject?.id || '',
    classRoomId: subjectClass?.classRoom?.id || '',
    startDate: formatDateForForm(subjectClass?.startDate) || formatDateForForm(new Date()),
    endDate: formatDateForForm(subjectClass?.endDate) || formatDateForForm(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days later
    startLesson: subjectClass?.startLesson || 1,
    endLesson: subjectClass?.endLesson || 2,
    studyType: subjectClass?.studyType || 'Theory',
  };

  const validationSchema = Yup.object({
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
  });

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
    }
  }, [open, fetchFormOptions]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (subjectClass) {
        await subjectClassService.update(subjectClass.id, values);
        setError({
          show: true,
          message: t('subjectClass.updateSuccess'),
          severity: 'success'
        });
      } else {
        await subjectClassService.create(values);
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
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Create an array of numbers from 1 to 15 for lessons
  const lessonOptions = Array.from({ length: 15 }, (_, i) => i + 1);

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
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormField
                        name="name"
                        label={t('subjectClass.name')}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        id="subjectId"
                        options={subjects}
                        getOptionLabel={(option) => 
                          option.name ? `${option.name} (${option.subjectCode})` : ''
                        }
                        value={subjects.find(option => option.id === values.subjectId) || null}
                        onChange={(_, newValue) => {
                          setFieldValue('subjectId', newValue ? newValue.id : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('subjectClass.subject')}
                            error={touched.subjectId && Boolean(errors.subjectId)}
                            helperText={touched.subjectId && errors.subjectId}
                            required
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        id="classRoomId"
                        options={classRooms}
                        getOptionLabel={(option) => option.name || ''}
                        value={classRooms.find(option => option.id === values.classRoomId) || null}
                        onChange={(_, newValue) => {
                          setFieldValue('classRoomId', newValue ? newValue.id : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('subjectClass.classRoom')}
                            error={touched.classRoomId && Boolean(errors.classRoomId)}
                            helperText={touched.classRoomId && errors.classRoomId}
                            required
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormField
                        name="startDate"
                        label={t('subjectClass.startDate')}
                        type="date"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormField
                        name="endDate"
                        label={t('subjectClass.endDate')}
                        type="date"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormField
                        name="startLesson"
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
                        name="endLesson"
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
                        name="studyType"
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
                  </Grid>
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