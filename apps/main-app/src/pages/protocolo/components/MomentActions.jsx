import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Copy,
  FolderPlus,
  MoveRight,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import useTranslations from '../../../hooks/useTranslations';

const MENU_ITEMS = {
  duplicateHere: 'duplicateHere',
  duplicateElse: 'duplicateElse',
  move: 'move',
  delete: 'delete',
};

export default function MomentActions({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDuplicateHere,
  onDuplicateElse,
  onMoveElse,
  onDelete,
}) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const menuItems = useMemo(
    () => [
      {
        id: MENU_ITEMS.duplicateHere,
        icon: Copy,
        label: t('protocol.specialMoments.menu.duplicateHere'),
      },
      {
        id: MENU_ITEMS.duplicateElse,
        icon: FolderPlus,
        label: t('protocol.specialMoments.menu.duplicateElse'),
      },
      {
        id: MENU_ITEMS.move,
        icon: MoveRight,
        label: t('protocol.specialMoments.menu.move'),
      },
      {
        id: MENU_ITEMS.delete,
        icon: Trash2,
        label: t('protocol.specialMoments.menu.delete'),
        tone: 'danger',
      },
    ],
    [t]
  );

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target)) return;
      closeMenu();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open, closeMenu]);

  const actions = useMemo(
    () => ({
      [MENU_ITEMS.duplicateHere]: () => {
        onDuplicateHere?.();
        closeMenu();
      },
      [MENU_ITEMS.duplicateElse]: () => {
        closeMenu();
        onDuplicateElse?.();
      },
      [MENU_ITEMS.move]: () => {
        closeMenu();
        onMoveElse?.();
      },
      [MENU_ITEMS.delete]: () => {
        closeMenu();
        onDelete?.();
      },
    }),
    [closeMenu, onDelete, onDuplicateElse, onDuplicateHere, onMoveElse]
  );

  const handleSelect = useCallback(
    (id) => {
      actions[id]?.();
    },
    [actions]
  );

  return (
    <div className="relative flex flex-col items-end gap-2">
      <div className="flex gap-1">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border    transition hover: hover: disabled:cursor-not-allowed disabled:opacity-40" className="border-default" className="border-default" className="text-muted" className="text-body" className="bg-surface"
            onClick={() => setOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <MoreVertical size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border    transition hover: hover: disabled:pointer-events-none disabled:opacity-40" className="border-default" className="border-default" className="text-muted" className="text-body" className="bg-surface"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title={t('protocol.specialMoments.tooltips.moveUp')}
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border    transition hover: hover: disabled:pointer-events-none disabled:opacity-40" className="border-default" className="border-default" className="text-muted" className="text-body" className="bg-surface"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title={t('protocol.specialMoments.tooltips.moveDown')}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-12 top-0 z-20 w-52 overflow-hidden rounded-md border   shadow-lg" className="border-default" className="bg-surface"
        >
          <ul className="py-1 text-sm " className="text-body">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const tone =
                item.tone === 'danger' ? 'text-red-600 hover:text-red-700' : 'text-gray-600';
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-gray-100 ${tone}`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
