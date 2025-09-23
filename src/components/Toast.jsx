import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor =
    {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500',
    }[type] || 'bg-gray-500';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded shadow-lg`}
    >
      {message}
    </div>
  );
}
