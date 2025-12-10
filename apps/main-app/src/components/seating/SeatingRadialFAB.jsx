import React, { useState } from 'react';
import { Plus, Users, Grid, Download, Upload, Undo, Redo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslations from '../../hooks/useTranslations';

/**
 * FAB Radial para Seating Plan Móvil
 * Menú flotante expandible con acciones rápidas
 */
const SeatingRadialFAB = ({
  onAddTable,
  onAddGuest,
  onExport,
  onImport,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslations();

  const actions = [
    {
      id: 'add-table',
      icon: Grid,
      label: t('seatingMobile.fab.addTable', { defaultValue: 'Añadir Mesa' }),
      onClick: onAddTable,
      color: 'bg-blue-500',
      angle: 0,
    },
    {
      id: 'add-guest',
      icon: Users,
      label: t('seatingMobile.fab.addGuest', { defaultValue: 'Añadir Invitado' }),
      onClick: onAddGuest,
      color: 'bg-green-500',
      angle: 45,
    },
    {
      id: 'export',
      icon: Download,
      label: t('seatingMobile.fab.export', { defaultValue: 'Exportar' }),
      onClick: onExport,
      color: 'bg-purple-500',
      angle: 90,
    },
    {
      id: 'import',
      icon: Upload,
      label: t('seatingMobile.fab.import', { defaultValue: 'Importar' }),
      onClick: onImport,
      color: 'bg-orange-500',
      angle: 135,
    },
    {
      id: 'undo',
      icon: Undo,
      label: t('seatingMobile.fab.undo', { defaultValue: 'Deshacer' }),
      onClick: onUndo,
      color: 'bg-gray-500',
      angle: 180,
      disabled: !canUndo,
    },
    {
      id: 'redo',
      icon: Redo,
      label: t('seatingMobile.fab.redo', { defaultValue: 'Rehacer' }),
      onClick: onRedo,
      color: 'bg-gray-500',
      angle: 225,
      disabled: !canRedo,
    },
  ];

  const handleActionClick = (action) => {
    if (!action.disabled && action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  };

  // Calcular posición de cada botón en el círculo
  const getPosition = (angle) => {
    const radius = 80; // Radio del círculo
    const angleRad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
    };
  };

  return (
    <>
      {/* Backdrop cuando está abierto */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Container del FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Botones de acción radiales */}
        <AnimatePresence>
          {isOpen &&
            actions.map((action, index) => {
              const pos = getPosition(action.angle);
              const Icon = action.icon;

              return (
                <motion.button
                  key={action.id}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    x: -pos.x,
                    y: -pos.y,
                    opacity: 1,
                  }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={`
                    absolute bottom-0 right-0
                    w-12 h-12 rounded-full shadow-lg
                    flex items-center justify-center
                    text-white
                    ${action.disabled ? 'bg-gray-300 cursor-not-allowed opacity-50' : action.color}
                    ${!action.disabled && 'active:scale-95 hover:scale-110'}
                    transition-transform
                  `}
                  aria-label={action.label}
                >
                  <Icon className="w-5 h-5" />
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* Botón principal (siempre visible) */}
        <motion.button
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg
            flex items-center justify-center
            active:scale-95 hover:scale-105
            transition-transform relative z-10
          "
          aria-label={
            isOpen
              ? t('seatingMobile.fab.close', { defaultValue: 'Cerrar' })
              : t('seatingMobile.fab.open', { defaultValue: 'Abrir menú' })
          }
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        {/* Labels cuando está abierto (solo en pantallas más grandes) */}
        {isOpen && (
          <div className="hidden sm:block">
            {actions.map((action) => {
              const pos = getPosition(action.angle);
              return (
                <motion.div
                  key={`label-${action.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: 0.2 }}
                  className="absolute bottom-0 right-0 pointer-events-none"
                  style={{
                    transform: `translate(${-pos.x - 60}px, ${-pos.y}px)`,
                  }}
                >
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {action.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default SeatingRadialFAB;
