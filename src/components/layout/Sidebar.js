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

const drawerWidth = 240;

const navItems = [
  { 
    name: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/admin/dashboard' 
  },
  { 
    name: 'Academic Records', 
    icon: <AssignmentIcon />, 
    path: '/admin/academic-records' 
  },
  { 
    name: 'Administrative Classes', 
    icon: <ClassIcon />, 
    path: '/admin/administrative-classes' 
  },
  { 
    name: 'Course Batches', 
    icon: <AutoStoriesIcon />, 
    path: '/admin/course-batches' 
  },
  { 
    name: 'Majors', 
    icon: <SchoolIcon />, 
    path: '/admin/majors' 
  },
  { 
    name: 'Students', 
    icon: <PeopleIcon />, 
    path: '/admin/students' 
  },
  { 
    name: 'Subjects', 
    icon: <SubjectIcon />, 
    path: '/admin/subjects' 
  },
  { 
    name: 'Training Programs', 
    icon: <MenuBookIcon />, 
    path: '/admin/training-programs' 
  },
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
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
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Admin Dashboard
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.name} 
            component={NavLink}
            to={item.path}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
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
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 