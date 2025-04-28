import React, { useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography, Snackbar, Alert, Stack, TextField, Grid, Paper, IconButton, Tooltip, CircularProgress, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { subjectClassService, subjectService, classRoomService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const TimeTableList = () => {
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
      minWidth: 100,
      align: 'center',
      disablePadding: true,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={t('common:delete')}>
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => handleRemove(row)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], [t]);
  
  // State for Subject Classes
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [selectedSubjectClasses, setSelectedSubjectClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedSubjectClass, setSelectedSubjectClass] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [findClassDialogOpen, setFindClassDialogOpen] = useState(false);
  
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

  // When component mounts, fetch filter options but NOT subject classes
  React.useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
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

  const handleFindClasses = () => {
    fetchSubjectClasses();
  };

  const handleOpenFindClassDialog = () => {
    // Reset filters and fetch options when opening the dialog
    handleClearFilters();
    fetchFilterOptions();
    setFindClassDialogOpen(true);
  };

  const handleCloseFindClassDialog = () => {
    setFindClassDialogOpen(false);
  };

  const handleAddToTimeTable = (subjectClass) => {
    // Check if already in the selected list
    if (!selectedSubjectClasses.find(sc => sc.id === subjectClass.id)) {
      setSelectedSubjectClasses(prev => [...prev, subjectClass]);
    }
  };

  const handleRemove = (subjectClass) => {
    setSelectedSubjectClass(subjectClass);
    setRemoveDialogOpen(true);
  };

  const confirmRemove = () => {
    setSelectedSubjectClasses(prev => prev.filter(sc => sc.id !== selectedSubjectClass.id));
    setRemoveDialogOpen(false);
  };

  const handleExportTimeTable = async () => {
    if (selectedSubjectClasses.length === 0) {
      setAlertInfo({
        open: true,
        message: t('timeTable.noClassesSelected'),
        severity: 'warning',
      });
      return;
    }

    try {
      const request = {
        subjectClassIds: selectedSubjectClasses.map(sc => sc.id)
      };
      
      const response = await subjectClassService.exportTimeTable(request);
      
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
      const fileName = response.fileName || `time-table-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = fileName;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      setAlertInfo({
        open: true,
        message: t('timeTable.exportSuccess'),
        severity: 'success',
      });
    } catch (error) {
      const formattedError = handleApiError(error, t('timeTable.exportError'));
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
        <Typography variant="h4" component="h1">{t('timeTable.title')}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleOpenFindClassDialog}
          >
            {t('timeTable.findClasses')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportTimeTable}
            disabled={selectedSubjectClasses.length === 0}
          >
            {t('timeTable.exportTimeTable')}
          </Button>
        </Stack>
      </Box>

      {/* Selected Subject Classes for Time Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>{t('timeTable.selectedClasses')}</Typography>
        <DataTable
          columns={columns}
          data={selectedSubjectClasses}
          loading={false}
          page={0}
          pageSize={50}
          totalCount={selectedSubjectClasses.length}
          hideFooter={selectedSubjectClasses.length <= 10}
        />
        {selectedSubjectClasses.length === 0 && (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {t('timeTable.noClassesAdded')}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Find Class Dialog */}
      <Dialog 
        open={findClassDialogOpen} 
        onClose={handleCloseFindClassDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>{t('timeTable.findClasses')}</DialogTitle>
        <DialogContent>
          {/* Filter Section */}
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

                  <Grid item>
                    <Button
                      variant="contained"
                      onClick={handleFindClasses}
                    >
                      {t('timeTable.search')}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>

          {/* Available Subject Classes */}
          <DataTable
            columns={[
              ...columns.slice(0, -1),
              {
                id: 'actions',
                label: t('common:actions'),
                minWidth: 100,
                align: 'center',
                disablePadding: true,
                render: (row) => (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title={t('timeTable.addToTimeTable')}>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleAddToTimeTable(row)}
                        disabled={selectedSubjectClasses.some(sc => sc.id === row.id)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )
              }
            ]}
            data={subjectClasses}
            loading={loading}
            page={page - 1}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFindClassDialog}>
            {t('common:close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        open={removeDialogOpen}
        title={t('timeTable.removeFromTimeTable')}
        content={t('timeTable.removeFromTimeTableConfirmation')}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveDialogOpen(false)}
        loading={removeLoading}
      />

      {/* Alert Snackbar */}
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

export default TimeTableList; 