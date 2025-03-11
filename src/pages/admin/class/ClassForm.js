import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ClassForm = () => {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('class.form.title')}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">
          {t('common.comingSoon')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ClassForm; 