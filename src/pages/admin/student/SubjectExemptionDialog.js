import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
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
  Tabs,
  Tab,
  Divider,
  Alert,
  TextField,
  Grid,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { subjectExemptionService, handleApiError } from '../../../services/api';
import ExemptionForm from './ExemptionForm';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`exemption-tabpanel-${index}`}
      aria-labelledby={`exemption-tab-${index}`}
      {...other}
      style={{ 
        display: value === index ? 'flex' : 'none', 
        flexDirection: 'column', 
        height: '100%', 
        minHeight: '400px',
        overflow: 'hidden'
      }}
    >
      {value === index && <Box sx={{ pt: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

// Create memoized table components to prevent unnecessary re-renders
const SubjectsTable = memo(({ subjects, loading, totalSubjects, handleAddExemption, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage, filters, handleFilterChange, handleClearSingleFilter, handleClearFilters }) => {
  const { t } = useTranslation(['admin', 'common']);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              placeholder={t('subject.name')}
              name="SubjectName"
              value={filters.SubjectName}
              onChange={handleFilterChange}
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
                endAdornment: filters.SubjectName ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleClearSingleFilter('SubjectName')}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              placeholder={t('subject.subjectCode')}
              name="SubjectCode"
              value={filters.SubjectCode}
              onChange={handleFilterChange}
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
                endAdornment: filters.SubjectCode ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleClearSingleFilter('SubjectCode')}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2} display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              fullWidth
            >
              {t('common:clearFilters')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('exemption.subjectCode')}</TableCell>
              <TableCell>{t('exemption.subjectName')}</TableCell>
              <TableCell>{t('exemption.credits')}</TableCell>
              <TableCell>{t('exemption.type')}</TableCell>
              <TableCell align="right">{t('common:actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box sx={{ py: 3 }}>{t('exemption.noSubjectsFound')}</Box>
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.subjectCode}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.credit}</TableCell>
                  <TableCell>{t(`subject.type${subject.type}`)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddExemption(subject)}
                    >
                      {t('exemption.addExemption')}
                    </Button>
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
          count={totalSubjects}
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
    </Box>
  );
});

