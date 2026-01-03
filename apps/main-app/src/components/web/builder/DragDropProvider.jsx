import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/**
 * DragDropProvider - Wrapper para Drag & Drop de secciones
 */
export const DragDropProvider = ({ children, onDragEnd }) => {
  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>;
};

/**
 * DroppableContainer - Contenedor droppable
 */
export const DroppableContainer = ({ droppableId, children, direction = 'vertical' }) => {
  return (
    <Droppable droppableId={droppableId} direction={direction}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300' : ''}
            transition-all duration-200
            rounded-lg
          `}
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

/**
 * DraggableSection - Sección draggable
 */
export const DraggableSection = ({ id, index, children, isDragging }) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            ${snapshot.isDragging ? 'shadow-2xl scale-105 bg-white' : 'shadow-md'}
            transition-all duration-200
            rounded-lg
            mb-4
          `}
        >
          {/* Drag handle */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-t-lg border-b-2 border-gray-200">
            <div className="text-gray-400 cursor-grab active:cursor-grabbing">⋮⋮</div>
            <span className="text-xs font-semibold text-gray-600">Arrastra para reordenar</span>
          </div>

          {/* Content */}
          <div className="p-4">{children}</div>
        </div>
      )}
    </Draggable>
  );
};
