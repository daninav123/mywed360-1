import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { MapPin, TrendingUp } from 'lucide-react';
import { 
  PageWrapper, 
  HeroSection, 
  PrimaryButton, 
  SecondaryButton, 
  SectionTitle, 
  Container,
  theme 
} from '../../components/theme/WeddingTheme';
import {
  getCitiesByCountry,
  getAllServices
} from '../../data/dataLoader';

export default function CountryHub() {
  const { country } = useParams();
  const navigate = useNavigate();

  const cities = getCitiesByCountry(country);
  const services = getAllServices();

  if (cities.length === 0) {
    return <Navigate to="/404" replace />;
  }

  const countryName = cities[0]?.countryName || 'España';
  const countryCode = cities[0]?.countryCode || 'ES';

  return (
    <>
      <Helmet>
        <title>Organiza tu Boda en {countryName} | Planivia</title>
        <meta name="description" content={`Planifica tu boda perfecta en ${countryName}. ${cities.length} ciudades disponibles con proveedores verificados, venues y precios actualizados.`} />
        <meta name="keywords" content={`bodas ${countryName.toLowerCase()}, organizar boda ${countryName.toLowerCase()}, proveedores boda ${countryName.toLowerCase()}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Organiza tu Boda en ${countryName}`} />
        <meta property="og:description" content={`Software completo para planificar bodas en ${countryName}`} />
        <meta property="og:url" content={`https://planivia.net/${country}`} />
        
        {/* Canonical */}
        <link rel="canonical" href={`https://planivia.net/${country}`} />
      </Helmet>
      
      <PageWrapper>
        <HeroSection
          title={`Organiza tu Boda Perfecta en ${countryName}`}
          subtitle={`${cities.length} ciudades disponibles con proveedores verificados y herramientas profesionales de planificación`}
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
          {/* Services Available */}
          <div style={{ padding: '80px 0' }}>
            <SectionTitle 
              title="Servicios Disponibles en Todas las Ciudades"
              subtitle="Planifica cada detalle de tu boda"
            />
            <div className="grid md:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.slug}
                  style={{
                    backgroundColor: theme.colors.backgroundSoft,
                    borderRadius: theme.radius.lg,
                    padding: '32px',
                    border: `1px solid ${theme.colors.borderSoft}`,
                    transition: 'all 200ms',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <span style={{ fontSize: '24px' }}>
                      {service.icon === 'Users' && '👥'}
                      {service.icon === 'DollarSign' && '💰'}
                      {service.icon === 'Grid3x3' && '📋'}
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '20px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '12px',
                  }}>
                    {service.name}
                  </h3>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    color: theme.colors.textSecondary,
                    marginBottom: '16px',
                  }}>
                    {service.shortDesc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cities Grid */}
          <div style={{ 
            padding: '80px 0',
            backgroundColor: theme.colors.backgroundSoft,
            borderRadius: theme.radius.xl,
            marginBottom: '80px',
          }}>
            <div className="px-8">
              <SectionTitle 
                title={`Ciudades en ${countryName}`}
                subtitle="Elige tu ciudad y explora proveedores locales"
              />
              <div className="grid md:grid-cols-4 gap-6">
                {cities.map((city) => (
                  <div
                    key={city.slug}
                    onClick={() => navigate(`/${country}/${city.slug}`)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: theme.radius.lg,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `1px solid ${theme.colors.borderSoft}`,
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = theme.shadow.md;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        height: '140px',
                        backgroundImage: `url(${city.heroImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div style={{ padding: '20px' }}>
                      <h3 style={{
                        fontFamily: theme.fonts.body,
                        fontSize: '20px',
                        fontWeight: 600,
                        color: theme.colors.textPrimary,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <MapPin size={18} style={{ color: theme.colors.primary }} />
                        {city.name}
                      </h3>
                      <p style={{
                        fontFamily: theme.fonts.body,
                        fontSize: '13px',
                        color: theme.colors.textSecondary,
                        marginBottom: '8px',
                      }}>
                        Presupuesto medio: {city.weddingStats.avgBudget}{city.currencySymbol}
                      </p>
                      <p style={{
                        fontFamily: theme.fonts.body,
                        fontSize: '13px',
                        color: theme.colors.textSecondary,
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <TrendingUp size={14} />
                        {city.weddingStats.popularMonths.slice(0, 2).join(', ')}
                      </p>
                    </div>
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
              Empieza a Planificar tu Boda en {countryName}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '18px',
              color: theme.colors.textSecondary,
              marginBottom: '32px',
            }}>
              Gratis hasta 80 invitados. Proveedores verificados en todas las ciudades.
            </p>
            <PrimaryButton onClick={() => navigate('/signup')}>
              Crear Cuenta Gratis
            </PrimaryButton>
          </div>
        </Container>
      </PageWrapper>
    </>
  );
}
