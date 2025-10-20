import express from 'express';
import { importCSV, importVCF } from '../services/contactsService.js';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendInternalError,
  sendServiceUnavailable,
} from '../utils/apiResponse.js';

const router = express.Router();

/**
 * POST /api/contacts/import
 * Importa contactos desde archivos CSV o VCF
 */
router.post('/import', async (req, res) => {
  try {
    const { weddingId, fileType, content, mapping } = req.body;

    if (!weddingId) {
      return sendValidationError(req, res, [{ message: 'weddingId is required' }]);
    }

    if (!content || typeof content !== 'string') {
      return sendValidationError(req, res, [{ message: 'content is required' }]);
    }

    if (!fileType || !['csv', 'vcf'].includes(fileType)) {
      return sendValidationError(req, res, [{ message: 'fileType must be csv or vcf' }]);
    }

    let result;
    
    if (fileType === 'csv') {
      result = await importCSV(weddingId, content, mapping || {});
    } else if (fileType === 'vcf') {
      result = await importVCF(weddingId, content);
    }

    if (!result || !result.imported) {
      return sendError(req, res, 'import_failed', 'Import failed', 500);
    }

    return sendSuccess(req, res, { imported: result.imported });
  } catch (err) {
    console.error('[contacts/import] Error:', err);
    return sendInternalError(req, res, err);
  }
});

/**
 * GET /api/contacts/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const { health } = await import('../services/contactsService.js');
    const result = await health();
    if (result.ok) {
      return sendSuccess(req, res, { status: 'healthy' });
    }
    return sendServiceUnavailable(req, res, 'Service unavailable');
  } catch (err) {
    return sendServiceUnavailable(req, res, err.message);
  }
});

export default router;
