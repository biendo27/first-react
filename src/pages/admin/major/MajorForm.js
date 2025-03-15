import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { majorService, educationModeService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const MajorForm = ({ open, onClose, major }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [educationModes, setEducationModes] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('common:fieldRequired', { field: t('major.name') })),
    majorCode: Yup.number()
      .typeError(t('common:mustBeNumber'))
      .positive(t('common:mustBePositive'))
      .integer(t('common:mustBeInteger'))
      .required(t('common:fieldRequired', { field: t('major.majorCode') })),
    educationModeId: Yup.string().nullable(),
  });

  const initialValues = {
    name: major?.name || '',
    majorCode: major?.majorCode || '',
    educationModeId: major?.educationMode?.id || '',
  };

  const fetchEducationModes = async () => {
    setFetchLoading(true);
    try {
      const response = await educationModeService.getAll({
        PageSize: 100,
      });
      setEducationModes(response.data || []);
    } catch (error) {
      console.error('Error fetching education modes:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchEducationModes();
  }, []);

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

  const educationModeOptions = educationModes.map(mode => ({
    value: mode.id,
    label: mode.name,
  }));

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={major ? t('major.editMajor') : t('major.addMajor')}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading || fetchLoading}
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
      <FormField
        name="educationModeId"
        label={t('educationModes')}
        type="select"
        options={educationModeOptions}
        disabled={fetchLoading}
      />
    </FormDialog>
  );
};

export default MajorForm; 