import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { trainingProgramService, majorService, subjectService, courseBatchService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const TrainingProgramForm = ({ open, onClose, program }) => {
  const { t } = useTranslation(['admin', 'common']);
  
  const validationSchema = Yup.object({
    semester: Yup.number()
      .required(t('common:fieldRequired', { field: t('semester') }))
      .min(1, t('trainingProgram.semesterMin', { min: 1 }))
      .max(8, t('trainingProgram.semesterMax', { max: 8 })),
    academicYear: Yup.number()
      .required(t('common:fieldRequired', { field: t('academicYear') }))
      .min(2000, t('trainingProgram.academicYearMin', { min: 2000 }))
      .max(2100, t('trainingProgram.academicYearMax', { max: 2100 })),
    subjectId: Yup.string().required(t('common:fieldRequired', { field: t('subject.name') })),
    majorId: Yup.string().required(t('common:fieldRequired', { field: t('major.name') })),
    courseBatchId: Yup.string().required(t('common:fieldRequired', { field: t('courseBatch') })),
  });

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
      title={program ? t('trainingProgram.editTrainingProgram') : t('addTrainingProgram')}
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
            label={t('semester')}
            type="number"
            required
          />
          <FormField
            name="academicYear"
            label={t('academicYear')}
            type="number"
            required
          />
          <FormField
            name="subjectId"
            label={t('subject.name')}
            type="select"
            options={subjectOptions}
            required
            disabled={dependenciesLoading}
          />
          <FormField
            name="majorId"
            label={t('major.name')}
            type="select"
            options={majorOptions}
            required
            disabled={dependenciesLoading}
          />
          <FormField
            name="courseBatchId"
            label={t('courseBatch')}
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