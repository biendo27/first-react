import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { administrativeClassService, majorService, courseBatchService } from '../../../services/api';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  courseBatchId: Yup.string().required('Course batch is required'),
  majorId: Yup.string().required('Major is required'),
});

const AdministrativeClassForm = ({ open, onClose, administrativeClass }) => {
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState([]);
  const [courseBatches, setCourseBatches] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const initialValues = {
    name: administrativeClass?.name || '',
    courseBatchId: administrativeClass?.courseBatch?.id || '',
    majorId: administrativeClass?.major?.id || '',
  };

  const fetchDependencies = async () => {
    setFetchLoading(true);
    try {
      const [majorsResponse, courseBatchesResponse] = await Promise.all([
        majorService.getAll({ PageSize: 100 }),
        courseBatchService.getAll({ PageSize: 100 }),
      ]);

      setMajors(majorsResponse.data || []);
      setCourseBatches(courseBatchesResponse.data || []);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (administrativeClass) {
        await administrativeClassService.update(administrativeClass.id, values);
      } else {
        await administrativeClassService.create(values);
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

  const majorOptions = majors.map(major => ({
    value: major.id,
    label: major.name,
  }));

  const courseBatchOptions = courseBatches.map(batch => ({
    value: batch.id,
    label: batch.name,
  }));

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={administrativeClass ? 'Edit Administrative Class' : 'Add Administrative Class'}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading || fetchLoading}
    >
      <FormField
        name="name"
        label="Name"
        required
      />
      <FormField
        name="courseBatchId"
        label="Course Batch"
        type="select"
        options={courseBatchOptions}
        required
        disabled={fetchLoading}
      />
      <FormField
        name="majorId"
        label="Major"
        type="select"
        options={majorOptions}
        required
        disabled={fetchLoading}
      />
    </FormDialog>
  );
};

export default AdministrativeClassForm; 