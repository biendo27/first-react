import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ClassList = () => {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('classes')}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">
          {t('common.comingSoon')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ClassList; 