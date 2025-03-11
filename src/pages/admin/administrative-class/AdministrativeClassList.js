import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { administrativeClassService } from '../../../services/api';
import AdministrativeClassForm from './AdministrativeClassForm';

const columns = [
  { id: 'name', label: 'Name', minWidth: 200 },
  { 
    id: 'courseBatch', 
    label: 'Course Batch', 
    minWidth: 150,
    render: (row) => row.courseBatch?.name || 'N/A'
  },
  { 
    id: 'major', 
    label: 'Major', 
    minWidth: 150,
    render: (row) => row.major?.name || 'N/A'
  },
];

const AdministrativeClassList = () => {
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
        message: 'Failed to fetch classes',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

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
        message: 'Administrative class deleted successfully',
        severity: 'success',
      });
      fetchClasses();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to delete administrative class',
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
          Administrative Classes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Administrative Class
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
        title="Delete Administrative Class"
        message={`Are you sure you want to delete the administrative class "${selectedClass?.name}"?`}
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