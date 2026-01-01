import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import jsPDF from 'jspdf';
export default function DocumentosLegales() {
  const { t } = useTranslation('pages');
  const [form, setForm] = useState({
    tipo: 'consentimiento_imagen',
    nombreNovios: '',
    nombreTercero: '',
    fecha: '',
    lugar: '',
  });
  const [generating, setGenerating] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const generarPDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pad = 20;
      doc.setFontSize(16);
      const title = form.tipo === 'consentimiento_imagen' ?'Consentimiento de uso de imagen' : 'Documento legal';
      doc.text(title, pad, 25);
      doc.setFontSize(11);
      const cuerpo = [
        `En ${form.lugar || '_____'} a ${form.fecha || '_____'}.
`,
        `Yo, ${form.nombreTercero || '_____'}, autorizo a ${form.nombreNovios || '_____'} a utilizar mi imagen/fotograf?as tomadas durante su boda con fines personales y recuerdo del evento.`,
        `Esta autorizaci?n no implica compensaci?n econ?mica alguna y puede revocarse por escrito en cualquier momento.`,
      ].join('\n\n');
      doc.text(cuerpo, pad, 40, { maxWidth: 170 });
      doc.text('Firmado:', pad, 250);
      doc.line(pad, 260, pad + 80, 260);
      doc.save(`${title.replace(/\s+/g,'_')}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">{t('legalDocuments.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('legalDocuments.type')}</label>
            <select name="tipo" value={form.tipo} onChange={onChange} className="w-full border rounded px-3 py-2">
              <option value="consentimiento_imagen">{t('legalDocuments.types.imageConsent')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('legalDocuments.date')}</label>
            <input type="date" name="fecha" value={form.fecha} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('legalDocuments.place')}</label>
            <input name="lugar" value={form.lugar} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('legalDocuments.coupleName')}</label>
            <input name="nombreNovios" value={form.nombreNovios} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder={t('legalDocuments.namePlaceholder')} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">{t('legalDocuments.thirdPartyName')}</label>
            <input name="nombreTercero" value={form.nombreTercero} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder={t('legalDocuments.namePlaceholder')} />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={generarPDF} disabled={generating} className="px-4 py-2  text-white rounded" style={{ backgroundColor: 'var(--color-primary)' }}>
            {generating ? t('legalDocuments.generating') : t('legalDocuments.generate')}
          </button>
        </div>
      </Card>
    </div>
      
    
  );
}