const ExemptionsTable = memo(({ exemptions, exemptionsLoading, totalExemptions, handleEditExemption, exemptionsPage, exemptionsRowsPerPage, handleExemptionsChangePage, handleExemptionsChangeRowsPerPage }) => {
  const { t } = useTranslation(['admin', 'common']);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('exemption.subjectCode')}</TableCell>
              <TableCell>{t('exemption.subjectName')}</TableCell>
              <TableCell>{t('exemption.zScore')}</TableCell>
              <TableCell align="right">{t('common:actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exemptionsLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : exemptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Box sx={{ py: 3 }}>{t('exemption.noExemptionsFound')}</Box>
                </TableCell>
              </TableRow>
            ) : (
              exemptions.map((exemption) => (
                <TableRow key={exemption.id}>
                  <TableCell>{exemption.subject?.subjectCode || '-'}</TableCell>
                  <TableCell>{exemption.subject?.name || '-'}</TableCell>
                  <TableCell>{exemption.zScore.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditExemption(exemption)}
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
          count={totalExemptions}
          rowsPerPage={exemptionsRowsPerPage}
          page={exemptionsPage - 1} // Adjust for MUI's 0-based pagination
          onPageChange={handleExemptionsChangePage}
          onRowsPerPageChange={handleExemptionsChangeRowsPerPage}
          labelRowsPerPage={t('common:rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} ${t('common:of')} ${count !== -1 ? count : `${t('common:moreThan')} ${to}`}`
          }
        />
      </Box>
    </Box>
  );
});

// Add prop types
SubjectsTable.propTypes = {
  subjects: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  totalSubjects: PropTypes.number.isRequired,
  handleAddExemption: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  handleChangePage: PropTypes.func.isRequired,
  handleChangeRowsPerPage: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  handleFilterChange: PropTypes.func.isRequired,
  handleClearSingleFilter: PropTypes.func.isRequired,
  handleClearFilters: PropTypes.func.isRequired,
};

ExemptionsTable.propTypes = {
  exemptions: PropTypes.array.isRequired,
  exemptionsLoading: PropTypes.bool.isRequired,
  totalExemptions: PropTypes.number.isRequired,
  handleEditExemption: PropTypes.func.isRequired,
  exemptionsPage: PropTypes.number.isRequired,
  exemptionsRowsPerPage: PropTypes.number.isRequired,
  handleExemptionsChangePage: PropTypes.func.isRequired,
  handleExemptionsChangeRowsPerPage: PropTypes.func.isRequired,
};

const SubjectExemptionDialog = ({ open, onClose, student }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalSubjects, setTotalSubjects] = useState(0);
  
  // Subject filter states
  const [subjectFilters, setSubjectFilters] = useState({
    SubjectName: '',
    SubjectCode: ''
  });
  
  const [exemptions, setExemptions] = useState([]);
  const [exemptionsLoading, setExemptionsLoading] = useState(false);
  const [exemptionsPage, setExemptionsPage] = useState(1);
  const [exemptionsRowsPerPage, setExemptionsRowsPerPage] = useState(10);
  const [totalExemptions, setTotalExemptions] = useState(0);
  
  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExemption, setSelectedExemption] = useState(null);
  
  // State for filter values
  const [pendingYear, setPendingYear] = useState(new Date().getFullYear());
  const [pendingSemester, setPendingSemester] = useState('');

  // Use a ref to track if a specific action triggered the fetch
  const actionRef = useRef({ 
    type: null, // 'initial', 'pagination', 'filter', 'tabChange', 'formClose'
    filterApplied: false
  });

  const fetchSubjects = useCallback(async () => {
    if (!student) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Use the correct service method for subjects and include filters
      const response = await subjectExemptionService.getStudentSubjects({
        StudentCode: student.studentCode,
        PageIndex: page,
        PageSize: 10000,
        SubjectName: subjectFilters.SubjectName,
        SubjectCode: subjectFilters.SubjectCode
      });
      
      setSubjects(response.data || []);
      setTotalSubjects(response.totalCount || 0);
    } catch (err) {
      const formattedError = handleApiError(err, t('exemption.failedToLoadSubjects'));
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  }, [student, page, subjectFilters, t]);

  const fetchExemptions = useCallback(async () => {
    if (!student) return;
    
    setExemptionsLoading(true);
    setError('');
    
    try {
      let params = {
        StudentCode: student.studentCode,
        PageIndex: exemptionsPage,
        PageSize: exemptionsRowsPerPage
      };
      
      // Only add filter parameters if filters have been explicitly applied
      if (actionRef.current.filterApplied) {
        if (pendingYear) params.Year = pendingYear;
        if (pendingSemester) params.Semester = pendingSemester;
      }
      
      console.log('Fetching exemptions with params:', params, 'Action:', actionRef.current.type);
      
      const response = await subjectExemptionService.getExemptions(params);
      
      setExemptions(response.data || []);
      setTotalExemptions(response.totalCount || 0);
    } catch (err) {
      const formattedError = handleApiError(err, t('exemption.failedToLoadExemptions'));
      setError(formattedError.message);
    } finally {
      setExemptionsLoading(false);
    }
  }, [student, exemptionsPage, exemptionsRowsPerPage, pendingYear, pendingSemester, t]);

  // Load subjects when the dialog opens and on page/rowsPerPage/filter changes
  useEffect(() => {
    if (open && tabValue === 0) {
      actionRef.current.type = 'initial';
      fetchSubjects();
    }
  }, [open, tabValue, fetchSubjects]);

  // Load exemptions when necessary, controlled by the action type
  useEffect(() => {
    if (open && tabValue === 1) {
      // Only fetch if there's a specific trigger action (not just a re-render)
      if (actionRef.current.type) {
        fetchExemptions();
      }
    }
  }, [open, tabValue, fetchExemptions]);

  const handleChangePage = (event, newPage) => {
    actionRef.current.type = 'pagination';
    // MUI pagination is 0-based, but our API expects 1-based
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    actionRef.current.type = 'pagination';
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to first page
  };

  const handleExemptionsChangePage = (event, newPage) => {
    actionRef.current.type = 'pagination';
    // MUI pagination is 0-based, but our API expects 1-based
    setExemptionsPage(newPage + 1);
  };

  const handleExemptionsChangeRowsPerPage = (event) => {
    actionRef.current.type = 'pagination';
    setExemptionsRowsPerPage(parseInt(event.target.value, 10));
    setExemptionsPage(1); // Reset to first page
  };

  const handleTabChange = (event, newValue) => {
    actionRef.current.type = 'tabChange';
    setTabValue(newValue);
  };

  // Add handlers for subject filters
  const handleSubjectFilterChange = (event) => {
    const { name, value } = event.target;
    setSubjectFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filter changes
    setPage(1);
  };

  const handleClearSubjectFilters = () => {
    setSubjectFilters({
      SubjectName: '',
      SubjectCode: ''
    });
    setPage(1); // Reset to first page
  };

  const handleClearSingleSubjectFilter = (name) => {
    setSubjectFilters(prev => ({
      ...prev,
      [name]: ''
    }));
    setPage(1); // Reset to first page
  };

  const handleAddExemption = (subject) => {
    setSelectedSubject(subject);
    setSelectedExemption(null);
    setFormOpen(true);
  };

  const handleEditExemption = (exemption) => {
    setSelectedExemption(exemption);
    setSelectedSubject(null);
    setFormOpen(true);
  };

  const handleFormClose = useCallback((refreshData) => {
    setFormOpen(false);
    setSelectedSubject(null);
    setSelectedExemption(null);
    
    if (refreshData) {
      // Reset error state when form closes with success
      setError('');
      
      // Refresh data based on active tab
      if (tabValue === 0) {
        fetchSubjects();
      } else {
        fetchExemptions();
      }
    }
  }, [tabValue, fetchSubjects, fetchExemptions]);

  // Update only the pending state, not the actual filters
  const handleYearChange = (newYear) => {
    setPendingYear(newYear);
  };

  // Update only the pending state, not the actual filters
  const handleSemesterChange = (newSemester) => {
    setPendingSemester(newSemester);
  };

  // Apply the filters only when the button is clicked
  const handleFilterApply = () => {
    setExemptionsPage(1); // Reset to first page when applying filters
    
    // Set action type and filterApplied flag before triggering fetch
    actionRef.current = {
      type: 'filter',
      filterApplied: true
    };
    
    // Manually call fetchExemptions to ensure it uses the updated state
    fetchExemptions();
  };

  // Clear filters and reset to default state
  const handleClearFilters = () => {
    const currentYear = new Date().getFullYear();
    
    // Update both pending and actual state
    setPendingYear(currentYear);
    setPendingSemester('');
    setExemptionsPage(1);
    
    // Set action type and reset filterApplied flag before triggering fetch
    actionRef.current = {
      type: 'filter',
      filterApplied: false
    };
    
    // Manually call fetchExemptions to ensure it uses the updated state
    fetchExemptions();
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
            {t('exemption.forStudent', { name: fullName, code: studentCode })}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="exemption tabs">
          <Tab label={t('exemption.subjects')} id="exemption-tab-0" />
          <Tab label={t('exemption.exemptedSubjects')} id="exemption-tab-1" />
        </Tabs>
      </Box>
      
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
        
        <TabPanel value={tabValue} index={0}>
          <SubjectsTable 
            subjects={subjects}
            loading={loading}
            totalSubjects={totalSubjects}
            handleAddExemption={handleAddExemption}
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            filters={subjectFilters}
            handleFilterChange={handleSubjectFilterChange}
            handleClearSingleFilter={handleClearSingleSubjectFilter}
            handleClearFilters={handleClearSubjectFilters}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
            <Box sx={{ width: { xs: '100%', sm: '30%' } }}>
              <Autocomplete
                id="academicYear"
                options={[
                  { value: '', label: t('common:all') },
                  ...[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return { value: year, label: year.toString() };
                  })
                ]}
                getOptionLabel={(option) => option.label || ''}
                value={pendingYear ? 
                  { value: pendingYear, label: pendingYear.toString() } : 
                  { value: '', label: t('common:all') }
                }
                onChange={(_, newValue) => {
                  handleYearChange(newValue ? newValue.value : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('academicRecord.academicYear')}
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '30%' } }}>
              <Autocomplete
                id="semester"
                options={[
                  { value: '', label: t('common:all') },
                  ...[1, 2, 3, 4, 5, 6, 7, 8].map(num => ({
                    value: num,
                    label: t('academicRecord.semesterNumber', { number: num })
                  }))
                ]}
                getOptionLabel={(option) => option.label || ''}
                value={pendingSemester ? 
                  { value: pendingSemester, label: t('academicRecord.semesterNumber', { number: pendingSemester }) } : 
                  { value: '', label: t('common:all') }
                }
                onChange={(_, newValue) => {
                  handleSemesterChange(newValue ? newValue.value : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('academicRecord.semester')}
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Button 
                variant="contained" 
                onClick={handleFilterApply} 
                startIcon={<SearchIcon />}
              >
                {t('common:search')}
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
              >
                {t('common:clear')}
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ExemptionsTable 
              exemptions={exemptions}
              exemptionsLoading={exemptionsLoading}
              totalExemptions={totalExemptions}
              handleEditExemption={handleEditExemption}
              exemptionsPage={exemptionsPage}
              exemptionsRowsPerPage={exemptionsRowsPerPage}
              handleExemptionsChangePage={handleExemptionsChangePage}
              handleExemptionsChangeRowsPerPage={handleExemptionsChangeRowsPerPage}
            />
          </Box>
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('close')}
        </Button>
      </DialogActions>
      
      {formOpen && (
        <ExemptionForm
          open={formOpen}
          onClose={handleFormClose}
          student={student}
          subject={selectedSubject}
          exemption={selectedExemption}
        />
      )}
    </Dialog>
  );
};

SubjectExemptionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.object.isRequired,
};

export default SubjectExemptionDialog; 