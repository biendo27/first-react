import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { academicRecordService } from '../../../services/api';
import AcademicRecordForm from './AcademicRecordForm';
import { useTranslation } from 'react-i18next';

const AcademicRecordList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { 
      id: 'student', 
      label: t('academicRecord.student'), 
      minWidth: 200,
      render: (row) => `${row.student?.firstName} ${row.student?.lastName} (${row.student?.studentCode})`
    },
    { 
      id: 'subject', 
      label: t('academicRecord.subject'), 
      minWidth: 200,
      render: (row) => `${row.subject?.name} (${row.subject?.subjectCode})`
    },
    { id: 'xScore', label: t('academicRecord.xScore'), minWidth: 100 },
    { id: 'yScore', label: t('academicRecord.yScore'), minWidth: 100 },
    { id: 'zScore', label: t('academicRecord.zScore'), minWidth: 100 },
    { id: 'academicYear', label: t('academicRecord.academicYear'), minWidth: 150 },
    { 
      id: 'completionDate', 
      label: t('academicRecord.completionDate'), 
      minWidth: 150,
      render: (row) => row.completionDate ? new Date(row.completionDate).toLocaleDateString() : 'N/A'
    },
    { 
      id: 'resultType', 
      label: t('academicRecord.resultType'), 
      minWidth: 120,
      render: (row) => {
        const type = row.resultType;
        switch (type) {
          case 'None':
            return t('academicRecord.resultTypes.none');
          case 'Disqualification':
            return t('academicRecord.resultTypes.disqualification');
          case 'Passed':
            return t('academicRecord.resultTypes.passed');
          case 'Exempted':
            return t('academicRecord.resultTypes.exempted');
          default:
            return type;
        }
      }
    },
  ];

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Initialize searchInput with searchQuery for consistency
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        PageIndex: page,
        PageSize: pageSize,
      };
      
      if (searchQuery) {
        params.StudentCode = searchQuery;
      }
      
      const response = await academicRecordService.getAll(params);
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('common:fetchError', { resource: t('academicRecords') }),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, t]);

  // Replace with a single useEffect that calls fetchRecords when needed
  useEffect(() => {
    // This effect will run when page, pageSize, or searchQuery changes
    fetchRecords();
  }, [page, pageSize, searchQuery, fetchRecords]);

  const handlePageChange = (event, newPage) => {
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
        message: t('academicRecord.deleteSuccess'),
        severity: 'success',
      });
      fetchRecords();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('academicRecord.deleteError'),
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
    setSearchInput(event.target.value);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
    // We don't need to explicitly call fetchRecords here anymore
    // The useEffect will handle that when searchQuery changes
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('academicRecords')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('academicRecord.addAcademicRecord')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          label={t('academicRecord.searchByStudent')}
          variant="outlined"
          size="small"
          value={searchInput}
          onChange={handleFilterChange}
          onKeyDown={handleKeyPress}
          sx={{ mr: 1, flexGrow: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
        >
          {t('academicRecord.search')}
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
        title={t('academicRecord.deleteAcademicRecord')}
        message={t('academicRecord.deleteAcademicRecordConfirmation')}
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