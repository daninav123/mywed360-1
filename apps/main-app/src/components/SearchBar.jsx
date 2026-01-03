import React, { useState } from 'react';
import { Search } from 'lucide-react';

import useTranslations from '../hooks/useTranslations';

export default function SearchBar({ onResults, onSearch }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('hashtag');
  const { t } = useTranslations();

  const handleSearch = () => {
    onSearch({ query: q, type });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div 
      className="flex gap-3 mb-6"
      style={{
        backgroundColor: '#FFFFFF',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid #F3F4F6',
      }}
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          padding: '10px 14px',
          paddingRight: '32px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          color: '#374151',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#F8A5B7';
          e.currentTarget.style.backgroundColor = '#FFFFFF';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.backgroundColor = '#F9FAFB';
        }}
      >
        <option value="hashtag">{t('searchBar.optionHashtag')}</option>
        <option value="author">{t('searchBar.optionAuthor')}</option>
        <option value="keyword">{t('searchBar.optionKeyword')}</option>
      </select>
      
      <div className="flex-grow relative">
        <input
          type="text"
          placeholder={t('searchBar.placeholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: 400,
            padding: '10px 14px 10px 40px',
            width: '100%',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            color: '#1F2937',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#F8A5B7';
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(248, 165, 183, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.backgroundColor = '#F9FAFB';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          size={18}
          style={{ color: '#9CA3AF' }}
        />
      </div>
      
      <button
        onClick={handleSearch}
        style={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          padding: '10px 24px',
          borderRadius: '10px',
          border: 'none',
          backgroundColor: '#F8A5B7',
          color: '#FFFFFF',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(248, 165, 183, 0.3)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F68FA8';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(248, 165, 183, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#F8A5B7';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(248, 165, 183, 0.3)';
        }}
      >
        {t('searchBar.submit')}
      </button>
    </div>
  );
}
