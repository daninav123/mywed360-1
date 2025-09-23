import { useRef, useCallback } from 'react';

/**
 * useSeatingHistory
 * Gestiona historial de snapshots por pestaña (ceremony / banquet) con límite de 50.
 * Devuelve pushHistory, undo y redo.
 */
export default function useSeatingHistory(tab, setTablesCeremony, setTablesBanquet) {
  const historyRef = useRef({ ceremony: [], banquet: [] });
  const pointerRef = useRef({ ceremony: -1, banquet: -1 });

  const pushHistory = useCallback(
    (snapshot) => {
      const key = tab;
      const hist = historyRef.current[key];
      const ptr = pointerRef.current[key] + 1;
      historyRef.current[key] = [...hist.slice(0, ptr), JSON.parse(JSON.stringify(snapshot))].slice(
        -50
      );
      pointerRef.current[key] = Math.min(49, hist.slice(0, ptr).length);
    },
    [tab]
  );

  const undo = useCallback(() => {
    const key = tab;
    const ptr = pointerRef.current[key];
    if (ptr > 0) {
      pointerRef.current[key] = ptr - 1;
      const snapshot = historyRef.current[key][ptr - 1];
      key === 'ceremony' ? setTablesCeremony(snapshot) : setTablesBanquet(snapshot);
    }
  }, [tab, setTablesCeremony, setTablesBanquet]);

  const redo = useCallback(() => {
    const key = tab;
    const hist = historyRef.current[key];
    const ptr = pointerRef.current[key];
    if (ptr < hist.length - 1) {
      pointerRef.current[key] = ptr + 1;
      const snapshot = hist[ptr + 1];
      key === 'ceremony' ? setTablesCeremony(snapshot) : setTablesBanquet(snapshot);
    }
  }, [tab, setTablesCeremony, setTablesBanquet]);

  return { pushHistory, undo, redo };
}
