import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

// Asegurar que la carpeta logs exista
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración de Winston para mostrar los logs en consola y guardarlos en archivo
const { combine, timestamp, colorize, printf, errors, json } = winston.format;

const redactEnabled =
  String(process.env.LOG_REDACT || '').toLowerCase() === 'true' || process.env.LOG_REDACT === '1';

function redactText(s) {
  try {
    let t = String(s || '');
    // Emails
    t = t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
    // Phone-like sequences
    t = t.replace(/\+?\d[\d\s\-().]{6,}\d/g, '[REDACTED_PHONE]');
    // Bearer/API tokens
    t = t.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED_TOKEN]');
    return t;
  } catch {
    return s;
  }
}

const redactFormat = winston.format((info) => {
  if (!redactEnabled) return info;
  const out = { ...info };
  if (typeof out.message === 'string') out.message = redactText(out.message);
  if (typeof out.stack === 'string') out.stack = redactText(out.stack);
  return out;
});

const humanFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Incluye stack trace en errores
    redactFormat()
  ),
  transports: [
    // Consola con colores, para ver en tiempo real en CMD/PowerShell
    new winston.transports.Console({
      format: combine(colorize(), humanFormat),
    }),
    // Archivo para errores con rotación diaria y límite de tamaño
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: combine(timestamp(), json()),
      maxSize: '100m', // Rotación automática cuando alcance 100MB
      maxFiles: '14d', // Mantener logs de los últimos 14 días
      zippedArchive: true, // Comprimir logs antiguos
    }),
    // Archivo para todos los logs con rotación
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: combine(timestamp(), json()),
      maxSize: '100m',
      maxFiles: '7d', // Mantener logs combinados de los últimos 7 días
      zippedArchive: true,
    }),
  ],
});

export default logger;
