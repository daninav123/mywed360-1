/**
 * Componente que agrupa todos los modales del plan de asientos
 * Gestiona la configuración de ceremonia, banquete, espacio y plantillas
 */

import { X, Grid, Users, Maximize, Palette } from 'lucide-react';
import React from 'react';

const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-blue-600" />}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  );
};

const SeatingPlanModals = ({
  // Estados de modales
  ceremonyConfigOpen,
  banquetConfigOpen,
  spaceConfigOpen,
  backgroundOpen,
  capacityOpen,
  templateOpen,

  // Handlers de cierre
  onCloseCeremonyConfig,
  onCloseBanquetConfig,
  onCloseSpaceConfig,
  onCloseBackground,
  onCloseCapacity,
  onCloseTemplate,

  // Handlers de configuración
  onGenerateSeatGrid,
  onGenerateBanquetLayout,
  onSaveHallDimensions,
  onSaveBackground,
  onSaveCapacity,
  onApplyTemplate,

  // Estado actual
  hallSize,
  areas = [],
  guests = [],
  tables = [],
  background = null,
  globalMaxSeats = 0,
}) => {
  return (
    <>
      {/* Modal de configuración de ceremonia */}
      <Modal
        isOpen={ceremonyConfigOpen}
        onClose={onCloseCeremonyConfig}
        title="Configurar Ceremonia"
        icon={Grid}
      >
        <CeremonyConfigForm onGenerate={onGenerateSeatGrid} onClose={onCloseCeremonyConfig} />
      </Modal>

      {/* Modal de capacidad global */}
      <Modal
        isOpen={!!capacityOpen}
        onClose={onCloseCapacity}
        title="Capacidad Global"
        icon={Users}
      >
        <CapacityForm
          onSave={onSaveCapacity}
          onClose={onCloseCapacity}
          initialMax={globalMaxSeats}
        />
      </Modal>

      {/* Modal de fondo/plano */}
      <Modal
        isOpen={!!backgroundOpen}
        onClose={onCloseBackground}
        title="Fondo del salón"
        icon={Maximize}
      >
        <BackgroundForm
          background={background}
          onSave={onSaveBackground}
          onClose={onCloseBackground}
        />
      </Modal>

      {/* Modal de configuración de banquete */}
      <Modal
        isOpen={banquetConfigOpen}
        onClose={onCloseBanquetConfig}
        title="Configurar Banquete"
        icon={Users}
      >
        <BanquetConfigForm onGenerate={onGenerateBanquetLayout} onClose={onCloseBanquetConfig} />
      </Modal>

      {/* Modal de configuración de espacio */}
      <Modal
        isOpen={spaceConfigOpen}
        onClose={onCloseSpaceConfig}
        title="Configurar Espacio"
        icon={Maximize}
      >
        <SpaceConfigForm
          hallSize={hallSize}
          onSave={onSaveHallDimensions}
          onClose={onCloseSpaceConfig}
        />
      </Modal>

      {/* Modal de plantillas */}
      <Modal isOpen={templateOpen} onClose={onCloseTemplate} title="Plantillas" icon={Palette}>
        <TemplateSelector
          onApply={onApplyTemplate}
          onClose={onCloseTemplate}
          guests={guests}
          tables={tables}
          hallSize={hallSize}
          areas={areas}
        />
      </Modal>
    </>
  );
};

