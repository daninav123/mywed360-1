import React from 'react';

export default function Avatar({ email, unread }) {
  const ch = (email || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${unread ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
      <span className="text-xs font-semibold">{ch}</span>
    </div>
  );
}

