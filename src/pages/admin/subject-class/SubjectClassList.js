import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack, TextField, Grid, Paper, IconButton, Tooltip, CircularProgress, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import PeopleIcon from '@mui/icons-material/People';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { subjectClassService, subjectService, classRoomService, handleApiError } from '../../../services/api';
import SubjectClassForm from './SubjectClassForm';
import SubjectClassStudentsDialog from './SubjectClassStudentsDialog';
import { useTranslation } from 'react-i18next';

const SubjectClassList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  // Define columns with custom render functions
  const columns = useMemo(() => [
    { id: 'name', label: t('subjectClass.name'), minWidth: 150 },
    { 
      id: 'subject', 
      label: t('subjectClass.subject'), 
      minWidth: 150,
      render: (row) => `${row.subject?.name} (${row.subject?.subjectCode})`
    },
    { 
      id: 'classRoom', 
      label: t('subjectClass.classRoom'), 
      minWidth: 120,
      render: (row) => row.classRoom?.name || 'N/A'
    },
    { 
      id: 'startDate', 
      label: t('subjectClass.startDate'), 
      minWidth: 120,
      render: (row) => new Date(row.startDate).toLocaleDateString()
    },
    { 
      id: 'endDate', 
      label: t('subjectClass.endDate'), 
      minWidth: 120,
      render: (row) => new Date(row.endDate).toLocaleDateString()
    },
    { 
      id: 'lessons', 
      label: t('subjectClass.lessons'), 
      minWidth: 120,
      render: (row) => `${row.startLesson} - ${row.endLesson}`
    },
    { 
      id: 'studyType', 
      label: t('subjectClass.studyType'), 
      minWidth: 120,
      render: (row) => t(`subjectClass.studyTypes.${row.studyType.toLowerCase()}`)
    },
    {
      id: 'actions',
      label: t('common:actions'),
      minWidth: 150,
      align: 'center',
      disablePadding: true,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={t('common:edit')}>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => handleEdit(row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('subjectClass.viewStudents')}>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={(e) => handleViewStudents(e, row)}
            >
              <PeopleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common:delete')}>
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => handleDelete(row)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], [t]);
  
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSubjectClass, setSelectedSubjectClass] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [classRooms, setClassRooms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const [subjectsResponse, classRoomsResponse] = await Promise.all([
        subjectService.getAll({ PageSize: 10000 }),
        classRoomService.getAll({ PageSize: 10000 })
      ]);
      
      setSubjects(subjectsResponse.data || []);
      setClassRooms(classRoomsResponse.data || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('common:filters') }));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setFiltersLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch subject classes with filter
  const fetchSubjectClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        PageIndex: page,
        PageSize: pageSize,
      };
      
      if (nameFilter) params.Name = nameFilter;
      if (subjectId) params.SubjectId = subjectId;
      if (classRoomId) params.ClassRoomId = classRoomId;
      
      const response = await subjectClassService.getAll(params);
      setSubjectClasses(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('subjectClasses') }));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, nameFilter, subjectId, classRoomId, t]);

  // Fetch classes when filters change
  useEffect(() => {
    fetchSubjectClasses();
  }, [fetchSubjectClasses]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedSubjectClass(null);
    setFormOpen(true);
  };

  const handleEdit = (subjectClass) => {
    setSelectedSubjectClass(subjectClass);
    setFormOpen(true);
  };

  const handleDelete = (subjectClass) => {
    setSelectedSubjectClass(subjectClass);
    setDeleteDialogOpen(true);
  };

  const handleViewStudents = (e, subjectClass) => {
    e.stopPropagation(); // Prevent triggering row selection
    setSelectedSubjectClass(subjectClass);
    setStudentsDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await subjectClassService.delete(selectedSubjectClass.id);
      setAlertInfo({
        open: true,
        message: t('subjectClass.deleteSuccess'),
        severity: 'success',
      });
      fetchSubjectClasses();
    } catch (error) {
      const formattedError = handleApiError(error, t('subjectClass.deleteError'));
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
      fetchSubjectClasses();
    }
  };

  const handleStudentsDialogClose = () => {
    setStudentsDialogOpen(false);
  };

  const handleNameFilterChange = (event) => {
    setNameFilter(event.target.value);
  };

  const handleSubjectChange = (event, value) => {
    setSubjectId(value ? value.id : '');
  };

  const handleClassRoomChange = (event, value) => {
    setClassRoomId(value ? value.id : '');
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setSubjectId('');
    setClassRoomId('');
    setPage(1);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (nameFilter) params.Name = nameFilter;
      if (subjectId) params.SubjectId = subjectId;
      if (classRoomId) params.ClassRoomId = classRoomId;
      
      const response = await subjectClassService.export(params);
      
      // Convert base64 to blob
      const byteCharacters = atob(response.base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Use the fileName from the response, or create a default one
      const fileName = response.fileName || `subject-classes-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = fileName;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      setAlertInfo({
        open: true,
        message: t('subjectClass.exportSuccess'),
        severity: 'success',
      });
    } catch (error) {
      const formattedError = handleApiError(error, t('subjectClass.exportError'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">{t('subjectClass.title')}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            {t('common:export')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('subjectClass.addSubjectClass')}
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="outlined"
              startIcon={showFilters ? <ClearIcon /> : <FilterAltIcon />}
              onClick={handleToggleFilters}
            >
              {showFilters ? t('common:hideFilters') : t('common:showFilters')}
            </Button>
          </Grid>
          
          {showFilters && (
            <>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label={t('subjectClass.name')}
                  value={nameFilter}
                  onChange={handleNameFilterChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  options={subjects}
                  getOptionLabel={(option) => option.name ? `${option.name} (${option.subjectCode})` : ''}
                  onChange={handleSubjectChange}
                  loading={filtersLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('subjectClass.subject')}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {filtersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  options={classRooms}
                  getOptionLabel={(option) => option.name || ''}
                  onChange={handleClassRoomChange}
                  loading={filtersLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('subjectClass.classRoom')}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {filtersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                >
                  {t('common:clearFilters')}
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <DataTable
        columns={columns}
        data={subjectClasses}
        loading={loading}
        page={page - 1}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {formOpen && (
        <SubjectClassForm
          open={formOpen}
          onClose={handleFormClose}
          subjectClass={selectedSubjectClass}
        />
      )}

      {studentsDialogOpen && selectedSubjectClass && (
        <SubjectClassStudentsDialog
          open={studentsDialogOpen}
          onClose={handleStudentsDialogClose}
          subjectClass={selectedSubjectClass}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('subjectClass.deleteSubjectClass')}
        content={t('subjectClass.deleteSubjectClassConfirmation')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))} 
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubjectClassList; 