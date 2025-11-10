import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';

import 'react-toastify/dist/ReactToastify.css';
import './i18n';

// Componentes y páginas
import PlannerDashboard from './components/PlannerDashboard';
import MainLayout from './components/MainLayout';
import Bodas from './pages/Bodas';
import BodaDetalle from './pages/BodaDetalle';
import Invitados from './pages/Invitados';
import Finance from './pages/Finance';
import Tasks from './pages/Tasks';
import Login from './pages/Login';
import Perfil from './pages/Perfil';

// Contextos
import { AuthProvider } from './hooks/useAuth';
import { WeddingProvider } from './context/WeddingContext';

// Componente de rutas protegidas
function ProtectedRoute({ children }) {
  // Aquí iría la lógica de autenticación
  return children;
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <WeddingProvider>
          <BrowserRouter>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Rutas protegidas para planners */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<PlannerDashboard />} />
                <Route path="/weddings" element={<Bodas />} />
                <Route path="/weddings/:id" element={<BodaDetalle />} />
                <Route path="/weddings/:id/invitados" element={<Invitados />} />
                <Route path="/weddings/:id/finance" element={<Finance />} />
                <Route path="/weddings/:id/tasks" element={<Tasks />} />
                
                {/* Gestión de clientes */}
                <Route path="/clients" element={<div>Clientes (Por implementar)</div>} />
                <Route path="/clients/:id" element={<div>Detalle Cliente (Por implementar)</div>} />
                
                {/* Equipo */}
                <Route path="/team" element={<div>Equipo (Por implementar)</div>} />
                
                {/* Plantillas */}
                <Route path="/templates" element={<div>Plantillas (Por implementar)</div>} />
                
                {/* Configuración */}
                <Route path="/settings" element={<Perfil />} />
                <Route path="/profile" element={<Perfil />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
        </WeddingProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
