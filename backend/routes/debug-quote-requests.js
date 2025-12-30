/**
 * Ruta de debug para ver solicitudes de presupuesto
 * PROTEGIDO: Solo admin puede acceder
 */

import express from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/debug-quote-requests/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Buscando solicitudes para userId: ${userId}`);
    
    // Buscar en quote-requests-internet
    const snapshot = await db.collection('quote-requests-internet')
      .where('userId', '==', userId)
      .get();
    
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Encontradas ${requests.length} solicitudes`);
    
    res.json({
      success: true,
      userId,
      totalFound: requests.length,
      requests: requests.map(r => ({
        id: r.id,
        supplierName: r.supplierName,
        status: r.status,
        createdAt: r.createdAt,
        userId: r.userId
      }))
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
