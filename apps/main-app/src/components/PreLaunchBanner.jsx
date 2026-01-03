import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';

export default function PreLaunchBanner() {
  const isPreLaunchMode = import.meta.env.VITE_PRE_LAUNCH_MODE === 'true';
  const launchDate = import.meta.env.VITE_LAUNCH_DATE || '31 de enero de 2026';

  if (!isPreLaunchMode) return null;

  return (
    <div 
      style={{
        backgroundColor: '#FEF3C7',
        borderBottom: '2px solid #F59E0B',
        padding: '16px 24px',
      }}
    >
      <div 
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Sparkles 
          style={{ 
            width: '24px', 
            height: '24px', 
            color: '#F59E0B',
            flexShrink: 0,
          }} 
        />
        <div style={{ textAlign: 'center', flex: 1, minWidth: '250px' }}>
          <p style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#92400E',
            margin: 0,
          }}>
            🎉 ¡Próximo Lanzamiento!
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#78350F',
            margin: '4px 0 0 0',
          }}>
            Planivia estará disponible el <strong>{launchDate}</strong>. 
            Por ahora puedes explorar todas nuestras funcionalidades.
          </p>
        </div>
        <Calendar 
          style={{ 
            width: '24px', 
            height: '24px', 
            color: '#F59E0B',
            flexShrink: 0,
          }} 
        />
      </div>
    </div>
  );
}
