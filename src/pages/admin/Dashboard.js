import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import SubjectIcon from '@mui/icons-material/Subject';
import PeopleIcon from '@mui/icons-material/People';

const StatCard = ({ title, count, icon, color }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 3
      }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4">{count}</Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 1,
            p: 1,
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            count="124"
            icon={<PeopleIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classes"
            count="8"
            icon={<ClassIcon />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Subjects"
            count="42"
            icon={<SubjectIcon />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Majors"
            count="6"
            icon={<SchoolIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Welcome to School Management System" />
            <Divider />
            <CardContent>
              <Typography variant="body1">
                This dashboard provides comprehensive tools for managing academic records, administrative classes, 
                course batches, majors, students, subjects, and training programs. Use the navigation menu to access 
                different sections of the system.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 