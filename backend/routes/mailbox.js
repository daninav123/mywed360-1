import express from 'express';
import {
  getUserMessages,
  markAsRead,
  toggleStar,
  archiveMessage,
  getUnreadCount,
} from '../services/mailboxService.js';

const router = express.Router();

/**
 * GET /api/mailbox/inbox
 * Obtener bandeja de entrada
 */
router.get('/inbox', async (req, res) => {
  try {
    const { userId, unreadOnly, category, limit } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const messages = await getUserMessages(userId, 'received', {
      unreadOnly: unreadOnly === 'true',
      category: category || null,
      limit: limit ? parseInt(limit) : 50,
      archived: false,
    });
    
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/mailbox/sent
 * Obtener bandeja de salida
 */
router.get('/sent', async (req, res) => {
  try {
    const { userId, category, limit } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const messages = await getUserMessages(userId, 'sent', {
      category: category || null,
      limit: limit ? parseInt(limit) : 50,
      archived: false,
    });
    
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/mailbox/archived
 * Obtener mensajes archivados
 */
router.get('/archived', async (req, res) => {
  try {
    const { userId, type } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const messages = await getUserMessages(userId, type || 'received', {
      archived: true,
      limit: 100,
    });
    
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching archived messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/mailbox/:id/read
 * Marcar mensaje como leído
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await markAsRead(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/mailbox/:id/star
 * Toggle estrella en mensaje
 */
router.patch('/:id/star', async (req, res) => {
  try {
    const { id } = req.params;
    const { starred } = req.body;
    await toggleStar(id, starred);
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling star:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/mailbox/:id/archive
 * Archivar mensaje
 */
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    await archiveMessage(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error archiving message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/mailbox/unread-count
 * Obtener contador de no leídos
 */
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
