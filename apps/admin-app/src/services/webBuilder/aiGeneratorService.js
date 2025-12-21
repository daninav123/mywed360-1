import { defaultWebConfig, temas } from '../../schemas/webConfig.schema';

/**
 * Servicio para generar automáticamente webs usando IA y datos del perfil
 */

/**
 * Genera una web completa automáticamente basándose en el perfil del usuario
 *
 * @param {Object} perfil - Datos del perfil del usuario
 * @param {Object} options - Opciones de generación
 * @returns {Promise<Object>} - Configuración completa de la web
 */
export const generarWebAutomatica = async (perfil, options = {}) => {
  try {
    console.log('🤖 Generando web automáticamente...', { perfil, options });

    // 1. Seleccionar tema automáticamente
    const temaSeleccionado = await seleccionarTemaAutomatico(perfil);

    // 2. Extraer datos del perfil
    const datosExtraidos = extraerDatosDelPerfil(perfil);

    // 3. Generar configuración base
    const config = {
      ...defaultWebConfig,
      meta: {
        ...defaultWebConfig.meta,
        id: generateId(),
        titulo: datosExtraidos.titulo,
        slug: generarSlug(datosExtraidos.titulo),
        tema: temaSeleccionado,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      estilos: {
        ...temas[temaSeleccionado],
        tema: temaSeleccionado,
      },
    };

    // 4. Personalizar secciones con datos del perfil
    config.secciones = await personalizarSecciones(config.secciones, datosExtraidos, perfil);

    console.log('✅ Web generada:', config);

    return config;
  } catch (error) {
    console.error('❌ Error generando web automática:', error);
    throw error;
  }
};

/**
 * Selecciona el tema más apropiado basándose en el perfil
 */
const seleccionarTemaAutomatico = async (perfil) => {
  // Lógica simple por ahora - TODO: mejorar con IA
  const estilo = perfil?.weddingStyle?.toLowerCase() || '';
  const ubicacion = perfil?.ceremonyInfo?.lugar?.toLowerCase() || '';

  // Mapeo de estilos a temas
  if (estilo.includes('playa') || ubicacion.includes('playa') || ubicacion.includes('beach')) {
    return 'playero';
  }
  if (estilo.includes('elegant') || estilo.includes('elegante') || estilo.includes('formal')) {
    return 'elegante';
  }
  if (estilo.includes('modern') || estilo.includes('moderno') || estilo.includes('minimal')) {
    return 'moderno';
  }
  if (estilo.includes('vintage') || estilo.includes('retro') || estilo.includes('clasico')) {
    return 'vintage';
  }

  // Por defecto, romántico
  return 'romantico';
};

/**
 * Extrae y formatea datos relevantes del perfil
 */
const extraerDatosDelPerfil = (perfil) => {
  const nombreNovia = perfil?.brideInfo?.nombre || '';
  const nombreNovio = perfil?.groomInfo?.nombre || '';

  // Formatear fecha
  let fechaFormateada = '';
  if (perfil?.ceremonyInfo?.fecha) {
    try {
      const fecha = perfil.ceremonyInfo.fecha;
      if (fecha.seconds) {
        // Timestamp de Firebase
        const date = new Date(fecha.seconds * 1000);
        fechaFormateada = date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } else if (typeof fecha === 'string') {
        const date = new Date(fecha);
        fechaFormateada = date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch (e) {
      fechaFormateada = perfil.ceremonyInfo.fecha;
    }
  }

  return {
    titulo: [nombreNovia, nombreNovio].filter(Boolean).join(' y ') || 'Nuestra Boda',
    nombreNovia,
    nombreNovio,
    fecha: fechaFormateada,
    fechaISO: perfil?.ceremonyInfo?.fecha,
    hora: perfil?.ceremonyInfo?.hora || '',
    lugarCeremonia: perfil?.ceremonyInfo?.lugar || '',
    direccionCeremonia: perfil?.ceremonyInfo?.direccion || '',
    lugarRecepcion: perfil?.receptionInfo?.lugar || '',
    direccionRecepcion: perfil?.receptionInfo?.direccion || '',
    horaRecepcion: perfil?.receptionInfo?.hora || '',
    historia: perfil?.story || perfil?.ourStory || '',
    email: perfil?.contactEmail || '',
    telefono: perfil?.contactPhone || '',
    fotoPortada: perfil?.coverPhoto || null,
  };
};

/**
 * Personaliza las secciones con datos del perfil
 */
const personalizarSecciones = async (secciones, datos, perfil) => {
  return secciones.map((seccion) => {
    switch (seccion.tipo) {
      case 'hero':
        return {
          ...seccion,
          datos: {
            ...seccion.datos,
            titulo: datos.titulo,
            subtitulo: datos.fecha || 'Próximamente',
            imagen: datos.fotoPortada,
            textoBoton: 'Ver más detalles',
            mostrarCountdown: Boolean(datos.fechaISO),
          },
        };

      case 'story':
        return {
          ...seccion,
          datos: {
            ...seccion.datos,
            titulo: 'Nuestra Historia',
            texto: datos.historia || 'Próximamente compartiremos nuestra historia...',
            fotos: perfil?.photos?.slice(0, 3) || [],
            layout: 'texto-izquierda',
          },
        };

      case 'eventInfo':
        return {
          ...seccion,
          datos: {
            ...seccion.datos,
            ceremonia: {
              titulo: 'Ceremonia',
              hora: datos.hora,
              lugar: datos.lugarCeremonia,
              direccion: datos.direccionCeremonia,
            },
            recepcion: {
              titulo: 'Recepción',
              hora: datos.horaRecepcion,
              lugar: datos.lugarRecepcion,
              direccion: datos.direccionRecepcion,
            },
          },
        };

      default:
        return seccion;
    }
  });
};

/**
 * Genera un ID único
 */
const generateId = () => {
  return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Genera un slug SEO-friendly a partir de un texto
 */
const generarSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
    .replace(/^-+|-+$/g, ''); // Quitar guiones al inicio/final
};

/**
 * Genera texto con IA para una sección
 * TODO: Integrar con OpenAI para generación más inteligente
 */
export const generarTextoIA = async (tipo, contexto) => {
  // Por ahora, textos por defecto
  // TODO: Llamar a OpenAI API

  const plantillas = {
    historia: [
      'Nos conocimos hace varios años y desde entonces hemos compartido innumerables momentos especiales juntos.',
      'Nuestra historia comenzó de la manera más inesperada, y hoy no podríamos estar más felices de compartir este día con ustedes.',
      'Después de tantos años juntos, hemos decidido dar este paso tan importante en nuestras vidas.',
    ],
    bienvenida: [
      'Nos llena de alegría poder compartir este día tan especial con ustedes.',
      'Gracias por acompañarnos en este momento tan importante de nuestras vidas.',
      'Su presencia hace de este día algo aún más especial para nosotros.',
    ],
  };

  const opciones = plantillas[tipo] || [''];
  return opciones[Math.floor(Math.random() * opciones.length)];
};
