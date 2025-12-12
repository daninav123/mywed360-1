import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Maximize2, RefreshCw } from 'lucide-react';

const DualPreview = ({ html, onRefresh }) => {
  const [viewMode, setViewMode] = useState('dual'); // 'dual', 'desktop', 'mobile', 'tablet'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const desktopIframeRef = useRef(null);
  const mobileIframeRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIframeKey((prev) => prev + 1);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const devices = [
    { id: 'dual', label: 'Ambos', icon: Monitor, width: 'auto' },
    { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
    { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
    { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px' },
  ];

  const DeviceFrame = ({ html, width, className = '' }) => (
    <div className={`relative ${className}`}>
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden border-4 border-gray-200"
        style={{ width: width === 'auto' ? '100%' : width }}
      >
        {/* Device Header (solo para móvil y tablet) */}
        {(width === '375px' || width === '768px') && (
          <div className="bg-gray-800 h-8 flex items-center justify-center gap-2">
            <div className="w-20 h-4 bg-gray-900 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          </div>
        )}

        {/* Content */}
        <div className="bg-gray-50">
          <iframe
            key={`${iframeKey}-${width}`}
            srcDoc={
              html ||
              '<div style="padding: 40px; text-align: center; color: #999;">Vista previa disponible tras generar</div>'
            }
            className="w-full border-0"
            style={{
              height: width === '375px' ? '667px' : width === '768px' ? '1024px' : '600px',
              backgroundColor: '#ffffff',
            }}
            title={`Preview ${width}`}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>

        {/* Device Footer (solo para móvil) */}
        {width === '375px' && (
          <div className="bg-gray-800 h-8 flex items-center justify-center">
            <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Device Label */}
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
          {width === '375px' ? 'iPhone 13 Pro' : width === '768px' ? 'iPad' : 'Desktop 1920x1080'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">👀</span>
            Vista Previa
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Así se verá tu web en diferentes dispositivos
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300
            hover:bg-gray-50 transition-all
            ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">Actualizar</span>
        </button>
      </div>

      {/* Device Selector */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <button
              key={device.id}
              onClick={() => setViewMode(device.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md
                transition-all font-medium text-sm
                ${
                  viewMode === device.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{device.label}</span>
            </button>
          );
        })}
      </div>

      {/* Preview Area */}
      <div className="bg-[var(--color-primary)] rounded-xl p-8 min-h-[700px] flex items-center justify-center">
        {viewMode === 'dual' ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Desktop */}
            <div className="flex flex-col items-center">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Monitor size={16} />
                Desktop
              </div>
              <DeviceFrame html={html} width="auto" className="w-full max-w-2xl" />
            </div>

            {/* Mobile */}
            <div className="flex flex-col items-center">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Smartphone size={16} />
                Mobile
              </div>
              <DeviceFrame html={html} width="375px" />
            </div>
          </div>
        ) : viewMode === 'desktop' ? (
          <div className="w-full max-w-6xl">
            <DeviceFrame html={html} width="100%" />
          </div>
        ) : viewMode === 'tablet' ? (
          <DeviceFrame html={html} width="768px" />
        ) : (
          <DeviceFrame html={html} width="375px" />
        )}
      </div>

      {/* Info Footer */}
      {html && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Vista previa activa
            </span>
            <span className="text-gray-400">|</span>
            <span>Actualización automática</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Maximize2 size={14} />
            Haz scroll para ver más contenido
          </div>
        </div>
      )}

      {!html && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Genera tu web para ver la vista previa</p>
        </div>
      )}
    </div>
  );
};

export default DualPreview;
