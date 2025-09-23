import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

import { post as apiPost } from '../services/apiClient';

/**
 * VectorEditor
 * Minimal SVG editor for paths: select, recolor, hide/delete, export SVG/PDF.
 * Props:
 *  - svg: string (raw <svg>...</svg>)
 *  - onExport?: ({ svgString, blob }) => void
 */
const VectorEditor = forwardRef(function VectorEditor({ svg, onExport, palette = [] }, ref) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null); // index within live path NodeList
  const [fill, setFill] = useState('#000000');
  const [stroke, setStroke] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [applyTarget, setApplyTarget] = useState('fill'); // 'fill' | 'stroke'
  const [applyAllOfSame, setApplyAllOfSame] = useState(false);

  // Inject SVG content into container
  useEffect(() => {
    setSelectedIndex(null);
    setReady(false);
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    if (typeof svg === 'string' && svg.trim()) {
      containerRef.current.innerHTML = svg;
      // Make paths clickable
      const svgEl = containerRef.current.querySelector('svg');
      if (svgEl) {
        // Delegate clicks to paths
        svgEl.addEventListener('click', handleSvgClick);
        setReady(true);
        // Try select first path to expose controls
        const firstPath = svgEl.querySelector('path');
        if (firstPath) {
          applySelectionFromNode(firstPath);
        }
      }
      return () => {
        if (svgEl) svgEl.removeEventListener('click', handleSvgClick);
      };
    }
  }, [svg]);

  const handleSvgClick = (e) => {
    const target = e.target;
    if (target && target.tagName && target.tagName.toLowerCase() === 'path') {
      e.stopPropagation();
      applySelectionFromNode(target);
    }
  };

  const getPaths = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return [];
    return Array.from(svgEl.querySelectorAll('path'));
  };

  const applySelectionFromNode = (node) => {
    const paths = getPaths();
    const idx = paths.indexOf(node);
    if (idx >= 0) {
      setSelectedIndex(idx);
      const f = node.getAttribute('fill') || '#000000';
      const s = node.getAttribute('stroke') || '#000000';
      const sw = Number(node.getAttribute('stroke-width') || 1) || 1;
      setFill(f);
      setStroke(s);
      setStrokeWidth(sw);
      // Visual highlight
      paths.forEach((p, i) => p.setAttribute('opacity', i === idx ? '0.85' : '1'));
    }
  };

  const updateSelectedNode = (mutate) => {
    const paths = getPaths();
    if (selectedIndex == null || !paths[selectedIndex]) return;
    const node = paths[selectedIndex];
    mutate(node);
  };

  const applyColor = (color) => {
    if (!color) return;
    const paths = getPaths();
    if (selectedIndex == null || !paths[selectedIndex]) return;
    const node = paths[selectedIndex];
    const targetAttr = applyTarget === 'stroke' ? 'stroke' : 'fill';
    const prevColor = node.getAttribute(targetAttr) || '';
    if (applyAllOfSame) {
      paths.forEach((p) => {
        const cur = p.getAttribute(targetAttr) || '';
        if (cur.toLowerCase() === prevColor.toLowerCase()) {
          p.setAttribute(targetAttr, color);
        }
      });
    } else {
      node.setAttribute(targetAttr, color);
    }
    if (targetAttr === 'fill') setFill(color);
    else setStroke(color);
  };

  const handleFillChange = (e) => {
    const val = e.target.value;
    setFill(val);
    updateSelectedNode((node) => node.setAttribute('fill', val));
  };

  const handleStrokeChange = (e) => {
    const val = e.target.value;
    setStroke(val);
    updateSelectedNode((node) => node.setAttribute('stroke', val));
  };

  const handleStrokeWidth = (e) => {
    const val = Math.max(0, Number(e.target.value) || 0);
    setStrokeWidth(val);
    updateSelectedNode((node) => node.setAttribute('stroke-width', String(val)));
  };

  const handleDelete = () => {
    const paths = getPaths();
    if (selectedIndex == null || !paths[selectedIndex]) return;
    const node = paths[selectedIndex];
    node.parentNode?.removeChild(node);
    setSelectedIndex(null);
  };

  const serializeSvg = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return '';
    const clone = svgEl.cloneNode(true);
    // Remove transient highlights
    clone.querySelectorAll('path').forEach((p) => {
      if (p.getAttribute('opacity') === '0.85') p.removeAttribute('opacity');
    });
    return new XMLSerializer().serializeToString(clone);
  };

  useImperativeHandle(
    ref,
    () => ({
      getSvg: () => serializeSvg(),
    }),
    []
  );

  const downloadSvg = () => {
    const content = serializeSvg();
    if (!content) return;
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lovenda-vector-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExport?.({ svgString: content, blob });
  };

  const downloadPdf = async () => {
    const content = serializeSvg();
    if (!content) return;
    try {
      const res = await apiPost('/api/ai-image/svg-to-pdf', { svg: content }, { auth: true });
      if (!res.ok) throw new Error('SVG to PDF failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lovenda-vector-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('SVG to PDF error', e);
      alert('No se pudo exportar a PDF');
    }
  };

  const zoomIn = () => setZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.2, +(z - 0.1).toFixed(2)));

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Sidebar */}
      <aside className="md:w-72 shrink-0 bg-white border rounded p-3 space-y-3">
        <h3 className="font-semibold">Editor vectorial</h3>
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded" onClick={zoomOut}>
            -
          </button>
          <span className="text-sm flex items-center">Zoom {Math.round(zoom * 100)}%</span>
          <button className="px-2 py-1 border rounded" onClick={zoomIn}>
            +
          </button>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Capa seleccionada: {selectedIndex != null ? selectedIndex + 1 : 'ninguna'}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>Aplicar a:</span>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="applyTarget"
                checked={applyTarget === 'fill'}
                onChange={() => setApplyTarget('fill')}
              />
              Relleno
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="applyTarget"
                checked={applyTarget === 'stroke'}
                onChange={() => setApplyTarget('stroke')}
              />
              Trazo
            </label>
          </div>
          <label className="block text-sm">Relleno</label>
          <input
            type="color"
            value={fill}
            onChange={handleFillChange}
            className="w-10 h-8 p-0 border rounded"
          />
          <label className="block text-sm mt-2">Trazo</label>
          <input
            type="color"
            value={stroke}
            onChange={handleStrokeChange}
            className="w-10 h-8 p-0 border rounded"
          />
          <label className="block text-sm mt-2">Grosor</label>
          <input
            type="number"
            value={strokeWidth}
            min={0}
            step={0.5}
            onChange={handleStrokeWidth}
            className="w-full border rounded p-1"
          />
          {Array.isArray(palette) && palette.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Paleta</span>
                <label className="text-xs flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={applyAllOfSame}
                    onChange={(e) => setApplyAllOfSame(e.target.checked)}
                  />
                  Reemplazar mismo color
                </label>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {palette.map((c, i) => (
                  <button
                    key={i}
                    title={c}
                    onClick={() => applyColor(c)}
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 border rounded"
              onClick={handleDelete}
              disabled={selectedIndex == null}
            >
              Eliminar
            </button>
          </div>
        </div>
        <div className="pt-4 border-t mt-2 flex flex-col gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={downloadSvg}>
            Descargar SVG
          </button>
          <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={downloadPdf}>
            Exportar PDF
          </button>
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 bg-gray-50 rounded p-3 overflow-auto">
        <div
          className="border bg-white rounded shadow-sm overflow-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <div ref={containerRef} className="p-2" />
        </div>
      </main>
    </div>
  );
});

export default VectorEditor;
