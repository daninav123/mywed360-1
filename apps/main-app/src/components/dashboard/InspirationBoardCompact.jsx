import React from 'react';
import { Card } from '../ui/Card';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ExternalImage from '../ExternalImage';
import useTranslations from '../../hooks/useTranslations';

export default function InspirationBoardCompact({ categories = [] }) {
  const { t } = useTranslations();

  const displayCategories = categories.slice(0, 3);

  if (displayCategories.length === 0) {
    return (
      <Card className="p-6 rounded-2xl shadow-sm" style={{ backgroundColor: 'white' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('home2.inspiration.title')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #EEF2F7',
      padding: '24px',
    }}>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          color: '#2D3748',
        }}>
          {t('home2.inspiration.title')}
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {displayCategories.map((category, index) => (
          <Link
            key={index}
            to={`/inspiracion?tag=${encodeURIComponent(category.slug || '')}`}
            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
            style={{ 
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease'
            }}
          >
            <ExternalImage
              src={category.url}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Overlay gradiente para mejor legibilidad */}
            <div 
              className="absolute inset-0 opacity-60 group-hover:opacity-40 transition-opacity duration-300"
              style={{ 
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
              }} 
            />
            {/* Overlay rosa sutil */}
            <div 
              className="absolute inset-0 opacity-20 group-hover:opacity-10 transition-opacity duration-300" 
              style={{ backgroundColor: '#FCE4EC' }} 
            />
            {/* Contenido del texto */}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <div className="flex items-center gap-2">
                <Heart 
                  className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" 
                  style={{ color: '#F8A5B7', fill: '#F8A5B7' }} 
                />
                <p style={{
                  fontFamily: "'DM Sans', 'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  letterSpacing: '0.01em'
                }} className="truncate">{category.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
