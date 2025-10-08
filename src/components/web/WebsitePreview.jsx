import React, { useMemo } from 'react';

const statusMessage = (slugStatus, checking) => {
  if (checking) return { text: 'Comprobando…', tone: 'neutral' };
  switch (slugStatus) {
    case 'invalid':
      return { text: 'Slug inválido', tone: 'error' };
    case 'reserved':
      return { text: 'Slug reservado', tone: 'error' };
    case 'taken':
      return { text: 'Ocupado', tone: 'error' };
    case 'available':
      return { text: 'Disponible', tone: 'success' };
    case 'unknown':
      return { text: 'No pudimos verificar', tone: 'neutral' };
    default:
      return null;
  }
};

const WebsitePreview = ({
  html,
  onPublish,
  publishSlug,
  onSlugChange,
  slugStatus,
  checkingSlug,
  slugSuggestions = [],
  onSuggestionSelect,
  publicUrl,
  showQR,
  onShowQR,
  onHideQR,
}) => {
  if (!html) return null;

  const shareUrl = useMemo(() => {
    if (publicUrl) return publicUrl;
    if (!publishSlug) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/p/${encodeURIComponent(publishSlug)}`;
  }, [publicUrl, publishSlug]);

  const copyDisabled = !shareUrl || ['invalid', 'reserved', 'taken'].includes(slugStatus || '');

  const message = statusMessage(slugStatus, checkingSlug);
  const statusClass =
    message?.tone === 'error'
      ? 'text-red-600'
      : message?.tone === 'success'
      ? 'text-green-600'
      : 'text-gray-600';

  const handleOpenNewTab = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = 'index.html';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Enlace copiado');
    } catch {
      alert(shareUrl);
    }
  };

  const qrUrl = useMemo(() => {
    if (!shareUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      shareUrl
    )}`;
  }, [shareUrl]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Vista previa de tu página web</h2>

      <div className="border rounded-lg overflow-hidden shadow-lg">
        <div className="bg-gray-100 p-2 border-b flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="flex-1 text-center text-sm text-gray-600">
            Vista previa - Tu web de boda
          </div>
        </div>
        <iframe
          title="Vista previa"
          srcDoc={html}
          sandbox="allow-same-origin allow-scripts"
          className="w-full h-[600px] border-none"
        />
      </div>

      <div className="mt-6 flex gap-4 items-center flex-wrap">
        <button
          type="button"
          onClick={onPublish}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Publicar página</span>
        </button>

        <button
          type="button"
          onClick={handleOpenNewTab}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
          <span>Abrir en nueva pestaña</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3a1 1 0 011-1h2a1 1 0 110 2H5v12h10V4h-1a1 1 0 110-2h2a1 1 0 011 1v14a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" />
            <path d="M7 9a1 1 0 011-1h1V4a1 1 0 112 0v4h1a1 1 0 01.707 1.707l-3 3a1 1 0 01-1.414 0l-3-3A1 1 0 017 9z" />
          </svg>
          <span>Descargar HTML</span>
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600" htmlFor="publish-slug">
            Slug público
          </label>
          <input
            id="publish-slug"
            value={publishSlug}
            onChange={(event) => onSlugChange?.(event.target.value)}
            placeholder="mi-boda-ana-luis"
            className="border rounded px-3 py-2 text-sm"
          />
          {message && <span className={`text-sm ${statusClass}`}>{message.text}</span>}
        </div>

        {slugSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>Sugerencias:</span>
            {slugSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionSelect?.(suggestion)}
                className={`px-2 py-1 rounded border ${
                  publishSlug === suggestion ? 'bg-blue-50 border-blue-400' : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={copyDisabled}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Copiar enlace
          </button>
          <button
            type="button"
            onClick={showQR ? onHideQR : onShowQR}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            {showQR ? 'Ocultar QR' : 'Mostrar QR'}
          </button>
        </div>

        {showQR && qrUrl && (
          <div className="mt-2 p-4 border rounded inline-block">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">QR de la web pública</div>
              <button
                type="button"
                onClick={onHideQR}
                className="text-gray-500 hover:text-gray-700"
              >
                Cerrar
              </button>
            </div>
            <img src={qrUrl} alt="QR" width={220} height={220} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsitePreview;
