import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { toast } from 'react-hot-toast';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
  user: user ? user : null,
  token: token ? token : null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  isAuthenticated: !!token,
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const response = await authService.register(userData);
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      const response = await authService.login(userData);
      toast.success('Login successful!');
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      return {};
    } catch (error) {
      // Even if logout fails on server, clear local storage
      authService.clearLocalStorage();
      return {};
    }
  }
);

// Get current user profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, thunkAPI) => {
    try {
      const response = await authService.getProfile();
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to get profile';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, thunkAPI) => {
    try {
      const response = await authService.updateProfile(userData);
      toast.success('Profile updated successfully!');
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, thunkAPI) => {
    try {
      await authService.changePassword(passwordData);
      toast.success('Password changed successfully!');
      return {};
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Refresh token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, thunkAPI) => {
    try {
      const response = await authService.refreshToken();
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Token refresh failed';
      // If refresh fails, logout user
      thunkAPI.dispatch(logout());
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearError: (state) => {
      state.isError = false;
      state.message = '';
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = false;
        state.message = '';
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
      });
  },
});

export const { reset, clearError, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;