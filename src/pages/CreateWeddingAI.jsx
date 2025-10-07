import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthUnified';
import { createWedding } from '../services/WeddingService';
import { Card } from '../components/ui/Card';

export default function CreateWeddingAI() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    coupleName: '',
    weddingDate: '',
    location: '',
    style: 'cl?sico',
    budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!currentUser?.uid) throw new Error('No autenticado');
      const weddingId = await createWedding(currentUser.uid, {
        name: form.coupleName || 'Mi Boda',
        weddingDate: form.weddingDate || '',
        location: form.location || '',
        preferences: { style: form.style, budget: form.budget },
      });
      navigate(`/bodas/${weddingId}`);
    } catch (err) {
      setError(err?.message || 'Error creando la boda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Crear Boda con IA (beta)</h1>
        <p className="text-sm text-gray-600 mb-4">Se crear?n tareas iniciales autom?ticamente seg?n la fecha seleccionada. Podr?s ajustarlas despu?s.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la pareja</label>
            <input name="coupleName" value={form.coupleName} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Mar?a & Juan" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de la boda</label>
              <input type="date" name="weddingDate" value={form.weddingDate} onChange={onChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ubicaci?n</label>
              <input name="location" value={form.location} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Sevilla, Espa?a" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estilo</label>
              <select name="style" value={form.style} onChange={onChange} className="w-full border rounded px-3 py-2">
                <option value="cl?sico">Cl?sico</option>
                <option value="boho">Boho</option>
                <option value="moderno">Moderno</option>
                <option value="r?stico">R?stico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Presupuesto aproximado</label>
              <input name="budget" value={form.budget} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="15000 ?" />
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ?'Creando?' : 'Crear Boda'}</button>
          </div>
        </form>
      </Card>
    </div>
  );
}


