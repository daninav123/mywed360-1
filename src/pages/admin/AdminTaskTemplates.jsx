import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getTaskTemplates,
  saveTaskTemplateDraft,
  publishTaskTemplate,
  previewTaskTemplate,
  getUserTasksAnalysis,
} from '../../services/adminDataService';

const EMPTY_FORM = {
  id: null,
  name: '',
  notes: '',
  version: null,
  status: 'draft',
  blocksJson: JSON.stringify([], null, 2),
};

const STATUS_LABELS = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
};

function formatCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('es-ES');
}

function ensureJsonString(value) {
  try {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        JSON.parse(trimmed);
        return trimmed;
      }
    }
  } catch (error) {
    // ignore
  }
  return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
}

const AdminTaskTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [meta, setMeta] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  // Análisis de tareas de usuarios
  const [showUserTasks, setShowUserTasks] = useState(false);
  const [userTasks, setUserTasks] = useState([]);
  const [userTasksMeta, setUserTasksMeta] = useState({});
  const [loadingUserTasks, setLoadingUserTasks] = useState(false);
  const [minOccurrences, setMinOccurrences] = useState(3);
  
  // Vista visual
  const [viewMode, setViewMode] = useState('json'); // 'json' | 'visual'
  const [editingBlock, setEditingBlock] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false);
  const [selectedBlockForAdd, setSelectedBlockForAdd] = useState(null);
  const [newSubtask, setNewSubtask] = useState({ title: '', startPct: 0, endPct: 0, priority: 'medium' });
  
  // Estado para gestión de dependencias
  const [showDependenciesModal, setShowDependenciesModal] = useState(false);
  const [editingDepsTask, setEditingDepsTask] = useState(null); // { blockIndex, itemIndex }
  const [selectedDependencies, setSelectedDependencies] = useState([]);

  const nextSuggestedVersion = useMemo(() => {
    if (!templates.length) return 1;
    const highest = templates.reduce((acc, tpl) => Math.max(acc, Number(tpl.version) || 0), 0);
    return highest + 1;
  }, [templates]);

  const hydrateForm = useCallback((template) => {
    if (!template) {
      setForm({
        ...EMPTY_FORM,
        version: nextSuggestedVersion,
      });
      return;
    }
    setForm({
      id: template.id || null,
      name: template.name || '',
      notes: template.notes || '',
      version: Number(template.version) || null,
      status: template.status || 'draft',
      blocksJson: ensureJsonString(template.blocks || []),
    });
  }, [nextSuggestedVersion]);

  const selectTemplate = useCallback(
    (id, list) => {
      const source = Array.isArray(list) ? list : templates;
      const target = source.find((tpl) => tpl.id === id);
      if (!target) return;
      setSelectedId(target.id);
      hydrateForm(target);
      setPreview(null);
      setError(null);
      setMessage(null);
    },
    [hydrateForm, templates],
  );

  const loadTemplates = useCallback(
    async ({ forceRefresh = false, silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await getTaskTemplates({ forceRefresh });
        const items = Array.isArray(data?.templates) ? data.templates : [];
        setTemplates(items);
        setMeta(data?.meta || {});
        if (!items.length) {
          setSelectedId(null);
          hydrateForm(null);
        }
        return { items, meta: data?.meta || {} };
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [hydrateForm],
  );

  useEffect(() => {
    (async () => {
      const { items, meta: metaInfo } = await loadTemplates({ forceRefresh: true });
      let defaultId = metaInfo?.latestPublished?.id || null;
      if (!defaultId && items.length) {
        defaultId = items[0].id;
      }
      if (defaultId) {
        selectTemplate(defaultId, items);
      } else if (!items.length) {
        hydrateForm(null);
      }
    })();
  }, [loadTemplates, selectTemplate, hydrateForm]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setMessage(null);
  };

  const handleVersionChange = (event) => {
    const raw = event.target.value;
    setForm((prev) => ({
      ...prev,
      version: raw === '' ? null : Number(raw),
    }));
    setError(null);
    setMessage(null);
  };

  const handleBlocksChange = (event) => {
    setForm((prev) => ({
      ...prev,
      blocksJson: event.target.value,
    }));
    setError(null);
    setMessage(null);
  };

  const handleNewDraft = () => {
    setSelectedId(null);
    setPreview(null);
    setError(null);
    setMessage(null);
    setForm({
      ...EMPTY_FORM,
      version: nextSuggestedVersion,
    });
  };

  const handleSaveDraft = async () => {
    setError(null);
    setMessage(null);
    let parsedBlocks;
    try {
      parsedBlocks = JSON.parse(form.blocksJson || '[]');
      if (!Array.isArray(parsedBlocks)) {
        throw new Error('La plantilla debe ser un array de bloques.');
      }
    } catch (parseError) {
      setError('No se pudo interpretar el JSON de bloques. Verifica la estructura.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: form.id || undefined,
        name: form.name || undefined,
        notes: form.notes || undefined,
        version: Number.isFinite(form.version) ? Number(form.version) : undefined,
        blocks: parsedBlocks,
      };
      const result = await saveTaskTemplateDraft(payload);
      const { items } = await loadTemplates({ forceRefresh: true, silent: true });
      const targetId = result?.id || payload.id || (items[0]?.id ?? null);
      if (targetId) {
        selectTemplate(targetId, items);
      } else {
        setSelectedId(null);
        hydrateForm(null);
      }
      setMessage('Borrador guardado correctamente.');
    } catch (saveError) {
      setError(saveError?.message || 'No se pudo guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  };

  // Alias para el botón de guardar en vista visual
  const handleSave = handleSaveDraft;

  const handlePublish = async () => {
    if (!form.id) {
      setError('Guarda la plantilla antes de publicarla.');
      return;
    }
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      await publishTaskTemplate(form.id);
      const { items } = await loadTemplates({ forceRefresh: true, silent: true });
      selectTemplate(form.id, items);
      setMessage('Versión publicada correctamente.');
    } catch (publishError) {
      setError(publishError?.message || 'No se pudo publicar la plantilla.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = async () => {
    if (!form.id) {
      setError('Guarda la plantilla antes de generar una vista previa.');
      return;
    }
    setPreviewing(true);
    setError(null);
    setMessage(null);
    try {
      const data = await previewTaskTemplate(form.id, {});
      setPreview(data?.preview || null);
    } catch (previewError) {
      setError(previewError?.message || 'No se pudo generar la vista previa.');
    } finally {
      setPreviewing(false);
    }
  };

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === selectedId) || null,
    [templates, selectedId],
  );

  const templateSummary = useMemo(() => {
    if (!selectedTemplate) return null;
    const totals = selectedTemplate.totals || {};
    return {
      blocks: totals.blocks || 0,
      subtasks: totals.subtasks || 0,
      updatedAt: selectedTemplate.updatedAt || '—',
      publishedAt: selectedTemplate.publishedAt || null,
    };
  }, [selectedTemplate]);

  const loadUserTasks = async () => {
    setLoadingUserTasks(true);
    try {
      const data = await getUserTasksAnalysis({ limit: 100 });
      setUserTasks(data.tasks || []);
      setUserTasksMeta(data.meta || {});
    } catch (err) {
      console.error('Error loading user tasks:', err);
    } finally {
      setLoadingUserTasks(false);
    }
  };

  const filteredUserTasks = useMemo(() => {
    return userTasks.filter(task => task.count >= minOccurrences);
  }, [userTasks, minOccurrences]);

  const handleSaveBlockEdit = (blockIndex, field, value) => {
    try {
      const blocks = JSON.parse(form.blocksJson);
      blocks[blockIndex][field] = value;
      setForm(prev => ({ ...prev, blocksJson: JSON.stringify(blocks, null, 2) }));
      setEditingBlock(null);
    } catch (e) {
      console.error('Error saving block edit:', e);
    }
  };

  const handleSaveItemEdit = (blockIndex, itemIndex, field, value) => {
    try {
      const blocks = JSON.parse(form.blocksJson);
      blocks[blockIndex].items[itemIndex][field] = value;
      setForm(prev => ({ ...prev, blocksJson: JSON.stringify(blocks, null, 2) }));
      setEditingItem(null);
    } catch (e) {
      console.error('Error saving item edit:', e);
    }
  };

  const handleAddSubtask = () => {
    if (!selectedBlockForAdd || !newSubtask.title.trim()) return;
    
    try {
      const blocks = JSON.parse(form.blocksJson);
      const block = blocks[selectedBlockForAdd];
      
      if (!block.items) block.items = [];
      
      block.items.push({
        title: newSubtask.title,
        startPct: parseFloat(newSubtask.startPct) / 100,
        endPct: parseFloat(newSubtask.endPct) / 100,
        priority: newSubtask.priority,
        category: block.admin?.category || 'OTROS',
        tags: [],
        checklist: [],
        dependsOn: [] // Campo para dependencias
      });
      
      setForm(prev => ({ ...prev, blocksJson: JSON.stringify(blocks, null, 2) }));
      setShowAddSubtaskModal(false);
      setSelectedBlockForAdd(null);
      setNewSubtask({ title: '', startPct: 0, endPct: 0, priority: 'medium' });
    } catch (e) {
      console.error('Error adding subtask:', e);
    }
  };

  const handleDeleteItem = (blockIndex, itemIndex) => {
    if (!confirm('¿Eliminar esta subtarea?')) return;
    
    try {
      const blocks = JSON.parse(form.blocksJson);
      blocks[blockIndex].items.splice(itemIndex, 1);
      setForm(prev => ({ ...prev, blocksJson: JSON.stringify(blocks, null, 2) }));
    } catch (e) {
      console.error('Error deleting item:', e);
    }
  };

  // Gestión de dependencias
  const openDependenciesModal = (blockIndex, itemIndex) => {
    try {
      const blocks = JSON.parse(form.blocksJson);
      const task = blocks[blockIndex]?.items?.[itemIndex];
      if (!task) return;
      
      setEditingDepsTask({ blockIndex, itemIndex });
      setSelectedDependencies(task.dependsOn || []);
      setShowDependenciesModal(true);
    } catch (e) {
      console.error('Error opening dependencies modal:', e);
    }
  };

  const toggleDependency = (depBlockIndex, depItemIndex) => {
    const depId = `${depBlockIndex}-${depItemIndex}`;
    const exists = selectedDependencies.some(
      d => d.blockIndex === depBlockIndex && d.itemIndex === depItemIndex
    );

    if (exists) {
      setSelectedDependencies(prev => 
        prev.filter(d => !(d.blockIndex === depBlockIndex && d.itemIndex === depItemIndex))
      );
    } else {
      try {
        const blocks = JSON.parse(form.blocksJson);
        const depBlock = blocks[depBlockIndex];
        const depItem = depBlock?.items?.[depItemIndex];
        
        if (depBlock && depItem) {
          setSelectedDependencies(prev => [...prev, {
            blockIndex: depBlockIndex,
            itemIndex: depItemIndex,
            blockName: depBlock.name || depBlock.title || `Bloque ${depBlockIndex + 1}`,
            itemTitle: depItem.title || `Tarea ${depItemIndex + 1}`
          }]);
        }
      } catch (e) {
        console.error('Error toggling dependency:', e);
      }
    }
  };

  const saveDependencies = () => {
    if (!editingDepsTask) return;
    
    try {
      const blocks = JSON.parse(form.blocksJson);
      const task = blocks[editingDepsTask.blockIndex]?.items?.[editingDepsTask.itemIndex];
      
      if (task) {
        task.dependsOn = selectedDependencies;
        setForm(prev => ({ ...prev, blocksJson: JSON.stringify(blocks, null, 2) }));
        setShowDependenciesModal(false);
        setEditingDepsTask(null);
        setSelectedDependencies([]);
      }
    } catch (e) {
      console.error('Error saving dependencies:', e);
    }
  };

  const getAllTasksForDependencies = () => {
    try {
      const blocks = JSON.parse(form.blocksJson);
      const allTasks = [];
      
      blocks.forEach((block, blockIndex) => {
        const items = Array.isArray(block.items) ? block.items : [];
        items.forEach((item, itemIndex) => {
          allTasks.push({
            blockIndex,
            itemIndex,
            blockName: block.name || block.title || `Bloque ${blockIndex + 1}`,
            itemTitle: item.title || `Tarea ${itemIndex + 1}`,
            isCurrentTask: editingDepsTask?.blockIndex === blockIndex && 
                          editingDepsTask?.itemIndex === itemIndex
          });
        });
      });
      
      return allTasks;
    } catch (e) {
      return [];
    }
  };

  const renderVisualView = () => {
    if (!selectedTemplate) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="text-gray-500">Selecciona una plantilla para ver su estructura visual</p>
        </div>
      );
    }

    let blocks = [];
    try {
      blocks = JSON.parse(form.blocksJson);
      if (!Array.isArray(blocks)) blocks = [];
    } catch {
      blocks = [];
    }

    if (blocks.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="text-gray-500">Esta plantilla no tiene bloques definidos</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <div className="inline-flex gap-4 pb-4" style={{ minWidth: '100%' }}>
            {blocks.map((block, blockIndex) => {
              const items = Array.isArray(block.items) ? block.items : [];
              const blockName = block.name || block.title || `Bloque ${blockIndex + 1}`;
              const category = block.admin?.category || 'OTROS';
              
              return (
                <div
                  key={blockIndex}
                  className="flex-shrink-0 w-80 rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  {/* Cabecera - Tarea Padre */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      {editingBlock === `${blockIndex}-name` ? (
                        <input
                          type="text"
                          defaultValue={blockName}
                          onBlur={(e) => handleSaveBlockEdit(blockIndex, 'name', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveBlockEdit(blockIndex, 'name', e.target.value)}
                          autoFocus
                          className="bg-white text-gray-900 px-2 py-1 rounded text-sm w-full"
                        />
                      ) : (
                        <h3 
                          className="font-semibold text-white text-sm cursor-pointer hover:bg-blue-700 px-2 py-1 rounded"
                          onClick={() => setEditingBlock(`${blockIndex}-name`)}
                        >
                          {blockName} ✏️
                        </h3>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs bg-blue-400 text-white px-2 py-0.5 rounded">
                        {category}
                      </span>
                      <span className="text-xs text-blue-100">
                        {items.length} subtarea{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-blue-100 mt-1 flex items-center gap-2">
                      {editingBlock === `${blockIndex}-timing` ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            defaultValue={(block.startPct * 100).toFixed(0)}
                            onBlur={(e) => handleSaveBlockEdit(blockIndex, 'startPct', parseFloat(e.target.value) / 100)}
                            className="bg-white text-gray-900 px-1 py-0.5 rounded w-12 text-xs"
                          />
                          <span className="text-white">-</span>
                          <input
                            type="number"
                            defaultValue={(block.endPct * 100).toFixed(0)}
                            onBlur={(e) => handleSaveBlockEdit(blockIndex, 'endPct', parseFloat(e.target.value) / 100)}
                            className="bg-white text-gray-900 px-1 py-0.5 rounded w-12 text-xs"
                          />
                          <span className="text-white">%</span>
                        </div>
                      ) : (
                        <span 
                          className="cursor-pointer hover:bg-blue-700 px-2 py-0.5 rounded"
                          onClick={() => setEditingBlock(`${blockIndex}-timing`)}
                        >
                          📅 {(block.startPct * 100).toFixed(0)}% - {(block.endPct * 100).toFixed(0)}% ✏️
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subtareas */}
                  <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedBlockForAdd(blockIndex);
                        setShowAddSubtaskModal(true);
                      }}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-500 hover:text-blue-600 transition"
                    >
                      + Añadir Subtarea
                    </button>
                    {items.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        Sin subtareas
                      </div>
                    ) : (
                      items.map((item, itemIndex) => {
                        const itemTitle = item.title || item.name || item.label || `Subtarea ${itemIndex + 1}`;
                        const itemCategory = item.category || category;
                        
                        return (
                          <div
                            key={itemIndex}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition relative group"
                          >
                            <button
                              onClick={() => handleDeleteItem(blockIndex, itemIndex)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded px-2 py-0.5 text-xs hover:bg-red-600"
                            >
                              🗑️
                            </button>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {editingItem === `${blockIndex}-${itemIndex}-title` ? (
                                  <input
                                    type="text"
                                    defaultValue={itemTitle}
                                    onBlur={(e) => handleSaveItemEdit(blockIndex, itemIndex, 'title', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveItemEdit(blockIndex, itemIndex, 'title', e.target.value)}
                                    autoFocus
                                    className="text-sm font-medium text-gray-900 w-full border rounded px-2 py-1"
                                  />
                                ) : (
                                  <p 
                                    className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:bg-gray-200 px-2 py-1 rounded"
                                    onClick={() => setEditingItem(`${blockIndex}-${itemIndex}-title`)}
                                  >
                                    {itemTitle} ✏️
                                  </p>
                                )}
                                {item.assigneeSuggestion && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    👤 {item.assigneeSuggestion}
                                  </p>
                                )}
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.tags.map((tag, tagIdx) => (
                                      <span
                                        key={tagIdx}
                                        className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {item.priority && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    item.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : item.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {item.priority}
                                </span>
                              )}
                            </div>
                            
                            {/* Timeline visual */}
                            {typeof item.startPct === 'number' && typeof item.endPct === 'number' && (
                              <div className="mt-2">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500"
                                    style={{
                                      marginLeft: `${(item.startPct - block.startPct) / (block.endPct - block.startPct) * 100}%`,
                                      width: `${((item.endPct - item.startPct) / (block.endPct - block.startPct)) * 100}%`,
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {(item.startPct * 100).toFixed(0)}% → {(item.endPct * 100).toFixed(0)}%
                                </div>
                              </div>
                            )}

                            {/* Dependencias */}
                            <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {item.dependsOn && item.dependsOn.length > 0 ? (
                                  <div className="flex items-center gap-1 text-xs text-orange-600">
                                    <span>🔒</span>
                                    <span>Depende de {item.dependsOn.length} tarea(s)</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">Sin dependencias</span>
                                )}
                              </div>
                              <button
                                onClick={() => openDependenciesModal(blockIndex, itemIndex)}
                                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition"
                              >
                                🔗 Gestionar
                              </button>
                            </div>

                            {/* Checklist */}
                            {item.checklist && item.checklist.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600 font-medium mb-1">Checklist:</p>
                                <ul className="text-xs text-gray-600 space-y-0.5">
                                  {item.checklist.slice(0, 3).map((check, checkIdx) => (
                                    <li key={checkIdx} className="flex items-start gap-1">
                                      <span>•</span>
                                      <span className="flex-1">{check.label || check}</span>
                                    </li>
                                  ))}
                                  {item.checklist.length > 3 && (
                                    <li className="text-gray-400">
                                      +{item.checklist.length - 3} más
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer con estadísticas */}
                  <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Duración: {((block.endPct - block.startPct) * 100).toFixed(0)}%</span>
                      {block.admin?.editable !== false && (
                        <span className="text-green-600">✏️ Editable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Leyenda:</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('json')}
                className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
              >
                💻 Ver JSON
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
            <div>
              <span className="font-medium">✏️ Click para editar:</span> Nombre y timing de tareas
            </div>
            <div>
              <span className="font-medium">+ Añadir:</span> Nueva subtarea a cualquier bloque
            </div>
            <div>
              <span className="font-medium">🗑️ Eliminar:</span> Aparece al hacer hover sobre subtarea
            </div>
            <div>
              <span className="font-medium">💾 Guardar:</span> Persiste cambios en la plantilla
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Plantillas de tareas</h1>
          <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
            Gestiona el seed de tareas padre y subtareas aplicado a cada nueva boda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowUserTasks(!showUserTasks);
              if (!showUserTasks && userTasks.length === 0) {
                loadUserTasks();
              }
            }}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            {showUserTasks ? '← Volver' : '📊 Análisis'}
          </button>
        </div>
      </header>

      {showUserTasks ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-soft bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Tareas Creadas por Usuarios</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Analiza las tareas más repetidas que los usuarios añaden manualmente para considerar incluirlas en el seed.
                </p>
              </div>
              <button
                onClick={loadUserTasks}
                disabled={loadingUserTasks}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingUserTasks ? 'Analizando...' : '🔄 Actualizar'}
              </button>
            </div>

            {userTasksMeta.totalWeddings > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="text-xs text-gray-600">Bodas Analizadas</div>
                  <div className="text-2xl font-bold text-blue-600">{userTasksMeta.totalWeddings}</div>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <div className="text-xs text-gray-600">Tareas Únicas</div>
                  <div className="text-2xl font-bold text-green-600">{userTasksMeta.totalUniqueTasks}</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-3">
                  <div className="text-xs text-gray-600">Filtradas (≥{minOccurrences})</div>
                  <div className="text-2xl font-bold text-purple-600">{filteredUserTasks.length}</div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Mostrar solo tareas con mínimo de apariciones:
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={minOccurrences}
                onChange={(e) => setMinOccurrences(Number(e.target.value))}
                className="w-64"
              />
              <span className="ml-2 text-sm font-semibold">{minOccurrences}</span>
            </div>

            {loadingUserTasks ? (
              <div className="text-center py-8 text-gray-500">Analizando tareas de usuarios...</div>
            ) : filteredUserTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron tareas con al menos {minOccurrences} apariciones
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apariciones</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categorías</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración Prom.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUserTasks.map((task, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{task.title}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            task.isSubtask ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {task.isSubtask ? 'Subtarea' : 'Padre'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-purple-600">{task.count}×</td>
                        <td className="px-4 py-3 text-sm">
                          {task.categories.length > 0 ? task.categories.join(', ') : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {task.avgDuration ? `${task.avgDuration} días` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              const textToCopy = task.isSubtask
                                ? `{ "title": "${task.title}", "startPct": 0, "endPct": 0.05 }`
                                : `{\n  "name": "${task.title}",\n  "startPct": 0,\n  "endPct": 0.2,\n  "admin": { "category": "${task.categories[0] || 'OTROS'}" },\n  "items": []\n}`;
                              navigator.clipboard.writeText(textToCopy);
                              alert('JSON copiado al portapapeles. Pégalo en el editor JSON.');
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            📋 Copiar JSON
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Toggle de vista */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                viewMode === 'visual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Vista Visual
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                viewMode === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💻 Editor JSON
            </button>
          </div>

          {viewMode === 'visual' ? (
            <div className="space-y-4">
              {/* Selector de plantilla en vista visual */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <label className="block text-sm font-medium mb-2">Plantilla seleccionada:</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) selectTemplate(id);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Selecciona una plantilla --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name || `Versión ${tpl.version}`} - {STATUS_LABELS[tpl.status] || tpl.status}
                    </option>
                  ))}
                </select>
              </div>

              {renderVisualView()}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-[var(--color-text-soft,#6b7280)]">
              Versiones disponibles
            </h2>
            <button
              type="button"
              onClick={handleNewDraft}
              className="rounded-md border border-dashed border-[var(--color-border-soft,#d1d5db)] px-2 py-1 text-xs font-medium text-[var(--color-primary,#2563eb)] hover:border-[var(--color-primary,#2563eb)]"
            >
              Nuevo borrador
            </button>
          </div>
          <div className="space-y-2">
            {loading && !templates.length ? (
              <div className="rounded-lg border border-soft bg-surface px-3 py-4 text-sm text-[var(--color-text-soft,#6b7280)]">
                Cargando plantillas...
              </div>
            ) : null}
            {templates.map((tpl) => {
              const isActive = tpl.id === selectedId;
              const statusLabel = STATUS_LABELS[tpl.status] || tpl.status;
              const totals = tpl.totals || {};
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => selectTemplate(tpl.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-[var(--color-primary,#2563eb)] bg-[var(--color-bg-soft,#f3f4f6)] ring-1 ring-[var(--color-primary,#2563eb)]'
                      : 'border-[var(--color-border-soft,#d1d5db)] hover:border-[var(--color-primary,#2563eb)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-medium">
                    <span>{tpl.name || `Plantilla v${tpl.version}`}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        tpl.status === 'published'
                          ? 'bg-[var(--color-primary-muted,#dbeafe)] text-[var(--color-primary,#2563eb)]'
                          : 'bg-[var(--color-border-soft,#d1d5db)] text-[var(--color-text-soft,#6b7280)]'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-soft,#6b7280)]">
                    v{tpl.version || '—'} · {formatCount(totals.blocks)} bloques · {formatCount(totals.subtasks)} subtareas
                  </div>
                  <div className="text-xs text-[var(--color-text-soft,#6b7280)]">
                    {tpl.updatedAt ? `Actualizado ${tpl.updatedAt}` : 'Sin fecha de actualización'}
                  </div>
                </button>
              );
            })}
            {!loading && !templates.length ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border-soft,#d1d5db)] px-3 py-4 text-xs text-[var(--color-text-soft,#6b7280)]">
                Aún no hay plantillas guardadas. Crea un borrador para empezar.
              </div>
            ) : null}
          </div>
          {meta?.latestPublished ? (
            <div className="rounded-lg border border-soft bg-surface px-3 py-3 text-xs text-[var(--color-text-soft,#6b7280)]">
              <div className="font-semibold text-[var(--color-text,#111827)]">Última publicada</div>
              <div>ID: {meta.latestPublished.id}</div>
              <div>Versión: {meta.latestPublished.version}</div>
              <div>Actualizada: {meta.latestPublished.updatedAt || '—'}</div>
            </div>
          ) : null}
        </aside>

        <section className="space-y-5">
          <div className="rounded-xl border border-soft bg-surface shadow-sm">
            <div className="border-b border-soft px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text,#111827)]">
                    {form.id ? `Plantilla ${form.name || form.id}` : 'Nuevo borrador'}
                  </h2>
                  {templateSummary ? (
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                      {formatCount(templateSummary.blocks)} bloques · {formatCount(templateSummary.subtasks)} subtareas ·{' '}
                      Última actualización {templateSummary.updatedAt}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!form.id || previewing}
                    className={`rounded-md border px-3 py-1 text-xs font-medium ${
                      !form.id || previewing
                        ? 'cursor-not-allowed border-[var(--color-border-soft,#d1d5db)] text-[var(--color-text-soft,#9ca3af)]'
                        : 'border-[var(--color-border-soft,#d1d5db)] text-[var(--color-text,#111827)] hover:border-[var(--color-primary,#2563eb)]'
                    }`}
                  >
                    {previewing ? 'Generando vista...' : 'Vista previa'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                      saving
                        ? 'bg-[var(--color-primary-muted,#93c5fd)]'
                        : 'bg-[var(--color-primary,#2563eb)] hover:bg-[var(--color-primary-dark,#1d4ed8)]'
                    }`}
                  >
                    {saving ? 'Guardando...' : 'Guardar borrador'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={!form.id || publishing}
                    className={`rounded-md border px-3 py-1 text-xs font-medium ${
                      !form.id || publishing
                        ? 'cursor-not-allowed border-[var(--color-border-soft,#d1d5db)] text-[var(--color-text-soft,#9ca3af)]'
                        : 'border-[var(--color-primary,#2563eb)] text-[var(--color-primary,#2563eb)] hover:bg-[var(--color-primary-muted,#dbeafe)]'
                    }`}
                  >
                    {publishing ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-4 py-5 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-name">
                    Nombre interno
                  </label>
                  <input
                    id="task-template-name"
                    value={form.name}
                    onChange={handleFieldChange('name')}
                    placeholder="Plantilla base 2025"
                    className="w-full rounded-md border border-soft px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-version">
                    Versión
                  </label>
                  <input
                    id="task-template-version"
                    type="number"
                    min="1"
                    value={form.version ?? ''}
                    onChange={handleVersionChange}
                    className="w-full rounded-md border border-soft px-3 py-2"
                    placeholder={String(nextSuggestedVersion)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-notes">
                  Notas
                </label>
                <textarea
                  id="task-template-notes"
                  rows={2}
                  value={form.notes}
                  onChange={handleFieldChange('notes')}
                  placeholder="Notas de cambio o contexto de la plantilla."
                  className="w-full rounded-md border border-soft px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-json">
                  Bloques (JSON)
                </label>
                <textarea
                  id="task-template-json"
                  rows={18}
                  value={form.blocksJson}
                  onChange={handleBlocksChange}
                  className="w-full rounded-md border border-soft px-3 py-2 font-mono text-xs leading-5"
                  spellCheck={false}
                />
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                  Debe ser un array de bloques. Cada bloque admite propiedades como <code>name</code>, <code>startPct</code>, <code>endPct</code>, <code>admin</code> e <code>items</code> (subtareas con campos opcionales como <code>category</code>, <code>assigneeSuggestion</code>, <code>checklist</code>, etc.).
                </p>
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                  {message}
                </div>
              ) : null}
            </div>
          </div>

          {preview ? (
            <div className="rounded-xl border border-soft bg-surface shadow-sm">
              <div className="border-b border-soft px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--color-text,#111827)]">Vista previa (ejemplo)</h3>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                  Wedding date: {preview.weddingDate} · {formatCount(preview.blocks?.length || 0)} bloques · {formatCount(preview.totals?.subtasks || 0)} subtareas
                </p>
              </div>
              <div className="px-4 py-4">
                <div className="max-h-64 overflow-auto rounded-md border border-soft bg-[var(--color-bg-soft,#f9fafb)] p-3 text-xs font-mono leading-5">
                  <pre>
                    {JSON.stringify(
                      (preview.blocks || []).slice(0, 3),
                      null,
                      2,
                    )}
                    {(preview.blocks || []).length > 3 ? '\n…' : ''}
                  </pre>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-soft,#6b7280)]">
                  Se muestran los primeros bloques de la vista previa. La respuesta completa incluye todas las fechas y subtareas generadas para el ejemplo.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
          )}
        </>
      )}

      {/* Modal para añadir subtarea */}
      {showAddSubtaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Añadir Subtarea</h3>
              <button
                onClick={() => {
                  setShowAddSubtaskModal(false);
                  setSelectedBlockForAdd(null);
                  setNewSubtask({ title: '', startPct: 0, endPct: 0, priority: 'medium' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Título de la subtarea *</label>
                <input
                  type="text"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Reservar fotógrafo"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Inicio (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newSubtask.startPct}
                    onChange={(e) => setNewSubtask(prev => ({ ...prev, startPct: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fin (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newSubtask.endPct}
                    onChange={(e) => setNewSubtask(prev => ({ ...prev, endPct: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prioridad</label>
                <select
                  value={newSubtask.priority}
                  onChange={(e) => setNewSubtask(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAddSubtaskModal(false);
                  setSelectedBlockForAdd(null);
                  setNewSubtask({ title: '', startPct: 0, endPct: 0, priority: 'medium' });
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.title.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Añadir Subtarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Dependencias */}
      {showDependenciesModal && editingDepsTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                🔗 Gestionar Dependencias
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona las tareas que deben completarse antes de esta tarea
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {getAllTasksForDependencies().map((task, idx) => {
                  const isSelected = selectedDependencies.some(
                    d => d.blockIndex === task.blockIndex && d.itemIndex === task.itemIndex
                  );
                  
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        task.isCurrentTask
                          ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'bg-purple-50 border-purple-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={task.isCurrentTask}
                        onChange={() => toggleDependency(task.blockIndex, task.itemIndex)}
                        className="mt-0.5 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium">
                          {task.blockName}
                        </div>
                        <div className="text-sm text-gray-900 mt-0.5">
                          {task.itemTitle}
                        </div>
                        {task.isCurrentTask && (
                          <div className="text-xs text-gray-400 mt-1">
                            (Tarea actual - no puede depender de sí misma)
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}

                {getAllTasksForDependencies().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay otras tareas disponibles
                  </div>
                )}
              </div>

              {selectedDependencies.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-900 mb-2">
                    📋 Resumen de Dependencias:
                  </h3>
                  <ul className="text-sm text-orange-800 space-y-1">
                    {selectedDependencies.map((dep, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-orange-600">→</span>
                        <span className="font-medium">{dep.blockName}</span>
                        <span className="text-orange-600">:</span>
                        <span>{dep.itemTitle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDependenciesModal(false);
                  setEditingDepsTask(null);
                  setSelectedDependencies([]);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveDependencies}
                className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded transition"
              >
                Guardar Dependencias
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskTemplates;
