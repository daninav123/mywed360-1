import React, { useState, useEffect, useMemo } from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';
import { useThemeContext } from '../../../context/ThemeContext';
import { SectionDecorator } from '../decorations';

/**
 * CraftHeroSection - Hero Section adaptado para Craft.js con decoraciones
 */
export const CraftHeroSection = ({
  titulo,
  subtitulo,
  imagen,
  mostrarCountdown,
  formatoCountdown = 'simple',
}) => {
  const weddingData = useWeddingDataContext();
  const { tema } = useThemeContext(); // Obtener tema del contexto
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  // Calcular countdown
  const [countdown, setCountdown] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    años: 0,
    meses: 0,
  });

  const fechaBoda = useMemo(() => {
    if (!weddingData?.ceremonia?.fecha) return null;
    const fecha = weddingData.ceremonia.fecha;
    // Si solo es fecha (YYYY-MM-DD), añadir hora
    if (fecha.length === 10) {
      return new Date(`${fecha}T18:00:00`);
    }
    return new Date(fecha);
  }, [weddingData]);

  useEffect(() => {
    if (!fechaBoda || !mostrarCountdown) return;

    const calcular = () => {
      const ahora = new Date();
      const diferencia = fechaBoda.getTime() - ahora.getTime();

      if (diferencia <= 0) {
        setCountdown({ dias: 0, horas: 0, minutos: 0, años: 0, meses: 0 });
        return;
      }

      // Cálculo simple (días, horas, minutos)
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

      // Cálculo completo (años, meses, días, horas)
      let años = 0;
      let meses = 0;
      let diasRestantes = 0;
      let horasRestantes = 0;

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
        diasRestantes++;
        temp.setDate(temp.getDate() + 1);
      }

      // Calcular horas del tiempo restante
      const diferenciaMilisegundos = Math.max(0, fechaBoda.getTime() - temp.getTime());
      horasRestantes = Math.max(0, Math.floor(diferenciaMilisegundos / (1000 * 60 * 60)));

      setCountdown({
        dias,
        horas,
        minutos,
        años,
        meses,
        diasCompletos: diasRestantes,
        horasCompletas: horasRestantes,
      });
    };

    calcular();
    const intervalo = setInterval(calcular, 60000); // Actualizar cada minuto

    return () => clearInterval(intervalo);
  }, [fechaBoda, mostrarCountdown]);

  // Usar datos de la boda si no se han proporcionado props
  const tituloFinal = titulo || weddingData?.pareja?.nombres || 'Nuestro matrimonio';
  const subtituloFinal =
    subtitulo ||
    (weddingData?.ceremonia?.fecha
      ? new Date(weddingData.ceremonia.fecha).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Una historia de amor');
  const imagenFinal = imagen || weddingData?.heroImage || '';

  return (
    <SectionDecorator tema={tema} showCorners={true} showDividers={true} enableAnimations={true}>
      <div
        ref={(ref) => connect(drag(ref))}
        className={`
          relative min-h-screen flex items-center justify-center
          ${selected ? 'ring-4 ring-blue-500' : ''}
        `}
        style={{
          backgroundImage: imagenFinal ? `url(${imagenFinal})` : 'none',
          backgroundColor: imagenFinal ? 'transparent' : 'var(--color-fondo)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay solo si hay imagen */}
        {imagenFinal && <div className="absolute inset-0 bg-black bg-opacity-20" />}

        {/* Contenido */}
        <div className="relative z-10 text-center px-4">
          <h1
            className="text-6xl md:text-8xl font-bold mb-6"
            style={{
              fontFamily: 'var(--fuente-titulo)',
              color: imagenFinal ? '#ffffff' : 'var(--color-primario)',
            }}
          >
            {tituloFinal}
          </h1>
          <p
            className="text-2xl md:text-4xl mb-12"
            style={{
              fontFamily: 'var(--fuente-texto)',
              color: imagenFinal ? '#ffffff' : 'var(--color-texto)',
            }}
          >
            {subtituloFinal}
          </p>

          {mostrarCountdown && fechaBoda && (
            <div className="bg-white bg-opacity-90 rounded-lg p-6 inline-block">
              <p className="text-gray-600 text-sm mb-2">Faltan:</p>
              <div className="flex gap-4">
                {formatoCountdown === 'completo' ? (
                  <>
                    {countdown.años > 0 && (
                      <div>
                        <p className="text-4xl font-bold text-gray-900">{countdown.años}</p>
                        <p className="text-xs text-gray-600">Años</p>
                      </div>
                    )}
                    {countdown.meses > 0 && (
                      <div>
                        <p className="text-4xl font-bold text-gray-900">{countdown.meses}</p>
                        <p className="text-xs text-gray-600">Meses</p>
                      </div>
                    )}
                    <div>
                      <p className="text-4xl font-bold text-gray-900">{countdown.diasCompletos}</p>
                      <p className="text-xs text-gray-600">Días</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-gray-900">{countdown.horasCompletas}</p>
                      <p className="text-xs text-gray-600">Horas</p>
                    </div>
                  </>
                ) : formatoCountdown === 'simple' ? (
                  <>
                    <div>
                      <p className="text-4xl font-bold text-gray-900">{countdown.dias}</p>
                      <p className="text-xs text-gray-600">Días</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-gray-900">{countdown.horas}</p>
                      <p className="text-xs text-gray-600">Horas</p>
                    </div>
                  </>
                ) : formatoCountdown === 'dias' ? (
                  <div>
                    <p className="text-4xl font-bold text-gray-900">{countdown.dias}</p>
                    <p className="text-xs text-gray-600">Días</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionDecorator>
  );
};

/**
 * Settings para CraftHeroSection
 */
export const CraftHeroSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={props.titulo}
          onChange={(e) => setProp((props) => (props.titulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Subtítulo</label>
        <input
          type="text"
          value={props.subtitulo}
          onChange={(e) => setProp((props) => (props.subtitulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          URL de Imagen de Fondo
        </label>
        <input
          type="url"
          value={props.imagen || ''}
          onChange={(e) => setProp((props) => (props.imagen = e.target.value))}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="mostrarCountdown"
          checked={props.mostrarCountdown}
          onChange={(e) => setProp((props) => (props.mostrarCountdown = e.target.checked))}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="mostrarCountdown" className="ml-2 text-sm font-medium text-gray-700">
          Mostrar Countdown
        </label>
      </div>

      {props.mostrarCountdown && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Formato del Countdown
          </label>
          <select
            value={props.formatoCountdown || 'simple'}
            onChange={(e) => setProp((props) => (props.formatoCountdown = e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="completo">Años, Meses, Días, Horas</option>
            <option value="simple">Días y Horas</option>
            <option value="dias">Solo Días</option>
          </select>
        </div>
      )}
    </div>
  );
};

// Configuración de Craft.js
CraftHeroSection.craft = {
  props: {
    titulo: '',
    subtitulo: '',
    imagen: null,
    mostrarCountdown: true,
    formatoCountdown: 'simple',
  },
  related: {
    settings: CraftHeroSettings,
  },
  displayName: 'Hero Section',
};
