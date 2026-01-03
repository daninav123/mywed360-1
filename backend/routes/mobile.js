import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = express.Router();

router.get('/health', (req, res) => {
  return sendSuccess(req, res, { message: 'mobile api ok', timestamp: new Date().toISOString() });
});

router.get('/suppliers/shortlist', optionalAuth, async (req, res) => {
  try {
    const mockItems = [
      {
        id: 'sample-florist-001',
        name: 'Floristería Prisma',
        service: 'Florista',
        location: 'Barcelona',
        match: 0.92,
      },
      {
        id: 'sample-catering-002',
        name: 'Banquetes Delicia',
        service: 'Catering',
        location: 'Madrid',
        match: 0.86,
      },
      {
        id: 'sample-dj-003',
        name: 'DJ Sunset Vibes',
        service: 'Música',
        location: 'Valencia',
        match: 0.81,
      },
    ];

    return sendSuccess(req, res, {
      items: mockItems,
      source: 'mock',
      user: req.userProfile?.email || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || 'mobile_suppliers_failed' });
  }
});

export default router;
