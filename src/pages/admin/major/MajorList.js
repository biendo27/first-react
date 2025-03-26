import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { majorService, handleApiError } from '../../../services/api';
import MajorForm from './MajorForm';
import { useTranslation } from 'react-i18next';

const MajorList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'name', label: t('major.name'), minWidth: 200 },
    { id: 'majorCode', label: t('major.majorCode'), minWidth: 150 },
  ];
  
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchMajors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await majorService.getAll({
        PageIndex: page,
        PageSize: pageSize,
      });
      setMajors(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('majors') }));
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
    fetchMajors();
  }, [fetchMajors]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedMajor(null);
    setFormOpen(true);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleEdit = (major) => {
    setSelectedMajor(major);
    setFormOpen(true);
  };

  const handleDelete = (major) => {
    setSelectedMajor(major);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await majorService.delete(selectedMajor.id);
      setAlertInfo({
        open: true,
        message: t('major.majorDeleteSuccess'),
        severity: 'success',
      });
      fetchMajors();
    } catch (error) {
      const formattedError = handleApiError(error, t('major.majorDeleteError'));
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
      fetchMajors();
    }
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import for majors:', file.name);
      const result = await majorService.importFile(file);
      console.log('Import successful:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('major.importSuccess'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchMajors();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      const formattedError = handleApiError(error, t('major.importError'));
      
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
          {t('majors')}
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
            {t('major.addMajor')}
          </Button>
        </Stack>
      </Box>

      <DataTable
        columns={columns}
        data={majors}
        totalCount={totalCount}
        page={page - 1}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        resourceName="major"
      />

      {formOpen && (
        <MajorForm
          open={formOpen}
          onClose={handleFormClose}
          major={selectedMajor}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('major.importMajors', 'Import Majors')}
        description={t('major.importMajorsDescription', 'Upload an Excel file (.xlsx, .xls) containing major data. Maximum file size is 5MB.')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('major.deleteMajor')}
        message={t('major.deleteMajorConfirmation')}
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

export default MajorList;