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
import AuthCallbackPage from './pages/auth/callback';
import EmailConfirmPage from './pages/auth/email-confirm';
import ForgotPasswordPage from './pages/auth/forgot-password';
import ResetPasswordPage from './pages/auth/reset-password';
import PersonasPage from './pages/personas';
import PersonaManagePage from './pages/personas/[id]/manage';
import PricingPage from './components/subscription/pricing-page';
import PaymentSuccessPage from './pages/payment-success';
import AdminTestPage from './pages/admin-test';
import IntegrationTestPage from './pages/integration-test';
import SystemStatusPage from './pages/system-status';
import GrantEnterpriseAccess from './components/admin/GrantEnterpriseAccess';
import DatabaseDiagnosticPage from './pages/database-diagnostic';
import PasswordResetTestPage from './pages/password-reset-test';
import WalletDiagnosticPage from './pages/wallet-diagnostic';
import SupabaseDiagnostic from './pages/supabase-diagnostic';
import AboutPage from './pages/about';
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
        <DeploymentStatusBadge key="deployment-badge" />
      </div>
    <AuthProvider>
      <SubscriptionProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >          <Routes>
            <Route path="/auth/sign-in" element={<SignInPage />} />
            <Route path="/auth/sign-up" element={<SignUpPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/email-confirm" element={<EmailConfirmPage />} />            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />            <Route path="/debug/database" element={<DatabaseDiagnosticPage />} />
            <Route path="/debug/supabase" element={<SupabaseDiagnostic />} />
            <Route path="/debug/password-reset" element={<PasswordResetTestPage />} />
            <Route path="/debug/wallet" element={<WalletDiagnosticPage />} />
            <Route path="/neurovia" element={
              <ProtectedRoute>
                <Neurovia />
              </ProtectedRoute>
            } />            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
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
              } />
              <Route path="admin/grant-access" element={
                <ProtectedRoute>
                  <GrantEnterpriseAccess />
                </ProtectedRoute>
              } />
              <Route path="create" element={
                <ProtectedRoute>
                  <CreatePage />
                </ProtectedRoute>
              } />
              <Route path="personas" element={
                <ProtectedRoute>
                  <PersonasPage />
                </ProtectedRoute>
              } />              <Route path="personas/:id" element={
                <ProtectedRoute>
                  <PersonaManagePage />
                </ProtectedRoute>
              } />
              <Route path="personas/:id/manage" element={
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
              <Route path="database-diagnostic" element={                <ProtectedRoute>
                  <DatabaseDiagnosticPage />
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