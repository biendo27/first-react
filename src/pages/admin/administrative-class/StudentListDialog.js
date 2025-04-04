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
  
  // Update filters to include both student code and name search
  const [filters, setFilters] = useState({
    StudentCode: '',
    LastName: '',
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

  const handleClearSingleFilter = (name) => {
    setFilters(prev => ({
      ...prev,
      [name]: ''
    }));
    // Reset to first page when filters are cleared
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      StudentCode: '',
      LastName: '',
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
        {/* Enhanced filter section matching screenshot */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="StudentCode"
                placeholder={t('student.studentCode')}
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
                  endAdornment: filters.StudentCode ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClearSingleFilter('StudentCode')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="LastName"
                placeholder={t('student.fullName')}
                variant="outlined"
                size="small"
                value={filters.LastName}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: filters.LastName ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClearSingleFilter('LastName')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
            >
              {t('common:clearFilters')}
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%', overflow: 'hidden', pb: 0 }}>
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