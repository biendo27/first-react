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
  Chip
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
                  <Paper variant="outlined" sx={{ mb: 2 }}>
                    <List>
                      {students.map((student, index) => (
                        <React.Fragment key={student.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {student.firstName} {student.lastName}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" color="textSecondary">
                                  {student.studentCode}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                aria-label="delete"
                                onClick={() => handleRemoveStudent(student.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < students.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                  
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