import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { educationModeService } from '../../../services/api';
import EducationModeForm from './EducationModeForm';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../../../services/api';

const EducationModeList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'name', label: t('common:name'), minWidth: 200 },
  ];
  
  const [educationModes, setEducationModes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedEducationMode, setSelectedEducationMode] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchEducationModes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await educationModeService.getAll({
        PageIndex: page,
        PageSize: pageSize,
      });
      setEducationModes(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('educationModes') }));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, t]);

  useEffect(() => {
    fetchEducationModes();
  }, [fetchEducationModes]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedEducationMode(null);
    setFormOpen(true);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleEdit = (educationMode) => {
    setSelectedEducationMode(educationMode);
    setFormOpen(true);
  };

  const handleDelete = (educationMode) => {
    setSelectedEducationMode(educationMode);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await educationModeService.delete(selectedEducationMode.id);
      setAlertInfo({
        open: true,
        message: t('educationMode.deleteSuccess'),
        severity: 'success',
      });
      fetchEducationModes();
    } catch (error) {
      const formattedError = handleApiError(error, t('educationMode.deleteError'));
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
      fetchEducationModes();
    }
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import in EducationModeList:', file);
      
      // Check if file is valid
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file object');
      }
      
      // Log file details for debugging
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      const result = await educationModeService.importFile(file);
      console.log('Import API response:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('educationMode.importSuccess'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchEducationModes();
      
      return result;
    } catch (error) {
      console.error('Import error in EducationModeList:', error);
      
      const formattedError = handleApiError(error, t('educationMode.importError'));
      console.log('Formatted error:', formattedError);
      
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
          {t('educationModes')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenImportDialog}
          >
            {t('common:fileImport.import')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('educationMode.addEducationMode')}
          </Button>
        </Stack>
      </Box>

      <DataTable
        columns={columns}
        data={educationModes}
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
        <EducationModeForm
          open={formOpen}
          onClose={handleFormClose}
          educationMode={selectedEducationMode}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('educationMode.importEducationModes')}
        description={t('educationMode.importEducationModesDescription')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('educationMode.deleteEducationMode')}
        message={t('educationMode.deleteEducationModeConfirmation')}
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

export default EducationModeList; 