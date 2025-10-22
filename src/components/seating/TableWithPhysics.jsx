/**
 * TableWithPhysics - Mesa con animaciones de física
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function TableWithPhysics({
  table,
  isSelected,
  isDragging,
  onSelect,
  children,
  ...props
}) {
  // Animación de bounce al soltar
  const bounceVariants = {
    idle: {
      scale: 1,
      rotate: 0,
    },
    dragging: {
      scale: 1.05,
      rotate: isDragging ? 2 : 0,
      boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
    },
    dropped: {
      scale: [1.05, 0.95, 1.02, 1],
      rotate: 0,
      boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 17,
      },
    },
    selected: {
      scale: 1.02,
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.5)',
    },
  };

  const currentVariant = isDragging 
    ? 'dragging' 
    : isSelected 
      ? 'selected' 
      : 'idle';

  return (
    <motion.g
      variants={bounceVariants}
      initial="idle"
      animate={currentVariant}
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {children}
    </motion.g>
  );
}
