import React, { useState, useEffect, useCallback } from 'react';
import * as Yup from 'yup';
import { Snackbar, Alert } from '@mui/material';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { studentService, administrativeClassService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const StudentForm = ({ open, onClose, student }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [error, setError] = useState({ show: false, message: '' });
  
  // Format date for form display (YYYY-MM-DD for HTML date input)
  const formatDateForForm = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  };
  
  const validationSchema = Yup.object({
    studentCode: Yup.string().required(t('common:fieldRequired', { field: t('student.studentCode') })),
    firstName: Yup.string().required(t('common:fieldRequired', { field: t('student.firstName') })),
    lastName: Yup.string().required(t('common:fieldRequired', { field: t('student.lastName') })),
    dateOfBirth: Yup.date().required(t('common:fieldRequired', { field: t('student.dateOfBirth') })),
    email: Yup.string()
      .email(t('common:invalidFormat', { field: t('student.email') }))
      .nullable()
      .transform((value) => (value === '' ? null : value)), // Transform empty string to null
    phoneNumber: Yup.string()
      .nullable()
      .transform((value) => (value === '' ? null : value)), // Transform empty string to null
    administrativeClassId: Yup.string().required(t('common:fieldRequired', { field: t('student.class') })),
    status: Yup.string().required(t('common:fieldRequired', { field: t('student.status') })),
  });

  const studentStatusTypes = [
    { value: 'Active', label: t('student.statusTypes.active') },
    { value: 'Graduated', label: t('student.statusTypes.graduated') },
    { value: 'Suspended', label: t('student.statusTypes.suspended') },
  ];

  const initialValues = {
    studentCode: student?.studentCode || '',
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    dateOfBirth: formatDateForForm(student?.dateOfBirth) || '',
    email: student?.email || '',
    phoneNumber: student?.phoneNumber || '',
    administrativeClassId: student?.administrativeClass?.id || '',
    status: student?.status || 'Active',
  };

  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const res = await administrativeClassService.getAll({ PageSize: 100 });
      setClasses(res.data || []);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:error.loading'));
      console.error('Error fetching classes:', formattedError);
      setError({
        show: true,
        message: formattedError.message
      });
    } finally {
      setClassesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

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
      const formattedError = handleApiError(error, t('student.submitError'));
      setError({
        show: true,
        message: formattedError.message
      });
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
    <>
      <FormDialog
        open={open}
        onClose={() => onClose(false)}
        title={student ? t('student.editStudent') : t('student.addStudent')}
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
              label={t('student.studentCode')}
              required
            />
            <FormField
              name="firstName"
              label={t('student.firstName')}
              required
            />
            <FormField
              name="lastName"
              label={t('student.lastName')}
              required
            />
            <FormField
              name="dateOfBirth"
              label={t('student.dateOfBirth')}
              type="date"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormField
              name="email"
              label={t('student.email')}
              type="email"
            />
            <FormField
              name="phoneNumber"
              label={t('student.phoneNumber')}
            />
            <FormField
              name="administrativeClassId"
              label={t('student.class')}
              type="select"
              options={classOptions}
              required
              disabled={classesLoading}
            />
            <FormField
              name="status"
              label={t('student.status')}
              type="select"
              options={studentStatusTypes}
              required
            />
          </>
        )}
      </FormDialog>

      <Snackbar
        open={error.show}
        autoHideDuration={6000}
        onClose={() => setError({ ...error, show: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError({ ...error, show: false })}
          severity="error"
          variant="filled"
        >
          {error.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default StudentForm; 