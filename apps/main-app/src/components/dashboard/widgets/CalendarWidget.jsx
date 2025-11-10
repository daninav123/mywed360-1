import React from 'react';

export const CalendarWidget = ({ config }) => {
  const today = new Date();
  const month = today.toLocaleString('es-ES', { month: 'long' });
  const year = today.getFullYear();
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, today.getMonth(), 1).getDay();

  // Create array of days in month
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Add empty cells for days before the first day of the month
  const emptyCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    emptyCells.push(<div key={`empty-${i}`} className="h-8"></div>);
  }

  return (
    <div className="h-full">
      <div className="text-center font-semibold mb-2">
        {month.charAt(0).toUpperCase() + month.slice(1)} {year}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="font-medium text-gray-500">
            {day}
          </div>
        ))}
        {emptyCells}
        {days.map((day) => (
          <div
            key={day}
            className={`h-8 flex items-center justify-center rounded-full ${
              day === today.getDate() ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm">
        <div className="flex items-center mb-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <span>Evento de boda</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span>Reunión con proveedor</span>
        </div>
      </div>
    </div>
  );
};
