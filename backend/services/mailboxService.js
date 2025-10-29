import admin from '../firebaseAdmin.js';
import nodemailer from 'nodemailer';

const db = admin.firestore();

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Enviar email y guardarlo en la bandeja de salida del remitente
 * y en la bandeja de entrada del destinatario
 * 
 * @param {Object} emailData - Datos del email
 * @returns {Promise<Object>} - Resultado con IDs de los mensajes creados
 */
async function sendEmailWithMailbox(emailData) {
  const {
    // Remitente
    fromEmail,
    fromName,
    fromUserId,
    
    // Destinatario
    toEmail,
    toName,
    toUserId,
    toSupplierId,
    
    // Contenido
    subject,
    textMessage,
    htmlMessage,
    
    // Metadata
    category = 'general',
    relatedTo = null,
    
    // Adjuntos
    attachments = [],
  } = emailData;

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // 1. ENVIAR EMAIL REAL por SMTP
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: `"${toName}" <${toEmail}>`,
      subject,
      text: textMessage,
      html: htmlMessage || textMessage,
      attachments,
    };
    
    let emailSent = false;
    let emailError = null;
    
    try {
      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log(`✅ Email enviado a ${toEmail}`);
    } catch (error) {
      emailError = error.message;
      console.error(`❌ Error enviando email a ${toEmail}:`, error);
    }

    // 2. GUARDAR en BANDEJA DE SALIDA del remitente
    const outboxMessageId = db.collection('mailbox').doc().id;
    const outboxMessage = {
      id: outboxMessageId,
      userId: fromUserId,
      type: 'sent',
      
      from: {
        email: fromEmail,
        name: fromName,
        userId: fromUserId,
      },
      to: {
        email: toEmail,
        name: toName,
        userId: toUserId || null,
        supplierId: toSupplierId || null,
      },
      
      subject,
      message: textMessage,
      htmlContent: htmlMessage || null,
      
      category,
      relatedTo,
      
      status: emailSent ? 'sent' : 'failed',
      emailSent,
      emailError,
      read: true, // Los mensajes enviados se marcan como leídos automáticamente
      starred: false,
      archived: false,
      
      sentAt: timestamp,
      readAt: timestamp,
      
      attachments,
    };
    
    await db.collection('mailbox').doc(outboxMessageId).set(outboxMessage);

    // 3. GUARDAR en BANDEJA DE ENTRADA del destinatario (si tiene userId)
    let inboxMessageId = null;
    if (toUserId) {
      inboxMessageId = db.collection('mailbox').doc().id;
      const inboxMessage = {
        id: inboxMessageId,
        userId: toUserId,
        type: 'received',
        
        from: {
          email: fromEmail,
          name: fromName,
          userId: fromUserId || null,
        },
        to: {
          email: toEmail,
          name: toName,
          userId: toUserId,
          supplierId: toSupplierId || null,
        },
        
        subject,
        message: textMessage,
        htmlContent: htmlMessage || null,
        
        category,
        relatedTo,
        
        status: emailSent ? 'delivered' : 'failed',
        emailSent,
        emailError,
        read: false, // Los mensajes recibidos inician como no leídos
        starred: false,
        archived: false,
        
        sentAt: timestamp,
        readAt: null,
        
        attachments,
      };
      
      await db.collection('mailbox').doc(inboxMessageId).set(inboxMessage);
    }

    return {
      success: true,
      emailSent,
      outboxMessageId,
      inboxMessageId,
    };
    
  } catch (error) {
    console.error('Error in sendEmailWithMailbox:', error);
    throw error;
  }
}

/**
 * Obtener mensajes de un usuario (inbox o sent)
 */
async function getUserMessages(userId, type = 'received', options = {}) {
  try {
    const {
      limit = 50,
      unreadOnly = false,
      category = null,
      archived = false,
    } = options;
    
    let query = db.collection('mailbox')
      .where('userId', '==', userId)
      .where('type', '==', type)
      .where('archived', '==', archived);
    
    if (unreadOnly) {
      query = query.where('read', '==', false);
    }
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    query = query.orderBy('sentAt', 'desc').limit(limit);
    
    const snapshot = await query.get();
    const messages = [];
    
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Marcar mensaje como leído
 */
async function markAsRead(messageId) {
  try {
    await db.collection('mailbox').doc(messageId).update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'read',
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

/**
 * Marcar mensaje con estrella
 */
async function toggleStar(messageId, starred) {
  try {
    await db.collection('mailbox').doc(messageId).update({ starred });
    return { success: true };
  } catch (error) {
    console.error('Error toggling star:', error);
    throw error;
  }
}

/**
 * Archivar mensaje
 */
async function archiveMessage(messageId) {
  try {
    await db.collection('mailbox').doc(messageId).update({ archived: true });
    return { success: true };
  } catch (error) {
    console.error('Error archiving message:', error);
    throw error;
  }
}

/**
 * Obtener contador de mensajes no leídos
 */
async function getUnreadCount(userId) {
  try {
    const snapshot = await db.collection('mailbox')
      .where('userId', '==', userId)
      .where('type', '==', 'received')
      .where('read', '==', false)
      .where('archived', '==', false)
      .get();
    
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
}

export {
  sendEmailWithMailbox,
  getUserMessages,
  markAsRead,
  toggleStar,
  archiveMessage,
  getUnreadCount,
};
