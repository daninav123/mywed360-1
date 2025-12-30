import { useEffect } from 'react';

export function useKeyboardShortcuts(canvasRef, { onUndo, onRedo }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const canvas = canvasRef.current?.getCanvas();
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (activeObject) {
            e.preventDefault();
            canvas.remove(activeObject);
            canvas.renderAll();
          }
          break;

        case 'z':
        case 'Z':
          if (ctrlKey && !e.shiftKey) {
            e.preventDefault();
            if (onUndo) onUndo();
          }
          break;

        case 'y':
        case 'Y':
          if (ctrlKey) {
            e.preventDefault();
            if (onRedo) onRedo();
          }
          break;

        case 'Z':
          if (ctrlKey && e.shiftKey) {
            e.preventDefault();
            if (onRedo) onRedo();
          }
          break;

        case 'c':
        case 'C':
          if (ctrlKey && activeObject) {
            e.preventDefault();
            activeObject.clone((cloned) => {
              window.__clipboardObject = cloned;
            });
          }
          break;

        case 'v':
        case 'V':
          if (ctrlKey && window.__clipboardObject) {
            e.preventDefault();
            window.__clipboardObject.clone((cloned) => {
              cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
              });
              canvas.add(cloned);
              canvas.setActiveObject(cloned);
              canvas.renderAll();
            });
          }
          break;

        case 'd':
        case 'D':
          if (ctrlKey && activeObject) {
            e.preventDefault();
            activeObject.clone((cloned) => {
              cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
              });
              canvas.add(cloned);
              canvas.setActiveObject(cloned);
              canvas.renderAll();
            });
          }
          break;

        case 'ArrowUp':
          if (activeObject) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            activeObject.set('top', activeObject.top - step);
            canvas.renderAll();
          }
          break;

        case 'ArrowDown':
          if (activeObject) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            activeObject.set('top', activeObject.top + step);
            canvas.renderAll();
          }
          break;

        case 'ArrowLeft':
          if (activeObject) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            activeObject.set('left', activeObject.left - step);
            canvas.renderAll();
          }
          break;

        case 'ArrowRight':
          if (activeObject) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            activeObject.set('left', activeObject.left + step);
            canvas.renderAll();
          }
          break;

        case 'a':
        case 'A':
          if (ctrlKey) {
            e.preventDefault();
            canvas.discardActiveObject();
            const sel = canvas.getObjects();
            const activeSelection = canvas.setActiveObject(
              new (canvas.constructor).ActiveSelection(sel, { canvas })
            );
            canvas.requestRenderAll();
          }
          break;

        case 'Escape':
          canvas.discardActiveObject();
          canvas.renderAll();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasRef, onUndo, onRedo]);
}
