import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import FormDialog from '../../../components/common/FormDialog';
import FormField from '../../../components/common/FormField';
import { administrativeClassService, majorService, courseBatchService, educationModeService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const AdministrativeClassForm = ({ open, onClose, administrativeClass }) => {
  const { t } = useTranslation(['admin', 'common']);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('common:fieldRequired', { field: t('administrativeClass.name') })),
    courseBatchId: Yup.string().required(t('common:fieldRequired', { field: t('courseBatch') })),
    majorId: Yup.string().required(t('common:fieldRequired', { field: t('major.name') })),
    educationModeId: Yup.string().required(t('common:fieldRequired', { field: t('educationModes') })),
  });

  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState([]);
  const [courseBatches, setCourseBatches] = useState([]);
  const [educationModes, setEducationModes] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const initialValues = {
    name: administrativeClass?.name || '',
    courseBatchId: administrativeClass?.courseBatch?.id || '',
    majorId: administrativeClass?.major?.id || '',
    educationModeId: administrativeClass?.educationMode?.id || '',
  };

  const fetchDependencies = async () => {
    setFetchLoading(true);
    try {
      const [majorsResponse, courseBatchesResponse, educationModesResponse] = await Promise.all([
        majorService.getAll({ PageSize: 100 }),
        courseBatchService.getAll({ PageSize: 100 }),
        educationModeService.getAll({ PageSize: 100 }),
      ]);

      setMajors(majorsResponse.data || []);
      setCourseBatches(courseBatchesResponse.data || []);
      setEducationModes(educationModesResponse.data || []);
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
      if (administrativeClass) {
        await administrativeClassService.update(administrativeClass.id, values);
      } else {
        await administrativeClassService.create(values);
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

  const courseBatchOptions = courseBatches.map(batch => ({
    value: batch.id,
    label: batch.name,
  }));

  const educationModeOptions = educationModes.map(mode => ({
    value: mode.id,
    label: mode.name,
  }));

  return (
    <FormDialog
      open={open}
      onClose={() => onClose(false)}
      title={administrativeClass 
        ? t('administrativeClass.editAdministrativeClass') 
        : t('administrativeClass.addAdministrativeClass')}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      loading={loading || fetchLoading}
    >
      <FormField
        name="name"
        label={t('administrativeClass.name')}
        required
      />
      <FormField
        name="courseBatchId"
        label={t('courseBatch')}
        type="select"
        options={courseBatchOptions}
        required
        disabled={fetchLoading}
      />
      <FormField
        name="majorId"
        label={t('major.name')}
        type="select"
        options={majorOptions}
        required
        disabled={fetchLoading}
      />
      <FormField
        name="educationModeId"
        label={t('educationModes')}
        type="select"
        options={educationModeOptions}
        required
        disabled={fetchLoading}
      />
    </FormDialog>
  );
};

export default AdministrativeClassForm; 