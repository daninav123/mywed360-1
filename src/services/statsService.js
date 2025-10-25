/**
 * Servicio para recolectar y analizar estadísticas de uso del sistema de correo
 * Proporciona métricas sobre actividad de correo, patrones de comunicación,
 * distribución por etiquetas y carpetas, etc.
 */

import i18n from '../i18n';
import { getAggregatedStats, getDailyStats } from './emailMetricsService';
import { getMails } from './emailService';
import { getUserFolders, getEmailsInFolder } from './folderService';
import { getUserTags, getEmailsByTag, getEmailTagsDetails } from './tagService';

/**
 * Almacena las estadísticas de correo del usuario en localStorage
 * @param {string} userId - ID del usuario
 * @param {Object} stats - Estadísticas a almacenar
 */
const saveUserStats = (userId, stats) => {
  if (!userId) return;
  localStorage.setItem(`maloveapp_email_stats_${userId}`, JSON.stringify(stats));
};

/**
 * Recupera las estadísticas de correo del usuario desde localStorage
 * @param {string} userId - ID del usuario
 * @returns {Object} Estadísticas del usuario o un objeto vacío
 */
const getUserStats = (userId) => {
  if (!userId) return {};
  try {
    const stats = localStorage.getItem(`maloveapp_email_stats_${userId}`);
    return stats ? JSON.parse(stats) : {};
  } catch (error) {
    console.error('Error al recuperar estadísticas:', error);
    return {};
  }
};

/**
 * Genera estadísticas completas de uso del correo para el usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas completas
 */
const generateUserStats = async (userId) => {
  if (!userId) return {};

  try {
    // Intentar obtener métricas agregadas desde Firestore
    const aggregated = await getAggregatedStats(userId);
    if (aggregated) {
      // Guardar copia local para acceso offline
      saveUserStats(userId, { ...aggregated, lastUpdated: new Date().toISOString() });
      return aggregated;
    }

    // --- Fallback local: calcular métricas en el cliente ---
    const inboxEmails = await getMails('inbox');
    const sentEmails = await getMails('sent');
    const trashEmails = await getMails('trashi18n.t('common.combinar_todos_los_correos_para_analisis')Error al generar estadísticas:', error);
    return {
      error: true,
      message: i18n.t('common.pudieron_generar_las_estadisticas'),
    };
  }
};

/**
 * Calcula métricas de actividad (correos por día/semana/mes)
 * @param {Array} emails - Lista de correos
 * @returns {Object} Métricas de actividad
 */
const calculateActivityMetrics = (emails) => {
  // Inicializar estructura de datos
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Inicializar contadores
  const metrics = {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    thisMonth: 0,
    daily: {}, // Para gráfico diario
  };

  // Preparar estructura para gráfico diario (últimos 7 días)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    metrics.daily[dateStr] = {
      sent: 0,
      received: 0,
      date: dateStr,
    };
  }

  // Analizar correos
  emails.forEach((email) => {
    if (!email.date) return;

    const emailDate = new Date(email.date);

    // Determinar si es enviado o recibido
    const isSent = email.from && email.from.includes('@maloveapp.comi18n.t('common.contar_por_periodo_emaildate_today_metricstoday')Ti18n.t('common.metricsdailydatestr_issent_metricsdailydatestrsent_else_metricsdailydatestrreceived_emaildate')inbox') folderDistribution.system.inbox++;
    else if (email.folder === 'sent') folderDistribution.system.sent++;
    else if (email.folder === 'trashi18n.t('common.folderdistributionsystemtrash_obtener_carpetas_personalizadas_const_customfolders')@maloveapp.com')) {
      const senderName = extractNameFromEmail(email.from);
      const senderContact = contactMap.get(senderName) || {
        name: senderName,
        sent: 0,
        received: 0,
        lastContact: null,
      };

      senderContact.received++;

      if (
        !senderContact.lastContact ||
        new Date(email.date) > new Date(senderContact.lastContact)
      ) {
        senderContact.lastContact = email.date;
      }

      contactMap.set(senderName, senderContact);
    }

    // Procesar destinatario
    if (email.to && !email.to.includes('@maloveapp.comi18n.t('common.const_recipientname_extractnamefromemailemailto_const_recipientcontact_contactmapgetrecipientname')Desconocido';

  // Si tiene formato "Nombre <email@ejemplo.com>"
  const match = emailAddress.match(/^([^<]+)\s*<([^>]+)>$/);
  if (match) {
    return match[1].trim();
  }

  // Si es solo correo, extraer parte local
  const parts = emailAddress.split('@');
  if (parts.length === 2) {
    return parts[0];
  }

  return emailAddress;
};

/**
 * Calcula métricas de respuesta (tiempo promedio, tasa de respuesta)
 * @param {Array} inboxEmails - Correos recibidos
 * @param {Array} sentEmails - Correos enviados
 * @returns {Object} Métricas de respuesta
 */
const calculateResponseMetrics = (inboxEmails, sentEmails) => {
  // Mapear correos enviados por referencia a correo original (In-Reply-To)
  const repliesMap = new Map();

  sentEmails.forEach((email) => {
    if (email.inReplyTo) {
      repliesMap.set(email.inReplyTo, email);
    }
  });

  // Analizar tiempos de respuesta
  let totalResponseTime = 0;
  let responseCount = 0;

  inboxEmails.forEach((receivedEmail) => {
    const reply = repliesMap.get(receivedEmail.id);

    if (reply) {
      const receivedDate = new Date(receivedEmail.date);
      const replyDate = new Date(reply.date);

      if (receivedDate && replyDate) {
        const responseTime = replyDate - receivedDate;
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
  });

  // Calcular métricas
  const metrics = {
    responseRate: inboxEmails.length > 0 ? responseCount / inboxEmails.length : 0,
    averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : null,
    responseCount: responseCount,
    formattedAvgResponseTime: null,
  };

  // Formatear tiempo de respuesta promedio en formato amigable
  if (metrics.averageResponseTime !== null) {
    const avgMinutes = Math.floor(metrics.averageResponseTime / (1000 * 60));

    if (avgMinutes < 60) {
      metrics.formattedAvgResponseTime = `${avgMinutes} minutos`;
    } else if (avgMinutes < 24 * 60) {
      metrics.formattedAvgResponseTime = `${Math.floor(avgMinutes / 60)} horas`;
    } else {
      metrics.formattedAvgResponseTime = `${Math.floor(avgMinutes / (60 * 24))} días`;
    }
  }

  return metrics;
};

export { generateUserStats, getUserStats, saveUserStats };


