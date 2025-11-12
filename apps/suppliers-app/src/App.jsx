import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Los proveedores usan JWT, no Firebase Auth
// import { AuthProvider } from './context/AuthContext';

// Lazy load pages - usando las rutas REALES de main-app
const SupplierLogin = lazy(() => import('./pages/suppliers/SupplierLogin'));
const SupplierRegister = lazy(() => import('./pages/suppliers/SupplierRegister'));
const SupplierSetPassword = lazy(() => import('./pages/suppliers/SupplierSetPassword'));
const SupplierDashboard = lazy(() => import('./pages/suppliers/SupplierDashboard'));
const SupplierRequestDetail = lazy(() => import('./pages/suppliers/SupplierRequestDetail'));
const SupplierRequests = lazy(() => import('./pages/suppliers/SupplierRequestsNew'));
const SupplierPlans = lazy(() => import('./pages/suppliers/SupplierPlans'));
const SupplierPortfolio = lazy(() => import('./pages/suppliers/SupplierPortfolio'));
const SupplierProducts = lazy(() => import('./pages/suppliers/SupplierProducts'));
const SupplierReviews = lazy(() => import('./pages/suppliers/SupplierReviews'));
const SupplierAnalytics = lazy(() => import('./pages/suppliers/SupplierAnalytics'));
const SupplierMessages = lazy(() => import('./pages/suppliers/SupplierMessages'));
const SupplierAvailability = lazy(() => import('./pages/suppliers/SupplierAvailability'));
const SupplierPayments = lazy(() => import('./pages/suppliers/SupplierPayments'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      {/* Proveedores usan JWT, no AuthProvider de Firebase */}
      <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Default route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Authentication */}
              <Route path="/login" element={<SupplierLogin />} />
              <Route path="/register" element={<SupplierRegister />} />
              <Route path="/registro" element={<SupplierRegister />} />
              <Route path="/set-password" element={<SupplierSetPassword />} />
              
              {/* Supplier Dashboard */}
              <Route path="/dashboard/:supplierId" element={<SupplierDashboard />} />
              <Route path="/requests" element={<SupplierRequests />} />
              <Route path="/request/:requestId" element={<SupplierRequestDetail />} />
              <Route path="/plans" element={<SupplierPlans />} />
              <Route path="/portfolio" element={<SupplierPortfolio />} />
              <Route path="/products" element={<SupplierProducts />} />
              <Route path="/reviews" element={<SupplierReviews />} />
              <Route path="/analytics" element={<SupplierAnalytics />} />
              <Route path="/messages" element={<SupplierMessages />} />
              <Route path="/availability" element={<SupplierAvailability />} />
              <Route path="/payments" element={<SupplierPayments />} />
              
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
    </HelmetProvider>
  );
}

export default App;
