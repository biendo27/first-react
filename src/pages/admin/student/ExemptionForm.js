import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { subjectExemptionService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const ExemptionForm = ({ open, onClose, student, subject, exemption }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditing = !!exemption;

  const validationSchema = Yup.object({
    zScore: Yup.number()
      .required(t('common:fieldRequired', { field: t('exemption.zScore') }))
      .min(0, t('common:numberRange', { min: 0, max: 10 }))
      .max(10, t('common:numberRange', { min: 0, max: 10 })),
    note: Yup.string().max(500, t('common:maxLength', { field: t('exemption.note'), length: 500 })),
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Set XScore and YScore equal to ZScore
      const finalScore = values.zScore;
      
      if (isEditing) {
        // Update existing exemption
        await subjectExemptionService.update(exemption.id, {
          id: exemption.id,
          xScore: finalScore,
          yScore: finalScore,
          zScore: finalScore,
          resultType: values.resultType,
          note: values.note,
        });
      } else {
        // Create new exemption
        await subjectExemptionService.create({
          studentCode: student.studentCode,
          subjectId: subject.id,
          xScore: finalScore,
          yScore: finalScore,
          zScore: finalScore,
          resultType: values.resultType,
          note: values.note,
        });
      }
      onClose(true); // Refresh data after successful submission
    } catch (err) {
      console.error('Error saving exemption:', err);
      
      // Extract only the detail field from the error response
      let errorMessage = t('common:saveError', { resource: t('exemption.title') });
      
      if (err.response && err.response.data && err.response.data.detail) {
        // Just display the detail field directly
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      zScore: exemption ? exemption.zScore : '',
      resultType: exemption ? exemption.resultType : 'PASSED',
      note: exemption ? exemption.note || '' : '',
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? t('exemption.editExemption') : t('exemption.addExemption')}
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              {t('student.fullName')}: {student?.firstName} {student?.lastName} ({student?.studentCode})
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              {t('subjects')}: {isEditing ? exemption?.subject?.name : subject?.name} (
              {isEditing ? exemption?.subject?.subjectCode : subject?.subjectCode})
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="zScore"
                name="zScore"
                label={t('exemption.finalScore', { defaultValue: 'Final Score' })}
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 10 }}
                value={formik.values.zScore}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.zScore && Boolean(formik.errors.zScore)}
                helperText={formik.touched.zScore && formik.errors.zScore}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="note"
                name="note"
                label={t('exemption.note')}
                multiline
                rows={4}
                value={formik.values.note}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.note && Boolean(formik.errors.note)}
                helperText={formik.touched.note && formik.errors.note}
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

ExemptionForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.object.isRequired,
  subject: PropTypes.object,
  exemption: PropTypes.object,
};

export default ExemptionForm; 