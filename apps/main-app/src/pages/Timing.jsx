import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import useSpecialMoments from '../hooks/useSpecialMoments';

export default function Timing() {
  const { moments, addMoment, updateMoment, removeMoment } = useSpecialMoments();
  const labels = { ceremonia: 'Ceremonia', coctail: 'Cóctel', banquete: 'Banquete', disco: 'Disco' };

  const handleAdd = (key) => {
    const nextOrder = (moments[key]?.length || 0) + 1;
    addMoment(key, { order: nextOrder, title: `Nuevo momento ${nextOrder}`, time: '' });
  };












  

  




  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
      <div className="mx-auto my-8" style={{
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        
        {/* Hero con degradado beige-dorado */}
        <header className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
          padding: '48px 32px 32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #D4A574)',
              }} />
              <h1 style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                fontSize: '40px',
                fontWeight: 400,
                color: '#1F2937',
                letterSpacing: '-0.01em',
                margin: 0,
              }}>Timing</h1>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #D4A574)',
              }} />
            </div>
            <p style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 0,
            }}>Cronograma de Boda</p>
          </div>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6">
          {Object.entries(moments).map(([key, list]) => (
            <div key={key} className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{labels[key] || key}</h3>
                <button onClick={() => handleAdd(key)} className="flex items-center gap-1 text-sm hover:underline" className="text-success">
                  <Plus size={16} /> Añadir
                </button>
              </div>
              <div className="space-y-2">
                {list.map((m) => (
                  <div
                    key={m.id}
                    className="border rounded p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <input
                      value={m.title}
                      onChange={(e) => updateMoment(key, m.id, {title: e.target.value})}
                      className="flex-1 border-b focus:outline-none"
                    />
                    <input
                      value={m.time || ''}
                      onChange={(e) => updateMoment(key, m.id, {time: e.target.value})}
                      placeholder="hh:mm"
                      className="w-24 border-b text-sm focus:outline-none"
                    />
                    <button 
                      className="hover:text-red-800 self-start" 
                      className="text-danger" 
                      onClick={() => removeMoment(key, m.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
