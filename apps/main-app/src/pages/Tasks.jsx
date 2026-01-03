import React from 'react';
import { useTranslation } from 'react-i18next';

import CalendarSync from '../components/tasks/CalendarSync';
import ErrorBoundary from '../components/tasks/ErrorBoundary';
import TasksRefactored from '../components/tasks/TasksRefactored';
import Nav from '../components/Nav';
import './Tasks.css';

/**
 * Tasks.jsx - Wrapper para TasksRefactored
 *
 * Este componente actúa como un wrapper para la versión refactorizada del
 * componente Tasks, que contiene toda la funcionalidad dividida en componentes
 * más pequeños y mantenibles.
 */
export default function Tasks() {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        <div className="mx-auto my-8" style={{
          maxWidth: '1024px',
          width: '100%',
          backgroundColor: '#FFFBF7',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          
          {/* Hero con degradado beige-dorado */}
          <header className="relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
            padding: '48px 32px 32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div className="max-w-4xl" style={{ textAlign: 'center' }}>
              {/* Título con líneas decorativas */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, #D4A574)',
                }} />
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                  fontSize: '40px',
                  fontWeight: 400,
                  color: '#1F2937',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}>{t('nav.tasks', { defaultValue: 'Tareas' })}</h1>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to left, transparent, #D4A574)',
                }} />
              </div>
              
              {/* Subtítulo como tag uppercase */}
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '32px',
              }}>{t('common:inspiration.weddingManagement')}</p>
            </div>
          </header>

          {/* Contenido principal */}
          <ErrorBoundary>
            <section className="px-6 py-6 space-y-6">
              <CalendarSync />
              <TasksRefactored />
            </section>
          </ErrorBoundary>

        </div>
      </div>
      
      {/* Bottom Navigation */}
      <Nav />
    </>
  );
}
