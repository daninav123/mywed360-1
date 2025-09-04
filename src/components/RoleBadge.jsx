import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function RoleBadge() {
  // Nuevo sistema unificado
  const { hasRole, userProfile } = useAuth();
  
  // Usar el nuevo sistema para verificaciones de rol
  const role = userProfile?.role;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000); // Ocultar tras 5 s
    return () => clearTimeout(timer);
  }, []);

  if (!role || !visible) return null;

  const roleLabelMap = {
    owner: 'Pareja',
    planner: 'Wedding Planner',
    assistant: 'Ayudante',
  };

  return (
    <div className="fixed bottom-24 right-4 z-60">
      <div className="bg-rose-600 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
        Rol actual: {roleLabelMap[role] || role}
      </div>
    </div>
  );
}
