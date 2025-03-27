import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack, TextField, Paper, InputAdornment, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { courseBatchService, handleApiError } from '../../../services/api';
import CourseBatchForm from './CourseBatchForm';
import { useTranslation } from 'react-i18next';

const CourseBatchList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  // Format duration values for display
  const formatDuration = (value) => {
    if (value === undefined || value === null) return '';
    
    // For exact values, show without decimal
    if (value % 1 === 0) {
      return value.toFixed(0);
    }
    
    // For half values, show as x.5
    if (value * 2 % 1 === 0) {
      return value.toFixed(1);
    }
    
    // Otherwise show with up to 2 decimal places
    return value.toFixed(2);
  };
  
  const columns = [
    { id: 'name', label: t('common:name'), minWidth: 200 },
    { 
      id: 'startTime', 
      label: t('startDate', 'Start Date'), 
      minWidth: 150,
      render: (row) => row.startTime ? new Date(row.startTime).toLocaleDateString() : 'N/A'
    },
    { 
      id: 'regularProgramDuration', 
      label: t('regularDuration', 'Regular Duration (years)'), 
      minWidth: 180,
      render: (row) => formatDuration(row.regularProgramDuration)
    },
    { 
      id: 'maximumProgramDuration', 
      label: t('maximumDuration', 'Maximum Duration (years)'), 
      minWidth: 180,
      render: (row) => formatDuration(row.maximumProgramDuration)
    },
  ];

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    Name: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchCourseBatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await courseBatchService.getAll({
        PageIndex: page,
        PageSize: pageSize,
        ...filters
      });
      setBatches(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('courseBatches') }));
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
    fetchCourseBatches();
  }, [fetchCourseBatches]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedBatch(null);
    setFormOpen(true);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleEdit = (batch) => {
    setSelectedBatch(batch);
    setFormOpen(true);
  };

  const handleDelete = (batch) => {
    setSelectedBatch(batch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await courseBatchService.delete(selectedBatch.id);
      setAlertInfo({
        open: true,
        message: t('deleteCourseBatchSuccess'),
        severity: 'success',
      });
      fetchCourseBatches();
    } catch (error) {
      const formattedError = handleApiError(error, t('deleteCourseBatchError'));
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
      fetchCourseBatches();
    }
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import for course batches:', file.name);
      const result = await courseBatchService.importFile(file);
      console.log('Import successful:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('courseBatch.importSuccess'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchCourseBatches();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      const formattedError = handleApiError(error, t('courseBatch.importError'));
      
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
      Name: ''
    });
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('courseBatches')}
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
            {t('addCourseBatch')}
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder={t('common:name')}
              name="Name"
              value={filters.Name}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
              sx={{ 
                width: { xs: '100%', sm: '50%', md: '40%', lg: '30%' },
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
                      onClick={() => setFilters(prev => ({ ...prev, Name: '' }))}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ ml: 2 }}
            >
              {t('common:clearFilters')}
            </Button>
          </Box>
        </Paper>
      )}

      <DataTable
        columns={columns}
        data={batches}
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
        <CourseBatchForm
          open={formOpen}
          onClose={handleFormClose}
          courseBatch={selectedBatch}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('courseBatch.importCourseBatches', 'Import Course Batches')}
        description={t('courseBatch.importCourseBatchesDescription', 'Upload an Excel file (.xlsx, .xls) containing course batch data. Maximum file size is 5MB.')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('deleteCourseBatchTitle')}
        message={t('deleteCourseBatchConfirmation')}
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

export default CourseBatchList; 