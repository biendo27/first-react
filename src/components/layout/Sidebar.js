import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Box,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import SubjectIcon from '@mui/icons-material/Subject';
import PeopleIcon from '@mui/icons-material/People';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useTranslation } from 'react-i18next';

const drawerWidth = 240;

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const { t } = useTranslation('admin');
  
  const navItems = [
    { 
      name: t('dashboard'), 
      icon: <DashboardIcon />, 
      path: '/admin/dashboard' 
    },
    { 
      name: t('students'), 
      icon: <PeopleIcon />, 
      path: '/admin/students' 
    },
    { 
      name: t('subjects'), 
      icon: <SubjectIcon />, 
      path: '/admin/subjects' 
    },
    { 
      name: t('classes'), 
      icon: <ClassIcon />, 
      path: '/admin/administrative-classes' 
    },
    { 
      name: t('courseBatches'), 
      icon: <AutoStoriesIcon />, 
      path: '/admin/course-batches' 
    },
    { 
      name: t('majors'), 
      icon: <SchoolIcon />, 
      path: '/admin/majors' 
    },
    { 
      name: t('academicRecords'), 
      icon: <AssignmentIcon />, 
      path: '/admin/academic-records' 
    },
    { 
      name: t('trainingPrograms'), 
      icon: <MenuBookIcon />, 
      path: '/admin/training-programs' 
    }
  ];

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          paddingTop: '64px', // Add space for the AppBar
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          {t('dashboard')}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ width: '100%' }}>
        {navItems.map((item) => (
          <ListItem 
            key={item.name} 
            component={NavLink}
            to={item.path}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              width: '100%',
              '&.active': {
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                '& .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 'bold',
                  color: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.name} 
              primaryTypographyProps={{ 
                noWrap: true,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} 
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 