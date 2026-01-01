import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageLayout - Layout estándar para páginas del proyecto
 * Implementa el diseño con container card beige sobre fondo gris
 * 
 * @example
 * <PageLayout 
 *   title="Finanzas" 
 *   subtitle="Gestión financiera de tu boda"
 *   icon="💰"
 * >
 *   <div>Contenido de la página</div>
 * </PageLayout>
 */
export default function PageLayout({ 
  title, 
  subtitle, 
  icon,
  headerImage,
  headerImageAlt = "Header image",
  children,
  hideHeader = false,
  className = "",
  maxWidth = '1024px'
}) {
  return (
    <div 
      className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" 
      style={{ backgroundColor: '#EDE8E0' }}
    >
      <div 
        className={`mx-auto my-8 ${className}`}
        style={{ 
          maxWidth,
          width: '100%',
          backgroundColor: '#FFFBF7',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}
      >
        {!hideHeader && (
          <>
            {headerImage ? (
              // Header con imagen
              <header 
                className="relative overflow-hidden" 
                style={{
                  height: '240px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <div className="absolute inset-0">
                  <img 
                    src={headerImage}
                    alt={headerImageAlt} 
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 30%' }}
                  />
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: 'linear-gradient(to right, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)',
                      zIndex: 2,
                    }} 
                  />
                </div>
                
                <div className="relative z-10 h-full flex items-center px-8">
                  <div className="max-w-lg">
                    <h1 style={{
                      fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                      fontSize: '36px',
                      fontWeight: 400,
                      color: '#FFFFFF',
                      marginBottom: '8px',
                      letterSpacing: '-0.01em',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}>
                      {icon && <span className="mr-2">{icon}</span>}
                      {title}
                    </h1>
                    {subtitle && (
                      <p style={{
                        fontFamily: "'DM Sans', 'Inter', sans-serif",
                        fontSize: '17px',
                        color: '#FFFFFF',
                        opacity: 0.95,
                        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}>
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </header>
            ) : (
              // Header simple
              <div 
                className="px-8 py-8" 
                style={{
                  borderBottom: '1px solid rgba(0,0,0,0.06)'
                }}
              >
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                  fontSize: '36px',
                  fontWeight: 400,
                  color: '#1F2937',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                }}>
                  {icon && <span className="mr-2">{icon}</span>}
                  {title}
                </h1>
                {subtitle && (
                  <p style={{
                    fontFamily: "'DM Sans', 'Inter', sans-serif",
                    fontSize: '17px',
                    color: '#6B7280',
                    opacity: 0.9,
                  }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {children}
      </div>
    </div>
  );
}

PageLayout.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  headerImage: PropTypes.string,
  headerImageAlt: PropTypes.string,
  children: PropTypes.node.isRequired,
  hideHeader: PropTypes.bool,
  className: PropTypes.string,
  maxWidth: PropTypes.string,
};
