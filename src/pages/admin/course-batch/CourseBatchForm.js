import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { courseBatchService } from '../../../services/api';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  startTime: Yup.date().required('Start date is required'),
  regularProgramDuration: Yup.number()
    .required('Regular program duration is required')
    .positive('Duration must be positive')
    .integer('Duration must be an integer'),
  maximumProgramDuration: Yup.number()
    .required('Maximum program duration is required')
    .positive('Duration must be positive')
    .integer('Duration must be an integer')
    .min(
      Yup.ref('regularProgramDuration'),
      'Maximum duration must be greater than or equal to regular duration'
    ),
});

const CourseBatchForm = ({ open, onClose, courseBatch }) => {
  const [loading, setLoading] = useState(false);

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
      title={courseBatch ? 'Edit Course Batch' : 'Add Course Batch'}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <FormField
        name="name"
        label="Name"
        required
      />
      <FormField
        name="startTime"
        label="Start Date"
        type="date"
        required
        InputLabelProps={{
          shrink: true,
        }}
      />
      <FormField
        name="regularProgramDuration"
        label="Regular Program Duration (months)"
        type="number"
        required
      />
      <FormField
        name="maximumProgramDuration"
        label="Maximum Program Duration (months)"
        type="number"
        required
      />
    </FormDialog>
  );
};

export default CourseBatchForm; 