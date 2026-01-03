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
      handleExceptions: true,
      handleRejections: true,
    }),
    // Archivo para errores con rotación diaria y límite de tamaño
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: combine(timestamp(), json()),
      maxSize: '5m',
      maxFiles: '7d',
      zippedArchive: true,
      auditFile: 'logs/.audit-error.json',
      handleExceptions: true,
      handleRejections: true,
    }),
    // Archivo para todos los logs con rotación
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: combine(timestamp(), json()),
      maxSize: '10m',
      maxFiles: '3d',
      zippedArchive: true,
      auditFile: 'logs/.audit-combined.json',
    }),
  ],
  exitOnError: false,
});

// Manejar errores EPIPE y otros errores de transporte
logger.on('error', (error) => {
  if (error.code === 'EPIPE' || error.syscall === 'write') {
    // Silenciar errores EPIPE que no son críticos
    return;
  }
  console.error('Logger error:', error);
});

// Prevenir que errores del logger causen crashes
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE' && error.syscall === 'write') {
    // Ignorar EPIPE errors del logger
    return;
  }
  // Re-lanzar otros errores
  throw error;
});

export default logger;
