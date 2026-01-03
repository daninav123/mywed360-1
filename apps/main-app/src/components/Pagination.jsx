import React from 'react';
import useTranslations from '../hooks/useTranslations';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const { t } = useTranslations();
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t('pagination')}>
      <ul className="inline-flex -space-x-px">
        <li>
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1 border bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {t('previous')}
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, i) => (
          <li key={i}>
            <button
              onClick={() => onPageChange(i + 1)}
              className={`px-3 py-1 border bg-white hover:bg-gray-100 ${currentPage === i + 1 ? 'bg-gray-200' : ''}`}
            >
              {i + 1}
            </button>
          </li>
        ))}
        <li>
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1 border bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {t('next')}
          </button>
        </li>
      </ul>
    </nav>
  );
}
