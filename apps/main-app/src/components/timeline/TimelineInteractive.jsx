import { Check, GripVertical, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const defaultEvents = [
  { id: '1', title: 'Ceremonia', time: '17:00', location: 'Iglesia' },
  { id: '2', title: 'Cóctel', time: '18:30', location: 'Jardines' },
  { id: '3', title: 'Banquete', time: '20:30', location: 'Salón' },
  { id: '4', title: 'Baile', time: '23:00', location: 'Pista' },
];

export default function TimelineInteractive({ events = defaultEvents, onChange }) {
  const [items, setItems] = useState(events);
  const [editingId, setEditingId] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', location: '' });

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const ordered = reorder(items, result.source.index, result.destination.index);
    setItems(ordered);
    onChange && onChange(ordered);
  };

  const saveEdit = (id, field, value) => {
    const updated = items.map((ev) => (ev.id === id ? { ...ev, [field]: value } : ev));
    setItems(updated);
    onChange && onChange(updated);
  };

  const addEvent = () => {
    if (!newEvent.title) return;
    const newItem = { ...newEvent, id: Date.now().toString() };
    const updated = [...items, newItem];
    setItems(updated);
    setNewEvent({ title: '', time: '', location: '' });
    onChange && onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cronograma</h3>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="timeline">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {items.map((ev, index) => (
                <Draggable key={ev.id} draggableId={ev.id} index={index}>
                  {(prov) => (
                    <li
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className="bg-white border p-3 rounded flex items-center gap-2"
                    >
                      <span {...prov.dragHandleProps} className="text-gray-400 cursor-grab">
                        <GripVertical size={14} />
                      </span>
                      {/* Title */}
                      {editingId === ev.id ? (
                        <input
                          autoFocus
                          value={ev.title}
                          onChange={(e) => saveEdit(ev.id, 'title', e.target.value)}
                          onBlur={() => setEditingId(null)}
                          className="border-b flex-1 focus:outline-none text-sm"
                        />
                      ) : (
                        <span
                          className="flex-1 cursor-pointer"
                          onDoubleClick={() => setEditingId(ev.id)}
                        >
                          {ev.title}
                        </span>
                      )}
                      {/* Time */}
                      <input
                        type="time"
                        value={ev.time}
                        onChange={(e) => saveEdit(ev.id, 'time', e.target.value)}
                        className="border rounded px-1 text-xs"
                      />
                      {/* Location */}
                      <input
                        value={ev.location}
                        onChange={(e) => saveEdit(ev.id, 'location', e.target.value)}
                        placeholder="Lugar"
                        className="border rounded px-1 text-xs"
                      />
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      {/* Add new event */}
      <div className="flex gap-2 items-center">
        <input
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          placeholder="Nuevo evento"
          className="border rounded px-2 text-xs flex-1"
        />
        <input
          type="time"
          value={newEvent.time}
          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
          className="border rounded px-1 text-xs"
        />
        <input
          value={newEvent.location}
          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          placeholder="Lugar"
          className="border rounded px-2 text-xs"
        />
        <button onClick={addEvent} className="bg-blue-600 text-white rounded p-1">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
