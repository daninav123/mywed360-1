import React from 'react';

/**
 * NotificationCenter (scaffold)
 * - Lista simple, sin datos ni estilos finales
 * - No enlazado en UI por defecto
 */
const NotificationCenter = () => {
  return (
    <div data-dev="notification-center-scaffold">
      <h2 className="text-lg font-semibold">Notification Center (scaffold)</h2>
      <p className="text-sm text-gray-500">Placeholder de notificaciones.</p>
    </div>
  );
};
export default React.memo(NotificationCenter);
