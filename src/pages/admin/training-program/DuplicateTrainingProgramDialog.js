import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  CircularProgress,
  Box,
  Alert,
  Autocomplete,
  TextField
} from '@mui/material';
import { courseBatchService, trainingProgramService, handleApiError } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const DuplicateTrainingProgramDialog = ({ open, onClose, sourceBatchId }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseBatches, setCourseBatches] = useState([]);
  const [destinationBatchId, setDestinationBatchId] = useState('');
  const [error, setError] = useState('');

  const fetchCourseBatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await courseBatchService.getAll({ PageSize: 10000 });
      setCourseBatches(response.data || []);
    } catch (error) {
      const formattedError = handleApiError(error, t('common:error.loading'));
      console.error('Error fetching course batches:', formattedError);
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      fetchCourseBatches();
    }
  }, [open, fetchCourseBatches]);

  const handleDestinationChange = (_, newValue) => {
    setDestinationBatchId(newValue ? newValue.value : '');
  };

  const handleDuplicate = async () => {
    if (!destinationBatchId) {
      setError(t('selectDestinationCourseBatch', 'Please select a destination course batch'));
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      await trainingProgramService.duplicate(sourceBatchId, destinationBatchId);
      onClose(true);
    } catch (error) {
      const formattedError = handleApiError(error, t('duplicateError', 'Failed to duplicate training program'));
      console.error('Error duplicating training program:', formattedError);
      setError(formattedError.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out the source batch from the options
  const batchOptions = courseBatches
    .filter(batch => batch.id !== sourceBatchId)
    .map(batch => ({
      value: batch.id,
      label: batch.name
    }));

  return (
    <Dialog 
      open={open} 
      onClose={() => !submitting && onClose(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('duplicateTrainingProgram', 'Duplicate Training Program')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            {t('duplicateDescription', 'Copy all training program items from the selected course batch to another course batch.')}
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Autocomplete
            id="destination-batch"
            options={batchOptions}
            getOptionLabel={(option) => option.label || ''}
            value={batchOptions.find(option => option.value === destinationBatchId) || null}
            onChange={handleDestinationChange}
            disabled={loading || submitting}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('destinationCourseBatch', 'Destination Course Batch')}
                variant="outlined"
                fullWidth
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => onClose(false)} 
          disabled={submitting}
        >
          {t('common:cancel')}
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleDuplicate}
          disabled={!destinationBatchId || submitting || loading}
        >
          {submitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {t('duplicating', 'Duplicating...')}
            </>
          ) : (
            t('duplicate', 'Duplicate')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateTrainingProgramDialog; 