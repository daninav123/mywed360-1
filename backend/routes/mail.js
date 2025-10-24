import express from 'express';
import getRoutes from './mail/getRoutes.js';
import postSend from './mail/postSend.js';
import attachments from './mail/attachments.js';
import readStatus from './mail/readStatus.js';
import alias from './mail/alias.js';
import testPersonalEmail from './mail/testPersonalEmail.js';
import templates from './mail/templates.js';

const router = express.Router();

// Orden de montaje: rutas fijas -> dinámicas
router.use('/', templates);
router.use('/', getRoutes);
router.use('/', attachments);
router.use('/', readStatus);
router.use('/', alias);
router.use('/', postSend);
router.use('/', testPersonalEmail);

export default router;

