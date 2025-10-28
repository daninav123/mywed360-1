import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '../ui';
import {
  getInviteTemplate,
  setInviteTemplate,
  renderInviteMessage,
} from '../../services/MessageTemplateService';
import wh from '../../utils/whDebug';
import Modal from '../Modal';
import useTranslations from '../../hooks/useTranslations';

function InviteTemplateModal({ open, onClose, onSaved, coupleName = 'Ana y Luis' }) {
  const { t } = useTranslations();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      const current = getInviteTemplate();
      setValue(current);
      try {
        wh('TemplateModal/open', { length: current?.length || 0 });
      } catch {}
    }
  }, [open]);

  const previewGuestName = t('whatsapp.inviteTemplate.examples.guestName', { defaultValue: 'María' });
  const guestToken = t('whatsapp.inviteTemplate.tokens.guestName', { defaultValue: '{guestName}' });
  const coupleToken = t('whatsapp.inviteTemplate.tokens.coupleName', { defaultValue: '{coupleName}' });

  const renderPreview = useCallback(
    (template) => {
      if (!template || typeof template !== 'string') {
        return renderInviteMessage(previewGuestName, { coupleName });
      }
      return template
        .replaceAll('{guestName}', previewGuestName)
        .replaceAll('{coupleName}', coupleName);
    },
    [coupleName, previewGuestName]
  );

  const preview = useMemo(
    () => renderPreview(value),
    [value, renderPreview]
  );

  const handleSave = () => {
    let next = value;
    if (next && !next.includes('{coupleName}')) {
      const confirmed = window.confirm(
        t('whatsapp.inviteTemplate.confirmAddCouple', {
          defaultValue:
            'El mensaje no incluye {coupleName}. Se añadirá automáticamente para identificar a la pareja.',
        })
      );
      if (!confirmed) return;
      next = `${next.trim()}\n\n${t('whatsapp.inviteTemplate.appendCouple', {
        defaultValue: 'Somos {coupleName}',
      })}`;
      setValue(next);
    }
    const ok = setInviteTemplate(next);
    if (ok) {
      try {
        wh('TemplateModal/saved', { length: next.length });
      } catch {}
      onSaved?.(next);
    } else {
      toast.error(
        t('whatsapp.inviteTemplate.toast.saveError', {
          defaultValue: 'No se pudo guardar la plantilla.',
        })
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('whatsapp.inviteTemplate.title', { defaultValue: 'Editar mensaje (WhatsApp API)' })}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('whatsapp.inviteTemplate.labels.template', {
              defaultValue: 'Plantilla (soporta {guestName})',
            })}
          </label>
          <textarea
            className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('whatsapp.inviteTemplate.placeholder', {
              defaultValue: '¡Hola {guestName}! Somos {coupleName}…',
            })}
          />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <div>
              {t('whatsapp.inviteTemplate.variables.title', {
                defaultValue: 'Variables disponibles:',
              })}
            </div>
            <div>{`${guestToken} → ${previewGuestName}`}</div>
            <div>{`${coupleToken} → ${coupleName}`}</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            {t('whatsapp.inviteTemplate.previewTitle', { defaultValue: 'Previsualización' })}
          </div>
          <div className="border rounded-md p-3 bg-gray-50 text-sm whitespace-pre-wrap">{preview}</div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="px-3 py-2 text-sm border rounded-md" onClick={onClose}>
            {t('app.cancel', { defaultValue: 'Cancelar' })}
          </button>
          <Button type="button" onClick={handleSave}>
            {t('app.save', { defaultValue: 'Guardar' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default InviteTemplateModal;
