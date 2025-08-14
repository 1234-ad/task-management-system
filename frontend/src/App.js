import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';
import Toast from './components/UI/Toast';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Tasks from './pages/Tasks/Tasks';
import TaskDetail from './pages/Tasks/TaskDetail';
import CreateTask from './pages/Tasks/CreateTask';
import EditTask from './pages/Tasks/EditTask';
import Users from './pages/Users/Users';
import UserDetail from './pages/Users/UserDetail';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound/NotFound';

// Services
import { initializeAPI } from './services/api';
import authService from './services/authService';
import socketService from './services/socketService';

// Store
import { getProfile } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Initialize API with auth token
    initializeAPI();
    authService.initializeAuth();

    // If user is authenticated, get fresh profile data
    if (isAuthenticated && user) {
      dispatch(getProfile());
      
      // Initialize socket connection
      socketService.connect();
    }

    // Cleanup socket on unmount
    return () => {
      socketService.disconnect();
    };
  }, [dispatch, isAuthenticated, user]);

  // Show loading spinner during initial auth check
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="App">
      <Toast />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Tasks */}
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/create" element={<CreateTask />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="tasks/:id/edit" element={<EditTask />} />

          {/* Users (Admin only) */}
          <Route
            path="users"
            element={
              <ProtectedRoute requireAdmin>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="users/:id"
            element={
              <ProtectedRoute requireAdmin>
                <UserDetail />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route path="profile" element={<Profile />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;