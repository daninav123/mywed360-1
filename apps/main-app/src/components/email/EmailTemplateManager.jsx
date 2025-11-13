import {
  ChevronDown,
  Edit,
  Trash,
  Plus,
  Save,
  Copy,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import * as EmailService from '../../services/EmailService';
import Button from '../Button';
import Card from '../ui/Card';

const DEFAULT_CATEGORIES = [
  'Proveedores - Solicitud de información',
  'Proveedores - Confirmación',
  'Proveedores - Cancelación',
  'Proveedores - Seguimiento',
  'Invitados - Información',
  'Invitados - Recordatorio',
  'Seguimiento',
  'General',
];

const emptyTemplate = {
  id: null,
  name: '',
  category: DEFAULT_CATEGORIES[0],
  subject: '',
  body: '',
  variables: [],
};

function sanitizeTemplate(raw = {}) {
  return {
    id: raw.id ?? raw.templateId ?? null,
    name: raw.name ?? 'Plantilla sin nombre',
    category: raw.category ?? DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1],
    subject: raw.subject ?? '',
    body: raw.body ?? '',
    variables: Array.isArray(raw.variables) ? raw.variables : [],
  };
}

const EmailTemplateManager = ({ onSelectTemplate, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(emptyTemplate);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(DEFAULT_CATEGORIES));

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 2500);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const term = searchTerm.trim().toLowerCase();
    return templates.filter((tpl) =>
      [tpl.name, tpl.category, tpl.subject, tpl.body]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [templates, searchTerm]);

  const groupedTemplates = useMemo(() => {
    const groups = new Map();
    DEFAULT_CATEGORIES.forEach((cat) => groups.set(cat, []));
    groups.set('Otras', []);

    filteredTemplates.forEach((tpl) => {
      const category = tpl.category && groups.has(tpl.category) ? tpl.category : 'Otras';
      groups.get(category).push(tpl);
    });

    return Array.from(groups.entries()).filter(([, list]) => list.length > 0);
  }, [filteredTemplates]);

  async function loadTemplates(forceRefresh = false) {
    setLoading(true);
    setError('');
    try {
      const data = await EmailService.getEmailTemplates(forceRefresh);
      const normalized = Array.isArray(data) ? data.map(sanitizeTemplate) : [];
      setTemplates(normalized);
    } catch (err) {
      // console.error('EmailTemplateManager.loadTemplates', err);
      setError('No se pudieron cargar las plantillas de email');
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setEditingTemplate({ ...emptyTemplate, id: null });
    setEditMode(true);
  }

  function handleEditTemplate(tpl) {
    setEditingTemplate(sanitizeTemplate(tpl));
    setEditMode(true);
  }

  function handleCancelEdit() {
    setEditMode(false);
    setEditingTemplate(emptyTemplate);
  }

  async function handleDeleteTemplate(id) {
    if (!id) return;
    if (!window.confirm('¿Eliminar la plantilla seleccionada?')) return;
    try {
      await EmailService.deleteEmailTemplate(id);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      setSuccess('Plantilla eliminada');
    } catch (err) {
      // console.error('EmailTemplateManager.delete', err);
      setError('No se pudo eliminar la plantilla');
    }
  }

  async function handleResetTemplates() {
    if (!window.confirm('Esto restablecerá las plantillas predefinidas. ¿Continuar?')) return;
    setLoading(true);
    try {
      const restored = await EmailService.resetPredefinedTemplates();
      const normalized = Array.isArray(restored) ? restored.map(sanitizeTemplate) : [];
      setTemplates(normalized);
      setSuccess('Plantillas restablecidas');
    } catch (err) {
      // console.error('EmailTemplateManager.reset', err);
      setError('No se pudieron restablecer las plantillas');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTemplate(event) {
    event?.preventDefault();
    const payload = {
      ...editingTemplate,
      variables: editingTemplate.variables || [],
    };

    try {
      const saved = await EmailService.saveEmailTemplate(payload);
      const sanitized = sanitizeTemplate(saved ?? payload);

      setTemplates((prev) => {
        const others = prev.filter((tpl) => tpl.id !== sanitized.id);
        return [...others, sanitized].sort((a, b) => a.name.localeCompare(b.name));
      });

      setSuccess('Plantilla guardada correctamente');
      handleCancelEdit();
    } catch (err) {
      // console.error('EmailTemplateManager.save', err);
      setError('No se pudo guardar la plantilla');
    }
  }

  function handleSelectTemplate(tpl) {
    onSelectTemplate?.(sanitizeTemplate(tpl));
    onClose?.();
  }

  function toggleGroup(category) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <Card className="p-4 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Plantillas de email</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadTemplates(true)}
            title="Recargar (ignorar caché)"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-7 pr-3 py-2 border rounded-md text-sm"
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <Button size="sm" variant="outline" onClick={handleResetTemplates}>
            <RefreshCw size={14} className="mr-1" /> Restablecer
          </Button>
          <Button size="sm" onClick={handleCreateNew}>
            <Plus size={14} className="mr-1" /> Nueva plantilla
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Cargando plantillas...</div>
      ) : editMode ? (
        <form className="space-y-4" onSubmit={handleSaveTemplate}>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              className="w-full border rounded-md p-2"
              value={editingTemplate.name}
              onChange={(event) =>
                setEditingTemplate({ ...editingTemplate, name: event.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              className="w-full border rounded-md p-2"
              value={editingTemplate.category}
              onChange={(event) =>
                setEditingTemplate({ ...editingTemplate, category: event.target.value })
              }
            >
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Asunto</label>
            <input
              className="w-full border rounded-md p-2"
              value={editingTemplate.subject}
              onChange={(event) =>
                setEditingTemplate({ ...editingTemplate, subject: event.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contenido</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={10}
              value={editingTemplate.body}
              onChange={(event) =>
                setEditingTemplate({ ...editingTemplate, body: event.target.value })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Usa &#123;&#123;variable&#125;&#125; para campos dinámicos (ej.
              &#123;&#123;nombre_proveedor&#125;&#125;).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={handleCancelEdit}>
              Cancelar
            </Button>
            <Button type="submit" className="flex items-center gap-1">
              <Save size={16} /> Guardar plantilla
            </Button>
          </div>
        </form>
      ) : groupedTemplates.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">No se encontraron plantillas.</div>
      ) : (
        <div className="space-y-3">
          {groupedTemplates.map(([category, items]) => {
            const isExpanded = expandedGroups.has(category);
            return (
              <div key={category} className="border rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(category)}
                  className="flex w-full items-center justify-between bg-gray-100 px-3 py-2 text-left text-sm font-medium"
                >
                  <span>{category}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <ul className="divide-y">
                    {items.map((template) => (
                      <li
                        key={template.id}
                        className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{template.name}</p>
                          <p className="truncate text-xs text-gray-500">
                            {template.subject || 'Sin asunto'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSelectTemplate(template)}
                            title="Usar plantilla"
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTemplate(template)}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </Button>
                          {!template.isSystem && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTemplate(template.id)}
                              title="Eliminar"
                            >
                              <Trash size={14} />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default EmailTemplateManager;
