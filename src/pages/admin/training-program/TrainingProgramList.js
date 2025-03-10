import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { trainingProgramService } from '../../../services/api';
import TrainingProgramForm from './TrainingProgramForm';

const columns = [
  { id: 'semester', label: 'Semester', minWidth: 100 },
  { id: 'academicYear', label: 'Academic Year', minWidth: 130 },
  { 
    id: 'subject', 
    label: 'Subject', 
    minWidth: 200,
    render: (row) => row.subject?.name || 'N/A'
  },
  { 
    id: 'major', 
    label: 'Major', 
    minWidth: 200,
    render: (row) => row.major?.name || 'N/A'
  },
  { 
    id: 'courseBatch', 
    label: 'Course Batch', 
    minWidth: 200,
    render: (row) => row.courseBatch?.name || 'N/A'
  },
];

const TrainingProgramList = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await trainingProgramService.getAll({
        PageIndex: page,
        PageSize: pageSize,
      });
      setPrograms(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to fetch training programs',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handlePageChange = (newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedProgram(null);
    setFormOpen(true);
  };

  const handleEdit = (program) => {
    setSelectedProgram(program);
    setFormOpen(true);
  };

  const handleDelete = (program) => {
    setSelectedProgram(program);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await trainingProgramService.delete(selectedProgram.id);
      setAlertInfo({
        open: true,
        message: 'Training program deleted successfully',
        severity: 'success',
      });
      fetchPrograms();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to delete training program',
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
      fetchPrograms();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Training Programs
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Training Program
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={programs}
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
        <TrainingProgramForm
          open={formOpen}
          onClose={handleFormClose}
          program={selectedProgram}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Training Program"
        message={`Are you sure you want to delete this training program?`}
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

export default TrainingProgramList;