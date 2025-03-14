import React, { useState } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { educationModeService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const EducationModeForm = ({ open, onClose, educationMode }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('common:fieldRequired', { field: t('common:name') })),
  });

  const initialValues = {
    name: educationMode?.name || '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (educationMode) {
        await educationModeService.update(educationMode.id, values);
      } else {
        await educationModeService.create(values);
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
      title={educationMode ? t('educationMode.editEducationMode') : t('educationMode.addEducationMode')}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <FormField
        name="name"
        label={t('common:name')}
        required
      />
    </FormDialog>
  );
};

export default EducationModeForm; 