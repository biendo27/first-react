import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import ReactCountryFlag from 'react-country-flag';

const languages = [
  { 
    code: 'vi', 
    name: 'Tiếng Việt', 
    countryCode: 'VN',
    flagAlt: 'Vietnam Flag'
  },
  { 
    code: 'en', 
    name: 'English', 
    countryCode: 'US',
    flagAlt: 'USA Flag'
  },
];

const LanguageSwitcher = ({ compact = false }) => {
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

  // Get current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[1]; // Default to English
  
  // Flag component used in multiple places
  const FlagIcon = ({ language, size = '1.5em' }) => (
    <ReactCountryFlag
      countryCode={language.countryCode}
      svg
      style={{
        width: size,
        height: size,
      }}
      title={language.flagAlt}
    />
  );

  // Compact version (icon only)
  if (compact) {
    return (
      <>
        <IconButton
          color="inherit"
          onClick={handleClick}
          size="small"
          sx={{
            padding: '4px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.9)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <FlagIcon language={currentLanguage} />
        </IconButton>
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
                <FlagIcon language={language} />
              </ListItemIcon>
              <ListItemText primary={language.name} />
              {i18n.language === language.code && <CheckIcon fontSize="small" color="primary" />}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }
  
  // Full version (icon + text)
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
        startIcon={<FlagIcon language={currentLanguage} />}
      >
        <Typography variant="body2" noWrap>
          {currentLanguage.name}
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
              <FlagIcon language={language} />
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