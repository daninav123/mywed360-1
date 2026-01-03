import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

import { Widget } from './Widget';
import { WidgetTypes } from './widgets/WidgetTypes';
import { WidgetSelector } from './WidgetSelector';
import { useWidgets } from '../../hooks/useWidgets';

// Animation variants (memoizadas para performance)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export function Dashboard() {
  const { widgets, addWidget, removeWidget, moveWidget, updateWidgetConfig } = useWidgets();

  const [isEditing, setIsEditing] = useState(false);

  // Set up the appropriate drag and drop backend based on device type (memoizado)
  const dndBackend = useMemo(() => (isMobile ? TouchBackend : HTML5Backend), []);

  // Memoizar función de toggle editing
  const toggleEditing = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  // Memoizar función de activar editing mode
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
      >
        <div>
          <h1 
            className="text-2xl md:text-3xl font-bold"
            style={{ color: 'var(--color-text)', fontFamily: "'Playfair Display', serif" }}
          >
            Panel de Control
          </h1>
          <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
            {isEditing
              ? 'Arrastra y suelta para reorganizar los widgets'
              : 'Vista general de tu boda'}
          </p>
        </div>
        <button
          onClick={toggleEditing}
          className="px-5 py-2.5 transition-all flex items-center gap-2 font-medium text-sm"
          style={{
            backgroundColor: isEditing ? 'var(--color-lavender)' : 'var(--color-surface)',
            color: isEditing ? 'var(--color-primary)' : 'var(--color-text)',
            border: `1px solid ${isEditing ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: isEditing ? '0 2px 8px rgba(94, 187, 255, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = isEditing ? '0 4px 12px rgba(94, 187, 255, 0.2)' : '0 2px 6px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isEditing ? '0 2px 8px rgba(94, 187, 255, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)';
          }}
        >
          {isEditing ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Listo
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Personalizar
            </>
          )}
        </button>
      </motion.div>

      <DndProvider backend={dndBackend}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {widgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                variants={itemVariants}
                layout
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 120,
                }}
              >
                <Widget
                  index={index}
                  widget={widget}
                  isEditing={isEditing}
                  onRemove={removeWidget}
                  onMove={moveWidget}
                  onConfigUpdate={updateWidgetConfig}
                />
              </motion.div>
            ))}

            {isEditing && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
              >
                <WidgetSelector onSelect={addWidget} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DndProvider>

      {widgets.length === 0 && !isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: 'var(--color-muted)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium" style={{ color: 'var(--color-text)' }}>
            No hay widgets en tu panel
          </h3>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Haz clic en &quot;Personalizar&quot; para agregar widgets a tu panel de control.
          </p>
          <button
            onClick={startEditing}
            className="mt-6 inline-flex items-center px-5 py-2.5 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 2px 8px rgba(94, 187, 255, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 187, 255, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(94, 187, 255, 0.25)';
            }}
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Agregar widgets
          </button>
        </motion.div>
      )}
    </div>
  );
}
