import express from 'express';

import { requireMailAccess } from '../middleware/authMiddleware.js';
import mailOpsRouter from './mail-ops.js';
import { listMails, getMailDetail } from './mail/getRoutes.js';

const router = express.Router();

router.use(requireMailAccess);

router.get('/', (req, res) => {
  if (!req.query.folder) req.query.folder = 'inbox';
  return listMails(req, res);
});

router.get('/all', (req, res) => {
  req.query.folder = 'all';
  return listMails(req, res);
});

const KNOWN_FOLDERS = new Set(['inbox', 'sent', 'trash', 'spam', 'drafts', 'archived', 'archive', 'all']);

router.get('/:resource', (req, res) => {
  const { resource } = req.params;
  if (!resource) {
    req.query.folder = 'inbox';
    return listMails(req, res);
  }
  const normalized = resource.toLowerCase();
  if (KNOWN_FOLDERS.has(normalized) || resource.startsWith('custom:')) {
    req.query.folder = resource;
    return listMails(req, res);
  }
  req.params.id = resource;
  return getMailDetail(req, res);
});

router.post('/:emailId/tag', (req, res, next) => {
  const { emailId } = req.params;
  if (!emailId) return res.status(400).json({ error: 'emailId-required' });

  const payload = new Set();
  const body = req.body || {};

  const add = Array.isArray(body.add) ? body.add : [];
  add.forEach((value) => {
    if (typeof value === 'string' && value.trim()) payload.add(value.trim());
  });

  if (typeof body.tagId === 'string' && body.tagId.trim()) payload.add(body.tagId.trim());
  if (typeof body.tag === 'string' && body.tag.trim()) payload.add(body.tag.trim());
  if (typeof body.name === 'string' && body.name.trim()) payload.add(body.name.trim());
  if (typeof body.tagName === 'string' && body.tagName.trim()) payload.add(body.tagName.trim());

  if (!payload.size) {
    return res.status(400).json({ error: 'tag-required' });
  }

  req.body = { add: Array.from(payload) };
  req.method = 'POST';
  const targetPath = `/${encodeURIComponent(emailId)}/tags`;
  req.url = targetPath;
  req.originalUrl = targetPath;
  req.params = {};
  return mailOpsRouter.handle(req, res, next);
});

router.delete('/:emailId/tag/:tagId', (req, res, next) => {
  const { emailId, tagId } = req.params;
  if (!emailId || !tagId) return res.status(400).json({ error: 'emailId-and-tagId-required' });

  req.body = { remove: [String(tagId).trim()] };
  req.method = 'POST';
  const targetPath = `/${encodeURIComponent(emailId)}/tags`;
  req.url = targetPath;
  req.originalUrl = targetPath;
  req.params = {};
  return mailOpsRouter.handle(req, res, next);
});

export default router;
