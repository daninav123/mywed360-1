import { Download } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import { useWedding } from '../../context/WeddingContext';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import useTranslations from '../../hooks/useTranslations';
import { uploadEmailAttachments } from '../../services/storageUploadService';

// Persistencia local de progreso de requisitos por boda
const LEGAL_LS_KEY = (weddingId) => `legalRequirements_${weddingId}`;
function loadLegalProgress(weddingId) {
  try {
    return JSON.parse(localStorage.getItem(LEGAL_LS_KEY(weddingId)) || '{}');
  } catch {
    return {};
  }
}
function saveLegalProgress(weddingId, data) {
  try {
    localStorage.setItem(LEGAL_LS_KEY(weddingId), JSON.stringify(data || {}));
  } catch {}
}

// Requisitos legales informativos para registrar la boda
const LEGAL_REQUIREMENTS = {
  ES: {
    civil: [
      'DNI o Pasaporte vigente de ambos',
      'Certificado literal de nacimiento de ambos',
      'Certificado de empadronamiento (últimos 2 años)',
      'Declaración jurada de estado civil (soltería/divorcio/viudedad)',
      'Sentencia de divorcio o certificado de defunción (si aplica)',
      'Formulario de solicitud/expediente matrimonial del Registro Civil',
      'Testigos con DNI (según registro, el día de la cita)',
    ],
    iglesia: [
      'Certificado de bautismo reciente (expedido en los últimos 6 meses)',
      'Certificado de confirmación (si aplica o dispensa)',
      'Curso prematrimonial (certificado de asistencia)',
      'Fe de soltería eclesiástica (o dispensa correspondiente)',
      'Expediente matrimonial canónico',
      'Dispensa por disparidad de culto o mixta (si aplica)',
    ],
  },
  FR: {
    civil: ['Pièces d’identité', 'Actes de naissance récents'],
    iglesia: ['Certificat de baptême', 'Certificat de confirmation'],
  },
  US: {
    civil: ['ID válidos', 'Solicitud de Marriage License'],
    iglesia: ['Baptismal certificate', 'Pre-Cana course'],
  },
};

// Descargables por región y tipo
const DOWNLOAD_TEMPLATES = {
  ES: {
    civil: [
      {
        id: 'solicitud_expediente_matrimonial',
        title: 'Solicitud de expediente matrimonial',
        desc: 'Modelo genérico para el Registro Civil',
      },
      {
        id: 'declaracion_estado_civil',
        title: 'Declaración jurada de estado civil',
        desc: 'Soltería / divorcio / viudedad',
      },
      {
        id: 'modelo_testigos',
        title: 'Modelo de declaración de testigos',
        desc: 'Aportación de testigos (si el registro lo solicita)',
      },
    ],
    iglesia: [
      {
        id: 'solicitud_expediente_canonico',
        title: 'Solicitud expediente matrimonial canónico',
        desc: 'Modelo tipo para parroquia/diócesis',
      },
      {
        id: 'fe_solteria_eclesiastica',
        title: 'Fe de soltería (modelo)',
        desc: 'Para su parroquia de origen',
      },
      {
        id: 'constancia_curso_prematrimonial',
        title: 'Constancia curso prematrimonial (modelo)',
        desc: 'A completar por la parroquia/centro',
      },
    ],
  },
  FR: {
    civil: [
      {
        id: 'solicitud_expediente_matrimonial',
        title: 'Demande de dossier matrimonial (modèle)',
        desc: 'Modèle générique',
      },
    ],
    iglesia: [
      {
        id: 'solicitud_expediente_canonico',
        title: 'Demande de dossier canonique (modèle)',
        desc: 'Modèle générique',
      },
    ],
  },
  US: {
    civil: [
      {
        id: 'solicitud_expediente_matrimonial',
        title: 'Marriage License Application (template)',
        desc: 'Generic template',
      },
    ],
    iglesia: [
      {
        id: 'solicitud_expediente_canonico',
        title: 'Canonical Marriage Dossier Request (template)',
        desc: 'Generic template',
      },
    ],
  },
};

