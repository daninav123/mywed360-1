import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';

import 'react-toastify/dist/ReactToastify.css';
import './i18n';

// Páginas de admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMetrics from './pages/admin/AdminMetricsComplete';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminBlog from './pages/admin/AdminBlog';
import AdminPortfolio from './pages/admin/AdminPortfolio';
import AdminIntegrations from './pages/admin/AdminIntegrations';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAlerts from './pages/admin/AdminAlerts';
import AdminBroadcast from './pages/admin/AdminBroadcast';
import AdminAutomations from './pages/admin/AdminAutomations';
import AdminDiscounts from './pages/admin/AdminDiscounts';
import AdminReports from './pages/admin/AdminReports';
import AdminSupport from './pages/admin/AdminSupport';
import AdminTaskTemplates from './pages/admin/AdminTaskTemplates';
import AdminDebugPayments from './pages/admin/AdminDebugPayments';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminRevolut from './pages/admin/AdminRevolut';

// Componente de rutas protegidas
import RequireAdmin from './routes/RequireAdmin';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Login de admin */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Rutas protegidas de admin */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="metrics" element={<AdminMetrics />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="suppliers" element={<AdminSuppliers />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="integrations" element={<AdminIntegrations />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="alerts" element={<AdminAlerts />} />
              <Route path="broadcast" element={<AdminBroadcast />} />
              <Route path="automations" element={<AdminAutomations />} />
              <Route path="commerce" element={<AdminDiscounts />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="task-templates" element={<AdminTaskTemplates />} />
              <Route path="debug/payments" element={<AdminDebugPayments />} />
              <Route path="finance/payouts" element={<AdminPayouts />} />
              <Route path="finance/revolut" element={<AdminRevolut />} />
            </Route>
          </Route>
          
          {/* Redireccionamiento después de login */}
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
