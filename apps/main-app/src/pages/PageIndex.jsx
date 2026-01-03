import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Lock, Globe, Shield, Store, UserCog } from 'lucide-react';

export default function PageIndex() {
  const navigate = useNavigate();

  const routes = {
    public: [
      { path: '/', name: 'Landing Pública', component: 'Landing2', status: '✅' },
      { path: '/landing2', name: 'Landing 2 (Nueva)', component: 'Landing2', status: '✅' },
      { path: '/app', name: 'Marketing App Overview', component: 'MarketingAppOverview', status: '✅' },
      { path: '/precios', name: 'Precios', component: 'MarketingPricing', status: '✅' },
      { path: '/acceso', name: 'Acceso', component: 'MarketingAccess', status: '✅' },
      { path: '/para-proveedores', name: 'Para Proveedores', component: 'ForSuppliers', status: '✅' },
      { path: '/para-planners', name: 'Para Planners', component: 'ForPlanners', status: '✅' },
      { path: '/partners', name: 'Partners', component: 'Partners', status: '✅' },
      { path: '/blog', name: 'Blog Público', component: 'Blog', status: '✅' },
      { path: '/blog/autor/:slug', name: 'Autor de Blog', component: 'BlogAuthor', status: '✅' },
      { path: '/blog/:slug', name: 'Post de Blog', component: 'BlogPost', status: '✅' },
      { path: '/login', name: 'Login', component: 'Login', status: '✅' },
      { path: '/signup', name: 'Registro', component: 'Signup', status: '✅' },
      { path: '/verify-email', name: 'Verificar Email', component: 'VerifyEmail', status: '✅' },
      { path: '/reset-password', name: 'Resetear Password', component: 'ResetPassword', status: '✅' },
    ],
    protected: [
      { path: '/home', name: 'Dashboard Principal (HomePage2)', component: 'Home → HomePage2', status: '✅' },
      { path: '/finance', name: 'Finanzas', component: 'Finance', status: '✅' },
      { path: '/tasks', name: 'Tareas', component: 'Tasks', status: '✅' },
      { path: '/tareas-ia', name: 'Tareas IA', component: 'TasksAI', status: '✅' },
      { path: '/checklist', name: 'Checklist', component: 'Checklist', status: '✅' },
      { path: '/invitados', name: 'Gestión de Invitados', component: 'Invitados', status: '✅' },
      { path: '/invitados/seating', name: 'Plan de Asientos', component: 'SeatingPlan', status: '✅' },
      { path: '/invitados/invitaciones', name: 'Invitaciones', component: 'Invitaciones', status: '✅' },
      { path: '/rsvp/dashboard', name: 'Dashboard RSVP', component: 'RSVPDashboard', status: '✅' },
      { path: '/proveedores', name: 'Gestión Proveedores', component: 'GestionProveedores', status: '✅' },
      { path: '/proveedores/favoritos', name: 'Proveedores Favoritos', component: 'SavedSuppliers', status: '✅' },
      { path: '/proveedores/comparar', name: 'Comparar Proveedores', component: 'SupplierCompare', status: '✅' },
      { path: '/proveedores/contratos', name: 'Contratos', component: 'Contratos', status: '✅' },
      { path: '/web', name: 'Editor Web', component: 'WebEditor', status: '✅' },
      { path: '/ideas', name: 'Ideas', component: 'Ideas', status: '✅' },
      { path: '/inspiracion', name: 'Inspiración', component: 'Inspiration', status: '✅' },
      { path: '/momentos', name: 'Momentos', component: 'Momentos', status: '✅' },
      { path: '/perfil', name: 'Perfil Usuario', component: 'Perfil', status: '✅' },
      { path: '/email', name: 'Buzón de Emails', component: 'UnifiedEmail', status: '✅' },
      { path: '/bodas', name: 'Mis Bodas', component: 'Bodas', status: '✅' },
      { path: '/bodas/:id', name: 'Detalle de Boda', component: 'BodaDetalle', status: '✅' },
      { path: '/crear-evento', name: 'Crear Evento con IA', component: 'CreateWeddingAI', status: '✅' },
    ],
    admin: [
      { path: '/admin/login', name: 'Admin Login', component: 'AdminLogin', status: '✅', port: '5174' },
      { path: '/admin/dashboard', name: 'Admin Dashboard', component: 'AdminDashboard', status: '✅', port: '5174' },
      { path: '/admin/metrics', name: 'Métricas', component: 'AdminMetrics', status: '✅', port: '5174' },
      { path: '/admin/users', name: 'Usuarios', component: 'AdminUsers', status: '✅', port: '5174' },
      { path: '/admin/suppliers', name: 'Proveedores', component: 'AdminSuppliers', status: '✅', port: '5174' },
      { path: '/admin/blog', name: 'Blog Admin', component: 'AdminBlog', status: '✅', port: '5174' },
      { path: '/admin/settings', name: 'Configuración', component: 'AdminSettings', status: '✅', port: '5174' },
      { path: '/admin/alerts', name: 'Alertas', component: 'AdminAlerts', status: '✅', port: '5174' },
    ],
    suppliers: [
      { path: '/supplier/login', name: 'Supplier Login', component: 'SupplierLogin', status: '✅' },
      { path: '/supplier/register', name: 'Registro Proveedor', component: 'SupplierRegister', status: '✅' },
      { path: '/supplier/portal', name: 'Portal Proveedor', component: 'SupplierPortal', status: '✅' },
      { path: '/supplier/dashboard/:id', name: 'Dashboard Proveedor', component: 'SupplierDashboard', status: '✅', port: '5176' },
    ],
    dev: [
      { path: '/dev/seed-guests', name: 'Seed Invitados (Dev)', component: 'DevSeedGuests', status: '⚙️' },
      { path: '/dev/ensure-finance', name: 'Ensure Finance (Dev)', component: 'DevEnsureFinance', status: '⚙️' },
      { path: '/style-demo', name: 'Demo de Estilos', component: 'StyleDemo', status: '⚙️' },
    ]
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const RouteCard = ({ route, category }) => (
    <div
      onClick={() => !route.port && handleNavigate(route.path)}
      className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border-soft)',
        cursor: route.port ? 'default' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!route.port) {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.backgroundColor = 'var(--color-lavender)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-soft)';
        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{route.status}</span>
            <h3 className="font-semibold" className="text-body">
              {route.name}
            </h3>
          </div>
          <code className="text-sm px-2 py-1 rounded" style={{ 
            backgroundColor: 'var(--color-bg)', 
            color: 'var(--color-primary)',
            fontFamily: 'monospace'
          }}>
            {route.path}
          </code>
        </div>
        {!route.port && (
          <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0" className="text-secondary" />
        )}
      </div>
      <p className="text-sm mt-2" className="text-secondary">
        <strong>Componente:</strong> {route.component}
      </p>
      {route.port && (
        <p className="text-xs mt-1 px-2 py-1 rounded inline-block" style={{ 
          backgroundColor: 'var(--color-warning-10)', 
          color: 'var(--color-warning)' 
        }}>
          Puerto: {route.port}
        </p>
      )}
    </div>
  );

  const Section = ({ title, icon: Icon, routes, category, description }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b" className="border-soft">
        <Icon className="w-6 h-6" className="text-primary" />
        <div>
          <h2 className="text-2xl font-semibold" className="text-body">
            {title}
          </h2>
          {description && (
            <p className="text-sm mt-1" className="text-secondary">
              {description}
            </p>
          )}
        </div>
        <span className="ml-auto px-3 py-1 rounded-full text-sm font-semibold" style={{
          backgroundColor: 'var(--color-primary-10)',
          color: 'var(--color-primary)'
        }}>
          {routes.length} rutas
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route, index) => (
          <RouteCard key={index} route={route} category={category} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8" className="bg-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ 
            color: 'var(--color-text)',
            fontFamily: "'Playfair Display', serif"
          }}>
            📋 Índice de Páginas del Proyecto
          </h1>
          <p className="text-lg mb-2" className="text-secondary">
            Todas las rutas y páginas disponibles en Planivia
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="px-3 py-1 rounded" style={{ backgroundColor: 'var(--color-success-10)', color: 'var(--color-success)' }}>
              ✅ Activa
            </span>
            <span className="px-3 py-1 rounded" style={{ backgroundColor: 'var(--color-warning-10)', color: 'var(--color-warning)' }}>
              ⚙️ Dev/Testing
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Públicas', count: routes.public.length, color: 'var(--color-success)' },
            { label: 'Protegidas', count: routes.protected.length, color: 'var(--color-primary)' },
            { label: 'Admin', count: routes.admin.length, color: 'var(--color-danger)' },
            { label: 'Proveedores', count: routes.suppliers.length, color: 'var(--color-warning)' },
            { label: 'Dev', count: routes.dev.length, color: 'var(--color-text-secondary)' },
          ].map((stat, index) => (
            <div key={index} className="p-4 rounded-lg text-center" style={{ 
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-soft)'
            }}>
              <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.count}
              </div>
              <div className="text-sm" className="text-secondary">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <Section 
          title="Rutas Públicas" 
          icon={Globe} 
          routes={routes.public} 
          category="public"
          description="Accesibles sin autenticación"
        />
        
        <Section 
          title="Rutas Protegidas" 
          icon={Lock} 
          routes={routes.protected} 
          category="protected"
          description="Requieren autenticación de usuario"
        />
        
        <Section 
          title="Panel de Administración" 
          icon={Shield} 
          routes={routes.admin} 
          category="admin"
          description="Puerto 5174 - Solo administradores"
        />
        
        <Section 
          title="Portal de Proveedores" 
          icon={Store} 
          routes={routes.suppliers} 
          category="suppliers"
          description="Puerto 5176 - Para proveedores registrados"
        />
        
        <Section 
          title="Desarrollo y Testing" 
          icon={UserCog} 
          routes={routes.dev} 
          category="dev"
          description="Herramientas de desarrollo"
        />
      </div>
    </div>
  );
}
