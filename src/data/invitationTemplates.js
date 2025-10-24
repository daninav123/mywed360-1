// Simple invitation HTML templates with {{placeholders}}.

export const invitationTemplates = [
  {
    id: 'classic',
    name: 'Cl�sico elegante',
    category: 'cl�sico',
    color: 'pastel',
    font: 'Serif',
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8" />
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #1f2937; }
    .card { max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; background: #ffffff; }
    .title { text-align: center; font-size: 24px; margin: 0 0 8px 0; }
    .subtitle { text-align: center; color: #6b7280; margin: 0 0 24px 0; }
    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="title">{{coupleName}}</h1>
    <p class="subtitle">Con mucha ilusi�n te invitamos a celebrar nuestra boda</p>
    <p>Querido/a {{guestName}},</p>
    <p>{{invitationText}}</p>
    <p><strong>Fecha:</strong> {{weddingDate}}<br/>
       <strong>Lugar:</strong> {{venue}}</p>
    {{#if rsvpLink}}<p style="text-align:center; margin-top: 16px;"><a class="btn" href="{{rsvpLink}}" target="_blank">Confirmar asistencia (RSVP)</a></p>{{/if}}
    <p class="footer">Si tienes alguna duda, cont�ctanos. �Gracias!</p>
  </div>
</body></html>`,
  },
  {
    id: 'modern',
    name: 'Moderno minimal',
    category: 'moderno',
    color: 'vibrante',
    font: 'Sans',
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8" />
  <style>
    body { font-family: 'Inter', Arial, sans-serif; color: #111827; }
    .wrap { max-width: 680px; margin: 0 auto; padding: 8px; }
    .hero { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; border-radius: 16px; padding: 28px; text-align: center; }
    h1 { margin: 0 0 6px 0; font-size: 28px; }
    .block { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-top: 16px; padding: 20px; }
    .btn { display: inline-block; background: #111827; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <h1>{{coupleName}}</h1>
      <div>�Nos casamos!</div>
    </div>
    <div class="block">
      <p>Hola {{guestName}},</p>
      <p>{{invitationText}}</p>
      <p><strong>Cu�ndo:</strong> {{weddingDate}}<br/>
         <strong>D�nde:</strong> {{venue}}</p>
      {{#if rsvpLink}}<p style="text-align:center; margin-top: 10px;"><a class="btn" href="{{rsvpLink}}" target="_blank">Confirmar asistencia</a></p>{{/if}}
    </div>
  </div>
</body></html>`,
  },
  {
    id: 'rustic',
    name: 'R�stico',
    category: 'r�stico',
    color: 'tierra',
    font: 'Handwriting',
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8" />
  <style>
    body { background: #fef3c7; color: #1f2937; font-family: 'Courier New', monospace; }
    .frame { max-width: 640px; margin: 0 auto; border: 2px dashed #d97706; padding: 20px; border-radius: 12px; background: #fff7ed; }
    .tt { font-size: 22px; margin: 0 0 12px 0; text-align: center; }
    .btn { display: inline-block; background: #d97706; color: #fff; padding: 8px 14px; border-radius: 6px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="tt">{{coupleName}}</div>
    <p>�Nos encantar�a que nos acompa�aras, {{guestName}}!</p>
    <p>{{invitationText}}</p>
    <p><strong>Fecha:</strong> {{weddingDate}}  <strong>Lugar:</strong> {{venue}}</p>
    {{#if rsvpLink}}<p style="text-align:center; margin-top: 12px;"><a class="btn" href="{{rsvpLink}}" target="_blank">Confirmar asistencia</a></p>{{/if}}
  </div>
</body></html>`,
  },
];

export default invitationTemplates;

