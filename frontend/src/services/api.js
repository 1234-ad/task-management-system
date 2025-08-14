import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
            { refreshToken }
          );

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            // Update tokens in localStorage
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Update authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            // Retry the original request
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only show toast if not already on login page
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Handle other HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          // Bad request - validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(err.msg || err.message);
            });
          } else {
            toast.error(data.message || 'Bad request');
          }
          break;
          
        case 403:
          // Forbidden
          toast.error(data.message || 'Access denied');
          break;
          
        case 404:
          // Not found
          toast.error(data.message || 'Resource not found');
          break;
          
        case 409:
          // Conflict
          toast.error(data.message || 'Conflict occurred');
          break;
          
        case 422:
          // Unprocessable entity
          toast.error(data.message || 'Validation failed');
          break;
          
        case 429:
          // Too many requests
          toast.error(data.message || 'Too many requests. Please try again later.');
          break;
          
        case 500:
          // Internal server error
          toast.error('Server error. Please try again later.');
          break;
          
        case 502:
        case 503:
        case 504:
          // Server unavailable
          toast.error('Service temporarily unavailable. Please try again later.');
          break;
          
        default:
          toast.error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other errors
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// Helper function to handle file uploads
export const uploadFile = async (url, formData, onUploadProgress) => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

// Helper function to download files
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    // Create blob link to download
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename || 'download';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(link.href);
    
    return response;
  } catch (error) {
    toast.error('Failed to download file');
    throw error;
  }
};

// Helper function to get file preview URL
export const getFilePreviewUrl = (url) => {
  const token = localStorage.getItem('token');
  if (token) {
    return `${url}?token=${token}`;
  }
  return url;
};

// API health check
export const healthCheck = async () => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/health`,
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    throw new Error('API health check failed');
  }
};

// Initialize API on app start
export const initializeAPI = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export default api;