import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

// Import Pages (we will create them next)
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import VerificationPage from '../pages/VerificationPage';
import DashboardPage from '../pages/DashboardPage';
import MeetingRoomPage from '../pages/MeetingRoomPage';
import TasksPage from '../pages/TasksPage';

import Loader from '../components/common/Loader';

// Protected Route Shield
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Anonymous Route Shield (redirects to dashboard if already logged in)
const AnonymousRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Gates */}
        <Route
          path="/login"
          element={
            <AnonymousRoute>
              <LoginPage />
            </AnonymousRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AnonymousRoute>
              <SignupPage />
            </AnonymousRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AnonymousRoute>
              <ForgotPasswordPage />
            </AnonymousRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AnonymousRoute>
              <ResetPasswordPage />
            </AnonymousRoute>
          }
        />
        <Route path="/verify" element={<VerificationPage />} />

        {/* Protected Dashboard/Collab Workspace */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meeting/:roomCode"
          element={
            <ProtectedRoute>
              <MeetingRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