// Formulario de configuración de ceremonia
const CeremonyConfigForm = ({ onGenerate, onClose }) => {
  const [config, setConfig] = React.useState({
    rows: 10,
    cols: 12,
    gap: 40,
    startX: 100,
    startY: 80,
    aisleAfter: 6,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(
      config.rows,
      config.cols,
      config.gap,
      config.startX,
      config.startY,
      config.aisleAfter
    );
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Filas</label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.rows}
            onChange={(e) => setConfig((prev) => ({ ...prev, rows: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Columnas</label>
          <input
            type="number"
            min="1"
            max="30"
            value={config.cols}
            onChange={(e) => setConfig((prev) => ({ ...prev, cols: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Separación (cm)</label>
        <input
          type="number"
          min="20"
          max="100"
          value={config.gap}
          onChange={(e) => setConfig((prev) => ({ ...prev, gap: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Pasillo después de columna</label>
        <input
          type="number"
          min="0"
          max={config.cols}
          value={config.aisleAfter}
          onChange={(e) => setConfig((prev) => ({ ...prev, aisleAfter: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generar
        </button>
      </div>
    </form>
  );
};

// Formulario de configuración de banquete
const BanquetConfigForm = ({ onGenerate, onClose }) => {
  const [config, setConfig] = React.useState({
    rows: 3,
    cols: 4,
    seats: 8,
    gapX: 140,
    gapY: 160,
    startX: 120,
    startY: 160,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(config);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Filas de mesas</label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.rows}
            onChange={(e) => setConfig((prev) => ({ ...prev, rows: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Columnas de mesas</label>
          <input
            type="number"
            min="1"
            max="15"
            value={config.cols}
            onChange={(e) => setConfig((prev) => ({ ...prev, cols: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Asientos por mesa</label>
        <input
          type="number"
          min="2"
          max="20"
          value={config.seats}
          onChange={(e) => setConfig((prev) => ({ ...prev, seats: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Separación X (cm)</label>
          <input
            type="number"
            min="80"
            max="300"
            value={config.gapX}
            onChange={(e) => setConfig((prev) => ({ ...prev, gapX: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Separación Y (cm)</label>
          <input
            type="number"
            min="80"
            max="300"
            value={config.gapY}
            onChange={(e) => setConfig((prev) => ({ ...prev, gapY: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generar
        </button>
      </div>
    </form>
  );
};

// Formulario de configuración de espacio
const SpaceConfigForm = ({ hallSize, onSave, onClose }) => {
  const [dimensions, setDimensions] = React.useState({
    width: hallSize?.width ?? 1800,
    height: hallSize?.height ?? 1200,
    aisleMin: hallSize?.aisleMin ?? 80,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(dimensions.width, dimensions.height, parseInt(dimensions.aisleMin, 10) || 80);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ancho (m)</label>
          <input
            type="number"
            min="2"
            max="50"
            value={(dimensions.width / 100).toString()}
            onChange={(e) =>
              setDimensions((prev) => ({ ...prev, width: parseFloat(e.target.value) * 100 }))
            }
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Largo (m)</label>
          <input
            type="number"
            min="2"
            max="50"
            value={(dimensions.height / 100).toString()}
            onChange={(e) =>
              setDimensions((prev) => ({ ...prev, height: parseFloat(e.target.value) * 100 }))
            }
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Pasillo mínimo (cm)</label>
        <input
          type="number"
          min="40"
          max="300"
          step="10"
          value={dimensions.aisleMin}
          onChange={(e) =>
            setDimensions((prev) => ({ ...prev, aisleMin: parseInt(e.target.value, 10) || 80 }))
          }
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-gray-50 p-3 rounded">
        <p className="text-sm text-gray-600">
          <strong>Área total:</strong> {((dimensions.width * dimensions.height) / 10000).toFixed(1)}{' '}
          m²
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};

// Selector de plantillas
const TemplateSelector = ({
  onApply,
  onClose,
  guests = [],
  tables = [],
  hallSize = { width: 1800, height: 1200, aisleMin: 80 },
  areas = [],
}) => {
  // Calcular necesidades a partir de datos reales
  const guestCount = Array.isArray(guests)
    ? guests.reduce((acc, g) => acc + 1 + (parseInt(g?.companion, 10) || 0), 0)
    : 0;
  const tableCount = Array.isArray(tables) ? tables.length : 0;

  // Boundary y dimensiones efectivas
  const boundary = (() => {
    const b = (areas || []).find(
      (a) =>
        !Array.isArray(a) &&
        a?.type === 'boundary' &&
        Array.isArray(a?.points) &&
        a.points.length >= 3
    );
    return b ? b.points : null;
  })();
  const bbox = (() => {
    if (!boundary) return null;
    const xs = boundary.map((p) => p.x);
    const ys = boundary.map((p) => p.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  })();
  const centroid = (() => {
    if (!boundary) return { x: (hallSize?.width || 1800) / 2, y: (hallSize?.height || 1200) / 2 };
    let x = 0,
      y = 0;
    boundary.forEach((p) => {
      x += p.x;
      y += p.y;
    });
    const n = boundary.length || 1;
    return { x: x / n, y: y / n };
  })();
  const hallW = bbox
    ? Math.max(600, bbox.maxX - bbox.minX)
    : Math.max(600, hallSize?.width || 1800);
  const hallH = bbox
    ? Math.max(400, bbox.maxY - bbox.minY)
    : Math.max(400, hallSize?.height || 1200);
  const aisle = Math.max(40, Math.min(300, hallSize?.aisleMin ?? 80));

  // Derivar forma y tamaño base de mesas actuales
  const shapeCounts = tables.reduce((m, t) => {
    const s = t?.shape || 'rectangle';
    m[s] = (m[s] || 0) + 1;
    return m;
  }, {});
  const defaultShape =
    (shapeCounts['circle'] || 0) > (shapeCounts['rectangle'] || 0) ? 'circle' : 'rectangle';
  const baseDiameter = Math.max(
    50,
    Math.round(
      tables
        .map((t) => t?.diameter)
        .filter(Boolean)
        .reduce((a, b) => a + b, 0) /
        (tables.map((t) => t?.diameter).filter(Boolean).length || 1) || 60
    )
  );
  const baseWidth = Math.max(
    60,
    Math.round(
      tables
        .map((t) => t?.width)
        .filter(Boolean)
        .reduce((a, b) => a + b, 0) / (tables.map((t) => t?.width).filter(Boolean).length || 1) ||
        80
    )
  );
  const baseHeight = Math.max(
    50,
    Math.round(
      tables
        .map((t) => t?.height || t?.length)
        .filter(Boolean)
        .reduce((a, b) => a + b, 0) /
        (tables.map((t) => t?.height || t?.length).filter(Boolean).length || 1) || 60
    )
  );
  const avgSeats = (() => {
    if (!tableCount) return 8;
    const seats = tables.map((t) => parseInt(t?.seats, 10) || 0).filter((n) => n > 0);
    if (!seats.length) return 8;
    const avg = Math.round(seats.reduce((a, b) => a + b, 0) / seats.length);
    return Math.min(12, Math.max(6, avg));
  })();

  const suggestedBanquet = (() => {
    const seatsPerTable = avgSeats || 8;
    const neededTables =
      guestCount > 0 ? Math.ceil(guestCount / seatsPerTable) : Math.max(1, tableCount || 6);
    const rows = Math.max(1, Math.floor(Math.sqrt(neededTables)));
    const cols = Math.max(1, Math.ceil(neededTables / rows));
    return { rows, cols, seats: seatsPerTable };
  })();

  const suggestedCeremony = (() => {
    const totalChairs = Math.max(guestCount, 20);
    const cols = Math.max(6, Math.round(Math.sqrt(totalChairs)));
    const rows = Math.max(4, Math.ceil(totalChairs / cols));
    return { rows, cols };
  })();

  // Helpers para construir arreglos de mesas
  const buildGridTables = (rows, cols, shape = defaultShape) => {
    const count = rows * cols;
    const need = Math.max(count, guestCount ? Math.ceil(guestCount / avgSeats) : count);
    const useCols = cols;
    const useRows = Math.ceil(need / useCols);
    const cellW = hallW / (useCols + 1);
    const cellH = hallH / (useRows + 1);
    const arr = [];
    let id = 1;
    for (let r = 0; r < useRows; r++) {
      for (let c = 0; c < useCols; c++) {
        if (arr.length >= need) break;
        const cx = (c + 1) * cellW;
        const cy = (r + 1) * cellH;
        arr.push(
          shape === 'circle'
            ? { id: id++, x: cx, y: cy, shape: 'circle', diameter: baseDiameter, seats: avgSeats }
            : {
                id: id++,
                x: cx,
                y: cy,
                shape: 'rectangle',
                width: baseWidth,
                height: baseHeight,
                seats: avgSeats,
              }
        );
      }
    }
    return arr;
  };

  // Parámetros dependientes del perímetro
  const [ringParams, setRingParams] = React.useState({ innerPct: 24, outerPct: 42 });
  const [perimParams, setPerimParams] = React.useState({ marginPct: 8 });

  const buildCircularRing = () => {
    const need = guestCount ? Math.ceil(guestCount / avgSeats) : Math.max(tableCount || 6, 6);
    const centerX = centroid.x,
      centerY = centroid.y;
    const radius = Math.min(hallW, hallH) * (ringParams.outerPct / 100);
    const arr = [];
    for (let i = 0; i < need; i++) {
      const ang = (2 * Math.PI * i) / need;
      const cx = centerX + radius * Math.cos(ang);
      const cy = centerY + radius * Math.sin(ang);
      arr.push({
        id: i + 1,
        x: cx,
        y: cy,
        shape: 'circle',
        diameter: baseDiameter,
        seats: avgSeats,
      });
    }
    return arr;
  };

  const buildUShape = () => {
    const segments = 3; // izquierda, abajo, derecha
    const perSeg = Math.max(
      2,
      Math.ceil((guestCount ? Math.ceil(guestCount / avgSeats) : 10) / segments)
    );
    const gap = Math.min(200, Math.max(aisle + 40, Math.floor(hallW / (perSeg + 1))));
    const arr = [];
    let id = 1;
    // Barra inferior
    for (let i = 0; i < perSeg; i++) {
      const x = (bbox ? bbox.minX : 0) + (i + 1) * gap;
      const y = (bbox ? bbox.maxY : hallH) - 120;
      arr.push({
        id: id++,
        x,
        y,
        shape: 'rectangle',
        width: baseWidth,
        height: baseHeight,
        seats: avgSeats,
      });
    }
    // Barra izquierda
    for (let i = 0; i < Math.max(2, Math.floor(perSeg / 2)); i++) {
      const x = (bbox ? bbox.minX : 0) + 120;
      const y = (i + 1) * Math.min(200, Math.max(140, Math.floor(hallH / (perSeg / 2 + 2))));
      arr.push({
        id: id++,
        x,
        y,
        shape: 'rectangle',
        width: baseWidth,
        height: baseHeight,
        seats: avgSeats,
      });
    }
    // Barra derecha
    for (let i = 0; i < Math.max(2, Math.floor(perSeg / 2)); i++) {
      const x = (bbox ? bbox.maxX : hallW) - 120;
      const y = (i + 1) * Math.min(200, Math.max(140, Math.floor(hallH / (perSeg / 2 + 2))));
      arr.push({
        id: id++,
        x,
        y,
        shape: 'rectangle',
        width: baseWidth,
        height: baseHeight,
        seats: avgSeats,
      });
    }
    return arr;
  };

  const buildLShape = () => {
    const perSeg = Math.max(3, Math.ceil((guestCount ? Math.ceil(guestCount / avgSeats) : 8) / 2));
    const gapX = Math.min(220, Math.max(aisle + 40, Math.floor(hallW / (perSeg + 1))));
    const gapY = Math.min(220, Math.max(aisle + 40, Math.floor(hallH / (perSeg + 1))));
    const arr = [];
    let id = 1;
    // Horizontal inferior
    for (let i = 0; i < perSeg; i++) {
      const x = (bbox ? bbox.minX : 0) + (i + 1) * gapX;
      const y = (bbox ? bbox.maxY : hallH) - 120;
      arr.push({
        id: id++,
        x,
        y,
        shape: 'rectangle',
        width: baseWidth,
        height: baseHeight,
        seats: avgSeats,
      });
    }
    // Vertical izquierda
    for (let i = 0; i < Math.max(2, Math.floor(perSeg / 2)); i++) {
      const x = (bbox ? bbox.minX : 0) + 120;
      const y = (bbox ? bbox.maxY : hallH) - 120 - (i + 1) * gapY;
      arr.push({
        id: id++,
        x,
        y,
        shape: 'rectangle',
        width: baseWidth,
        height: baseHeight,
        seats: avgSeats,
      });
    }
    return arr;
  };

  const buildDoubleRing = () => {
    const inner = buildCircularRing();
    const outer = buildCircularRing();
    return [
      ...inner.map((table, index) => ({
        ...table,
        id: `${table.id || 'inner'}-${index}`,
        radius: table.radius ? table.radius * 0.85 : table.radius,
      })),
      ...outer.map((table, index) => ({
        ...table,
        id: `${table.id || 'outer'}-${index}`,
        radius: table.radius ? table.radius * 1.15 : table.radius,
      })),
    ];
  };

  const buildPerimeter = () => {
    if (!hallW || !hallH)
      return buildGridTables(suggestedBanquet.rows, suggestedBanquet.cols, defaultShape);
    const tables = [];
    const spacing = 200;
    const seatsPerTable = Math.max(6, avgSeats);
    for (let x = spacing; x < hallW - spacing; x += spacing) {
      tables.push({ id: `top-${x}`, shape: defaultShape, seats: seatsPerTable, x, y: spacing });
      tables.push({
        id: `bottom-${x}`,
        shape: defaultShape,
        seats: seatsPerTable,
        x,
        y: hallH - spacing,
      });
    }
    for (let y = spacing * 1.5; y < hallH - spacing * 1.5; y += spacing) {
      tables.push({ id: `left-${y}`, shape: defaultShape, seats: seatsPerTable, x: spacing, y });
      tables.push({
        id: `right-${y}`,
        shape: defaultShape,
        seats: seatsPerTable,
        x: hallW - spacing,
        y,
      });
    }
    return tables;
  };

  const buildImperial = () => {
    const arr = [];
    const width = Math.min(hallW * 0.85, Math.max(baseWidth * 2, 800));
    const height = Math.max(baseHeight, 100);
    const cx = centroid.x,
      cy = centroid.y;
    arr.push({
      id: 1,
      x: cx,
      y: cy,
      shape: 'rectangle',
      width,
      height,
      seats: Math.max(guestCount, avgSeats),
    });
    return arr;
  };

  let templates = [
    {
      id: 'suggested',
      name: 'Sugerido por datos',
      description: `${guestCount || 0} invitados • ${tableCount || 0} mesas • Banquete ~${suggestedBanquet.rows}×${suggestedBanquet.cols} de ${suggestedBanquet.seats}`,
      banquet: suggestedBanquet,
      ceremony: suggestedCeremony,
    },
    {
      id: 'medium-wedding',
      name: 'Boda Mediana',
      description: 'Disposición estándar para boda mediana (3×4 mesas, 8 asientos)',
      banquet: { rows: 3, cols: 4, seats: 8 },
      ceremony: { rows: 10, cols: 12 },
    },
    {
      id: 'circle',
      name: 'Distribución circular',
      description: `Anillo central con ${avgSeats} asientos por mesa (forma redonda)`,
      banquetTables: buildCircularRing(),
    },
    {
      id: 'u-shape',
      name: 'Forma U',
      description: 'Tres alas creando una U abierta',
      banquetTables: buildUShape(),
    },
    {
      id: 'l-shape',
      name: 'Forma L',
      description: 'Dos alas en ángulo',
      banquetTables: buildLShape(),
    },
    {
      id: 'imperial',
      name: 'Mesa Imperial única',
      description: `Una mesa central para ~${guestCount || avgSeats} comensales`,
      banquetTables: buildImperial(),
    },
    {
      id: 'double-ring',
      name: 'Doble anillo',
      description: 'Dos anillos concentricos de mesas',
      banquetTables: buildDoubleRing(),
    },
    {
      id: 'perimeter',
      name: 'Perimetro con pista central',
      description: 'Mesas en perimetro y pista central libre',
      banquetTables: buildPerimeter(),
    },
    {
      id: 'fill-space',
      name: 'Relleno según espacio',
      description: `Cuadrícula adaptada a ${(hallW / 100) | 0}×${(hallH / 100) | 0} m`,
      banquetTables: buildGridTables(suggestedBanquet.rows, suggestedBanquet.cols, defaultShape),
    },
  ];

  // Añadir plantillas guardadas por el usuario
  try {
    const raw =
      localStorage.getItem('seatingPlan:local:userTemplates') ||
      localStorage.getItem('userTemplates');
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr) && arr.length) {
      templates = [
        ...templates,
        ...arr.map((t) => ({
          id: t.id || `user-${t.name}-${Date.now()}`,
          name: t.name || 'Mi plantilla',
          description: 'Plantilla guardada por el usuario',
          banquetTables: Array.isArray(t.banquetTables) ? t.banquetTables : [],
        })),
      ];
    }
  } catch (_) {}

  if (tableCount > 0) {
    // Reordenar mesas existentes en cuadrícula
    templates.push({
      id: 'grid-existing',
      name: 'Reordenar en cuadrícula (existentes)',
      description: `Coloca tus ${tableCount} mesas actuales en cuadrícula`,
      banquetTables: (() => {
        const arr = [];
        const cols = Math.max(1, Math.ceil(Math.sqrt(tableCount)));
        const rows = Math.max(1, Math.ceil(tableCount / cols));
        const cellW = Math.max(180, Math.floor(hallW / (cols + 1)));
        const cellH = Math.max(180, Math.floor(hallH / (rows + 1)));
        const startX = bbox ? bbox.minX : 0;
        const startY = bbox ? bbox.minY : 0;
        let i = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (i >= tables.length) break;
            const t = tables[i++];
            const cx = startX + (c + 1) * cellW;
            const cy = startY + (r + 1) * cellH;
            arr.push({
              id: t.id,
              name: t.name,
              x: cx,
              y: cy,
              shape: t.shape || 'rectangle',
              seats: parseInt(t.seats, 10) || avgSeats,
            });
          }
        }
        return arr;
      })(),
    });

    // Reordenar mesas existentes en anillo
    templates.push({
      id: 'ring-existing',
      name: 'Reordenar en anillo (existentes)',
      description: `Distribuye ${tableCount} mesas actuales en un círculo`,
      banquetTables: (() => {
        const arr = [];
        const centerX = centroid.x,
          centerY = centroid.y;
        const radius = Math.min(hallW, hallH) * 0.35;
        for (let i = 0; i < tables.length; i++) {
          const t = tables[i];
          const ang = (2 * Math.PI * i) / tables.length;
          const cx = centerX + radius * Math.cos(ang);
          const cy = centerY + radius * Math.sin(ang);
          arr.push({
            id: t.id,
            name: t.name,
            x: cx,
            y: cy,
            shape: t.shape || 'circle',
            seats: parseInt(t.seats, 10) || avgSeats,
          });
        }
        return arr;
      })(),
    });

    // Reordenar mesas existentes en 2–3 filas
    templates.push({
      id: 'rows-existing',
      name: 'Reordenar en filas (existentes)',
      description: `Coloca ${tableCount} mesas actuales en 2–3 filas equilibradas`,
      banquetTables: (() => {
        const arr = [];
        const rows = tableCount <= 8 ? 2 : 3;
        const perRow = Math.ceil(tableCount / rows);
        const gapX = Math.min(220, Math.max(aisle + 40, Math.floor(hallW / (perRow + 1))));
        const rowYs =
          rows === 2
            ? [(bbox ? bbox.minY : 0) + hallH * 0.4, (bbox ? bbox.minY : 0) + hallH * 0.7]
            : [
                (bbox ? bbox.minY : 0) + hallH * 0.35,
                (bbox ? bbox.minY : 0) + hallH * 0.55,
                (bbox ? bbox.minY : 0) + hallH * 0.75,
              ];
        let i = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < perRow && i < tables.length; c++) {
            const t = tables[i++];
            const x = (bbox ? bbox.minX : 0) + (c + 1) * gapX;
            const y = rowYs[r];
            arr.push({
              id: t.id,
              name: t.name,
              x,
              y,
              shape: t.shape || 'rectangle',
              seats: parseInt(t.seats, 10) || avgSeats,
            });
          }
        }
        return arr;
      })(),
    });

    // Reordenar mesas existentes en doble anillo
    templates.push({
      id: 'double-ring-existing',
      name: 'Doble anillo (existentes)',
      description: `Distribuye ${tableCount} mesas actuales en dos anillos`,
      banquetTables: (() => {
        const arr = [];
        const cx = centroid.x,
          cy = centroid.y;
        const rInner = Math.min(hallW, hallH) * 0.24;
        const rOuter = Math.min(hallW, hallH) * 0.42;
        const inner = Math.max(3, Math.floor(tables.length / 2));
        const outer = Math.max(3, tables.length - inner);
        let i = 0;
        // inner ring
        for (let k = 0; k < inner && i < tables.length; k++) {
          const t = tables[i++];
          const ang = (2 * Math.PI * k) / inner;
          arr.push({
            id: t.id,
            name: t.name,
            x: cx + rInner * Math.cos(ang),
            y: cy + rInner * Math.sin(ang),
            shape: t.shape || 'circle',
            seats: parseInt(t.seats, 10) || avgSeats,
          });
        }
        // outer ring
        for (let k = 0; k < outer && i < tables.length; k++) {
          const t = tables[i++];
          const ang = (2 * Math.PI * k) / outer;
          arr.push({
            id: t.id,
            name: t.name,
            x: cx + rOuter * Math.cos(ang),
            y: cy + rOuter * Math.sin(ang),
            shape: t.shape || 'circle',
            seats: parseInt(t.seats, 10) || avgSeats,
          });
        }
        return arr;
      })(),
    });

    // Reordenar mesas existentes en perímetro con pista central
    templates.push({
      id: 'perimeter-existing',
      name: 'Perímetro (existentes)',
      description: `Mesas actuales alrededor del perímetro y pista central`,
      banquetTables: (() => {
        const arr = [];
        const margin = Math.max(120, aisle + 60);
        const minX = (bbox ? bbox.minX : 0) + margin;
        const minY = (bbox ? bbox.minY : 0) + margin;
        const maxX = (bbox ? bbox.maxX : hallW) - margin;
        const maxY = (bbox ? bbox.maxY : hallH) - margin;
        const perim = 2 * (maxX - minX + (maxY - minY));
        const gap = Math.max(180, Math.floor(perim / Math.max(1, tables.length)));
        let i = 0;
        // top edge
        for (let x = minX; x <= maxX && i < tables.length; x += gap) {
          const t = tables[i++];
          arr.push({
            id: t.id,
            name: t.name,
            x,
            y: minY,
            shape: t.shape || 'rectangle',
            seats: parseInt(t.seats, 10) || avgSeats,
          });
        }
        // right edge
        for (let y = minY; y <= maxY && i < tables.length; y += gap) {
          const t = tables[i++];
          arr.push({
            id: t.id,
            name: t.name,
            x: maxX,
            y,
            shape: t.shape || 'rectangle',
            seats: parseInt(t.seats, 10) || avgSeats,
          });
        }
        // bottom edge
        for (let x = maxX; x >= minX && i < tables.length; x -= gap) {
          const t = tables[i++];
          arr.push({
            id: t.id,
            name: t.name,
            x,
            y: maxY,
            shape: t.shape || 'rectangle',
            seats: parseInt(t.seats, 10) || avgSeats,
          });
        }
        // left edge
        for (let y = maxY; y >= minY && i < tables.length; y -= gap) {
          const t = tables[i++];
          arr.push({
            id: t.id,
            name: t.name,
            x: minX,
            y,
            shape: t.shape || 'rectangle',
            seats: parseInt(t.seats, 10) || avgSeats,
          });
        }
        return arr;
      })(),
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Selecciona una plantilla predefinida para comenzar rápidamente:
      </p>

      {templates.map((template) => {
        const cerText = template.ceremony
          ? `Ceremonia: ${template.ceremony.rows}×${template.ceremony.cols} asientos`
          : null;
        const banqText = template.banquet
          ? `Banquete: ${template.banquet.rows}×${template.banquet.cols} mesas de ${template.banquet.seats}`
          : Array.isArray(template.banquetTables)
            ? `Banquete: ${template.banquetTables.length} mesas`
            : null;
        const info = [cerText, banqText].filter(Boolean).join(' • ');
        return (
          <div
            key={template.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              onApply(template);
              onClose();
            }}
          >
            <h4 className="font-medium">{template.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
            {info && <div className="text-xs text-gray-500">{info}</div>}
          </div>
        );
      })}

      <div className="flex gap-2 pt-4">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default SeatingPlanModals;

// Formulario de fondo calibrado
const BackgroundForm = ({ background, onSave, onClose }) => {
  const [dataUrl, setDataUrl] = React.useState(background?.dataUrl || '');
  const [widthM, setWidthM] = React.useState(background?.widthCm ? background.widthCm / 100 : 18);
  const [opacity, setOpacity] = React.useState(background?.opacity ?? 0.5);

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setDataUrl(String(e.target?.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    const widthCm = Math.max(100, Math.round((parseFloat(widthM) || 18) * 100));
    onSave?.({ dataUrl, widthCm, opacity: Math.max(0, Math.min(1, parseFloat(opacity))) });
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Imagen de fondo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="w-full text-sm"
        />
        {dataUrl && (
          <img
            src={dataUrl}
            alt="preview"
            className="mt-2 max-h-40 object-contain border rounded"
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ancho real (m)</label>
          <input
            type="number"
            min="1"
            max="200"
            step="0.1"
            value={widthM}
            onChange={(e) => setWidthM(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Opacidad</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};

// Formulario de capacidad global
const CapacityForm = ({ onSave, onClose, initialMax = 8 }) => {
  const [max, setMax] = React.useState(initialMax || 8);
  const submit = (e) => {
    e.preventDefault();
    const n = Math.max(1, parseInt(max, 10) || 0);
    onSave?.(n);
    onClose?.();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Máximo invitados por mesa</label>
        <input
          type="number"
          min="1"
          max="100"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};
