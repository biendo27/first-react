import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { courseBatchService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const CourseBatchForm = ({ open, onClose, courseBatch }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(['admin', 'common']);

  // Format date for form display (YYYY-MM-DD for HTML date input)
  const formatDateForForm = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  };

  const validationSchema = Yup.object({
    name: Yup.string().required(t('common:fieldRequired', { field: t('common:name') })),
    startTime: Yup.date().required(t('common:fieldRequired', { field: t('startDate', 'Start date') })),
    regularProgramDuration: Yup.number()
      .required(t('common:fieldRequired', { field: t('regularDuration', 'Regular program duration') }))
      .positive(t('durationPositive', 'Duration must be positive'))
      .min(0.25, t('durationMinimum', 'Duration must be at least 0.25 years')),
    maximumProgramDuration: Yup.number()
      .required(t('common:fieldRequired', { field: t('maximumDuration', 'Maximum program duration') }))
      .positive(t('durationPositive', 'Duration must be positive'))
      .min(Yup.ref('regularProgramDuration'), t('maxDurationGreaterThanRegular', 'Maximum duration must be greater than or equal to regular duration')),
  });

  const initialValues = {
    name: courseBatch?.name || '',
    startTime: formatDateForForm(courseBatch?.startTime) || '',
    regularProgramDuration: courseBatch?.regularProgramDuration || (courseBatch ? '' : 4),
    maximumProgramDuration: courseBatch?.maximumProgramDuration || (courseBatch ? '' : 6),
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        // The API interceptor will handle ISO 8601 conversion
        startTime: values.startTime,
        regularProgramDuration: parseFloat(values.regularProgramDuration),
        maximumProgramDuration: parseFloat(values.maximumProgramDuration),
      };

      if (courseBatch) {
        await courseBatchService.update(courseBatch.id, formattedValues);
      } else {
        await courseBatchService.create(formattedValues);
      }
      resetForm();
      onClose(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={courseBatch ? t('editCourseBatch', 'Edit Course Batch') : t('addCourseBatch', 'Add Course Batch')}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <FormField
        name="name"
        label={t('common:name')}
        required
      />
      <FormField
        name="startTime"
        label={t('startDate', 'Start Date')}
        type="date"
        required
        InputLabelProps={{
          shrink: true,
        }}
      />
      <FormField
        name="regularProgramDuration"
        label={t('regularDuration', 'Regular Program Duration (years)')}
        type="number"
        required
        inputProps={{
          step: 0.25,  // Allow quarterly years (3 months)
          min: 0.25,
        }}
        helperText={t('durationYearHelper', 'Duration in years (e.g., 1.5 for one and a half years)')}
      />
      <FormField
        name="maximumProgramDuration"
        label={t('maximumDuration', 'Maximum Program Duration (years)')}
        type="number"
        required
        inputProps={{
          step: 0.25,  // Allow quarterly years
          min: 0.25,
        }}
        helperText={t('durationYearHelper', 'Duration in years (e.g., 2.5 for two and a half years)')}
      />
    </FormDialog>
  );
};

export default CourseBatchForm; 