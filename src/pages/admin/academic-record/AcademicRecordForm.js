import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Snackbar, Alert, TextField, MenuItem, DialogTitle, DialogContent, DialogActions, Button, Dialog, Box, CircularProgress } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import FormField from '../../../components/common/FormField';
import { academicRecordService, studentService, subjectService, subjectExemptionService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const AcademicRecordForm = ({ open, onClose, academicRecord }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState({ show: false, message: '' });
  const [formValues, setFormValues] = useState({
    studentId: academicRecord?.student?.id || '',
    subjectId: academicRecord?.subject?.id || '',
    zScore: academicRecord?.zScore || '',
    academicYear: academicRecord?.academicYear || new Date().getFullYear(),
    semester: academicRecord?.semester || 1,
    resultType: academicRecord?.resultType || 'PASSED',
    completionDate: formatDateForForm(academicRecord?.completionDate) || formatDateForForm(new Date()),
    note: academicRecord?.note || '',
  });

  const validationSchema = Yup.object({
    studentId: Yup.string().required(t('common:fieldRequired', { field: t('academicRecord.student') })),
    subjectId: Yup.string().required(t('common:fieldRequired', { field: t('academicRecord.subject') })),
    zScore: Yup.number()
      .required(t('academicRecord.scoreValidation.required', { field: t('academicRecord.zScore') }))
      .min(0, t('academicRecord.scoreValidation.min', { field: t('academicRecord.zScore'), min: 0 }))
      .max(10, t('academicRecord.scoreValidation.max', { field: t('academicRecord.zScore'), max: 10 })),
    academicYear: Yup.number()
      .required(t('academicRecord.yearValidation.required'))
      .min(2000, t('academicRecord.yearValidation.min', { min: 2000 }))
      .integer(t('academicRecord.yearValidation.integer')),
    semester: Yup.number()
      .required(t('common:fieldRequired', { field: t('academicRecord.semester') }))
      .min(1, t('common:numberRange', { min: 1, max: 8 }))
      .max(8, t('common:numberRange', { min: 1, max: 8 }))
      .integer(),
    resultType: Yup.string()
      .required(t('common:fieldRequired', { field: t('academicRecord.resultType') })),
    completionDate: Yup.date(),
    note: Yup.string(),
  });

  // Format date for form display (YYYY-MM-DD for HTML date input)
  function formatDateForForm(dateValue) {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  }

  const fetchDependencies = async () => {
    setFetchLoading(true);
    try {
      // Only fetch students initially
      const studentsResponse = await studentService.getAll({ PageSize: 100 });
      setStudents(studentsResponse.data || []);

      // If there's an initial student, load subjects too
      if (formValues.studentId) {
        await fetchSubjectsForStudent(formValues.studentId);
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      setError({
        show: true,
        message: t('academicRecord.failedToLoadStudents')
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchSubjectsForStudent = async (studentId) => {
    if (!studentId) return;
    
    setFetchLoading(true);
    try {
      // Find the student code from the selected student
      const selectedStudent = students.find(s => s.id === studentId);
      
      if (selectedStudent) {
        // We found the student in our local state
        const response = await subjectExemptionService.getStudentSubjects({
          StudentCode: selectedStudent.studentCode,
          PageSize: 100
        });
        setSubjects(response.data || []);
      } else {
        // If student not found in the array (rare edge case), fetch it individually
        try {
          const studentResponse = await studentService.getById(studentId);
          if (studentResponse) {
            const response = await subjectExemptionService.getStudentSubjects({
              StudentCode: studentResponse.studentCode,
              PageSize: 100
            });
            setSubjects(response.data || []);
          } else {
            // Fallback to all subjects if we can't determine the student
            const response = await subjectService.getAll({ PageSize: 100 });
            setSubjects(response.data || []);
          }
        } catch (err) {
          console.error('Error fetching student details:', err);
          // Fallback to all subjects
          const response = await subjectService.getAll({ PageSize: 100 });
          setSubjects(response.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching subjects for student:', error);
      setError({
        show: true,
        message: t('academicRecord.failedToLoadSubjects')
      });
      // Fallback to empty subjects list
      setSubjects([]);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleStudentChange = async (event, setFieldValue) => {
    const studentId = event.target.value;
    
    // Update form values
    setFieldValue('studentId', studentId);
    setFieldValue('subjectId', ''); // Reset subject when student changes
    
    // Update our local state
    setFormValues(prev => ({
      ...prev,
      studentId,
      subjectId: ''
    }));
    
    // Fetch subjects for this student
    await fetchSubjectsForStudent(studentId);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        // Set xScore and yScore to be the same as zScore
        xScore: Number(values.zScore),
        yScore: Number(values.zScore),
        zScore: Number(values.zScore),
        academicYear: Number(values.academicYear),
        semester: Number(values.semester),
        // The API interceptor will handle ISO 8601 conversion
        completionDate: values.completionDate || null,
      };

      if (academicRecord) {
        await academicRecordService.update(academicRecord.id, formattedValues);
      } else {
        await academicRecordService.create(formattedValues);
      }
      resetForm();
      onClose(true);
    } catch (error) {
      const formattedError = handleApiError(error, t('academicRecord.createError'));
      setError({
        show: true,
        message: formattedError.message
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.firstName} ${student.lastName} (${student.studentCode})`,
  }));

  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: `${subject.name} (${subject.subjectCode})`,
  }));

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8].map(semester => ({
    value: semester,
    label: t('academicRecord.semesterNumber', { number: semester }),
  }));

  const resultTypeOptions = [
    { value: 'PASSED', label: t('academicRecord.resultTypes.passed') },
    { value: 'DISQUALIFICATION', label: t('academicRecord.resultTypes.disqualification') },
    { value: 'EXEMPTED', label: t('academicRecord.resultTypes.exempted') },
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onClose(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {academicRecord ? t('academicRecord.editAcademicRecord') : t('academicRecord.addAcademicRecord')}
        </DialogTitle>
        
        <Formik
          initialValues={formValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, values, setFieldValue, isSubmitting, isValid, dirty }) => (
            <Form>
              <DialogContent dividers>
                {error.show && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="error">{error.message}</Alert>
                  </Box>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    select
                    id="studentId"
                    name="studentId"
                    label={t('academicRecord.student')}
                    value={values.studentId}
                    onChange={(e) => handleStudentChange(e, setFieldValue)}
                    error={touched.studentId && Boolean(errors.studentId)}
                    helperText={touched.studentId && errors.studentId}
                    disabled={fetchLoading || !!academicRecord}
                    margin="normal"
                    size="small"
                    required
                  >
                    {studentOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <TextField
                    fullWidth
                    select
                    id="subjectId"
                    name="subjectId"
                    label={t('academicRecord.subject')}
                    value={values.subjectId}
                    onChange={(e) => setFieldValue('subjectId', e.target.value)}
                    error={touched.subjectId && Boolean(errors.subjectId)}
                    helperText={touched.subjectId && errors.subjectId}
                    disabled={fetchLoading || !values.studentId}
                    margin="normal"
                    size="small"
                    required
                  >
                    {subjectOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <FormField
                    name="zScore"
                    label={t('academicRecord.zScore')}
                    type="number"
                    required
                    inputProps={{ step: "0.1", min: "0", max: "10" }}
                  />
                  
                  <FormField
                    name="academicYear"
                    label={t('academicRecord.academicYear')}
                    type="number"
                    required
                    inputProps={{ min: "2000" }}
                  />
                  
                  <TextField
                    fullWidth
                    select
                    id="semester"
                    name="semester"
                    label={t('academicRecord.semester')}
                    value={values.semester}
                    onChange={(e) => setFieldValue('semester', e.target.value)}
                    error={touched.semester && Boolean(errors.semester)}
                    helperText={touched.semester && errors.semester}
                    margin="normal"
                    size="small"
                    required
                  >
                    {semesterOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <TextField
                    fullWidth
                    select
                    id="resultType"
                    name="resultType"
                    label={t('academicRecord.resultType')}
                    value={values.resultType}
                    onChange={(e) => setFieldValue('resultType', e.target.value)}
                    error={touched.resultType && Boolean(errors.resultType)}
                    helperText={touched.resultType && errors.resultType}
                    margin="normal"
                    size="small"
                    required
                  >
                    {resultTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  {academicRecord && (
                    <FormField
                      name="completionDate"
                      label={t('academicRecord.completionDate')}
                      type="date"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  )}
                  
                  <FormField
                    name="note"
                    label={t('academicRecord.note')}
                    multiline
                    rows={3}
                  />
                </Box>
              </DialogContent>
              
              <DialogActions>
                <Button
                  onClick={() => onClose(false)}
                  color="inherit"
                  disabled={loading || isSubmitting}
                >
                  {t('common:cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || isSubmitting || !isValid || (!dirty && !academicRecord)}
                  startIcon={loading || isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {t('common:save')}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <Snackbar
        open={error.show}
        autoHideDuration={6000}
        onClose={() => setError({ ...error, show: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError({ ...error, show: false })}
          severity="error"
          variant="filled"
        >
          {error.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AcademicRecordForm; 