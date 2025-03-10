import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import MajorList from './pages/admin/major';
import SubjectList from './pages/admin/subject';
import StudentList from './pages/admin/student';
import AcademicRecordList from './pages/admin/academic-record';
import AdministrativeClassList from './pages/admin/administrative-class';
import CourseBatchList from './pages/admin/course-batch';
import TrainingProgramList from './pages/admin/training-program';
import './App.css';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Simple auth check function (replace with actual auth logic as needed)
const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="majors" element={<MajorList />} />
            <Route path="subjects" element={<SubjectList />} />
            <Route path="students" element={<StudentList />} />
            <Route path="academic-records" element={<AcademicRecordList />} />
            <Route path="administrative-classes" element={<AdministrativeClassList />} />
            <Route path="course-batches" element={<CourseBatchList />} />
            <Route path="training-programs" element={<TrainingProgramList />} />
            
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
