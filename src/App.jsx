import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { WeddingProvider } from './context/WeddingContext';
import MainLayout from './components/MainLayout';
import EmailNotification from './components/EmailNotification';
import Loader from './components/ui/Loader';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Bodas from './pages/Bodas';
import BodaDetalle from './pages/BodaDetalle';
import Finance from './pages/Finance';
import More from './pages/More';
import Invitados from './pages/Invitados';
import Proveedores from './pages/Proveedores';
import UnifiedEmail from './pages/UnifiedEmail';
import EmailAdminDashboard from './components/admin/EmailAdminDashboard';
import ComposeEmail from './components/email/ComposeEmail';
import EmailStatistics from './pages/user/EmailStatistics';
import MailgunTester from './components/email/MailgunTester';
import EmailSetup from './pages/EmailSetup';
import MetricsDashboard from './components/metrics/MetricsDashboard';
import AdminRoutes from './routes/AdminRoutes';
import UserRoutes from './routes/UserRoutes';
import WhatsAppMetrics from './components/whatsapp/WhatsAppMetrics';

import Perfil from './pages/Perfil';
import SeatingPlanRefactored from './components/seating/SeatingPlanRefactored.jsx';
import Invitaciones from './pages/Invitaciones';
import Contratos from './pages/Contratos';
import DisenoWeb from './pages/DisenoWeb';
import WebEditor from './pages/WebEditor';
import DisenosLayout from './pages/disenos/DisenosLayout';
import DisenosInvitaciones from './pages/disenos/Invitaciones';
import DisenosLogo from './pages/disenos/Logo';
import MenuDiseno from './pages/disenos/Menu';
import SeatingPlanPost from './pages/disenos/SeatingPlanPost';
import MenuCatering from './pages/disenos/MenuCatering';
import PapelesNombres from './pages/disenos/PapelesNombres';
import DisenosVectorEditor from './pages/disenos/VectorEditor';
import MisDisenos from './pages/disenos/MisDisenos';
import Ideas from './pages/Ideas';
import Inspiration from './pages/Inspiration';
import Blog from './pages/Blog';
import DevSeedGuests from './pages/DevSeedGuests';
import DevEnsureFinance from './pages/DevEnsureFinance';

import Notificaciones from './pages/Notificaciones';
import WeddingSite from './pages/WeddingSite';
import RSVPConfirm from './pages/RSVPConfirm';
import AcceptInvitation from './pages/AcceptInvitation';
import RSVPDashboard from './pages/RSVPDashboard';
import PublicWedding from './pages/PublicWedding';

import './i18n';
import DiagnosticPanel from './components/DiagnosticPanel';
import './utils/consoleCommands';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hasRedirected = React.useRef(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.Cypress) return;
    if (hasRedirected.current) return;

    if (!isLoading && !isAuthenticated) {
      if (location.pathname !== '/login' && location.pathname !== '/') {
        hasRedirected.current = true;
        navigate('/login', { replace: true, state: { from: location } });
      }
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  if (typeof window !== 'undefined' && window.Cypress) {
    return (
      <>
        <Outlet />
        <EmailNotification />
      </>
    );
  }

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <>
      <Outlet />
      <EmailNotification />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <WeddingProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ToastContainer position="top-right" autoClose={4000} hideProgressBar newestOnTop />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Rutas públicas */}
            <Route path="w/:uid" element={<WeddingSite />} />
            <Route path="p/:slug" element={<PublicWedding />} />
            <Route path="invitation/:code" element={<AcceptInvitation />} />
            <Route path="rsvp/:token" element={<RSVPConfirm />} />

            {/* Dev tools públicas */}
            <Route path="dev/seed-guests" element={<DevSeedGuests />} />
            <Route path="dev/ensure-finance" element={<DevEnsureFinance />} />

            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="home" element={<Home />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="bodas" element={<Bodas />} />
                <Route path="bodas/:id" element={<BodaDetalle />} />
                <Route path="finance" element={<Finance />} />
                <Route path="invitados" element={<Invitados />} />
                <Route path="invitados/seating" element={<SeatingPlanRefactored />} />
                <Route path="invitados/invitaciones" element={<Invitaciones />} />
                <Route path="rsvp/dashboard" element={<RSVPDashboard />} />
                <Route path="proveedores" element={<Proveedores />} />
                <Route path="proveedores/contratos" element={<Contratos />} />

                {/* Protocolo */}
                <Route path="protocolo" element={<DisenoWeb />}> {/* placeholder or actual ProtocoloLayout if available */}
                  <Route index element={<Navigate to="momentos-especiales" replace />} />
                </Route>

                {/* Diseños */}
                <Route path="disenos" element={<DisenosLayout />}>
                  <Route index element={<Navigate to="invitaciones" replace />} />
                  <Route path="invitaciones" element={<DisenosInvitaciones />} />
                  <Route path="logo" element={<DisenosLogo />} />
                  <Route path="menu" element={<MenuDiseno />} />
                  <Route path="seating-plan" element={<SeatingPlanPost />} />
                  <Route path="menu-catering" element={<MenuCatering />} />
                  <Route path="papeles-nombres" element={<PapelesNombres />} />
                  <Route path="vector-editor" element={<DisenosVectorEditor />} />
                  <Route path="mis-disenos" element={<MisDisenos />} />
                </Route>

                {/* Extras */}
                <Route path="perfil" element={<Perfil />} />
                <Route path="notificaciones" element={<Notificaciones />} />
                <Route path="diseno-web" element={<DisenoWeb />} />
                <Route path="web" element={<WebEditor />} />
                <Route path="ideas" element={<Ideas />} />
                <Route path="inspiracion" element={<Inspiration />} />
                <Route path="blog" element={<Blog />} />
                <Route path="more" element={<More />} />

                {/* Email */}
                <Route path="email" element={<UnifiedEmail />} />
                <Route path="email/inbox" element={<UnifiedEmail />} />
                <Route path="email/compose" element={<ComposeEmail />} />
                <Route path="email/compose/:action/:id" element={<ComposeEmail />} />
                <Route path="email/stats" element={<EmailStatistics />} />
                <Route path="email/setup" element={<EmailSetup />} />
                <Route path="email/test" element={<MailgunTester />} />

                {/* Admin */}
                <Route path="admin/*" element={<AdminRoutes />} />
                <Route path="email-admin" element={<EmailAdminDashboard />} />

                <Route path="*" element={<Navigate to="/home" replace />} />
              </Route>
            </Route>
          </Routes>
          {/* Sistema de diagnóstico global */}
          <DiagnosticPanel />
        </BrowserRouter>
      </WeddingProvider>
    </AuthProvider>
  );
}

export default App;
