import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './features/auth/context/AuthContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import PublicOnlyRoute from './shared/components/PublicOnlyRoute';
import AdminRoute from './shared/components/AdminRoute';

import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';

// Admin feature views
import AdminLayout from './features/admin/layouts/AdminLayout';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import AdminVendorsPage from './features/admin/pages/AdminVendorsPage';
import AdminDisputesPage from './features/admin/pages/AdminDisputesPage';
import AdminBookingsPage from './features/admin/pages/AdminBookingsPage';
import AdminCategoriesPage from './features/admin/pages/AdminCategoriesPage';
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage';
import AdminAuditLogsPage from './features/admin/pages/AdminAuditLogsPage';

import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public-only routes — redirect if authenticated */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            {/* Customer & Vendor Portal */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Console & Operations — Restricted to Admin Role */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="vendors" element={<AdminVendorsPage />} />
              <Route path="disputes" element={<AdminDisputesPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="audits" element={<AdminAuditLogsPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
