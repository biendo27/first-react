import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { majorService } from '../../../services/api';
import MajorForm from './MajorForm';

const columns = [
  { id: 'name', label: 'Name', minWidth: 200 },
  { 
    id: 'createdDate', 
    label: 'Created Date', 
    minWidth: 150,
    render: (row) => new Date(row.createdDate).toLocaleDateString() 
  },
];

const MajorList = () => {
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
        message: 'Failed to fetch majors',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  const handlePageChange = (newPage) => {
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
        message: 'Major deleted successfully',
        severity: 'success',
      });
      fetchMajors();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to delete major',
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
          Majors
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Major
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
        title="Delete Major"
        message={`Are you sure you want to delete the major "${selectedMajor?.name}"?`}
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