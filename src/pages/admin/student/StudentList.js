import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { studentService } from '../../../services/api';
import StudentForm from './StudentForm';

const columns = [
  { id: 'studentCode', label: 'Student Code', minWidth: 120 },
  { 
    id: 'name', 
    label: 'Full Name', 
    minWidth: 200,
    render: (row) => `${row.firstName} ${row.lastName}` 
  },
  { 
    id: 'dateOfBirth', 
    label: 'Date of Birth', 
    minWidth: 150,
    render: (row) => new Date(row.dateOfBirth).toLocaleDateString() 
  },
  { id: 'email', label: 'Email', minWidth: 200 },
  { id: 'phoneNumber', label: 'Phone', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 120 },
  { 
    id: 'administrativeClass',
    label: 'Class',
    minWidth: 150,
    render: (row) => row.administrativeClass?.name || 'N/A'
  },
];

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentService.getAll({
        PageIndex: page,
        PageSize: pageSize,
      });
      setStudents(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to fetch students',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, pageSize]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
  };

  const handleOpenForm = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };

  const handleDelete = (student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await studentService.delete(selectedStudent.id);
      setAlertInfo({
        open: true,
        message: 'Student deleted successfully',
        severity: 'success',
      });
      fetchStudents();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to delete student',
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
      fetchStudents();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Students
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Student
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={students}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {formOpen && (
        <StudentForm
          open={formOpen}
          onClose={handleFormClose}
          student={selectedStudent}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Student"
        message={`Are you sure you want to delete the student "${selectedStudent?.firstName} ${selectedStudent?.lastName}"?`}
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

export default StudentList; 