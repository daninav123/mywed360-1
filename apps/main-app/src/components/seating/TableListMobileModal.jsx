/**
 * TableListMobileModal - Modal con vista de lista móvil
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, List } from 'lucide-react';
import TableListMobile from './TableListMobile';

const TableListMobileModal = ({
  isOpen,
  onClose,
  tables = [],
  guests = [],
  onTableClick,
  onAssignGuest,
  onUnassignGuest,
  onEditTable,
  onDeleteTable,
  onDuplicateTable,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex items-center gap-3">
              <List className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Vista de Lista</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            <TableListMobile
              tables={tables}
              guests={guests}
              onTableClick={(tableId) => {
                onTableClick && onTableClick(tableId);
                onClose();
              }}
              onAssignGuest={onAssignGuest}
              onUnassignGuest={onUnassignGuest}
              onEditTable={onEditTable}
              onDeleteTable={onDeleteTable}
              onDuplicateTable={onDuplicateTable}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TableListMobileModal;
