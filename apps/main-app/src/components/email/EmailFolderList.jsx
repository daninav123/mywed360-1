import { Folder, Plus } from 'lucide-react';
import React, { useState } from 'react';

import Button from '../Button';

/**
 * Lista de carpetas de correo con drag & drop para reordenar.
 * 
 * Props esperadas:
 * - folders: Array<{ id, name, systemFolder, count }>
 * - selectedFolder: string
 * - onSelectFolder: (id) => void
 * - onCreateFolder: () => void
 * - onDeleteFolder: (id) => void
 * - onReorderFolders: (reorderedFolders) => void
 * - onMoveEmailToFolder: (emailId, folderId) => void
 */
const EmailFolderList = ({
  folders = [],
  selectedFolder = '',
  onSelectFolder = () => {},
  onCreateFolder = () => {},
  onDeleteFolder = () => {},
  onReorderFolders = () => {},
  onMoveEmailToFolder = () => {},
}) => {
  const [draggedFolder, setDraggedFolder] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);

  const handleDragStart = (e, folder) => {
    if (folder.systemFolder) return; // No permitir drag de carpetas del sistema
    setDraggedFolder(folder);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/folder', folder.id);
  };

  const handleDragOver = (e, folder) => {
    e.preventDefault();
    if (draggedFolder && draggedFolder.id !== folder.id) {
      setDragOverFolder(folder.id);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e, targetFolder) => {
    e.preventDefault();
    
    if (draggedFolder && draggedFolder.id !== targetFolder.id) {
      // Reordenar carpetas
      const newFolders = [...folders];
      const dragIndex = newFolders.findIndex(f => f.id === draggedFolder.id);
      const dropIndex = newFolders.findIndex(f => f.id === targetFolder.id);
      
      if (dragIndex !== -1 && dropIndex !== -1) {
        const [removed] = newFolders.splice(dragIndex, 1);
        newFolders.splice(dropIndex, 0, removed);
        onReorderFolders(newFolders);
      }
    }
    
    setDraggedFolder(null);
    setDragOverFolder(null);
  };

  const handleDragEnd = () => {
    setDraggedFolder(null);
    setDragOverFolder(null);
  };

  return (
    <nav aria-label="Carpetas de correo" className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-medium text-gray-700">Carpetas</h2>
        <Button
          size="xs"
          variant="ghost"
          onClick={onCreateFolder}
          aria-label="Nueva carpeta"
          className="flex items-center space-x-1"
        >
          <Plus size={14} />
          <span className="sr-only sm:not-sr-only sm:inline">Nueva carpeta</span>
        </Button>
      </div>

      <ul role="list" className="space-y-1">
        {folders.map((folder) => {
          const isDragging = draggedFolder?.id === folder.id;
          const isDropTarget = dragOverFolder === folder.id;
          
          return (
            <li 
              key={folder.id}
              draggable={!folder.systemFolder}
              onDragStart={(e) => handleDragStart(e, folder)}
              onDragOver={(e) => handleDragOver(e, folder)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder)}
              onDragEnd={handleDragEnd}
              className={`${isDragging ? 'opacity-50' : ''} ${isDropTarget ? 'border-2 border-blue-400 border-dashed rounded' : ''}`}
            >
              <button
                type="button"
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full text-left px-2 py-1 rounded flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                } ${!folder.systemFolder ? 'cursor-move' : ''}`}
                aria-current={selectedFolder === folder.id ? 'true' : undefined}
                title={!folder.systemFolder ? 'Arrastrar para reordenar' : undefined}
              >
                <span
                  className="flex items-center space-x-2 truncate"
                  aria-current={selectedFolder === folder.id ? 'true' : undefined}
                >
                  <Folder size={14} />
                  <span className="truncate">{folder.name}</span>
                </span>
                {typeof folder.count === 'number' && folder.count > 0 && (
                  <span className="text-xs text-gray-600">{folder.count}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default EmailFolderList;
