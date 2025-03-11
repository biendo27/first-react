import axios from 'axios';

const API_URL = 'https://localhost:7269'; // Update with your actual API URL
// const API_URL = 'https://bien-api.roz.io.vn'; // Update with your actual API URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request to', config.url);
    console.log('Request headers:', config.headers);
    console.log('Request data:', config.data);
    console.log('Request params:', config.params);
    console.log('Request method:', config.method);
    console.log('Request body:', config.data);
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
export const majorService = createCrudService('majors');
export const studentService = createCrudService('students');
export const subjectService = createCrudService('subjects');
export const trainingProgramService = createCrudService('training-programs');

export default api; 