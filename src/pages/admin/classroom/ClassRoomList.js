import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography, Snackbar, Alert, TextField, Grid, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import FileImportDialog from '../../../components/common/FileImportDialog';
import { classRoomService, handleApiError } from '../../../services/api';
import ClassRoomForm from './ClassRoomForm';
import { useTranslation } from 'react-i18next';

const ClassRoomList = () => {
  const { t } = useTranslation(['admin', 'common']);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => [
    { 
      id: 'name', 
      label: t('classRoom.name'), 
      minWidth: 200,
    },
  ], [t]);

  const [classRooms, setClassRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClassRoom, setSelectedClassRoom] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Update fetchClassRooms to include the filter
  const fetchClassRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        PageIndex: page,
        PageSize: pageSize,
      };
      
      if (nameFilter) params.Name = nameFilter;
      
      const response = await classRoomService.getAll(params);
      setClassRooms(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:fetchError', { resource: t('classRooms') }));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, nameFilter, t]);

  // Fetch classRooms when any filter or pagination changes
  useEffect(() => {
    fetchClassRooms();
  }, [page, pageSize, nameFilter, fetchClassRooms]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleOpenForm = () => {
    setSelectedClassRoom(null);
    setFormOpen(true);
  };

  const handleEdit = (classRoom) => {
    setSelectedClassRoom(classRoom);
    setFormOpen(true);
  };

  const handleDelete = (classRoom) => {
    setSelectedClassRoom(classRoom);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await classRoomService.delete(selectedClassRoom.id);
      setAlertInfo({
        open: true,
        message: t('classRoom.deleteSuccess'),
        severity: 'success',
      });
      fetchClassRooms();
    } catch (error) {
      const formattedError = handleApiError(error, t('classRoom.deleteError'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
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
      fetchClassRooms();
    }
  };

  const handleNameChange = (event) => {
    setNameFilter(event.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setPage(1);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
  };

  const handleImportFile = async (file) => {
    try {
      await classRoomService.importFile(file);
      setAlertInfo({
        open: true,
        message: t('classRoom.importSuccess'),
        severity: 'success',
      });
      fetchClassRooms();
      return true;
    } catch (error) {
      const formattedError = handleApiError(error, t('classRoom.importError'));
      setAlertInfo({
        open: true,
        message: formattedError.message,
        severity: 'error',
      });
      return false;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">{t('classRoom.title')}</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenImportDialog}
            sx={{ mr: 1 }}
          >
            {t('common:fileImport.import')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('classRoom.addClassRoom')}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="outlined"
              startIcon={showFilters ? <ClearIcon /> : <FilterAltIcon />}
              onClick={handleToggleFilters}
            >
              {showFilters ? t('common:hideFilters') : t('common:showFilters')}
            </Button>
          </Grid>
          
          {showFilters && (
            <>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label={t('classRoom.name')}
                  value={nameFilter}
                  onChange={handleNameChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                >
                  {t('common:clearFilters')}
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <DataTable
        columns={columns}
        data={classRooms}
        loading={loading}
        page={page - 1}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {formOpen && (
        <ClassRoomForm
          open={formOpen}
          onClose={handleFormClose}
          classRoom={selectedClassRoom}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('classRoom.deleteClassRoom')}
        content={t('classRoom.deleteClassRoomConfirmation')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
      />

      <FileImportDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportFile}
        title={t('classRoom.importClassRooms')}
        description={t('classRoom.importDescription')}
        acceptedFormats={['.xlsx', '.xls']}
        maxSize={5}
      />

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))} 
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClassRoomList; 