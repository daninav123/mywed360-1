import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../logger.js';
import { requireSupplierAuth } from './supplier-dashboard.js';

const router = express.Router();

// ============================================
// MENSAJERÍA DIRECTA
// ============================================

// GET /conversations - Listar conversaciones del proveedor
router.get('/conversations', requireSupplierAuth, async (req, res) => {
  try {
    const { status = 'all', limit = 50 } = req.query;

    let query = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('conversations')
      .orderBy('lastMessageAt', 'desc');

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(Number(limit)).get();

    const conversations = [];
    for (const doc of snapshot.docs) {
      const convData = doc.data();

      // Obtener datos del cliente
      let clientData = null;
      if (convData.userId) {
        try {
          const userDoc = await db.collection('users').doc(convData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            clientData = {
              name: userData.name || userData.displayName || 'Cliente',
              email: userData.email,
              avatar: userData.photoURL || null,
            };
          }
        } catch (err) {
          logger.warn(`Could not fetch user data for conversation ${doc.id}`);
        }
      }

      conversations.push({
        id: doc.id,
        ...convData,
        client: clientData || { name: 'Anónimo' },
      });
    }

    return res.json({ success: true, conversations });
  } catch (error) {
    logger.error('Error listing conversations:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /conversations/:conversationId/messages - Obtener mensajes de una conversación
router.get('/conversations/:conversationId/messages', requireSupplierAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 100, before } = req.query;

    let query = db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(Number(limit));

    if (before) {
      query = query.where('createdAt', '<', new Date(before));
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Marcar conversación como leída
    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('conversations')
      .doc(conversationId)
      .update({
        unreadCount: 0,
        lastReadAt: FieldValue.serverTimestamp(),
      });

    return res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    logger.error('Error getting messages:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /conversations/:conversationId/messages - Enviar mensaje
router.post(
  '/conversations/:conversationId/messages',
  requireSupplierAuth,
  express.json(),
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { message, attachments = [] } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'message_required' });
      }

      const conversationRef = db
        .collection('suppliers')
        .doc(req.supplier.id)
        .collection('conversations')
        .doc(conversationId);

      const conversationDoc = await conversationRef.get();
      if (!conversationDoc.exists) {
        return res.status(404).json({ error: 'conversation_not_found' });
      }

      const messageData = {
        message: message.trim(),
        senderId: req.supplier.id,
        senderType: 'supplier',
        attachments,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      };

      // Añadir mensaje a la subcolección
      const messageRef = await conversationRef.collection('messages').add(messageData);

      // Actualizar conversación
      await conversationRef.update({
        lastMessage: message.trim().substring(0, 100),
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessageBy: 'supplier',
      });

      // TODO: Enviar notificación push al cliente
      logger.info(`Supplier ${req.supplier.id} sent message in conversation ${conversationId}`);

      return res.json({
        success: true,
        messageId: messageRef.id,
        message: { id: messageRef.id, ...messageData },
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      return res.status(500).json({ error: 'internal_error' });
    }
  }
);

// POST /conversations/:conversationId/archive - Archivar conversación
router.post('/conversations/:conversationId/archive', requireSupplierAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('conversations')
      .doc(conversationId)
      .update({
        status: 'archived',
        archivedAt: FieldValue.serverTimestamp(),
      });

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error archiving conversation:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /conversations/:conversationId/unarchive - Desarchivar conversación
router.post('/conversations/:conversationId/unarchive', requireSupplierAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await db
      .collection('suppliers')
      .doc(req.supplier.id)
      .collection('conversations')
      .doc(conversationId)
      .update({
        status: 'active',
        archivedAt: null,
      });

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error unarchiving conversation:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
