import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, PieChart, Bell, FileText, Shield, ArrowRight, Check } from 'lucide-react';
import { 
  PageWrapper, 
  HeroSection, 
  PrimaryButton, 
  SecondaryButton, 
  FeatureCard, 
  SectionTitle, 
  Container,
  theme 
} from '../../components/theme/WeddingTheme';

export default function PresupuestoBoda() {
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);

  const features = [
    {
      icon: DollarSign,
      title: 'Control Total de Gastos',
      description: 'Registra todos tus gastos y pagos. Sabe exactamente cuánto llevas gastado en tiempo real.',
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: PieChart,
      title: 'Distribución Visual',
      description: 'Gráficos claros por categoría. Identifica dónde se va tu presupuesto de un vistazo.',
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: Bell,
      title: 'Alertas Inteligentes',
      description: 'Te avisamos cuando te acerques al límite. Evita sorpresas de último momento.',
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: FileText,
      title: 'Gestión de Contratos',
      description: 'Sube y organiza contratos con proveedores. Recordatorios de pagos automáticos.',
      color: theme.colors.blue,
      accentColor: theme.colors.blueAccent,
    },
    {
      icon: TrendingUp,
      title: 'Proyecciones Reales',
      description: 'Calcula gastos futuros basados en tus decisiones. Planifica sin imprevistos.',
      color: theme.colors.sage,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Shield,
      title: 'Múltiples Monedas',
      description: 'Perfecto para bodas destino. Convierte automáticamente entre EUR, USD, GBP y más.',
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
  ];

  const categories = [
    { name: 'Catering', avg: '8.000€', percent: '35%' },
    { name: 'Fotografía', avg: '2.500€', percent: '11%' },
    { name: 'Vestido', avg: '1.800€', percent: '8%' },
    { name: 'Música/DJ', avg: '1.200€', percent: '5%' },
    { name: 'Flores', avg: '1.500€', percent: '7%' },
    { name: 'Otros', avg: '7.000€', percent: '34%' },
  ];

  const benefits = [
    'Evita pasarte del presupuesto sin darte cuenta',
    'Compara precios de proveedores fácilmente',
    'Sincroniza gastos con tu pareja en tiempo real',
    'Genera reportes para familiares que ayudan',
    'Historico completo de todos los pagos',
    'Calcula propinas y extras automáticamente',
  ];

  return (
    <>
      <Helmet>
        <title>Calculadora Presupuesto Boda Online | Control Gastos Tiempo Real</title>
        <meta name="description" content="Controla el presupuesto de tu boda online. Calcula gastos por categoría, gestiona pagos y evita sorpresas. Gratis y fácil de usar. Prueba ahora." />
        <meta name="keywords" content="presupuesto boda online, calculadora boda, control gastos boda, cuanto cuesta boda españa, presupuesto boda media" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Calculadora Presupuesto Boda Online | Planivia" />
        <meta property="og:description" content="Control total de gastos de boda. Calcula, proyecta y gestiona tu presupuesto sin sorpresas." />
        <meta property="og:url" content="https://planivia.net/presupuesto-boda-online" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Calculadora Presupuesto Boda" />
        <meta name="twitter:description" content="Gestiona el presupuesto de tu boda sin estrés" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/presupuesto-boda-online" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Planivia - Presupuesto de Boda",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "description": "Calculadora y gestor de presupuesto de boda online con control de gastos en tiempo real",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock"
            },
            "featureList": [
              "Control de gastos por categoría",
              "Alertas de presupuesto",
              "Gestión de contratos",
              "Proyecciones de gastos",
              "Múltiples monedas",
              "Reportes exportables"
            ]
          })}
        </script>
      </Helmet>
      
      <PageWrapper>
        <HeroSection
          title="Controla el Presupuesto de tu Boda sin Estrés"
          subtitle="Sabe exactamente cuánto gastas, cuánto te queda y dónde puedes optimizar. Todo en tiempo real."
          image="/assets/services/default.webp"
        >
          <div className="flex gap-4">
            <PrimaryButton onClick={() => navigate('/signup')}>
              Empezar Gratis
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              Ver Planes
            </SecondaryButton>
          </div>
        </HeroSection>

        <Container>
          {/* Stats Section */}
          <div style={{ 
            padding: '80px 0',
            borderBottom: `1px solid ${theme.colors.borderSoft}`,
          }}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '24px',
              }}>
                El 64% de las Parejas se Pasan del Presupuesto Inicial
              </h2>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                color: theme.colors.textSecondary,
                lineHeight: '1.8',
                marginBottom: '32px',
              }}>
                La media en España es <strong>22.000€</strong>, pero los gastos imprevistos pueden 
                sumar hasta un 20% más. Planivia te ayuda a controlar cada euro desde el día uno.
              </p>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div style={{ padding: '80px 0' }}>
            <SectionTitle 
              title="Distribución Media del Presupuesto de Boda"
              subtitle="Basado en 2,500+ bodas en España 2025"
            />
            <div className="grid md:grid-cols-3 gap-6">
              {categories.map((cat, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: theme.colors.backgroundSoft,
                    borderRadius: theme.radius.lg,
                    padding: '24px',
                    border: `1px solid ${theme.colors.borderSoft}`,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}>
                    <h3 style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: theme.colors.textPrimary,
                      margin: 0,
                    }}>
                      {cat.name}
                    </h3>
                    <span style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.colors.primary,
                      backgroundColor: theme.colors.primarySoft,
                      padding: '4px 12px',
                      borderRadius: '6px',
                    }}>
                      {cat.percent}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    margin: 0,
                  }}>
                    {cat.avg}
                  </p>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '13px',
                    color: theme.colors.textSecondary,
                    margin: '4px 0 0 0',
                  }}>
                    Precio medio España
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div style={{ 
            padding: '80px 0',
            backgroundColor: theme.colors.backgroundSoft,
            borderRadius: theme.radius.xl,
            marginBottom: '80px',
          }}>
            <div className="px-8">
              <SectionTitle 
                title="Funcionalidades de Control de Presupuesto"
                subtitle="Todo lo que necesitas para no pasarte ni un euro"
              />
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <FeatureCard key={index} {...feature} />
                ))}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div style={{ padding: '80px 0' }}>
            <div className="max-w-4xl mx-auto">
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                Por Qué Planivia es la Mejor Opción
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check 
                      size={24} 
                      style={{ 
                        color: theme.colors.green,
                        flexShrink: 0,
                        marginTop: '2px',
                      }} 
                    />
                    <p style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '16px',
                      color: theme.colors.textPrimary,
                      margin: 0,
                    }}>
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div style={{ 
            padding: '80px 0',
            textAlign: 'center',
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.xl,
            marginBottom: '80px',
          }}>
            <div className="max-w-3xl mx-auto px-8">
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '42px',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: '24px',
              }}>
                Empieza a Controlar tu Presupuesto Hoy
              </h2>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '32px',
              }}>
                Gratis y sin tarjeta de crédito. Acceso inmediato.
              </p>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: theme.colors.primary,
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 32px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 200ms',
                }}
              >
                Crear Cuenta Gratis
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </Container>
      </PageWrapper>
    </>
  );
}
