import admin from 'firebase-admin';

import logger from '../utils/logger.js';

const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);
const PRIORITY_VALUES = new Set(['low', 'medium', 'high']);
const MAX_BLOCKS = 120;
const MAX_ITEMS_PER_BLOCK = 200;
const MAX_CHECKLIST_ITEMS = 25;
const SCHEMA_VERSION = 1;

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

function slugify(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 60);
}

function makeId(raw, fallback, seen = null) {
  let base = slugify(typeof raw === 'string' ? raw : '');
  if (!base) base = slugify(fallback || '');
  if (!base) base = `id-${randomSuffix()}`;
  let candidate = base;
  let counter = 1;
  if (seen) {
    while (seen.has(candidate)) {
      candidate = `${base}-${counter++}`;
    }
    seen.add(candidate);
  }
  return candidate;
}

function clampNumber(value, min, max, fallback = null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function clampInt(value, min, max, fallback = null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const int = Math.trunc(num);
  if (int < min) return min;
  if (int > max) return max;
  return int;
}

function sanitizeString(value, maxLen = 256, fallback = '') {
  if (typeof value !== 'string') return fallback.slice(0, maxLen);
  const trimmed = value.trim();
  if (!trimmed) return fallback.slice(0, maxLen);
  return trimmed.slice(0, maxLen);
}

function sanitizeOptionalString(value, maxLen = 256) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function sanitizeStringArray(value, maxItems, maxLen) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const clipped = trimmed.slice(0, maxLen);
    const key = clipped.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clipped);
    if (out.length >= maxItems) break;
  }
  return out;
}

function sanitizeChecklist(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  const seen = new Set();
  let idx = 0;
  for (const entry of list) {
    if (idx >= MAX_CHECKLIST_ITEMS) break;
    let label = null;
    let defaultDone = false;
    let id = null;
    if (typeof entry === 'string') {
      label = sanitizeString(entry, 280, '');
      id = makeId(null, `chk-${idx + 1}`, seen);
    } else if (entry && typeof entry === 'object') {
      label = sanitizeString(entry.label || entry.title || '', 280, '');
      id = makeId(entry.id || entry.key, `chk-${idx + 1}`, seen);
      defaultDone = Boolean(entry.defaultDone);
    }
    if (!label) {
      idx += 1;
      continue;
    }
    out.push({
      id,
      label,
      defaultDone,
    });
    idx += 1;
  }
  return out;
}

function sanitizeAdminMeta(rawAdmin) {
  if (!rawAdmin || typeof rawAdmin !== 'object') return null;
  const adminMeta = {};
  if (typeof rawAdmin.category === 'string') {
    adminMeta.category = rawAdmin.category.trim().toUpperCase().slice(0, 60);
  }
  if (typeof rawAdmin.editable === 'boolean') {
    adminMeta.editable = rawAdmin.editable;
  }
  if (typeof rawAdmin.deletable === 'boolean') {
    adminMeta.deletable = rawAdmin.deletable;
  }
  if (typeof rawAdmin.panelPath === 'string') {
    adminMeta.panelPath = rawAdmin.panelPath.trim().slice(0, 160);
  }
  if (typeof rawAdmin.description === 'string') {
    adminMeta.description = rawAdmin.description.trim().slice(0, 1200);
  }
  if (Object.keys(adminMeta).length === 0) return null;
  return adminMeta;
}

function sanitizeMetadata(value) {
  if (!value || typeof value !== 'object') return null;
  try {
    const json = JSON.stringify(value);
    if (!json || json.length > 20000) return null;
    return JSON.parse(json);
  } catch (error) {
    logger.warn('[taskTemplate] metadata serialization failed', { message: error?.message });
    return null;
  }
}

function normalizePct(value, fallback = null) {
  if (value == null) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return clampNumber(num, -1, 2, fallback);
}

