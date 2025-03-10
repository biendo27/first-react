import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { subjectService } from '../../../services/api';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  subjectCode: Yup.number()
    .required('Subject code is required')
    .positive('Subject code must be positive')
    .integer('Subject code must be an integer'),
  credit: Yup.number()
    .required('Credit is required')
    .positive('Credit must be positive')
    .integer('Credit must be an integer'),
  type: Yup.string().required('Type is required'),
});

const subjectTypes = [
  { value: 'Compulsory', label: 'Compulsory' },
  { value: 'Elective', label: 'Elective' },
];

const SubjectForm = ({ open, onClose, subject }) => {
  const [loading, setLoading] = useState(false);

  const initialValues = {
    name: subject?.name || '',
    subjectCode: subject?.subjectCode || '',
    credit: subject?.credit || '',
    type: subject?.type || '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (subject) {
        await subjectService.update(subject.id, values);
      } else {
        await subjectService.create(values);
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
      title={subject ? 'Edit Subject' : 'Add Subject'}
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
        name="subjectCode"
        label="Subject Code"
        type="number"
        required
      />
      <FormField
        name="credit"
        label="Credit"
        type="number"
        required
      />
      <FormField
        name="type"
        label="Type"
        type="select"
        options={subjectTypes}
        required
      />
    </FormDialog>
  );
};

export default SubjectForm; 