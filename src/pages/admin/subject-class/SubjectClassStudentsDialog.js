import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Autocomplete,
  Paper,
  Snackbar,
  Alert,
  Pagination,
  Card,
  CardContent,
  Chip,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { subjectClassDetailService, studentService, handleApiError } from '../../../services/api';

const SubjectClassStudentsDialog = ({ open, onClose, subjectClass }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch students in class
  const fetchClassStudents = useCallback(async () => {
    if (!subjectClass?.id) return;
    
    setLoading(true);
    try {
      const params = {
        SubjectClassId: subjectClass.id,
        PageIndex: page,
        PageSize: pageSize
      };
      
      const response = await subjectClassDetailService.getClassStudents(params);
      setStudents(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('subjectClass.noStudentsFound'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [subjectClass, page, pageSize, t]);

  // Fetch all students for autocomplete
  const fetchAllStudents = useCallback(async (searchTerm = '') => {
    setLoadingAllStudents(true);
    try {
      const params = {
        PageSize: 20,
        PageIndex: 1
      };
      
      if (searchTerm) {
        params.SearchTerm = searchTerm;
      }
      
      const response = await studentService.getAll(params);
      setAllStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingAllStudents(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchClassStudents();
    }
  }, [open, fetchClassStudents]);

  const handleCloseAlert = () => {
    setAlertInfo(prev => ({ ...prev, open: false }));
  };

  const handleStudentSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 2) {
      fetchAllStudents(value);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudent) return;
    
    setAddingStudent(true);
    try {
      await subjectClassDetailService.addStudentToClass({
        subjectClassId: subjectClass.id,
        studentId: selectedStudent.id
      });
      
      setAlertInfo({
        open: true,
        message: t('subjectClass.addStudentSuccess'),
        severity: 'success',
      });
      
      // Reset form and refresh list
      setSelectedStudent(null);
      fetchClassStudents();
    } catch (error) {
      const formattedError = handleApiError(error, t('subjectClass.addStudentError'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await subjectClassDetailService.removeStudentFromClass({
        subjectClassId: subjectClass.id,
        studentId: studentId
      });
      
      setAlertInfo({
        open: true,
        message: t('subjectClass.removeStudentSuccess'),
        severity: 'success',
      });
      
      // Refresh list
      fetchClassStudents();
    } catch (error) {
      const formattedError = handleApiError(error, t('subjectClass.removeStudentError'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {subjectClass ? (
            <Box>
              <Typography variant="h6" component="div">
                {t('subjectClass.studentsList', { name: subjectClass.name || '' })}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary" component="div">
                {subjectClass.subject?.name ? `${subjectClass.subject.name} (${subjectClass.subject.subjectCode})` : ''}
                {subjectClass.classRoom?.name && ` - ${subjectClass.classRoom.name}`}
              </Typography>
            </Box>
          ) : (
            t('subjectClass.studentsList', { name: '' })
          )}
        </DialogTitle>
        
        <DialogContent dividers>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('subjectClass.addStudent')}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Autocomplete
                  fullWidth
                  value={selectedStudent}
                  onChange={(event, newValue) => {
                    setSelectedStudent(newValue);
                  }}
                  options={allStudents}
                  getOptionLabel={(option) => 
                    option.studentCode && option.firstName && option.lastName
                      ? `${option.studentCode} - ${option.firstName} ${option.lastName}`
                      : ''
                  }
                  loading={loadingAllStudents}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('student.fullName')}
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {loadingAllStudents ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      onChange={handleStudentSearch}
                      value={searchTerm}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <Typography variant="body1">
                          {option.firstName} {option.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {option.studentCode}
                        </Typography>
                      </div>
                    </li>
                  )}
                />
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddStudent}
                  disabled={!selectedStudent || addingStudent}
                  sx={{ ml: 1, whiteSpace: 'nowrap', height: 56 }}
                >
                  {addingStudent ? <CircularProgress size={24} /> : t('common:add')}
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {t('subjectClass.students')}
                </Typography>
                <Chip 
                  label={`${t('common:total')}: ${totalCount}`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : students.length > 0 ? (
                <>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {students.map((student) => (
                      <Card 
                        key={student.id}
                        elevation={0}
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          position: 'relative',
                          overflow: 'visible',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <CardContent sx={{ p: 0 }}>
                          {/* Simple header */}
                          <Box sx={{ 
                            p: 3,
                            pb: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                {student.firstName} {student.lastName}
                              </Typography>
                              <Tooltip title={t('subjectClass.removeStudent')}>
                                <IconButton 
                                  onClick={() => handleRemoveStudent(student.id)}
                                  size="small"
                                  sx={{ 
                                    color: 'text.secondary',
                                    '&:hover': { 
                                      bgcolor: 'error.light',
                                      color: 'error.main'
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          {/* Content area */}
                          <Box sx={{ p: 3, pt: 2 }}>
                            <Box sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                              gap: 3,
                              alignItems: 'start'
                            }}>
                              {/* Left Column - Basic Info */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    borderRadius: 1, 
                                    bgcolor: 'grey.100',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'text.secondary',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                  }}>
                                    ID
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      {t('student.studentCode')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                      {student.studentCode}
                                    </Typography>
                                  </Box>
                                </Box>

                                {student.administrativeClass?.name && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      borderRadius: 1, 
                                      bgcolor: 'grey.100',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold'
                                    }}>
                                      CL
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        {t('student.class')}
                                      </Typography>
                                      <Chip 
                                        label={student.administrativeClass.name}
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          fontWeight: 500,
                                          bgcolor: 'background.paper',
                                          borderColor: 'divider'
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                )}
                              </Box>

                              {/* Right Column - Contact Info */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {student.email && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      borderRadius: 1, 
                                      bgcolor: 'grey.100',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold'
                                    }}>
                                      @
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        {t('student.email')}
                                      </Typography>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          fontWeight: 500, 
                                          color: 'text.primary',
                                          wordBreak: 'break-all'
                                        }}
                                      >
                                        {student.email}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}

                                {student.phoneNumber && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      borderRadius: 1, 
                                      bgcolor: 'grey.100',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold'
                                    }}>
                                      📞
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        {t('student.phoneNumber')}
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                        {student.phoneNumber}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}

                                {!student.email && !student.phoneNumber && (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    py: 2,
                                    borderRadius: 1,
                                    bgcolor: 'grey.50',
                                    border: '1px dashed',
                                    borderColor: 'grey.300'
                                  }}>
                                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                      {t('common:noContactInfo')}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={Math.ceil(totalCount / pageSize)} 
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="textSecondary">
                    {t('subjectClass.noStudentsFound')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} color="primary" variant="contained">
            {t('common:close')}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SubjectClassStudentsDialog; 