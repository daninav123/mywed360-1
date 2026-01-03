import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, CheckCircle, Mail, Download, Grid3x3, Sparkles, ArrowRight, Check } from 'lucide-react';
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

export default function GestionInvitados() {
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);

  const features = [
    {
      icon: Users,
      title: 'Lista Centralizada',
      description: 'Todos tus invitados en un solo lugar. Añade, edita y organiza sin límites.',
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: CheckCircle,
      title: 'Control de RSVPs',
      description: 'Confirmaciones en tiempo real. Sabe quién viene, quién no y quién aún no ha respondido.',
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Mail,
      title: 'Invitaciones Digitales',
      description: 'Envía invitaciones por email o WhatsApp. Seguimiento automático de aperturas.',
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Grid3x3,
      title: 'Seating Plan Visual',
      description: 'Arrastra y suelta invitados en las mesas. Vista previa en tiempo real.',
      color: theme.colors.sage,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Download,
      title: 'Exportación Excel',
      description: 'Descarga tu lista en formato Excel o PDF para imprimir o compartir.',
      color: theme.colors.blue,
      accentColor: theme.colors.blueAccent,
    },
    {
      icon: Sparkles,
      title: 'Dietas y Alergias',
      description: 'Registra preferencias alimentarias y compártelas automáticamente con el catering.',
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
  ];

  const benefits = [
    'Control total de confirmaciones en tiempo real',
    'Elimina hojas de cálculo desorganizadas',
    'Sincronización automática con tu pareja',
    'Acceso desde cualquier dispositivo',
    'Recordatorios automáticos a invitados',
    'Estadísticas y reportes visuales',
  ];

  return (
    <>
      <Helmet>
        <title>Software Gestión Invitados Boda | Control RSVPs y Seating Online</title>
        <meta name="description" content="Gestiona todos tus invitados de boda en una plataforma. Control de RSVPs, dietas, seating plan y más. Sincronización automática. Prueba gratis." />
        <meta name="keywords" content="gestión invitados boda, lista invitados boda online, control rsvp boda, seating plan boda, software invitados boda" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Software Gestión Invitados Boda | Planivia" />
        <meta property="og:description" content="Gestiona invitados, RSVPs y seating plan en un solo lugar. Gratis hasta 80 invitados." />
        <meta property="og:url" content="https://planivia.net/gestion-invitados-boda" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Software Gestión Invitados Boda" />
        <meta name="twitter:description" content="Control total de invitados y RSVPs para tu boda" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/gestion-invitados-boda" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Planivia - Gestión de Invitados",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Software para gestionar invitados de boda con control de RSVPs, seating plan y exportación",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock"
            },
            "featureList": [
              "Gestión de lista de invitados",
              "Control de confirmaciones RSVP",
              "Seating plan drag and drop",
              "Gestión de dietas y alergias",
              "Exportación a Excel/PDF",
              "Invitaciones digitales"
            ]
          })}
        </script>
      </Helmet>
      
      <PageWrapper>
        <HeroSection
          title="Gestiona Todos tus Invitados en un Solo Lugar"
          subtitle="Olvídate de hojas de cálculo descontroladas. Controla confirmaciones, dietas y seating plan con Planivia."
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
          {/* Problem Section */}
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
                ¿Perdido entre Excel, WhatsApp y papelitos?
              </h2>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                color: theme.colors.textSecondary,
                lineHeight: '1.8',
                marginBottom: '32px',
              }}>
                El 87% de las parejas pierden más de 15 horas gestionando invitados en hojas de cálculo.
                Confirmaciones desactualizadas, dietas olvidadas, y el caos del seating plan a último momento.
              </p>
              <div style={{
                display: 'inline-block',
                padding: '16px 24px',
                backgroundColor: theme.colors.yellow,
                borderRadius: '12px',
              }}>
                <p style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  margin: 0,
                }}>
                  ✨ Planivia automatiza todo esto por ti
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div style={{ padding: '80px 0' }}>
            <SectionTitle 
              title="Todo lo que Necesitas para Gestionar Invitados"
              subtitle="Funcionalidades diseñadas para eliminar el estrés"
            />
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div style={{ 
            padding: '80px 0',
            backgroundColor: theme.colors.backgroundSoft,
            borderRadius: theme.radius.xl,
            marginBottom: '80px',
          }}>
            <div className="max-w-4xl mx-auto px-8">
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                Por Qué las Parejas Eligen Planivia
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
          }}>
            <h2 style={{
              fontFamily: theme.fonts.heading,
              fontSize: '42px',
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: '24px',
            }}>
              Empieza a Gestionar tus Invitados Hoy
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '18px',
              color: theme.colors.textSecondary,
              marginBottom: '32px',
            }}>
              Gratis hasta 80 invitados. Sin tarjeta de crédito.
            </p>
            <PrimaryButton onClick={() => navigate('/signup')}>
              Crear Cuenta Gratis
              <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </PrimaryButton>
          </div>
        </Container>
      </PageWrapper>
    </>
  );
}
