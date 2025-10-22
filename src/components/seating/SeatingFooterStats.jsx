/**
 * SeatingFooterStats - Footer con estadísticas y CTAs principales
 */
import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Table, 
  AlertTriangle, 
  Sparkles, 
  Download,
  TrendingUp,
} from 'lucide-react';

const Stat = ({ icon: Icon, value, label, color = 'gray', trend }) => {
  const colors = {
    green: 'text-green-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
    gray: 'text-gray-400',
  };

  return (
    <div className="flex items-center gap-2 group cursor-default">
      <Icon size={16} className={colors[color]} />
      <span className="text-white font-semibold">{value}</span>
      <span className="text-gray-400 text-sm">{label}</span>
      
      {trend && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 text-xs text-green-500"
        >
          <TrendingUp size={12} />
          <span>+{trend}%</span>
        </motion.div>
      )}
    </div>
  );
};

const Button = ({ 
  children, 
  variant = 'secondary', 
  icon: Icon, 
  onClick,
  loading = false,
}) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200
        flex items-center gap-2
        ${variants[variant]}
        ${loading ? 'opacity-60 cursor-wait' : ''}
      `}
    >
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  );
};

export default function SeatingFooterStats({
  assignedPercentage = 0,
  totalGuests = 0,
  assignedGuests = 0,
  tableCount = 0,
  conflictCount = 0,
  onAutoAssign,
  onExport,
  autoAssignLoading = false,
}) {
  const getAssignmentColor = () => {
    if (assignedPercentage >= 95) return 'green';
    if (assignedPercentage >= 70) return 'blue';
    if (assignedPercentage >= 40) return 'amber';
    return 'red';
  };

  const getTrend = () => {
    // Simular tendencia basada en porcentaje
    if (assignedPercentage > 50) return Math.floor(assignedPercentage / 10);
    return null;
  };

  return (
    <footer className="h-14 border-t border-white/10 bg-[#0F0F10]/95 backdrop-blur-xl
                       flex items-center justify-between px-6 relative z-40">
      {/* Estadísticas */}
      <div className="flex items-center gap-8">
        <Stat
          icon={CheckCircle2}
          value={`${assignedPercentage}%`}
          label={`asignados (${assignedGuests}/${totalGuests})`}
          color={getAssignmentColor()}
          trend={getTrend()}
        />
        
        <Stat
          icon={Table}
          value={tableCount}
          label="mesas"
          color="blue"
        />
        
        {conflictCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Stat
              icon={AlertTriangle}
              value={conflictCount}
              label="conflictos"
              color="amber"
            />
          </motion.div>
        )}
      </div>

      {/* CTAs Principales */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={Download} onClick={onExport}>
          Exportar
        </Button>
        
        <Button 
          variant="primary" 
          icon={Sparkles} 
          onClick={onAutoAssign}
          loading={autoAssignLoading}
        >
          {autoAssignLoading ? 'Asignando...' : 'Auto-IA'}
        </Button>
      </div>

      {/* Progress bar sutil */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${assignedPercentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${
            assignedPercentage >= 95 ? 'bg-green-500' :
            assignedPercentage >= 70 ? 'bg-blue-500' :
            assignedPercentage >= 40 ? 'bg-amber-500' :
            'bg-red-500'
          }`}
        />
      </div>
    </footer>
  );
}
