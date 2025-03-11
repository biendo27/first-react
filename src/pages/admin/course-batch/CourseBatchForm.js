import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { courseBatchService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const CourseBatchForm = ({ open, onClose, courseBatch }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(['admin', 'common']);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('common:fieldRequired', { field: t('common:name') })),
    startTime: Yup.date().required(t('common:fieldRequired', { field: t('startDate', 'Start date') })),
    regularProgramDuration: Yup.number()
      .required(t('common:fieldRequired', { field: t('regularDuration', 'Regular program duration') }))
      .positive(t('durationPositive', 'Duration must be positive'))
      .integer(t('durationInteger', 'Duration must be an integer')),
    maximumProgramDuration: Yup.number()
      .required(t('common:fieldRequired', { field: t('maximumDuration', 'Maximum program duration') }))
      .positive(t('durationPositive', 'Duration must be positive'))
      .integer(t('durationInteger', 'Duration must be an integer'))
      .min(
        Yup.ref('regularProgramDuration'),
        t('maxDurationGreaterThanRegular', 'Maximum duration must be greater than or equal to regular duration')
      ),
  });

  const initialValues = {
    name: courseBatch?.name || '',
    startTime: courseBatch?.startTime 
      ? new Date(courseBatch.startTime).toISOString().split('T')[0]
      : '',
    regularProgramDuration: courseBatch?.regularProgramDuration || '',
    maximumProgramDuration: courseBatch?.maximumProgramDuration || '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        regularProgramDuration: Number(values.regularProgramDuration),
        maximumProgramDuration: Number(values.maximumProgramDuration),
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
        label={t('regularDuration', 'Regular Program Duration (months)')}
        type="number"
        required
      />
      <FormField
        name="maximumProgramDuration"
        label={t('maximumDuration', 'Maximum Program Duration (months)')}
        type="number"
        required
      />
    </FormDialog>
  );
};

export default CourseBatchForm; 