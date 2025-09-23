import { useWeddingCollection } from './useWeddingCollection';
import { useWedding } from '../context/WeddingContext';

/**
 * Simplificado: este hook siempre trabaja contra weddings/{weddingId}/{collectionName}.
 * Evita condiciones que rompen el orden de hooks cuando cambia activeWedding.
 */
export const useFirestoreCollection = (collectionName, weddingIdOrFallback, maybeFallback) => {
  const { activeWedding } = useWedding();
  const inferredFallback = Array.isArray(weddingIdOrFallback)
    ? weddingIdOrFallback
    : Array.isArray(maybeFallback)
    ? maybeFallback
    : [];
  const weddingId = typeof weddingIdOrFallback === 'string' && weddingIdOrFallback
    ? weddingIdOrFallback
    : activeWedding;
  // useWeddingCollection gestiona fallback/localStorage cuando no hay weddingId aún
  return useWeddingCollection(collectionName, weddingId, inferredFallback);
};
