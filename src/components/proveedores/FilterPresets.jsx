import React, { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import { useWedding } from '../../context/WeddingContext';
import { loadData, saveData } from '../../services/SyncService';

export default function FilterPresets({
  filters, // { searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab, hideGrouped }
  applyFilters // function(newFilters)
}) {
  const { activeWedding } = useWedding();
  const storageKey = useMemo(() => `provider_presets_${activeWedding || 'global'}`, [activeWedding]);
  const [presets, setPresets] = useState([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Intentar Firestore (por boda) y fallback local
        const cloud = await loadData('providerPresets', { docPath: activeWedding ? `weddings/${activeWedding}` : undefined, fallbackToLocal: true });
        if (mounted && Array.isArray(cloud)) {
          setPresets(cloud);
          return;
        }
      } catch {}
      try {
        const raw = localStorage.getItem(storageKey);
        const arr = raw ? JSON.parse(raw) : [];
        if (mounted && Array.isArray(arr)) setPresets(arr);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [storageKey, activeWedding]);

  const save = async () => {
    if (!name.trim()) return;
    const f = { ...filters };
    const next = [...presets.filter(p => p.name !== name.trim()), { name: name.trim(), filters: f }];
    setPresets(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      await saveData('providerPresets', next, { docPath: activeWedding ? `weddings/${activeWedding}` : undefined, showNotification: false });
    } catch {}
    setSelected(name.trim());
  };

  const load = (presetName) => {
    setSelected(presetName);
    const p = presets.find(x => x.name === presetName);
    if (p) applyFilters(p.filters);
  };

  const remove = async () => {
    if (!selected) return;
    const next = presets.filter(p => p.name !== selected);
    setPresets(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      await saveData('providerPresets', next, { docPath: activeWedding ? `weddings/${activeWedding}` : undefined, showNotification: false });
    } catch {}
    setSelected('');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-2">
      <div>
        <label className="block text-xs text-gray-500">Presets</label>
        <select className="border rounded p-2 w-56" value={selected} onChange={(e)=>load(e.target.value)}>
          <option value="">Seleccionar preset</option>
          {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <input className="border rounded p-2" placeholder="Nombre del preset" value={name} onChange={(e)=>setName(e.target.value)} />
        <Button size="sm" variant="outline" onClick={save}>Guardar</Button>
        <Button size="sm" variant="outline" onClick={remove} disabled={!selected}>Borrar</Button>
      </div>
    </div>
  );
}
