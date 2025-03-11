import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { majorService } from '../../../services/api';
import MajorForm from './MajorForm';
import { useTranslation } from 'react-i18next';

const MajorList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'name', label: t('major.name'), minWidth: 200 },
    { 
      id: 'createdDate', 
      label: t('major.createdDate'), 
      minWidth: 150,
      render: (row) => new Date(row.createdDate).toLocaleDateString() 
    },
  ];
  
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
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
      setAlertInfo({
        open: true,
        message: t('common:fetchError', { resource: t('majors') }),
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
      setAlertInfo({
        open: true,
        message: t('major.majorDeleteError'),
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('majors')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('major.addMajor')}
        </Button>
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
      />

      {formOpen && (
        <MajorForm
          open={formOpen}
          onClose={handleFormClose}
          major={selectedMajor}
        />
      )}

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

export default MajorList;