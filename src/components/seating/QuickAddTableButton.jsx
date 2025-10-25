/**
 * QuickAddTableButton - Botón flotante para añadir mesas rápidamente
 * Backup visual en caso de que la toolbar no sea visible
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslations } from '../../hooks/useTranslations';

export default function QuickAddTableButton({

 onAdd, position = 'bottom-right' }) {
  const { t } = useTranslations();

  const positions = {
    'bottom-right': 'bottom-20 right-6',
    'bottom-left': 'bottom-20 left-20',
    'top-right': 'top-20 right-6',
  };

  return (
    <motion.button
      onClick={onAdd}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        fixed ${positions[position]} z-50
        w-14 h-14 rounded-full
        bg-indigo-600 hover:bg-indigo-500
        text-white shadow-2xl shadow-indigo-600/50
        flex items-center justify-center
        transition-all duration-200
      `}
      title={t('common.anadir_mesa')}
    >
      <Plus size={28} strokeWidth={2.5} />
      
      {/* Pulse animation */}
      <motion.span
        className="absolute inset-0 rounded-full bg-indigo-600"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.button>
  );
}
