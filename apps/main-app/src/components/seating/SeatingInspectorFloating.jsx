/**
 * SeatingInspectorFloating - Panel flotante de inspección con glassmorphism
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  RotateCw,
  Lock,
  Unlock,
  Trash2,
  Users,
  Maximize2,
} from 'lucide-react';

const ActionButton = ({ icon: Icon, label, onClick, variant = 'default' }) => {
  const variants = {
    default: 'bg-[var(--color-text-5)] hover:bg-[var(--color-text-10)] text-body border border-soft',
    danger: 'bg-[var(--color-danger-10)] hover:bg-[var(--color-danger-15)] text-danger border border-[color:var(--color-danger-30)]',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200
        flex items-center gap-2
        ${variants[variant]}
      `}
    >
      <Icon size={14} />
      {label}
    </motion.button>
  );
};

const GuestItem = ({ guest, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    className="flex items-center justify-between py-2 px-3 rounded-lg
               bg-[var(--color-text-5)] hover:bg-[var(--color-text-10)] transition-colors group"
  >
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-medium">
        {guest.name?.charAt(0)?.toUpperCase() || 'I'}
      </div>
      <span className="text-sm text-body">
        {guest.name || 'Invitado sin nombre'}
      </span>
    </div>
    
    <button
      onClick={onRemove}
      className="opacity-0 group-hover:opacity-100 transition-opacity
                 text-danger hover:opacity-80"
    >
      <Trash2 size={14} />
    </button>
  </motion.div>
);

export default function SeatingInspectorFloating({
  table,
  onClose,
  onDuplicate,
  onRotate,
  onToggleLock,
  onDelete,
  onRemoveGuest,
  onCapacityChange,
}) {
  if (!table) return null;

  const [capacity, setCapacity] = useState(table.capacity || 8);
  const assignedGuests = table.assignedGuests || [];
  const percentage = Math.round((assignedGuests.length / capacity) * 100);

  const handleCapacityChange = (newCapacity) => {
    setCapacity(newCapacity);
    onCapacityChange?.(table.id, newCapacity);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 right-6 w-80 max-h-[70vh] overflow-hidden
                   bg-[var(--color-surface-80)]
                   border border-[color:var(--color-border-60)] rounded-2xl shadow-2xl
                   flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--color-border-60)]">
          <div>
            <h3 className="text-body font-semibold flex items-center gap-2">
              {table.shape === 'circle' ? '⭕' : '⬜'} Mesa {table.number || table.id}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {table.shape === 'circle' ? 'Redonda' : 'Rectangular'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="text-muted hover:text-body transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Capacidad */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted font-medium">
                Capacidad
              </label>
              <span className="text-sm font-semibold text-body">
                {assignedGuests.length}/{capacity}
              </span>
            </div>
            
            {/* Slider visual */}
            <div className="space-y-2">
              <input
                type="range"
                min="2"
                max="20"
                value={capacity}
                onChange={(e) => handleCapacityChange(parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--color-text-10)] rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-[var(--color-primary)]
                           [&::-webkit-slider-thumb]:cursor-pointer"
              />
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-[var(--color-text-10)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className={`h-full ${
                    percentage === 100 ? 'bg-[var(--color-success)]' :
                    percentage >= 70 ? 'bg-[var(--color-primary)]' :
                    percentage >= 40 ? 'bg-[var(--color-warning)]' :
                    'bg-[var(--color-danger)]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Invitados asignados */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted font-medium flex items-center gap-1">
                <Users size={14} />
                Invitados asignados
              </label>
              <span className={`text-xs px-2 py-0.5 rounded ${
                percentage === 100 ? 'bg-[var(--color-success-20)] text-success' :
                percentage >= 70 ? 'bg-[var(--color-primary-20)] text-primary' :
                'bg-[var(--color-warning-20)] text-warning'
              }`}>
                {percentage}%
              </span>
            </div>
            
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {assignedGuests.length > 0 ? (
                  assignedGuests.map((guest) => (
                    <GuestItem
                      key={guest.id}
                      guest={guest}
                      onRemove={() => onRemoveGuest?.(table.id, guest.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted text-sm">
                    Sin invitados asignados
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Alertas */}
          {assignedGuests.length > capacity && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--color-warning-10)] border border-[color:var(--color-warning-30)] rounded-lg p-3"
            >
              <p className="text-xs text-warning">
                ⚠️ Mesa sobrepasada: {assignedGuests.length - capacity} invitados extra
              </p>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-[color:var(--color-border-60)] p-4">
          <p className="text-xs text-muted mb-3">Acciones rápidas</p>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              icon={Copy}
              label="Duplicar"
              onClick={() => onDuplicate?.(table.id)}
            />
            <ActionButton
              icon={RotateCw}
              label="Rotar"
              onClick={() => onRotate?.(table.id)}
            />
            <ActionButton
              icon={table.locked ? Unlock : Lock}
              label={table.locked ? 'Desbloquear' : 'Bloquear'}
              onClick={() => onToggleLock?.(table.id)}
            />
            <ActionButton
              icon={Trash2}
              label="Eliminar"
              variant="danger"
              onClick={() => {
                if (confirm('¿Eliminar esta mesa?')) {
                  onDelete?.(table.id);
                  onClose();
                }
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
