import React, { useEffect, useMemo, useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { Card, Button } from '../components/ui';
import { getInstitutions, createRequisition, getRequisition } from '../services/bankConnectService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function BankConnect() {
  const { activeWedding } = useWedding();
  const [country, setCountry] = useState('ES');
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');
  const [requisition, setRequisition] = useState({ id: '', link: '' });
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [accounts, setAccounts] = useState([]);

  const loadInstitutions = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const list = await getInstitutions(country);
      setInstitutions(list || []);
    } catch (e) {
      // Mostrar mensaje amigable cuando el backend remoto no tenga el router bancario desplegado
      setError('No se pudieron cargar bancos. Es posible que el backend no tenga habilitada la integración Nordigen o la ruta /api/bank aún no esté desplegada.');
    } finally {
      setLoading(false);
    }
  }, [country]);

  const handleStart = async () => {
    if (!selectedInstitution) { setError('Selecciona un banco'); return; }
    try {
      setError('');
      setLoading(true);
      const ref = await createRequisition(selectedInstitution);
      setRequisition(ref);
      if (ref?.link) window.open(ref.link, '_blank');
    } catch (e) {
      setError('No se pudo iniciar la vinculación');
    } finally { setLoading(false); }
  };

  const handleCheck = async () => {
    if (!requisition?.id) { setError('No hay requisición iniciada'); return; }
    try {
      setError('');
      setLoading(true);
      const info = await getRequisition(requisition.id);
      const accs = Array.isArray(info?.accounts) ? info.accounts : [];
      setAccounts(accs);
    } catch (e) {
      setError('No se pudo consultar el estado');
    } finally { setLoading(false); }
  };

  const saveAccount = async (accountId) => {
    if (!activeWedding) { setError('Selecciona una boda activa'); return; }
    try {
      const ref = doc(db, 'weddings', activeWedding, 'finance', 'accounts');
      // Use a fixed doc id to keep a single primary account; or accountId as subfield
      await setDoc(ref, {
        primaryAccountId: accountId,
        updatedAt: serverTimestamp(),
        requisitionId: requisition.id || '',
        institutionId: selectedInstitution,
      }, { merge: true });
      alert('Cuenta vinculada');
    } catch (e) {
      setError('No se pudo guardar la cuenta');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Vincular cuenta bancaria</h1>
      <Card className="p-4 space-y-4">
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-700 mb-1">País</label>
            <select value={country} onChange={(e)=>setCountry(e.target.value)} className="border rounded px-2 py-1">
              <option value="ES">España</option>
              <option value="FR">Francia</option>
              <option value="DE">Alemania</option>
              <option value="IT">Italia</option>
              <option value="PT">Portugal</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1">Banco</label>
            <select value={selectedInstitution} onChange={(e)=>setSelectedInstitution(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option value="">Selecciona un banco…</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadInstitutions} disabled={loading}>Cargar bancos</Button>
            <Button onClick={handleStart} disabled={loading || !selectedInstitution || institutions.length === 0}>Conectar</Button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-600">
            {error}
            <div className="mt-2 text-xs text-gray-600">
              Requisitos backend:
              <ul className="list-disc list-inside">
                <li>Definir NORDIGEN_SECRET_ID, NORDIGEN_SECRET_KEY y NORDIGEN_BASE_URL</li>
                <li>Backend con ruta /api/bank desplegada</li>
              </ul>
              Alternativa temporal: importa movimientos manualmente desde Finanzas → Transacciones → "Importar Banco".
            </div>
          </div>
        )}
        {requisition?.id && (
          <div className="flex gap-2 items-center">
            <span className="text-sm">Requisition: {requisition.id}</span>
            <Button variant="outline" onClick={handleCheck} disabled={loading}>Comprobar estado</Button>
          </div>
        )}
      </Card>

      {accounts.length > 0 && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Cuentas disponibles</h2>
          <ul className="divide-y">
            {accounts.map((a) => (
              <li key={a} className="flex items-center justify-between py-2">
                <span className="text-sm">{a}</span>
                <Button size="sm" onClick={() => saveAccount(a)}>Usar esta cuenta</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
