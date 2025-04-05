import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography, Snackbar, Alert, TextField, Grid, Paper, CircularProgress, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { academicRecordService, administrativeClassService, handleApiError } from '../../../services/api';
import AcademicRecordForm from './AcademicRecordForm';
import { useTranslation } from 'react-i18next';

const AcademicRecordList = () => {
  const { t } = useTranslation(['admin', 'common']);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => [
    { 
      id: 'student', 
      label: t('academicRecord.student'), 
      minWidth: 200,
      render: (row) => `${row.student?.firstName} ${row.student?.lastName} (${row.student?.studentCode})`
    },
    { 
      id: 'subject', 
      label: t('academicRecord.subject'), 
      minWidth: 200,
      render: (row) => `${row.subject?.name} (${row.subject?.subjectCode})`
    },
    { id: 'zScore', label: t('academicRecord.zScore'), minWidth: 100 },
    { id: 'academicYear', label: t('academicRecord.academicYear'), minWidth: 150 },
    { id: 'semester', label: t('academicRecord.semester'), minWidth: 100 },
    { 
      id: 'completionDate', 
      label: t('academicRecord.completionDate'), 
      minWidth: 150,
      render: (row) => row.completionDate ? new Date(row.completionDate).toLocaleDateString() : 'N/A'
    },
    { 
      id: 'resultType', 
      label: t('academicRecord.result'), 
      minWidth: 120,
      render: (row) => row.resultType ? t(`academicRecord.resultTypes.${row.resultType.toLowerCase()}`) : t('common:noData')
    },
  ], [t]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Filter states
  const [studentCodeFilter, setStudentCodeFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [resultTypeFilter, setResultTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Update resultTypeOptions to use the same direct translation approach
  const resultTypeOptions = useMemo(() => [
    { value: '', label: t('common:all') },
    { value: 'PASSED', label: t('academicRecord.resultTypes.passed') },
    { value: 'DISQUALIFICATION', label: t('academicRecord.resultTypes.disqualification') },
    { value: 'EXEMPTED', label: t('academicRecord.resultTypes.exempted') },
  ], [t]);

  // Add new state for administrative class filter
  const [administrativeClasses, setAdministrativeClasses] = useState([]);
  const [selectedAdministrativeClassId, setSelectedAdministrativeClassId] = useState('');
  const [classesLoading, setClassesLoading] = useState(false);

  // Add function to fetch administrative classes
  const fetchAdministrativeClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const response = await administrativeClassService.getAll({ PageSize: 10000 });
      setAdministrativeClasses(response.data || []);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('administrativeClasses') }));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setClassesLoading(false);
    }
  }, [t]);

  // Add useEffect to fetch administrative classes when component mounts
  useEffect(() => {
    fetchAdministrativeClasses();
  }, [fetchAdministrativeClasses]);

  // Update fetchRecords to include the new filter
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        PageIndex: page,
        PageSize: pageSize,
      };
      
      if (studentCodeFilter) params.StudentCode = studentCodeFilter;
      if (academicYearFilter) params.AcademicYear = academicYearFilter;
      if (semesterFilter) params.Semester = semesterFilter;
      if (resultTypeFilter) params.ResultType = resultTypeFilter;
      if (selectedAdministrativeClassId) params.AdministrativeClassId = selectedAdministrativeClassId;
      
      const response = await academicRecordService.getAll(params);
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('academicRecords') }));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, studentCodeFilter, academicYearFilter, semesterFilter, resultTypeFilter, selectedAdministrativeClassId, t]);

  // Fetch records when any filter or pagination changes
  useEffect(() => {
    fetchRecords();
  }, [page, pageSize, studentCodeFilter, academicYearFilter, semesterFilter, resultTypeFilter, selectedAdministrativeClassId, fetchRecords]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormOpen(true);
  };

  const handleDelete = (record) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await academicRecordService.delete(selectedRecord.id);
      setAlertInfo({
        open: true,
        message: t('academicRecord.deleteSuccess'),
        severity: 'success',
      });
      fetchRecords();
    } catch (error) {
      const formattedError = handleApiError(error, t('academicRecord.deleteError'));
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
      fetchRecords();
    }
  };

  const handleStudentCodeChange = (event) => {
    setStudentCodeFilter(event.target.value);
    setPage(1);
  };

  const handleAcademicYearChange = (_, newValue) => {
    setAcademicYearFilter(newValue ? newValue.value : '');
    setPage(1);
  };

  const handleSemesterChange = (_, newValue) => {
    setSemesterFilter(newValue ? newValue.value : '');
    setPage(1);
  };

  const handleResultTypeChange = (_, newValue) => {
    setResultTypeFilter(newValue ? newValue.value : '');
    setPage(1);
  };

  const handleClearFilters = () => {
    setStudentCodeFilter('');
    setAcademicYearFilter('');
    setSemesterFilter('');
    setResultTypeFilter('');
    setSelectedAdministrativeClassId('');
    setPage(1);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: '', label: t('common:all') }];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push({ value: i, label: i.toString() });
    }
    return years;
  };

  const yearOptions = generateYearOptions();

  const semesterOptions = useMemo(() => [
    { value: '', label: t('common:all') },
    ...Array.from({ length: 8 }, (_, i) => ({ 
      value: i + 1, 
      label: t('academicRecord.semesterNumber', { number: i + 1 }) 
    }))
  ], [t]);

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      await academicRecordService.importFile(file);
      setAlertInfo({
        open: true,
        message: t('academicRecord.importSuccess'),
        severity: 'success',
      });
      fetchRecords();
      handleImportClose();
    } catch (error) {
      const formattedError = handleApiError(error, t('academicRecord.importError'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        PageIndex: page,
        PageSize: pageSize,
      };
      
      if (studentCodeFilter) params.StudentCode = studentCodeFilter;
      if (academicYearFilter) params.AcademicYear = academicYearFilter;
      if (semesterFilter) params.Semester = semesterFilter;
      if (resultTypeFilter) params.ResultType = resultTypeFilter;
      if (selectedAdministrativeClassId) params.AdministrativeClassId = selectedAdministrativeClassId;

      const response = await academicRecordService.export(params);
      
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
      const fileName = response.fileName || `academic-records-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = fileName;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      setAlertInfo({
        open: true,
        message: t('academicRecord.exportSuccess'),
        severity: 'success',
      });
    } catch (error) {
      const formattedError = handleApiError(error, t('academicRecord.exportError'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    }
  };

  // Add handler for administrative class change
  const handleAdministrativeClassChange = (_, newValue) => {
    setSelectedAdministrativeClassId(newValue ? newValue.value : '');
    setPage(1);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('academicRecord.title')}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilterAltIcon />}
            onClick={handleToggleFilters}
            sx={{ mr: 1 }}
          >
            {showFilters ? t('common:hideFilters') : t('common:showFilters')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenImportDialog}
            sx={{ mr: 1 }}
          >
            {t('academicRecord.importRecords')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            {t('academicRecord.exportRecords')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('academicRecord.addAcademicRecord')}
          </Button>
        </Box>
      </Box>

      {showFilters && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            backgroundColor: theme => theme.palette.background.default
          }}
        >
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                name="StudentCode"
                label={t('student.studentCode')}
                variant="outlined"
                size="small"
                value={studentCodeFilter}
                onChange={handleStudentCodeChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                id="academicYear"
                options={yearOptions}
                getOptionLabel={(option) => option.label || ''}
                value={yearOptions.find(option => option.value === academicYearFilter) || yearOptions[0]}
                onChange={handleAcademicYearChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('academicRecord.academicYear')}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                id="semester"
                options={semesterOptions}
                getOptionLabel={(option) => option.label || ''}
                value={semesterOptions.find(option => option.value === semesterFilter) || semesterOptions[0]}
                onChange={handleSemesterChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('academicRecord.semester')}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                id="resultType"
                options={resultTypeOptions}
                getOptionLabel={(option) => option.label || ''}
                value={resultTypeOptions.find(option => option.value === resultTypeFilter) || resultTypeOptions[0]}
                onChange={handleResultTypeChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('academicRecord.resultType')}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                id="administrativeClass"
                options={[
                  { value: '', label: t('common:all') },
                  ...administrativeClasses.map(adminClass => ({ 
                    value: adminClass.id, 
                    label: adminClass.name 
                  }))
                ]}
                getOptionLabel={(option) => option.label || ''}
                value={
                  administrativeClasses.find(c => c.id === selectedAdministrativeClassId) 
                    ? { value: selectedAdministrativeClassId, label: administrativeClasses.find(c => c.id === selectedAdministrativeClassId).name }
                    : { value: '', label: t('common:all') }
                }
                onChange={handleAdministrativeClassChange}
                loading={classesLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('student.class')}
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {classesLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
                sx={{ 
                  borderRadius: 1.5,
                  px: 3,
                  py: 1,
                  fontWeight: 500
                }}
              >
                {t('common:clearFilters')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <DataTable
        columns={columns}
        data={records}
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
        <AcademicRecordForm
          open={formOpen}
          onClose={handleFormClose}
          academicRecord={selectedRecord}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('academicRecord.deleteAcademicRecord')}
        message={t('academicRecord.deleteAcademicRecordConfirmation')}
        loading={deleteLoading}
      />

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('academicRecord.importRecords')}
        description={t('academicRecord.importDescription')}
        acceptedFormats={t('academicRecord.acceptedFormats')}
        maxFileSize={t('academicRecord.maxFileSize')}
        accept=".xlsx,.xls"
        maxSize={5}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))}
          severity={alertInfo.severity}
          variant="filled"
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AcademicRecordList;