import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack, TextField, Paper, InputAdornment, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { administrativeClassService, handleApiError } from '../../../services/api';
import AdministrativeClassForm from './AdministrativeClassForm';
import { useTranslation } from 'react-i18next';
import StudentListDialog from './StudentListDialog';

const AdministrativeClassList = () => {
  const { t } = useTranslation(['admin', 'common']);

  const columns = [
    { id: 'name', label: t('administrativeClass.name', 'Tên'), minWidth: 200 },
    { 
      id: 'courseBatch', 
      label: t('admin:courseBatch.displayName', 'Khóa Học'), 
      minWidth: 150,
      render: (row) => row.courseBatch?.name || 'N/A'
    },
    { 
      id: 'major', 
      label: t('major.name', 'Tên'), 
      minWidth: 150,
      render: (row) => row.major?.name || 'N/A'
    },
    { 
      id: 'educationMode', 
      label: t('admin:educationModes', 'Hệ đào tạo'), 
      minWidth: 150,
      render: (row) => row.educationMode?.name || 'N/A'
    },
    { 
      id: 'totalStudents', 
      label: t('admin:totalStudents', 'Total Students'), 
      minWidth: 150,
      align: 'center'
    },
    {
      id: 'actions',
      label: t('common:actions'),
      minWidth: 150,
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={t('common:viewStudents')}>
            <IconButton
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleViewStudents(row);
              }}
              size="small"
              sx={{ mx: 0.5 }}
            >
              <PeopleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common:edit')}>
            <IconButton
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              size="small"
              sx={{ mx: 0.5 }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common:delete')}>
            <IconButton
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              size="small"
              sx={{ mx: 0.5 }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Student list dialog state
  const [studentListOpen, setStudentListOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    Name: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
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
        ...filters
      });
      setClasses(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('administrativeClasses') }));
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

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleEdit = (administrativeClass) => {
    setSelectedClass(administrativeClass);
    setFormOpen(true);
  };

  const handleDelete = (administrativeClass) => {
    setSelectedClass(administrativeClass);
    setDeleteDialogOpen(true);
  };

  // Function to handle viewing students of a class
  const handleViewStudents = (administrativeClass) => {
    setSelectedClass(administrativeClass);
    setStudentListOpen(true);
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
      const formattedError = handleApiError(error, t('administrativeClass.deleteError'));
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
      fetchClasses();
    }
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      console.log('Starting file import for administrative classes:', file.name);
      const result = await administrativeClassService.importFile(file);
      console.log('Import successful:', result);
      
      setAlertInfo({
        open: true,
        message: result.message || t('administrativeClass.importSuccess'),
        severity: 'success',
      });
      
      // Refresh data after successful import
      fetchClasses();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      const formattedError = handleApiError(error, t('administrativeClass.importError'));
      
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
      throw formattedError;
    }
  };
  
  // Filter handlers
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      Name: ''
    });
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('administrativeClasses')}
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
            {t('common:import')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('administrativeClass.addAdministrativeClass')}
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder={t('common:name')}
              name="Name"
              value={filters.Name}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
              sx={{ 
                width: { xs: '100%', sm: '50%', md: '40%', lg: '30%' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.Name ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setFilters(prev => ({ ...prev, Name: '' }))}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ ml: 2 }}
            >
              {t('common:clearFilters')}
            </Button>
          </Box>
        </Paper>
      )}

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

      {studentListOpen && selectedClass && (
        <StudentListDialog
          open={studentListOpen}
          onClose={() => setStudentListOpen(false)}
          administrativeClass={selectedClass}
        />
      )}

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('administrativeClass.importAdministrativeClasses', 'Import Administrative Classes')}
        description={t('administrativeClass.importAdministrativeClassesDescription', 'Upload an Excel file (.xlsx, .xls) containing administrative class data. Maximum file size is 5MB.')}
        acceptedFileTypes=".xlsx, .xls"
        maxSize={5}
      />

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
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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

export default AdministrativeClassList;