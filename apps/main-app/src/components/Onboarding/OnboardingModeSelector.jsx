import React from 'react';

/**
 * Modal selector para elegir entre el tutorial clasico y el asistente IA.
 */
export default function OnboardingModeSelector({ onChooseClassic, onChooseAI }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-rose-500">
            Bienvenido
          </span>
          <h2 className="text-2xl font-bold text-gray-900">Como quieres empezar?</h2>
          <p className="text-sm text-gray-600">
            Elige el recorrido que prefieras para configurar tu evento. Puedes volver al otro modo
            en cualquier momento desde la configuracion.
          </p>
        </header>

        <div className="grid gap-4">
          <button
            type="button"
            onClick={onChooseClassic}
            className="w-full border border-gray-200 rounded-lg px-4 py-4 text-left transition hover:border-rose-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">Tutorial guiado clasico</h3>
                <p className="text-sm text-gray-600">
                  Completa los pasos basicos, crea la boda y descubre todas las herramientas
                  principales.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                Con pasos
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onChooseAI}
            className="w-full border border-transparent rounded-lg px-4 py-4 bg-rose-500 text-white text-left transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Crear boda con IA (beta)</h3>
                <p className="text-sm text-rose-50/80">
                  Responde un par de preguntas y generaremos el evento con tareas y recomendaciones
                  iniciales de forma automatica.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                IA
              </span>
            </div>
          </button>
        </div>

        <footer className="text-xs text-center text-gray-500">
          Si necesitas ayuda mas tarde podras relanzar el tutorial desde el menu principal.
        </footer>
      </div>
    </div>
  );
}

