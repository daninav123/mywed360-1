import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import DiagnosticPanel from './components/DiagnosticPanel';
import EmailNotification from './components/EmailNotification';
import MainLayout from './components/MainLayout';
import Loader from './components/ui/Loader';
import { WeddingProvider } from './context/WeddingContext';
import { UserPreferencesProvider } from './contexts/UserContext';
import { useAuth, AuthProvider } from './hooks/useAuth';
import AcceptInvitation from './pages/AcceptInvitation';
import BankConnect from './pages/BankConnect.jsx';
import BodaDetalle from './pages/BodaDetalle.jsx';
import Bodas from './pages/Bodas';
import DevEnsureFinance from './pages/DevEnsureFinance';
import DevSeedGuests from './pages/DevSeedGuests';
import Finance from './pages/Finance';
import Home from './pages/Home';
import Invitaciones from './pages/Invitaciones';
import Login from './pages/Login';
import More from './pages/More';
import Perfil from './pages/Perfil';
import Proveedores from './pages/ProveedoresNuevo';
import ResetPassword from './pages/ResetPassword.jsx';
import PublicWedding from './pages/PublicWedding';
import RSVPConfirm from './pages/RSVPConfirm';
import RSVPDashboard from './pages/RSVPDashboard';
import Signup from './pages/Signup';
import SupplierPortal from './pages/SupplierPortal';
import Tasks from './pages/Tasks';
import VerifyEmail from './pages/VerifyEmail.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMetrics from './pages/admin/AdminMetrics.jsx';
import AdminPortfolio from './pages/admin/AdminPortfolio.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminIntegrations from './pages/admin/AdminIntegrations.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminAlerts from './pages/admin/AdminAlerts.jsx';
import AdminBroadcast from './pages/admin/AdminBroadcast.jsx';
import AdminAudit from './pages/admin/AdminAudit.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminSupport from './pages/admin/AdminSupport.jsx';
import WebEditor from './pages/WebEditor';
import WeddingSite from './pages/WeddingSite';
import RequireAdmin from './routes/RequireAdmin.jsx';
// Nota: especificamos la extensi€)n .jsx para asegurar la resoluci€)n en entornos Linux/CI
const Invitados = React.lazy(() => import('./pages/Invitados'));
// Lazy load de páginas pesadas para reducir bundle inicial
// Nueva bandeja de entrada (UI definitiva)
const UnifiedInbox = React.lazy(() => import('./components/email/UnifiedInbox/InboxContainer.jsx'));
const EmailAdminDashboard = React.lazy(() => import('./components/admin/EmailAdminDashboard'));
const ComposeEmail = React.lazy(() => import('./components/email/ComposeEmail'));
const EmailStatistics = React.lazy(() => import('./pages/user/EmailStatistics'));
const EmailTemplatesPage = React.lazy(() => import('./pages/EmailTemplates.jsx'));
const EmailSettingsPage = React.lazy(() => import('./components/email/EmailSettings.jsx'));
const MailgunTester = React.lazy(() => import('./components/email/MailgunTester'));
const EmailSetup = React.lazy(() => import('./pages/EmailSetup'));
//
// Seating plan deshabilitado en build
// (dedupe) Invitaciones ya importado arriba
const Contratos = React.lazy(() => import('./pages/Contratos'));
const DisenoWeb = React.lazy(() => import('./pages/DisenoWeb'));
// Protocolo
const ProtocoloLayout = React.lazy(() => import('./pages/protocolo/ProtocoloLayout'));
const CeremonyProtocol = React.lazy(() => import('./pages/protocolo/CeremonyProtocol'));
const MomentosEspeciales = React.lazy(() => import('./pages/protocolo/MomentosEspeciales'));
const ProtocoloTiming = React.lazy(() => import('./pages/protocolo/Timing'));
const ProtocoloChecklist = React.lazy(() => import('./pages/protocolo/Checklist'));
const ProtocoloAyuda = React.lazy(() => import('./pages/protocolo/AyudaCeremonia'));
const DocumentosLegales = React.lazy(() => import('./pages/protocolo/DocumentosLegales'));
const Momentos = React.lazy(() => import('./pages/Momentos'));
const MomentosGuest = React.lazy(() => import('./pages/MomentosGuest'));
// (dedupe) WebEditor ya importado arriba
// Seating Plan interactivo
const SeatingPlan = React.lazy(() => import('./pages/SeatingPlan.jsx'));
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
const ProveedoresCompareTest = React.lazy(() => import('./pages/test/ProveedoresCompareTest.jsx'));
const ProveedoresSmoke = React.lazy(() => import('./pages/test/ProveedoresSmoke.jsx'));
const ProveedoresFlowHarness = React.lazy(() =>
  import('./pages/test/ProveedoresFlowHarness.jsx')
);
const BudgetApprovalHarness = React.lazy(() =>
  import('./pages/test/BudgetApprovalHarness.jsx')
);
const WeddingTeamHarness = React.lazy(() =>
  import('./pages/test/WeddingTeamHarness.jsx')
);
const CreateWeddingAI = React.lazy(() => import('./pages/CreateWeddingAI.jsx'));
const CreateWeddingAssistant = React.lazy(() =>
  import('./pages/CreateWeddingAssistant.jsx')
);

