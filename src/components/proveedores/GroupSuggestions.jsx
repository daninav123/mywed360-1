import React, { useMemo } from 'react';

import Modal from '../Modal';
import Button from '../ui/Button';
import useTranslations from '../../hooks/useTranslations';

const STOPWORDS = new Set([
  'y',
  'de',
  'la',
  'el',
  'los',
  'las',
  'para',
  'con',
  'sin',
  'del',
  'al',
  'un',
  'una',
  'unos',
  'unas',
  'por',
  'en',
  'incluye',
  'incluyen',
  'pack',
  'paquete',
  'oferta',
  'promocion',
  'promoción',
  'servicio',
  'servicios',
  'precio',
  'precios',
  'equipo',
  'equipos',
  'material',
  'materiales',
  'evento',
  'eventos',
  'boda',
  'bodas',
]);

function tokenize(text = '') {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-záéíóúñ0-9+\s]/gi, ' ')
    .split(/\s+|,|\+|\by\b|\/|&/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function findOverlaps(budgetsBySupplier) {
  const byWord = new Map();
  const entries = Object.entries(budgetsBySupplier || {});
  for (const [sid, items] of entries) {
    for (const b of items || []) {
      const words = tokenize(b.description || '');
      const uniq = Array.from(new Set(words));
      uniq.forEach((w) => {
        const arr = byWord.get(w) || [];
        arr.push({ supplierId: sid, budgetId: b.id });
        byWord.set(w, arr);
      });
    }
  }
  // palabras compartidas por 2+ proveedores
  const shared = Array.from(byWord.entries()).filter(([, arr]) => {
    const sset = new Set(arr.map((x) => x.supplierId));
    return sset.size >= 2;
  });
  return shared.sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0));
}

function detectSplits(budgetsBySupplier) {
  const suggestions = [];
  for (const [sid, items] of Object.entries(budgetsBySupplier || {})) {
    for (const b of items || []) {
      const parts = (b.description || '')
        .split(/\+|,|\by\b/gi)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        suggestions.push({ supplierId: sid, budgetId: b.id, parts });
      }
    }
  }
  return suggestions;
}

function detectOutliers(budgetsBySupplier) {
  const amounts = Object.values(budgetsBySupplier || {})
    .flat()
    .map((b) => Number(b.amount))
    .filter((n) => !isNaN(n) && n > 0);
  if (amounts.length < 3) return [];
  const mean = amounts.reduce((a, c) => a + c, 0) / amounts.length;
  const out = [];
  for (const [sid, items] of Object.entries(budgetsBySupplier || {})) {
    for (const b of items || []) {
      const val = Number(b.amount);
      if (!isNaN(val) && val > mean * 1.5) {
        out.push({ supplierId: sid, budgetId: b.id, amount: val, mean });
      }
    }
  }
  return out;
}

export default function GroupSuggestions({
  open,
  onClose,
  group,
  providers = [],
  budgetsBySupplier = {},
}) {
  const { t } = useTranslations();
  const providerById = useMemo(
    () => Object.fromEntries(providers.map((p) => [p.id, p])),
    [providers]
  );
  const overlaps = useMemo(() => findOverlaps(budgetsBySupplier), [budgetsBySupplier]);
  const splits = useMemo(() => detectSplits(budgetsBySupplier), [budgetsBySupplier]);
  const outliers = useMemo(() => detectOutliers(budgetsBySupplier), [budgetsBySupplier]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('common.suppliers.groupSuggestions.title')}
    >
      <div className="space-y-5">
        <div>
          <h4 className="font-semibold mb-2">
            {t('common.suppliers.groupSuggestions.overlaps.heading')}
          </h4>
          {overlaps.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('common.suppliers.groupSuggestions.overlaps.empty')}
            </p>
          ) : (
            <ul className="list-disc ml-5 space-y-1">
              {overlaps.slice(0, 8).map(([word, occ]) => {
                const suppliersLabel = Array.from(
                  new Set(
                    occ
                      .map((x) => providerById[x.supplierId]?.name || x.supplierId)
                      .filter(Boolean)
                  )
                ).join(', ');
                return (
                  <li key={word} className="text-sm">
                    <mark className="px-1 py-0.5 bg-yellow-200 rounded">{word}</mark>{' '}
                    {t('common.suppliers.groupSuggestions.overlaps.item', {
                      suppliers: suppliersLabel,
                    })}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-2">
            {t('common.suppliers.groupSuggestions.splits.heading')}
          </h4>
          {splits.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('common.suppliers.groupSuggestions.splits.empty')}
            </p>
          ) : (
            <ul className="list-disc ml-5 space-y-1">
              {splits.slice(0, 8).map((sug, idx) => {
                const supplierName = providerById[sug.supplierId]?.name || sug.supplierId;
                const partsLabel = sug.parts.join(' + ');
                return (
                  <li key={idx} className="text-sm">
                    {t('common.suppliers.groupSuggestions.splits.item', {
                      supplier: supplierName,
                      parts: partsLabel,
                    })}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-2">
            {t('common.suppliers.groupSuggestions.outliers.heading')}
          </h4>
          {outliers.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('common.suppliers.groupSuggestions.outliers.empty')}
            </p>
          ) : (
            <ul className="list-disc ml-5 space-y-1">
              {outliers.slice(0, 8).map((o, idx) => {
                const supplierName = providerById[o.supplierId]?.name || o.supplierId;
                const amountLabel = `${o.amount} €`;
                const meanLabel = `${Math.round(o.mean)} €`;
                return (
                  <li key={idx} className="text-sm">
                    {t('common.suppliers.groupSuggestions.outliers.item', {
                      supplier: supplierName,
                      amount: amountLabel,
                      mean: meanLabel,
                    })}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('common.suppliers.groupSuggestions.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
