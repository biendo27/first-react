import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { courseBatchService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const CourseBatchForm = ({ open, onClose, courseBatch }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(['admin', 'common']);

  // Convert months to years for display
  const monthsToYears = (months) => {
    return months ? months / 12 : '';
  };

  // Convert years to months for storage
  const yearsToMonths = (years) => {
    return years ? years * 12 : 0;
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
    startTime: courseBatch?.startTime 
      ? new Date(courseBatch.startTime).toISOString().split('T')[0]
      : '',
    regularProgramDuration: monthsToYears(courseBatch?.regularProgramDuration) || (courseBatch ? '' : 4),
    maximumProgramDuration: monthsToYears(courseBatch?.maximumProgramDuration) || (courseBatch ? '' : 6),
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        regularProgramDuration: yearsToMonths(parseFloat(values.regularProgramDuration)),
        maximumProgramDuration: yearsToMonths(parseFloat(values.maximumProgramDuration)),
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