const Notificaciones = React.lazy(() => import('./pages/Notificaciones'));
// (dedupe) rutas públicas ya importadas arriba

import './utils/consoleCommands';
import UserProvider from './context/UserContext';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Bypass in Cypress tests unless explicitly disabled
  const shouldBypassProtectedRoute =
    typeof window !== 'undefined' &&
    window.Cypress &&
    window.__MYWED360_DISABLE_PROTECTED_BYPASS__ !== true;

  if (shouldBypassProtectedRoute) {
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
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="metrics" element={<AdminMetrics />} />
                  <Route path="portfolio" element={<AdminPortfolio />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="integrations" element={<AdminIntegrations />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="alerts" element={<AdminAlerts />} />
                  <Route path="broadcast" element={<AdminBroadcast />} />
                  <Route path="audit" element={<AdminAudit />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="support" element={<AdminSupport />} />
                </Route>
              </Route>

              {/* Rutas públicas */}
              <Route path="w/:uid" element={<WeddingSite />} />
              <Route path="p/:slug" element={<PublicWedding />} />
              <Route path="supplier/:token" element={<SupplierPortal />} />
              <Route path="invitation/:code" element={<AcceptInvitation />} />
              <Route path="rsvp/:token" element={<RSVPConfirm />} />
              <Route path="momentos/invitados" element={<MomentosGuest />} />

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
                  <Route path="invitados/seating" element={<SeatingPlan />} />
                  <Route path="plan-asientos" element={<Navigate to="/invitados/seating" replace />} />
                  <Route path="invitados/invitaciones" element={<Invitaciones />} />
                  <Route path="rsvp/dashboard" element={<RSVPDashboard />} />
                  <Route path="proveedores" element={<Proveedores />} />
                  <Route path="proveedores/contratos" element={<Contratos />} />

                  {/* Protocolo */}
                  <Route path="protocolo" element={<ProtocoloLayout />}>
                    <Route index element={<Navigate to="resumen" replace />} />
                    <Route path="resumen" element={<CeremonyProtocol />} />
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
                  <Route path="diseno-web/preview" element={<DisenoWeb mode="preview" />} />
                  <Route path="web" element={<WebEditor />} />
                  <Route path="ideas" element={<Ideas />} />
                  <Route path="inspiracion" element={<Inspiration />} />
                  <Route path="blog" element={<Blog />} />
                  <Route path="momentos" element={<Momentos />} />
                  <Route path="more" element={<More />} />
                  <Route path="crear-evento" element={<CreateWeddingAI />} />
                  {/* Alias documentado para acceso manual al asistente de creación */}
                  <Route path="create-wedding-ai" element={<Navigate to="/crear-evento" replace />} />
                  <Route path="crear-evento-asistente" element={<CreateWeddingAssistant />} />

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
                    path="email/plantillas"
                    element={
                      <UserProvider>
                        <EmailTemplatesPage />
                      </UserProvider>
                    }
                  />
                  <Route
                    path="email/stats"
                    element={
                      <UserPreferencesProvider>
                        <EmailStatistics />
                      </UserPreferencesProvider>
                    }
                  />
                  <Route
                    path="email/estadisticas"
                    element={
                      <UserPreferencesProvider>
                        <EmailStatistics />
                      </UserPreferencesProvider>
                    }
                  />
                  <Route path="email/settings" element={<EmailSettingsPage />} />
                  <Route path="email/configuracion" element={<EmailSettingsPage />} />
                  <Route path="email/setup" element={<EmailSetup />} />
                  <Route path="email/test" element={<MailgunTester />} />
                  {/* Rutas de test siempre disponibles en cualquier modo para soportar E2E sin acoplar a entorno */}
                  <Route path="test/proveedores-compare" element={<ProveedoresCompareTest />} />
                    <Route path="test/proveedores-smoke" element={<ProveedoresSmoke />} />
                    <Route path="test/proveedores-flow" element={<ProveedoresFlowHarness />} />
                    <Route path="test/e2eProveedor" element={<BudgetApprovalHarness />} />
                    <Route path="test/wedding-team" element={<WeddingTeamHarness />} />

                    {/* Admin */}
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
