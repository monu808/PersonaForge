import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/layout';
import HomePage from './pages/home';
import CreatePage from './pages/create';
import DashboardPage from './pages/dashboard';
import SettingsPage from './pages/settings';
import './app.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Additional routes will be added as needed */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;