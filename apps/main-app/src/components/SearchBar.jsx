import React, { useState } from 'react';

import useTranslations from '../hooks/useTranslations';

export default function SearchBar({ onResults, onSearch }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('hashtag');
  const { t } = useTranslations();

  const handleSearch = () => {
    onSearch({ query: q, type });
  };

  return (
    <div className="flex gap-2 mb-4">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border px-2 py-1 rounded"
      >
        <option value="hashtag">{t('searchBar.optionHashtag')}</option>
        <option value="author">{t('searchBar.optionAuthor')}</option>
        <option value="keyword">{t('searchBar.optionKeyword')}</option>
      </select>
      <input
        type="text"
        placeholder={t('searchBar.placeholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border px-2 py-1 flex-grow rounded"
      />
      <button
        onClick={handleSearch}
        className="px-3 py-1 bg-[var(--color-primary)] text-white rounded"
      >
        {t('searchBar.submit')}
      </button>
    </div>
  );
}
