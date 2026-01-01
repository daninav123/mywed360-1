import React, { useState } from 'react';
import { X, Keyboard, Mouse, Zap, Info } from 'lucide-react';

export default function QuickGuide({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('shortcuts');

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Delete', 'Backspace'], action: 'Eliminar elemento seleccionado' },
    { keys: ['Ctrl', 'Z'], action: 'Deshacer' },
    { keys: ['Ctrl', 'Y'], action: 'Rehacer' },
    { keys: ['Ctrl', 'C'], action: 'Copiar' },
    { keys: ['Ctrl', 'V'], action: 'Pegar' },
    { keys: ['Ctrl', 'D'], action: 'Duplicar' },
    { keys: ['Ctrl', 'A'], action: 'Seleccionar todo' },
    { keys: ['←', '→', '↑', '↓'], action: 'Mover elemento (1px)' },
    { keys: ['Shift', '←→↑↓'], action: 'Mover elemento (10px)' },
    { keys: ['Esc'], action: 'Deseleccionar' },
  ];

  const tips = [
    { icon: <Mouse className="w-5 h-5" />, title: 'Arrastra elementos', desc: 'Click y arrastra desde el sidebar al canvas' },
    { icon: <Zap className="w-5 h-5" />, title: 'Doble click en texto', desc: 'Para editar el contenido directamente' },
    { icon: <Keyboard className="w-5 h-5" />, title: 'Panel de propiedades', desc: 'Ajusta color, tamaño, rotación en tiempo real' },
    { icon: <Info className="w-5 h-5" />, title: 'Guardado automático', desc: 'Tu diseño se guarda cada 30 segundos' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className=" rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="p-6 border-b  flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl font-bold">Guía Rápida</h2>
          <button onClick={onClose} className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-text)' }}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b " style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 px-4 py-3 font-medium ${
              activeTab === 'shortcuts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Atajos de Teclado
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex-1 px-4 py-3 font-medium ${
              activeTab === 'tips'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Consejos
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'shortcuts' ? (
            <div className="space-y-3">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="" style={{ color: 'var(--color-text)' }}>{shortcut.action}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-1  border  rounded text-sm font-mono" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 " style={{ color: 'var(--color-primary)' }}>{tip.icon}</div>
                  <div>
                    <h3 className="font-semibold  mb-1" style={{ color: 'var(--color-text)' }}>{tip.title}</h3>
                    <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4  border-t  text-sm  text-center" style={{ borderColor: 'var(--color-border)' }} style={{ color: 'var(--color-text-secondary)' }} style={{ backgroundColor: 'var(--color-bg)' }}>
          <p>¿Necesitas más ayuda? <a href="#" className=" hover:underline" style={{ color: 'var(--color-primary)' }}>Ver documentación completa</a></p>
        </div>
      </div>
    </div>
  );
}
