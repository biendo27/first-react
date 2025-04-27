import React, { useState } from 'react';
import * as Yup from 'yup';
import { Snackbar, Alert, DialogTitle, DialogContent, DialogActions, Button, Dialog, Box } from '@mui/material';
import { Formik, Form } from 'formik';
import FormField from '../../../components/common/FormField';
import { classRoomService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const ClassRoomForm = ({ open, onClose, classRoom }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, message: '' });
  
  const initialValues = {
    name: classRoom?.name || '',
  };

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('common:fieldRequired', { field: t('classRoom.name') }))
      .max(100, t('classRoom.name') + t('common:invalidFormat')),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      if (classRoom) {
        await classRoomService.update(classRoom.id, values);
        setError({
          show: true,
          message: t('classRoom.updateSuccess'),
          severity: 'success'
        });
      } else {
        await classRoomService.create(values);
        setError({
          show: true,
          message: t('classRoom.createSuccess'),
          severity: 'success'
        });
      }
      resetForm();
      onClose(true);
    } catch (error) {
      const formattedError = handleApiError(
        error, 
        classRoom ? t('classRoom.updateError') : t('classRoom.createError')
      );
      setError({
        show: true,
        message: formattedError.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onClose(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {classRoom ? t('classRoom.editClassRoom') : t('classRoom.addClassRoom')}
        </DialogTitle>
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form>
              <DialogContent dividers>
                {error.show && error.severity === 'error' && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="error">{error.message}</Alert>
                  </Box>
                )}
                
                <FormField
                  name="name"
                  label={t('classRoom.name')}
                  required
                />
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => onClose(false)}
                  disabled={isSubmitting}
                >
                  {t('common:cancel')}
                </Button>
                <Button 
                  type="submit"
                  variant="contained" 
                  disabled={isSubmitting || !(isValid && dirty)}
                  color="primary"
                >
                  {t('common:save')}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <Snackbar
        open={error.show && error.severity === 'success'}
        autoHideDuration={6000}
        onClose={() => setError(prev => ({ ...prev, show: false }))}
      >
        <Alert 
          onClose={() => setError(prev => ({ ...prev, show: false }))} 
          severity="success"
        >
          {error.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClassRoomForm; 