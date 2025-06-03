import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/layout';
import HomePage from './pages/home';
import CreatePage from './pages/create';
import DashboardPage from './pages/dashboard';
import SettingsPage from './pages/settings';
import ProfilePage from './pages/profile';
import SignInPage from './pages/auth/sign-in';
import SignUpPage from './pages/auth/sign-up';
import { AuthProvider } from './lib/context/auth-context';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/protected-route';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - accessible to everyone */}
          <Route path="/" element={<Layout publicOnly={true} />}>
            <Route index element={<HomePage />} />
          </Route>
          
          {/* Auth routes - only for non-authenticated users */}
          <Route
            path="/auth/sign-in"
            element={
              <PublicOnlyRoute>
                <SignInPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/auth/sign-up"
            element={
              <PublicOnlyRoute>
                <SignUpPage />
              </PublicOnlyRoute>
            }
          />
          
          {/* Protected routes - require authentication */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="create" element={<CreatePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
          {/* Catch-all route for any unmatched routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;