/**
 * Servicio para generar documentos para DJ
 * Incluye TODAS las canciones: Spotify + Especiales/Custom
 */

import jsPDF from 'jspdf';

/**
 * Generar PDF completo para el DJ con todas las canciones
 * Incluye canciones de Spotify Y canciones especiales con instrucciones
 * 
 * @param {Object} params
 * @param {Array} params.blocks - Bloques de momentos
 * @param {Object} params.moments - Momentos por bloque
 * @param {Function} params.getSelectedSong - Función para obtener canción
 * @param {Object} params.weddingInfo - Información de la boda
 * @returns {Promise<void>}
 */
export async function generateDJDocument({
  blocks,
  moments,
  getSelectedSong,
  weddingInfo = {},
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Configuración de estilos
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // --- PORTADA ---
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PLAYLIST PARA DJ', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  if (weddingInfo.coupleName) {
    doc.text(`Boda de ${weddingInfo.coupleName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }
  
  if (weddingInfo.weddingDate) {
    doc.text(formatDate(weddingInfo.weddingDate), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  // Estadísticas globales
  const stats = calculateStats(blocks, moments, getSelectedSong);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de canciones: ${stats.total}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text(`Disponibles en Spotify: ${stats.spotify} | Especiales/Custom: ${stats.special}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text(`Duración estimada: ${formatDuration(stats.totalDuration)}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  // Nota importante si hay canciones especiales
  if (stats.special > 0) {
    doc.setFillColor(255, 243, 205);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠️ ATENCIÓN: Canciones Especiales', margin + 5, yPosition + 5);
    
    doc.setFont('helvetica', 'normal');
    const warningText = `Este documento incluye ${stats.special} canción${stats.special > 1 ? 'es' : ''} especial${stats.special > 1 ? 'es' : ''} (remixes, edits, versiones custom) que NO están en Spotify. Por favor, revisa las instrucciones detalladas para cada una.`;
    const splitText = doc.splitTextToSize(warningText, pageWidth - 2 * margin - 10);
    doc.text(splitText, margin + 5, yPosition + 10);
    yPosition += 25;
  }

  // --- DETALLE POR BLOQUE ---
  doc.addPage();
  yPosition = margin;

  blocks.forEach((block, blockIndex) => {
    const blockMoments = (moments[block.id] || []).filter((m) => getSelectedSong(m));
    
    if (blockMoments.length === 0) return;

    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Título del bloque
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(block.name.toUpperCase(), margin + 3, yPosition + 7);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 15;

    // Tabla de canciones
    blockMoments.forEach((moment, index) => {
      const song = getSelectedSong(moment);
      if (!song) return;

      // Verificar espacio para nueva entrada
      const entryHeight = song.isSpecial ? 35 : 20;
      if (yPosition + entryHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Número y timing
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, margin, yPosition);
      
      if (moment.time) {
        doc.text(`[${moment.time}]`, margin + 8, yPosition);
      }

      // Título del momento
      doc.setFont('helvetica', 'normal');
      doc.text(moment.title, margin + 25, yPosition);
      yPosition += 5;

      // Información de la canción
      doc.setFont('helvetica', 'bold');
      if (song.isSpecial) {
        doc.setTextColor(220, 38, 38);
        doc.text('🎵 ESPECIAL', margin + 8, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 5;
      }

      doc.setFontSize(9);
      doc.text(`"${song.title}"`, margin + 8, yPosition);
      yPosition += 4;
      
      doc.setFont('helvetica', 'normal');
      if (song.artist) {
        doc.text(`por ${song.artist}`, margin + 8, yPosition);
        yPosition += 4;
      }

      // Si es canción especial, mostrar detalles
      if (song.isSpecial) {
        doc.setFillColor(254, 242, 242);
        const boxHeight = 15;
        doc.rect(margin + 8, yPosition, pageWidth - 2 * margin - 8, boxHeight, 'F');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        
        let specialY = yPosition + 4;
        
        if (song.specialType) {
          doc.text(`Tipo: ${formatSpecialType(song.specialType)}`, margin + 10, specialY);
          specialY += 4;
        }
        
        if (song.djInstructions) {
          doc.setFont('helvetica', 'normal');
          const instructions = doc.splitTextToSize(
            `Instrucciones: ${song.djInstructions}`,
            pageWidth - 2 * margin - 20
          );
          doc.text(instructions, margin + 10, specialY);
          specialY += 4 * instructions.length;
        }
        
        if (song.referenceUrl) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Referencia: ${song.referenceUrl}`, margin + 10, specialY);
          specialY += 4;
        }
        
        if (song.audioFile && song.audioFile.downloadURL) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 197, 94);
          doc.text('\u2705 Archivo de audio disponible para descarga', margin + 10, specialY);
          doc.setTextColor(0, 0, 0);
          specialY += 4;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.textWithLink('Descargar archivo', margin + 10, specialY, { url: song.audioFile.downloadURL });
          specialY += 4;
        }
        
        yPosition += boxHeight + 2;
      }

      // Link de Spotify si existe
      if (song.trackUrl && song.trackUrl.includes('spotify.com')) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.textWithLink('Ver en Spotify', margin + 8, yPosition, { url: song.trackUrl });
        doc.setTextColor(0, 0, 0);
        yPosition += 4;
      }

      // Definitiva
      if (moment.isDefinitive) {
        doc.setFontSize(7);
        doc.setTextColor(34, 197, 94);
        doc.text('✓ DEFINITIVA', pageWidth - margin - 20, yPosition);
        doc.setTextColor(0, 0, 0);
      }

      yPosition += 6;
    });

    yPosition += 5;
  });

  // --- PÁGINA DE INSTRUCCIONES GENERALES ---
  doc.addPage();
  yPosition = margin;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUCCIONES PARA EL DJ', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const instructions = [
    'CANCIONES DE SPOTIFY:',
    '• Todas las canciones marcadas con link de Spotify están disponibles en la plataforma',
    '• Se recomienda crear una playlist en Spotify con estas canciones para facilitar la reproducción',
    '',
    'CANCIONES ESPECIALES (marcadas en rojo):',
    '• Estas canciones requieren atención especial (remixes, edits, versiones custom)',
    '• Revisa las instrucciones específicas de cada una',
    '• Si hay URL de referencia, escucha la versión exacta que los novios quieren',
    '• Si hay archivo de audio disponible (✅), descárgalo haciendo click en el enlace',
    '• Prepara estas canciones con anticipación',
    '',
    'TIMING:',
    '• Los horarios indicados son aproximados y pueden variar según el desarrollo del evento',
    '• Coordina con el maestro de ceremonias para ajustar los tiempos',
    '',
    'CANCIONES MARCADAS COMO "DEFINITIVA":',
    '• Son las elecciones finales confirmadas por los novios',
    '• No sustituir sin autorización previa',
    '',
    'CONTACTO:',
    weddingInfo.contact ? `• ${weddingInfo.contact}` : '• Contacta con los novios para cualquier duda',
  ];

  instructions.forEach((line) => {
    if (line === '') {
      yPosition += 3;
    } else if (line.endsWith(':')) {
      doc.setFont('helvetica', 'bold');
      doc.text(line, margin, yPosition);
      yPosition += 6;
    } else {
      doc.setFont('helvetica', 'normal');
      const splitLine = doc.splitTextToSize(line, pageWidth - 2 * margin);
      doc.text(splitLine, margin, yPosition);
      yPosition += 5 * splitLine.length;
    }
  });

  // Footer en todas las páginas
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generado con MaLoveApp - Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Guardar PDF
  const fileName = `DJ-Playlist-${weddingInfo.coupleName || 'Boda'}.pdf`
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
  
  doc.save(fileName);
}

