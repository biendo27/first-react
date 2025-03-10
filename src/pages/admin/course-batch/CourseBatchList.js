import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { courseBatchService } from '../../../services/api';
import CourseBatchForm from './CourseBatchForm';

const columns = [
  { id: 'name', label: 'Name', minWidth: 200 },
  { 
    id: 'startTime', 
    label: 'Start Date', 
    minWidth: 150,
    render: (row) => new Date(row.startTime).toLocaleDateString()
  },
  { id: 'regularProgramDuration', label: 'Regular Duration (months)', minWidth: 180 },
  { id: 'maximumProgramDuration', label: 'Maximum Duration (months)', minWidth: 180 },
];

const CourseBatchList = () => {
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

  const fetchCourseBatches = async () => {
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
        message: 'Failed to fetch course batches',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseBatches();
  }, [page, pageSize]);

  const handlePageChange = (newPage) => {
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
        message: 'Course batch deleted successfully',
        severity: 'success',
      });
      fetchCourseBatches();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to delete course batch',
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
          Course Batches
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Course Batch
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
        title="Delete Course Batch"
        message={`Are you sure you want to delete the course batch "${selectedCourseBatch?.name}"?`}
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