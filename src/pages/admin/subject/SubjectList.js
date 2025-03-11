import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { subjectService } from '../../../services/api';
import SubjectForm from './SubjectForm';
import { useTranslation } from 'react-i18next';

const SubjectList = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  const columns = [
    { id: 'name', label: t('subject.name'), minWidth: 200 },
    { id: 'subjectCode', label: t('subject.subjectCode'), minWidth: 150 },
    { id: 'credit', label: t('subject.credit'), minWidth: 100 },
    { 
      id: 'type', 
      label: t('subject.type'), 
      minWidth: 150,
      render: (row) => row.type 
    },
  ];
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await subjectService.getAll({
        PageIndex: page,
        PageSize: pageSize,
      });
      setSubjects(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('common:fetchError', { resource: t('subjects') }),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, t]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedSubject(null);
    setFormOpen(true);
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormOpen(true);
  };

  const handleDelete = (subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await subjectService.delete(selectedSubject.id);
      setAlertInfo({
        open: true,
        message: t('subject.subjectDeleteSuccess'),
        severity: 'success',
      });
      fetchSubjects();
    } catch (error) {
      setAlertInfo({
        open: true,
        message: t('subject.subjectDeleteError'),
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
      fetchSubjects();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('subjects')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          {t('subject.addSubject')}
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={subjects}
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
        <SubjectForm
          open={formOpen}
          onClose={handleFormClose}
          subject={selectedSubject}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('subject.deleteSubject')}
        message={t('subject.deleteSubjectConfirmation')}
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

export default SubjectList; 