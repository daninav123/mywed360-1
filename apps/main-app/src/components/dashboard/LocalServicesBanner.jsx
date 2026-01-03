/**
 * Banner SEO discreto con enlaces internos geolocalizados
 * Minimalista - solo para link building, no para captar atención
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import useGeolocation from '../../hooks/useGeolocation';

export default function LocalServicesBanner() {
  const { location, loading } = useGeolocation();

  // Si está cargando, mostrar versión por defecto con España
  const cityName = location?.cityName || 'España';
  const country = location?.country || 'es';
  const city = location?.city || 'madrid';

  return (
    <div style={{
      backgroundColor: '#F9FAFB',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '24px',
      border: '1px solid #E5E7EB',
      fontSize: '14px',
      color: '#6B7280'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        color: '#9CA3AF'
      }}>
        <MapPin size={16} />
        <span style={{ fontSize: '13px' }}>
          Servicios disponibles en tu ciudad
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center'
      }}>
        <span style={{ color: '#4B5563', fontWeight: 500 }}>
          {cityName}:
        </span>
        
        <Link
          to={`/${country}/${city}/bodas`}
          style={{
            color: '#5EBBFF',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#3DA9F5'}
          onMouseLeave={(e) => e.target.style.color = '#5EBBFF'}
        >
          Bodas
        </Link>
        <span style={{ color: '#D1D5DB' }}>•</span>
        
        <Link
          to={`/${country}/${city}/gestion-invitados-boda`}
          style={{
            color: '#5EBBFF',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#3DA9F5'}
          onMouseLeave={(e) => e.target.style.color = '#5EBBFF'}
        >
          Gestión de Invitados
        </Link>
        <span style={{ color: '#D1D5DB' }}>•</span>
        
        <Link
          to={`/${country}/${city}/catering-boda`}
          style={{
            color: '#5EBBFF',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#3DA9F5'}
          onMouseLeave={(e) => e.target.style.color = '#5EBBFF'}
        >
          Catering
        </Link>
        <span style={{ color: '#D1D5DB' }}>•</span>
        
        <Link
          to={`/${country}/${city}/fotografia-boda`}
          style={{
            color: '#5EBBFF',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#3DA9F5'}
          onMouseLeave={(e) => e.target.style.color = '#5EBBFF'}
        >
          Fotografía
        </Link>
      </div>

      {/* Enlaces a ciudades principales - muy discreto */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #F3F4F6',
        fontSize: '12px',
        color: '#9CA3AF'
      }}>
        <span>Otras ciudades: </span>
        {getMainCities(country).map((mainCity, index) => (
          <React.Fragment key={mainCity.slug}>
            {index > 0 && ' · '}
            <Link
              to={`/${country}/${mainCity.slug}/bodas`}
              style={{
                color: '#9CA3AF',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#5EBBFF'}
              onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
            >
              {mainCity.name}
            </Link>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Helper para obtener ciudades principales (3-4 top por país)
function getMainCities(country) {
  const citiesByCountry = {
    es: [
      { name: 'Madrid', slug: 'madrid' },
      { name: 'Barcelona', slug: 'barcelona' },
      { name: 'Valencia', slug: 'valencia' },
      { name: 'Sevilla', slug: 'sevilla' }
    ],
    mx: [
      { name: 'CDMX', slug: 'ciudad-de-mexico' },
      { name: 'Guadalajara', slug: 'guadalajara' },
      { name: 'Monterrey', slug: 'monterrey' }
    ],
    ar: [
      { name: 'Buenos Aires', slug: 'buenos-aires' },
      { name: 'Córdoba', slug: 'cordoba' },
      { name: 'Rosario', slug: 'rosario' }
    ],
    co: [
      { name: 'Bogotá', slug: 'bogota' },
      { name: 'Medellín', slug: 'medellin' },
      { name: 'Cartagena', slug: 'cartagena' }
    ]
  };

  return citiesByCountry[country] || citiesByCountry.es;
}
