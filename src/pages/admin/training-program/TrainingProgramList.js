import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { trainingProgramService, courseBatchService, majorService } from '../../../services/api';
import TrainingProgramForm from './TrainingProgramForm';
import { useTranslation } from 'react-i18next';

const TrainingProgramList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'semester', label: t('admin:semester', 'Semester'), minWidth: 100 },
    { 
      id: 'subject', 
      label: t('admin:subjects', 'Subject'), 
      minWidth: 200,
      render: (row) => row.subject?.name || t('common:noData')
    },
    { 
      id: 'subjectCode', 
      label: t('admin:subjectCode', 'Subject Code'), 
      minWidth: 150,
      render: (row) => row.subject?.subjectCode || t('common:noData')
    },
    { 
      id: 'credit', 
      label: t('admin:credit', 'Credit'), 
      minWidth: 100,
      render: (row) => row.subject?.credit || t('common:noData')
    },
    { 
      id: 'subjectType', 
      label: t('admin:subjectType', 'Subject Type'), 
      minWidth: 150,
      render: (row) => row.subject?.type ? t(`admin:subjectTypes.${row.subject.type.toLowerCase()}`) : t('common:noData')
    }
  ];

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Filter states
  const [majors, setMajors] = useState([]);
  const [courseBatches, setCourseBatches] = useState([]);
  const [selectedMajorId, setSelectedMajorId] = useState('');
  const [selectedCourseBatchId, setSelectedCourseBatchId] = useState('');
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const [majorsRes, courseBatchesRes] = await Promise.all([
        majorService.getAll({ PageSize: 100 }),
        courseBatchService.getAll({ PageSize: 100 }),
      ]);
      setMajors(majorsRes.data || []);
      setCourseBatches(courseBatchesRes.data || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        PageIndex: page,
        PageSize: pageSize,
      };
      
      if (selectedMajorId) {
        params.MajorId = selectedMajorId;
      }
      
      if (selectedCourseBatchId) {
        params.CourseBatchId = selectedCourseBatchId;
      }
      
      const response = await trainingProgramService.getAll(params);
      setPrograms(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('common:error.loading'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedMajorId, selectedCourseBatchId, t]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedProgram(null);
    setFormOpen(true);
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setFormOpen(true);
  };

  const handleDelete = (program) => {
    setSelectedProgram(program);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await trainingProgramService.delete(selectedProgram.id);
      setAlertInfo({
        open: true,
        message: t('trainingProgramDeleteSuccess', 'Training program deleted successfully'),
        severity: 'success',
      });
      fetchPrograms();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('trainingProgramDeleteError', 'Failed to delete training program'),
        severity: 'error',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormClose = (refreshData) => {
    setFormOpen(false);
    if (refreshData) {
      fetchPrograms();
    }
  };

  const handleMajorChange = (event) => {
    setSelectedMajorId(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleCourseBatchChange = (event) => {
    setSelectedCourseBatchId(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('admin:trainingPrograms')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('admin:addTrainingProgram')}
        </Button>
      </Box>

      {/* Filters section */}
      <Box 
        sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: 'white', 
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('common:filters')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="major-filter-label">{t('admin:majors')}</InputLabel>
              <Select
                labelId="major-filter-label"
                value={selectedMajorId}
                onChange={handleMajorChange}
                label={t('admin:majors')}
                disabled={filtersLoading}
              >
                <MenuItem value="">{t('common:all')}</MenuItem>
                {majors.map((major) => (
                  <MenuItem key={major.id} value={major.id}>
                    {major.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="course-batch-filter-label">{t('admin:courseBatch')}</InputLabel>
              <Select
                labelId="course-batch-filter-label"
                value={selectedCourseBatchId}
                onChange={handleCourseBatchChange}
                label={t('admin:courseBatch')}
                disabled={filtersLoading}
              >
                <MenuItem value="">{t('common:all')}</MenuItem>
                {courseBatches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <DataTable
        columns={columns}
        data={programs}
        totalCount={totalCount}
        page={page - 1}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        resourceName={t('admin:trainingProgram')}
      />

      {formOpen && (
        <TrainingProgramForm
          open={formOpen}
          onClose={handleFormClose}
          program={selectedProgram}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('deleteTitle', 'Delete Training Program')}
        message={t('deleteConfirmation', 'Are you sure you want to delete this training program?')}
        loading={deleteLoading}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
      >
        <Alert
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainingProgramList;