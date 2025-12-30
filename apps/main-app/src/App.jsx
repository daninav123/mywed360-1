import { HelmetProvider } from 'react-helmet-async';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { SupplierCompareProvider } from './contexts/SupplierCompareContext';
import { SupplierNotesProvider } from './contexts/SupplierNotesContext';
import { SupplierContactsProvider } from './contexts/SupplierContactsContext';

import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import DiagnosticPanel from './components/DiagnosticPanel';
import EmailNotification from './components/EmailNotification';
import MainLayout from './components/MainLayout';
import Loader from './components/ui/Loader';
import { WeddingProvider } from './context/WeddingContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { UserPreferencesProvider } from './contexts/UserContext';
import { useAuth, AuthProvider } from './hooks/useAuth';
import useSupplierSpecs from './hooks/useSupplierSpecs';
import AcceptInvitation from './pages/AcceptInvitation';
import Home from './pages/Home';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
const BankConnect = React.lazy(() => import('./pages/BankConnect.jsx'));
const BodaDetalle = React.lazy(() => import('./pages/BodaDetalle.jsx'));
const Bodas = React.lazy(() => import('./pages/Bodas'));
const DevEnsureFinance = React.lazy(() => import('./pages/DevEnsureFinance'));
const DevSeedGuests = React.lazy(() => import('./pages/DevSeedGuests'));
const Finance = React.lazy(() => import('./pages/Finance'));
const HomeUser = React.lazy(() => import('./pages/HomeUser.jsx'));
const Home2 = React.lazy(() => import('./pages/Home2.jsx'));
const Landing2 = React.lazy(() => import('./pages/Landing2.jsx'));
const Invitaciones = React.lazy(() => import('./pages/Invitaciones'));
const More = React.lazy(() => import('./pages/More'));
const Perfil = React.lazy(() => import('./pages/Perfil'));
const InfoBoda = React.lazy(() => import('./pages/InfoBoda'));
const GestionProveedores = React.lazy(() => import('./pages/GestionProveedores.jsx'));
const SavedSuppliers = React.lazy(() => import('./pages/SavedSuppliers.jsx'));
const SupplierCompare = React.lazy(() => import('./pages/SupplierCompare.jsx'));
const QuoteResponsesPage = React.lazy(() => import('./pages/QuoteResponsesPage.jsx'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword.jsx'));
const PublicWedding = React.lazy(() => import('./pages/PublicWedding'));
const PublicQuoteResponse = React.lazy(() => import('./pages/PublicQuoteResponse'));
const RSVPConfirm = React.lazy(() => import('./pages/RSVPConfirm'));
const RSVPDashboard = React.lazy(() => import('./pages/RSVPDashboard'));
const SupplierPortal = React.lazy(() => import('./pages/SupplierPortal'));
const SupplierRegistration = React.lazy(() => import('./pages/SupplierRegistration'));
const SupplierLogin = React.lazy(() => import('./pages/suppliers/SupplierLogin'));
const SupplierSetPassword = React.lazy(() => import('./pages/suppliers/SupplierSetPassword'));
const SupplierRegister = React.lazy(() => import('./pages/suppliers/SupplierRegister'));
const SupplierDashboard = React.lazy(() => import('./pages/suppliers/SupplierDashboard'));
const SupplierRequestDetail = React.lazy(() => import('./pages/suppliers/SupplierRequestDetail'));
const SupplierRequests = React.lazy(() => import('./pages/suppliers/SupplierRequestsNew'));
const SupplierPlans = React.lazy(() => import('./pages/suppliers/SupplierPlans'));
const SupplierPortfolio = React.lazy(() => import('./pages/suppliers/SupplierPortfolio'));
const SupplierProducts = React.lazy(() => import('./pages/suppliers/SupplierProducts'));
const SupplierReviews = React.lazy(() => import('./pages/suppliers/SupplierReviews'));
const SupplierAnalytics = React.lazy(() => import('./pages/suppliers/SupplierAnalytics'));
const SupplierMessages = React.lazy(() => import('./pages/suppliers/SupplierMessages'));
const SupplierAvailability = React.lazy(() => import('./pages/suppliers/SupplierAvailability'));
const SupplierPayments = React.lazy(() => import('./pages/suppliers/SupplierPayments'));
const SupplierDebug = React.lazy(() => import('./pages/suppliers/SupplierDebug'));
const SupplierPublicPage = React.lazy(() => import('./pages/SupplierPublicPage'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const TasksAI = React.lazy(() => import('./pages/TasksAI'));
const Checklist = React.lazy(() => import('./pages/Checklist'));
const PhotoShotListPage = React.lazy(() => import('./pages/PhotoShotListPage'));
const PruebasEnsayos = React.lazy(() => import('./pages/PruebasEnsayos'));
const DesignWizard = React.lazy(() => import('./pages/DesignWizard'));
const TransporteLogistica = React.lazy(() => import('./pages/TransporteLogistica'));
const GestionNinos = React.lazy(() => import('./pages/GestionNinos'));
const WeddingTeam = React.lazy(() => import('./pages/WeddingTeam'));
const EventosRelacionados = React.lazy(() => import('./pages/EventosRelacionados'));
const TramitesLegales = React.lazy(() => import('./pages/TramitesLegales'));
const InvitadosEspeciales = React.lazy(() => import('./pages/InvitadosEspeciales'));
const DiaDeBoda = React.lazy(() => import('./pages/DiaDeBoda'));
const PostBoda = React.lazy(() => import('./pages/PostBoda'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail.jsx'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminMetrics = React.lazy(() => import('./pages/admin/AdminMetricsComplete.jsx'));
const AdminPortfolio = React.lazy(() => import('./pages/admin/AdminPortfolio.jsx'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminSpecsManager = React.lazy(() => import('./pages/admin/AdminSpecsManager.jsx'));
const AdminIntegrations = React.lazy(() => import('./pages/admin/AdminIntegrations.jsx'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings.jsx'));
const AdminAlerts = React.lazy(() => import('./pages/admin/AdminAlerts.jsx'));
const AdminBroadcast = React.lazy(() => import('./pages/admin/AdminBroadcast.jsx'));
const AdminAutomations = React.lazy(() => import('./pages/admin/AdminAutomations.jsx'));
const AdminDiscounts = React.lazy(() => import('./pages/admin/AdminDiscounts.jsx'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports.jsx'));
const AdminSupport = React.lazy(() => import('./pages/admin/AdminSupport.jsx'));
const AdminSuppliers = React.lazy(() => import('./pages/admin/AdminSuppliers.jsx'));
const AdminTaskTemplates = React.lazy(() => import('./pages/admin/AdminTaskTemplates.jsx'));
const AdminBlog = React.lazy(() => import('./pages/admin/AdminBlog.jsx'));
const AdminDebugPayments = React.lazy(() => import('./pages/admin/AdminDebugPayments.jsx'));
const AdminRevolut = React.lazy(() => import('./pages/admin/AdminRevolut.jsx'));
const AdminPayouts = React.lazy(() => import('./pages/admin/AdminPayouts.jsx'));
const PartnerStats = React.lazy(() => import('./pages/PartnerStats.jsx'));
const WebEditor = React.lazy(() => import('./pages/WebEditor'));
const WeddingSite = React.lazy(() => import('./pages/WeddingSite'));
const PublicWeb = React.lazy(() => import('./pages/PublicWeb'));
const PublicRSVP = React.lazy(() => import('./pages/PublicRSVP'));
const DJDownloadsPage = React.lazy(() => import('./pages/DJDownloadsPage'));
import RequireAdmin from './routes/RequireAdmin.jsx';
const MarketingAppOverview = React.lazy(() => import('./pages/marketing/AppOverview.jsx'));
const MarketingPricing = React.lazy(() => import('./pages/marketing/Pricing.jsx'));
const MarketingAccess = React.lazy(() => import('./pages/marketing/Access.jsx'));
const ForSuppliers = React.lazy(() => import('./pages/marketing/ForSuppliers.jsx'));
const ForPlanners = React.lazy(() => import('./pages/marketing/ForPlanners.jsx'));
const Partners = React.lazy(() => import('./pages/marketing/Partners.jsx'));
const PaymentSuccess = React.lazy(() => import('./pages/payment/PaymentSuccess.jsx'));
const PaymentCancel = React.lazy(() => import('./pages/payment/PaymentCancel.jsx'));
const SubscriptionDashboard = React.lazy(() => import('./pages/SubscriptionDashboard.jsx'));
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
const WebBuilderPage = React.lazy(() => import('./pages/WebBuilderPage'));
const WebBuilderPageCraft = React.lazy(() => import('./pages/WebBuilderPageCraft'));
const WebBuilderDashboard = React.lazy(() => import('./pages/WebBuilderDashboard'));
const WebPreview = React.lazy(() => import('./pages/WebPreview'));
// Protocolo
const ProtocoloLayout = React.lazy(() => import('./pages/protocolo/ProtocoloLayout'));
const MomentosEspecialesSimple = React.lazy(
  () => import('./pages/protocolo/MomentosEspecialesSimple')
);
const ProtocoloTiming = React.lazy(() => import('./pages/protocolo/Timing'));
const WeddingDayMode = React.lazy(() => import('./pages/protocolo/WeddingDayMode'));
const ProtocoloChecklist = React.lazy(() => import('./pages/protocolo/Checklist'));
const ProtocoloAyuda = React.lazy(() => import('./pages/protocolo/AyudaCeremonia'));
const DocumentosLegales = React.lazy(() => import('./pages/protocolo/DocumentosLegales'));
const Momentos = React.lazy(() => import('./pages/Momentos'));
const MomentosGuest = React.lazy(() => import('./pages/MomentosGuest'));
const MomentosPublic = React.lazy(() => import('./pages/MomentosPublic'));
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
const DesignEditor = React.lazy(() => import('./pages/design-editor/DesignEditor'));
const Ideas = React.lazy(() => import('./pages/Ideas'));
const Inspiration = React.lazy(() => import('./pages/Inspiration'));
const Blog = React.lazy(() => import('./pages/Blog'));
const BlogPost = React.lazy(() => import('./pages/BlogPost.jsx'));
const BlogAuthor = React.lazy(() => import('./pages/BlogAuthor.jsx'));
const ProveedoresCompareTest = React.lazy(() => import('./pages/test/ProveedoresCompareTest.jsx'));
const ProveedoresSmoke = React.lazy(() => import('./pages/test/ProveedoresSmoke.jsx'));
const ProveedoresFlowHarness = React.lazy(() => import('./pages/test/ProveedoresFlowHarness.jsx'));
const BudgetApprovalHarness = React.lazy(() => import('./pages/test/BudgetApprovalHarness.jsx'));
const WeddingTeamHarness = React.lazy(() => import('./pages/test/WeddingTeamHarness.jsx'));
const RoleUpgradeHarness = React.lazy(() => import('./pages/test/RoleUpgradeHarness.jsx'));
const CreateWeddingAI = React.lazy(() => import('./pages/CreateWeddingAI.jsx'));
const CreateWeddingAssistant = React.lazy(() => import('./pages/CreateWeddingAssistant.jsx'));
const Notificaciones = React.lazy(() => import('./pages/Notificaciones'));
const StyleDemo = React.lazy(() => import('./pages/StyleDemo'));

import UserProvider from './context/UserContext';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Detect test environment - more robust detection
  const isTestMode =
    (typeof window !== 'undefined' && window.Cypress) ||
    import.meta.env.VITE_TEST_MODE === 'true' ||
    (typeof window !== 'undefined' && window.__MALOVEAPP_TEST_MODE__ === true);

  // Bypass in tests unless explicitly disabled
  const shouldBypassProtectedRoute =
    isTestMode &&
    (typeof window === 'undefined' || window.__MALOVEAPP_DISABLE_PROTECTED_BYPASS__ !== true);

  // Also bypass if user is "logged in" via localStorage (for Cypress)
  const hasStoredAuth = () => {
    try {
      const isLoggedIn = window.localStorage.getItem('isLoggedIn');
      const userProfile = window.localStorage.getItem('MaLoveApp_user_profile');
      const mockUser = window.localStorage.getItem('MaLoveApp_mock_user');
      return isLoggedIn === 'true' || userProfile || mockUser;
    } catch (e) {
      return false;
    }
  };

  if (shouldBypassProtectedRoute || hasStoredAuth()) {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV && isTestMode && (
          <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-2 py-1 text-xs rounded opacity-50">
            TEST MODE
          </div>
        )}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function RootLandingRoute() {
  const location = useLocation();
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(location.search || window.location.search || '');
    const normalize = (value) =>
      String(value || '')
        .trim()
        .toLowerCase();
    const checkTruthy = (value) => ['1', 'true', 'app', 'mobile', 'yes'].includes(normalize(value));

    const forcedWeb = checkTruthy(searchParams.get('web')) || checkTruthy(searchParams.get('site'));
    const forcedApp =
      checkTruthy(searchParams.get('app')) ||
      checkTruthy(searchParams.get('mode')) ||
      checkTruthy(searchParams.get('context'));

    const matchStandalone =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = Boolean(window.navigator?.standalone);
    const userAgent = (window.navigator?.userAgent || '').toLowerCase();
    const isInAppUA =
      userAgent.includes('lovendaapp') ||
      userAgent.includes('mywed360app') ||
      (userAgent.includes('wv') && userAgent.includes('android'));

    const shouldRedirect =
      !forcedWeb && (forcedApp || matchStandalone || isIOSStandalone || isInAppUA);
    setShouldRedirectToLogin(shouldRedirect);
  }, [location]);

  if (shouldRedirectToLogin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Home />;
}

function App() {
  // Cargar especificaciones dinámicas de proveedores al iniciar
  useSupplierSpecs();

  return (
    <HelmetProvider>
      <AuthProvider>
        <UserProvider>
          <WeddingProvider>
            <FavoritesProvider>
              <SupplierCompareProvider>
                <SupplierNotesProvider>
                  <SupplierContactsProvider>
                    <BrowserRouter
                      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
                    >
                      <ToastContainer
                        position="top-right"
                        autoClose={4000}
                        hideProgressBar
                        newestOnTop
                      />
                      <React.Suspense
                        fallback={
                          <div className="flex items-center justify-center min-h-screen">
                            <Loader className="w-10 h-10" />
                            <span className="ml-3 text-lg">Cargando...</span>
                          </div>
                        }
                      >
                        <Routes>
                          <Route path="/" element={<RootLandingRoute />} />
                          <Route path="/app" element={<MarketingAppOverview />} />
                          <Route path="/producto" element={<Navigate to="/app" replace />} />
                          <Route path="/precios" element={<MarketingPricing />} />
                          <Route path="/pricing" element={<Navigate to="/precios" replace />} />
                          <Route path="/acceso" element={<MarketingAccess />} />
                          <Route path="/para-proveedores" element={<ForSuppliers />} />
                          <Route path="/para-planners" element={<ForPlanners />} />
                          <Route path="/partners" element={<Partners />} />
                          <Route path="/blog" element={<Blog />} />
                          <Route path="/blog/autor/:slug" element={<BlogAuthor />} />
                          <Route path="/blog/:slug" element={<BlogPost />} />
                          <Route path="/payment/success" element={<PaymentSuccess />} />
                          <Route path="/payment/cancel" element={<PaymentCancel />} />
                          <Route path="/landing2" element={<Landing2 />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/signup" element={<Signup />} />
                          <Route path="/registro" element={<Navigate to="/signup" replace />} />
                          <Route path="/verify-email" element={<VerifyEmail />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/partner/:token" element={<PartnerStats />} />
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route element={<RequireAdmin />}>
                            <Route path="/admin" element={<AdminLayout />}>
                              <Route index element={<Navigate to="dashboard" replace />} />
                              <Route path="dashboard" element={<AdminDashboard />} />
                              <Route path="metrics" element={<AdminMetrics />} />
                              <Route path="portfolio" element={<AdminPortfolio />} />
                              <Route path="users" element={<AdminUsers />} />
                              <Route path="suppliers" element={<AdminSuppliers />} />
                              <Route path="blog" element={<AdminBlog />} />
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
                              <Route path="specs" element={<AdminSpecsManager />} />
                            </Route>
                          </Route>
                          <Route path="/" element={<RootLandingRoute />} />
                          <Route path="/app" element={<MarketingAppOverview />} />
                          <Route path="/producto" element={<Navigate to="/app" replace />} />
                          <Route path="/precios" element={<MarketingPricing />} />
                          <Route path="/pricing" element={<Navigate to="/precios" replace />} />
                          <Route path="/acceso" element={<MarketingAccess />} />
                          <Route path="/payment/success" element={<PaymentSuccess />} />
                          <Route path="/payment/cancel" element={<PaymentCancel />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/signup" element={<Signup />} />
                          <Route path="/registro" element={<Navigate to="/signup" replace />} />
                          <Route path="/verify-email" element={<VerifyEmail />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/partner/:token" element={<PartnerStats />} />
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route element={<RequireAdmin />}>
                            <Route path="/admin" element={<AdminLayout />}>
                              <Route index element={<Navigate to="dashboard" replace />} />
                              <Route path="dashboard" element={<AdminDashboard />} />
                              <Route path="metrics" element={<AdminMetrics />} />
                              <Route path="portfolio" element={<AdminPortfolio />} />
                              <Route path="users" element={<AdminUsers />} />
                              <Route path="suppliers" element={<AdminSuppliers />} />
                              <Route path="blog" element={<AdminBlog />} />
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
                              <Route path="specs" element={<AdminSpecsManager />} />
                              <Route path="specs" element={<AdminSpecsManager />} />
                            </Route>
                          </Route>

                          {/* Rutas públicas */}
                          <Route path="w/:uid" element={<WeddingSite />} />
                          <Route path="p/:slug" element={<PublicWedding />} />
                          <Route path="web/:slug" element={<PublicWeb />} />
                          <Route path="rsvp/:slug" element={<PublicRSVP />} />
                          <Route
                            path="dj-downloads/:weddingId/:token"
                            element={<DJDownloadsPage />}
                          />

                          {/* Respuesta pública de presupuestos (proveedores responden por email) */}
                          <Route
                            path="responder-presupuesto/:token"
                            element={<PublicQuoteResponse />}
                          />

                          {/* Portal de proveedores */}
                          <Route path="supplier/registro" element={<SupplierRegistration />} />
                          <Route path="supplier/login" element={<SupplierLogin />} />
                          <Route path="supplier/debug" element={<SupplierDebug />} />
                          <Route path="supplier/setup-password" element={<SupplierSetPassword />} />
                          <Route path="supplier/register" element={<SupplierRegister />} />
                          <Route path="supplier/dashboard/:id" element={<SupplierDashboard />} />
                          <Route
                            path="supplier/dashboard/:id/requests"
                            element={<SupplierRequests />}
                          />
                          <Route path="supplier/dashboard/:id/plans" element={<SupplierPlans />} />
                          <Route
                            path="supplier/dashboard/:id/portfolio"
                            element={<SupplierPortfolio />}
                          />
                          <Route
                            path="supplier/dashboard/:id/products"
                            element={<SupplierProducts />}
                          />
                          <Route
                            path="supplier/dashboard/:id/reviews"
                            element={<SupplierReviews />}
                          />
                          <Route
                            path="supplier/dashboard/:id/analytics"
                            element={<SupplierAnalytics />}
                          />
                          <Route
                            path="supplier/dashboard/:id/messages"
                            element={<SupplierMessages />}
                          />
                          <Route
                            path="supplier/dashboard/:id/availability"
                            element={<SupplierAvailability />}
                          />
                          <Route
                            path="supplier/dashboard/:id/payments"
                            element={<SupplierPayments />}
                          />
                          <Route
                            path="supplier/dashboard/:id/request/:requestId"
                            element={<SupplierRequestDetail />}
                          />
                          <Route path="proveedor/:slug" element={<SupplierPublicPage />} />
                          <Route path="supplier/:token" element={<SupplierPortal />} />
                          <Route path="invitation/:code" element={<AcceptInvitation />} />
                          <Route path="rsvp/:token" element={<RSVPConfirm />} />
                          <Route path="momentos/invitados" element={<MomentosGuest />} />
                          <Route path="momentos/recuerdos" element={<MomentosPublic />} />
                          {/* Rutas de test públicas para E2E (duplicadas también en layout protegido) */}
                          <Route
                            path="test/proveedores-flow"
                            element={<ProveedoresFlowHarness />}
                          />
                          <Route path="test/proveedores-smoke" element={<ProveedoresSmoke />} />
                          <Route
                            path="test/proveedores-compare"
                            element={<ProveedoresCompareTest />}
                          />

                          {/* Dev tools públicas */}
                          <Route path="dev/seed-guests" element={<DevSeedGuests />} />
                          <Route path="dev/ensure-finance" element={<DevEnsureFinance />} />
                          
                          {/* Style Demo */}
                          <Route path="style-demo" element={<StyleDemo />} />

                          {/* Rutas protegidas */}
                          <Route element={<ProtectedRoute />}>
                            {/* Home2 fuera de MainLayout para diseño full-screen */}
                            <Route path="home2" element={<Home2 />} />
                            
                            <Route element={<MainLayout />}>
                              <Route path="home" element={<HomeUser />} />
                              <Route path="tasks" element={<Tasks />} />
                              <Route path="tareas-ia" element={<TasksAI />} />
                              <Route path="checklist" element={<Checklist />} />
                              <Route path="shot-list" element={<PhotoShotListPage />} />
                              <Route path="pruebas-ensayos" element={<PruebasEnsayos />} />
                              <Route path="design-wizard" element={<DesignWizard />} />
                              <Route path="transporte" element={<TransporteLogistica />} />
                              <Route path="gestion-ninos" element={<GestionNinos />} />
                              <Route path="wedding-team" element={<WeddingTeam />} />
                              <Route
                                path="eventos-relacionados"
                                element={<EventosRelacionados />}
                              />
                              <Route path="tramites-legales" element={<TramitesLegales />} />
                              <Route
                                path="invitados-especiales"
                                element={<InvitadosEspeciales />}
                              />
                              <Route path="dia-de-boda" element={<DiaDeBoda />} />
                              <Route path="post-boda" element={<PostBoda />} />
                              <Route path="bodas" element={<Bodas />} />
                              <Route path="bodas/:id" element={<BodaDetalle />} />
                              <Route path="finance" element={<Finance />} />
                              <Route path="finance/bank-connect" element={<BankConnect />} />
                              <Route path="invitados" element={<Invitados />} />
                              <Route path="invitados/seating" element={<SeatingPlan />} />
                              <Route
                                path="plan-asientos"
                                element={<Navigate to="/invitados/seating" replace />}
                              />
                              <Route path="invitados/invitaciones" element={<Invitaciones />} />
                              <Route path="rsvp/dashboard" element={<RSVPDashboard />} />
                              <Route path="proveedores" element={<GestionProveedores />} />
                              <Route path="proveedores/favoritos" element={<SavedSuppliers />} />
                              <Route path="proveedores/comparar" element={<SupplierCompare />} />
                              <Route path="proveedores/contratos" element={<Contratos />} />
                              <Route
                                path="proveedores/presupuestos"
                                element={<QuoteResponsesPage />}
                              />
                              {/* Redirect /servicios to /proveedores (unified page) */}
                              <Route
                                path="servicios"
                                element={<Navigate to="/proveedores" replace />}
                              />
                              <Route
                                path="wedding-services"
                                element={<Navigate to="/proveedores" replace />}
                              />
                              <Route path="subscription" element={<SubscriptionDashboard />} />

                              {/* Ruta directa a música limpia (sin layout) */}
                              <Route path="musica-boda" element={<MomentosEspecialesSimple />} />

                              {/* Protocolo */}
                              <Route path="protocolo" element={<ProtocoloLayout />}>
                                <Route
                                  index
                                  element={<Navigate to="momentos-especiales" replace />}
                                />
                                <Route
                                  path="momentos-especiales"
                                  element={<MomentosEspecialesSimple />}
                                />
                                <Route path="timing" element={<ProtocoloTiming />} />
                                <Route path="dia-de-la-boda" element={<WeddingDayMode />} />
                                <Route path="checklist" element={<ProtocoloChecklist />} />
                                <Route path="ayuda-ceremonia" element={<ProtocoloAyuda />} />
                                <Route path="documentos" element={<DocumentosLegales />} />
                                {/* Legacy path redirect to the new one */}
                                <Route
                                  path="documentos-legales"
                                  element={<Navigate to="documentos" replace />}
                                />
                              </Route>

                              {/* Diseños - Nuevo Editor Unificado */}
                              <Route path="editor-disenos" element={<DesignEditor />} />

                              {/* Diseños Legacy (mantener temporalmente) */}
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
                              <Route path="info-boda" element={<InfoBoda />} />
                              <Route path="notificaciones" element={<Notificaciones />} />
                              <Route path="diseno-web" element={<DisenoWeb />} />
                              <Route
                                path="diseno-web/preview"
                                element={<DisenoWeb mode="preview" />}
                              />
                              <Route path="web-builder" element={<WebBuilderPage />} />
                              <Route
                                path="web-builder-dashboard"
                                element={<WebBuilderDashboard />}
                              />
                              <Route path="web-builder-craft" element={<WebBuilderPageCraft />} />
                              <Route path="preview-web" element={<WebPreview />} />
                              <Route path="web" element={<WebEditor />} />
                              <Route path="ideas" element={<Ideas />} />
                              <Route path="inspiracion" element={<Inspiration />} />
                              <Route path="blog" element={<Blog />} />
                              <Route path="blog/autor/:slug" element={<BlogAuthor />} />
                              <Route path="blog/:slug" element={<BlogPost />} />
                              <Route path="momentos" element={<Momentos />} />
                              <Route path="more" element={<More />} />
                              <Route path="crear-evento" element={<CreateWeddingAI />} />
                              {/* Alias documentado para acceso manual al asistente de creación */}
                              <Route
                                path="create-wedding-ai"
                                element={<Navigate to="/crear-evento" replace />}
                              />
                              <Route
                                path="crear-evento-asistente"
                                element={<CreateWeddingAssistant />}
                              />

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
                              <Route
                                path="test/proveedores-compare"
                                element={<ProveedoresCompareTest />}
                              />
                              <Route path="test/proveedores-smoke" element={<ProveedoresSmoke />} />
                              <Route
                                path="test/proveedores-flow"
                                element={<ProveedoresFlowHarness />}
                              />
                              <Route path="test/e2eProveedor" element={<BudgetApprovalHarness />} />
                              <Route path="test/wedding-team" element={<WeddingTeamHarness />} />
                              <Route path="test/role-upgrade" element={<RoleUpgradeHarness />} />

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
                  </SupplierContactsProvider>
                </SupplierNotesProvider>
              </SupplierCompareProvider>
            </FavoritesProvider>
          </WeddingProvider>
        </UserProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
