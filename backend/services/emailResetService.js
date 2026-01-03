/**
 * Servicio para envío de emails de reset de password
 * Usa Mailgun configurado en el backend
 */

import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

// Inicializar cliente Mailgun
let mg = null;

const initMailgun = () => {
  if (mg) return mg;
  
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const isEU = process.env.MAILGUN_EU_REGION === 'true';
  
  if (!apiKey || !domain) {
    console.warn('[EmailReset] Mailgun no configurado. MAILGUN_API_KEY o MAILGUN_DOMAIN faltantes.');
    return null;
  }
  
  mg = mailgun.client({
    username: 'api',
    key: apiKey,
    url: isEU ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
  });
  
  console.log(`[EmailReset] Mailgun inicializado correctamente (región: ${isEU ? 'EU' : 'US'})`);
  return mg;
};

/**
 * Enviar email de reset de password
 */
export async function sendPasswordResetEmail(email, resetToken) {
  try {
    const client = initMailgun();
    
    if (!client) {
      console.warn('[EmailReset] No se puede enviar email - Mailgun no configurado');
      return { success: false, error: 'Email service not configured' };
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password-confirm?token=${resetToken}`;
    
    const emailData = {
      from: `MaLoveApp <noreply@${process.env.MAILGUN_SENDING_DOMAIN}>`,
      to: email,
      subject: 'Resetear tu password - MaLoveApp',
      html: generateResetEmailHTML(resetLink),
      text: generateResetEmailText(resetLink),
    };
    
    const response = await client.messages.create(process.env.MAILGUN_SENDING_DOMAIN, emailData);
    
    console.log('[EmailReset] Email enviado correctamente:', response.id);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('[EmailReset] Error al enviar email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Template HTML para email de reset
 */
function generateResetEmailHTML(resetLink) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resetear Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      font-size: 22px;
      margin-top: 0;
    }
    .content p {
      color: #666;
      margin: 16px 0;
      font-size: 16px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .link-fallback {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      word-break: break-all;
      font-size: 14px;
      color: #666;
    }
    .footer {
      background: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      font-size: 14px;
      color: #999;
    }
    .footer p {
      margin: 8px 0;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Resetear Password</h1>
    </div>
    
    <div class="content">
      <h2>Hola,</h2>
      
      <p>Recibimos una solicitud para resetear la password de tu cuenta en <strong>MaLoveApp</strong>.</p>
      
      <p>Si fuiste tú quien solicitó esto, haz click en el botón de abajo para crear una nueva password:</p>
      
      <div class="button-container">
        <a href="${resetLink}" class="button">
          Resetear mi password
        </a>
      </div>
      
      <p style="font-size: 14px; color: #999;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:
      </p>
      
      <div class="link-fallback">
        ${resetLink}
      </div>
      
      <div class="warning">
        <p><strong>⏱️ Este enlace expira en 1 hora</strong></p>
        <p>Por seguridad, el enlace solo es válido por 60 minutos.</p>
      </div>
      
      <div class="warning" style="background: #f8d7da; border-color: #dc3545;">
        <p style="color: #721c24;"><strong>⚠️ ¿No solicitaste esto?</strong></p>
        <p style="color: #721c24;">Si no pediste resetear tu password, simplemente ignora este email. Tu cuenta está segura.</p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>MaLoveApp</strong></p>
      <p>Tu asistente de planificación de bodas</p>
      <p style="margin-top: 16px;">Este es un email automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template texto plano para email de reset
 */
function generateResetEmailText(resetLink) {
  return `
Resetear tu password - MaLoveApp

Hola,

Recibimos una solicitud para resetear la password de tu cuenta en MaLoveApp.

Si fuiste tú quien solicitó esto, copia y pega el siguiente enlace en tu navegador para crear una nueva password:

${resetLink}

⏱️ Este enlace expira en 1 hora

⚠️ ¿No solicitaste esto?
Si no pediste resetear tu password, simplemente ignora este email. Tu cuenta está segura.

---
MaLoveApp
Tu asistente de planificación de bodas

Este es un email automático, por favor no respondas.
  `;
}

export default {
  sendPasswordResetEmail,
};
