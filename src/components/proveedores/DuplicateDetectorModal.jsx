import React, { useMemo, useState } from 'react';
import Modal from '../Modal';
import Button from '../ui/Button';

function normEmail(e){ return (e||'').trim().toLowerCase(); }
function normPhone(p){ return (p||'').replace(/\D/g,''); }
function domain(url){ try{ const u=new URL(url); return u.hostname.replace(/^www\./,''); }catch{ return ''; } }

export default function DuplicateDetectorModal({ open, onClose, providers = [], onMerge }) {
  const groups = useMemo(() => {
    const byEmail = new Map();
    const byPhone = new Map();
    const byDomain = new Map();
    providers.forEach(p => {
      const e = normEmail(p.email);
      const ph = normPhone(p.phone);
      const d = domain(p.link);
      if (e) { const arr = byEmail.get(e)||[]; arr.push(p); byEmail.set(e, arr); }
      if (ph.length >= 6) { const arr = byPhone.get(ph)||[]; arr.push(p); byPhone.set(ph, arr); }
      if (d) { const arr = byDomain.get(d)||[]; arr.push(p); byDomain.set(d, arr); }
    });
    const sets = [];
    for (const map of [byEmail, byPhone, byDomain]) {
      for (const [, arr] of map.entries()) {
        if (arr.length >= 2) sets.push(arr);
      }
    }
    // deduplicate groups by IDs overlap
    const result = [];
    const seen = new Set();
    sets.forEach(g => {
      const ids = g.map(x=>x.id).sort().join('|');
      if (!seen.has(ids)) { seen.add(ids); result.push(g); }
    });
    return result;
  }, [providers]);

  const [merging, setMerging] = useState(false);
  const [primaryByGroup, setPrimaryByGroup] = useState({});

  const handleMerge = async (group, idx) => {
    if (group.length < 2) return;
    if (!confirm(`Unificar ${group.length} fichas?`)) return;
    setMerging(true);
    try {
      const primaryId = primaryByGroup[idx] || group[0].id;
      await onMerge?.(group, primaryId);
    } finally { setMerging(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Posibles duplicados (${groups.length})`}>
      <div className="space-y-4">
        {groups.length === 0 && <p className="text-sm text-gray-600">No se detectan duplicados por email, teléfono o dominio.</p>}
        {groups.map((g, idx) => (
          <div key={idx} className="border rounded p-2">
            <div className="flex flex-wrap gap-2">
              {g.map(p => (
                <label key={p.id} className="px-2 py-1 bg-gray-100 rounded text-sm inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name={`primary_${idx}`}
                    checked={(primaryByGroup[idx] || g[0].id) === p.id}
                    onChange={() => setPrimaryByGroup(prev => ({ ...prev, [idx]: p.id }))}
                  />
                  {p.name} ({p.service})
                </label>
              ))}
            </div>
            <div className="text-right mt-2">
              <Button size="sm" variant="outline" onClick={()=>handleMerge(g, idx)} disabled={merging}>Unificar</Button>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}
