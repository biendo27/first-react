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
import EducationModeList from './pages/admin/education-mode';
import ClassRoomList from './pages/admin/classroom';
import SubjectClassList from './pages/admin/subject-class';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

// Import i18n configuration
import './i18n';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="majors" element={<MajorList />} />
              <Route path="education-modes" element={<EducationModeList />} />
              <Route path="subjects" element={<SubjectList />} />
              <Route path="students" element={<StudentList />} />
              <Route path="academic-records" element={<AcademicRecordList />} />
              <Route path="administrative-classes" element={<AdministrativeClassList />} />
              <Route path="course-batches" element={<CourseBatchList />} />
              <Route path="training-programs" element={<TrainingProgramList />} />
              <Route path="classrooms" element={<ClassRoomList />} />
              <Route path="subject-classes" element={<SubjectClassList />} />
              
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
