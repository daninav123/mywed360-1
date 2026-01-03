import express from 'express';
import pkg from 'pg';
import { requireAuth } from '../middleware/authMiddleware.js';

const { Pool } = pkg;
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// POST /api/weddings - Crear nueva boda
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('[weddings] POST - Creating wedding');
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autenticado' 
      });
    }

    const { 
      coupleName, 
      weddingDate, 
      celebrationPlace, 
      status, 
      numGuests,
      eventType 
    } = req.body;

    console.log('[weddings] Creating wedding for user:', userId);
    console.log('[weddings] Data:', { coupleName, weddingDate });

    const result = await pool.query(`
      INSERT INTO weddings (
        "userId",
        "coupleName",
        "weddingDate",
        "celebrationPlace",
        status,
        "numGuests",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      userId,
      coupleName || 'Mi Boda',
      weddingDate || null,
      celebrationPlace || null,
      status || 'planning',
      numGuests || null
    ]);

    const wedding = result.rows[0];
    console.log('[weddings] Wedding created:', wedding.id);

    res.json({
      success: true,
      data: wedding
    });
  } catch (error) {
    console.error('[weddings] Error creating wedding:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/user/weddings - Obtener todas las bodas del usuario
router.get('/weddings', requireAuth, async (req, res) => {
  try {
    console.log('[user-weddings] Request received');
    const userId = req.user?.uid;
    console.log('[user-weddings] User ID:', userId);
    
    if (!userId) {
      console.log('[user-weddings] No user ID - returning 401');
      return res.status(401).json({ 
        success: false, 
        error: 'No autenticado' 
      });
    }

    console.log('[user-weddings] Querying database for user:', userId);
    // Obtener bodas donde el usuario es owner o tiene acceso
    const result = await pool.query(`
      SELECT 
        w.id,
        w."coupleName",
        w."weddingDate",
        w."celebrationPlace",
        w.status,
        w."numGuests",
        w."createdAt",
        w."updatedAt",
        'OWNER' as role
      FROM weddings w
      WHERE w."userId" = $1
      
      UNION
      
      SELECT 
        w.id,
        w."coupleName",
        w."weddingDate",
        w."celebrationPlace",
        w.status,
        w."numGuests",
        w."createdAt",
        w."updatedAt",
        wa.role
      FROM weddings w
      INNER JOIN wedding_access wa ON w.id = wa."weddingId"
      WHERE wa."userId" = $1
      
      ORDER BY "weddingDate" ASC
    `, [userId]);

    console.log('[user-weddings] Found weddings:', result.rows.length);
    console.log('[user-weddings] Weddings data:', JSON.stringify(result.rows, null, 2));
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
    console.log('[user-weddings] Response sent successfully');
  } catch (error) {
    console.error('[user-weddings] Error:', error);
    console.error('[user-weddings] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