function sanitizeTaskItem(rawItem, fallbackId, seen) {
  if (typeof rawItem === 'string') {
    const title = sanitizeString(rawItem, 280, '');
    if (!title) return { item: null, descendants: 0 };
    const id = makeId(null, fallbackId, seen);
    return {
      item: {
        id,
        key: id,
        title,
        name: title,
        description: null,
        category: null,
        tags: [],
        startPct: null,
        endPct: null,
        startOffsetDays: null,
        endOffsetDays: null,
        leadTimeDays: null,
        assigneeSuggestion: null,
        dependencies: [],
        checklist: [],
        priority: null,
        weight: null,
        children: [],
      },
      descendants: 0,
    };
  }

  if (!rawItem || typeof rawItem !== 'object') {
    return { item: null, descendants: 0 };
  }

  const title = sanitizeString(rawItem.title || rawItem.name || rawItem.label || '', 280, '');
  if (!title) return { item: null, descendants: 0 };

  const id = makeId(rawItem.id || rawItem.key, fallbackId, seen);
  const keyCandidate = typeof rawItem.key === 'string' ? rawItem.key.trim() : '';
  const key = keyCandidate || sanitizeString(rawItem.id || title, 120, id);
  const startPct = normalizePct(rawItem.startPct ?? rawItem.relativeStartPct, null);
  const endPct = normalizePct(rawItem.endPct ?? rawItem.relativeEndPct, null);

  const childResult = sanitizeTaskItems(rawItem.children ?? rawItem.subtasks ?? [], id, seen);

  const item = {
    id,
    key,
    title,
    name: title,
    description: sanitizeOptionalString(rawItem.description, 1024),
    category: sanitizeOptionalString(rawItem.category, 60),
    tags: sanitizeStringArray(rawItem.tags, 12, 40),
    startPct,
    endPct,
    startOffsetDays: clampInt(rawItem.startOffsetDays ?? rawItem.leadStartDays, -730, 730, null),
    endOffsetDays: clampInt(rawItem.endOffsetDays ?? rawItem.leadEndDays, -730, 730, null),
    leadTimeDays: clampInt(rawItem.leadTimeDays ?? rawItem.leadTime, -730, 730, null),
    assigneeSuggestion: sanitizeOptionalString(
      rawItem.assigneeSuggestion ?? rawItem.ownerSuggestion,
      80
    ),
    dependencies: sanitizeStringArray(rawItem.dependencies, 20, 60),
    checklist: sanitizeChecklist(rawItem.checklist),
    priority: PRIORITY_VALUES.has(rawItem.priority) ? rawItem.priority : null,
    weight: clampNumber(rawItem.weight, 0, 100, null),
    children: childResult.items,
  };

  return {
    item,
    descendants: childResult.totals.tasks + childResult.totals.subtasks,
  };
}

function sanitizeTaskItems(items, parentId, seen) {
  if (!Array.isArray(items)) items = [];
  const sanitized = [];
  const totals = { tasks: 0, subtasks: 0 };
  let order = 0;
  for (const rawItem of items.slice(0, MAX_ITEMS_PER_BLOCK)) {
    const { item, descendants } = sanitizeTaskItem(rawItem, `${parentId}-item-${order + 1}`, seen);
    if (!item) continue;
    item.order = order;
    sanitized.push(item);
    totals.tasks += 1;
    totals.subtasks += descendants;
    order += 1;
  }
  return { items: sanitized, totals };
}

function sanitizeBlock(rawBlock, index, seenBlocks) {
  if (!rawBlock || typeof rawBlock !== 'object') {
    throw new Error('invalid_block');
  }
  const name = sanitizeString(rawBlock.name || rawBlock.title || '', 280, `Bloque ${index + 1}`);
  const id = makeId(rawBlock.id || rawBlock.key, `block-${index + 1}`, seenBlocks);
  const blockKeyCandidate = typeof rawBlock.key === 'string' ? rawBlock.key.trim() : '';
  const key = blockKeyCandidate || sanitizeString(rawBlock.id || name, 120, id);

  const rawStart = rawBlock.startPct ?? rawBlock.p0 ?? rawBlock.range?.startPct ?? 0;
  const rawEnd = rawBlock.endPct ?? rawBlock.p1 ?? rawBlock.range?.endPct ?? Number(rawStart) + 0.2;
  const startPct = normalizePct(rawStart, 0);
  const endPct = normalizePct(rawEnd, startPct + 0.1);
  const adminMeta = sanitizeAdminMeta(rawBlock.admin);

  const taskSeenIds = new Set();
  const tasksResult = sanitizeTaskItems(rawBlock.tasks ?? rawBlock.items ?? [], id, taskSeenIds);

  return {
    block: {
      id,
      key,
      name,
      title: sanitizeOptionalString(rawBlock.title, 280) || name,
      description: sanitizeOptionalString(rawBlock.description, 1200),
      category: sanitizeOptionalString(rawBlock.category, 60),
      tags: sanitizeStringArray(rawBlock.tags, 12, 40),
      startPct,
      endPct,
      p0: startPct,
      p1: endPct,
      range: { startPct, endPct },
      admin: adminMeta,
      order: index,
      items: tasksResult.items,
      metadata: sanitizeMetadata(rawBlock.metadata),
    },
    totals: tasksResult.totals,
  };
}

