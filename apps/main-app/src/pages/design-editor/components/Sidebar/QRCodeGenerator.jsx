import React, { useState } from 'react';
import { QrCode } from 'lucide-react';

export default function QRCodeGenerator({ onAdd }) {
  const [qrText, setQrText] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const generateQR = () => {
    if (!qrText.trim()) {
      alert('Ingresa un texto o URL para el código QR');
      return;
    }

    // Generar SVG de código QR simple (simulado)
    const qrSize = 200;
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qrSize} ${qrSize}">
      <rect width="${qrSize}" height="${qrSize}" fill="white"/>
      <rect x="10" y="10" width="30" height="30" fill="black"/>
      <rect x="160" y="10" width="30" height="30" fill="black"/>
      <rect x="10" y="160" width="30" height="30" fill="black"/>
      <rect x="50" y="50" width="100" height="100" fill="black"/>
      <text x="${qrSize/2}" y="${qrSize - 10}" text-anchor="middle" font-size="10" fill="black">${qrText.substring(0, 30)}</text>
    </svg>`;

    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(qrSvg);

    onAdd({
      type: 'qrcode',
      svgUrl: svgDataUrl,
      text: qrText,
      width: 150,
      height: 150
    });

    setQrText('');
    setShowDialog(false);
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setShowDialog(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <QrCode className="w-5 h-5" />
        Generar Código QR
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className=" rounded-lg p-6 w-96" style={{ backgroundColor: 'var(--color-surface)' }}>
            <h3 className="text-lg font-semibold mb-4">Crear Código QR</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Texto o URL</label>
                <input
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="https://miboda.com o texto cualquiera"
                  className="w-full px-3 py-2 border  rounded" style={{ borderColor: 'var(--color-border)' }}
                />
                <p className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>
                  Puede ser un link a tu web de boda, ubicación en Google Maps, etc.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={generateQR}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Generar
                </button>
                <button
                  onClick={() => {
                    setShowDialog(false);
                    setQrText('');
                  }}
                  className="flex-1 px-4 py-2 border  rounded hover:" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Ideas para QR:</strong><br/>
          • Link a confirmación RSVP<br/>
          • Ubicación en Google Maps<br/>
          • Playlist de Spotify<br/>
          • Registro de regalos
        </p>
      </div>
    </div>
  );
}
