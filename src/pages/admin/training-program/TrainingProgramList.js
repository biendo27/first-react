import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { trainingProgramService, courseBatchService, majorService, handleApiError } from '../../../services/api';
import TrainingProgramForm from './TrainingProgramForm';
import DuplicateTrainingProgramDialog from './DuplicateTrainingProgramDialog';
import { useTranslation } from 'react-i18next';

const TrainingProgramList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'order', label: t('admin:order', 'Order'), minWidth: 80 },
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
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
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

  const [importDialogOpen, setImportDialogOpen] = useState(false);

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
      const formattedError = handleApiError(error, t('common:error.loading'));
      console.error('Error fetching filter options:', formattedError);
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setFiltersLoading(false);
    }
  }, [t]);

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
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('admin:trainingPrograms') }));
      console.error('Error fetching programs:', formattedError);
      setAlertInfo({
        open: true,
        message: formattedError.message,
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
      const formattedError = handleApiError(error, t('trainingProgramDeleteError', 'Failed to delete training program'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
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

  const handleDuplicate = () => {
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateClose = (refreshData) => {
    setDuplicateDialogOpen(false);
    if (refreshData) {
      setAlertInfo({
        open: true,
        message: t('trainingProgramDuplicateSuccess', 'Training program duplicated successfully'),
        severity: 'success',
      });
      fetchPrograms();
    }
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import for training programs:', file.name);
      const result = await trainingProgramService.importFile(file);
      console.log('Import successful:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('admin:trainingProgramImportSuccess', 'Training programs imported successfully'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchPrograms();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      const formattedError = handleApiError(error, t('admin:trainingProgramImportError', 'Failed to import training programs'));
      
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
      throw formattedError;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('admin:trainingPrograms')}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenImportDialog}
            sx={{ mr: 2 }}
          >
            {t('common:fileImport.import')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ContentCopyIcon />}
            onClick={handleDuplicate}
            sx={{ mr: 2 }}
            disabled={!selectedCourseBatchId}
          >
            {t('admin:duplicateTrainingProgram', 'Duplicate')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('admin:addTrainingProgram')}
          </Button>
        </Box>
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
              <InputLabel id="course-batch-filter-label">{t('admin:courseBatch.displayName')}</InputLabel>
              <Select
                labelId="course-batch-filter-label"
                value={selectedCourseBatchId}
                onChange={handleCourseBatchChange}
                label={t('admin:courseBatch.displayName')}
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

      {duplicateDialogOpen && (
        <DuplicateTrainingProgramDialog
          open={duplicateDialogOpen}
          onClose={handleDuplicateClose}
          sourceBatchId={selectedCourseBatchId}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('admin:importTrainingPrograms', 'Import Training Programs')}
        description={t('admin:importTrainingProgramsDescription', 'Upload an Excel file (.xlsx, .xls) containing training program data.')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
          severity={alertInfo.severity}
          variant="filled"
          elevation={6}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainingProgramList;