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
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { studentService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import DataTable from '../../../components/common/DataTable';

const StudentListDialog = ({ open, onClose, administrativeClass }) => {
  const { t } = useTranslation(['admin', 'common']);
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  
  // Remove FirstName from filters, keep only LastName and StudentCode
  const [filters, setFilters] = useState({
    LastName: '',
    StudentCode: '',
  });
  
  const columns = [
    { 
      id: 'studentCode', 
      label: t('student.studentCode', 'Student Code'), 
      minWidth: 120 
    },
    { 
      id: 'fullName', 
      label: t('student.fullName', 'Full Name'), 
      minWidth: 200,
      // Merge firstName and lastName into a single column
      render: (row) => `${row.firstName} ${row.lastName}`
    },
    { 
      id: 'email', 
      label: t('student.email', 'Email'), 
      minWidth: 200 
    },
    { 
      id: 'phoneNumber', 
      label: t('student.phoneNumber', 'Phone Number'), 
      minWidth: 150 
    },
    { 
      id: 'status', 
      label: t('student.status', 'Status'), 
      minWidth: 120,
      render: (row) => (
        <Chip 
          label={t(`student.statusTypes.${row.status.toLowerCase()}`)} 
          color={
            row.status === 'Active' ? 'success' : 
            row.status === 'Graduated' ? 'primary' : 
            'error'
          }
          size="small"
          variant="outlined"
        />
      )
    }
  ];

  const fetchStudents = useCallback(async () => {
    if (!administrativeClass?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await studentService.getAll({
        AdministrativeClassId: administrativeClass.id,
        PageIndex: page,
        PageSize: pageSize,
        ...filters
      });
      
      setStudents(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      const formattedError = handleApiError(err, t('student.failedToLoadStudents', 'Failed to load students'));
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  }, [administrativeClass, page, pageSize, filters, t]);

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open, fetchStudents]);

  // Add effect to trigger fetch when filters change
  useEffect(() => {
    if (open) {
      const handler = setTimeout(() => {
        fetchStudents();
      }, 300); // Debounce by 300ms to prevent too many requests
      
      return () => {
        clearTimeout(handler);
      };
    }
  }, [filters, open, fetchStudents]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filters change
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      LastName: '',
      StudentCode: '',
    });
    // Reset to first page when filters are cleared
    setPage(1);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column',
          maxWidth: '90vw'
        }
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {t('administrativeClass.studentsInClass', 'Students in Class')}: {administrativeClass?.name}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="StudentCode"
                label={t('student.studentCode')}
                variant="outlined"
                size="small"
                value={filters.StudentCode}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={students}
            totalCount={totalCount}
            page={page - 1}
            pageSize={pageSize}
            loading={loading}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            emptyMessage={t('student.noStudentsFound', 'No students found')}
            disableActions={true}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common:close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

StudentListDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  administrativeClass: PropTypes.object.isRequired,
};

export default StudentListDialog; 