import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { studentService, handleApiError } from '../../../services/api';
import StudentForm from './StudentForm';
import SubjectExemptionDialog from './SubjectExemptionDialog';
import { useTranslation } from 'react-i18next';

const StudentList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'studentCode', label: t('student.studentCode'), minWidth: 120 },
    { 
      id: 'name', 
      label: t('student.fullName'), 
      minWidth: 200,
      render: (row) => `${row.firstName} ${row.lastName}` 
    },
    { 
      id: 'dateOfBirth', 
      label: t('student.dateOfBirth'), 
      minWidth: 150,
      render: (row) => new Date(row.dateOfBirth).toLocaleDateString() 
    },
    { id: 'email', label: t('student.email'), minWidth: 200 },
    { id: 'phoneNumber', label: t('student.phoneNumber'), minWidth: 150 },
    { 
      id: 'status', 
      label: t('student.status'), 
      minWidth: 120,
      render: (row) => row.status ? t(`student.statusTypes.${row.status.toLowerCase()}`) : t('common:noData')
    },
    { 
      id: 'administrativeClass',
      label: t('student.class'),
      minWidth: 150,
      render: (row) => row.administrativeClass?.name || 'N/A'
    },
  ];

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exemptionDialogOpen, setExemptionDialogOpen] = useState(false);
  const [selectedStudentForExemption, setSelectedStudentForExemption] = useState(null);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentService.getAll({
        PageIndex: page,
        PageSize: pageSize,
      });
      setStudents(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('students') }));
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
    fetchStudents();
  }, [fetchStudents]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
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

  const handleExemptionClick = (student) => {
    setSelectedStudentForExemption(student);
    setExemptionDialogOpen(true);
  };

  const handleExemptionDialogClose = () => {
    setExemptionDialogOpen(false);
    setSelectedStudentForExemption(null);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await studentService.delete(selectedStudent.id);
      setAlertInfo({
        open: true,
        message: t('student.studentDeleteSuccess'),
        severity: 'success',
      });
      fetchStudents();
    } catch (error) {
      const formattedError = handleApiError(error, t('student.studentDeleteError'));
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
      fetchStudents();
    }
  };

  const renderActions = (student) => (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Tooltip title={t('exemptionsButton')}>
        <IconButton 
          size="small" 
          color="secondary"
          onClick={() => handleExemptionClick(student)}
          sx={{ mr: 1 }}
        >
          <SyncIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('student.editStudent')}>
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleEdit(student)}
          sx={{ mr: 1 }}
        >
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('student.deleteStudent')}>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDelete(student)}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('students')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('student.addStudent')}
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={students}
        totalCount={totalCount}
        page={page - 1}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        renderActions={renderActions}
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
        title={t('student.deleteStudent')}
        message={t('student.deleteStudentConfirmation')}
        loading={deleteLoading}
      />

      {exemptionDialogOpen && selectedStudentForExemption && (
        <SubjectExemptionDialog
          open={exemptionDialogOpen}
          onClose={handleExemptionDialogClose}
          student={selectedStudentForExemption}
        />
      )}

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