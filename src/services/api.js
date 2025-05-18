import axios from 'axios';
import { formatDateForApi } from '../utils/dateUtils';

// const API_URL = 'https://localhost:7269'; // Update with your actual API URL
const API_URL = 'https://timeschedule-api.nonamegogeto.click';
// const API_URL = 'https://timeschedule-api.roz.io.vn';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper function to handle API errors consistently across the application
 * @param {Error} error - The error caught in the catch block
 * @param {string} defaultMessage - Default message to display if no error message is found
 * @returns {Object} - Formatted error object
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  // Return the error message from our intercepted error, or a default message
  return {
    message: error.message || defaultMessage,
    status: error.status || 500,
    data: error.data || {}
  };
};

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
    
    // Skip data processing if it's FormData (for file uploads)
    const isFormData = config.data instanceof FormData;
    
    // If it's a file upload request, add special handling
    if (isFormData) {
      // For file uploads, don't process anything - use data as is
      // This ensures FormData object is properly sent to the server
      
      // Log FormData entries without exposing the full file contents
      const formDataEntries = Array.from(config.data.entries()).map(([key, value]) => {
        if (value instanceof File) {
          return [key, `File(${value.name}, ${value.size} bytes, ${value.type})`];
        }
        return [key, value];
      });
      
      console.log('File upload request to:', config.url);
      console.log('Request headers:', config.headers);
      console.log('FormData entries:', formDataEntries);
      console.log('Request method:', config.method);
      
      // Prevent any further transforms for FormData
      if (!config.transformRequest) {
        config.transformRequest = [(data) => data];
      }
      
      return config;
    }
    
    // For non-FormData requests, continue with normal processing
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
    if (error.response?.status === 401 && !originalRequest._retry) {
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

    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('Response headers:', error.response?.headers);
    console.log('Response config:', error.response?.config);
    console.log('Response request:', error.response?.request);
    
    // Extract error details to make them available to components
    const errorResponse = {
      status: error.response?.status,
      message: error.response?.data?.detail || 
               error.response?.data?.message || 
               error.response?.data?.title ||
               error.message || 
               'An unknown error occurred',
      data: error.response?.data || {},
      originalError: error
    };
    
    return Promise.reject(errorResponse);
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
  // Add a generic import function for file uploads
  importFile: async (file) => {
    // Create a new FormData instance for each request
    const formData = new FormData();
    
    // Explicitly add the file with the exact name 'File' as required by the API
    // Do NOT use lowercase 'file' - it must match the API's expected parameter name
    formData.append('File', file);
    
    console.log(`Uploading file to /${endpoint}/import:`, file.name, file.type, `${(file.size / 1024).toFixed(2)} KB`);
    
    try {
      // Use a direct fetch call to bypass any Axios transformations
      const response = await fetch(`${API_URL}/v1/${endpoint}/import`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type header for multipart/form-data
          // Let the browser set it with the correct boundary
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      
      // Handle response
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },
});

// Create services for each entity
export const academicRecordService = {
  ...createCrudService('academic-records'),
  importFile: async (file) => {
    const formData = new FormData();
    formData.append('File', file);
    
    try {
      const response = await fetch(`${API_URL}/v1/academic-records/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },
  export: async (params) => {
    try {
      const response = await fetch(`${API_URL}/v1/academic-records/export?${new URLSearchParams(params)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      // Parse JSON response instead of returning a blob
      return await response.json();
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
};
export const administrativeClassService = createCrudService('administrative-classes');
export const classRoomService = {
  ...createCrudService('classrooms'),
  importFile: async (file) => {
    const formData = new FormData();
    formData.append('File', file);
    
    try {
      const response = await fetch(`${API_URL}/v1/classrooms/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
};
export const courseBatchService = createCrudService('course-batches');
export const educationModeService = createCrudService('education-modes');
export const majorService = createCrudService('majors');
export const studentService = createCrudService('students');
export const subjectService = createCrudService('subjects');
export const subjectClassService = {
  ...createCrudService('subject-classes'),
  export: async (params) => {
    try {
      const response = await fetch(`${API_URL}/v1/subject-classes/export?${new URLSearchParams(params)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  },
  exportTimeTable: async (data) => {
    try {
      const response = await fetch(`${API_URL}/v1/subject-class-details/export-time-table`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Export time table failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Export time table error:', error);
      throw error;
    }
  }
};
export const subjectClassDetailService = {
  ...createCrudService('subject-class-details'),
  getClassStudents: async (params) => {
    try {
      const response = await api.get('/v1/subject-class-details/class-students', { 
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  },
  addStudentToClass: async (data) => {
    try {
      const response = await api.post('/v1/subject-class-details/add-student-to-class', data);
      return response.data;
    } catch (error) {
      console.error('Error adding student to class:', error);
      throw error;
    }
  },
  removeStudentFromClass: async (data) => {
    try {
      const response = await api.post('/v1/subject-class-details/remove-student-from-class', data);
      return response.data;
    } catch (error) {
      console.error('Error removing student from class:', error);
      throw error;
    }
  }
};
export const trainingProgramService = {
  ...createCrudService('training-programs'),
  duplicate: async (courseBatchSourceId, courseBatchDestinationId) => {
    const response = await api.post('/v1/training-programs/duplicate', {
      courseBatchSourceId,
      courseBatchDestinationId
    });
    return response.data;
  }
};

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