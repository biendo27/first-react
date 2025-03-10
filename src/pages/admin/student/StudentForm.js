import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { studentService, administrativeClassService } from '../../../services/api';

const validationSchema = Yup.object({
  studentCode: Yup.string().required('Student code is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  dateOfBirth: Yup.date().required('Date of birth is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phoneNumber: Yup.string(),
  administrativeClassId: Yup.string().required('Class is required'),
  status: Yup.string().required('Status is required'),
});

const studentStatusTypes = [
  { value: 'Active', label: 'Active' },
  { value: 'Graduated', label: 'Graduated' },
  { value: 'Suspended', label: 'Suspended' },
];

const StudentForm = ({ open, onClose, student }) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);

  const initialValues = {
    studentCode: student?.studentCode || '',
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
    email: student?.email || '',
    phoneNumber: student?.phoneNumber || '',
    administrativeClassId: student?.administrativeClass?.id || '',
    status: student?.status || 'Active',
  };

  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      const response = await administrativeClassService.getAll({
        PageSize: 100,  // Get a large number to populate dropdown
      });
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (student) {
        await studentService.update(student.id, { 
          ...values, 
          id: student.id,
        });
      } else {
        await studentService.create(values);
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

  const classOptions = classes.map(cls => ({
    value: cls.id,
    label: cls.name,
  }));

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={student ? 'Edit Student' : 'Add Student'}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading || classesLoading}
      maxWidth="md"
    >
      {() => (
        <>
          <FormField
            name="studentCode"
            label="Student Code"
            required
          />
          <FormField
            name="firstName"
            label="First Name"
            required
          />
          <FormField
            name="lastName"
            label="Last Name"
            required
          />
          <FormField
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormField
            name="email"
            label="Email"
            type="email"
            required
          />
          <FormField
            name="phoneNumber"
            label="Phone Number"
          />
          <FormField
            name="administrativeClassId"
            label="Class"
            type="select"
            options={classOptions}
            required
            disabled={classesLoading}
          />
          <FormField
            name="status"
            label="Status"
            type="select"
            options={studentStatusTypes}
            required
          />
        </>
      )}
    </FormDialog>
  );
};

export default StudentForm; 