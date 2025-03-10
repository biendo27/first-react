import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Snackbar, Alert, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { academicRecordService } from '../../../services/api';
import AcademicRecordForm from './AcademicRecordForm';

const columns = [
  { 
    id: 'student', 
    label: 'Student', 
    minWidth: 200,
    render: (row) => `${row.student?.firstName} ${row.student?.lastName} (${row.student?.studentCode})`
  },
  { 
    id: 'subject', 
    label: 'Subject', 
    minWidth: 200,
    render: (row) => `${row.subject?.name} (${row.subject?.subjectCode})`
  },
  { id: 'xScore', label: 'X Score', minWidth: 100 },
  { id: 'yScore', label: 'Y Score', minWidth: 100 },
  { id: 'zScore', label: 'Z Score', minWidth: 100 },
  { id: 'academicYear', label: 'Academic Year', minWidth: 150 },
  { 
    id: 'completionDate', 
    label: 'Completion Date', 
    minWidth: 150,
    render: (row) => row.completionDate ? new Date(row.completionDate).toLocaleDateString() : 'N/A'
  },
  { 
    id: 'resultType', 
    label: 'Result', 
    minWidth: 120,
    render: (row) => row.resultType
  },
];

const AcademicRecordList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState({
    studentId: '',
    subjectId: '',
    academicYear: '',
  });
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await academicRecordService.getAll({
        PageIndex: page,
        PageSize: pageSize,
        ...filters,
      });
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to fetch academic records',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, pageSize]);

  const handlePageChange = (newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormOpen(true);
  };

  const handleDelete = (record) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await academicRecordService.delete(selectedRecord.id);
      setAlertInfo({
        open: true,
        message: 'Academic record deleted successfully',
        severity: 'success',
      });
      fetchRecords();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Failed to delete academic record',
        severity: 'error',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormClose = (refreshData) => {
    setFormOpen(false);
    if (refreshData) {
      fetchRecords();
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    setPage(1);
    fetchRecords();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Academic Records
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Academic Record
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          name="academicYear"
          label="Academic Year"
          variant="outlined"
          size="small"
          value={filters.academicYear}
          onChange={handleFilterChange}
          type="number"
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
        >
          Search
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={records}
        totalCount={totalCount}
        page={page - 1}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {formOpen && (
        <AcademicRecordForm
          open={formOpen}
          onClose={handleFormClose}
          academicRecord={selectedRecord}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Academic Record"
        message={`Are you sure you want to delete this academic record?`}
        loading={deleteLoading}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
      >
        <Alert
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AcademicRecordList;