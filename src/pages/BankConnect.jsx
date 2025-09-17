import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { Card, Button } from '../components/ui';
import { getInstitutions, createRequisition, getRequisition } from '../services/bankConnectService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useTranslations from '../hooks/useTranslations';

export default function BankConnect() {
  const { t } = useTranslations();
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
      setError(t('finance.bank.errorLoad', { defaultValue: 'No se pudieron cargar bancos. Es posible que el backend no tenga habilitada la integración Nordigen o la ruta /api/bank aún no esté desplegada.' }));
    } finally {
      setLoading(false);
    }
  }, [country, t]);

  const handleStart = async () => {
    if (!selectedInstitution) { setError(t('finance.bank.selectBank', { defaultValue: 'Selecciona un banco' })); return; }
    try {
      setError('');
      setLoading(true);
      const ref = await createRequisition(selectedInstitution);
      setRequisition(ref);
      if (ref?.link) window.open(ref.link, '_blank');
    } catch (e) {
      setError(t('finance.bank.errorStart', { defaultValue: 'No se pudo iniciar la vinculación' }));
    } finally { setLoading(false); }
  };

  const handleCheck = async () => {
    if (!requisition?.id) { setError(t('finance.bank.noRequisition', { defaultValue: 'No hay requisición iniciada' })); return; }
    try {
      setError('');
      setLoading(true);
      const info = await getRequisition(requisition.id);
      const accs = Array.isArray(info?.accounts) ? info.accounts : [];
      setAccounts(accs);
    } catch (e) {
      setError(t('finance.bank.errorCheck', { defaultValue: 'No se pudo consultar el estado' }));
    } finally { setLoading(false); }
  };

  const saveAccount = async (accountId) => {
    if (!activeWedding) { setError(t('finance.bank.selectWedding', { defaultValue: 'Selecciona una boda activa' })); return; }
    try {
      const ref = doc(db, 'weddings', activeWedding, 'finance', 'accounts');
      await setDoc(ref, {
        primaryAccountId: accountId,
        updatedAt: serverTimestamp(),
        requisitionId: requisition.id || '',
        institutionId: selectedInstitution,
      }, { merge: true });
      alert(t('finance.bank.linked', { defaultValue: 'Cuenta vinculada' }));
    } catch (e) {
      setError(t('finance.bank.errorSave', { defaultValue: 'No se pudo guardar la cuenta' }));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('finance.bank.title', { defaultValue: 'Vincular cuenta bancaria' })}</h1>
      <Card className="p-4 space-y-4">
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('finance.bank.country', { defaultValue: 'País' })}</label>
            <select value={country} onChange={(e)=>setCountry(e.target.value)} className="border rounded px-2 py-1">
              <option value="ES">{t('finance.bank.countries.es', { defaultValue: 'España' })}</option>
              <option value="FR">{t('finance.bank.countries.fr', { defaultValue: 'Francia' })}</option>
              <option value="DE">{t('finance.bank.countries.de', { defaultValue: 'Alemania' })}</option>
              <option value="IT">{t('finance.bank.countries.it', { defaultValue: 'Italia' })}</option>
              <option value="PT">{t('finance.bank.countries.pt', { defaultValue: 'Portugal' })}</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1">{t('finance.bank.bankLabel', { defaultValue: 'Banco' })}</label>
            <select value={selectedInstitution} onChange={(e)=>setSelectedInstitution(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option value="">{t('finance.bank.selectBankPlaceholder', { defaultValue: 'Selecciona un banco…' })}</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadInstitutions} disabled={loading}>{t('finance.bank.loadBanks', { defaultValue: 'Cargar bancos' })}</Button>
            <Button onClick={handleStart} disabled={loading || !selectedInstitution || institutions.length === 0}>{t('finance.bank.connect', { defaultValue: 'Conectar' })}</Button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-600">
            {error}
            <div className="mt-2 text-xs text-gray-600">
              {t('finance.bank.requirements.title', { defaultValue: 'Requisitos backend:' })}
              <ul className="list-disc list-inside">
                <li>{t('finance.bank.requirements.env', { defaultValue: 'Definir NORDIGEN_SECRET_ID, NORDIGEN_SECRET_KEY y NORDIGEN_BASE_URL' })}</li>
                <li>{t('finance.bank.requirements.route', { defaultValue: 'Backend con ruta /api/bank desplegada' })}</li>
              </ul>
              {t('finance.bank.alternative', { defaultValue: 'Alternativa temporal: importa movimientos manualmente desde Finanzas → Transacciones → "Importar Banco".' })}
            </div>
          </div>
        )}
        {requisition?.id && (
          <div className="flex gap-2 items-center">
            <span className="text-sm">{t('finance.bank.requisition', { defaultValue: 'Requisition:' })} {requisition.id}</span>
            <Button variant="outline" onClick={handleCheck} disabled={loading}>{t('finance.bank.checkStatus', { defaultValue: 'Comprobar estado' })}</Button>
          </div>
        )}
      </Card>

      {accounts.length > 0 && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">{t('finance.bank.availableAccounts', { defaultValue: 'Cuentas disponibles' })}</h2>
          <ul className="divide-y">
            {accounts.map((a) => (
              <li key={a} className="flex items-center justify-between py-2">
                <span className="text-sm">{a}</span>
                <Button size="sm" onClick={() => saveAccount(a)}>{t('finance.bank.useThis', { defaultValue: 'Usar esta cuenta' })}</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
