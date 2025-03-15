import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      const response = await authService.login(values.username, values.password);
      login(response.user || { username: values.username }, response.accessToken);
      navigate('/admin/dashboard');
    } catch (error) {
      setError(
        error.response?.data?.message || 
        t('error.login.credentials')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <LanguageSwitcher compact={isMobile} />
        </Box>
        
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {t('adminDashboard')}
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          {t('login.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            isSubmitting,
          }) => (
            <Form>
              <TextField
                fullWidth
                id="username"
                name="username"
                label={t('login.username')}
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.username && Boolean(errors.username)}
                helperText={touched.username && errors.username}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                id="password"
                name="password"
                label={t('login.password')}
                type="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                margin="normal"
                variant="outlined"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{ mt: 3, mb: 2 }}
                startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
              >
                {t('login.signIn')}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default Login; 