import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';

// Lazy load admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminMetrics = lazy(() => import('./pages/admin/AdminMetricsComplete'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSuppliers = lazy(() => import('./pages/admin/AdminSuppliers'));
const AdminPortfolio = lazy(() => import('./pages/admin/AdminPortfolio'));
const AdminDiscounts = lazy(() => import('./pages/admin/AdminDiscounts'));
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts'));
const AdminBroadcast = lazy(() => import('./pages/admin/AdminBroadcast'));
const AdminTaskTemplates = lazy(() => import('./pages/admin/AdminTaskTemplates'));
const AdminAutomations = lazy(() => import('./pages/admin/AdminAutomations'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminPayouts = lazy(() => import('./pages/admin/AdminPayouts'));
const AdminRevolut = lazy(() => import('./pages/admin/AdminRevolut'));
const AdminDebugPayments = lazy(() => import('./pages/admin/AdminDebugPayments'));
const AdminAITraining = lazy(() => import('./pages/admin/AdminAITraining'));
const AdminSpecsManager = lazy(() => import('./pages/admin/AdminSpecsManager'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              
              {/* Protected admin routes with sidebar layout */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="portfolio" element={<AdminPortfolio />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="suppliers" element={<AdminSuppliers />} />
                <Route path="commerce" element={<AdminDiscounts />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="metrics" element={<AdminMetrics />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="alerts" element={<AdminAlerts />} />
                <Route path="broadcast" element={<AdminBroadcast />} />
                <Route path="task-templates" element={<AdminTaskTemplates />} />
                <Route path="automations" element={<AdminAutomations />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="finance/payouts" element={<AdminPayouts />} />
                <Route path="finance/revolut" element={<AdminRevolut />} />
                <Route path="debug/payments" element={<AdminDebugPayments />} />
                <Route path="ai-training" element={<AdminAITraining />} />
                <Route path="specs" element={<AdminSpecsManager />} />
              </Route>
              
              {/* Legacy redirects */}
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/metrics" element={<Navigate to="/admin/metrics" replace />} />
              <Route path="/users" element={<Navigate to="/admin/users" replace />} />
              <Route path="/suppliers" element={<Navigate to="/admin/suppliers" replace />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
          
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
          />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
