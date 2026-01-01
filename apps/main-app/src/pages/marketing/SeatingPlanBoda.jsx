import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Grid3x3, Users, MousePointer2, Download, Printer, Share2, ArrowRight, Check } from 'lucide-react';
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

export default function SeatingPlanBoda() {
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);

  const features = [
    {
      icon: MousePointer2,
      title: 'Drag & Drop',
      description: 'Arrastra invitados entre mesas con un solo clic. Reorganiza todo en segundos.',
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: Grid3x3,
      title: 'Vista Previa en Vivo',
      description: 'Ve cómo queda tu distribución en tiempo real. Ajusta hasta que sea perfecto.',
      color: theme.colors.blue,
      accentColor: theme.colors.blueAccent,
    },
    {
      icon: Users,
      title: 'Detección de Conflictos',
      description: 'Te avisamos si hay incompatibilidades o mesas desbalanceadas automáticamente.',
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Download,
      title: 'Exportación Múltiple',
      description: 'Descarga en PDF, PNG o Excel. Listo para imprimir o compartir.',
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Printer,
      title: 'Tarjetas de Mesa',
      description: 'Genera automáticamente tarjetas con nombres para cada mesa.',
      color: theme.colors.sage,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Share2,
      title: 'Colaboración',
      description: 'Comparte el seating con tu pareja, wedding planner o familia en tiempo real.',
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
  ];

  const challenges = [
    {
      problem: '❌ Papel y lápiz borrando constantemente',
      solution: '✅ Cambios instantáneos con un clic',
    },
    {
      problem: '❌ No saber cuántos caben por mesa',
      solution: '✅ Alertas automáticas de capacidad',
    },
    {
      problem: '❌ Olvidar incompatibilidades entre invitados',
      solution: '✅ Notas y alertas personalizadas',
    },
    {
      problem: '❌ Rehacer todo cuando cambia una confirmación',
      solution: '✅ Sincronizado con lista de invitados',
    },
  ];

  const benefits = [
    'Ahorra horas vs métodos tradicionales',
    'Evita errores de última hora',
    'Cambia mesas en segundos, no en horas',
    'Visualiza la distribución real del salón',
    'Genera planos profesionales para el venue',
    'Tarjetas de mesa automáticas',
  ];

  return (
    <>
      <Helmet>
        <title>Seating Plan Boda Gratis | Distribución Mesas Online Drag & Drop</title>
        <meta name="description" content="Crea el seating plan de tu boda online. Arrastra invitados entre mesas, visualiza en tiempo real y exporta en PDF. Gratis y fácil de usar." />
        <meta name="keywords" content="seating plan boda, distribucion mesas boda, plano mesas boda, seating chart boda, organizar mesas boda" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Seating Plan Boda Gratis | Planivia" />
        <meta property="og:description" content="Crea la distribución de mesas perfecta con drag & drop. Visualiza y exporta fácilmente." />
        <meta property="og:url" content="https://planivia.net/seating-plan-boda" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Seating Plan Boda Gratis" />
        <meta name="twitter:description" content="Distribución de mesas visual e intuitiva" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/seating-plan-boda" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Planivia - Seating Plan de Boda",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Software para crear seating plan de boda con drag and drop, visualización en vivo y exportación",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock"
            },
            "featureList": [
              "Drag and drop de invitados",
              "Vista previa en tiempo real",
              "Detección de conflictos",
              "Exportación PDF/PNG/Excel",
              "Tarjetas de mesa automáticas",
              "Colaboración en tiempo real"
            ]
          })}
        </script>
      </Helmet>
      
      <PageWrapper>
        <HeroSection
          title="Crea tu Seating Plan sin Estrés"
          subtitle="Olvídate del papel y los borrones. Arrastra, visualiza y exporta el plano de mesas perfecto en minutos."
          image="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80"
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
                El Seating Plan: El Dolor de Cabeza de Toda Boda
              </h2>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                color: theme.colors.textSecondary,
                lineHeight: '1.8',
                marginBottom: '32px',
              }}>
                El 73% de las parejas lo deja para el final... y se arrepienten. Papelitos con nombres,
                borrones, cambios de última hora. <strong>Planivia automatiza todo esto.</strong>
              </p>
            </div>
          </div>

          {/* Before vs After */}
          <div style={{ padding: '80px 0' }}>
            <SectionTitle 
              title="Antes vs Después de Usar Planivia"
              subtitle="Ve la diferencia"
            />
            <div className="grid md:grid-cols-2 gap-8">
              {challenges.map((item, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: theme.colors.backgroundSoft,
                    borderRadius: theme.radius.lg,
                    padding: '24px',
                    border: `1px solid ${theme.colors.borderSoft}`,
                  }}
                >
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    color: theme.colors.textSecondary,
                    marginBottom: '12px',
                  }}>
                    {item.problem}
                  </p>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.green,
                    margin: 0,
                  }}>
                    {item.solution}
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
                title="Funcionalidades del Seating Plan"
                subtitle="Todo lo que necesitas para distribuir mesas perfectamente"
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
                Por Qué el Seating Plan de Planivia es el Mejor
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

          {/* How it Works */}
          <div style={{ 
            padding: '80px 0',
            backgroundColor: theme.colors.yellow,
            borderRadius: theme.radius.xl,
            marginBottom: '80px',
          }}>
            <div className="max-w-4xl mx-auto px-8 text-center">
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '48px',
              }}>
                Cómo Funciona
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontFamily: theme.fonts.heading,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                  }}>
                    1
                  </div>
                  <h3 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '8px',
                  }}>
                    Define tus Mesas
                  </h3>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    color: theme.colors.textSecondary,
                    margin: 0,
                  }}>
                    Cuántas hay y cuántos invitados caben en cada una
                  </p>
                </div>
                <div>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontFamily: theme.fonts.heading,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                  }}>
                    2
                  </div>
                  <h3 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '8px',
                  }}>
                    Arrastra Invitados
                  </h3>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    color: theme.colors.textSecondary,
                    margin: 0,
                  }}>
                    Usa drag & drop para distribuirlos fácilmente
                  </p>
                </div>
                <div>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontFamily: theme.fonts.heading,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                  }}>
                    3
                  </div>
                  <h3 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '8px',
                  }}>
                    Exporta y Listo
                  </h3>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    color: theme.colors.textSecondary,
                    margin: 0,
                  }}>
                    Descarga en PDF o imprime tarjetas de mesa
                  </p>
                </div>
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
              Crea tu Seating Plan Ahora
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
              Empezar Gratis
              <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </PrimaryButton>
          </div>
        </Container>
      </PageWrapper>
    </>
  );
}
