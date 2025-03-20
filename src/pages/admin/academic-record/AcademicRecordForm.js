import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { academicRecordService, studentService, subjectService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const AcademicRecordForm = ({ open, onClose, academicRecord }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const validationSchema = Yup.object({
    studentId: Yup.string().required(t('common:fieldRequired', { field: t('academicRecord.student') })),
    subjectId: Yup.string().required(t('common:fieldRequired', { field: t('academicRecord.subject') })),
    zScore: Yup.number()
      .required(t('academicRecord.scoreValidation.required', { field: t('academicRecord.zScore') }))
      .min(0, t('academicRecord.scoreValidation.min', { field: t('academicRecord.zScore'), min: 0 }))
      .max(10, t('academicRecord.scoreValidation.max', { field: t('academicRecord.zScore'), max: 10 })),
    academicYear: Yup.number()
      .required(t('academicRecord.yearValidation.required'))
      .min(2000, t('academicRecord.yearValidation.min', { min: 2000 }))
      .integer(t('academicRecord.yearValidation.integer')),
    semester: Yup.number()
      .required(t('common:fieldRequired', { field: t('academicRecord.semester') }))
      .min(1, t('common:numberRange', { min: 1, max: 8 }))
      .max(8, t('common:numberRange', { min: 1, max: 8 }))
      .integer(),
    resultType: Yup.string()
      .required(t('common:fieldRequired', { field: t('academicRecord.resultType') })),
    completionDate: Yup.date(),
    note: Yup.string(),
  });

  // Format date for form display (YYYY-MM-DD for HTML date input)
  const formatDateForForm = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  };

  const initialValues = {
    studentId: academicRecord?.student?.id || '',
    subjectId: academicRecord?.subject?.id || '',
    zScore: academicRecord?.zScore || '',
    academicYear: academicRecord?.academicYear || new Date().getFullYear(),
    semester: academicRecord?.semester || 1,
    resultType: academicRecord?.resultType || 'PASSED',
    completionDate: formatDateForForm(academicRecord?.completionDate) || formatDateForForm(new Date()),
    note: academicRecord?.note || '',
  };

  const fetchDependencies = async () => {
    setFetchLoading(true);
    try {
      const [studentsResponse, subjectsResponse] = await Promise.all([
        studentService.getAll({ PageSize: 100 }),
        subjectService.getAll({ PageSize: 100 }),
      ]);

      setStudents(studentsResponse.data || []);
      setSubjects(subjectsResponse.data || []);
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
      const formattedValues = {
        ...values,
        // Set xScore and yScore to be the same as zScore
        xScore: Number(values.zScore),
        yScore: Number(values.zScore),
        zScore: Number(values.zScore),
        academicYear: Number(values.academicYear),
        semester: Number(values.semester),
        // The API interceptor will handle ISO 8601 conversion
        completionDate: values.completionDate || null,
      };

      if (academicRecord) {
        await academicRecordService.update(academicRecord.id, formattedValues);
      } else {
        await academicRecordService.create(formattedValues);
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

  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.firstName} ${student.lastName} (${student.studentCode})`,
  }));

  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: `${subject.name} (${subject.subjectCode})`,
  }));

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8].map(semester => ({
    value: semester,
    label: `${t('academicRecord.semester')} ${semester}`,
  }));

  const resultTypeOptions = [
    { value: 'PASSED', label: t('academicRecord.resultTypes.passed') },
    { value: 'DISQUALIFICATION', label: t('academicRecord.resultTypes.disqualification') },
    { value: 'EXEMPTED', label: t('academicRecord.resultTypes.exempted') },
  ];

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={academicRecord ? t('academicRecord.editAcademicRecord') : t('academicRecord.addAcademicRecord')}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading || fetchLoading}
      maxWidth="md"
    >
      <FormField
        name="studentId"
        label={t('academicRecord.student')}
        type="select"
        options={studentOptions}
        required
        disabled={fetchLoading}
      />
      <FormField
        name="subjectId"
        label={t('academicRecord.subject')}
        type="select"
        options={subjectOptions}
        required
        disabled={fetchLoading}
      />
      <FormField
        name="zScore"
        label={t('academicRecord.zScore')}
        type="number"
        required
        inputProps={{ step: "0.1", min: "0", max: "10" }}
      />
      <FormField
        name="academicYear"
        label={t('academicRecord.academicYear')}
        type="number"
        required
        inputProps={{ min: "2000" }}
      />
      <FormField
        name="semester"
        label={t('academicRecord.semester')}
        type="select"
        options={semesterOptions}
        required
      />
      <FormField
        name="resultType"
        label={t('academicRecord.resultType')}
        type="select"
        options={resultTypeOptions}
        required
      />
      <FormField
        name="completionDate"
        label={t('academicRecord.completionDate')}
        type="date"
        InputLabelProps={{
          shrink: true,
        }}
      />
      <FormField
        name="note"
        label={t('academicRecord.note')}
        multiline
        rows={3}
      />
    </FormDialog>
  );
};

export default AcademicRecordForm; 