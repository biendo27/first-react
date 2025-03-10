import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import TrainingProgramForm from './TrainingProgramForm';
import { fetchWithAuth } from '../../../utils/fetch';

const TrainingProgramList = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [totalRows, setTotalRows] = useState(0);
  const { enqueueSnackbar } = useSnackbar();

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        `/v1/training-programs?PageIndex=${paginationModel.page + 1}&PageSize=${paginationModel.pageSize}`
      );
      const data = await response.json();
      setPrograms(data.data || []);
      setTotalRows(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching training programs:', error);
      enqueueSnackbar('Failed to fetch training programs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [paginationModel]);

  const handleDelete = async (id) => {
    try {
      const response = await fetchWithAuth(`/v1/training-programs/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        enqueueSnackbar('Training program deleted successfully', { variant: 'success' });
        fetchPrograms();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting training program:', error);
      enqueueSnackbar('Failed to delete training program', { variant: 'error' });
    }
  };

  const columns = [
    { field: 'semester', headerName: 'Semester', width: 100 },
    { field: 'academicYear', headerName: 'Academic Year', width: 130 },
    {
      field: 'subject',
      headerName: 'Subject',
      width: 200,
      valueGetter: (params) => params.row.subject?.name || '',
    },
    {
      field: 'major',
      headerName: 'Major',
      width: 200,
      valueGetter: (params) => params.row.major?.name || '',
    },
    {
      field: 'courseBatch',
      headerName: 'Course Batch',
      width: 200,
      valueGetter: (params) => params.row.courseBatch?.name || '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              onClick={() => {
                setSelectedProgram(params.row);
                setOpenForm(true);
              }}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={() => handleDelete(params.row.id)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Training Programs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedProgram(null);
            setOpenForm(true);
          }}
        >
          Add New
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={programs}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          rowCount={totalRows}
          loading={loading}
          disableSelectionOnClick
          paginationMode="server"
        />
      </Paper>

      {openForm && (
        <TrainingProgramForm
          open={openForm}
          onClose={() => {
            setOpenForm(false);
            setSelectedProgram(null);
          }}
          onSubmit={() => {
            setOpenForm(false);
            setSelectedProgram(null);
            fetchPrograms();
          }}
          program={selectedProgram}
        />
      )}
    </Box>
  );
};

export default TrainingProgramList;
