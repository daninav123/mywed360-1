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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Guía Rápida</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
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
                  <span className="text-gray-700">{shortcut.action}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono"
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
                  <div className="flex-shrink-0 text-blue-600">{tip.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                    <p className="text-sm text-gray-600">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
          <p>¿Necesitas más ayuda? <a href="#" className="text-blue-600 hover:underline">Ver documentación completa</a></p>
        </div>
      </div>
    </div>
  );
}
