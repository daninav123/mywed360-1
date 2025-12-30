import React, { useState } from 'react';
import { Heart, Calendar, Users, Bell, Settings, Search, Plus, Check, Star, ArrowRight } from 'lucide-react';

/**
 * Página de demostración de estilos visuales para Planivia
 * Permite comparar diferentes propuestas de diseño
 */
export default function StyleDemo() {
  const [activeTheme, setActiveTheme] = useState('weddingDashboard');

  const themes = {
    deep: {
      name: 'Deep Blue & Peach',
      colors: {
        primary: '#1E40AF',
        secondary: '#EFF6FF',
        accent: '#FDBA74',
        dark: '#1E3A8A',
        light: '#FFFFFF',
        success: '#10B981',
        bg: '#F8FAFC',
      },
      fonts: {
        heading: "'Clash Display', sans-serif",
        body: "'Inter', sans-serif",
      },
      style: 'Profesional y cálido',
    },
    sky: {
      name: 'Sky Blue & Coral',
      colors: {
        primary: '#0284C7',
        secondary: '#F0F9FF',
        accent: '#F97316',
        dark: '#075985',
        light: '#FFFFFF',
        success: '#10B981',
        bg: '#F0F9FF',
      },
      fonts: {
        heading: "'Clash Display', sans-serif",
        body: "'Inter', sans-serif",
      },
      style: 'Luminoso y fresco',
    },
    softSaas: {
      name: 'Soft Pastel & Modern SaaS',
      colors: {
        primary: '#5EBBFF',
        secondary: '#FAF7F2',
        accent: '#5EBBFF',
        dark: '#1F2937',
        light: '#FFFFFF',
        success: '#CDEAC0',
        bg: 'radial-gradient(circle at 1px 1px, rgba(31, 41, 55, 0.05) 1px, transparent 0), linear-gradient(180deg, #FFF7CC 0%, #FAF7F2 55%, #FFF7CC 100%)',
        border: '#E5E7EB',
        textSecondary: '#6B7280',
        cream: '#FFF7CC',
        ivory: '#FAF7F2',
        blush: '#FADADD',
        sage: '#CDEAC0',
        lavender: '#E6D9FF',
        peach: '#FFE5D9',
        inputBg: '#F3F4F6',
      },
      fonts: {
        heading: "'DM Serif Display', serif",
        body: "'Inter', sans-serif",
      },
      layout: {
        panel: true,
        panelBg: '#FFFFFF',
        panelBorder: 'rgba(31, 41, 55, 0.08)',
        panelRadius: 28,
        panelShadow: '0 24px 80px rgba(0,0,0,0.12)',
        cardRadius: 18,
        cardShadow: '0 8px 24px rgba(0,0,0,0.04)',
        bgSize: '22px 22px, cover',
      },
      style: 'Calidez emocional + estructura clara + sensación premium moderna',
    },
    elegant1: {
      name: 'Champagne Elegance',
      colors: {
        primary: '#C9A24D',
        secondary: '#FAF7F2',
        accent: '#1C1C1C',
        dark: '#1C1C1C',
        light: '#FAF7F2',
        success: '#8B7355',
        bg: 'repeating-linear-gradient(45deg, #0F3D3E 0px, #0F3D3E 10px, #1A5859 10px, #1A5859 20px)',
      },
      fonts: {
        heading: "'Cormorant Garamond', serif",
        body: "'Lato', sans-serif",
      },
      style: 'ELEGANTE - Fondo verde oscuro + dorado champagne',
    },
    elegant2: {
      name: 'Ivory & Gold',
      colors: {
        primary: '#1C1C1C',
        secondary: '#FAF7F2',
        accent: '#C9A24D',
        dark: '#1C1C1C',
        light: '#FFFFFF',
        success: '#8B7355',
        bg: 'radial-gradient(circle at 20% 30%, #FAF7F2 0%, #E8E3D9 100%)',
      },
      fonts: {
        heading: "'Playfair Display', serif",
        body: "'Montserrat', sans-serif",
      },
      style: 'ELEGANTE - Fondo marfil suave + acentos dorados',
    },
    elegant3: {
      name: 'Dark Botanical',
      colors: {
        primary: '#C9A24D',
        secondary: '#1C1C1C',
        accent: '#FAF7F2',
        dark: '#0A0A0A',
        light: '#FAF7F2',
        success: '#8B7355',
        bg: 'linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%)',
      },
      fonts: {
        heading: "'Libre Baskerville', serif",
        body: "'Source Sans Pro', sans-serif",
      },
      style: 'ELEGANTE - Fondo negro suave + dorado destacado',
    },
    elegant4: {
      name: 'Botanical Pattern',
      colors: {
        primary: '#C9A24D',
        secondary: '#FAF7F2',
        accent: '#5A7C7E',
        dark: '#1C1C1C',
        light: '#FFFFFF',
        success: '#8B7355',
        bg: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23164E4F\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #0F3D3E 0%, #1A5859 100%)',
      },
      fonts: {
        heading: "'Crimson Text', serif",
        body: "'Karla', sans-serif",
      },
      style: 'ELEGANTE - Pattern botánico sutil + dorado',
    },
    elegant5: {
      name: 'Warm Ivory',
      colors: {
        primary: '#C9A24D',
        secondary: '#FAF7F2',
        accent: '#8B7355',
        dark: '#1C1C1C',
        light: '#FFFFFF',
        success: '#A0826D',
        bg: 'linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 50%, #EDE6D9 100%)',
      },
      fonts: {
        heading: "'DM Serif Display', serif",
        body: "'Inter', sans-serif",
      },
      style: 'ELEGANTE - Degradado cálido marfil + toques dorados',
    },
    softSaasV2: {
      name: 'Soft Pastel & Modern SaaS v2',
      colors: {
        primary: '#5EBBFF',
        primaryHover: '#45AFFF',
        primaryPressed: '#2F9FFF',
        bgApp: '#FFF7CC',
        bgCanvas: '#FAF7F2',
        surface: '#FFFFFF',
        blush: '#FADADD',
        sage: '#CDEAC0',
        lavender: '#E6D9FF',
        peach: '#FFE5D9',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280',
        textMuted: '#9CA3AF',
        onPrimary: '#FFFFFF',
        borderSubtle: '#E5E7EB',
        borderSoft: '#EEF2F7',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA',
        inputBg: '#F4F6FA',
        bg: '#FFF7CC',
        dark: '#1F2937',
        light: '#FFFFFF',
        secondary: '#FAF7F2',
        accent: '#5EBBFF',
      },
      fonts: {
        heading: "'Playfair Display', ui-serif, Georgia, serif",
        body: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
      },
      typography: {
        fontSize: {
          xs: '12px',
          sm: '14px',
          md: '16px',
          lg: '18px',
          xl: '20px',
          '2xl': '24px',
          '3xl': '30px',
          '4xl': '36px',
        },
        lineHeight: {
          tight: '1.15',
          snug: '1.25',
          normal: '1.5',
          relaxed: '1.65',
        },
        fontWeight: {
          regular: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        letterSpacing: {
          tight: '-0.02em',
          normal: '0em',
          wide: '0.02em',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      radius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '24px',
        pill: '999px',
      },
      shadow: {
        none: 'none',
        sm: '0 2px 10px rgba(0,0,0,0.04)',
        md: '0 8px 24px rgba(0,0,0,0.06)',
        lg: '0 16px 40px rgba(0,0,0,0.08)',
      },
      motion: {
        duration: {
          fast: '150ms',
          base: '220ms',
          slow: '320ms',
        },
        easing: {
          standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
      components: {
        button: {
          primary: {
            paddingY: '12px',
            paddingX: '24px',
            radius: '14px',
          },
          secondary: {
            radius: '14px',
          },
        },
        card: {
          radius: '18px',
          shadow: '0 8px 24px rgba(0,0,0,0.06)',
          padding: '24px',
        },
        input: {
          height: '44px',
          radius: '14px',
        },
        chip: {
          paddingY: '6px',
          paddingX: '10px',
        },
      },
      layout: {
        panel: true,
        panelBg: '#FFFFFF',
        panelBorder: '#E5E7EB',
        panelRadius: 24,
        panelShadow: '0 16px 40px rgba(0,0,0,0.08)',
      },
      style: 'Warm pastel emotion + modern SaaS clarity',
    },
    weddingDashboard: {
      name: 'Wedding Dashboard Soft',
      colors: {
        primary: '#2D3748',
        secondary: '#718096',
        accent: '#D4A574',
        dark: '#2D3748',
        light: '#FFFFFF',
        bg: '#FFFBF7',
        surface: '#FFFFFF',
        // Stat card individual colors
        countdownBg: '#FFF4E6',
        countdownAccent: '#D4A574',
        budgetBg: '#E8F5E9',
        budgetAccent: '#4A9B5F',
        guestBg: '#FCE4EC',
        guestAccent: '#C97C8F',
        // Task colors
        taskYellow: '#FFA726',
        taskPurple: '#9575CD',
        taskRed: '#EF5350',
        taskGreen: '#66BB6A',
        // Text
        textPrimary: '#2D3748',
        textSecondary: '#718096',
        textMuted: '#A0AEC0',
        // Borders
        border: '#E2E8F0',
        success: '#66BB6A',
      },
      fonts: {
        heading: "'Playfair Display', 'Cormorant Garamond', serif",
        body: "'DM Sans', 'Inter', sans-serif",
      },
      radius: {
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      },
      shadow: {
        card: '0 2px 8px rgba(0,0,0,0.04)',
        hover: '0 4px 12px rgba(0,0,0,0.08)',
      },
      spacing: {
        cardPadding: '24px',
        gap: '16px',
      },
      style: 'Soft pastel wedding planner - cada card con su color único',
    },
  };

  const currentTheme = themes[activeTheme];
  const isSoftSaas = activeTheme === 'softSaas';
  const isSoftSaasV2 = activeTheme === 'softSaasV2';
  const isWeddingDashboard = activeTheme === 'weddingDashboard';
  const borderColor = currentTheme?.colors?.borderSubtle || currentTheme?.colors?.border || currentTheme?.colors?.secondary;
  const textSecondaryColor = currentTheme?.colors?.textSecondary || currentTheme?.colors?.dark;
  const usePanel = !!currentTheme?.layout?.panel;
  const iconStrokeWidth = (isSoftSaas || isSoftSaasV2 || isWeddingDashboard) ? 1.5 : 2;

  const DemoCard = ({ title, children, className = '' }) => (
    <div 
      className={`rounded-xl ${className}`}
      style={{
        backgroundColor: isSoftSaasV2 ? currentTheme.colors.surface : currentTheme.colors.light,
        border: `1px solid ${isSoftSaasV2 ? currentTheme.colors.borderSoft : borderColor}`,
        borderRadius: isSoftSaasV2 ? currentTheme.radius.lg : (currentTheme?.layout?.cardRadius ?? undefined),
        boxShadow: isSoftSaasV2 ? currentTheme.shadow.md : (currentTheme?.layout?.cardShadow ?? undefined),
        padding: isSoftSaasV2 ? currentTheme.components.card.padding : '24px',
      }}
    >
      <h3 
        className="text-lg font-semibold mb-4"
        style={{ 
          color: currentTheme.colors.dark,
          fontFamily: currentTheme.fonts.heading,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div 
      className="min-h-screen"
      style={{ 
        ...(currentTheme?.layout?.bgSize 
          ? { 
              background: currentTheme.colors.bg,
              backgroundSize: currentTheme.layout.bgSize,
            }
          : { 
              background: isSoftSaasV2 ? currentTheme.colors.bgApp : currentTheme.colors.bg 
            }
        ),
        fontFamily: currentTheme.fonts.body,
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-lg border-b"
        style={{ 
          backgroundColor: `${currentTheme.colors.light}ee`,
          borderColor: borderColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart 
                className="w-8 h-8" 
                style={{ color: currentTheme.colors.primary }}
                fill={currentTheme.colors.primary}
                strokeWidth={iconStrokeWidth}
              />
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  color: currentTheme.colors.dark,
                  fontFamily: currentTheme.fonts.heading,
                }}
              >
                Planivia
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" style={{ color: currentTheme.colors.dark }} className="hover:opacity-70">Dashboard</a>
              <a href="#" style={{ color: currentTheme.colors.dark }} className="hover:opacity-70">Eventos</a>
              <a href="#" style={{ color: currentTheme.colors.dark }} className="hover:opacity-70">Proveedores</a>
              <button 
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out hover:shadow-lg"
                style={{ 
                  backgroundColor: currentTheme.colors.primary,
                  color: currentTheme.colors.light,
                  borderRadius: isSoftSaas ? 16 : undefined,
                }}
              >
                Crear Evento
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Panel (solo Soft Pastel & Modern SaaS) */}
      <div
        className={usePanel ? 'max-w-7xl mx-auto px-6 py-10' : ''}
      >
        <div
          style={
            usePanel
              ? {
                  backgroundColor: currentTheme.layout.panelBg,
                  border: `1px solid ${currentTheme.layout.panelBorder}`,
                  borderRadius: currentTheme.layout.panelRadius,
                  boxShadow: currentTheme.layout.panelShadow,
                  overflow: 'hidden',
                }
              : undefined
          }
        >
          {/* Theme Selector */}
          <div className={usePanel ? 'px-6 pt-6' : 'max-w-7xl mx-auto px-6 py-6'}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setActiveTheme(key)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeTheme === key ? 'shadow-lg scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor:
                      activeTheme === key ? theme.colors.primary : theme.colors.secondary,
                    color: activeTheme === key ? theme.colors.light : theme.colors.dark,
                    borderRadius: isSoftSaas ? 16 : undefined,
                  }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
            <p className="text-sm mt-2 opacity-70" style={{ color: currentTheme.colors.dark }}>
              {currentTheme.style}
            </p>
          </div>

          {/* Hero Section - Wedding Dashboard */}
          {isWeddingDashboard && (
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div 
                className="rounded-3xl overflow-hidden mb-8"
                style={{
                  background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5C4 100%)',
                  boxShadow: currentTheme.shadow.card,
                }}
              >
                <div className="p-8 md:p-12">
                  <h1 
                    style={{
                      fontFamily: currentTheme.fonts.heading,
                      fontSize: '32px',
                      fontWeight: 400,
                      color: currentTheme.colors.textPrimary,
                      marginBottom: '8px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Hi Anna & David!
                  </h1>
                  <p 
                    style={{
                      fontFamily: currentTheme.fonts.body,
                      fontSize: '16px',
                      color: currentTheme.colors.textSecondary,
                    }}
                  >
                    Let's Plan Your Dream Wedding
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={usePanel ? 'px-6 pb-8' : 'max-w-7xl mx-auto px-6 py-8'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Botones */}
          <DemoCard title="Botones">
            <div className="space-y-3">
              <button 
                className="w-full font-medium transition-all hover:shadow-lg"
                style={{ 
                  backgroundColor: currentTheme.colors.primary,
                  color: isSoftSaasV2 ? currentTheme.colors.onPrimary : currentTheme.colors.light,
                  borderRadius: isSoftSaasV2 ? currentTheme.components.button.primary.radius : (isSoftSaas ? '16px' : undefined),
                  paddingTop: isSoftSaasV2 ? currentTheme.components.button.primary.paddingY : '12px',
                  paddingBottom: isSoftSaasV2 ? currentTheme.components.button.primary.paddingY : '12px',
                  paddingLeft: isSoftSaasV2 ? currentTheme.components.button.primary.paddingX : '24px',
                  paddingRight: isSoftSaasV2 ? currentTheme.components.button.primary.paddingX : '24px',
                  transitionDuration: isSoftSaasV2 ? currentTheme.motion.duration.base : '200ms',
                  transitionTimingFunction: isSoftSaasV2 ? currentTheme.motion.easing.standard : 'ease-in-out',
                }}
                onMouseEnter={(e) => {
                  if (isSoftSaasV2) e.currentTarget.style.backgroundColor = currentTheme.colors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  if (isSoftSaasV2) e.currentTarget.style.backgroundColor = currentTheme.colors.primary;
                }}
                onMouseDown={(e) => {
                  if (isSoftSaasV2) e.currentTarget.style.backgroundColor = currentTheme.colors.primaryPressed;
                }}
                onMouseUp={(e) => {
                  if (isSoftSaasV2) e.currentTarget.style.backgroundColor = currentTheme.colors.primaryHover;
                }}
              >
                {isSoftSaasV2 ? 'Continuar' : (isSoftSaas ? 'Continuar' : 'Botón Primario')}
              </button>
              <button 
                className="w-full font-medium transition-all hover:shadow-md"
                style={{ 
                  backgroundColor: isSoftSaasV2 ? currentTheme.colors.surface : (isSoftSaas ? currentTheme.colors.blush : currentTheme.colors.secondary),
                  color: isSoftSaasV2 ? currentTheme.colors.textPrimary : currentTheme.colors.dark,
                  border: isSoftSaasV2 ? `1px solid ${currentTheme.colors.borderSubtle}` : (isSoftSaas ? `1px solid ${borderColor}` : undefined),
                  borderRadius: isSoftSaasV2 ? currentTheme.components.button.secondary.radius : (isSoftSaas ? '16px' : undefined),
                  paddingTop: isSoftSaasV2 ? currentTheme.components.button.primary.paddingY : '12px',
                  paddingBottom: isSoftSaasV2 ? currentTheme.components.button.primary.paddingY : '12px',
                  paddingLeft: isSoftSaasV2 ? currentTheme.components.button.primary.paddingX : '24px',
                  paddingRight: isSoftSaasV2 ? currentTheme.components.button.primary.paddingX : '24px',
                  transitionDuration: isSoftSaasV2 ? currentTheme.motion.duration.base : '200ms',
                }}
              >
                {isSoftSaasV2 ? 'Guardar para luego' : (isSoftSaas ? 'Guardar para luego' : 'Botón Secundario')}
              </button>
              <button 
                className={`w-full font-medium ${(isSoftSaas || isSoftSaasV2) ? 'border' : 'border-2'} transition-all hover:shadow-md`}
                style={{ 
                  borderColor: currentTheme.colors.primary,
                  color: currentTheme.colors.primary,
                  backgroundColor: 'transparent',
                  borderRadius: isSoftSaasV2 ? currentTheme.components.button.secondary.radius : (isSoftSaas ? '16px' : undefined),
                  paddingTop: isSoftSaasV2 ? currentTheme.components.button.primary.paddingY : '12px',
                  paddingBottom: isSoftSaasV2 ? currentTheme.components.button.primary.paddingY : '12px',
                  paddingLeft: isSoftSaasV2 ? currentTheme.components.button.primary.paddingX : '24px',
                  paddingRight: isSoftSaasV2 ? currentTheme.components.button.primary.paddingX : '24px',
                  transitionDuration: isSoftSaasV2 ? currentTheme.motion.duration.base : '200ms',
                }}
              >
                {(isSoftSaas || isSoftSaasV2) ? 'Ver detalles' : 'Botón Outline'}
              </button>
            </div>
          </DemoCard>

          {/* Cards */}
          <DemoCard title={isWeddingDashboard ? "Upcoming Tasks" : "Cards & Componentes"}>
            <div className="space-y-3">
              {isWeddingDashboard ? (
                /* Task list con checkmarks circulares de colores */
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.taskYellow }}>
                      <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: currentTheme.colors.textPrimary }}>Cake Tasting</p>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.success }}>
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.taskPurple }}>
                      <Users className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: currentTheme.colors.textPrimary }}>Meet Photographer</p>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.success }}>
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.taskRed }}>
                      <Heart className="w-5 h-5 text-white" strokeWidth={2} fill="currentColor" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: currentTheme.colors.textPrimary }}>Finalize Music Playlist</p>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.success }}>
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Stat Card */}
                  <div 
                    className="rounded-lg"
                    style={{
                      backgroundColor: isSoftSaasV2 ? currentTheme.colors.surface : (isSoftSaas ? currentTheme.colors.light : currentTheme.colors.secondary),
                      border: isSoftSaasV2 ? `1px solid ${currentTheme.colors.borderSoft}` : (isSoftSaas ? `1px solid ${borderColor}` : undefined),
                      borderRadius: isSoftSaasV2 ? currentTheme.radius.md : (isSoftSaas ? '16px' : undefined),
                      boxShadow: isSoftSaasV2 ? currentTheme.shadow.sm : (isSoftSaas ? currentTheme.layout.cardShadow : undefined),
                      padding: isSoftSaasV2 ? currentTheme.spacing.lg : '16px',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-60" style={{ color: textSecondaryColor }}>Total Invitados</p>
                        <p className="text-2xl font-bold" style={{ color: currentTheme.colors.primary }}>156</p>
                      </div>
                      <Users className="w-8 h-8" style={{ color: currentTheme.colors.primary }} strokeWidth={iconStrokeWidth} />
                    </div>
                  </div>

                  {/* Event Card */}
                  <div 
                    className="rounded-lg border-l-4"
                    style={{ 
                      backgroundColor: isSoftSaasV2 ? currentTheme.colors.surface : currentTheme.colors.light,
                      borderColor: currentTheme.colors.accent,
                      borderRadius: isSoftSaasV2 ? currentTheme.radius.md : (isSoftSaas ? '16px' : undefined),
                      boxShadow: isSoftSaasV2 ? currentTheme.shadow.sm : (isSoftSaas ? currentTheme.layout.cardShadow : undefined),
                      padding: isSoftSaasV2 ? currentTheme.spacing.lg : '16px',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold" style={{ color: currentTheme.colors.dark }}>Boda Ana y Carlos</h4>
                        <p className="text-sm opacity-60" style={{ color: textSecondaryColor }}>15 Mayo 2025</p>
                      </div>
                      <Calendar className="w-5 h-5" style={{ color: currentTheme.colors.accent }} strokeWidth={iconStrokeWidth} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <span 
                        className="text-xs"
                        style={{ 
                          backgroundColor: isSoftSaasV2 ? currentTheme.colors.sage : (currentTheme.colors.success + '20'),
                          color: isSoftSaasV2 ? currentTheme.colors.textSecondary : currentTheme.colors.success,
                          borderRadius: isSoftSaasV2 ? currentTheme.radius.pill : '9999px',
                          paddingTop: isSoftSaasV2 ? currentTheme.components.chip.paddingY : '4px',
                          paddingBottom: isSoftSaasV2 ? currentTheme.components.chip.paddingY : '4px',
                          paddingLeft: isSoftSaasV2 ? currentTheme.components.chip.paddingX : '8px',
                          paddingRight: isSoftSaasV2 ? currentTheme.components.chip.paddingX : '8px',
                          display: 'inline-block',
                        }}
                      >
                        {(isSoftSaas || isSoftSaasV2) ? 'Un paso más cerca' : 'En progreso'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DemoCard>

          {/* Form Elements */}
          <DemoCard title="Formularios" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.dark }}>
                  Nombre del Evento
                </label>
                <input 
                  type="text"
                  placeholder={(isSoftSaas || isSoftSaasV2) ? 'Añade tu lugar...' : 'Ej: Boda de María y Juan'}
                  className="w-full px-4 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: isSoftSaasV2 ? currentTheme.colors.borderSubtle : borderColor,
                    backgroundColor: isSoftSaasV2 ? currentTheme.colors.inputBg : (isSoftSaas ? currentTheme.colors.inputBg : currentTheme.colors.light),
                    borderRadius: isSoftSaasV2 ? currentTheme.components.input.radius : (isSoftSaas ? '16px' : undefined),
                    height: isSoftSaasV2 ? currentTheme.components.input.height : '40px',
                    color: isSoftSaasV2 ? currentTheme.colors.textPrimary : undefined,
                    ['--tw-ring-color']: currentTheme.colors.primary,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.dark }}>
                  Fecha
                </label>
                <div className="relative">
                  <input 
                    type="date"
                    className="w-full px-4 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: isSoftSaasV2 ? currentTheme.colors.borderSubtle : borderColor,
                      backgroundColor: isSoftSaasV2 ? currentTheme.colors.inputBg : (isSoftSaas ? currentTheme.colors.inputBg : currentTheme.colors.light),
                      borderRadius: isSoftSaasV2 ? currentTheme.components.input.radius : (isSoftSaas ? '16px' : undefined),
                      height: isSoftSaasV2 ? currentTheme.components.input.height : '40px',
                      color: isSoftSaasV2 ? currentTheme.colors.textPrimary : undefined,
                      ['--tw-ring-color']: currentTheme.colors.primary,
                    }}
                  />
                  <Calendar className="absolute right-3 w-5 h-5 opacity-40" style={{ color: currentTheme.colors.dark, top: isSoftSaasV2 ? '10px' : '10px' }} strokeWidth={iconStrokeWidth} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.dark }}>
                  Búsqueda
                </label>
                <div className="relative">
                  <Search className="absolute left-3 w-5 h-5 opacity-40" style={{ color: currentTheme.colors.dark, top: isSoftSaasV2 ? '10px' : '10px' }} strokeWidth={iconStrokeWidth} />
                  <input 
                    type="text"
                    placeholder={(isSoftSaas || isSoftSaasV2) ? 'Buscar proveedores, invitados...' : 'Buscar proveedores, invitados...'}
                    className="w-full pl-10 pr-4 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: isSoftSaasV2 ? currentTheme.colors.borderSubtle : borderColor,
                      backgroundColor: isSoftSaasV2 ? currentTheme.colors.inputBg : (isSoftSaas ? currentTheme.colors.inputBg : currentTheme.colors.light),
                      borderRadius: isSoftSaasV2 ? currentTheme.components.input.radius : (isSoftSaas ? '16px' : undefined),
                      height: isSoftSaasV2 ? currentTheme.components.input.height : '40px',
                      color: isSoftSaasV2 ? currentTheme.colors.textPrimary : undefined,
                      ['--tw-ring-color']: currentTheme.colors.primary,
                    }}
                  />
                </div>
              </div>
            </div>
          </DemoCard>

          {/* Dashboard Preview */}
          <DemoCard title="Vista Dashboard" className="lg:col-span-2">
            {isWeddingDashboard ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Countdown Card - Amarillo */}
                <div 
                  className="rounded-lg p-6"
                  style={{
                    backgroundColor: currentTheme.colors.countdownBg,
                    borderRadius: currentTheme.radius.lg,
                    boxShadow: currentTheme.shadow.card,
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: currentTheme.colors.countdownAccent }}>Countdown</p>
                  <p style={{ 
                    color: currentTheme.colors.countdownAccent,
                    fontSize: '36px',
                    fontWeight: 700,
                    fontFamily: currentTheme.fonts.body,
                    lineHeight: 1,
                  }}>142</p>
                  <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>Days to Go</p>
                  <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: currentTheme.colors.countdownAccent, width: '60%' }}></div>
                </div>

                {/* Budget Card - Verde */}
                <div 
                  className="rounded-lg p-6"
                  style={{
                    backgroundColor: currentTheme.colors.budgetBg,
                    borderRadius: currentTheme.radius.lg,
                    boxShadow: currentTheme.shadow.card,
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: currentTheme.colors.budgetAccent }}>Budget</p>
                  <p style={{ 
                    color: currentTheme.colors.budgetAccent,
                    fontSize: '36px',
                    fontWeight: 700,
                    fontFamily: currentTheme.fonts.body,
                    lineHeight: 1,
                  }}>$15,200</p>
                  <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>of $25,000</p>
                  <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: currentTheme.colors.budgetAccent, width: '75%' }}></div>
                </div>

                {/* Guest List Card - Rosa */}
                <div 
                  className="rounded-lg p-6"
                  style={{
                    backgroundColor: currentTheme.colors.guestBg,
                    borderRadius: currentTheme.radius.lg,
                    boxShadow: currentTheme.shadow.card,
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: currentTheme.colors.guestAccent }}>Guest List</p>
                  <p style={{ 
                    color: currentTheme.colors.guestAccent,
                    fontSize: '36px',
                    fontWeight: 700,
                    fontFamily: currentTheme.fonts.body,
                    lineHeight: 1,
                  }}>85</p>
                  <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>Confirmed</p>
                  <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: currentTheme.colors.guestAccent, width: '85%' }}></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Calendar, label: 'Eventos', value: '3', color: currentTheme.colors.primary },
                  { icon: Users, label: 'Invitados', value: '156', color: currentTheme.colors.accent },
                  { icon: Star, label: 'Proveedores', value: '12', color: currentTheme.colors.success },
                  { icon: Check, label: 'Tareas', value: '24/30', color: currentTheme.colors.primary },
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="rounded-lg text-center transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      backgroundColor: isSoftSaasV2 ? currentTheme.colors.surface : (isSoftSaas ? currentTheme.colors.light : currentTheme.colors.secondary),
                      border: isSoftSaasV2 ? `1px solid ${currentTheme.colors.borderSoft}` : (isSoftSaas ? `1px solid ${borderColor}` : undefined),
                      borderRadius: isSoftSaasV2 ? currentTheme.radius.md : (isSoftSaas ? '16px' : undefined),
                      boxShadow: isSoftSaasV2 ? currentTheme.shadow.sm : (isSoftSaas ? currentTheme.layout.cardShadow : undefined),
                      padding: isSoftSaasV2 ? currentTheme.spacing.lg : '16px',
                      transitionDuration: isSoftSaasV2 ? currentTheme.motion.duration.base : '200ms',
                    }}
                  >
                    <item.icon className="w-8 h-8 mx-auto mb-2" style={{ color: item.color }} strokeWidth={iconStrokeWidth} />
                    <p style={{ 
                      color: isSoftSaasV2 ? currentTheme.colors.textPrimary : currentTheme.colors.dark,
                      fontSize: isSoftSaasV2 ? currentTheme.typography.fontSize['2xl'] : '24px',
                      fontWeight: isSoftSaasV2 ? currentTheme.typography.fontWeight.bold : 700,
                      marginBottom: '4px',
                    }}>{item.value}</p>
                    <p className="text-sm opacity-60" style={{ color: textSecondaryColor }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </DemoCard>

          {/* Paleta de colores */}
          <DemoCard title="Paleta de Colores">
            <div className="space-y-3">
              {Object.entries(currentTheme.colors).map(([name, color]) => (
                <div key={name} className="flex items-center gap-3">
                  <div 
                    className="w-16 h-16 rounded-lg shadow-md"
                    style={{ background: color }}
                  />
                  <div>
                    <p className="font-medium capitalize" style={{ color: currentTheme.colors.dark }}>{name}</p>
                    <p className="text-sm opacity-60" style={{ color: textSecondaryColor }}>
                      {String(color)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DemoCard>

          {/* Tipografía */}
          <DemoCard title="Tipografía">
            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-60 mb-2" style={{ color: currentTheme.colors.dark }}>Display (Heading)</p>
                <h1 
                  style={{ 
                    color: isSoftSaasV2 ? currentTheme.colors.textPrimary : currentTheme.colors.dark,
                    fontFamily: currentTheme.fonts.heading,
                    fontSize: isSoftSaasV2 ? currentTheme.typography.fontSize['4xl'] : '36px',
                    fontWeight: isSoftSaasV2 ? currentTheme.typography.fontWeight.bold : 700,
                    lineHeight: isSoftSaasV2 ? currentTheme.typography.lineHeight.tight : '1.2',
                  }}
                >
                  Our Wedding
                </h1>
              </div>
              <div>
                <p className="text-sm opacity-60 mb-2" style={{ color: currentTheme.colors.dark }}>Body (UI Text)</p>
                <p style={{ 
                  color: isSoftSaasV2 ? currentTheme.colors.textPrimary : currentTheme.colors.dark,
                  fontFamily: currentTheme.fonts.body,
                  fontSize: isSoftSaasV2 ? currentTheme.typography.fontSize.md : '16px',
                  lineHeight: isSoftSaasV2 ? currentTheme.typography.lineHeight.normal : '1.5',
                }}>
                  {isSoftSaasV2
                    ? 'Warm pastel emotion meets modern SaaS clarity. Every detail matters.'
                    : (isSoftSaas
                      ? 'Calidez emocional, estructura clara y un look premium moderno para planificar sin estrés.'
                      : 'Planifica tu evento perfecto con elegancia y simplicidad. Gestiona invitados, proveedores y todos los detalles en un solo lugar.')}
                </p>
              </div>
              {isSoftSaasV2 && (
                <div>
                  <p className="text-sm opacity-60 mb-2" style={{ color: currentTheme.colors.dark }}>Secondary Text</p>
                  <p style={{ 
                    color: currentTheme.colors.textSecondary,
                    fontFamily: currentTheme.fonts.body,
                    fontSize: currentTheme.typography.fontSize.sm,
                    lineHeight: currentTheme.typography.lineHeight.normal,
                  }}>
                    Supporting information and helper text use secondary color for hierarchy.
                  </p>
                </div>
              )}
            </div>
          </DemoCard>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer 
        className="mt-16 border-t py-8"
        style={{ borderColor: borderColor }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="opacity-60" style={{ color: currentTheme.colors.dark }}>
            Demostración de estilos para Planivia - Tu asistente de planificación de eventos
          </p>
          <p className="text-sm mt-2 opacity-40" style={{ color: currentTheme.colors.dark }}>
            Tema activo: {currentTheme.name}
          </p>
        </div>
      </footer>
    </div>
  );
}
