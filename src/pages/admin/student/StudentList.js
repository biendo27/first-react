import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack, TextField, Grid, Paper, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { studentService, handleApiError } from '../../../services/api';
import StudentForm from './StudentForm';
import SubjectExemptionDialog from './SubjectExemptionDialog';
import StudentAcademicRecordDialog from './StudentAcademicRecordDialog';
import { useTranslation } from 'react-i18next';

const StudentList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'studentCode', label: t('student.studentCode'), minWidth: 120 },
    { 
      id: 'fullName', 
      label: t('student.fullName'), 
      minWidth: 200,
      render: (row) => `${row.firstName} ${row.lastName}`
    },
    { 
      id: 'dateOfBirth', 
      label: t('student.dateOfBirth'), 
      minWidth: 120,
      render: (row) => new Date(row.dateOfBirth).toLocaleDateString()
    },
    { id: 'email', label: t('student.email'), minWidth: 180 },
    { 
      id: 'status', 
      label: t('student.status'), 
      minWidth: 120,
      render: (row) => t(`student.statusTypes.${row.status.toLowerCase()}`)
    },
    { 
      id: 'class', 
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exemptionDialogOpen, setExemptionDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [academicRecordDialogOpen, setAcademicRecordDialogOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    FirstName: '',
    LastName: '',
    StudentCode: '',
    AdministrativeClass: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
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
        ...filters
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
  }, [page, pageSize, filters, t]);

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

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleOpenExemptionDialog = (student) => {
    setSelectedStudent(student);
    setExemptionDialogOpen(true);
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

  const handleExemptionDialogClose = () => {
    setExemptionDialogOpen(false);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import for students:', file.name);
      const result = await studentService.importFile(file);
      console.log('Import successful:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('student.importSuccess'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchStudents();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      const formattedError = handleApiError(error, t('student.importError'));
      
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
      throw formattedError;
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      FirstName: '',
      LastName: '',
      StudentCode: '',
      AdministrativeClass: ''
    });
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleExemptionButtonClick = (e, student) => {
    e.stopPropagation();
    handleOpenExemptionDialog(student);
  };

  const handleAcademicRecordButtonClick = (e, student) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setAcademicRecordDialogOpen(true);
  };

  const handleAcademicRecordDialogClose = () => {
    setAcademicRecordDialogOpen(false);
    setSelectedStudent(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('students')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilterAltIcon />}
            onClick={handleToggleFilters}
          >
            {showFilters ? t('common:hideFilters') : t('common:showFilters')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenImportDialog}
          >
            {t('common:fileImport.import')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('student.addStudent')}
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                name="StudentCode"
                label={t('student.studentCode')}
                variant="outlined"
                size="small"
                value={filters.StudentCode}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                name="FirstName"
                label={t('student.firstName')}
                variant="outlined"
                size="small"
                value={filters.FirstName}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                name="LastName"
                label={t('student.lastName')}
                variant="outlined"
                size="small"
                value={filters.LastName}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                name="AdministrativeClass"
                label={t('student.class')}
                variant="outlined"
                size="small"
                value={filters.AdministrativeClass}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                {t('common:clearFilters')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <DataTable
        columns={columns}
        data={students}
        totalCount={totalCount}
        page={page - 1}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={(row) => (
          <>
            <Tooltip title={t('exemptionsButton')}>
              <IconButton
                size="small"
                onClick={(e) => handleExemptionButtonClick(e, row)}
                color="primary"
              >
                <SchoolIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('academicRecordsButton')}>
              <IconButton
                size="small"
                onClick={(e) => handleAcademicRecordButtonClick(e, row)}
                color="primary"
              >
                <GradeIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      />

      {formOpen && (
        <StudentForm
          open={formOpen}
          onClose={handleFormClose}
          student={selectedStudent}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('student.importStudents', 'Import Students')}
        description={t('student.importStudentsDescription', 'Upload an Excel file (.xlsx, .xls) containing student data. Maximum file size is 5MB.')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

      {exemptionDialogOpen && selectedStudent && (
        <SubjectExemptionDialog
          open={exemptionDialogOpen}
          onClose={handleExemptionDialogClose}
          student={selectedStudent}
        />
      )}

      {academicRecordDialogOpen && selectedStudent && (
        <StudentAcademicRecordDialog
          open={academicRecordDialogOpen}
          onClose={handleAcademicRecordDialogClose}
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

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
          severity={alertInfo.severity}
          variant="filled"
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentList; 