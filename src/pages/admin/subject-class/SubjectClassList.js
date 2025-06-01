import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack, TextField, Grid, Paper, IconButton, Tooltip, CircularProgress, Autocomplete, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import PeopleIcon from '@mui/icons-material/People';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableViewIcon from '@mui/icons-material/TableView';
import GroupIcon from '@mui/icons-material/Group';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { subjectClassService, subjectService, classRoomService, administrativeClassService, handleApiError, subjectClassDetailService } from '../../../services/api';
import SubjectClassForm from './SubjectClassForm';
import SubjectClassStudentsDialog from './SubjectClassStudentsDialog';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api'; // Import API for baseURL

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
      id: 'dayOfWeek', 
      label: t('subjectClass.dayOfWeek'), 
      minWidth: 120,
      render: (row) => {
        // Map dayOfWeek values (2-8) to corresponding day names
        const dayMapping = {
          2: 'monday',
          3: 'tuesday',
          4: 'wednesday',
          5: 'thursday',
          6: 'friday',
          7: 'saturday',
          8: 'sunday'
        };
        
        const dayKey = dayMapping[row.dayOfWeek];
        return dayKey ? t(`common:days.${dayKey}`) : row.dayOfWeek;
      }
    },
    { 
      id: 'term', 
      label: t('subjectClass.term'), 
      minWidth: 80,
      render: (row) => row.term
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
          <Tooltip title={t('subjectClass.viewStudents')}>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={(e) => handleViewStudents(e, row)}
            >
              <PeopleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common:edit')}>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => handleEdit(row)}
            >
              <EditIcon />
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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [termFilter, setTermFilter] = useState('');
  const [selectedAdministrativeClassIds, setSelectedAdministrativeClassIds] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classRooms, setClassRooms] = useState([]);
  const [administrativeClasses, setAdministrativeClasses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Generate term filter options
  const termOptions = [
    { value: '', label: t('common:all') },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
  ];

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const [subjectsResponse, classRoomsResponse, administrativeClassesResponse] = await Promise.all([
        subjectService.getAll({ PageSize: 10000 }),
        classRoomService.getAll({ PageSize: 10000 }),
        administrativeClassService.getAll({ PageSize: 10000 })
      ]);
      
      setSubjects(subjectsResponse.data || []);
      setClassRooms(classRoomsResponse.data || []);
      setAdministrativeClasses(administrativeClassesResponse.data || []);
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

  // Custom function to fetch subject classes with multiple administrative class IDs
  const fetchSubjectClassesWithParams = useCallback(async () => {
    setLoading(true);
    try {
      // Create URLSearchParams for proper query string formatting
      const searchParams = new URLSearchParams();
      
      // Add regular params
      searchParams.append('PageIndex', page);
      searchParams.append('PageSize', pageSize);
      
      if (nameFilter) searchParams.append('Name', nameFilter);
      if (subjectId) searchParams.append('SubjectId', subjectId);
      if (classRoomId) searchParams.append('ClassRoomId', classRoomId);
      if (startDate) searchParams.append('StartDate', startDate.toISOString());
      if (endDate) searchParams.append('EndDate', endDate.toISOString());
      if (termFilter) searchParams.append('Term', termFilter);
      
      // Add multiple administrative class IDs with the same parameter name
      if (selectedAdministrativeClassIds.length > 0) {
        selectedAdministrativeClassIds.forEach(id => {
          searchParams.append('AdministrativeClassIds', id);
        });
      }
      
      // Build the URL with the formatted query string
      const url = `${api.defaults.baseURL}/v1/subject-classes?${searchParams.toString()}`;
      console.log('Fetching subject classes with URL:', url);
      
      // Make the fetch request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSubjectClasses(data.data || []);
      setTotalCount(data.totalCount || 0);
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
  }, [page, pageSize, nameFilter, subjectId, classRoomId, startDate, endDate, termFilter, selectedAdministrativeClassIds, t]);

  // Fetch classes when filters change
  useEffect(() => {
    fetchSubjectClassesWithParams();
  }, [fetchSubjectClassesWithParams]);

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
      fetchSubjectClassesWithParams();
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
      fetchSubjectClassesWithParams();
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

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value ? new Date(event.target.value) : null);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value ? new Date(event.target.value) : null);
  };

  const handleTermChange = (event, value) => {
    setTermFilter(value ? value.value : '');
  };

  // Updated to support multiple administrative class selection
  const handleAdministrativeClassChange = (event, newValues) => {
    const selectedIds = newValues.map(item => item.value).filter(id => id !== '');
    setSelectedAdministrativeClassIds(selectedIds);
    setPage(1);
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setSubjectId('');
    setClassRoomId('');
    setStartDate(null);
    setEndDate(null);
    setTermFilter('');
    setSelectedAdministrativeClassIds([]);
    setPage(1);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Export menu handlers
  const handleOpenExportMenu = (event) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchorEl(null);
  };

  // Helper function to download exported file
  const downloadExportFile = (base64Data, fileName) => {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
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
    link.download = fileName;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
  };

  // Custom function for timetable export
  const exportTimeTable = async () => {
    try {
      // Create URLSearchParams
      const searchParams = new URLSearchParams();
      
      if (nameFilter) searchParams.append('Name', nameFilter);
      if (subjectId) searchParams.append('SubjectId', subjectId);
      if (classRoomId) searchParams.append('ClassRoomId', classRoomId);
      if (startDate) searchParams.append('StartDate', startDate.toISOString());
      if (endDate) searchParams.append('EndDate', endDate.toISOString());
      if (termFilter) searchParams.append('Term', termFilter);
      
      // Add multiple administrative class IDs
      if (selectedAdministrativeClassIds.length > 0) {
        selectedAdministrativeClassIds.forEach(id => {
          searchParams.append('AdministrativeClassIds', id);
        });
      }
      
      // Build the URL
      const url = `${api.defaults.baseURL}/v1/subject-classes/export-time-table?${searchParams.toString()}`;
      
      // Make the request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Use the helper function to download
      const fileName = data.fileName || `timetable-${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadExportFile(data.base64, fileName);
      
      handleCloseExportMenu();
      setAlertInfo({
        open: true,
        message: t('subjectClass.exportTimeTableSuccess'),
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

  // Export students list
  const exportStudentsList = async () => {
    try {
      // Create URLSearchParams
      const searchParams = new URLSearchParams();
      
      if (nameFilter) searchParams.append('Name', nameFilter);
      if (subjectId) searchParams.append('SubjectId', subjectId);
      if (classRoomId) searchParams.append('ClassRoomId', classRoomId);
      if (startDate) searchParams.append('StartDate', startDate.toISOString());
      if (endDate) searchParams.append('EndDate', endDate.toISOString());
      if (termFilter) searchParams.append('Term', termFilter);
      
      // Add multiple administrative class IDs
      if (selectedAdministrativeClassIds.length > 0) {
        selectedAdministrativeClassIds.forEach(id => {
          searchParams.append('AdministrativeClassIds', id);
        });
      }
      
      // Build the URL
      const url = `${api.defaults.baseURL}/v1/subject-class-details/export-subject-class-students?${searchParams.toString()}`;
      
      // Make the request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Use the helper function to download
      const fileName = data.fileName || `students-list-${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadExportFile(data.base64, fileName);
      
      handleCloseExportMenu();
      setAlertInfo({
        open: true,
        message: t('subjectClass.exportStudentsSuccess'),
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
            startIcon={showFilters ? <ClearIcon /> : <FilterAltIcon />}
            onClick={handleToggleFilters}
          >
            {showFilters ? t('common:hideFilters') : t('common:showFilters')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleOpenExportMenu}
          >
            {t('common:export')}
          </Button>
          <Menu
            anchorEl={exportMenuAnchorEl}
            open={Boolean(exportMenuAnchorEl)}
            onClose={handleCloseExportMenu}
          >
            <MenuItem onClick={exportTimeTable}>
              <ListItemIcon>
                <TableViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {t('subjectClass.exportTimeTable')}
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={exportStudentsList}>
              <ListItemIcon>
                <GroupIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {t('subjectClass.exportStudentsList')}
              </ListItemText>
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('subjectClass.addSubjectClass')}
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('subjectClass.name')}
                value={nameFilter}
                onChange={handleNameFilterChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
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
            
            <Grid item xs={12} sm={6} md={3}>
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
            
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={termOptions}
                getOptionLabel={(option) => option.label || ''}
                onChange={handleTermChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('subjectClass.term')}
                    variant="outlined"
                    size="small"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('subjectClass.startDate')}
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={handleStartDateChange}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
              
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('subjectClass.endDate')}
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={handleEndDateChange}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                id="administrativeClass"
                multiple
                options={[
                  { value: '', label: t('common:all') },
                  ...administrativeClasses.map(adminClass => ({ 
                    value: adminClass.id, 
                    label: adminClass.name 
                  }))
                ]}
                getOptionLabel={(option) => option.label || ''}
                value={
                  selectedAdministrativeClassIds.length > 0
                    ? selectedAdministrativeClassIds.map(id => {
                        const adminClass = administrativeClasses.find(c => c.id === id);
                        return adminClass 
                          ? { value: id, label: adminClass.name }
                          : { value: id, label: id }; // Fallback if class not found
                      })
                    : []
                }
                onChange={handleAdministrativeClassChange}
                loading={filtersLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('subjectClass.administrativeClass')}
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
              
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size="medium"
              >
                {t('common:clearFilters')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

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