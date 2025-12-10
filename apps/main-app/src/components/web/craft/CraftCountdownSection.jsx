import React, { useState, useEffect, useMemo } from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección de cuenta regresiva para la boda
 */
export const CraftCountdownSection = ({
  titulo = '⏰ Cuenta Regresiva',
  fecha = '',
  mensajeFinal = '¡Hoy es el gran día! 🎉',
  formato = 'completo', // 'completo' (años/meses/días/horas), 'simple' (días/horas), o 'dias' (solo días)
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();

  // Usar fecha de la boda si no se ha proporcionado
  // Si la fecha no tiene hora, añadir las 18:00 por defecto
  const procesarFecha = (f) => {
    if (!f) return '2025-12-31T18:00:00';
    // Si es solo una fecha (YYYY-MM-DD), añadir hora
    if (f.length === 10 && f.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${f}T18:00:00`;
    }
    return f;
  };

  // Calcular fecha final (recalcula cuando weddingData carga)
  const fechaFinal = useMemo(() => {
    const FECHA_DEFECTO = '2025-12-31T18:00:00';

    // SIEMPRE priorizar weddingData si existe
    if (weddingData?.ceremonia?.fecha) {
      return procesarFecha(weddingData.ceremonia.fecha);
    }

    // Si hay prop fecha personalizada (no por defecto), usarla
    if (fecha && fecha !== FECHA_DEFECTO && fecha !== '2025-12-31') {
      return procesarFecha(fecha);
    }

    // Último recurso: fecha por defecto
    return FECHA_DEFECTO;
  }, [weddingData, fecha]);

  const [tiempoRestante, setTiempoRestante] = useState({
    años: 0,
    meses: 0,
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    totalDias: 0, // Agregar total de días para formato simple
    finalizado: false,
  });

  useEffect(() => {
    const calcularTiempo = () => {
      try {
        // Parsear la fecha correctamente
        let fechaBoda;

        if (fechaFinal.includes('T')) {
          // Formato ISO: YYYY-MM-DDTHH:mm:ss
          fechaBoda = new Date(fechaFinal);
        } else {
          // Solo fecha: YYYY-MM-DD - crear a las 18:00 en hora local
          const [year, month, day] = fechaFinal.split('-');
          fechaBoda = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 18, 0, 0);
        }

        const ahora = new Date();

        // Validar que la fecha sea válida
        if (isNaN(fechaBoda.getTime())) {
          console.warn('Fecha inválida:', fechaFinal);
          return;
        }

        const diferencia = fechaBoda.getTime() - ahora.getTime();

        if (diferencia <= 0) {
          setTiempoRestante({
            años: 0,
            meses: 0,
            dias: 0,
            horas: 0,
            minutos: 0,
            segundos: 0,
            totalDias: 0,
            finalizado: true,
          });
          return;
        }

        // Calcular total de días (para formato simple)
        const totalDias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

        // Calcular años, meses, días, horas, minutos, segundos
        let años = 0;
        let meses = 0;
        let dias = 0;

        // Crear una copia de la fecha actual para calcular
        let temp = new Date(ahora);

        // Calcular años
        while (new Date(temp.getFullYear() + 1, temp.getMonth(), temp.getDate()) <= fechaBoda) {
          años++;
          temp.setFullYear(temp.getFullYear() + 1);
        }

        // Calcular meses
        while (new Date(temp.getFullYear(), temp.getMonth() + 1, temp.getDate()) <= fechaBoda) {
          meses++;
          temp.setMonth(temp.getMonth() + 1);
        }

        // Calcular días
        while (new Date(temp.getFullYear(), temp.getMonth(), temp.getDate() + 1) <= fechaBoda) {
          dias++;
          temp.setDate(temp.getDate() + 1);
        }

        // Calcular horas, minutos, segundos del tiempo restante
        const diferenciaMilisegundos = Math.max(0, fechaBoda.getTime() - temp.getTime());
        const horas = Math.max(0, Math.floor(diferenciaMilisegundos / (1000 * 60 * 60)));
        const minutos = Math.max(
          0,
          Math.floor((diferenciaMilisegundos % (1000 * 60 * 60)) / (1000 * 60))
        );
        const segundos = Math.max(0, Math.floor((diferenciaMilisegundos % (1000 * 60)) / 1000));

        setTiempoRestante({
          años,
          meses,
          dias,
          horas,
          minutos,
          segundos,
          totalDias,
          finalizado: false,
        });
      } catch (error) {
        console.error('Error calculando tiempo:', error);
      }
    };

    calcularTiempo();
    const intervalo = setInterval(calcularTiempo, 1000);

    return () => clearInterval(intervalo);
  }, [fechaFinal]);

  const TimeBox = ({ valor, etiqueta }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 min-w-[120px] transform hover:scale-105 transition-transform">
      <div
        className="text-5xl font-bold mb-2"
        style={{
          color: 'var(--color-primario, #9333EA)',
          fontFamily: 'var(--fuente-titulo, inherit)',
        }}
      >
        {String(valor).padStart(2, '0')}
      </div>
      <div
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-texto, #6B7280)' }}
      >
        {etiqueta}
      </div>
    </div>
  );

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className="py-16 px-4"
      style={{
        background:
          'linear-gradient(135deg, var(--color-fondo, #F9FAFB) 0%, var(--color-fondo-secundario, #FDF2F8) 100%)',
        color: 'var(--color-texto, #1F2937)',
      }}
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Título */}
        <h2
          className="text-4xl md:text-5xl font-bold mb-12"
          style={{
            color: 'var(--color-primario, #9333EA)',
            fontFamily: 'var(--fuente-titulo, inherit)',
          }}
        >
          {titulo}
        </h2>

        {!tiempoRestante.finalizado ? (
          <>
            {/* Contador */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {formato === 'completo' ? (
                <>
                  {tiempoRestante.años > 0 && (
                    <TimeBox valor={tiempoRestante.años} etiqueta="Años" />
                  )}
                  {tiempoRestante.meses > 0 && (
                    <TimeBox valor={tiempoRestante.meses} etiqueta="Meses" />
                  )}
                  <TimeBox valor={tiempoRestante.dias} etiqueta="Días" />
                  <TimeBox valor={tiempoRestante.horas} etiqueta="Horas" />
                </>
              ) : formato === 'simple' ? (
                <>
                  <TimeBox valor={tiempoRestante.totalDias} etiqueta="Días" />
                  <TimeBox valor={tiempoRestante.horas} etiqueta="Horas" />
                </>
              ) : formato === 'dias' ? (
                <>
                  <TimeBox valor={tiempoRestante.totalDias} etiqueta="Días" />
                </>
              ) : null}
            </div>

            {/* Mensaje motivacional */}
            <div className="mt-8">
              <p className="text-xl text-gray-600 font-light">
                {tiempoRestante.dias > 30 && '¡Estamos emocionados por celebrar con ustedes! 💕'}
                {tiempoRestante.dias <= 30 &&
                  tiempoRestante.dias > 7 &&
                  '¡Ya casi llega el gran día! 🎊'}
                {tiempoRestante.dias <= 7 &&
                  tiempoRestante.dias > 0 &&
                  '¡La cuenta final ha comenzado! ✨'}
              </p>
            </div>
          </>
        ) : (
          // Mensaje cuando la fecha llegó
          <div className="py-12">
            <div className="text-7xl mb-6">🎉💒✨</div>
            <h3 className="text-4xl font-bold" style={{ color: 'var(--color-primario, #9333EA)' }}>
              {mensajeFinal}
            </h3>
          </div>
        )}
      </div>
    </section>
  );
};

// Settings Panel para Countdown
const CraftCountdownSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={props.titulo || ''}
          onChange={(e) => setProp((props) => (props.titulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Formato de Visualización
        </label>
        <select
          value={props.formato || 'completo'}
          onChange={(e) => setProp((props) => (props.formato = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="completo">Años, Meses, Días, Horas</option>
          <option value="simple">Días y Horas</option>
          <option value="dias">Solo Días</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Mensaje Final</label>
        <input
          type="text"
          value={props.mensajeFinal || ''}
          onChange={(e) => setProp((props) => (props.mensajeFinal = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

CraftCountdownSection.craft = {
  displayName: 'Countdown Section',
  props: {
    titulo: '⏰ Cuenta Regresiva',
    fecha: '',
    mensajeFinal: '¡Hoy es el gran día! 🎉',
    formato: 'completo',
  },
  related: {
    settings: CraftCountdownSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Cuenta Regresiva</h3>
        <p className="text-xs text-gray-600">
          Muestra el tiempo restante hasta el día de la boda con una cuenta regresiva animada.
        </p>
      </div>
    ),
  },
};
