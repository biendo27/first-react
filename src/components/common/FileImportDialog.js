import React, { useState } from 'react';
import { 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';

const FileImportDialog = ({ 
  open, 
  onClose, 
  onImport, 
  title, 
  description, 
  acceptedFileTypes = '.xlsx, .xls', 
  maxSize = 5 // 5MB 
}) => {
  const { t } = useTranslation(['common']);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState({ show: false, success: false, message: '' });
  
  // File size in MB
  const getFileSizeInMB = (fileSize) => {
    return fileSize / (1024 * 1024);
  };
  
  const validateFile = (file) => {
    // Check if file exists
    if (!file) {
      return t('fileImport.noFileSelected');
    }
    
    // Check file size
    if (getFileSizeInMB(file.size) > maxSize) {
      return t('fileImport.fileTooLarge', { maxSize });
    }
    
    // Check file extension
    const acceptedTypes = acceptedFileTypes.split(',').map(type => type.trim().toLowerCase());
    const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
    
    if (!acceptedTypes.includes(fileExtension) && !acceptedTypes.includes('*')) {
      return t('fileImport.invalidFileType', { acceptedTypes: acceptedFileTypes });
    }
    
    return '';
  };
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setFileError(error);
        setFile(null);
      } else {
        setFileError('');
        setFile(selectedFile);
        setImportStatus({ show: false, success: false, message: '' });
      }
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      setFileError(t('fileImport.noFileSelected'));
      return;
    }
    
    setLoading(true);
    try {
      console.log('Starting file import for:', file.name);
      const result = await onImport(file);
      console.log('Import successful:', result);
      setImportStatus({ 
        show: true, 
        success: true, 
        message: result?.message || t('fileImport.importSuccess') 
      });
      // Clear file after success
      setFile(null);
    } catch (error) {
      console.error('Import error details:', {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        originalError: error?.originalError
      });
      
      let errorMessage = error?.message || t('fileImport.importError');
      // Check if there's a more specific error message in the error data
      if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      setImportStatus({ 
        show: true, 
        success: false, 
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    // Reset state when closing
    setFile(null);
    setFileError('');
    setImportStatus({ show: false, success: false, message: '' });
    
    // Call the provided onClose
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            <UploadFileIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {title || t('fileImport.importData')}
          </Typography>
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {description && (
          <DialogContentText mb={2}>
            {description}
          </DialogContentText>
        )}
        
        {importStatus.show && (
          <Alert 
            severity={importStatus.success ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {importStatus.message}
          </Alert>
        )}
        
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.level1',
            mb: 2,
            position: 'relative',
          }}
        >
          {loading && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            />
          )}
          
          <input
            accept={acceptedFileTypes}
            id="file-upload-button"
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={loading}
          />
          
          <label htmlFor="file-upload-button">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={loading}
            >
              {t('fileImport.selectFile')}
            </Button>
          </label>
          
          {file && (
            <Typography variant="body2" mt={2} color="text.secondary">
              {t('fileImport.selectedFile')}: {file.name} ({getFileSizeInMB(file.size).toFixed(2)} MB)
            </Typography>
          )}
          
          {fileError && (
            <Typography variant="body2" color="error" mt={1}>
              {fileError}
            </Typography>
          )}
          
          <Typography variant="caption" display="block" mt={2} color="text.secondary">
            {t('fileImport.acceptedFormats')}: {acceptedFileTypes}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            {t('fileImport.maxFileSize')}: {maxSize} MB
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common:cancel')}
        </Button>
        <Button 
          onClick={handleImport} 
          variant="contained" 
          color="primary"
          disabled={!file || !!fileError || loading}
          startIcon={<UploadFileIcon />}
        >
          {loading ? t('fileImport.importing') : t('fileImport.import')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileImportDialog; 