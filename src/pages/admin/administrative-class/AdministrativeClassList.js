import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { administrativeClassService } from '../../../services/api';
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
  ];

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
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
      setAlertInfo({
        open: true,
        message: t('common:fetchError', { resource: t('administrativeClasses') }),
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
      setAlertInfo({
        open: true,
        message: t('administrativeClass.deleteError'),
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('administrativeClasses')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('administrativeClass.addAdministrativeClass')}
        </Button>
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

export default AdministrativeClassList;