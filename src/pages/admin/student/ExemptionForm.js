import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TablePagination,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { subjectExemptionService } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const ExemptionForm = ({ open, onClose, student, subject: initialSubject, exemption }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditing = !!exemption;
  
  // Add state for subject selection with pagination
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubject?.id || '');
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalSubjects, setTotalSubjects] = useState(0);

  const validationSchema = Yup.object({
    xScore: Yup.number()
      .required(t('common:fieldRequired', { field: t('exemption.xScore') }))
      .min(0, t('common:numberRange', { min: 0, max: 10 }))
      .max(10, t('common:numberRange', { min: 0, max: 10 })),
    yScore: Yup.number()
      .required(t('common:fieldRequired', { field: t('exemption.yScore') }))
      .min(0, t('common:numberRange', { min: 0, max: 10 }))
      .max(10, t('common:numberRange', { min: 0, max: 10 })),
    zScore: Yup.number()
      .required(t('common:fieldRequired', { field: t('exemption.zScore') }))
      .min(0, t('common:numberRange', { min: 0, max: 10 }))
      .max(10, t('common:numberRange', { min: 0, max: 10 })),
    note: Yup.string().max(500, t('common:maxLength', { field: t('exemption.note'), length: 500 })),
  });

  // Fetch subjects with pagination
  const fetchSubjects = useCallback(async () => {
    if (!open || isEditing) return;
    
    setSubjectsLoading(true);
    try {
      const response = await subjectExemptionService.getStudentSubjects({
        StudentCode: student.studentCode,
        PageIndex: page,
        PageSize: rowsPerPage,
      });
      
      setSubjects(response.data || []);
      setTotalSubjects(response.totalCount || 0);
      
      // Initialize selected subject if not editing
      if (!isEditing && response.data?.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(initialSubject?.id || response.data[0].id);
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
      setError(t('exemption.failedToLoadSubjects', { error: err.message || t('error.generic') }));
    } finally {
      setSubjectsLoading(false);
    }
  }, [open, isEditing, student, page, rowsPerPage, t, initialSubject, selectedSubjectId]);

  // Load subjects when form opens
  useEffect(() => {
    if (open && !isEditing) {
      fetchSubjects();
    }
  }, [open, isEditing, fetchSubjects]);

  const handleChangePage = (event, newPage) => {
    // MUI pagination is 0-based, but our API expects 1-based
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to first page
  };

  const handleSubjectChange = (event) => {
    setSelectedSubjectId(event.target.value);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      if (isEditing) {
        // Update existing exemption
        await subjectExemptionService.update(exemption.id, {
          id: exemption.id,
          xScore: values.xScore,
          yScore: values.yScore,
          zScore: values.zScore,
          note: values.note,
        });
      } else {
        // Create new exemption with selected subject
        await subjectExemptionService.create({
          studentCode: student.studentCode,
          subjectId: selectedSubjectId,
          xScore: values.xScore,
          yScore: values.yScore,
          zScore: values.zScore,
          note: values.note,
        });
      }
      onClose(true); // Refresh data after successful submission
    } catch (err) {
      console.error('Error saving exemption:', err);
      setError(t('common:saveError', { resource: t('exemption.title') }));
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      xScore: exemption ? exemption.xScore : '',
      yScore: exemption ? exemption.yScore : '',
      zScore: exemption ? exemption.zScore : '',
      note: exemption ? exemption.note || '' : '',
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  // Function to get the current selected subject object
  const getSelectedSubject = () => {
    if (isEditing) return exemption;
    return subjects.find(s => s.id === selectedSubjectId) || initialSubject;
  };

  const selectedSubject = getSelectedSubject();

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? t('exemption.editExemption') : t('exemption.addExemption')}
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!isEditing && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                {t('exemption.selectSubject')}
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: '300px' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">{t('exemption.select')}</TableCell>
                      <TableCell>{t('exemption.subjectCode')}</TableCell>
                      <TableCell>{t('exemption.subjectName')}</TableCell>
                      <TableCell>{t('exemption.credits')}</TableCell>
                      <TableCell>{t('exemption.type')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjectsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={30} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Box sx={{ py: 3 }}>{t('exemption.noSubjectsFound')}</Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <RadioGroup 
                        name="subject-selection" 
                        value={selectedSubjectId}
                        onChange={handleSubjectChange}
                      >
                        {subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell padding="checkbox">
                              <FormControlLabel 
                                value={subject.id} 
                                control={<Radio />} 
                                label="" 
                                sx={{ m: 0 }}
                              />
                            </TableCell>
                            <TableCell>{subject.subjectCode}</TableCell>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>{subject.credit}</TableCell>
                            <TableCell>{subject.type}</TableCell>
                          </TableRow>
                        ))}
                      </RadioGroup>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalSubjects}
                rowsPerPage={rowsPerPage}
                page={page - 1} // Adjust for MUI's 0-based pagination
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage={t('rowsPerPage')}
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} ${t('of')} ${count !== -1 ? count : `${t('more than')} ${to}`}`
                }
              />
            </Box>
          )}

          {/* Subject info section for selected subject or editing */}
          {selectedSubject && (
            <Box mb={3} p={2} bgcolor="background.paper" borderRadius={1}>
              <Typography variant="subtitle1" gutterBottom>
                {t('exemption.subjectInfo')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>{t('exemption.subjectCode')}:</strong> {selectedSubject.subjectCode}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>{t('exemption.type')}:</strong> {selectedSubject.type}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>{t('exemption.subjectName')}:</strong> {selectedSubject.name || selectedSubject.subjectName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>{t('exemption.credits')}:</strong> {selectedSubject.credit}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              {t('exemption.exemptionDetails')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="xScore"
                  name="xScore"
                  label={t('exemption.xScore')}
                  value={formik.values.xScore}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.xScore && Boolean(formik.errors.xScore)}
                  helperText={formik.touched.xScore && formik.errors.xScore}
                  type="number"
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="yScore"
                  name="yScore"
                  label={t('exemption.yScore')}
                  value={formik.values.yScore}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.yScore && Boolean(formik.errors.yScore)}
                  helperText={formik.touched.yScore && formik.errors.yScore}
                  type="number"
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="zScore"
                  name="zScore"
                  label={t('exemption.zScore')}
                  value={formik.values.zScore}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.zScore && Boolean(formik.errors.zScore)}
                  helperText={formik.touched.zScore && formik.errors.zScore}
                  type="number"
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="note"
                  name="note"
                  label={t('exemption.note')}
                  value={formik.values.note}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.note && Boolean(formik.errors.note)}
                  helperText={
                    (formik.touched.note && formik.errors.note) ||
                    t('common:maxCharacters', { max: 500 })
                  }
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !formik.isValid || (isEditing ? !formik.dirty : !selectedSubjectId)}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {t('common:save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

ExemptionForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.object.isRequired,
  subject: PropTypes.object,
  exemption: PropTypes.object,
};

export default ExemptionForm; 