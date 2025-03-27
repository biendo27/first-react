import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  IconButton,
  Alert,
  Grid,
  TextField,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import { academicRecordService, handleApiError } from '../../../services/api';
import AcademicRecordForm from './AcademicRecordForm';

const AcademicRecordDialog = ({ open, onClose, student }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Filters
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [resultType, setResultType] = useState('All');
  
  const fetchAcademicRecords = useCallback(async () => {
    if (!student) return;
    
    setLoading(true);
    setError('');
    
    try {
      const params = {
        StudentCode: student.studentCode,
        PageIndex: page,
        PageSize: rowsPerPage
      };
      
      if (academicYear) params.AcademicYear = academicYear;
      if (semester) params.Semester = semester;
      if (resultType !== 'All') params.ResultType = resultType;
      
      const response = await academicRecordService.getAll(params);
      
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      const formattedError = handleApiError(err, t('academicRecord.failedToLoadRecords'));
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  }, [student, page, rowsPerPage, academicYear, semester, resultType, t]);

  useEffect(() => {
    if (open) {
      fetchAcademicRecords();
    }
  }, [open, fetchAcademicRecords]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleAcademicYearChange = (event) => {
    setAcademicYear(event.target.value);
  };

  const handleSemesterChange = (event) => {
    setSemester(event.target.value);
  };

  const handleResultTypeChange = (event) => {
    setResultType(event.target.value);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchAcademicRecords();
  };

  const handleClearFilters = () => {
    setAcademicYear('');
    setSemester('');
    setResultType('All');
    setPage(1);
    // Fetch data with cleared filters
    setTimeout(fetchAcademicRecords, 0);
  };

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setFormOpen(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setFormOpen(true);
  };

  const handleFormClose = (refreshData) => {
    setFormOpen(false);
    if (refreshData) {
      fetchAcademicRecords();
    }
  };

  const fullName = student ? `${student.firstName} ${student.lastName}` : '';
  const studentCode = student?.studentCode || '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { 
          height: '85vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          maxWidth: '90vw'
        }
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" noWrap>
            {t('academicRecord.recordsForStudent', { name: fullName, code: studentCode })}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ 
        flexGrow: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        pb: 0
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('academicRecord.academicYear')}
                value={academicYear}
                onChange={handleAcademicYearChange}
                size="small"
              >
                <MenuItem value="">{t('common:all')}</MenuItem>
                {[...Array(10)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('academicRecord.semester')}
                value={semester}
                onChange={handleSemesterChange}
                size="small"
              >
                <MenuItem value="">{t('common:all')}</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    {t('academicRecord.semesterNumber', { number: sem })}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label={t('academicRecord.resultType')}
                value={resultType}
                onChange={handleResultTypeChange}
                size="small"
              >
                <MenuItem value="All">{t('common:all')}</MenuItem>
                <MenuItem value="Passed">{t('academicRecord.resultTypes.passed')}</MenuItem>
                <MenuItem value="Disqualification">{t('academicRecord.resultTypes.disqualification')}</MenuItem>
                <MenuItem value="Exempted">{t('academicRecord.resultTypes.exempted')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApplyFilters}
                  startIcon={<SearchIcon />}
                  sx={{ flexGrow: 1 }}
                >
                  {t('common:applyFilters')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ flexGrow: 1 }}
                >
                  {t('common:clearFilters')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddRecord}
          >
            {t('academicRecord.addAcademicRecord')}
          </Button>
        </Box>
        
        <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('academicRecord.subjectCode')}</TableCell>
                <TableCell>{t('academicRecord.subjectName')}</TableCell>
                <TableCell>{t('academicRecord.zScore')}</TableCell>
                <TableCell>{t('academicRecord.academicYear')}</TableCell>
                <TableCell>{t('academicRecord.semester')}</TableCell>
                <TableCell>{t('academicRecord.completionDate')}</TableCell>
                <TableCell>{t('academicRecord.resultType')}</TableCell>
                <TableCell align="center">{t('common:actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={30} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 3 }}>{t('academicRecord.noRecordsFound')}</Box>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.subject?.subjectCode || '-'}</TableCell>
                    <TableCell>{record.subject?.name || '-'}</TableCell>
                    <TableCell>{record.zScore.toFixed(2)}</TableCell>
                    <TableCell>{record.academicYear}</TableCell>
                    <TableCell>{record.semester}</TableCell>
                    <TableCell>{record.completionDate ? new Date(record.completionDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{t(`academicRecord.resultTypes.${record.resultType.toLowerCase()}`)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditRecord(record)}
                        title={t('common:edit')}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 1, py: 1 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page - 1} // Adjust for MUI's 0-based pagination
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t('common:rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} ${t('common:of')} ${count !== -1 ? count : `${t('common:moreThan')} ${to}`}`
            }
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common:close')}
        </Button>
      </DialogActions>
      
      {/* Form dialog for adding/editing records */}
      {formOpen && (
        <AcademicRecordForm
          open={formOpen}
          onClose={handleFormClose}
          student={student}
          academicRecord={selectedRecord}
        />
      )}
    </Dialog>
  );
};

AcademicRecordDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.object.isRequired,
};

export default AcademicRecordDialog; 