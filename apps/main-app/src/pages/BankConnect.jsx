import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

import PageWrapper from '../components/PageWrapper';
import { Card, Button } from '../components/ui';
import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import useTranslations from '../hooks/useTranslations';
import { getInstitutions, createRequisition, getRequisition } from '../services/bankConnectService';

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
      setError(
        t('finance.bank.errorLoad', {
          defaultValue:
            'No se pudieron cargar bancos. Es posible que el backend no tenga habilitada la integracion GoCardless (ex Nordigen) o la ruta /api/bank aun no este desplegada.',
        })
      );
    } finally {
      setLoading(false);
    }
  }, [country, t]);

  const handleStart = async () => {
    if (!selectedInstitution) {
      setError(t('finance.bank.selectBank', { defaultValue: 'Selecciona un banco' }));
      return;
    }
    try {
      setError('');
      setLoading(true);
      const ref = await createRequisition(selectedInstitution);
      setRequisition(ref);
      if (ref?.link) window.open(ref.link, '_blank');
    } catch (e) {
      setError(t('finance.bank.errorStart', { defaultValue: 'No se pudo iniciar la vinculacion' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!requisition?.id) {
      setError(t('finance.bank.noRequisition', { defaultValue: 'No hay requisicion iniciada' }));
      return;
    }
    try {
      setError('');
      setLoading(true);
      const info = await getRequisition(requisition.id);
      const accs = Array.isArray(info?.accounts) ? info.accounts : [];
      setAccounts(accs);
    } catch (e) {
      setError(t('finance.bank.errorCheck', { defaultValue: 'No se pudo consultar el estado' }));
    } finally {
      setLoading(false);
    }
  };

  const saveAccount = async (accountId) => {
    if (!activeWedding) {
      setError(t('finance.bank.selectWedding', { defaultValue: 'Selecciona una boda activa' }));
      return;
    }
    try {
      const ref = doc(db, 'weddings', activeWedding, 'finance', 'accounts');
      await setDoc(
        ref,
        {
          primaryAccountId: accountId,
          updatedAt: serverTimestamp(),
          requisitionId: requisition.id || '',
          institutionId: selectedInstitution,
        },
        { merge: true }
      );
      alert(t('finance.bank.linked', { defaultValue: 'Cuenta vinculada' }));
    } catch (e) {
      setError(t('finance.bank.errorSave', { defaultValue: 'No se pudo guardar la cuenta' }));
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  const hasAccounts = useMemo(() => accounts.length > 0, [accounts]);

  return (
    <PageWrapper
      title={t('finance.bank.title', { defaultValue: 'Vincular cuenta bancaria' })}
      className="layout-container max-w-3xl space-y-6"
    >
      <Card className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <div className="w-full md:w-36">
            <label className="mb-1 block text-sm font-medium text-[color:var(--color-muted)]">
              {t('finance.bank.country', { defaultValue: 'Pais' })}
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            >
              <option value="ES">
                {t('finance.bank.countries.es', { defaultValue: 'Espana' })}
              </option>
              <option value="FR">
                {t('finance.bank.countries.fr', { defaultValue: 'Francia' })}
              </option>
              <option value="DE">
                {t('finance.bank.countries.de', { defaultValue: 'Alemania' })}
              </option>
              <option value="IT">
                {t('finance.bank.countries.it', { defaultValue: 'Italia' })}
              </option>
              <option value="PT">
                {t('finance.bank.countries.pt', { defaultValue: 'Portugal' })}
              </option>
            </select>
          </div>

          <div className="w-full flex-1">
            <label className="mb-1 block text-sm font-medium text-[color:var(--color-muted)]">
              {t('finance.bank.bankLabel', { defaultValue: 'Banco' })}
            </label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            >
              <option value="">
                {t('finance.bank.selectBankPlaceholder', { defaultValue: 'Selecciona un banco...' })}
              </option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={loadInstitutions} disabled={loading}>
              {t('finance.bank.loadBanks', { defaultValue: 'Cargar bancos' })}
            </Button>
            <Button
              onClick={handleStart}
              disabled={loading || !selectedInstitution || institutions.length === 0}
            >
              {t('finance.bank.connect', { defaultValue: 'Conectar' })}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[color:var(--color-danger-40)] bg-[color:var(--color-danger-10)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
            {error}
            <div className="mt-3 space-y-2 text-xs text-[color:var(--color-muted)]">
              <p className="font-medium">
                {t('finance.bank.requirements.title', { defaultValue: 'Requisitos backend:' })}
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  {t('finance.bank.requirements.env', {
                    defaultValue:
                      'Definir NORDIGEN_SECRET_ID, NORDIGEN_SECRET_KEY y NORDIGEN_BASE_URL',
                  })}
                </li>
                <li>
                  {t('finance.bank.requirements.route', {
                    defaultValue: 'Backend con ruta /api/bank desplegada',
                  })}
                </li>
              </ul>
              <p>
                {t('finance.bank.alternative', {
                  defaultValue:
                    'Alternativa temporal: importa movimientos manualmente desde Finanzas -> Transacciones -> "Importar Banco".',
                })}
              </p>
            </div>
          </div>
        )}

        {requisition?.id && (
          <div className="flex flex-col gap-2 rounded-lg border border-[color:var(--color-border-70)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-text)] md:flex-row md:items-center md:justify-between">
            <span>
              {t('finance.bank.requisition', { defaultValue: 'Requisition:' })} {requisition.id}
            </span>
            <Button variant="outline" onClick={handleCheck} disabled={loading}>
              {t('finance.bank.checkStatus', { defaultValue: 'Comprobar estado' })}
            </Button>
          </div>
        )}
      </Card>

      {hasAccounts && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
            {t('finance.bank.availableAccounts', { defaultValue: 'Cuentas disponibles' })}
          </h2>
          <ul className="divide-y divide-[color:var(--color-border)]">
            {accounts.map((account) => (
              <li
                key={account}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-[color:var(--color-text)]">{account}</span>
                <Button size="sm" onClick={() => saveAccount(account)}>
                  {t('finance.bank.useThis', { defaultValue: 'Usar esta cuenta' })}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageWrapper>
  );
}
