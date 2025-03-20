import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import { courseBatchService, trainingProgramService } from '../../../services/api';
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
      const response = await courseBatchService.getAll({ PageSize: 100 });
      setCourseBatches(response.data || []);
    } catch (error) {
      console.error('Error fetching course batches:', error);
      setError(t('common:error.loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      fetchCourseBatches();
    }
  }, [open, fetchCourseBatches]);

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
      console.error('Error duplicating training program:', error);
      setError(t('duplicateError', 'Failed to duplicate training program'));
    } finally {
      setSubmitting(false);
    }
  };

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
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <FormControl fullWidth sx={{ mt: 2 }} disabled={loading || submitting}>
          <InputLabel id="destination-batch-label">
            {t('destinationCourseBatch', 'Destination Course Batch')}
          </InputLabel>
          <Select
            labelId="destination-batch-label"
            value={destinationBatchId}
            onChange={(e) => setDestinationBatchId(e.target.value)}
            label={t('destinationCourseBatch', 'Destination Course Batch')}
          >
            {courseBatches
              .filter(batch => batch.id !== sourceBatchId)
              .map((batch) => (
                <MenuItem key={batch.id} value={batch.id}>
                  {batch.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
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