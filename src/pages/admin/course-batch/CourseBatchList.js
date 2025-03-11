import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { courseBatchService } from '../../../services/api';
import CourseBatchForm from './CourseBatchForm';
import { useTranslation } from 'react-i18next';

const CourseBatchList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  // Convert months to years for display with proper formatting
  const formatYears = (months) => {
    const years = months / 12;
    
    // For exact years, show without decimal
    if (years % 1 === 0) {
      return years.toFixed(0);
    }
    
    // For half years, show as x.5
    if (years * 2 % 1 === 0) {
      return years.toFixed(1);
    }
    
    // Otherwise show with up to 2 decimal places
    return years.toFixed(2);
  };
  
  const columns = [
    { id: 'name', label: t('common:name'), minWidth: 200 },
    { 
      id: 'startTime', 
      label: t('startDate', 'Start Date'), 
      minWidth: 150,
      render: (row) => new Date(row.startTime).toLocaleDateString()
    },
    { 
      id: 'regularProgramDuration', 
      label: t('regularDuration', 'Regular Duration (years)'), 
      minWidth: 180,
      render: (row) => formatYears(row.regularProgramDuration)
    },
    { 
      id: 'maximumProgramDuration', 
      label: t('maximumDuration', 'Maximum Duration (years)'), 
      minWidth: 180,
      render: (row) => formatYears(row.maximumProgramDuration)
    },
  ];

  const [courseBatches, setCourseBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCourseBatch, setSelectedCourseBatch] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
      });
      setCourseBatches(response.data || []);
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
  }, [page, pageSize, t]);

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
    setSelectedCourseBatch(null);
    setFormOpen(true);
  };

  const handleEdit = (courseBatch) => {
    setSelectedCourseBatch(courseBatch);
    setFormOpen(true);
  };

  const handleDelete = (courseBatch) => {
    setSelectedCourseBatch(courseBatch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await courseBatchService.delete(selectedCourseBatch.id);
      setAlertInfo({
        open: true,
        message: t('courseBatchDeleteSuccess', 'Course batch deleted successfully'),
        severity: 'success',
      });
      fetchCourseBatches();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('courseBatchDeleteError', 'Failed to delete course batch'),
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('admin:courseBatches', 'Course Batches')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('admin:addCourseBatch', 'Add Course Batch')}
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={courseBatches}
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
          courseBatch={selectedCourseBatch}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('deleteCourseBatchTitle', 'Delete Course Batch')}
        message={t('deleteCourseBatchConfirmation', 'Are you sure you want to delete this course batch?')}
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

export default CourseBatchList; 