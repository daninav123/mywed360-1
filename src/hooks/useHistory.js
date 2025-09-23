import { useState, useCallback } from 'react';

/**
 * Simple history hook for undo/redo.
 * @template T
 * @param {T} initialState
 */
export default function useHistory(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [pointer, setPointer] = useState(0);

  const current = history[pointer];

  const set = useCallback(
    (valueOrUpdater) => {
      setHistory((prevHist) => {
        const base = prevHist.slice(0, pointer + 1);
        const newVal =
          typeof valueOrUpdater === 'function'
            ? valueOrUpdater(base[base.length - 1])
            : valueOrUpdater;
        return [...base, newVal];
      });
      setPointer((p) => p + 1);
    },
    [pointer]
  );

  const undo = useCallback(() => {
    setPointer((p) => (p > 0 ? p - 1 : p));
  }, []);

  const redo = useCallback(() => {
    setPointer((p) => (p < history.length - 1 ? p + 1 : p));
  }, [history.length]);

  return [
    current,
    set,
    { undo, redo, canUndo: pointer > 0, canRedo: pointer < history.length - 1 },
  ];
}
