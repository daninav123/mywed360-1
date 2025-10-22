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
      ${active 
        ? 'text-white' 
        : 'text-gray-400 hover:text-gray-300'
      }
    `}
  >
    <span className="flex items-center gap-2">
      {children}
      {count !== undefined && (
        <span className={`
          text-xs px-1.5 py-0.5 rounded
          ${active ? 'bg-white/20' : 'bg-white/10'}
        `}>
          {count}
        </span>
      )}
    </span>
    
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
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
}) {
  return (
    <header className="h-14 border-b border-white/10 bg-[#0F0F10]/95 backdrop-blur-xl
                       flex items-center justify-between px-6 relative z-40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Home size={16} />
        <ChevronRight size={14} />
        <span className="text-white font-medium">Seating Plan</span>
      </div>

      {/* Tabs Centro */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 
                      bg-white/5 rounded-lg p-1">
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

      {/* Stats + Usuario */}
      <div className="flex items-center gap-6">
        {/* Stats rápidos */}
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-gray-400" />
          <span className="text-gray-300 font-medium">{guestCount}</span>
          <span className="text-gray-500">invitados</span>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 
                          flex items-center justify-center text-white text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
