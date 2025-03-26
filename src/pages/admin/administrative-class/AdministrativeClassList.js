import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { administrativeClassService, handleApiError } from '../../../services/api';
import AdministrativeClassForm from './AdministrativeClassForm';
import { useTranslation } from 'react-i18next';

const AdministrativeClassList = () => {
  const { t } = useTranslation(['admin', 'common']);

  const columns = [
    { id: 'name', label: t('administrativeClass.name'), minWidth: 200 },
    { 
      id: 'courseBatch', 
      label: t('courseBatch'), 
      minWidth: 150,
      render: (row) => row.courseBatch?.name || 'N/A'
    },
    { 
      id: 'major', 
      label: t('major.name'), 
      minWidth: 150,
      render: (row) => row.major?.name || 'N/A'
    },
    { 
      id: 'educationMode', 
      label: t('educationModes'), 
      minWidth: 150,
      render: (row) => row.educationMode?.name || 'N/A'
    }
  ];

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await administrativeClassService.getAll({
        PageIndex: page,
        PageSize: pageSize,
      });
      setClasses(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('administrativeClasses') }));
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
    fetchClasses();
  }, [fetchClasses]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedClass(null);
    setFormOpen(true);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleEdit = (administrativeClass) => {
    setSelectedClass(administrativeClass);
    setFormOpen(true);
  };

  const handleDelete = (administrativeClass) => {
    setSelectedClass(administrativeClass);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await administrativeClassService.delete(selectedClass.id);
      setAlertInfo({
        open: true,
        message: t('administrativeClass.deleteSuccess'),
        severity: 'success',
      });
      fetchClasses();
    } catch (error) {
      const formattedError = handleApiError(error, t('administrativeClass.deleteError'));
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
      fetchClasses();
    }
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import for administrative classes:', file.name);
      const result = await administrativeClassService.importFile(file);
      console.log('Import successful:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('administrativeClass.importSuccess'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchClasses();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      const formattedError = handleApiError(error, t('administrativeClass.importError'));
      
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
          {t('administrativeClasses')}
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
            {t('administrativeClass.addAdministrativeClass')}
          </Button>
        </Stack>
      </Box>

      <DataTable
        columns={columns}
        data={classes}
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
        <AdministrativeClassForm
          open={formOpen}
          onClose={handleFormClose}
          administrativeClass={selectedClass}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('administrativeClass.importAdministrativeClasses', 'Import Administrative Classes')}
        description={t('administrativeClass.importAdministrativeClassesDescription', 'Upload an Excel file (.xlsx, .xls) containing administrative class data. Maximum file size is 5MB.')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('administrativeClass.deleteAdministrativeClass')}
        message={t('administrativeClass.deleteConfirmation', { name: selectedClass?.name })}
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

export default AdministrativeClassList;