function sanitizeStatus(value, fallback = 'draft') {
  if (typeof value !== 'string') return fallback;
  const status = value.trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : fallback;
}

function ensureBlocksArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.blocks)) return payload.blocks;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function ensureVersionNumber(version, fallback = null) {
  const num = Number(version);
  if (!Number.isFinite(num)) return fallback;
  const int = Math.trunc(num);
  return int > 0 ? int : fallback;
}

export function sanitizeTaskTemplatePayload(payload = {}, options = {}) {
  const blocksInput = ensureBlocksArray(payload);
  if (!options.allowEmpty && blocksInput.length === 0) {
    throw new Error('template_blocks_required');
  }

  const blocks = [];
  let totalTasks = 0;
  let totalSubtasks = 0;
  const limitedBlocks = blocksInput.slice(0, MAX_BLOCKS);
  const blockIdSet = new Set();

  limitedBlocks.forEach((rawBlock, index) => {
    const { block, totals } = sanitizeBlock(rawBlock, index, blockIdSet);
    blocks.push(block);
    totalTasks += totals.tasks;
    totalSubtasks += totals.subtasks;
  });

  const version = ensureVersionNumber(payload.version, options.defaultVersion ?? null);
  const status = sanitizeStatus(options.status ?? payload.status, options.defaultStatus ?? 'draft');

  return {
    version,
    status,
    name: sanitizeOptionalString(payload.name, 120),
    notes: sanitizeOptionalString(payload.notes, 2000),
    schemaVersion: SCHEMA_VERSION,
    blocks,
    totals: {
      blocks: blocks.length,
      tasks: totalTasks,
      subtasks: totalSubtasks,
    },
  };
}

