import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import Button from '../Button';
import useTranslations from '../../hooks/useTranslations';

/**
 * Componente para filtros avanzados de correo electronico.
 * Permite filtrar por remitente, destinatario, periodo, etiquetas, etc.
 */
const EmailFilters = ({ onApplyFilters, onResetFilters, initialFilters = {} }) => {
  const { t, i18n } = useTranslations();
  const tEmail = (key, options) => t(key, { ns: 'email', ...options });

  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    from: initialFilters.from || '',
    to: initialFilters.to || '',
    subject: initialFilters.subject || '',
    hasAttachment: initialFilters.hasAttachment || false,
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    isUnread: initialFilters.isUnread || false,
    labels: initialFilters.labels || [],
  });

  const availableLabels = useMemo(
    () => [
      { id: 'important', name: tEmail('filters.labels.important'), color: 'bg-red-500' },
      { id: 'work', name: tEmail('filters.labels.work'), color: 'bg-blue-500' },
      { id: 'personal', name: tEmail('filters.labels.personal'), color: 'bg-green-500' },
      { id: 'invitation', name: tEmail('filters.labels.invitation'), color: 'bg-purple-500' },
      { id: 'provider', name: tEmail('filters.labels.provider'), color: 'bg-yellow-500' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  );

  const handleFilterChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleLabelToggle = (labelId) => {
    setFilters((prev) =>
      prev.labels.includes(labelId)
        ? { ...prev, labels: prev.labels.filter((id) => id !== labelId) }
        : { ...prev, labels: [...prev.labels, labelId] }
    );
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setFilters({
      from: '',
      to: '',
      subject: '',
      hasAttachment: false,
      dateFrom: '',
      dateTo: '',
      isUnread: false,
      labels: [],
    });
    onResetFilters();
  };

  return (
    <div className="bg-white border rounded-md shadow-sm mb-4">
      <div
        className="flex justify-between items-center p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Filter size={16} className="text-gray-500 mr-2" />
          <h3 className="font-medium">{tEmail('filters.header')}</h3>
        </div>
        <div>
          {expanded ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-from">
                {tEmail('filters.fields.from.label')}
              </label>
              <input
                id="filter-from"
                type="text"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder={tEmail('filters.fields.from.placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-to">
                {tEmail('filters.fields.to.label')}
              </label>
              <input
                id="filter-to"
                type="text"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder={tEmail('filters.fields.to.placeholder')}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="filter-subject"
              >
                {tEmail('filters.fields.subject.label')}
              </label>
              <input
                id="filter-subject"
                type="text"
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder={tEmail('filters.fields.subject.placeholder')}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="filter-date-from"
              >
                {tEmail('filters.fields.dateFrom')}
              </label>
              <input
                id="filter-date-from"
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="filter-date-to"
              >
                {tEmail('filters.fields.dateTo')}
              </label>
              <input
                id="filter-date-to"
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                id="filter-attachment"
                type="checkbox"
                name="hasAttachment"
                checked={filters.hasAttachment}
                onChange={handleFilterChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="filter-attachment" className="ml-2 block text-sm text-gray-700">
                {tEmail('filters.fields.hasAttachment')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="filter-unread"
                type="checkbox"
                name="isUnread"
                checked={filters.isUnread}
                onChange={handleFilterChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="filter-unread" className="ml-2 block text-sm text-gray-700">
                {tEmail('filters.fields.isUnread')}
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tEmail('filters.labels.title')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleLabelToggle(label.id)}
                    className={`px-2 py-1 rounded-full text-xs flex items-center ${
                      filters.labels.includes(label.id)
                        ? `${label.color} text-white`
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1 ${
                        filters.labels.includes(label.id) ? 'bg-white' : label.color
                      }`}
                    ></span>
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex items-center"
            >
              <X size={14} className="mr-1" /> {tEmail('filters.buttons.clear')}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleApply}
              className="flex items-center"
            >
              <Filter size={14} className="mr-1" /> {tEmail('filters.buttons.apply')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailFilters;
