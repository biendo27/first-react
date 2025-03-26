import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { majorService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const MajorForm = ({ open, onClose, major }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('common:fieldRequired', { field: t('major.name') })),
    majorCode: Yup.number()
      .typeError(t('common:mustBeNumber'))
      .positive(t('common:mustBePositive'))
      .integer(t('common:mustBeInteger'))
      .required(t('common:fieldRequired', { field: t('major.majorCode') })),
  });

  const initialValues = {
    name: major?.name || '',
    majorCode: major?.majorCode || '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (major) {
        await majorService.update(major.id, values);
      } else {
        await majorService.create(values);
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
      title={major ? t('major.editMajor') : t('major.addMajor')}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <FormField
        name="name"
        label={t('major.name')}
        required
      />
      <FormField
        name="majorCode"
        label={t('major.majorCode')}
        type="number"
        required
      />
    </FormDialog>
  );
};

export default MajorForm; 