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
        <option value="hashtag">{t('common.searchBar.optionHashtag')}</option>
        <option value="author">{t('common.searchBar.optionAuthor')}</option>
        <option value="keyword">{t('common.searchBar.optionKeyword')}</option>
      </select>
      <input
        type="text"
        placeholder={t('common.searchBar.placeholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border px-2 py-1 flex-grow rounded"
      />
      <button
        onClick={handleSearch}
        className="px-3 py-1 bg-[var(--color-primary)] text-white rounded"
      >
        {t('common.searchBar.submit')}
      </button>
    </div>
  );
}
