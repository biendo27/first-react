import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography, Snackbar, Alert, TextField, Grid, MenuItem, FormControl, InputLabel, Select, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { academicRecordService } from '../../../services/api';
import AcademicRecordForm from './AcademicRecordForm';
import { useTranslation } from 'react-i18next';

const AcademicRecordList = () => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const currentLanguage = i18n.language;

  // Direct translation mappings
  const RESULT_TYPE_TRANSLATIONS = {
    NONE: {
      en: 'None',
      vi: 'Không'
    },
    DISQUALIFICATION: {
      en: 'Disqualification',
      vi: 'Không đạt'
    },
    PASSED: {
      en: 'Passed',
      vi: 'Đạt'
    },
    EXEMPTED: {
      en: 'Exempted',
      vi: 'Miễn học'
    }
  };

  // Function to directly get translations from the mapping
  const getDirectTranslation = (type) => {
    const lang = i18n.language === 'vi' ? 'vi' : 'en';
    return RESULT_TYPE_TRANSLATIONS[type]?.[lang] || type;
  };
  
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
    { id: 'xScore', label: t('academicRecord.xScore'), minWidth: 100 },
    { id: 'yScore', label: t('academicRecord.yScore'), minWidth: 100 },
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
      label: t('academicRecord.resultType'), 
      minWidth: 120,
      render: (row) => getDirectTranslation(row.resultType)
    },
  ], [t, i18n.language]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
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

  // Memoize the resultTypeOptions to prevent unnecessary re-renders
  const resultTypeOptions = useMemo(() => [
    { value: '', label: t('common:all') },
    { value: 'PASSED', label: getDirectTranslation('PASSED') },
    { value: 'DISQUALIFICATION', label: getDirectTranslation('DISQUALIFICATION') },
    { value: 'EXEMPTED', label: getDirectTranslation('EXEMPTED') },
  ], [t, i18n.language]);

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
      
      const response = await academicRecordService.getAll(params);
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('common:fetchError', { resource: t('academicRecords') }),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, studentCodeFilter, academicYearFilter, semesterFilter, resultTypeFilter, t]);

  // Fetch records when any filter or pagination changes
  useEffect(() => {
    fetchRecords();
  }, [page, pageSize, studentCodeFilter, academicYearFilter, semesterFilter, resultTypeFilter, fetchRecords]);

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
      setAlertInfo({
        open: true,
        message: t('academicRecord.deleteError'),
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

  const handleAcademicYearChange = (event) => {
    setAcademicYearFilter(event.target.value);
    setPage(1);
  };

  const handleSemesterChange = (event) => {
    setSemesterFilter(event.target.value);
    setPage(1);
  };

  const handleResultTypeChange = (event) => {
    setResultTypeFilter(event.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setStudentCodeFilter('');
    setAcademicYearFilter('');
    setSemesterFilter('');
    setResultTypeFilter('');
    setPage(1);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  };

  const yearOptions = generateYearOptions();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('academicRecords')}
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
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('academicRecord.studentCode')}
                variant="outlined"
                size="small"
                value={studentCodeFilter}
                onChange={handleStudentCodeChange}
                placeholder={t('common:onlyCode')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="academicYear-label">{t('academicRecord.academicYear')}</InputLabel>
                <Select
                  labelId="academicYear-label"
                  id="academicYear"
                  value={academicYearFilter}
                  label={t('academicRecord.academicYear')}
                  onChange={handleAcademicYearChange}
                >
                  <MenuItem value="">{t('common:all')}</MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="semester-label">{t('academicRecord.semester')}</InputLabel>
                <Select
                  labelId="semester-label"
                  id="semester"
                  value={semesterFilter}
                  label={t('academicRecord.semester')}
                  onChange={handleSemesterChange}
                >
                  <MenuItem value="">{t('common:all')}</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                    <MenuItem key={semester} value={semester}>{semester}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="resultType-label">{t('academicRecord.resultType')}</InputLabel>
                  <Select
                    labelId="resultType-label"
                    id="resultType"
                    value={resultTypeFilter}
                    label={t('academicRecord.resultType')}
                    onChange={handleResultTypeChange}
                  >
                    {resultTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                >
                  {t('common:clear')}
                </Button>
              </Box>
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