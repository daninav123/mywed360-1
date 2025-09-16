import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import Button from '../../../components/ui/Button';
import AIResultList from './AIResultList';

/**
 * Modal de búsqueda inteligente con filtros integrados
 */
export default function AISearchModal({
  isOpen,
  onClose,
  onSearch,
  onSelect,
  isLoading,
  // Filtros trasladados
  serviceFilter,
  setServiceFilter,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  ratingMin,
  setRatingMin,
  searchTerm,
  setSearchTerm,
  providers = [],
}) {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const uniqueServices = useMemo(() => [...new Set((providers||[]).map(p=>p.service))].filter(Boolean), [providers]);
  const uniqueStatuses = useMemo(() => [...new Set((providers||[]).map(p=>p.status))].filter(Boolean), [providers]);

  useEffect(() => {
    const saved = localStorage.getItem('ai_search_history');
    if (saved) {
      try { setSearchHistory(JSON.parse(saved)); } catch {}
    }
    setSuggestions([
      'Fotógrafo estilo documental',
      'Catering para 120 invitados',
      'DJ disponible en agosto',
      'Floristería vintage en Madrid',
      'Lugar al aire libre cerca de Barcelona'
    ]);
    return () => { if (searchTimeout) clearTimeout(searchTimeout); };
  }, []);

  const saveHistory = useCallback((q) => {
    const next = [q, ...searchHistory.filter(i=>i!==q)].slice(0,10);
    setSearchHistory(next);
    try { localStorage.setItem('ai_search_history', JSON.stringify(next)); } catch {}
  }, [searchHistory]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveHistory(query);
    onSearch?.(query);
  }, [query, saveHistory, onSearch]);

  const handleQueryChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (value.trim().length > 2) {
      const t = setTimeout(() => onSearch?.(value), 500);
      setSearchTimeout(t);
    }
  }, [searchTimeout, onSearch]);

  const selectQuery = (q) => { setQuery(q); saveHistory(q); onSearch?.(q); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e)=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center"><Sparkles size={20} className="mr-2 text-blue-500"/>Búsqueda inteligente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar"><X size={24}/></button>
        </div>

        {/* Buscador y filtros */}
        <div className="p-4 border-b space-y-3">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <input type="text" value={query} onChange={handleQueryChange} placeholder="Describe lo que buscas..." className="w-full p-3 pl-10 pr-24 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" autoFocus/>
              <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
              <Button type="submit" className="absolute right-2 top-1.5" size="sm" disabled={isLoading || !query.trim()}>{isLoading ? 'Buscando...' : 'Buscar'}</Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Ejemplo: "Fotógrafo estilo natural en Sevilla"</p>
          </form>

          {/* Filtros trasladados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Servicio</label>
              <select className="w-full p-2 border rounded" value={serviceFilter} onChange={(e)=>setServiceFilter?.(e.target.value)}>
                <option value="">Todos</option>
                {uniqueServices.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select className="w-full p-2 border rounded" value={statusFilter} onChange={(e)=>setStatusFilter?.(e.target.value)}>
                <option value="">Todos</option>
                {uniqueStatuses.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rating mínimo</label>
              <select className="w-full p-2 border rounded" value={ratingMin} onChange={(e)=>setRatingMin?.(Number(e.target.value))}>
                <option value={0}>Cualquiera</option>
                {[1,2,3,4,5].map(r=> <option key={r} value={r}>{r}+</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde fecha</label>
              <input type="date" className="w-full p-2 border rounded" value={dateFrom} onChange={(e)=>setDateFrom?.(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta fecha</label>
              <input type="date" className="w-full p-2 border rounded" value={dateTo} onChange={(e)=>setDateTo?.(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Búsqueda por texto</label>
              <input type="text" className="w-full p-2 border rounded" value={searchTerm} onChange={(e)=>setSearchTerm?.(e.target.value)} placeholder="Nombre, contacto, estado..." />
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel lateral */}
          <div className="w-64 p-4 border-r overflow-y-auto">
            {searchHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Búsquedas recientes</h3>
                <ul className="space-y-1">
                  {searchHistory.map((item, i) => (
                    <li key={i}><button onClick={()=>selectQuery(item)} className="text-sm text-left w-full p-1.5 hover:bg-gray-100 rounded-md truncate">{item}</button></li>
                  ))}
                  <li><button onClick={()=>{ setSearchHistory([]); localStorage.removeItem('ai_search_history'); }} className="text-xs text-blue-600 hover:text-blue-800 mt-1">Borrar historial</button></li>
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sugerencias</h3>
              <ul className="space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i}><button onClick={()=>selectQuery(s)} className="text-sm text-left w-full p-1.5 hover:bg-gray-100 rounded-md truncate">{s}</button></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Resultados */}
          <div className="flex-1 overflow-y-auto p-4">
            <AIResultList isLoading={isLoading} onSelect={onSelect} query={query} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">Powered by IA</div>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

