/**
 * SeatingHeaderCompact - Header compacto y minimalista
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Home, Users, ChevronRight } from 'lucide-react';

const Tab = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`
      relative px-4 py-2 text-sm font-medium transition-all
      ${active ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}
    `}
  >
    <span className="flex items-center gap-2">
      {children}
      {count !== undefined && (
        <span
          className={`
          text-xs px-1.5 py-0.5 rounded
          ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
        `}
        >
          {count}
        </span>
      )}
    </span>

    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
    )}
  </button>
);

export default function SeatingHeaderCompact({
  currentTab,
  onTabChange,
  guestCount = 0,
  tableCount = 0,
  ceremonySeats = 0,
  userName = 'Usuario',
  themeToggle = null, // Componente opcional para toggle de tema
}) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Lado izquierdo: Breadcrumb + Tabs */}
        <div className="flex items-center gap-4">
          {/* Breadcrumb compacto */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home size={14} />
            <ChevronRight size={12} />
            <span className="font-medium text-gray-900">Seating Plan</span>
          </div>

          {/* Separador vertical */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Tabs inline */}
          <div className="flex items-center gap-1">
            <Tab
              active={currentTab === 'banquet'}
              onClick={() => onTabChange('banquet')}
              count={tableCount}
            >
              Banquete
            </Tab>
            <Tab
              active={currentTab === 'ceremony'}
              onClick={() => onTabChange('ceremony')}
              count={ceremonySeats}
            >
              Ceremonia
            </Tab>
          </div>
        </div>

        {/* Lado derecho: Stats + Theme + Usuario */}
        <div className="flex items-center gap-6">
          {/* Stats rápidos */}
          <div className="flex items-center gap-2 text-sm">
            <Users size={16} className="text-gray-500" />
            <span className="text-gray-900 font-medium">{guestCount}</span>
            <span className="text-gray-600">invitados</span>
          </div>

          {/* Theme Toggle */}
          {themeToggle && <div className="flex items-center">{themeToggle}</div>}

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-[var(--color-primary)] 
                          flex items-center justify-center text-white text-sm font-medium"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
