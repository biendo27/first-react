import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { subjectService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const SubjectForm = ({ open, onClose, subject }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  
  const validationSchema = Yup.object({
    name: Yup.string().required(t('common:fieldRequired', { field: t('subject.name') })),
    subjectCode: Yup.number()
      .required(t('subject.subjectCodeRequired'))
      .positive(t('subject.subjectCodePositive'))
      .integer(t('subject.subjectCodeInteger')),
    credit: Yup.number()
      .required(t('subject.creditRequired'))
      .positive(t('subject.creditPositive'))
      .integer(t('subject.creditInteger')),
    type: Yup.string().required(t('common:fieldRequired', { field: t('subject.type') })),
  });
  
  const subjectTypes = [
    { value: 'Compulsory', label: t('subject.typeCompulsory') },
    { value: 'Elective', label: t('subject.typeElective') },
  ];

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
      title={subject ? t('subject.editSubject') : t('subject.addSubject')}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <FormField
        name="name"
        label={t('subject.name')}
        required
      />
      <FormField
        name="subjectCode"
        label={t('subject.subjectCode')}
        type="number"
        required
      />
      <FormField
        name="credit"
        label={t('subject.credit')}
        type="number"
        required
      />
      <FormField
        name="type"
        label={t('subject.type')}
        type="select"
        options={subjectTypes}
        required
      />
    </FormDialog>
  );
};

export default SubjectForm; 