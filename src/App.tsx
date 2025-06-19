import { DeploymentStatusBadge } from './components/DeploymentStatusBadge';
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
import TavusFeaturesPage from './pages/tavus-features';
import CoruscantPage from './pages/coruscant';
import Neurovia from './pages/neurovia';
import SignInPage from './pages/auth/sign-in';
import SignUpPage from './pages/auth/sign-up';
import PersonasPage from './pages/personas';
import PersonaManagePage from './pages/personas/[id]/manage';
import PricingPage from './components/subscription/pricing-page';
import PaymentSuccessPage from './pages/payment-success';
import AdminTestPage from './pages/admin-test';
import IntegrationTestPage from './pages/integration-test';
import SystemStatusPage from './pages/system-status';
import { AuthProvider } from './lib/context/auth-context';
import { SubscriptionProvider } from './lib/revenuecat/context';
import { ProtectedRoute } from './components/auth/protected-route';
import { syncService } from './lib/api/sync-service';
import { useEffect } from 'react';
import './index.css';

function App() {
  // Initialize sync service when app starts
  useEffect(() => {
    // Start sync service for data synchronization
    syncService.startSync();
    
    return () => {
      // Cleanup on app unmount
      syncService.stopSync();
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <DeploymentStatusBadge />
      </div>
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <Routes>
            <Route path="/auth/sign-in" element={<SignInPage />} />
            <Route path="/auth/sign-up" element={<SignUpPage />} />
            <Route path="/neurovia" element={
              <ProtectedRoute>
                <Neurovia />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="payment/success" element={
                <ProtectedRoute>
                  <PaymentSuccessPage />
                </ProtectedRoute>
              } />
              <Route path="admin/test" element={
                <ProtectedRoute>
                  <AdminTestPage />
                </ProtectedRoute>
              } />
              <Route path="integration/test" element={
                <ProtectedRoute>
                  <IntegrationTestPage />
                </ProtectedRoute>
              } />
              <Route path="system/status" element={
                <ProtectedRoute>
                  <SystemStatusPage />
                </ProtectedRoute>
              } />              <Route path="create" element={
                <ProtectedRoute>
                  <CreatePage />
                </ProtectedRoute>
              } />
              <Route path="personas" element={
                <ProtectedRoute>
                  <PersonasPage />
                </ProtectedRoute>
              } />
              <Route path="personas/:id" element={
                <ProtectedRoute>
                  <PersonaManagePage />
                </ProtectedRoute>
              } />
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="coruscant" element={
                <ProtectedRoute>
                  <CoruscantPage />
                </ProtectedRoute>
              } />
              <Route path="dashboard/videos" element={
                <ProtectedRoute>
                  <VideosPage />
                </ProtectedRoute>
              } />
              <Route path="dashboard/audio" element={
                <ProtectedRoute>
                  <AudioPage />
                </ProtectedRoute>
              } />
              <Route path="elevenlabs" element={
                <ProtectedRoute>
                  <ElevenLabsFeaturesPage />
                </ProtectedRoute>
              } />
              <Route path="tavus-features" element={
                <ProtectedRoute>
                  <TavusFeaturesPage />
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
      </SubscriptionProvider>
    </AuthProvider>
    </>
  );
}

export default App;