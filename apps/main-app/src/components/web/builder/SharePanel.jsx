import React, { useState } from 'react';

/**
 * SharePanel - Panel para compartir la web en redes sociales
 */
const SharePanel = ({ webUrl, webTitle }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `¡Mira mi web de boda! ${webTitle}`;
  const encodedUrl = encodeURIComponent(webUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: 'Facebook',
      icon: '👍',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Twitter',
      icon: '𝕏',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: 'bg-black hover:bg-gray-800',
    },
    {
      name: 'Instagram',
      icon: '📷',
      url: `https://www.instagram.com/`,
      color: 'bg-pink-600 hover:bg-pink-700',
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'bg-blue-700 hover:bg-blue-800',
    },
    {
      name: 'Telegram',
      icon: '✈️',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      color: 'bg-blue-400 hover:bg-blue-500',
    },
  ];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (url, platform) => {
    window.open(url, '_blank', 'width=600,height=400');

    // Registrar compartición
    console.log(`Compartido en ${platform}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">📤 Compartir tu Web</h3>

      {/* URL de la web */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Tu URL:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={webUrl}
            readOnly
            className="
              flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg
              font-mono text-sm text-gray-700 focus:outline-none
            "
          />
          <button
            onClick={handleCopyUrl}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all
              ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}
            `}
          >
            {copied ? '✓ Copiado' : '📋 Copiar'}
          </button>
        </div>
      </div>

      {/* Redes sociales */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Compartir en Redes Sociales:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {shareLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleShare(link.url, link.name)}
              className={`
                ${link.color} text-white rounded-lg py-3 px-4
                font-semibold transition-all transform hover:scale-105
                flex items-center justify-center gap-2
              `}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="hidden sm:inline">{link.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Compartir por Email:
        </label>
        <a
          href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Hola, te invito a ver mi web de boda:\n\n${webUrl}`)}`}
          className="
            w-full block px-6 py-3 bg-purple-600 text-white rounded-lg
            hover:bg-purple-700 transition-colors font-semibold text-center
          "
        >
          ✉️ Enviar por Email
        </a>
      </div>

      {/* Estadísticas */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">📊 Estadísticas de Compartición</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-xs text-gray-600">Comparticiones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-xs text-gray-600">Clics</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-xs text-gray-600">Conversiones</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <p className="font-semibold mb-2">💡 Tips para más comparticiones:</p>
        <ul className="space-y-1">
          <li>✓ Comparte en múltiples plataformas</li>
          <li>✓ Personaliza el mensaje de invitación</li>
          <li>✓ Comparte en grupos de amigos</li>
          <li>✓ Actualiza regularmente tu web</li>
        </ul>
      </div>
    </div>
  );
};

export default SharePanel;
