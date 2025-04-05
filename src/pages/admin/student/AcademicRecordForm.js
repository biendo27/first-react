import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Autocomplete
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { academicRecordService, subjectExemptionService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const AcademicRecordForm = ({ open, onClose, student, academicRecord }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const isEditing = !!academicRecord;

  // Format date for form input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Get today's date formatted for input
  const getTodayFormatted = () => {
    return formatDateForInput(new Date());
  };

  const validationSchema = Yup.object({
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
    note: Yup.string().max(500, t('common:maxLength', { field: t('academicRecord.note'), length: 500 })),
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!open || !student) return;
      
      setLoadingSubjects(true);
      try {
        const response = await subjectExemptionService.getStudentSubjects({
          StudentCode: student.studentCode,
          PageSize: 10000
        });
        setSubjects(response.data || []);
      } catch (err) {
        const formattedError = handleApiError(err, t('academicRecord.failedToLoadSubjects'));
        setError(formattedError.message);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [open, student, t]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Prepare the data
      const recordData = {
        ...values,
        // Set xScore and yScore equal to zScore
        xScore: Number(values.zScore),
        yScore: Number(values.zScore),
        zScore: Number(values.zScore),
        academicYear: Number(values.academicYear),
        semester: Number(values.semester),
        studentId: student.id,
        completionDate: values.completionDate || null
      };

      if (isEditing) {
        // Update existing record
        await academicRecordService.update(academicRecord.id, {
          ...recordData,
          id: academicRecord.id
        });
      } else {
        // Create new record
        await academicRecordService.create(recordData);
      }
      
      onClose(true); // Refresh data after successful submission
    } catch (err) {
      const formattedError = handleApiError(
        err, 
        isEditing 
          ? t('academicRecord.updateError') 
          : t('academicRecord.createError')
      );
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      subjectId: academicRecord?.subject?.id || '',
      zScore: academicRecord?.zScore || '',
      academicYear: academicRecord?.academicYear || new Date().getFullYear(),
      semester: academicRecord?.semester || 1,
      resultType: academicRecord?.resultType || 'Passed',
      completionDate: academicRecord ? formatDateForInput(academicRecord.completionDate) : getTodayFormatted(),
      note: academicRecord?.note || '',
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing 
          ? t('academicRecord.editAcademicRecord') 
          : t('academicRecord.addAcademicRecord')}
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              {t('student.fullName')}: {student?.firstName} {student?.lastName} ({student?.studentCode})
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="subjectId"
                options={subjects.map(subject => ({
                  value: subject.id,
                  label: `${subject.name} (${subject.subjectCode})`
                }))}
                getOptionLabel={(option) => option.label || ''}
                value={subjects.some(s => s.id === formik.values.subjectId) 
                  ? { 
                      value: formik.values.subjectId, 
                      label: subjects.find(s => s.id === formik.values.subjectId)
                        ? `${subjects.find(s => s.id === formik.values.subjectId).name} (${subjects.find(s => s.id === formik.values.subjectId).subjectCode})`
                        : ''
                    } 
                  : null
                }
                onChange={(_, newValue) => formik.setFieldValue('subjectId', newValue ? newValue.value : '')}
                onBlur={() => formik.setFieldTouched('subjectId', true)}
                disabled={loadingSubjects || loading}
                loading={loadingSubjects}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t('academicRecord.subject')}*`}
                    error={formik.touched.subjectId && Boolean(formik.errors.subjectId)}
                    helperText={formik.touched.subjectId && formik.errors.subjectId}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingSubjects ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="zScore"
                name="zScore"
                label={t('academicRecord.zScore')}
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 10 }}
                value={formik.values.zScore}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.zScore && Boolean(formik.errors.zScore)}
                helperText={formik.touched.zScore && formik.errors.zScore}
                disabled={loading}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="academicYear"
                name="academicYear"
                label={t('academicRecord.academicYear')}
                type="number"
                inputProps={{ min: 2000 }}
                value={formik.values.academicYear}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.academicYear && Boolean(formik.errors.academicYear)}
                helperText={formik.touched.academicYear && formik.errors.academicYear}
                disabled={loading}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="semester"
                options={[1, 2, 3, 4, 5, 6, 7, 8].map(semester => ({
                  value: semester,
                  label: t('academicRecord.semesterNumber', { number: semester })
                }))}
                getOptionLabel={(option) => option.label || ''}
                value={{
                  value: formik.values.semester,
                  label: t('academicRecord.semesterNumber', { number: formik.values.semester })
                }}
                onChange={(_, newValue) => formik.setFieldValue('semester', newValue ? newValue.value : '')}
                onBlur={() => formik.setFieldTouched('semester', true)}
                disabled={loading}
                disableClearable
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t('academicRecord.semester')}*`}
                    error={formik.touched.semester && Boolean(formik.errors.semester)}
                    helperText={formik.touched.semester && formik.errors.semester}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="resultType"
                options={[
                  { value: 'Passed', label: t('academicRecord.resultTypes.passed') },
                  { value: 'Disqualification', label: t('academicRecord.resultTypes.disqualification') }
                ]}
                getOptionLabel={(option) => option.label || ''}
                value={{
                  value: formik.values.resultType,
                  label: t(`academicRecord.resultTypes.${formik.values.resultType.toLowerCase()}`)
                }}
                onChange={(_, newValue) => formik.setFieldValue('resultType', newValue ? newValue.value : '')}
                onBlur={() => formik.setFieldTouched('resultType', true)}
                disabled={loading}
                disableClearable
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t('academicRecord.resultType')}*`}
                    error={formik.touched.resultType && Boolean(formik.errors.resultType)}
                    helperText={formik.touched.resultType && formik.errors.resultType}
                  />
                )}
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="completionDate"
                  name="completionDate"
                  label={t('academicRecord.completionDate')}
                  type="date"
                  value={formik.values.completionDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.completionDate && Boolean(formik.errors.completionDate)}
                  helperText={formik.touched.completionDate && formik.errors.completionDate}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="note"
                name="note"
                label={t('academicRecord.note')}
                multiline
                rows={4}
                value={formik.values.note}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.note && Boolean(formik.errors.note)}
                helperText={formik.touched.note && formik.errors.note}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)} disabled={loading}>
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? t('common:saving') : t('common:save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

AcademicRecordForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.object.isRequired,
  academicRecord: PropTypes.object,
};

export default AcademicRecordForm; 