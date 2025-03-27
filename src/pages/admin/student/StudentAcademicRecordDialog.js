import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { academicRecordService, handleApiError } from '../../../services/api';

const StudentAcademicRecordDialog = ({ open, onClose, student }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRecords = useCallback(async () => {
    if (!student) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await academicRecordService.getAll({
        StudentCode: student.studentCode,
        PageIndex: page,
        PageSize: pageSize,
      });
      
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      const formattedError = handleApiError(err, t('academicRecord.failedToLoad'));
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  }, [student, page, pageSize, t]);

  useEffect(() => {
    if (open) {
      fetchRecords();
    }
  }, [open, fetchRecords]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
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
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" noWrap>
            {t('academicRecord.studentRecords', { name: fullName, code: studentCode })}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flexGrow: 1, overflow: 'hidden', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ height: '100%' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('academicRecord.subject')}</TableCell>
                <TableCell>{t('academicRecord.zScore')}</TableCell>
                <TableCell>{t('academicRecord.academicYear')}</TableCell>
                <TableCell>{t('academicRecord.semester')}</TableCell>
                <TableCell>{t('academicRecord.resultType')}</TableCell>
                <TableCell>{t('academicRecord.completionDate')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {t('academicRecord.noRecordsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{`${record.subject?.name} (${record.subject?.subjectCode})`}</TableCell>
                    <TableCell>{record.zScore.toFixed(2)}</TableCell>
                    <TableCell>{record.academicYear}</TableCell>
                    <TableCell>{record.semester}</TableCell>
                    <TableCell>{t(`academicRecord.resultTypes.${record.resultType.toLowerCase()}`)}</TableCell>
                    <TableCell>
                      {record.completionDate ? new Date(record.completionDate).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangePageSize}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage={t('common:rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} ${t('common:of')} ${count}`
            }
          />
          <Button onClick={onClose} color="primary">
            {t('common:close')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

StudentAcademicRecordDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.object.isRequired,
};

export default StudentAcademicRecordDialog; 