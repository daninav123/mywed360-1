import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import useCeremonyTexts from '../../hooks/useCeremonyTexts';

const INITIAL_READING = {
  id: null,
  title: '',
  content: '',
  duration: '',
  status: 'draft',
};

const TABS = [
  { id: 'lecturas', label: 'Lecturas' },
  { id: 'ramos-sorpresas', label: 'Ramos y Sorpresas' },
];

function calculateReadingTime(text = '') {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  if (words === 0) return '0 min';
  const minutes = Math.max(1, Math.ceil(words / 150));
  return `${minutes} min`;
}

const AyudaCeremonia = () => {
  const {
    readings,
    surprises,
    loading,
    canEdit,
    addReading,
    updateReading,
    removeReading,
    addSurprise,
    removeSurprise,
    toggleSurpriseStatus,
  } = useCeremonyTexts();

  const [activeTab, setActiveTab] = useState('lecturas');
  const [readingForm, setReadingForm] = useState(INITIAL_READING);
  const [showReadingPreview, setShowReadingPreview] = useState(false);

  const isEditingReading = useMemo(() => readingForm.id !== null, [readingForm.id]);

  const handleStartNewReading = () => {
    setReadingForm(INITIAL_READING);
  };

  const handleSelectReading = (reading) => {
    setReadingForm({
      id: reading.id,
      title: reading.title,
      content: reading.content,
      duration: reading.duration || calculateReadingTime(reading.content),
      status: reading.status || 'draft',
    });
  };

  const handleReadingSave = (event) => {
    event.preventDefault();
    if (!canEdit) return;
    const duration = calculateReadingTime(readingForm.content);
    if (isEditingReading) {
      updateReading(readingForm.id, {
        title: readingForm.title,
        content: readingForm.content,
        duration,
        status: readingForm.status || 'draft',
      });
    } else {
      addReading({
        title: readingForm.title,
        content: readingForm.content,
        duration,
        status: 'draft',
      });
    }
    setReadingForm(INITIAL_READING);
  };

  const handleReadingContentChange = (content) => {
    setReadingForm((prev) => ({
      ...prev,
      content,
      duration: calculateReadingTime(content),
    }));
  };

  const handleToggleReadingStatus = (reading) => {
    const nextStatus = reading.status === 'final' ? 'draft' : 'final';
    updateReading(reading.id, { status: nextStatus });
    if (readingForm.id === reading.id) {
      setReadingForm((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  const handleAddSurprise = (event) => {
    event.preventDefault();
    if (!canEdit) return;
    const data = new FormData(event.target);
    addSurprise({
      type: data.get('type'),
      recipient: data.get('recipient'),
      table: data.get('table'),
      description: data.get('description'),
      notes: data.get('notes'),
      status: 'pending',
    });
    event.target.reset();
  };

  const renderLoadingState = () => (
    <div className="p-8">
      <Card className="p-6 text-center " style={{ color: 'var(--color-muted)' }}>Cargando contenido…</Card>
    </div>
  );

  const renderReadingsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card className="h-full">
          <div className="px-4 py-5 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Lecturas de la Ceremonia</h3>
            {canEdit && (
              <Button size="sm" onClick={handleStartNewReading}>
                + Nueva
              </Button>
            )}
          </div>
          <div className="overflow-y-auto max-h-96">
            {readings.length === 0 ? (
              <p className="p-4 text-sm " style={{ color: 'var(--color-muted)' }}>No hay lecturas guardadas.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {readings.map((reading) => (
                  <li
                    key={reading.id}
                    className="p-4 hover: cursor-pointer" style={{ backgroundColor: 'var(--color-bg)' }}
                    onClick={() => handleSelectReading(reading)}
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <h4 className="font-medium " style={{ color: 'var(--color-text)' }}>{reading.title}</h4>
                        <p className="text-sm  mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {reading.content}
                        </p>
                        <div className="mt-2 flex items-center text-xs  gap-2" style={{ color: 'var(--color-muted)' }}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {reading.duration || calculateReadingTime(reading.content)}
                          </span>
                          <span
                            className={
                              reading.status === 'final'
                                ? 'text-emerald-600 font-medium'
                                : 'text-gray-500'
                            }
                          >
                            {reading.status === 'final' ? 'Finalizado' : 'Borrador'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReadingForm({
                              id: reading.id,
                              title: reading.title,
                              content: reading.content,
                              duration:
                                reading.duration || calculateReadingTime(reading.content),
                              status: reading.status || 'draft',
                            });
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReadingPreview(true);
                            setReadingForm((prev) =>
                              prev.id === reading.id
                                ? prev
                                : {
                                    id: reading.id,
                                    title: reading.title,
                                    content: reading.content,
                                    duration:
                                      reading.duration || calculateReadingTime(reading.content),
                                    status: reading.status || 'draft',
                                  },
                            );
                          }}
                        >
                          Vista previa
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReadingStatus(reading);
                              }}
                            >
                              {reading.status === 'final' ? 'Marcar borrador' : 'Marcar final'}
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              className=" hover:text-red-700" style={{ color: 'var(--color-danger)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    '¿Seguro que quieres eliminar esta lectura?',
                                  )
                                ) {
                                  removeReading(reading.id);
                                  if (readingForm.id === reading.id) {
                                    setReadingForm(INITIAL_READING);
                                  }
                                }
                              }}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <form onSubmit={handleReadingSave}>
            <div className="px-4 py-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h3 className="text-lg font-medium">
                {isEditingReading ? 'Editar lectura' : 'Nueva lectura'}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowReadingPreview(true)}
                  disabled={!readingForm.content}
                >
                  Vista previa
                </Button>
                <Button type="submit" disabled={!canEdit}>
                  Guardar
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  Título de la lectura
                </label>
                <input
                  type="text"
                  value={readingForm.title}
                  onChange={(e) => setReadingForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('protocol.ceremony.searchPlaceholder')}
                  required
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  Contenido
                </label>
                <textarea
                  rows={12}
                  value={readingForm.content}
                  onChange={(e) => handleReadingContentChange(e.target.value)}
                  className="w-full px-3 py-2 border  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-serif" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('protocol.ceremony.customTitlePlaceholder')}
                  required
                  disabled={!canEdit}
                />
                <p className="mt-1 text-sm " style={{ color: 'var(--color-muted)' }}>
                  Duración estimada: {readingForm.duration || '0 min'}
                </p>
              </div>
              {!canEdit && (
                <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-md">
                  Solo los planners o ayudantes pueden editar las lecturas.
                </div>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );

  const renderSurprisesTab = () => (
    <div className="space-y-6">
      {canEdit && (
        <Card>
          <div className="px-4 py-5 border-b">
            <h3 className="text-lg font-medium">Añadir Ramo o Sorpresa</h3>
          </div>
          <form onSubmit={handleAddSurprise} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>Tipo</label>
                <select
                  name="type"
                  className="w-full px-3 py-2 border  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="ramo">Ramo</option>
                  <option value="sorpresa">Sorpresa</option>
                  <option value="detalle">Detalle especial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  Destinatario
                </label>
                <input
                  type="text"
                  name="recipient"
                  className="w-full px-3 py-2 border  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('protocol.ceremony.presentationNotesPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>Mesa</label>
                <input
                  type="text"
                  name="table"
                  className="w-full px-3 py-2 border  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder="Ej. Mesa 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  Descripción
                </label>
                <input
                  type="text"
                  name="description"
                  className="w-full px-3 py-2 border  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder="Ej. Ramo de rosas blancas"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  Notas adicionales
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 border  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder="Instrucciones especiales o detalles importantes…"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Añadir a la lista</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="px-4 py-5 border-b">
          <h3 className="text-lg font-medium">Lista de Ramos y Sorpresas</h3>
        </div>
        {surprises.length === 0 ? (
          <div className="p-6 text-center " style={{ color: 'var(--color-muted)' }}>
            <p>No hay ramos o sorpresas programados todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="" style={{ backgroundColor: 'var(--color-bg)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Destinatario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium  uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className=" divide-y divide-gray-200" style={{ backgroundColor: 'var(--color-surface)' }}>
                {surprises.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm " style={{ color: 'var(--color-text)' }}>
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm " style={{ color: 'var(--color-text)' }}>
                      {item.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm " style={{ color: 'var(--color-text)' }}>
                      {item.table}
                    </td>
                    <td className="px-6 py-4 text-sm " style={{ color: 'var(--color-text)' }}>{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.status === 'pending' ? 'Pendiente' : 'Entregado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className=" hover:text-blue-800" style={{ color: 'var(--color-primary)' }}
                            onClick={() => toggleSurpriseStatus(item.id)}
                          >
                            {item.status === 'pending' ? 'Marcar entregado' : 'Marcar pendiente'}
                          </button>
                          <button
                            type="button"
                            className=" hover:text-red-800" style={{ color: 'var(--color-danger)' }}
                            onClick={() => {
                              if (
                                window.confirm('¿Seguro que quieres eliminar este elemento?')
                              ) {
                                removeSurprise(item.id);
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <PageWrapper title="Ayuda Ceremonia">
      <div className="space-y-6">
        <p className="" style={{ color: 'var(--color-text-secondary)' }}>
          Redacta lecturas, organiza sorpresas y comparte textos importantes de la ceremonia.
        </p>

        <div className="border-b " style={{ borderColor: 'var(--color-border)' }}>
          <nav className="-mb-px flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? renderLoadingState() : activeTab === 'lecturas' ? renderReadingsTab() : renderSurprisesTab()}
      </div>

      {showReadingPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">{readingForm.title || 'Vista previa'}</h3>
              <button
                onClick={() => setShowReadingPreview(false)}
                className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-muted)' }}
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose max-w-none whitespace-pre-line">{readingForm.content}</div>
            </div>
            <div className="px-6 py-3  text-right" style={{ backgroundColor: 'var(--color-bg)' }}>
              <Button onClick={() => setShowReadingPreview(false)}>Cerrar</Button>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
};

export default AyudaCeremonia;
