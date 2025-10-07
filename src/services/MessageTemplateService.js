// src/services/MessageTemplateService.js
// Gestión simple del mensaje plantilla para invitaciones por WhatsApp (API)

const KEY = 'whatsapp_invite_template';
const DEFAULT_TEMPLATE =
  '¡Hola {guestName}! Nos encantaría contar contigo en nuestra boda. Para confirmar, responde "Sí" o "No" a este mensaje. Después te preguntaremos acompañantes y alergias.';

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

export function renderInviteMessage(guestName = '') {
  const tpl = getInviteTemplate();
  return tpl.replaceAll('{guestName}', guestName || '');
}

export default { getInviteTemplate, setInviteTemplate, renderInviteMessage };
