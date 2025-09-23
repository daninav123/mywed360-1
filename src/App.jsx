import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import EmailNotification from './components/EmailNotification';
import MainLayout from './components/MainLayout';
import Loader from './components/ui/Loader';
import { WeddingProvider } from './context/WeddingContext';
import { UserPreferencesProvider } from './contexts/UserContext';
import { useAuth, AuthProvider } from './hooks/useAuth';
import BankConnect from './pages/BankConnect.jsx';
import BodaDetalle from './pages/BodaDetalle.jsx';
import Bodas from './pages/Bodas';
import Finance from './pages/Finance';
import Home from './pages/Home';
import Login from './pages/Login';
import More from './pages/More';
import Signup from './pages/Signup';
import Tasks from './pages/Tasks';
// Nota: especificamos la extensi�n .jsx para asegurar la resoluci�n en entornos Linux/CI
const Invitados = React.lazy(() => import('./pages/Invitados'));
import Proveedores from './pages/ProveedoresNuevo';
// Lazy load de páginas pesadas para reducir bundle inicial
// Nueva bandeja de entrada (UI definitiva)
const UnifiedInbox = React.lazy(() => import('./components/email/UnifiedInbox/InboxContainer.jsx'));
const EmailAdminDashboard = React.lazy(() => import('./components/admin/EmailAdminDashboard'));
const ComposeEmail = React.lazy(() => import('./components/email/ComposeEmail'));
const EmailStatistics = React.lazy(() => import('./pages/user/EmailStatistics'));
const MailgunTester = React.lazy(() => import('./components/email/MailgunTester'));
const EmailSetup = React.lazy(() => import('./pages/EmailSetup'));
import AdminRoutes from './routes/AdminRoutes';
import Perfil from './pages/Perfil';
const SeatingPlanRefactored = React.lazy(
  () => import('./components/seating/SeatingPlanRefactored.jsx')
);
import Invitaciones from './pages/Invitaciones';
const Contratos = React.lazy(() => import('./pages/Contratos'));
const DisenoWeb = React.lazy(() => import('./pages/DisenoWeb'));
// Protocolo
const ProtocoloLayout = React.lazy(() => import('./pages/protocolo/ProtocoloLayout'));
const MomentosEspeciales = React.lazy(() => import('./pages/protocolo/MomentosEspeciales'));
const ProtocoloTiming = React.lazy(() => import('./pages/protocolo/Timing'));
const ProtocoloChecklist = React.lazy(() => import('./pages/protocolo/Checklist'));
const ProtocoloAyuda = React.lazy(() => import('./pages/protocolo/AyudaCeremonia'));
const DocumentosLegales = React.lazy(() => import('./pages/protocolo/DocumentosLegales'));
import WebEditor from './pages/WebEditor';
const DisenosLayout = React.lazy(() => import('./pages/disenos/DisenosLayout'));
const DisenosInvitaciones = React.lazy(() => import('./pages/disenos/Invitaciones'));
const DisenosLogo = React.lazy(() => import('./pages/disenos/Logo'));
const MenuDiseno = React.lazy(() => import('./pages/disenos/Menu'));
const SeatingPlanPost = React.lazy(() => import('./pages/disenos/SeatingPlanPost'));
const MenuCatering = React.lazy(() => import('./pages/disenos/MenuCatering'));
const PapelesNombres = React.lazy(() => import('./pages/disenos/PapelesNombres'));
const DisenosVectorEditor = React.lazy(() => import('./pages/disenos/VectorEditor'));
const MisDisenos = React.lazy(() => import('./pages/disenos/MisDisenos'));
const Ideas = React.lazy(() => import('./pages/Ideas'));
const Inspiration = React.lazy(() => import('./pages/Inspiration'));
const Blog = React.lazy(() => import('./pages/Blog'));
import DevSeedGuests from './pages/DevSeedGuests';
import DevEnsureFinance from './pages/DevEnsureFinance';

const Notificaciones = React.lazy(() => import('./pages/Notificaciones'));
import WeddingSite from './pages/WeddingSite';
import RSVPConfirm from './pages/RSVPConfirm';
import AcceptInvitation from './pages/AcceptInvitation';
import RSVPDashboard from './pages/RSVPDashboard';
import PublicWedding from './pages/PublicWedding';
import SupplierPortal from './pages/SupplierPortal';

import './i18n';
import DiagnosticPanel from './components/DiagnosticPanel';
import './utils/consoleCommands';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Bypass in Cypress tests
  if (typeof window !== 'undefined' && window.Cypress) {
    return (
      <>
        <Outlet />
        <EmailNotification />
      </>
    );
  }

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

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
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-10 h-10" />
                <span className="ml-3 text-lg">Cargando...</span>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Rutas públicas */}
              <Route path="w/:uid" element={<WeddingSite />} />
              <Route path="p/:slug" element={<PublicWedding />} />
              <Route path="supplier/:token" element={<SupplierPortal />} />
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
                  <Route path="finance/bank-connect" element={<BankConnect />} />
                  <Route path="invitados" element={<Invitados />} />
                  <Route path="invitados/seating" element={<SeatingPlanRefactored />} />
                  <Route path="invitados/invitaciones" element={<Invitaciones />} />
                  <Route path="rsvp/dashboard" element={<RSVPDashboard />} />
                  <Route path="proveedores" element={<Proveedores />} />
                  <Route path="proveedores/contratos" element={<Contratos />} />

                  {/* Protocolo */}
                  <Route path="protocolo" element={<ProtocoloLayout />}>
                    <Route index element={<Navigate to="momentos-especiales" replace />} />
                    <Route path="momentos-especiales" element={<MomentosEspeciales />} />
                    <Route path="timing" element={<ProtocoloTiming />} />
                    <Route path="checklist" element={<ProtocoloChecklist />} />
                    <Route path="ayuda-ceremonia" element={<ProtocoloAyuda />} />
                    <Route path="documentos" element={<DocumentosLegales />} />
                    {/* Legacy path redirect to the new one */}
                    <Route
                      path="documentos-legales"
                      element={<Navigate to="documentos" replace />}
                    />
                  </Route>

                  {/* Diseños */}
                  <Route path="disenos" element={<DisenosLayout />}>
                    <Route index element={<Navigate to="invitaciones" replace />} />
                    <Route path="invitaciones" element={<DisenosInvitaciones />} />
                    <Route path="invitacion-vector" element={<DisenosInvitaciones />} />
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

                  {/* Email (UI nueva por defecto) */}
                  <Route path="email" element={<UnifiedInbox />} />
                  <Route path="email/inbox" element={<UnifiedInbox />} />
                  {/* Alias temporal */}
                  <Route path="email-new" element={<UnifiedInbox />} />
                  {/* Legacy redirect */}
                  <Route path="user/email" element={<Navigate to="/email" replace />} />
                  <Route path="email/compose" element={<ComposeEmail />} />
                  <Route path="email/compose/:action/:id" element={<ComposeEmail />} />
                  <Route
                    path="email/stats"
                    element={
                      <UserPreferencesProvider>
                        <EmailStatistics />
                      </UserPreferencesProvider>
                    }
                  />
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
          </React.Suspense>
          <DiagnosticPanel />
        </BrowserRouter>
      </WeddingProvider>
    </AuthProvider>
  );
}

export default App;
