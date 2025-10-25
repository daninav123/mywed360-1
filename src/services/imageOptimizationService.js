import i18n from '../i18n';

/**
 * Servicio para optimización de imágenes y assets
 * Incluye lazy loading, compresión y formatos modernos
 */

// Configuración por defecto
const DEFAULT_CONFIG = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'webp',
  fallbackFormat: 'jpegi18n.t('common.lazyloadoffset_100_pixeles_antes_que_imagen')#f3f4f6i18n.t('common.comprime_una_imagen_usando_canvas_api')canvas');
    const ctx = canvas.getContext('2di18n.t('common.const_img_new_image_imgonload_calcular')canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
};

/**
 * Detecta soporte para formatos modernos de imagen
 * @returns {Object} - Objeto con soporte de formatos
 */
export const detectImageSupport = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return {
    webp: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
    avif: canvas.toDataURL('image/avif').startsWith('data:image/avifi18n.t('common.jpeg_true_png_true_componente_react')react';

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  onLoad,
  onError,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${DEFAULT_CONFIG.lazyLoadOffset}px` }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  const placeholderSrc = placeholder || generatePlaceholder(width, height);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      <img
        src={placeholderSrc}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />

      {/* Imagen real */}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loaded && !error ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500">
          <span className="text-sm">Error cargando imagen</span>
        </div>
      )}
    </div>
  );
};

/**
 * Hook para optimización de imágenes en batch
 * @param {File[]} files - Array de archivos de imagen
 * @param {Object} options - Opciones de optimización
 * @returns {Object} - Estado y funciones de optimización
 */
export const useImageOptimization = (files = [], options = {}) => {
  const [optimizedImages, setOptimizedImages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeImages = async () => {
    if (!files.length) return;

    setIsOptimizing(true);
    setProgress(0);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const optimized = await compressImage(files[i], options);
        results.push({
          original: files[i],
          optimized,
          savings: (((files[i].size - optimized.size) / files[i].size) * 100).toFixed(1),
        });
      } catch (error) {
        console.error(`Error optimizando imagen ${files[i].name}:`, error);
        results.push({
          original: files[i],
          optimized: null,
          error: error.message,
        });
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    setOptimizedImages(results);
    setIsOptimizing(false);
  };

  return {
    optimizedImages,
    progress,
    isOptimizing,
    optimizeImages,
  };
};

export default {
  compressImage,
  generatePlaceholder,
  detectImageSupport,
  OptimizedImage,
  useImageOptimization,
};
