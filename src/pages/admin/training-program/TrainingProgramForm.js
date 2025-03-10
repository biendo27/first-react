import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { trainingProgramService, majorService, subjectService, courseBatchService } from '../../../services/api';

const validationSchema = Yup.object({
  semester: Yup.number()
    .required('Semester is required')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester cannot exceed 8'),
  academicYear: Yup.number()
    .required('Academic Year is required')
    .min(2000, 'Academic Year must be at least 2000')
    .max(2100, 'Academic Year cannot exceed 2100'),
  subjectId: Yup.string().required('Subject is required'),
  majorId: Yup.string().required('Major is required'),
  courseBatchId: Yup.string().required('Course Batch is required'),
});

const TrainingProgramForm = ({ open, onClose, program }) => {
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courseBatches, setCourseBatches] = useState([]);
  const [dependenciesLoading, setDependenciesLoading] = useState(false);

  const initialValues = {
    semester: program?.semester || '',
    academicYear: program?.academicYear || new Date().getFullYear(),
    subjectId: program?.subject?.id || '',
    majorId: program?.major?.id || '',
    courseBatchId: program?.courseBatch?.id || '',
  };

  const fetchDependencies = async () => {
    setDependenciesLoading(true);
    try {
      const [majorsRes, subjectsRes, courseBatchesRes] = await Promise.all([
        majorService.getAll({ PageSize: 100 }),
        subjectService.getAll({ PageSize: 100 }),
        courseBatchService.getAll({ PageSize: 100 }),
      ]);

      setMajors(majorsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setCourseBatches(courseBatchesRes.data || []);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    } finally {
      setDependenciesLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDependencies();
    }
  }, [open]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (program) {
        await trainingProgramService.update(program.id, {
          ...values,
          id: program.id,
        });
      } else {
        await trainingProgramService.create(values);
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

  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: subject.name,
  }));

  const courseBatchOptions = courseBatches.map(batch => ({
    value: batch.id,
    label: batch.name,
  }));

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={program ? 'Edit Training Program' : 'Add Training Program'}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading || dependenciesLoading}
      maxWidth="md"
    >
      {() => (
        <>
          <FormField
            name="semester"
            label="Semester"
            type="number"
            required
          />
          <FormField
            name="academicYear"
            label="Academic Year"
            type="number"
            required
          />
          <FormField
            name="subjectId"
            label="Subject"
            type="select"
            options={subjectOptions}
            required
            disabled={dependenciesLoading}
          />
          <FormField
            name="majorId"
            label="Major"
            type="select"
            options={majorOptions}
            required
            disabled={dependenciesLoading}
          />
          <FormField
            name="courseBatchId"
            label="Course Batch"
            type="select"
            options={courseBatchOptions}
            required
            disabled={dependenciesLoading}
          />
        </>
      )}
    </FormDialog>
  );
};

export default TrainingProgramForm;