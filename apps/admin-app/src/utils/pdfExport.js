import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export a DOM element to PDF at 300 dpi with bleed.
 * @param {HTMLElement} el - Element to capture
 * @param {number} bleedMm - Bleed margin in millimeters (default 3)
 */
export async function exportElementToPdf(el, bleedMm = 3) {
  if (!el) throw new Error('Elemento no encontrado');

  // Capture element at high resolution
  const canvas = await html2canvas(el, {
    scale: 3, // ~288 dpi when monitor 96 dpi
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');

  // Calculate dimensions in mm (A5 target 148x210 mm with bleed)
  const pxPerMm = (canvas.width / (el.offsetWidth || 1)) * (96 / 25.4);
  const widthMm = canvas.width / pxPerMm + bleedMm * 2;
  const heightMm = canvas.height / pxPerMm + bleedMm * 2;

  const pdf = new jsPDF({ unit: 'mm', format: [widthMm, heightMm] });
  pdf.addImage(imgData, 'PNG', bleedMm, bleedMm, widthMm - bleedMm * 2, heightMm - bleedMm * 2);
  pdf.save('invitacion.pdf');
}
