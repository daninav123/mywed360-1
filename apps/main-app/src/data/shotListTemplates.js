/**
 * Shot List Templates - Lista de fotos esenciales para bodas
 * FASE 3.1.5 del WORKFLOW-USUARIO.md
 */

export const SHOT_CATEGORIES = {
  PREPARATIVOS: 'preparativos',
  CEREMONIA: 'ceremonia',
  PAREJA: 'pareja',
  FAMILIA: 'familia',
  GRUPOS: 'grupos',
  DETALLES: 'detalles',
  FIESTA: 'fiesta',
  ESPONTANEAS: 'espontaneas',
};

export const SHOT_LIST_TEMPLATE = {
  preparativos: {
    name: 'Preparativos',
    description: 'Momentos previos a la ceremonia',
    icon: '💄',
    color: 'pink',
    shots: [
      { id: 'prep-1', name: 'Vestido colgado', priority: 'alta', location: 'Habitación novia' },
      { id: 'prep-2', name: 'Detalles del vestido (bordados, botones)', priority: 'alta' },
      { id: 'prep-3', name: 'Zapatos de la novia', priority: 'media' },
      { id: 'prep-4', name: 'Accesorios (velo, tocado, joyas)', priority: 'alta' },
      { id: 'prep-5', name: 'Ramo de novia', priority: 'alta' },
      { id: 'prep-6', name: 'Maquillaje y peinado en proceso', priority: 'media' },
      { id: 'prep-7', name: 'Novia vistiéndose (ayudada por madre/hermana)', priority: 'alta' },
      { id: 'prep-8', name: 'Última mirada al espejo', priority: 'alta' },
      { id: 'prep-9', name: 'Traje del novio colgado', priority: 'media' },
      { id: 'prep-10', name: 'Detalles del traje (corbata, gemelos, reloj)', priority: 'media' },
      { id: 'prep-11', name: 'Novio vistiéndose (ayudado por padrinos)', priority: 'media' },
      { id: 'prep-12', name: 'Momento padre-hijo o madre-hijo', priority: 'alta' },
      { id: 'prep-13', name: 'Grupo de padrinos/damas preparándose', priority: 'baja' },
      { id: 'prep-14', name: 'Brindis pre-ceremonia', priority: 'baja' },
    ],
  },

  ceremonia: {
    name: 'Ceremonia',
    description: 'El momento más importante',
    icon: '💒',
    color: 'purple',
    shots: [
      { id: 'cer-1', name: 'Invitados llegando', priority: 'baja', location: 'Entrada ceremonia' },
      { id: 'cer-2', name: 'Decoración del lugar', priority: 'media' },
      { id: 'cer-3', name: 'Novio esperando (nervioso)', priority: 'alta' },
      { id: 'cer-4', name: 'Entrada de padrinos/damas', priority: 'media' },
      { id: 'cer-5', name: 'Primera mirada del novio a la novia', priority: 'alta' },
      { id: 'cer-6', name: 'Entrada de la novia (con padre/madre)', priority: 'alta' },
      { id: 'cer-7', name: 'Padre entregando a la novia', priority: 'alta' },
      { id: 'cer-8', name: 'Novios en el altar (vista frontal)', priority: 'alta' },
      { id: 'cer-9', name: 'Novios en el altar (desde atrás viendo invitados)', priority: 'media' },
      { id: 'cer-10', name: 'Intercambio de votos', priority: 'alta' },
      { id: 'cer-11', name: 'Intercambio de anillos (close-up)', priority: 'alta' },
      { id: 'cer-12', name: 'Primer beso como esposos', priority: 'alta' },
      { id: 'cer-13', name: 'Aplausos de los invitados', priority: 'media' },
      { id: 'cer-14', name: 'Salida de novios (con pétalos/arroz)', priority: 'alta' },
      { id: 'cer-15', name: 'Firma de documentos', priority: 'media' },
      { id: 'cer-16', name: 'Reacciones emocionales (lágrimas)', priority: 'alta' },
    ],
  },

  pareja: {
    name: 'Pareja',
    description: 'Fotos románticas de los novios',
    icon: '💑',
    color: 'red',
    shots: [
      { id: 'par-1', name: 'Retrato de ambos (formal)', priority: 'alta', location: 'Locación elegida' },
      { id: 'par-2', name: 'Retrato casual/divertido', priority: 'media' },
      { id: 'par-3', name: 'Caminando de la mano', priority: 'alta' },
      { id: 'par-4', name: 'Besándose (silueta)', priority: 'alta' },
      { id: 'par-5', name: 'Besándose (close-up)', priority: 'alta' },
      { id: 'par-6', name: 'Abrazados (ella de espaldas)', priority: 'media' },
      { id: 'par-7', name: 'Frente a frente mirándose', priority: 'alta' },
      { id: 'par-8', name: 'Manos entrelazadas (mostrando anillos)', priority: 'alta' },
      { id: 'par-9', name: 'Él levantándola en brazos', priority: 'baja' },
      { id: 'par-10', name: 'Bajo el velo', priority: 'alta' },
      { id: 'par-11', name: 'Con el ramo', priority: 'media' },
      { id: 'par-12', name: 'Atardecer/golden hour', priority: 'alta' },
      { id: 'par-13', name: 'Reflejos creativos (espejo, agua)', priority: 'baja' },
      { id: 'par-14', name: 'Con la locación de fondo', priority: 'media' },
      { id: 'par-15', name: 'Momento íntimo/susurrando', priority: 'alta' },
    ],
  },

  familia: {
    name: 'Familia',
    description: 'Fotos con seres queridos',
    icon: '👨‍👩‍👧‍👦',
    color: 'blue',
    shots: [
      { id: 'fam-1', name: 'Novia con padre', priority: 'alta', location: 'Variable' },
      { id: 'fam-2', name: 'Novia con madre', priority: 'alta' },
      { id: 'fam-3', name: 'Novia con ambos padres', priority: 'alta' },
      { id: 'fam-4', name: 'Novio con padre', priority: 'alta' },
      { id: 'fam-5', name: 'Novio con madre', priority: 'alta' },
      { id: 'fam-6', name: 'Novio con ambos padres', priority: 'alta' },
      { id: 'fam-7', name: 'Novios con familia de la novia', priority: 'alta' },
      { id: 'fam-8', name: 'Novios con familia del novio', priority: 'alta' },
      { id: 'fam-9', name: 'Foto familiar completa (ambas familias)', priority: 'alta' },
      { id: 'fam-10', name: 'Novia con hermanos', priority: 'media' },
      { id: 'fam-11', name: 'Novio con hermanos', priority: 'media' },
      { id: 'fam-12', name: 'Novia con abuelos', priority: 'alta' },
      { id: 'fam-13', name: 'Novio con abuelos', priority: 'alta' },
      { id: 'fam-14', name: 'Con sobrinos/niños', priority: 'media' },
      { id: 'fam-15', name: 'Generaciones (3-4 generaciones)', priority: 'media' },
    ],
  },

  grupos: {
    name: 'Grupos',
    description: 'Fotos con amigos y padrinos',
    icon: '👥',
    color: 'green',
    shots: [
      { id: 'gru-1', name: 'Novios con todos los padrinos/damas', priority: 'alta', location: 'Variable' },
      { id: 'gru-2', name: 'Solo padrinos/damas', priority: 'media' },
      { id: 'gru-3', name: 'Novia con sus damas', priority: 'alta' },
      { id: 'gru-4', name: 'Novio con sus padrinos', priority: 'alta' },
      { id: 'gru-5', name: 'Foto divertida/creativa del grupo', priority: 'baja' },
      { id: 'gru-6', name: 'Novios con mejores amigos', priority: 'media' },
      { id: 'gru-7', name: 'Foto con testigos', priority: 'media' },
      { id: 'gru-8', name: 'Grupo completo de invitados', priority: 'media' },
      { id: 'gru-9', name: 'Compañeros de trabajo (si aplica)', priority: 'baja' },
      { id: 'gru-10', name: 'Amigos de la infancia', priority: 'baja' },
    ],
  },

  detalles: {
    name: 'Detalles',
    description: 'Los pequeños elementos que hacen especial el día',
    icon: '💎',
    color: 'yellow',
    shots: [
      { id: 'det-1', name: 'Anillos (primer plano)', priority: 'alta', location: 'Variable' },
      { id: 'det-2', name: 'Invitaciones y papelería', priority: 'media' },
      { id: 'det-3', name: 'Centros de mesa', priority: 'media' },
      { id: 'det-4', name: 'Decoración del banquete', priority: 'media' },
      { id: 'det-5', name: 'Mesa de novios', priority: 'alta' },
      { id: 'det-6', name: 'Pastel de bodas (completo)', priority: 'alta' },
      { id: 'det-7', name: 'Detalles del pastel', priority: 'media' },
      { id: 'det-8', name: 'Mesa de postres/candy bar', priority: 'baja' },
      { id: 'det-9', name: 'Libro de firmas', priority: 'baja' },
      { id: 'det-10', name: 'Recuerdos para invitados', priority: 'baja' },
      { id: 'det-11', name: 'Carteles/señalización', priority: 'baja' },
      { id: 'det-12', name: 'Arreglos florales', priority: 'media' },
      { id: 'det-13', name: 'Menú/seating plan', priority: 'baja' },
      { id: 'det-14', name: 'Velas/iluminación', priority: 'baja' },
    ],
  },

  fiesta: {
    name: 'Fiesta',
    description: 'La celebración y el baile',
    icon: '🎉',
    color: 'orange',
    shots: [
      { id: 'fie-1', name: 'Entrada de novios al banquete', priority: 'alta', location: 'Salón' },
      { id: 'fie-2', name: 'Primer baile', priority: 'alta' },
      { id: 'fie-3', name: 'Baile padre-hija', priority: 'alta' },
      { id: 'fie-4', name: 'Baile madre-hijo', priority: 'alta' },
      { id: 'fie-5', name: 'Brindis (levantando copas)', priority: 'alta' },
      { id: 'fie-6', name: 'Discursos (padrinos, padres)', priority: 'media' },
      { id: 'fie-7', name: 'Corte del pastel', priority: 'alta' },
      { id: 'fie-8', name: 'Novios dándose pastel', priority: 'media' },
      { id: 'fie-9', name: 'Lanzamiento del ramo', priority: 'alta' },
      { id: 'fie-10', name: 'Lanzamiento de la liga', priority: 'media' },
      { id: 'fie-11', name: 'Pista de baile llena', priority: 'media' },
      { id: 'fie-12', name: 'Momentos divertidos bailando', priority: 'baja' },
      { id: 'fie-13', name: 'Niños bailando/jugando', priority: 'baja' },
      { id: 'fie-14', name: 'Salida de novios (sparklers/bengalas)', priority: 'alta' },
      { id: 'fie-15', name: 'Última foto de la noche', priority: 'alta' },
    ],
  },

  espontaneas: {
    name: 'Espontáneas',
    description: 'Momentos naturales sin posar',
    icon: '📸',
    color: 'gray',
    shots: [
      { id: 'esp-1', name: 'Risas genuinas', priority: 'media', location: 'Durante todo el evento' },
      { id: 'esp-2', name: 'Lágrimas de emoción', priority: 'alta' },
      { id: 'esp-3', name: 'Abrazos espontáneos', priority: 'media' },
      { id: 'esp-4', name: 'Momentos entre invitados', priority: 'baja' },
      { id: 'esp-5', name: 'Reacciones de sorpresa', priority: 'media' },
      { id: 'esp-6', name: 'Miradas cómplices de la pareja', priority: 'alta' },
      { id: 'esp-7', name: 'Momentos con niños', priority: 'media' },
      { id: 'esp-8', name: 'Detrás de cámaras', priority: 'baja' },
      { id: 'esp-9', name: 'Ambiente general del evento', priority: 'media' },
      { id: 'esp-10', name: 'Momentos inesperados/divertidos', priority: 'baja' },
    ],
  },
};

export const PRIORITY_LABELS = {
  alta: { label: 'Alta', color: 'red', weight: 3 },
  media: { label: 'Media', color: 'yellow', weight: 2 },
  baja: { label: 'Baja', color: 'gray', weight: 1 },
};

export const getTotalShots = () => {
  return Object.values(SHOT_LIST_TEMPLATE).reduce(
    (total, category) => total + category.shots.length,
    0
  );
};

export const getShotsByPriority = (priority) => {
  const shots = [];
  Object.entries(SHOT_LIST_TEMPLATE).forEach(([categoryId, category]) => {
    category.shots.forEach((shot) => {
      if (shot.priority === priority) {
        shots.push({
          ...shot,
          categoryId,
          categoryName: category.name,
          categoryIcon: category.icon,
        });
      }
    });
  });
  return shots;
};

export default {
  SHOT_CATEGORIES,
  SHOT_LIST_TEMPLATE,
  PRIORITY_LABELS,
  getTotalShots,
  getShotsByPriority,
};
