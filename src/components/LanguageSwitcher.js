import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import FlagIcon from '@mui/icons-material/Flag';
import UKFlag from '@mui/icons-material/EmojiFlags';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', icon: <FlagIcon style={{ color: 'red' }} /> },
  { code: 'en', name: 'English', icon: <UKFlag style={{ color: 'blue' }} /> },
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  // Get current language display name
  const currentLanguage = languages.find(lang => lang.code === i18n.language)?.name || 'Language';
  
  return (
    <>
      <Button
        color="inherit"
        onClick={handleClick}
        variant="outlined"
        sx={{
          borderColor: 'rgba(255, 255, 255, 0.5)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          textTransform: 'none',
          padding: '4px 10px',
          minWidth: 'auto',
          borderRadius: '4px',
          fontWeight: 'normal',
        }}
        startIcon={<LanguageIcon fontSize="small" />}
      >
        <Typography variant="body2" noWrap>
          {currentLanguage}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            selected={i18n.language === language.code}
            sx={{
              minWidth: '150px',
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
              },
            }}
          >
            <ListItemIcon>
              {language.icon}
            </ListItemIcon>
            <ListItemText primary={language.name} />
            {i18n.language === language.code && <CheckIcon fontSize="small" color="primary" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher; 