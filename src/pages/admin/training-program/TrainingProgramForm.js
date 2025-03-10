import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FormField from '../../../components/form/FormField';
import { fetchWithAuth } from '../../../utils/fetch';

const validationSchema = Yup.object().shape({
  semester: Yup.number()
    .required('Semester is required')
    .min(1, 'Semester must be at least 1')
    .max(8, 'Semester cannot exceed 8'),
  academicYear: Yup.string()
    .required('Academic Year is required')
    .matches(/^\d{4}-\d{4}$/, 'Academic Year must be in format YYYY-YYYY'),
  subjectId: Yup.string().required('Subject is required'),
  majorId: Yup.string().required('Major is required'),
  courseBatchId: Yup.string().required('Course Batch is required'),
});

const TrainingProgramForm = ({ open, onClose, onSubmit, program }) => {
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courseBatches, setCourseBatches] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchDependencies = async () => {
    try {
      setLoading(true);
      const [majorsRes, subjectsRes, courseBatchesRes] = await Promise.all([
        fetchWithAuth('/v1/majors?PageSize=100'),
        fetchWithAuth('/v1/subjects?PageSize=100'),
        fetchWithAuth('/v1/course-batches?PageSize=100'),
      ]);

      const [majorsData, subjectsData, courseBatchesData] = await Promise.all([
        majorsRes.json(),
        subjectsRes.json(),
        courseBatchesRes.json(),
      ]);

      setMajors(majorsData.data || []);
      setSubjects(subjectsData.data || []);
      setCourseBatches(courseBatchesData.data || []);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      enqueueSnackbar('Failed to fetch form data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDependencies();
    }
  }, [open]);

  const formik = useFormik({
    initialValues: {
      semester: program?.semester || '',
      academicYear: program?.academicYear || '',
      subjectId: program?.subjectId || '',
      majorId: program?.majorId || '',
      courseBatchId: program?.courseBatchId || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const url = program
          ? `/v1/training-programs/${program.id}`
          : '/v1/training-programs';
        const method = program ? 'PUT' : 'POST';

        const response = await fetchWithAuth(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          enqueueSnackbar(
            `Training program ${program ? 'updated' : 'created'} successfully`,
            { variant: 'success' }
          );
          onSubmit();
        } else {
          throw new Error('Failed to save');
        }
      } catch (error) {
        console.error('Error saving training program:', error);
        enqueueSnackbar('Failed to save training program', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>
          {program ? 'Edit Training Program' : 'Create Training Program'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormField
                name="semester"
                label="Semester"
                type="number"
                formik={formik}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormField
                name="academicYear"
                label="Academic Year"
                formik={formik}
                fullWidth
                required
                placeholder="YYYY-YYYY"
              />
            </Grid>
            <Grid item xs={12}>
              <FormField
                name="subjectId"
                label="Subject"
                formik={formik}
                fullWidth
                required
                select
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </FormField>
            </Grid>
            <Grid item xs={12}>
              <FormField
                name="majorId"
                label="Major"
                formik={formik}
                fullWidth
                required
                select
              >
                {majors.map((major) => (
                  <MenuItem key={major.id} value={major.id}>
                    {major.name}
                  </MenuItem>
                ))}
              </FormField>
            </Grid>
            <Grid item xs={12}>
              <FormField
                name="courseBatchId"
                label="Course Batch"
                formik={formik}
                fullWidth
                required
                select
              >
                {courseBatches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </MenuItem>
                ))}
              </FormField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formik.isValid}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

TrainingProgramForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  program: PropTypes.object,
};

export default TrainingProgramForm;
