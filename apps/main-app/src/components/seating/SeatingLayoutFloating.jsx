/**
 * SeatingLayoutFloating - Layout principal con diseño flotante moderno
 * Wrapper que integra todos los componentes del rediseño
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function SeatingLayoutFloating({ children, className = '' }) {
  return (
    <div className="fixed inset-0 bg-[#0F0F10] overflow-hidden flex flex-col">
      {children}
    </div>
  );
}

// Sub-componentes para estructura
SeatingLayoutFloating.Header = function Header({ children }) {
  return children;
};

SeatingLayoutFloating.Main = function Main({ children }) {
  return (
    <main className="flex-1 relative overflow-hidden">
      {children}
    </main>
  );
};

SeatingLayoutFloating.Footer = function Footer({ children }) {
  return children;
};

SeatingLayoutFloating.Canvas = function Canvas({ children, className = '' }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      {children}
    </div>
  );
};

SeatingLayoutFloating.Overlay = function Overlay({ children, position = 'center' }) {
  const positions = {
    center: 'inset-0 flex items-center justify-center',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`absolute ${positions[position]} pointer-events-none z-20`}>
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>
  );
};
