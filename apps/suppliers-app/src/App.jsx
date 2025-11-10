import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';

import 'react-toastify/dist/ReactToastify.css';
import './i18n';

// Páginas de proveedores
import SupplierLogin from './pages/suppliers/SupplierLogin';
import SupplierRegister from './pages/suppliers/SupplierRegister';
import SupplierDashboard from './pages/suppliers/SupplierDashboard';
import SupplierRequests from './pages/suppliers/SupplierRequestsNew';
import SupplierRequestDetail from './pages/suppliers/SupplierRequestDetail';
import SupplierPortfolio from './pages/suppliers/SupplierPortfolio';
import SupplierProducts from './pages/suppliers/SupplierProducts';
import SupplierReviews from './pages/suppliers/SupplierReviews';
import SupplierAnalytics from './pages/suppliers/SupplierAnalytics';
import SupplierMessages from './pages/suppliers/SupplierMessages';
import SupplierAvailability from './pages/suppliers/SupplierAvailability';
import SupplierPayments from './pages/suppliers/SupplierPayments';
import SupplierPlans from './pages/suppliers/SupplierPlans';
import SupplierSetPassword from './pages/suppliers/SupplierSetPassword';
import SupplierPortal from './pages/SupplierPortal';

// Hooks y contextos
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<SupplierLogin />} />
            <Route path="/register" element={<SupplierRegister />} />
            <Route path="/setup-password" element={<SupplierSetPassword />} />
            <Route path="/portal/:token" element={<SupplierPortal />} />
            
            {/* Dashboard de proveedores */}
            <Route path="/dashboard/:id" element={<SupplierDashboard />} />
            <Route path="/dashboard/:id/requests" element={<SupplierRequests />} />
            <Route path="/dashboard/:id/request/:requestId" element={<SupplierRequestDetail />} />
            <Route path="/dashboard/:id/portfolio" element={<SupplierPortfolio />} />
            <Route path="/dashboard/:id/products" element={<SupplierProducts />} />
            <Route path="/dashboard/:id/reviews" element={<SupplierReviews />} />
            <Route path="/dashboard/:id/analytics" element={<SupplierAnalytics />} />
            <Route path="/dashboard/:id/messages" element={<SupplierMessages />} />
            <Route path="/dashboard/:id/availability" element={<SupplierAvailability />} />
            <Route path="/dashboard/:id/payments" element={<SupplierPayments />} />
            <Route path="/dashboard/:id/plans" element={<SupplierPlans />} />
            
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
          />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
