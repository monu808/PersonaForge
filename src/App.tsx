import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/layout';
import HomePage from './pages/home';
import CreatePage from './pages/create';
import DashboardPage from './pages/dashboard';
import SettingsPage from './pages/settings';
import ProfilePage from './pages/profile';
import VideosPage from './pages/dashboard/videos';
import AudioPage from './pages/dashboard/audio';
import ElevenLabsFeaturesPage from './pages/elevenlabs-features';
import SignInPage from './pages/auth/sign-in';
import SignUpPage from './pages/auth/sign-up';
import { AuthProvider } from './lib/context/auth-context';
import { ProtectedRoute } from './components/auth/protected-route';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="create" element={
              <ProtectedRoute>
                <CreatePage />
              </ProtectedRoute>
            } />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />            <Route path="dashboard/videos" element={
              <ProtectedRoute>
                <VideosPage />
              </ProtectedRoute>
            } />            <Route path="dashboard/audio" element={
              <ProtectedRoute>
                <AudioPage />
              </ProtectedRoute>
            } />
            <Route path="elevenlabs" element={
              <ProtectedRoute>
                <ElevenLabsFeaturesPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;