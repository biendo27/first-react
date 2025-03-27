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
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { academicRecordService, subjectService, subjectExemptionService, handleApiError } from '../../../services/api';
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
          PageSize: 100
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
              <TextField
                fullWidth
                select
                id="subjectId"
                name="subjectId"
                label={t('academicRecord.subject')}
                value={formik.values.subjectId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.subjectId && Boolean(formik.errors.subjectId)}
                helperText={formik.touched.subjectId && formik.errors.subjectId}
                disabled={loadingSubjects || loading}
                required
              >
                {loadingSubjects ? (
                  <MenuItem value="">
                    <CircularProgress size={20} /> {t('common:loading')}
                  </MenuItem>
                ) : (
                  subjects.map(subject => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.subjectCode})
                    </MenuItem>
                  ))
                )}
              </TextField>
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
              <TextField
                fullWidth
                select
                id="semester"
                name="semester"
                label={t('academicRecord.semester')}
                value={formik.values.semester}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.semester && Boolean(formik.errors.semester)}
                helperText={formik.touched.semester && formik.errors.semester}
                disabled={loading}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                  <MenuItem key={semester} value={semester}>
                    {t('academicRecord.semesterNumber', { number: semester })}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                id="resultType"
                name="resultType"
                label={t('academicRecord.resultType')}
                value={formik.values.resultType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.resultType && Boolean(formik.errors.resultType)}
                helperText={formik.touched.resultType && formik.errors.resultType}
                disabled={loading}
                required
              >
                <MenuItem value="Passed">{t('academicRecord.resultTypes.passed')}</MenuItem>
                <MenuItem value="Disqualification">{t('academicRecord.resultTypes.disqualification')}</MenuItem>
                <MenuItem value="Exempted">{t('academicRecord.resultTypes.exempted')}</MenuItem>
              </TextField>
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