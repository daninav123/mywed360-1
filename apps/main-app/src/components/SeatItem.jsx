import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';

import { ItemTypes } from './GuestItem';

export default function SeatItem({ seat, scale, offset, onAssignGuest, onToggleEnabled }) {
  const ref = useRef(null);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.GUEST,
    canDrop: () => seat.enabled !== false && !seat.guestId,
    drop: (item) => onAssignGuest(seat.id, item.id),
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  const size = 20 * scale;
  const disabled = seat.enabled === false;
  const style = {
    position: 'absolute',
    left: seat.x * scale + offset.x,
    top: seat.y * scale + offset.y,
    width: size,
    height: size,
    borderRadius: '50%',
    background: disabled ? '#d1d5db' : canDrop && isOver ? '#6ee7b7' : '#a5b4fc',
    border: '1px solid #4b5563',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10 * scale,
    color: '#111827',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <div
      ref={(node) => {
        ref.current = node;
        drop(node);
      }}
      style={style}
      onContextMenu={(e) => {
        e.preventDefault();
        onToggleEnabled(seat.id);
      }}
    >
      {seat.guestId ? '👤' : ''}
    </div>
  );
}
