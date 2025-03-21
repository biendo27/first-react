import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  IconButton,
  Alert,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Formik, Form } from 'formik';

const FormDialog = ({
  open,
  onClose,
  title,
  initialValues,
  validationSchema,
  onSubmit,
  children,
  loading,
  maxWidth = 'sm',
  error,
}) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
    >
      <DialogTitle>
        {title}
        {!loading && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {(formikProps) => (
          <Form>
            <DialogContent dividers>
              {error && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              )}
              {typeof children === 'function'
                ? children(formikProps)
                : children}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={onClose}
                color="inherit"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={loading || !formikProps.isValid || !formikProps.dirty}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                Save
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default FormDialog; 