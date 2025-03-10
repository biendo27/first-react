import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { majorService } from '../../../services/api';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
});

const MajorForm = ({ open, onClose, major }) => {
  const [loading, setLoading] = useState(false);

  const initialValues = {
    name: major?.name || '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (major) {
        await majorService.update(major.id, values);
      } else {
        await majorService.create(values);
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
      title={major ? 'Edit Major' : 'Add Major'}
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
    </FormDialog>
  );
};

export default MajorForm; 