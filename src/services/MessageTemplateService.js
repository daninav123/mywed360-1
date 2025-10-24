�// src/services/MessageTemplateService.js
// Gesti�n simple del mensaje plantilla para invitaciones por WhatsApp (API)

const KEY = 'whatsapp_invite_template';
const DEFAULT_TEMPLATE =
  '�Hola {guestName}! Somos {coupleName} y nos encantar�a contar contigo en nuestra boda. Para confirmar, responde "S�" o "No" a este mensaje. Despu�s te preguntaremos acompa�antes y alergias.';

export function getInviteTemplate() {
  try {
    const v = localStorage.getItem(KEY);
    if (v && typeof v === 'string' && v.trim()) return v;
  } catch {}
  return DEFAULT_TEMPLATE;
}

export function setInviteTemplate(template) {
  try {
    if (typeof template === 'string' && template.trim()) {
      localStorage.setItem(KEY, template.trim());
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const renderPlaceholders = (template = '', context = {}) => {
  return template
    .replaceAll('{guestName}', context.guestName || '')
    .replaceAll('{coupleName}', context.coupleName || 'nuestra boda');
};

export function renderInviteMessage(guestName = '', context = {}) {
  const tpl = getInviteTemplate();
  return renderPlaceholders(tpl, { ...context, guestName });
}

export default { getInviteTemplate, setInviteTemplate, renderInviteMessage };
