import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown } from 'lucide-react';

// Theme tokens del Wedding Dashboard Soft
export const theme = {
  colors: {
    primary: '#5EBBFF',
    primaryHover: '#45AFFF',
    primaryPressed: '#2F9FFF',
    bgApp: '#FFFBF7',
    surface: '#FFFFFF',
    // Pasteles
    yellow: '#FFF4E6',
    yellowAccent: '#D4A574',
    green: '#E8F5E9',
    greenAccent: '#4A9B5F',
    pink: '#FCE4EC',
    pinkAccent: '#C97C8F',
    blush: '#FADADD',
    sage: '#CDEAC0',
    lavender: '#E6D9FF',
    peach: '#FFE5D9',
    // Text
    textPrimary: '#2D3748',
    textSecondary: '#718096',
    textMuted: '#9CA3AF',
    onPrimary: '#FFFFFF',
    // Borders
    borderSubtle: '#E5E7EB',
    borderSoft: '#EEF2F7',
    // Gradients
    heroGradient: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5C4 100%)',
  },
  fonts: {
    heading: "'Playfair Display', 'Cormorant Garamond', serif",
    body: "'DM Sans', 'Inter', sans-serif",
  },
  radius: {
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '24px',
    pill: '999px',
  },
  shadow: {
    sm: '0 2px 8px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 24px rgba(0,0,0,0.08)',
  },
};

// Hero Section Component
export function HeroSection({ title, subtitle, image, children, compact = false }) {
  return (
    <section className="relative overflow-hidden">
      <div 
        className={`rounded-${compact ? 'b' : ''}-3xl mx-4 ${compact ? 'mt-4 mb-8' : 'my-8'}`}
        style={{
          background: theme.colors.heroGradient,
          boxShadow: theme.shadow.md,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className={`grid ${image ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-12 items-center ${!image ? 'text-center' : ''}`}>
            <div>
              <h1 style={{
                fontFamily: theme.fonts.heading,
                fontSize: compact ? '40px' : '48px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '16px',
                letterSpacing: '-0.02em',
                lineHeight: '1.15',
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '18px',
                  color: theme.colors.textSecondary,
                  marginBottom: children ? '32px' : '0',
                  lineHeight: '1.6',
                }}>
                  {subtitle}
                </p>
              )}
              {children}
            </div>
            {image && (
              <div className="relative">
                <div 
                  className="rounded-2xl overflow-hidden"
                  style={{ boxShadow: theme.shadow.lg }}
                >
                  <img 
                    src={image}
                    alt={title}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Primary Button Component
export function PrimaryButton({ children, onClick, className = '', ...props }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: isPressed ? theme.colors.primaryPressed : (isHovered ? theme.colors.primaryHover : theme.colors.primary),
        color: theme.colors.onPrimary,
        padding: '14px 32px',
        borderRadius: theme.radius.md,
        fontFamily: theme.fonts.body,
        fontSize: '16px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        boxShadow: `0 4px 12px rgba(94, 187, 255, 0.3)`,
        transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...props}
    >
      {children}
    </button>
  );
}

// Secondary Button Component
export function SecondaryButton({ children, onClick, className = '', ...props }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: isHovered ? '#F9FAFB' : theme.colors.surface,
        color: theme.colors.textPrimary,
        padding: '14px 32px',
        borderRadius: theme.radius.md,
        fontFamily: theme.fonts.body,
        fontSize: '16px',
        fontWeight: 600,
        border: `1px solid ${theme.colors.borderSubtle}`,
        cursor: 'pointer',
        transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: isHovered ? theme.shadow.sm : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
}

// Feature Card Component
export function FeatureCard({ icon: Icon, title, description, color, accentColor }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        backgroundColor: color,
        borderRadius: theme.radius.lg,
        padding: '32px',
        boxShadow: isHovered ? theme.shadow.md : theme.shadow.sm,
        border: `1px solid ${theme.colors.borderSoft}`,
        transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: accentColor }}
      >
        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
      </div>
      <h3 style={{
        fontFamily: theme.fonts.body,
        fontSize: '20px',
        fontWeight: 600,
        color: theme.colors.textPrimary,
        marginBottom: '8px',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: theme.fonts.body,
        fontSize: '14px',
        color: theme.colors.textSecondary,
        lineHeight: '1.6',
      }}>
        {description}
      </p>
    </div>
  );
}

