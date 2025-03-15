import axios from 'axios';
import { formatDateForApi } from '../utils/dateUtils';

// const API_URL = 'https://localhost:7269/'; // Update with your actual API URL
const API_URL = 'https://timeschedule-api.nonamegogeto.click';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Recursively process an object and format any Date objects to ISO strings
 * @param {Object} obj - The object to process
 * @returns {Object} - The processed object with formatted dates
 */
const processObjectDates = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Don't process Date objects directly, they'll be handled within object properties
  if (obj instanceof Date) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => processObjectDates(item));
  }
  
  // Process regular objects
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Check if it's a Date object or a date string
      if (value instanceof Date || 
         (typeof value === 'string' && !isNaN(Date.parse(value)) && 
          /^\d{4}-\d{2}-\d{2}/.test(value))) {
        result[key] = formatDateForApi(value);
      }
      // Recursively process nested objects
      else if (value && typeof value === 'object') {
        result[key] = processObjectDates(value);
      }
      // Otherwise just copy the value
      else {
        result[key] = value;
      }
    }
  }
  
  return result;
};

// Add request interceptor for adding auth token and formatting dates
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Format dates in request body if it exists
    if (config.data) {
      config.data = processObjectDates(config.data);
    }
    
    // Format dates in request params if they exist
    if (config.params) {
      config.params = processObjectDates(config.params);
    }
    
    console.log('Request to', config.url);
    console.log('Request headers:', config.headers);
    console.log('Request data:', config.data);
    console.log('Request params:', config.params);
    console.log('Request method:', config.method);
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_URL}/v1/refresh-token`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    console.log('Response status:', error.response.status);
    console.log('Response data:', error.response.data);
    console.log('Response headers:', error.response.headers);
    console.log('Response config:', error.response.config);
    console.log('Response request:', error.response.request);
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/v1/login', { username, password });
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Generic CRUD service creator
const createCrudService = (endpoint) => ({
  getAll: async (params) => {
    const response = await api.get(`/v1/${endpoint}`, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/v1/${endpoint}/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(`/v1/${endpoint}`, data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/v1/${endpoint}/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/v1/${endpoint}/${id}`);
    return response.data;
  },
});

// Create services for each entity
export const academicRecordService = createCrudService('academic-records');
export const administrativeClassService = createCrudService('administrative-classes');
export const courseBatchService = createCrudService('course-batches');
export const educationModeService = createCrudService('education-modes');
export const majorService = createCrudService('majors');
export const studentService = createCrudService('students');
export const subjectService = createCrudService('subjects');
export const trainingProgramService = createCrudService('training-programs');

// Special services with custom endpoints
export const subjectExemptionService = {
  getStudentSubjects: async (params) => {
    const response = await api.get('/v1/student-subjects', { params });
    return response.data;
  },
  getExemptions: async (params) => {
    const response = await api.get('/v1/subject-exemptions', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/v1/subject-exemptions', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/v1/subject-exemptions/${id}`, data);
    return response.data;
  }
};

export default api; 