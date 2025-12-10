import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * Herramientas para compartir la web: QR code y botones de redes sociales
 */
export const ShareWebTools = ({ webUrl, webTitle = 'Nuestra Boda' }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [webUrl]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(webUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#9333EA', // Color primario (púrpura)
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generando QR:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando:', error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = 'qr-code-boda.png';
    link.href = qrCodeUrl;
    link.click();
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`¡Te invito a ver nuestra web de boda! ${webUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(webUrl)}`,
      '_blank'
    );
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`¡Mira nuestra web de boda!`);
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(webUrl)}&text=${text}`,
      '_blank'
    );
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('Invitación a nuestra boda');
    const body = encodeURIComponent(
      `Hola,\n\nTe invito a ver nuestra web de boda:\n${webUrl}\n\n¡Nos vemos!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">📱 Compartir Web</h3>

      {/* URL de la web */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">URL de tu web</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={webUrl}
            readOnly
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              copied ? 'bg-green-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {copied ? '✓ Copiado' : '📋 Copiar'}
          </button>
        </div>
      </div>

      {/* QR Code */}
      {qrCodeUrl && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Código QR</label>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg p-6">
            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 mb-4" />
            <button
              onClick={downloadQRCode}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
            >
              ⬇️ Descargar QR
            </button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Imprime este QR en tus invitaciones físicas
            </p>
          </div>
        </div>
      )}

      {/* Botones de compartir */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Compartir en redes sociales
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            WhatsApp
          </button>

          <button
            onClick={shareFacebook}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>

          <button
            onClick={shareTwitter}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter/X
          </button>

          <button
            onClick={shareEmail}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email
          </button>
        </div>
      </div>

      {/* Consejos */}
      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-purple-900 mb-2">💡 Consejos para compartir</h4>
        <ul className="text-xs text-purple-800 space-y-1">
          <li>• Incluye el QR en tus invitaciones físicas</li>
          <li>• Comparte por WhatsApp con familiares y amigos</li>
          <li>• Crea un evento en Facebook y comparte la web</li>
          <li>• Añade la URL a tu firma de email</li>
        </ul>
      </div>
    </div>
  );
};
