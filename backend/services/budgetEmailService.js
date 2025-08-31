import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import mailgunJs from 'mailgun-js';

// Helper para crear cliente Mailgun (compartido con otras rutas)
function getMailgun() {
  const apiKey = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  const domain = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) return null;
  return mailgunJs({ apiKey, domain });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '..', 'templates', 'budget-status.hbs');
let compiledTemplate;

async function loadTemplate() {
  if (compiledTemplate) return compiledTemplate;
  const tplSrc = await fs.readFile(templatePath, 'utf8');
  compiledTemplate = handlebars.compile(tplSrc);
  return compiledTemplate;
}

export async function sendBudgetStatusEmail({
  supplierEmail,
  supplierName,
  description,
  amount,
  currency,
  status,
}) {
  const mg = getMailgun();
  if (!mg || !supplierEmail) return { skipped: true };

  const statusText = status === 'accepted' ? 'aceptado' : 'rechazado';
  const template = await loadTemplate();
  const text = template({ supplierName, description, amount, currency, statusText });

  const data = {
    from: 'MyWed360 <info@mywed360.com>',
    to: supplierEmail,
    subject: `Presupuesto ${statusText}`,
    text,
  };

  try {
    await mg.messages().send(data);
    return { success: true };
  } catch (err) {
    console.error('Error enviando email de presupuesto:', err.message);
    return { success: false, error: err.message };
  }
}
