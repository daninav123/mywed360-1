import { X, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { post as apiPost, get as apiGet, del as apiDel } from '../../services/apiClient';
import {
  getUserTags,
  getEmailTagsDetails,
  addTagToEmail,
  removeTagFromEmail,
} from '../../services/tagService';
import { safeRender, safeMap } from '../../utils/promiseSafeRenderer';

const IS_CYPRESS = typeof window !== 'undefined' && typeof window.Cypress !== 'undefined';
const apiOptions = (extra = {}) => ({
  ...(extra || {}),
  auth: IS_CYPRESS ? false : extra?.auth ?? true,
});

/**
 * Componente para gestionar etiquetas de un correo electrónico.
 */
const EmailTagsManager = ({ emailId, onTagsChange }) => {
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isSelectingTag, setIsSelectingTag] = useState(false);
  const { currentUser } = useAuth();

  const resolveUserId = () => currentUser?.uid || 'cypress-user';

  useEffect(() => {
    if (!emailId) return;
    const uid = resolveUserId();
    try {
      const availableTags = getUserTags(uid);
      setAllTags(Array.isArray(availableTags) ? availableTags : []);

      const emailTags = getEmailTagsDetails(uid, emailId);
      setTags(Array.isArray(emailTags) ? emailTags : []);
    } catch (error) {
      console.warn('EmailTagsManager: error loading tags', error);
      setAllTags([]);
      setTags([]);
    }
  }, [currentUser, emailId]);

  const handleAddTag = async (tagId) => {
    if (!emailId || !tagId) return;
    const uid = resolveUserId();
    try {
      try {
        await apiPost(`/api/email/${emailId}/tag`, { tagId }, apiOptions());
      } catch (error) {
        console.warn('EmailTagsManager: backend add tag failed', error);
      }

      let updatedTags = [];
      try {
        const response = await apiGet(`/api/email/${emailId}`, apiOptions());
        if (response?.ok) {
          const payload = await response.json();
          updatedTags = payload?.data?.tagsDetails || payload?.data?.tags || [];
        }
      } catch (error) {
        console.warn('EmailTagsManager: backend refresh failed', error);
      }

      if (!Array.isArray(updatedTags) || updatedTags.length === 0) {
        addTagToEmail(uid, emailId, tagId);
        updatedTags = getEmailTagsDetails(uid, emailId);
      }

      const normalized = Array.isArray(updatedTags) ? updatedTags : [];
      setTags(normalized);
      setIsSelectingTag(false);
      if (onTagsChange) onTagsChange(normalized);
    } catch (error) {
      console.error('Error al añadir etiqueta:', error);
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (!emailId || !tagId) return;
    const uid = resolveUserId();
    try {
      try {
        await apiDel(`/api/email/${emailId}/tag/${tagId}`, apiOptions());
      } catch (error) {
        console.warn('EmailTagsManager: backend remove tag failed', error);
      }

      let updatedTags = [];
      try {
        const response = await apiGet(`/api/email/${emailId}`, apiOptions());
        if (response?.ok) {
          const payload = await response.json();
          updatedTags = payload?.data?.tagsDetails || payload?.data?.tags || [];
        }
      } catch (error) {
        console.warn('EmailTagsManager: backend refresh failed', error);
      }

      if (!Array.isArray(updatedTags) || updatedTags.length === 0) {
        removeTagFromEmail(uid, emailId, tagId);
        updatedTags = getEmailTagsDetails(uid, emailId);
      }

      const normalized = Array.isArray(updatedTags) ? updatedTags : [];
      setTags(normalized);
      if (onTagsChange) onTagsChange(normalized);
    } catch (error) {
      console.error('Error al quitar etiqueta:', error);
    }
  };

  return (
    <div className="mt-2">
      <div className="mb-2 flex flex-wrap gap-2">
        {safeMap(tags).map((tag) => (
          <div
            key={safeRender(tag?.id, '')}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            data-testid="email-tag"
            style={{
              backgroundColor: `${safeRender(tag?.color, '#64748b')}20`,
              color: safeRender(tag?.color, '#64748b'),
              borderColor: `${safeRender(tag?.color, '#64748b')}50`,
              borderWidth: '1px',
            }}
          >
            <span>{safeRender(tag?.name, '')}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(safeRender(tag?.id, ''))}
              className="ml-1 rounded-full hover:bg-opacity-20 hover:bg-gray-600 remove-tag-button"
              data-testid="remove-tag-button"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {!isSelectingTag ? (
          <button
            type="button"
            onClick={() => setIsSelectingTag(true)}
            data-testid="tag-menu-button"
            className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50"
          >
            <Plus size={12} className="mr-1" />
            Añadir etiqueta
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSelectingTag(false)}
            data-testid="tag-menu-button"
            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
          >
            <X size={12} className="mr-1" />
            Cancelar
          </button>
        )}
      </div>

      {isSelectingTag && (
        <div className="mt-1 max-h-32 overflow-y-auto rounded-md border bg-white p-2 shadow-sm">
          <div className="space-y-1">
            {safeMap(allTags)
              .filter(
                (tag) =>
                  !safeMap(tags).some(
                    (t) => safeRender(t?.id, '') === safeRender(tag?.id, '')
                  )
              )
              .map((tag) => (
                <div
                  key={safeRender(tag?.id, '')}
                  onClick={() => handleAddTag(safeRender(tag?.id, ''))}
                  data-testid="tag-option"
                  className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100"
                >
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: safeRender(tag?.color, '#64748b') }}
                  />
                  <span className="text-sm">{safeRender(tag?.name, '')}</span>
                </div>
              ))}

            {allTags.filter((tag) => !tags.some((t) => t?.id === tag?.id)).length === 0 && (
              <div className="py-2 text-center text-xs text-gray-500">
                No hay más etiquetas disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTagsManager;