function safeTimestamp(value) {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value;
  if (value.toDate && typeof value.toDate === 'function') {
    try {
      const date = value.toDate();
      return admin.firestore.Timestamp.fromDate(date);
    } catch (error) {
      logger.warn('[taskTemplate] timestamp toDate failed', { message: error?.message });
      return null;
    }
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

export function normalizeTemplateDoc(doc) {
  if (!doc || !doc.exists) return null;
  const data = doc.data() || {};
  try {
    const sanitized = sanitizeTaskTemplatePayload(data, {
      allowEmpty: true,
      defaultStatus: 'draft',
      status: data.status,
      defaultVersion: data.version,
    });
    return {
      id: doc.id,
      version: ensureVersionNumber(data.version, sanitized.version ?? 1) ?? 1,
      status: sanitizeStatus(data.status, sanitized.status || 'draft'),
      name:
        sanitized.name ||
        sanitizeOptionalString(data.name, 120) ||
        `Plantilla v${ensureVersionNumber(data.version, 1) || 1}`,
      notes: sanitized.notes || sanitizeOptionalString(data.notes, 2000) || '',
      schemaVersion: sanitized.schemaVersion || data.schemaVersion || SCHEMA_VERSION,
      blocks: sanitized.blocks,
      totals: sanitized.totals,
      createdAt: safeTimestamp(data.createdAt),
      createdBy: sanitizeOptionalString(data.createdBy, 120),
      updatedAt: safeTimestamp(data.updatedAt),
      updatedBy: sanitizeOptionalString(data.updatedBy, 120),
      publishedAt: safeTimestamp(data.publishedAt),
      publishedBy: sanitizeOptionalString(data.publishedBy, 120),
      archivedAt: safeTimestamp(data.archivedAt),
      archivedBy: sanitizeOptionalString(data.archivedBy, 120),
    };
  } catch (error) {
    logger.error('[taskTemplate] normalize template failed', { message: error?.message });
    return null;
  }
}

function parseDate(input) {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  if (input instanceof admin.firestore.Timestamp) return input.toDate();
  if (typeof input === 'string') {
    const date = new Date(input);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const num = Number(input);
  if (Number.isFinite(num)) {
    const date = new Date(num);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function addMonths(base, delta) {
  const date = base instanceof Date ? new Date(base.getTime()) : new Date();
  const d = Number(delta);
  if (!Number.isFinite(d)) return date;
  const months = date.getMonth() + d;
  date.setMonth(months);
  return date;
}

function computeTaskPreview(item, ctx) {
  const { blockStartPct, blockEndPct, computeDate, total, index } = ctx;

  const ratioSpan = Math.max(0.05, blockEndPct - blockStartPct);
  const defaultStartPct =
    blockStartPct + ratioSpan * 0.1 + (ratioSpan * 0.8 * index) / Math.max(total - 1, 1);
  const startPct = typeof item.startPct === 'number' ? item.startPct : defaultStartPct;
  const endPct =
    typeof item.endPct === 'number'
      ? item.endPct
      : Math.min(blockEndPct, startPct + Math.min(0.35, ratioSpan * 0.4));

  const startDate = computeDate(startPct);
  const endDate = computeDate(endPct);

  const children = Array.isArray(item.children)
    ? item.children.map((child, childIdx) =>
        computeTaskPreview(child, {
          blockStartPct: startPct,
          blockEndPct: endPct,
          computeDate,
          total: item.children.length,
          index: childIdx,
        })
      )
    : [];

  return {
    id: item.id,
    key: item.key,
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags,
    startPct,
    endPct,
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null,
    startOffsetDays: item.startOffsetDays,
    endOffsetDays: item.endOffsetDays,
    leadTimeDays: item.leadTimeDays,
    assigneeSuggestion: item.assigneeSuggestion,
    dependencies: item.dependencies,
    checklist: item.checklist,
    priority: item.priority,
    weight: item.weight,
    children,
  };
}

export function generateTemplatePreview(template, options = {}) {
  if (!template || !Array.isArray(template.blocks)) {
    throw new Error('template_required');
  }
  const sanitized = sanitizeTaskTemplatePayload(template, {
    allowEmpty: false,
    defaultStatus: template.status || 'draft',
    status: template.status,
    defaultVersion: template.version,
  });

  const weddingDate = parseDate(options.weddingDate) || new Date();
  const planningMonths = clampNumber(
    options.monthsBefore ?? options.planningMonths ?? 12,
    3,
    24,
    12
  );

  const endBase = weddingDate;
  const startBase = addMonths(endBase, -planningMonths);
  const span = Math.max(1, endBase.getTime() - startBase.getTime());
  const computeDate = (pct) => {
    if (pct == null) return null;
    return new Date(startBase.getTime() + span * pct);
  };

  const blocks = sanitized.blocks.map((block) => {
    const blockStartPct =
      typeof block.startPct === 'number' ? block.startPct : (block.range?.startPct ?? 0);
    const blockEndPct =
      typeof block.endPct === 'number'
        ? block.endPct
        : (block.range?.endPct ?? blockStartPct + 0.2);
    const blockStartDate = computeDate(blockStartPct);
    const blockEndDate = computeDate(blockEndPct);
    const items = Array.isArray(block.items) ? block.items : [];
    const tasks = items.map((item, index) =>
      computeTaskPreview(item, {
        blockStartPct,
        blockEndPct,
        computeDate,
        total: items.length || 1,
        index,
      })
    );

    return {
      id: block.id,
      key: block.key,
      name: block.name,
      title: block.title,
      description: block.description,
      category: block.category,
      tags: block.tags,
      startPct: blockStartPct,
      endPct: blockEndPct,
      startDate: blockStartDate ? blockStartDate.toISOString() : null,
      endDate: blockEndDate ? blockEndDate.toISOString() : null,
      admin: block.admin,
      tasks,
    };
  });

  return {
    version: sanitized.version ?? template.version ?? 1,
    status: sanitized.status,
    schemaVersion: sanitized.schemaVersion,
    weddingDate: weddingDate.toISOString(),
    planningMonths,
    startDate: startBase.toISOString(),
    endDate: endBase.toISOString(),
    totals: sanitized.totals,
    blocks,
  };
}

export function buildPublishedConfigPayload(template, actorEmail = null) {
  if (!template) return null;
  const preview = generateTemplatePreview(template, { weddingDate: new Date() });
  return {
    version: template.version,
    status: 'published',
    schemaVersion: template.schemaVersion || SCHEMA_VERSION,
    name: template.name,
    notes: template.notes,
    totals: template.totals,
    blocks: template.blocks,
    preview: {
      totals: preview.totals,
      planningMonths: preview.planningMonths,
      sampleWeddingDate: preview.weddingDate,
    },
    updatedByEmail: actorEmail || null,
  };
}
