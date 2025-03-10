import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { academicRecordService, studentService, subjectService } from '../../../services/api';

const validationSchema = Yup.object({
  studentId: Yup.string().required('Student is required'),
  subjectId: Yup.string().required('Subject is required'),
  xScore: Yup.number()
    .required('X Score is required')
    .min(0, 'X Score must be at least 0')
    .max(10, 'X Score must be at most 10'),
  yScore: Yup.number()
    .required('Y Score is required')
    .min(0, 'Y Score must be at least 0')
    .max(10, 'Y Score must be at most 10'),
  zScore: Yup.number()
    .required('Z Score is required')
    .min(0, 'Z Score must be at least 0')
    .max(10, 'Z Score must be at most 10'),
  academicYear: Yup.number()
    .required('Academic year is required')
    .min(2000, 'Academic year must be at least 2000')
    .integer('Academic year must be an integer'),
  completionDate: Yup.date(),
  note: Yup.string(),
});

const AcademicRecordForm = ({ open, onClose, academicRecord }) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const initialValues = {
    studentId: academicRecord?.student?.id || '',
    subjectId: academicRecord?.subject?.id || '',
    xScore: academicRecord?.xScore || '',
    yScore: academicRecord?.yScore || '',
    zScore: academicRecord?.zScore || '',
    academicYear: academicRecord?.academicYear || new Date().getFullYear(),
    completionDate: academicRecord?.completionDate 
      ? new Date(academicRecord.completionDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
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
        xScore: Number(values.xScore),
        yScore: Number(values.yScore),
        zScore: Number(values.zScore),
        academicYear: Number(values.academicYear),
        completionDate: values.completionDate ? new Date(values.completionDate).toISOString() : null,
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

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={academicRecord ? 'Edit Academic Record' : 'Add Academic Record'}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading || fetchLoading}
      maxWidth="md"
    >
      <FormField
        name="studentId"
        label="Student"
        type="select"
        options={studentOptions}
        required
        disabled={fetchLoading}
      />
      <FormField
        name="subjectId"
        label="Subject"
        type="select"
        options={subjectOptions}
        required
        disabled={fetchLoading}
      />
      <FormField
        name="xScore"
        label="X Score"
        type="number"
        required
        inputProps={{ step: "0.1", min: "0", max: "10" }}
      />
      <FormField
        name="yScore"
        label="Y Score"
        type="number"
        required
        inputProps={{ step: "0.1", min: "0", max: "10" }}
      />
      <FormField
        name="zScore"
        label="Z Score"
        type="number"
        required
        inputProps={{ step: "0.1", min: "0", max: "10" }}
      />
      <FormField
        name="academicYear"
        label="Academic Year"
        type="number"
        required
      />
      <FormField
        name="completionDate"
        label="Completion Date"
        type="date"
        InputLabelProps={{
          shrink: true,
        }}
      />
      <FormField
        name="note"
        label="Note"
        multiline
        rows={3}
      />
    </FormDialog>
  );
};

export default AcademicRecordForm; 