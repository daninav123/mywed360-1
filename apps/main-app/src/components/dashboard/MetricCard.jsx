import React from 'react';
import { Card } from '../ui/Card';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  color = 'bg-amber-50',
  bgColor,
  textColor = 'text-amber-800',
  valueColor = 'text-amber-600',
  accentColor = 'bg-amber-300',
  children 
}) {
  const cardStyle = bgColor ? {
    backgroundColor: bgColor,
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #EEF2F7',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  } : {};

  const accentStyle = typeof accentColor === 'string' && accentColor.startsWith('#') ? {
    backgroundColor: accentColor,
  } : {};

  const titleStyle = typeof textColor === 'string' && textColor.startsWith('#') ? {
    color: textColor,
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
  } : {};

  return (
    <Card className={bgColor ? '' : `${color} p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden`} style={cardStyle}>
      <div className={bgColor ? 'absolute bottom-0 left-0 right-0 h-1' : `absolute bottom-0 left-0 right-0 h-1 ${accentColor}`} style={{...accentStyle, height: '4px', opacity: 0.6}} />
      <div className="space-y-1">
        <h3 className={bgColor ? '' : `text-xs font-semibold ${textColor} opacity-70 uppercase tracking-wide`} style={titleStyle}>{title}</h3>
        {children || (
          <>
            <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
            {subtitle && (
              <p className={`text-xs ${textColor} opacity-70`}>{subtitle}</p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
