/**
 * ConfettiCelebration - Animación de confetti al 100% asignación
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Confetto = ({ index, windowWidth, windowHeight }) => {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const startX = Math.random() * windowWidth;
  const endX = startX + (Math.random() - 0.5) * 200;
  const rotation = Math.random() * 720 - 360;
  const duration = 2 + Math.random() * 2;
  const delay = Math.random() * 0.5;

  return (
    <motion.div
      initial={{
        x: startX,
        y: -20,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        x: endX,
        y: windowHeight + 20,
        rotate: rotation,
        opacity: 0,
      }}
      transition={{
        duration,
        delay,
        ease: 'easeIn',
      }}
      style={{
        position: 'fixed',
        width: '10px',
        height: '10px',
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default function ConfettiCelebration({ show, onComplete }) {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (show) {
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      }));
      setConfetti(pieces);

      // Limpiar después de la animación
      const timer = setTimeout(() => {
        setConfetti([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {confetti.map((piece) => (
        <Confetto
          key={piece.id}
          index={piece.id}
          windowWidth={piece.windowWidth}
          windowHeight={piece.windowHeight}
        />
      ))}
    </AnimatePresence>
  );
}
