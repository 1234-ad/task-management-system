import api from './api';

const API_URL = '/api/auth';

// Register user
const register = async (userData) => {
  const response = await api.post(`${API_URL}/register`, userData);
  
  if (response.data.success) {
    const { user, accessToken, refreshToken } = response.data.data;
    
    // Store user info and tokens in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return response.data.data;
  }
  
  throw new Error(response.data.message || 'Registration failed');
};

// Login user
const login = async (userData) => {
  const response = await api.post(`${API_URL}/login`, userData);
  
  if (response.data.success) {
    const { user, accessToken, refreshToken } = response.data.data;
    
    // Store user info and tokens in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return response.data.data;
  }
  
  throw new Error(response.data.message || 'Login failed');
};

// Logout user
const logout = async () => {
  try {
    await api.post(`${API_URL}/logout`);
  } catch (error) {
    // Continue with logout even if server request fails
    console.error('Logout request failed:', error);
  } finally {
    // Always clear localStorage
    clearLocalStorage();
  }
};

// Get current user profile
const getProfile = async () => {
  const response = await api.get(`${API_URL}/me`);
  
  if (response.data.success) {
    const { user } = response.data.data;
    
    // Update user info in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data.data;
  }
  
  throw new Error(response.data.message || 'Failed to get profile');
};

// Update user profile
const updateProfile = async (userData) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const response = await api.put(`/api/users/${user.id}`, userData);
  
  if (response.data.success) {
    const { user: updatedUser } = response.data.data;
    
    // Update user info in localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return response.data.data;
  }
  
  throw new Error(response.data.message || 'Profile update failed');
};

// Change password
const changePassword = async (passwordData) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const response = await api.put(`/api/users/${user.id}/change-password`, passwordData);
  
  if (response.data.success) {
    return response.data;
  }
  
  throw new Error(response.data.message || 'Password change failed');
};

// Refresh token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await api.post(`${API_URL}/refresh`, { refreshToken });
  
  if (response.data.success) {
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    
    // Update tokens in localStorage
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data.data;
  }
  
  throw new Error(response.data.message || 'Token refresh failed');
};

// Clear localStorage
const clearLocalStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Get current user from localStorage
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get current token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Get refresh token from localStorage
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// Check if user has specific role
const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

// Check if user is admin
const isAdmin = () => {
  return hasRole('admin');
};

// Set auth header for API requests
const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize auth header on app start
const initializeAuth = () => {
  const token = getToken();
  if (token) {
    setAuthHeader(token);
  }
};

const authService = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  clearLocalStorage,
  isAuthenticated,
  getCurrentUser,
  getToken,
  getRefreshToken,
  hasRole,
  isAdmin,
  setAuthHeader,
  initializeAuth,
};

export default authService;