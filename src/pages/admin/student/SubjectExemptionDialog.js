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
  MenuItem,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { subjectExemptionService } from '../../../services/api';
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
      style={{ height: '100%', minHeight: '400px' }}
    >
      {value === index && <Box sx={{ pt: 2, height: '100%' }}>{children}</Box>}
    </div>
  );
}

// Create memoized table components to prevent unnecessary re-renders
const SubjectsTable = memo(({ subjects, loading, totalSubjects, handleAddExemption, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage }) => {
  const { t } = useTranslation(['admin', 'common']);
  
  return (
    <>
      <TableContainer component={Paper} sx={{ minHeight: '300px', maxHeight: '50vh' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('exemption.subjectCode')}</TableCell>
              <TableCell>{t('exemption.subjectName')}</TableCell>
              <TableCell>{t('exemption.credits')}</TableCell>
              <TableCell>{t('exemption.type')}</TableCell>
              <TableCell align="right">{t('actions')}</TableCell>
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
                  <TableCell>{subject.type}</TableCell>
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalSubjects}
        rowsPerPage={rowsPerPage}
        page={page - 1} // Adjust for MUI's 0-based pagination
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={t('rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} ${t('of')} ${count !== -1 ? count : `${t('more than')} ${to}`}`
        }
      />
    </>
  );
});

const ExemptionsTable = memo(({ exemptions, exemptionsLoading, totalExemptions, handleEditExemption, exemptionsPage, exemptionsRowsPerPage, handleExemptionsChangePage, handleExemptionsChangeRowsPerPage }) => {
  const { t } = useTranslation(['admin', 'common']);
  
  return (
    <>
      <TableContainer component={Paper} sx={{ minHeight: '300px', maxHeight: '50vh' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('exemption.subjectCode')}</TableCell>
              <TableCell>{t('exemption.subjectName')}</TableCell>
              <TableCell>{t('exemption.xScore')}</TableCell>
              <TableCell>{t('exemption.yScore')}</TableCell>
              <TableCell>{t('exemption.zScore')}</TableCell>
              <TableCell>{t('exemption.result')}</TableCell>
              <TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exemptionsLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : exemptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 3 }}>{t('exemption.noExemptionsFound')}</Box>
                </TableCell>
              </TableRow>
            ) : (
              exemptions.map((exemption) => (
                <TableRow key={exemption.id}>
                  <TableCell>{exemption.subjectCode}</TableCell>
                  <TableCell>{exemption.subjectName}</TableCell>
                  <TableCell>{exemption.xScore.toFixed(2)}</TableCell>
                  <TableCell>{exemption.yScore.toFixed(2)}</TableCell>
                  <TableCell>{exemption.zScore.toFixed(2)}</TableCell>
                  <TableCell>{exemption.resultType}</TableCell>
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalExemptions}
        rowsPerPage={exemptionsRowsPerPage}
        page={exemptionsPage - 1} // Adjust for MUI's 0-based pagination
        onPageChange={handleExemptionsChangePage}
        onRowsPerPageChange={handleExemptionsChangeRowsPerPage}
        labelRowsPerPage={t('rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} ${t('of')} ${count !== -1 ? count : `${t('more than')} ${to}`}`
        }
      />
    </>
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
  const [exemptionYear, setExemptionYear] = useState(new Date().getFullYear());
  const [exemptionSemester, setExemptionSemester] = useState('');
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
      // Use the correct service method for subjects
      const response = await subjectExemptionService.getStudentSubjects({
        StudentCode: student.studentCode,
        PageIndex: page,
        PageSize: rowsPerPage,
      });
      
      setSubjects(response.data || []);
      setTotalSubjects(response.totalCount || 0);
    } catch (err) {
      setError(t('exemption.failedToLoadSubjects', { error: err.message || t('error.generic') }));
      console.error('Error loading subjects:', err);
    } finally {
      setLoading(false);
    }
  }, [student, page, rowsPerPage, t]);

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
        if (exemptionYear) params.Year = exemptionYear;
        if (exemptionSemester) params.Semester = exemptionSemester;
      }
      
      console.log('Fetching exemptions with params:', params, 'Action:', actionRef.current.type);
      
      const response = await subjectExemptionService.getExemptions(params);
      
      setExemptions(response.data || []);
      setTotalExemptions(response.totalCount || 0);
    } catch (err) {
      setError(t('exemption.failedToLoadExemptions', { error: err.message || t('error.generic') }));
      console.error('Error loading exemptions:', err);
    } finally {
      setExemptionsLoading(false);
    }
  }, [student, exemptionsPage, exemptionsRowsPerPage, exemptionYear, exemptionSemester, t]);

  // Load subjects when the dialog opens and on page/rowsPerPage changes
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

  const handleAddExemption = (subject) => {
    setSelectedSubject(subject);
    setSelectedExemption(null);
    setFormOpen(true);
  };

  const handleEditExemption = (exemption) => {
    setSelectedSubject(null);
    setSelectedExemption(exemption);
    setFormOpen(true);
  };

  const handleFormClose = (refresh = false) => {
    setFormOpen(false);
    if (refresh && tabValue === 1) {
      actionRef.current.type = 'formClose';
      // Don't change the filter state on form close
      fetchExemptions();
    }
  };

  // Update only the pending state, not the actual filters
  const handleYearChange = (event) => {
    setPendingYear(event.target.value);
  };

  // Update only the pending state, not the actual filters
  const handleSemesterChange = (event) => {
    setPendingSemester(event.target.value);
  };

  // Apply the filters only when the button is clicked
  const handleFilterApply = () => {
    setExemptionYear(pendingYear);
    setExemptionSemester(pendingSemester);
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
    setExemptionYear(currentYear);
    setExemptionSemester('');
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
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
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
        p: 2
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
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  select
                  fullWidth
                  label={t('exemption.academicYear')}
                  value={pendingYear}
                  onChange={handleYearChange}
                  size="small"
                >
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
              <Grid item xs={3}>
                <TextField
                  select
                  fullWidth
                  label={t('exemption.semester')}
                  value={pendingSemester}
                  onChange={handleSemesterChange}
                  size="small"
                >
                  <MenuItem value="">{t('exemption.allSemesters')}</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                    <MenuItem key={semester} value={semester}>
                      {t('exemption.semester')} {semester}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFilterApply}
                  startIcon={<SearchIcon />}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  {t('applyFilters')}
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  {t('clearFilters')}
                </Button>
              </Grid>
            </Grid>
          </Box>
          
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