import { jsPDF } from 'jspdf';

export const exportToPDF = async (canvas, options = {}) => {
  const {
    filename = 'design.pdf',
    format = 'a5',
    orientation = 'portrait',
    quality = 1,
  } = options;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality,
      multiplier: 3,
    });

    const imgWidth = format === 'a5' ? 148 : 210;
    const imgHeight = format === 'a5' ? 210 : 297;

    pdf.addImage(dataURL, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');

    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

export const exportToSVG = (canvas, filename = 'design.svg') => {
  try {
    const svgString = canvas.toSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to SVG:', error);
    return { success: false, error: error.message };
  }
};

export const exportToPNG = (canvas, filename = 'design.png', options = {}) => {
  const { quality = 1, multiplier = 3 } = options;

  try {
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality,
      multiplier,
    });

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to PNG:', error);
    return { success: false, error: error.message };
  }
};

export const exportWithPrintSpecs = async (canvas, options = {}) => {
  const {
    filename = 'design-print-ready.pdf',
    format = 'a5',
    bleed = 3,
    cropMarks = true,
    registrationMarks = true,
  } = options;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format,
    });

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 4,
    });

    const imgWidth = format === 'a5' ? 148 : 210;
    const imgHeight = format === 'a5' ? 210 : 297;
    const markOffset = 5;

    pdf.addImage(dataURL, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');

    if (cropMarks) {
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(0, 0, 0);
      
      // Esquinas superior izquierda
      pdf.line(-markOffset, 0, 0, 0);
      pdf.line(0, -markOffset, 0, 0);
      
      // Esquina superior derecha
      pdf.line(imgWidth, -markOffset, imgWidth, 0);
      pdf.line(imgWidth, 0, imgWidth + markOffset, 0);
      
      // Esquina inferior izquierda
      pdf.line(-markOffset, imgHeight, 0, imgHeight);
      pdf.line(0, imgHeight, 0, imgHeight + markOffset);
      
      // Esquina inferior derecha
      pdf.line(imgWidth, imgHeight, imgWidth + markOffset, imgHeight);
      pdf.line(imgWidth, imgHeight, imgWidth, imgHeight + markOffset);
    }

    if (registrationMarks) {
      pdf.setDrawColor(0, 0, 0);
      const regSize = 3;
      
      // Centro superior
      const topX = imgWidth / 2;
      pdf.circle(topX, -markOffset - 2, regSize / 2, 'S');
      pdf.line(topX - regSize, -markOffset - 2, topX + regSize, -markOffset - 2);
      pdf.line(topX, -markOffset - 2 - regSize, topX, -markOffset - 2 + regSize);
      
      // Centro inferior
      pdf.circle(topX, imgHeight + markOffset + 2, regSize / 2, 'S');
      pdf.line(topX - regSize, imgHeight + markOffset + 2, topX + regSize, imgHeight + markOffset + 2);
      pdf.line(topX, imgHeight + markOffset + 2 - regSize, topX, imgHeight + markOffset + 2 + regSize);
    }

    // Información de impresión
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`300 DPI | ${format.toUpperCase()} | Sangrado: ${bleed}mm`, imgWidth / 2, imgHeight + 12, { align: 'center' });
    pdf.text(`MaLoveApp | ${new Date().toLocaleDateString()}`, imgWidth / 2, imgHeight + 15, { align: 'center' });

    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting with print specs:', error);
    return { success: false, error: error.message };
  }
};
