import { useMemo } from 'react';

import { useWedding } from '../context/WeddingContext';

export default function useWeddingPermissions() {
  const {
    activeWeddingPermissions,
    activeWeddingRole,
    canAccess,
  } = useWedding();

  return useMemo(
    () => ({
      role: activeWeddingRole,
      permissions: activeWeddingPermissions,
      canAccess,
    }),
    [activeWeddingPermissions, activeWeddingRole, canAccess]
  );
}