// Plantillas HTML para .doc / PDF con prefill básico
function generateTemplateHTML(id, region = 'ES', data = {}) {
  const today = new Date().toLocaleDateString();
  const styles = `body{font-family:Calibri,Arial,sans-serif;line-height:1.4;color:#222}h1{font-size:20pt;margin:0 0 6pt}h2{font-size:14pt;margin:14pt 0 6pt}p{margin:6pt 0}ul{margin:6pt 0 6pt 18pt}`;
  const couple = data.couple || '______________________ y ______________________';
  const bride = data.bride || '______________________';
  const groom = data.groom || '______________________';
  const eventDate = data.date || '____/____/______';
  const place = data.place || '______________________';
  const commonHeader = `<h1>Documento</h1><p>Fecha: ${today}</p>`;
  switch (id) {
    case 'solicitud_expediente_matrimonial':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solicitud de expediente</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Solicitud de apertura de expediente matrimonial</h2>
        <p>Registro Civil: ______________________________</p>
        <p>Nosotros, ${couple}, solicitamos la apertura del expediente para contraer matrimonio.</p>
        <p>Adjuntamos la documentación requerida y declaramos que los datos aportados son veraces.</p>
        <p>Lugar del enlace: ${place}. Fecha prevista: ${eventDate}.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firmas:</p>
        <p>${bride} &nbsp;&nbsp;&nbsp;&nbsp; ${groom}</p>
      </body></html>`;
    case 'declaracion_estado_civil':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Declaración estado civil</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Declaración jurada de estado civil</h2>
        <p>Yo, D./Dña. ______________________ con DNI __________, declaro bajo mi responsabilidad que mi estado civil es: __________ (soltero/a, divorciado/a, viudo/a).</p>
        <p>Y para que conste a los efectos oportunos, firmo la presente.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firma: ${bride}</p>
      </body></html>`;
    case 'modelo_testigos':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Declaración de testigos</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Declaración de testigos</h2>
        <p>El/La que suscribe, D./Dña. ______________________ con DNI __________, y D./Dña. ______________________ con DNI __________, DECLARAN conocer a los contrayentes y no tener conocimiento de impedimentos legales para la celebración del matrimonio.</p>
        <p>Contrayentes: ${couple}. Fecha prevista del enlace: ${eventDate}. Lugar: ${place}.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firmas:</p>
        <p>___________________________ &nbsp;&nbsp;&nbsp;&nbsp; ___________________________</p>
      </body></html>`;
    case 'solicitud_expediente_canonico':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solicitud expediente canónico</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Solicitud de apertura de expediente matrimonial canónico</h2>
        <p>Parroquia: ______________________________ &nbsp;&nbsp; Diócesis: ______________________________</p>
        <p>Los contrayentes ${couple} solicitan la apertura del expediente matrimonial canónico.</p>
        <p>Se aportará la documentación requerida por la parroquia y la diócesis.</p>
        <p>Lugar del enlace: ${place}. Fecha prevista: ${eventDate}.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firmas:</p>
        <p>${bride} &nbsp;&nbsp;&nbsp;&nbsp; ${groom}</p>
      </body></html>`;
    case 'fe_solteria_eclesiastica':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fe de soltería</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Fe de soltería (modelo)</h2>
        <p>D./Dña. ______________________ con DNI __________, parroquiano de ______________________, solicita la expedición de Fe de Soltería a efectos matrimoniales.</p>
        <p>En ${place || '______________________'}, a ____ de __________ de ______.</p>
        <p>Firma: ${bride}</p>
      </body></html>`;
    case 'constancia_curso_prematrimonial':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Constancia curso prematrimonial</title><style>${styles}</style></head><body>
        ${commonHeader}
        <h2>Constancia de asistencia a curso prematrimonial (modelo)</h2>
        <p>Se deja constancia de que ${couple} han completado el curso prematrimonial impartido por ______________________ los días ______________________.</p>
        <p>Firma y sello: ___________________________</p>
      </body></html>`;
    default:
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plantilla</title><style>${styles}</style></head><body>${commonHeader}<p>Plantilla gen€)rica.</p></body></html>`;
  }
}

function downloadAsDoc(filename, html) {
  try {
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('No se pudo descargar la plantilla', e);
  }
}

async function downloadAsPdf(filename, html) {
  try {
    const jspdfMod = await import('jspdf');
    // Asegurar html2canvas para doc.html
    try {
      const h2c = await import('html2canvas');
      if (typeof window !== 'undefined') window.html2canvas = h2c.default || h2c;
    } catch {}
    const jsPDF = jspdfMod.default || jspdfMod.jsPDF || jspdfMod;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '800px';
    container.innerHTML = html;
    document.body.appendChild(container);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    await doc.html(container, {
      x: 32,
      y: 32,
      width: 531,
      windowWidth: 800,
      html2canvas: { scale: 0.9 },
    });
    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    container.remove();
  } catch (e) {
    console.warn('No se pudo generar PDF, abriendo impresión como fallback', e);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  }
}

function buildTemplatePrefill(info) {
  const wi = info || {};
  const couple =
    wi.coupleName ||
    wi.couple ||
    wi.brideAndGroom ||
    [wi.bride, wi.groom].filter(Boolean).join(' y ');
  const date = wi.weddingDate || wi.date || wi.ceremonyDate || '';
  const place =
    wi.celebrationPlace || wi.ceremonyLocation || wi.location || wi.place || wi.venue || '';
  const bride = wi.bride || (couple ? couple.split(' y ')[0] : '');
  const groom = wi.groom || (couple ? couple.split(' y ')[1] : '');
  return { couple, date, place, bride, groom };
}

export default function DocumentosLegales() {
  const { activeWedding } = useWedding();
  const { info: weddingInfo } = useActiveWeddingInfo();
  const { t } = useTranslations();
  const tr = (key, def) => {
    try {
      const v = t(key);
      return v === key ? def : v;
    } catch {
      return def;
    }
  };

  const [form, setForm] = useState({ region: 'ES' });
  const [legalType, setLegalType] = useState('civil'); // 'civil' | 'iglesia'
  const [legalProgress, setLegalProgress] = useState({});
  const [uploadingReq, setUploadingReq] = useState({}); // { key: boolean }

  useEffect(() => {
    if (!activeWedding) return;
    setLegalProgress(loadLegalProgress(activeWedding));
  }, [activeWedding]);

  const templatesForSelection = useMemo(() => {
    const byRegion = DOWNLOAD_TEMPLATES[form.region] || DOWNLOAD_TEMPLATES.ES;
    return byRegion[legalType] || [];
  }, [form.region, legalType]);

  return (
    <PageWrapper title="Documentos">
      {!activeWedding && (
        <Card className="p-6">
          <p className="text-gray-700">Selecciona una boda activa para gestionar documentos.</p>
        </Card>
      )}

      {activeWedding && (
        <>
          {/* Requisitos legales */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Requisitos para registrar la boda</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm text-gray-600">Tipo:</label>
                <div className="inline-flex rounded overflow-hidden border">
                  <button
                    className={`${legalType === 'civil' ? 'bg-blue-600 text-white' : 'bg-white'} px-3 py-1 text-sm`}
                    onClick={() => setLegalType('civil')}
                  >
                    Civil / Juzgado
                  </button>
                  <button
                    className={`${legalType === 'iglesia' ? 'bg-blue-600 text-white' : 'bg-white'} px-3 py-1 text-sm`}
                    onClick={() => setLegalType('iglesia')}
                  >
                    Iglesia
                  </button>
                </div>
                <label className="text-sm text-gray-600 ml-2">País:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                >
                  <option value="ES">España</option>
                  <option value="FR">Francia</option>
                  <option value="US">Estados Unidos</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Esta lista es orientativa y puede variar según municipio, Registro Civil o diócesis.
              Confirma siempre con tu oficina/parroquia.
            </p>
            <div className="space-y-2">
              {(LEGAL_REQUIREMENTS[form.region] || LEGAL_REQUIREMENTS.ES)[legalType].map(
                (item, idx) => {
                  const key = `${form.region}.${legalType}.${item}`;
                  const entry = legalProgress[key];
                  const checked = typeof entry === 'object' ? !!entry.done : !!entry;
                  const fileMeta = typeof entry === 'object' ? entry.file : null;
                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = { ...(legalProgress || {}) };
                            const prev = next[key];
                            if (e.target.checked) {
                              next[key] = typeof prev === 'object' ? { ...prev, done: true } : true;
                            } else {
                              if (typeof prev === 'object' && prev.file) {
                                next[key] = { ...prev, done: false };
                              } else {
                                delete next[key];
                              }
                            }
                            setLegalProgress(next);
                            saveLegalProgress(activeWedding, next);
                          }}
                        />
                        <span>{item}</span>
                      </label>
                      <div className="pl-6 flex items-center gap-2 text-xs text-gray-600">
                        <input
                          id={`file-${idx}`}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={async (e) => {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;
                            const upKey = key;
                            setUploadingReq((u) => ({ ...u, [upKey]: true }));
                            try {
                              const uploaded = await uploadEmailAttachments(
                                [f],
                                activeWedding || 'anon',
                                'legal-requirements'
                              );
                              const meta =
                                Array.isArray(uploaded) && uploaded[0]
                                  ? uploaded[0]
                                  : { filename: f.name, size: f.size };
                              const next = { ...(legalProgress || {}) };
                              const prev = next[upKey];
                              next[upKey] =
                                typeof prev === 'object'
                                  ? { ...prev, done: true, file: meta }
                                  : { done: true, file: meta };
                              setLegalProgress(next);
                              saveLegalProgress(activeWedding, next);
                              try {
                                toast.success(tr('documents.uploaded', 'Archivo subido'));
                              } catch {}
                            } catch (err) {
                              console.warn('Upload requirement failed', err);
                              try {
                                toast.error(
                                  tr('documents.uploadFailed', 'No se pudo subir el archivo')
                                );
                              } catch {}
                            } finally {
                              setUploadingReq((u) => ({ ...u, [upKey]: false }));
                              e.target.value = '';
                            }
                          }}
                        />
                        <label
                          htmlFor={`file-${idx}`}
                          className="px-2 py-1 border rounded cursor-pointer hover:bg-gray-50"
                        >
                          {uploadingReq[key]
                            ? 'Subiendo...'
                            : fileMeta
                              ? 'Reemplazar archivo'
                              : 'Subir archivo'}
                        </label>
                        {fileMeta && (
                          <>
                            {fileMeta.url ? (
                              <a
                                href={fileMeta.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                Ver
                              </a>
                            ) : (
                              <span>{fileMeta.filename || 'Archivo'}</span>
                            )}
                            <button
                              className="text-red-600"
                              onClick={async () => {
                                // Intentar borrar del Storage si tenemos URL
                                let storageDeletedOk = true;
                                if (fileMeta.url) {
                                  try {
                                    const {
                                      getStorage,
                                      ref: sRef,
                                      deleteObject,
                                      refFromURL,
                                    } = await import('firebase/storage');
                                    const storage = getStorage();
                                    let fileRef;
                                    try {
                                      fileRef = refFromURL(fileMeta.url);
                                    } catch (_) {
                                      try {
                                        fileRef = sRef(storage, fileMeta.url);
                                      } catch {}
                                    }
                                    if (fileRef)
                                      await deleteObject(fileRef).catch(() => {
                                        storageDeletedOk = false;
                                      });
                                  } catch (e) {
                                    storageDeletedOk = false;
                                    console.warn('No se pudo borrar del Storage:', e);
                                  }
                                }
                                const next = { ...(legalProgress || {}) };
                                const prev = next[key];
                                if (typeof prev === 'object') {
                                  delete prev.file;
                                  next[key] = { ...prev };
                                }
                                setLegalProgress(next);
                                saveLegalProgress(activeWedding, next);
                                try {
                                  if (storageDeletedOk)
                                    toast.success(tr('documents.fileDeleted', 'Archivo eliminado'));
                                  else
                                    toast.warn(
                                      tr(
                                        'documents.fileRefRemoved',
                                        'Referencia eliminada. No se pudo borrar del almacenamiento.'
                                      )
                                    );
                                } catch {}
                              }}
                            >
                              Quitar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </Card>

          {/* Descargables */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Descargables</h2>
              <div className="text-sm text-gray-600">
                {form.region === 'ES' ? 'España' : form.region}
              </div>
            </div>
            {templatesForSelection.length === 0 && (
              <p className="text-gray-600 text-sm">No hay descargables para la selección actual.</p>
            )}
            {templatesForSelection.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templatesForSelection.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="border rounded-lg p-3 flex items-center justify-between bg-white"
                  >
                    <div>
                      <div className="font-medium">{tpl.title}</div>
                      {tpl.desc && <div className="text-xs text-gray-600">{tpl.desc}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                        onClick={() => {
                          try {
                            const data = buildTemplatePrefill(weddingInfo);
                            const html = generateTemplateHTML(tpl.id, form.region, data);
                            const name = tpl.title.replace(/\s+/g, '_');
                            downloadAsDoc(name, html);
                            try {
                              toast.success(
                                tr('documents.docDownloadStarted', 'Descarga iniciada (.DOC)')
                              );
                            } catch {}
                          } catch (e) {
                            try {
                              toast.error(tr('documents.docFailed', 'No se pudo generar el .DOC'));
                            } catch {}
                          }
                        }}
                      >
                        <Download size={16} /> .DOC
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                        onClick={async () => {
                          try {
                            const data = buildTemplatePrefill(weddingInfo);
                            const html = generateTemplateHTML(tpl.id, form.region, data);
                            const name = tpl.title.replace(/\s+/g, '_');
                            await downloadAsPdf(name, html);
                            try {
                              toast.success(tr('documents.pdfReady', 'PDF generado'));
                            } catch {}
                          } catch (e) {
                            try {
                              toast.error(tr('documents.pdfFailed', 'No se pudo generar el PDF'));
                            } catch {}
                          }
                        }}
                      >
                        <Download size={16} /> PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </PageWrapper>
  );
}