/**
 * Calcular estadísticas globales
 */
function calculateStats(blocks, moments, getSelectedSong) {
  let total = 0;
  let spotify = 0;
  let special = 0;
  let totalDuration = 0;

  blocks.forEach((block) => {
    const blockMoments = moments[block.id] || [];
    blockMoments.forEach((moment) => {
      const song = getSelectedSong(moment);
      if (song) {
        total++;
        if (song.isSpecial) {
          special++;
        } else if (song.trackUrl) {
          spotify++;
        }
        totalDuration += song.duration || 180; // Default 3 min
      }
    });
  });

  return { total, spotify, special, totalDuration };
}

/**
 * Formatear duración en horas y minutos
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

/**
 * Formatear tipo de canción especial
 */
function formatSpecialType(type) {
  const types = {
    remix: 'Remix',
    edit: 'Edit',
    mashup: 'Mashup',
    live: 'Versión en vivo',
    version_especial: 'Versión especial',
    custom: 'Custom',
  };
  return types[type] || type;
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generar documento simplificado (solo lista)
 */
export function generateSimpleList(blocks, moments, getSelectedSong) {
  let text = '=== PLAYLIST BODA ===\n\n';
  
  blocks.forEach((block) => {
    const blockMoments = (moments[block.id] || []).filter((m) => getSelectedSong(m));
    if (blockMoments.length === 0) return;
    
    text += `\n${block.name.toUpperCase()}\n`;
    text += '='.repeat(block.name.length) + '\n\n';
    
    blockMoments.forEach((moment, index) => {
      const song = getSelectedSong(moment);
      if (!song) return;
      
      text += `${index + 1}. `;
      if (moment.time) text += `[${moment.time}] `;
      text += `${moment.title}\n`;
      text += `   "${song.title}" - ${song.artist}\n`;
      
      if (song.isSpecial) {
        text += `   ⚠️ ESPECIAL (${formatSpecialType(song.specialType)})\n`;
        if (song.djInstructions) {
          text += `   Instrucciones: ${song.djInstructions}\n`;
        }
      }
      
      if (song.trackUrl) {
        text += `   ${song.trackUrl}\n`;
      }
      text += '\n';
    });
  });
  
  // Descargar como archivo de texto
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'playlist-boda.txt';
  link.click();
  URL.revokeObjectURL(url);
}
