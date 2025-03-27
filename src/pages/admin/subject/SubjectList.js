import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack, TextField, Paper, InputAdornment, IconButton, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { subjectService, handleApiError } from '../../../services/api';
import SubjectForm from './SubjectForm';
import { useTranslation } from 'react-i18next';

const SubjectList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'subjectCode', label: t('subject.subjectCode', 'Subject Code'), minWidth: 120 },
    { id: 'name', label: t('subject.name', 'Name'), minWidth: 200 },
    { 
      id: 'credit', 
      label: t('subject.credit', 'Credits'), 
      minWidth: 120,
      render: (row) => row.credit || 'N/A'
    },
    { 
      id: 'type', 
      label: t('subject.type', 'Loại môn học'), 
      minWidth: 150,
      render: (row) => t(`subject.type${row.type}`, row.type || 'N/A')
    },
  ];
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    Name: '',
    SubjectCode: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await subjectService.getAll({
        PageIndex: page,
        PageSize: pageSize,
        ...filters
      });
      setSubjects(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('subjects') }));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, t]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedSubject(null);
    setFormOpen(true);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormOpen(true);
  };

  const handleDelete = (subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await subjectService.delete(selectedSubject.id);
      setAlertInfo({
        open: true,
        message: t('subject.subjectDeleteSuccess'),
        severity: 'success',
      });
      fetchSubjects();
    } catch (error) {
      const formattedError = handleApiError(error, t('subject.subjectDeleteError'));
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
      fetchSubjects();
    }
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import for subjects:', file.name);
      const result = await subjectService.importFile(file);
      console.log('Import successful:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('subject.importSuccess'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchSubjects();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      const formattedError = handleApiError(error, t('subject.importError'));
      
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
      throw formattedError;
    }
  };
  
  // Filter handlers
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      Name: '',
      SubjectCode: ''
    });
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleClearSingleFilter = (name) => {
    setFilters(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('subjects')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilterAltIcon />}
            onClick={handleToggleFilters}
          >
            {showFilters ? t('common:hideFilters') : t('common:showFilters')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenImportDialog}
          >
            {t('common:import')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('subject.addSubject')}
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                placeholder={t('subject.name')}
                name="Name"
                value={filters.Name}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: filters.Name ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClearSingleFilter('Name')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                placeholder={t('subject.subjectCode')}
                name="SubjectCode"
                value={filters.SubjectCode}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: filters.SubjectCode ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClearSingleFilter('SubjectCode')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ mt: { xs: 1, sm: 0 } }}
              >
                {t('common:clearFilters')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <DataTable
        columns={columns}
        data={subjects}
        totalCount={totalCount}
        page={page - 1}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {formOpen && (
        <SubjectForm
          open={formOpen}
          onClose={handleFormClose}
          subject={selectedSubject}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('subject.importSubjects', 'Import Subjects')}
        description={t('subject.importSubjectsDescription', 'Upload an Excel file (.xlsx, .xls) containing subject data. Maximum file size is 5MB.')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('subject.deleteSubject')}
        message={t('subject.deleteSubjectConfirmation')}
        loading={deleteLoading}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
          severity={alertInfo.severity}
          variant="filled"
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubjectList; 