// Section Title Component
export function SectionTitle({ title, subtitle, centered = true }) {
  return (
    <div className={`${centered ? 'text-center' : ''} mb-12`}>
      <h2 style={{
        fontFamily: theme.fonts.heading,
        fontSize: '36px',
        fontWeight: 400,
        color: theme.colors.textPrimary,
        marginBottom: subtitle ? '12px' : '0',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: theme.fonts.body,
          fontSize: '16px',
          color: theme.colors.textSecondary,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Container Component
export function Container({ children, className = '' }) {
  return (
    <div className={`max-w-6xl mx-auto px-6 py-16 ${className}`}>
      {children}
    </div>
  );
}

// Navbar Component
export function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { label: t('navbar.features', { defaultValue: 'Features' }), path: '/app' },
    { label: t('navbar.pricing', { defaultValue: 'Pricing' }), path: '/precios' },
    { label: t('navbar.suppliers', { defaultValue: 'For Suppliers' }), path: '/para-proveedores' },
    { label: t('navbar.planners', { defaultValue: 'For Planners' }), path: '/para-planners' },
    { label: t('navbar.partners', { defaultValue: 'Partners' }), path: '/partners' },
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? `1px solid rgba(229, 231, 235, 0.8)` : `1px solid rgba(229, 231, 235, 0.3)`,
        boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-8 py-7">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="hover:scale-105"
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: '36px',
              fontWeight: 500,
              background: 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              letterSpacing: '-0.02em',
              transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Planivia
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item, index) => {
              const [hovered, setHovered] = useState(false);
              return (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 500,
                    color: hovered ? theme.colors.textPrimary : theme.colors.textSecondary,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    transition: 'all 200ms ease-out',
                    backgroundColor: 'transparent',
                    position: 'relative',
                  }}
                >
                  {item.label}
                  {hovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '14px',
                        right: '14px',
                        height: '2px',
                        backgroundColor: theme.colors.primary,
                        borderRadius: '2px',
                      }}
                    />
                  )}
                </button>
              );
            })}
            <div style={{ width: '16px' }} />
            <button
              onClick={() => navigate('/login')}
              style={{
                fontFamily: theme.fonts.body,
                fontSize: '16px',
                fontWeight: 500,
                color: theme.colors.textSecondary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: '8px',
                transition: 'all 200ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              {t('navbar.login', { defaultValue: 'Log In' })}
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                fontFamily: theme.fonts.body,
                fontSize: '16px',
                fontWeight: 600,
                color: theme.colors.onPrimary,
                backgroundColor: theme.colors.primary,
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                padding: '13px 28px',
                transition: 'all 200ms ease-out',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(94, 187, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {t('navbar.signup', { defaultValue: 'Start Free' })}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
            style={{
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.borderSoft}`,
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              padding: '8px',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.lavender)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.surface)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" style={{ color: theme.colors.textPrimary }} />
            ) : (
              <Menu className="w-6 h-6" style={{ color: theme.colors.textPrimary }} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            className="md:hidden mt-4 pb-4"
            style={{
              animation: 'fadeIn 200ms ease-out',
            }}
          >
            <div className="flex flex-col gap-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    fontWeight: 500,
                    color: theme.colors.textPrimary,
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.borderSoft}`,
                    cursor: 'pointer',
                    padding: '14px 16px',
                    textAlign: 'left',
                    borderRadius: theme.radius.md,
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.lavender;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                    e.currentTarget.style.borderColor = theme.colors.borderSoft;
                  }}
                >
                  {item.label}
                </button>
              ))}
              <div style={{ height: '1px', backgroundColor: theme.colors.borderSoft, margin: '8px 0' }} />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    fontWeight: 500,
                    color: theme.colors.textPrimary,
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                    borderRadius: theme.radius.md,
                    cursor: 'pointer',
                    padding: '14px',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.surface)}
                >
                  {t('navbar.login', { defaultValue: 'Log In' })}
                </button>
                <button
                  onClick={() => {
                    navigate('/signup');
                    setIsMenuOpen(false);
                  }}
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    fontWeight: 600,
                    color: theme.colors.onPrimary,
                    backgroundColor: theme.colors.primary,
                    border: 'none',
                    borderRadius: theme.radius.md,
                    cursor: 'pointer',
                    padding: '14px',
                    boxShadow: '0 2px 8px rgba(94, 187, 255, 0.25)',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 187, 255, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary;
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(94, 187, 255, 0.25)';
                  }}
                >
                  {t('navbar.signup', { defaultValue: 'Start Free' })}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Page Wrapper Component
export function PageWrapper({ children }) {
  return (
    <div style={{ backgroundColor: theme.colors.bgApp, minHeight: '100vh' }}>
      <Navbar />
      {children}
    </div>
  );
}
