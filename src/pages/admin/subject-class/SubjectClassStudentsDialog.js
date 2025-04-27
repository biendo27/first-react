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
  Alert
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
  const [pageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  
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
    setStudentSearch(value);
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

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {t('subjectClass.studentsList', { name: subjectClass?.name || '' })}
        </DialogTitle>
        
        <DialogContent dividers>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              {t('subjectClass.addStudent')}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                sx={{ ml: 1, whiteSpace: 'nowrap' }}
              >
                {addingStudent ? <CircularProgress size={24} /> : t('common:add')}
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            {t('subjectClass.students')}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : students.length > 0 ? (
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                {students.map((student, index) => (
                  <React.Fragment key={student.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${student.firstName} ${student.lastName}`}
                        secondary={student.studentCode}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < students.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="textSecondary">
                {t('subjectClass.noStudentsFound')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} color="primary">
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