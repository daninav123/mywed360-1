import React from 'react';

/**
 * DefaultAvatar: fallback avatar icon when no user image is available.
 * Accepts className and onClick for styling and click handling.
 */
export default function DefaultAvatar({ className = '', onClick }) {
  return (
    <svg
      onClick={onClick}
      className={`${className} rounded-full bg-gray-200 p-1`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z" />
    </svg>
  );
}
