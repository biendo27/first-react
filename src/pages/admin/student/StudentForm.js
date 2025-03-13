import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { studentService, administrativeClassService } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import { parseDateFromApi } from '../../../utils/dateUtils';

const StudentForm = ({ open, onClose, student }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  
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
    email: Yup.string().email(t('common:invalidFormat', { field: t('student.email') })).required(t('common:fieldRequired', { field: t('student.email') })),
    phoneNumber: Yup.string(),
    administrativeClassId: Yup.string().required(t('common:fieldRequired', { field: t('student.class') })),
    status: Yup.string().required(t('common:fieldRequired', { field: t('student.status') })),
  });

  const studentStatusTypes = [
    { value: 'Active', label: t('common:statusActive') },
    { value: 'Graduated', label: t('common:statusGraduated') },
    { value: 'Suspended', label: t('common:statusSuspended') },
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
            required
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
  );
};

export default StudentForm; 