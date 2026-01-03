/**
 * Panel lateral de propiedades para edición rápida de mesas
 * Aparece al seleccionar una o varias mesas
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Copy,
  Trash2,
  RotateCw,
  Users,
  MapPin,
  Settings,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SeatingPropertiesSidebar({
  selectedTable = null,
  selectedIds = [],
  tables = [],
  guests = [],
  onUpdateTable,
  onDeleteTable,
  onDuplicateTable,
  onToggleLock,
  onClose,
  onAssignGuest,
  onRemoveGuest,
}) {
  const isMultiple = selectedIds.length > 1;
  const isSingle = selectedTable && !isMultiple;

  // Estado local para edición
  const [localName, setLocalName] = useState('');
  const [localCapacity, setLocalCapacity] = useState(8);
  const [localX, setLocalX] = useState(0);
  const [localY, setLocalY] = useState(0);
  const [localRotation, setLocalRotation] = useState(0);

  // Sincronizar con props
  useEffect(() => {
    if (selectedTable) {
      setLocalName(selectedTable.name || '');
      setLocalCapacity(selectedTable.seats || 8);
      setLocalX(Math.round(selectedTable.x || 0));
      setLocalY(Math.round(selectedTable.y || 0));
      setLocalRotation(Math.round(selectedTable.rotation || 0));
    }
  }, [selectedTable]);

  // Invitados asignados a esta mesa
  const assignedGuests = isSingle
    ? guests.filter((g) => String(g.tableId || g.table) === String(selectedTable.id))
    : [];

  const handleUpdate = (field, value) => {
    if (!selectedTable) return;
    onUpdateTable?.(selectedTable.id, { [field]: value });
  };

  const handleDelete = () => {
    if (window.confirm('¿Eliminar esta mesa?')) {
      onDeleteTable?.(selectedTable.id);
      onClose?.();
    }
  };

  const handleDeleteMultiple = () => {
    if (window.confirm(`¿Eliminar ${selectedIds.length} mesas?`)) {
      selectedIds.forEach((id) => onDeleteTable?.(id));
      onClose?.();
    }
  };

  if (!isSingle && !isMultiple) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-40 overflow-y-auto border-l border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isSingle && (
              <>
                <Settings className="inline w-5 h-5 mr-2" />
                {selectedTable.name || `Mesa ${selectedTable.id}`}
              </>
            )}
            {isMultiple && (
              <>
                <Users className="inline w-5 h-5 mr-2" />
                {selectedIds.length} mesas seleccionadas
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* SINGLE SELECTION */}
          {isSingle && (
            <>
              {/* Nombre */}
              <Section title="Identificación">
                <Label>Nombre de la mesa</Label>
                <Input
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={() => handleUpdate('name', localName)}
                  placeholder={`Mesa ${selectedTable.id}`}
                />
              </Section>

              {/* Capacidad */}
              <Section title="Capacidad">
                <Label>
                  Asientos: {localCapacity}
                  <span className="ml-2 text-xs text-gray-500">
                    ({assignedGuests.length} ocupados)
                  </span>
                </Label>
                <Slider
                  value={localCapacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setLocalCapacity(val);
                    handleUpdate('seats', val);
                  }}
                  min={2}
                  max={20}
                  step={1}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2</span>
                  <span>20</span>
                </div>
              </Section>

              {/* Tipo de mesa */}
              <Section title="Tipo de mesa">
                <div className="grid grid-cols-3 gap-2">
                  <TableTypeButton
                    active={selectedTable.shape === 'circle'}
                    onClick={() => handleUpdate('shape', 'circle')}
                    icon="🔴"
                    label="Redonda"
                  />
                  <TableTypeButton
                    active={selectedTable.shape === 'rectangle'}
                    onClick={() => handleUpdate('shape', 'rectangle')}
                    icon="⬜"
                    label="Rectangular"
                  />
                  <TableTypeButton
                    active={selectedTable.shape === 'square'}
                    onClick={() => handleUpdate('shape', 'square')}
                    icon="🟦"
                    label="Cuadrada"
                  />
                </div>
              </Section>

              {/* Mesa Presidencial */}
              <Section title="Especial">
                <label
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                  style={{
                    borderColor: selectedTable.isPresidential ? '#fbbf24' : '#e5e7eb',
                    backgroundColor: selectedTable.isPresidential ? '#fef3c7' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTable.isPresidential || false}
                    onChange={(e) => handleUpdate('isPresidential', e.target.checked)}
                    className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
                  />
                  <Crown
                    size={20}
                    color={selectedTable.isPresidential ? '#fbbf24' : '#9ca3af'}
                    fill={selectedTable.isPresidential ? '#fef3c7' : 'none'}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      Mesa Presidencial
                    </div>
                    <div className="text-xs text-gray-500">
                      Marca visual especial con corona dorada
                    </div>
                  </div>
                </label>
              </Section>

              {/* Posición */}
              <Section title="Posición y rotación">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>X (cm)</Label>
                    <NumberInput
                      value={localX}
                      onChange={(val) => {
                        setLocalX(val);
                        handleUpdate('x', val);
                      }}
                      step={10}
                    />
                  </div>
                  <div>
                    <Label>Y (cm)</Label>
                    <NumberInput
                      value={localY}
                      onChange={(val) => {
                        setLocalY(val);
                        handleUpdate('y', val);
                      }}
                      step={10}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Rotación: {localRotation}°</Label>
                  <Slider
                    value={localRotation}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setLocalRotation(val);
                      handleUpdate('rotation', val);
                    }}
                    min={0}
                    max={360}
                    step={5}
                  />
                </div>
              </Section>

              {/* Invitados asignados */}
              <Section title={`Invitados (${assignedGuests.length}/${localCapacity})`}>
                {assignedGuests.length === 0 ? (
                  <div className="text-sm text-gray-500 italic py-2">Sin invitados asignados</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {assignedGuests.map((guest) => (
                      <GuestItem
                        key={guest.id}
                        guest={guest}
                        onRemove={() => onRemoveGuest?.(guest.id)}
                      />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => onAssignGuest?.(selectedTable.id)}
                  className="mt-2 w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  + Asignar invitado
                </button>
              </Section>

              {/* Acciones rápidas */}
              <Section title="Acciones">
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton
                    icon={<Copy className="w-4 h-4" />}
                    label="Duplicar"
                    onClick={() => onDuplicateTable?.(selectedTable.id)}
                  />
                  <ActionButton
                    icon={
                      selectedTable.locked ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )
                    }
                    label={selectedTable.locked ? 'Desbloquear' : 'Bloquear'}
                    onClick={() => onToggleLock?.(selectedTable.id)}
                  />
                </div>
                <button
                  onClick={handleDelete}
                  className="mt-2 w-full px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar mesa
                </button>
              </Section>
            </>
          )}

          {/* MULTIPLE SELECTION */}
          {isMultiple && (
            <>
              <Section title="Edición múltiple">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Los cambios se aplicarán a las {selectedIds.length} mesas seleccionadas
                </div>

                <Label>Capacidad (aplicar a todas)</Label>
                <Slider
                  value={8}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    selectedIds.forEach((id) => onUpdateTable?.(id, { seats: val }));
                  }}
                  min={2}
                  max={20}
                  step={1}
                />
              </Section>

              <Section title="Acciones grupales">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // TODO: Implementar alineación
                      console.log('Alinear mesas');
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    📏 Alinear horizontalmente
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implementar distribución
                      console.log('Distribuir mesas');
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    📊 Distribuir uniformemente
                  </button>
                  <button
                    onClick={handleDeleteMultiple}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar {selectedIds.length} mesas
                  </button>
                </div>
              </Section>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Sub-componentes

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
      {children}
    </label>
  );
}

function Input({ value, onChange, onBlur, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
    />
  );
}

function Slider({ value, onChange, min, max, step }) {
  return (
    <input
      type="range"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
    />
  );
}

function NumberInput({ value, onChange, step = 1 }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      step={step}
      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
    />
  );
}

function TableTypeButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-md text-center transition-all ${
        active
          ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
          : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-medium">{label}</div>
    </button>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-2"
    >
      {icon}
      {label}
    </button>
  );
}

function GuestItem({ guest, onRemove }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs font-semibold flex-shrink-0">
          {(guest.name || 'G')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {guest.name || 'Invitado'}
          </div>
          {guest.companion > 0 && (
            <div className="text-xs text-gray-500">+{guest.companion} acompañante(s)</div>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded-md hover:bg-red-100 text-red-600 flex-shrink-0"
        title="Quitar de esta mesa"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
