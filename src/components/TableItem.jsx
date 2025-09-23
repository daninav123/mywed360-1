import React, { useRef, useMemo, useCallback } from 'react';
import { useDrop } from 'react-dnd';

import { ItemTypes } from './GuestItem';

// Basic draggable table (circle or rectangle)
// Helper para obtener primer nombre (máx 8 caracteres)
const firstName = (str = '?') => {
  const first = String(str).trim().split(/\s+/)[0] || '?';
  return first.length > 8 ? first.slice(0, 8) + '…' : first;
};
function TableItem({
  table,
  scale,
  offset,
  containerRef,
  onMove,
  onAssignGuest,
  onAssignGuestSeat,
  onToggleEnabled,
  onOpenConfig,
  onSelect,
  guests = [],
  canMove = true,
  selected = false,
  showNumbers = false,
  danger = false,
  dangerReason = '',
  globalMaxSeats = 0,
  highlightScore = 0,
}) {
  // Decide qué texto mostrar en cada asiento según el nivel de zoom
  const getLabel = useCallback(
    (name = '?') => {
      if (scale >= 1.5) {
        return firstName(name); // nombre (o parte) cuando hay zoom suficiente
      }

      // Iniciales (máx. 2) cuando está alejado
      const initials = String(name)
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
      return initials || '?';
    },
    [scale]
  );
  const ref = useRef(null);

  // drop logic
  const [{ isOver, client }, drop] = useDrop(
    () => ({
      accept: ItemTypes.GUEST,
      canDrop: () => table.enabled !== false && !table.guestId,
      drop: (item, monitor) => {
        const clientOffset = monitor.getClientOffset();
        if (
          clientOffset &&
          typeof onAssignGuestSeat === 'function' &&
          (parseInt(table.seats, 10) || 0) > 0
        ) {
          const seatIdx = computeSeatIndexFromPointer(clientOffset);
          if (Number.isInteger(seatIdx)) return onAssignGuestSeat(table.id, seatIdx, item.id);
        }
        onAssignGuest(table.id, item.id);
      },
      collect: (monitor) => ({ isOver: monitor.isOver(), client: monitor.getClientOffset() }),
    }),
    [table.id]
  );

  const computeSeatIndexFromPointer = (clientOffset) => {
    const rect =
      containerRef?.current?.getBoundingClientRect?.() ||
      (ref.current?.offsetParent || ref.current?.parentElement)?.getBoundingClientRect?.();
    if (!rect) return null;
    const px = clientOffset.x - rect.left;
    const py = clientOffset.y - rect.top;
    const cx = (table.x ?? 0) * scale + (offset?.x ?? 0);
    const cy = (table.y ?? 0) * scale + (offset?.y ?? 0);
    const seats = parseInt(table.seats, 10) || 0;
    if (seats <= 0) return null;
    if (table.shape === 'circle') {
      const ang = Math.atan2(py - cy, px - cx);
      const step = (Math.PI * 2) / seats;
      let idx = Math.round((ang < 0 ? ang + Math.PI * 2 : ang) / step) % seats;
      return idx;
    }
    // rectangular: proyectar a filas superior/inferior
    const width = (table.width || 80) * scale;
    const height = (table.height || table.length || 60) * scale;
    const left = cx - width / 2;
    const top = cy - height / 2;
    const cols = Math.max(1, Math.ceil(seats / 2));
    const relX = Math.max(0, Math.min(1, (px - left) / width));
    const col = Math.min(cols - 1, Math.max(0, Math.round(relX * (cols - 1))));
    const topSide = Math.abs(py - top) < Math.abs(py - (top + height));
    return topSide ? col : cols + col;
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {}
    // Rect del contenedor (canvas) para convertir de viewport a coords locales
    const containerRect = containerRef?.current?.getBoundingClientRect?.() ||
      (ref.current?.offsetParent || ref.current?.parentElement)?.getBoundingClientRect?.() || {
        left: 0,
        top: 0,
      };
    const startLocal = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
    // Centro de la mesa en coordenadas locales (px dentro del canvas)
    const centerLocal = {
      x: (table.x ?? 0) * scale + (offset?.x ?? 0),
      y: (table.y ?? 0) * scale + (offset?.y ?? 0),
    };
    // Vector de agarre en coordenadas de mundo: desde centro de mesa a puntero (local) al inicio
    const grabWorld = {
      dx: (startLocal.x - centerLocal.x) / scale,
      dy: (startLocal.y - centerLocal.y) / scale,
    };
    let lastPos = { x: table.x ?? 0, y: table.y ?? 0 };
    let moved = false;
    const move = (ev) => {
      // Convertir puntero actual a coords locales y luego a mundo
      const local = { x: ev.clientX - containerRect.left, y: ev.clientY - containerRect.top };
      const pointerWorld = {
        x: (local.x - (offset?.x ?? 0)) / scale,
        y: (local.y - (offset?.y ?? 0)) / scale,
      };
      lastPos = { x: pointerWorld.x - grabWorld.dx, y: pointerWorld.y - grabWorld.dy };
      // Mover en vivo, sin resolver ni guardar historial
      onMove(table.id, lastPos, { finalize: false });
      moved = true;
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      // Usar la última posición calculada si hubo movimiento; si no, calcular desde pointerup
      if (moved) {
        onMove(table.id, lastPos, { finalize: true });
      } else {
        // Calcular posición final usando el evento de pointerup por si no hubo pointermove
        const containerRect = containerRef?.current?.getBoundingClientRect?.() ||
          (ref.current?.offsetParent || ref.current?.parentElement)?.getBoundingClientRect?.() || {
            left: 0,
            top: 0,
          };
        const local = { x: ev.clientX - containerRect.left, y: ev.clientY - containerRect.top };
        const pointerWorld = {
          x: (local.x - (offset?.x ?? 0)) / scale,
          y: (local.y - (offset?.y ?? 0)) / scale,
        };
        const finalPos = { x: pointerWorld.x - grabWorld.dx, y: pointerWorld.y - grabWorld.dy };
        // Finalizar movimiento: resolver colisiones y guardar en historial
        onMove(table.id, finalPos, { finalize: true });
      }
      try {
        ref.current?.releasePointerCapture?.(ev.pointerId);
      } catch (_) {}
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Contar invitados asignados considerando acompañantes
  // Total de personas (invitado + acompañantes) asignadas a esta mesa
  const guestCount = useMemo(() => {
    // Conteo desde lista global de invitados (por id o nombre de mesa)
    const countFromGuests = guests.reduce((sum, g) => {
      const matches = (() => {
        if (g.tableId !== undefined && g.tableId !== null) {
          return String(g.tableId) === String(table.id);
        }
        if (g.table !== undefined && g.table !== null && String(g.table).trim() !== '') {
          // puede ser nombre de mesa o número en string
          return (
            String(g.table).trim() === String(table.id) ||
            (table.name && String(g.table).trim() === String(table.name))
          );
        }
        return false;
      })();
      if (!matches) return sum;
      const comp = parseInt(g.companion, 10) || 0;
      return sum + 1 + comp;
    }, 0);
    if (countFromGuests) return countFromGuests;
    // Conteo alternativo para propiedad assignedGuests (banquete)
    if (Array.isArray(table.assignedGuests) && table.assignedGuests.length) {
      return table.assignedGuests.reduce((sum, g) => sum + 1 + (parseInt(g.companion, 10) || 0), 0);
    }
    // Conteo para ceremonia (un solo invitado por mesa)
    return table.guestId ? 1 : 0;
  }, [guests, table.id, table.name, table.assignedGuests, table.guestId]);
  // Lista de invitados asignados a esta mesa (ignoramos acompañantes para las iniciales)
  const guestsList = useMemo(() => {
    // Primero, obtenemos los invitados de la lista global
    const list = guests.filter((g) => {
      if (g.tableId !== undefined && g.tableId !== null) {
        return String(g.tableId) === String(table.id);
      }
      if (g.table !== undefined && g.table !== null && String(g.table).trim() !== '') {
        return (
          String(g.table).trim() === String(table.id) ||
          (table.name && String(g.table).trim() === String(table.name))
        );
      }
      return false;
    });

    // Modo ceremonia: usamos exclusivamente los invitados de la lista global
    // Modo banquete: podemos tener invitados en la propiedad assignedGuests
    if (Array.isArray(table.assignedGuests) && table.assignedGuests.length) {
      // IDs ya presentes para evitar duplicados
      const guestIds = new Set(list.map((g) => g.id).filter(Boolean));

      // Resolvemos cada elemento de assignedGuests:
      //  - Si es string => buscamos el invitado en la lista global por id
      //  - Si ya es objeto => lo usamos tal cual
      const resolvedAssigned = table.assignedGuests.map((ag) => {
        if (ag && typeof ag === 'object') return ag; // ya es invitado completo
        const found = guests.find((g) => String(g.id) === String(ag));
        if (found) return found;
        // Fallback: devolvemos placeholder para contar asiento aunque no tengamos nombre
        return { id: ag };
      });

      // Filtramos duplicados por id
      const uniqueAssignedGuests = resolvedAssigned.filter((g) => !g.id || !guestIds.has(g.id));

      // Combinamos ambas fuentes
      return [...list, ...uniqueAssignedGuests];
    }

    // Sin assignedGuests: devolvemos la lista de invitados por mesa (puede estar vacía)
    return list;
  }, [guests, table.id, table.name, table.assignedGuests]);
  const seatDots = guestsList.length; // mostramos iniciales alrededor
  // Tamaño base: diámetro para circular o ancho/alto para rectangular
  const sizeX = table.shape === 'circle' ? table.diameter || 60 : table.width || 80;
  const sizeY =
    table.shape === 'circle' ? table.diameter || 60 : table.height || table.length || 60;
  const disabled = table.enabled === false;

  const style = {
    position: 'absolute',
    left: (table.x ?? 0) * scale + offset.x - (sizeX * scale) / 2,
    top: (table.y ?? 0) * scale + offset.y - (sizeY * scale) / 2,
    width: sizeX * scale,
    height: sizeY * scale,
    backgroundColor: disabled ? '#e5e7eb' : '#fef3c7',
    border: selected
      ? '3px solid #2563eb'
      : danger
        ? '2px solid #ef4444'
        : highlightScore > 0
          ? '2px solid #10b981'
          : '2px solid #f59e0b',
    borderRadius: table.shape === 'circle' ? '50%' : '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'grab',
    userSelect: 'none',
    boxShadow: selected
      ? '0 0 0 3px rgba(37,99,235,0.25)'
      : highlightScore > 0
        ? '0 0 0 3px rgba(16,185,129,0.25)'
        : 'none',
    transform: `rotate(${table.angle || 0}deg)`,
    transformOrigin: 'center center',
  };

  return (
    <div
      ref={(node) => {
        ref.current = node;
        drop(node);
      }}
      data-testid={`table-item-${table.id}`}
      style={{ ...style, backgroundColor: isOver ? '#d1fae5' : style.backgroundColor }}
      onPointerDown={disabled || !canMove || table.locked ? undefined : handlePointerDown}
      onContextMenu={(e) => {
        e.preventDefault();
        onToggleEnabled(table.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect(table.id, !!e.shiftKey);
      }}
      onDoubleClick={() => onOpenConfig(table)}
      title={danger ? dangerReason || 'Problema de validación' : undefined}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAssignGuest(table.id, null);
        }}
        className="absolute top-0 right-0 text-xs px-1 text-red-600"
      >
        ✖
      </button>
      {/* Contenido central opcional: solo mostramos el número de mesa pequeño */}
      <span style={{ fontSize: 14, fontWeight: 'bold', pointerEvents: 'none', color: '#374151' }}>
        {table.id}
      </span>
      {danger && (
        <div
          className="absolute top-0 left-0 m-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-600 text-white"
          title={dangerReason || 'Problema de validación'}
        >
          !
        </div>
      )}
      {/* Badge de ocupación: invitados contabilizados / capacidad (seats) */}
      {table.seats != null && (
        <div
          className="absolute bottom-0 left-0 m-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
          style={{
            background: (() => {
              const cap = parseInt(table.seats, 10) || globalMaxSeats || 0;
              return cap > 0 && guestCount > cap ? '#ef4444' : '#111827';
            })(),
            color: '#fff',
            opacity: 0.9,
          }}
          title="Ocupación de la mesa"
        >
          {guestCount}/{parseInt(table.seats, 10) || globalMaxSeats || '—'}
        </div>
      )}
      {disabled && <div className="absolute inset-0 bg-white bg-opacity-50 rounded" />}
      {/* seats */}
      {(() => {
        if (seatDots === 0) return null;
        // Función para obtener el primer nombre
        const getFirst = (name = '?') => {
          const first = name.trim().split(/\s+/)[0] || '?';
          return first;
        };
        if (table.shape === 'rectangle') {
          const cols = seatDots > 0 ? Math.ceil(seatDots / 2) : 0;
          return Array.from({ length: seatDots }).map((_, i) => {
            const isTop = i < cols;
            const idx = isTop ? i : i - cols;
            const px = ((sizeX * scale) / (cols + 1)) * (idx + 1);
            const offset = 18 * scale;
            const py = isTop ? -offset : sizeY * scale + offset; // fuera del borde
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  minWidth: 24,
                  width: 'auto',
                  height: 24,
                  background: '#2563eb',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 'bold',
                  left: px - 12,
                  top: py - 12,
                }}
              >
                {getLabel(guestsList[i]?.name || guestsList[i]?.nombre || '')}
              </div>
            );
          });
        }
        const seats = seatDots; // puntos según invitados
        if (seats === 0) return null;
        const centerX = (sizeX * scale) / 2;
        const centerY = (sizeY * scale) / 2;
        return Array.from({ length: seats }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / seats;
          // Radio ligeramente mayor al de la mesa, proporcional al zoom para que siempre quede fuera
          const r = (Math.max(sizeX, sizeY) * scale) / 2 + 30 * scale; // fuera del borde
          const sx = centerX + Math.cos(angle) * r;
          const sy = centerY + Math.sin(angle) * r;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                minWidth: 24,
                width: 'auto',
                height: 24,
                background: '#2563eb',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 10,
                fontWeight: 'bold',
                left: sx - 12,
                top: sy - 12,
              }}
            >
              {getLabel(guestsList[i]?.name || guestsList[i]?.nombre || '')}
            </div>
          );
        });
      })()}

      {/* Numeración de asientos opcional */}
      {showNumbers &&
        table.seats &&
        table.seats > 0 &&
        (() => {
          const seats = table.seats;
          const centerX = (sizeX * scale) / 2;
          const centerY = (sizeY * scale) / 2;
          if (table.shape === 'rectangle') {
            const cols = Math.ceil(seats / 2);
            return Array.from({ length: seats }).map((_, i) => {
              const isTop = i < cols;
              const idx = isTop ? i : i - cols;
              const px = ((sizeX * scale) / (cols + 1)) * (idx + 1);
              const off = 4 * scale;
              const py = isTop ? off : sizeY * scale - off;
              return (
                <div
                  key={`n-${i}`}
                  style={{
                    position: 'absolute',
                    left: px - 6,
                    top: py - 6,
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: '#111827',
                    color: '#fff',
                    fontSize: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.8,
                  }}
                  title={`Asiento ${i + 1}`}
                >
                  {i + 1}
                </div>
              );
            });
          }
          return Array.from({ length: seats }).map((_, i) => {
            const ang = (Math.PI * 2 * i) / seats;
            const r = (Math.max(sizeX, sizeY) * scale) / 2 - 6 * scale;
            const sx = centerX + Math.cos(ang) * r;
            const sy = centerY + Math.sin(ang) * r;
            return (
              <div
                key={`n-${i}`}
                style={{
                  position: 'absolute',
                  left: sx - 6,
                  top: sy - 6,
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: '#111827',
                  color: '#fff',
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                }}
                title={`Asiento ${i + 1}`}
              >
                {i + 1}
              </div>
            );
          });
        })()}
    </div>
  );
}

export default React.memo(TableItem);
