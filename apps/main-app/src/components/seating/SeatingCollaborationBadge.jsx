import React from 'react';
import { Users, Edit3, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Badge de Colaboración para Seating Plan
 * Muestra quién está editando/viendo cada elemento
 */
const SeatingCollaborationBadge = ({
  editors = [], // Array de { userId, userName, userColor, action: 'editing'|'viewing' }
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  size = 'md', // 'sm', 'md', 'lg'
  showCount = true,
  maxVisible = 3,
  className = '',
}) => {
  if (!editors || editors.length === 0) return null;

  const positionClasses = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
  };

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  const visibleEditors = editors.slice(0, maxVisible);
  const remainingCount = editors.length - maxVisible;

  // Colores por defecto si no se especifica
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-red-500',
    'bg-indigo-500',
  ];

  const getEditorColor = (editor, index) => {
    return editor.userColor || colors[index % colors.length];
  };

  // Si solo hay un editor, mostrar badge simple
  if (editors.length === 1) {
    const editor = editors[0];
    const isEditing = editor.action === 'editing';
    const Icon = isEditing ? Edit3 : Eye;

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`
          absolute ${positionClasses[position]}
          ${sizeClasses[size]}
          ${getEditorColor(editor, 0)}
          rounded-full
          flex items-center justify-center
          text-white
          shadow-lg
          z-10
          ${className}
        `}
        title={`${editor.userName} - ${isEditing ? 'Editando' : 'Viendo'}`}
      >
        <Icon className="w-3 h-3" />

        {/* Animación de pulso para edición activa */}
        {isEditing && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-inherit" />
        )}
      </motion.div>
    );
  }

  // Múltiples editores - mostrar avatares apilados
  return (
    <div
      className={`
        absolute ${positionClasses[position]}
        flex ${position.includes('right') ? 'flex-row-reverse' : 'flex-row'}
        items-center
        z-10
        ${className}
      `}
    >
      <AnimatePresence>
        {visibleEditors.map((editor, index) => {
          const isEditing = editor.action === 'editing';
          const Icon = isEditing ? Edit3 : Eye;
          const offsetX = position.includes('right') ? -4 * index : 4 * index;

          return (
            <motion.div
              key={editor.userId}
              initial={{ scale: 0, x: 0 }}
              animate={{ scale: 1, x: offsetX }}
              exit={{ scale: 0, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                ${sizeClasses[size]}
                ${getEditorColor(editor, index)}
                rounded-full
                flex items-center justify-center
                text-white
                shadow-lg
                border-2 border-white
                relative
              `}
              title={`${editor.userName} - ${isEditing ? 'Editando' : 'Viendo'}`}
              style={{ zIndex: visibleEditors.length - index }}
            >
              <Icon className="w-3 h-3" />

              {/* Pulso para edición */}
              {isEditing && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-inherit" />
              )}
            </motion.div>
          );
        })}

        {/* Contador de editores adicionales */}
        {showCount && remainingCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`
              ${sizeClasses[size]}
              bg-gray-700
              rounded-full
              flex items-center justify-center
              text-white
              font-semibold
              shadow-lg
              border-2 border-white
            `}
            style={{
              marginLeft: position.includes('right') ? 0 : -8,
              marginRight: position.includes('right') ? -8 : 0,
            }}
            title={`+${remainingCount} más`}
          >
            +{remainingCount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Hook para gestionar estado de colaboración
 * Simula la presencia de usuarios en tiempo real
 */
export const useCollaborationState = (elementId, currentUser) => {
  const [editors, setEditors] = React.useState([]);

  // Aquí se integraría con Firebase Realtime Database o similar
  // Para detectar presencia de otros usuarios

  React.useEffect(() => {
    // TODO: Implementar lógica real de presencia
    // Ejemplo básico:
    // const presenceRef = firebase.database().ref(`seating/${weddingId}/${elementId}/presence`);
    // presenceRef.on('value', (snapshot) => {
    //   const presence = snapshot.val() || {};
    //   setEditors(Object.values(presence).filter(u => u.userId !== currentUser.id));
    // });

    return () => {
      // Cleanup listeners
    };
  }, [elementId, currentUser]);

  const startEditing = () => {
    // TODO: Actualizar presencia en Firebase
    // presenceRef.child(currentUser.id).set({
    //   userId: currentUser.id,
    //   userName: currentUser.name,
    //   userColor: currentUser.color,
    //   action: 'editing',
    //   timestamp: Date.now()
    // });
  };

  const stopEditing = () => {
    // TODO: Remover presencia de Firebase
    // presenceRef.child(currentUser.id).remove();
  };

  return {
    editors,
    startEditing,
    stopEditing,
  };
};

export default SeatingCollaborationBadge;
