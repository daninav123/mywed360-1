import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const GuestCard = ({ guest, index }) => (
  <Draggable draggableId={guest.id} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="bg-white border rounded px-2 py-1 mb-2 shadow-sm text-sm truncate"
      >
        {guest.name || 'Sin nombre'}
      </div>
    )}
  </Draggable>
);

export default function GuestDragBoard({ tables = [], guestsByTable = {}, moveGuest }) {
  // Genera lista de IDs, incluye 'sin-mesa' al inicio
  const droppableIds = ['sin-mesa', ...tables.map((t) => t.name || t.id.toString())];

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const fromTable = source.droppableId === 'sin-mesa' ? '' : source.droppableId;
    const toTable = destination.droppableId === 'sin-mesa' ? '' : destination.droppableId;
    if (fromTable === toTable) return;
    moveGuest(draggableId, toTable);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto py-4">
        {droppableIds.map((droppableId) => (
          <Droppable droppableId={droppableId} key={droppableId}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-w-[200px] bg-gray-50 border rounded p-3 flex-1 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
              >
                <h3 className="text-sm font-semibold mb-2">
                  {droppableId === 'sin-mesa' ? 'Sin mesa' : droppableId}
                </h3>
                {(guestsByTable[droppableId === 'sin-mesa' ? 'sin-mesa' : droppableId] || []).map((guest, idx) => (
                  <GuestCard guest={guest} index={idx} key={guest.id} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
