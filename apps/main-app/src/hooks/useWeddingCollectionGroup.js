/**
 * PostgreSQL version - Returns empty array (collectionGroup not supported)
 * Recommend using specific hooks instead
 */
import { useMemo } from 'react';

export function useWeddingCollectionGroup(groupName, weddingId) {
  return useMemo(() => ({ 
    data: [], 
    loading: false, 
    error: null 
  }), [groupName, weddingId]);
}
