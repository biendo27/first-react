import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { educationModeService } from '../../../services/api';
import EducationModeForm from './EducationModeForm';
import { useTranslation } from 'react-i18next';

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
      setAlertInfo({
        open: true,
        message: t('common:fetchError', { resource: t('educationModes') }),
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
      setAlertInfo({
        open: true,
        message: t('educationMode.deleteError'),
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('educationModes')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('educationMode.addEducationMode')}
        </Button>
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

export default EducationModeList; 