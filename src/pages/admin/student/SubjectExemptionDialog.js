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
  Tabs,
  Tab,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
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
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const SubjectExemptionDialog = ({ open, onClose, student }) => {
  const [loading, setLoading] = useState(false);
  const [exemptionsLoading, setExemptionsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [exemptions, setExemptions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [exemptionsPage, setExemptionsPage] = useState(0);
  const [exemptionsRowsPerPage, setExemptionsRowsPerPage] = useState(5);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [totalExemptions, setTotalExemptions] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExemption, setSelectedExemption] = useState(null);
  const [exemptionYear, setExemptionYear] = useState(new Date().getFullYear());
  const [exemptionSemester, setExemptionSemester] = useState(null);
  const [error, setError] = useState(null);

  const fetchSubjects = useCallback(async () => {
    if (!student || !student.studentCode) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await subjectExemptionService.getStudentSubjects({
        StudentCode: student.studentCode,
        PageIndex: page + 1,
        PageSize: rowsPerPage,
      });
      setSubjects(response.data || []);
      setTotalSubjects(response.totalCount || 0);
    } catch (err) {
      console.error('Error fetching student subjects:', err);
      setError('Failed to load student subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [student, page, rowsPerPage]);

  const fetchExemptions = useCallback(async () => {
    if (!student || !student.studentCode) return;
    
    setExemptionsLoading(true);
    setError(null);
    try {
      const response = await subjectExemptionService.getExemptions({
        StudentCode: student.studentCode,
        Semester: exemptionSemester,
        Year: exemptionYear,
        PageIndex: exemptionsPage + 1,
        PageSize: exemptionsRowsPerPage,
      });
      setExemptions(response.data || []);
      setTotalExemptions(response.totalCount || 0);
    } catch (err) {
      console.error('Error fetching student exemptions:', err);
      setError('Failed to load subject exemptions. Please try again.');
    } finally {
      setExemptionsLoading(false);
    }
  }, [student, exemptionsPage, exemptionsRowsPerPage, exemptionSemester, exemptionYear]);

  useEffect(() => {
    if (open && tabValue === 0) {
      fetchSubjects();
    }
  }, [open, fetchSubjects, tabValue]);

  useEffect(() => {
    if (open && tabValue === 1) {
      fetchExemptions();
    }
  }, [open, fetchExemptions, tabValue]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExemptionsChangePage = (event, newPage) => {
    setExemptionsPage(newPage);
  };

  const handleExemptionsChangeRowsPerPage = (event) => {
    setExemptionsRowsPerPage(parseInt(event.target.value, 10));
    setExemptionsPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const handleFormClose = (refresh = false) => {
    setFormOpen(false);
    setSelectedSubject(null);
    setSelectedExemption(null);
    
    if (refresh) {
      if (tabValue === 0) {
        fetchSubjects();
      } else {
        fetchExemptions();
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Subject Exemptions - {student?.firstName} {student?.lastName} ({student?.studentCode})
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="exemption tabs">
          <Tab label="Available Subjects" id="exemption-tab-0" />
          <Tab label="Current Exemptions" id="exemption-tab-1" />
        </Tabs>
      </Box>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No subjects found
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
                          Add Exemption
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
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>X Score</TableCell>
                  <TableCell>Y Score</TableCell>
                  <TableCell>Z Score</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exemptionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : exemptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No exemptions found
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
            page={exemptionsPage}
            onPageChange={handleExemptionsChangePage}
            onRowsPerPageChange={handleExemptionsChangeRowsPerPage}
          />
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
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