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
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Alert,
  Chip
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
  const [searchTerm, setSearchTerm] = useState('');
  
  const columns = [
    { 
      id: 'studentCode', 
      label: t('student.studentCode', 'Student Code'), 
      minWidth: 120 
    },
    { 
      id: 'firstName', 
      label: t('student.firstName', 'First Name'), 
      minWidth: 120 
    },
    { 
      id: 'lastName', 
      label: t('student.lastName', 'Last Name'), 
      minWidth: 120 
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
        SearchTerm: searchTerm
      });
      
      setStudents(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      const formattedError = handleApiError(err, t('student.failedToLoadStudents', 'Failed to load students'));
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  }, [administrativeClass, page, pageSize, searchTerm, t]);

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open, fetchStudents]);

  // Add a separate effect to handle searchTerm clearing
  useEffect(() => {
    if (searchTerm === '' && open) {
      fetchStudents();
    }
  }, [searchTerm, open, fetchStudents]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = () => {
    setPage(1);
    fetchStudents();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
    // fetchStudents will be triggered by the searchTerm effect
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              placeholder={t('student.searchPlaceholder', 'Search by name or student code')}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ 
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
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClearSearch}
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
              variant="contained" 
              color="primary" 
              sx={{ ml: 2 }}
              onClick={handleSearch}
            >
              {t('common:search')}
            </Button>
          </Box>
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