import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { fetchPublishedTaskTemplate } from './taskTemplateClient';

const DAY_MS = 24 * 60 * 60 * 1000;

function isValidDate(value) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function addMonths(base, delta) {
  const date = isValidDate(base) ? new Date(base) : new Date();
  const months = date.getMonth() + Number(delta || 0);
  date.setMonth(months);
  return date;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function safeString(value, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (value == null) return fallback;
  return String(value).trim();
}

function slugKey(value, fallback) {
  const base = safeString(value, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base) return base;
  const fb = safeString(fallback, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return fb || `item-${Math.random().toString(36).slice(2, 8)}`;
}

function buildTemplateMeta(block, range, version) {
  const adminMeta = block && typeof block === 'object' && typeof block.admin === 'object' ? block.admin : {};
  const key = safeString(block?.key || block?.name || block?.title, `bloque-${Math.round((range?.startPct || 0) * 100) || 0}`);
  const adminCategory = adminMeta?.category ? adminMeta.category.toUpperCase() : null;
  return {
    key,
    version: Number(version) || 1,
    range,
    adminEditable: adminMeta?.editable !== false,
    adminDeletable: adminMeta?.deletable !== false,
    adminCategory,
    panelPath: adminMeta?.panelPath || 'admin/task-templates',
  };
}

function mapChecklist(list) {
  if (!Array.isArray(list)) return [];
  const result = [];
  for (const entry of list) {
    if (typeof entry === 'string') {
      const label = entry.trim();
      if (label) result.push({ label });
    } else if (entry && typeof entry === 'object' && entry.label) {
      const item = {
        label: String(entry.label),
        defaultDone: Boolean(entry.defaultDone),
      };
      if (entry.id) {
        item.id = String(entry.id);
      }
      result.push(item);
    }
  }
  return result;
}

async function seedItems({
  db,
  weddingId,
  parentId,
  parentTemplateKey,
  items,
  blockStart,
  blockEnd,
  templateVersion,
  blockCategory,
  at,
}) {
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.length;
  let created = 0;
  const ratioSpan = Math.max(0.05, blockEnd - blockStart);
  const subCol = collection(db, 'weddings', weddingId, 'tasks', parentId, 'subtasks');

  for (let idx = 0; idx < total; idx += 1) {
    const rawItem = items[idx];
    const isObject = rawItem && typeof rawItem === 'object';
    const labelSource = isObject ? (rawItem.title || rawItem.name || rawItem.label) : rawItem;
    const label = safeString(labelSource, '');
    if (!label) continue;

    const itemCategory = safeString(isObject ? rawItem.category : null, '').toUpperCase() || blockCategory;
    const defaultStart = blockStart + Math.min(ratioSpan * 0.8, 0.6) * (idx / Math.max(total - 1, 1));
    const startPct = clamp(
      isObject && Number.isFinite(rawItem.startPct) ? Number(rawItem.startPct) : defaultStart,
      blockStart,
      blockEnd,
    );
    const endPct = clamp(
      isObject && Number.isFinite(rawItem.endPct)
        ? Number(rawItem.endPct)
        : Math.min(blockEnd, startPct + Math.min(ratioSpan * 0.4, 0.35)),
      startPct,
      blockEnd,
    );

    const startDate = at(startPct);
    const tentativeEnd = at(endPct);
    const endDate = tentativeEnd.getTime() < startDate.getTime()
      ? new Date(startDate.getTime() + 3 * DAY_MS)
      : tentativeEnd;

    const templateItemKey = `${parentTemplateKey}:${slugKey(
      isObject ? rawItem.key || rawItem.id || label : label,
      `${idx + 1}`,
    )}`;

    const subtask = {
      title: label,
      name: label,
      parentId,
      weddingId,
      start: startDate,
      end: endDate,
      progress: 0,
      isDisabled: false,
      createdAt: serverTimestamp(),
      category: itemCategory || blockCategory,
      templateParentKey: parentTemplateKey,
      templateItemKey,
      templateVersion,
    };

    if (isObject) {
      if (rawItem.assigneeSuggestion) {
        subtask.assigneeSuggestion = safeString(rawItem.assigneeSuggestion);
      }
      if (Array.isArray(rawItem.tags)) {
        const tags = rawItem.tags.map((tag) => safeString(tag, '')).filter(Boolean);
        if (tags.length) subtask.tags = tags;
      }
      if (Array.isArray(rawItem.dependencies)) {
        const deps = rawItem.dependencies.map((dep) => safeString(dep, '')).filter(Boolean);
        if (deps.length) subtask.templateDependencies = deps;
      }
      if (rawItem.priority) {
        subtask.priority = safeString(rawItem.priority, '');
      }
      if (Number.isFinite(rawItem.weight)) {
        subtask.weight = Number(rawItem.weight);
      }
      const checklist = mapChecklist(rawItem.checklist);
      if (checklist.length) subtask.checklist = checklist;
    }

    const subDoc = await addDoc(subCol, subtask);
    await setDoc(subDoc, { id: subDoc.id }, { merge: true });
    created += 1;

    if (isObject && Array.isArray(rawItem.children) && rawItem.children.length) {
      created += await seedItems({
        db,
        weddingId,
        parentId,
        parentTemplateKey: templateItemKey,
        items: rawItem.children,
        blockStart: startPct,
        blockEnd: endPct,
        templateVersion,
        blockCategory: itemCategory || blockCategory,
        at,
      });
    }
  }

  return created;
}

export async function seedWeddingTasksFromTemplate({
  db,
  weddingId,
  projectEnd,
  skipIfSeeded = true,
  forceRefresh = false,
} = {}) {
  if (!db || !weddingId) {
    return { seeded: false, reason: 'missing_context' };
  }

  const seedRef = doc(db, 'weddings', weddingId, 'tasks', '_seed_meta');

  if (skipIfSeeded) {
    const existingSeed = await getDoc(seedRef).catch(() => null);
    if (existingSeed && existingSeed.exists()) {
      return { seeded: false, reason: 'already_seeded' };
    }
  }

  const template = await fetchPublishedTaskTemplate({ forceRefresh });
  const blocks = Array.isArray(template?.blocks) ? template.blocks : [];
  if (!blocks.length) {
    return { seeded: false, reason: 'template_empty' };
  }

  const version = Number(template?.version || template?.schemaVersion || 1);
  const endBase = isValidDate(projectEnd) ? new Date(projectEnd) : new Date();
  const startBase = addMonths(endBase, -12);
  const span = Math.max(1, endBase.getTime() - startBase.getTime());
  const at = (pct) => new Date(startBase.getTime() + span * pct);

  const taskCol = collection(db, 'weddings', weddingId, 'tasks');
  let parentCount = 0;
  let subtaskCount = 0;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const name = safeString(block?.name || block?.title, `Bloque ${index + 1}`);
    const startPct = clamp(
      Number(
        block?.startPct ??
          block?.p0 ??
          block?.range?.startPct ??
          0,
      ),
      -1,
      2,
    );
    const endPct = clamp(
      Number(
        block?.endPct ??
          block?.p1 ??
          block?.range?.endPct ??
          startPct + 0.3,
      ),
      startPct + 0.05,
      startPct + 1.5,
    );
    const range = { startPct, endPct };
    const adminCategory = block?.admin?.category ? block.admin.category.toUpperCase() : null;
    const blockCategory = adminCategory || 'OTROS';
    const templateMeta = buildTemplateMeta(block, range, version);
    const templateKey = templateMeta.key || `${slugKey(name, `bloque-${index + 1}`)}`;

    const parent = {
      title: name,
      name,
      type: 'task',
      start: at(startPct),
      end: at(endPct),
      progress: 0,
      isDisabled: false,
      createdAt: serverTimestamp(),
      category: blockCategory,
      templateKey,
      templateVersion: version,
      templateMeta,
    };

    const parentDoc = await addDoc(taskCol, parent);
    await setDoc(parentDoc, { id: parentDoc.id }, { merge: true });
    parentCount += 1;

    const items = Array.isArray(block?.items) ? block.items : [];
    const createdSubtasks = await seedItems({
      db,
      weddingId,
      parentId: parentDoc.id,
      parentTemplateKey: templateKey,
      items,
      blockStart: startPct,
      blockEnd: endPct,
      templateVersion: version,
      blockCategory,
      at,
    });
    subtaskCount += createdSubtasks;
  }

  await setDoc(
    seedRef,
    {
      seededAt: serverTimestamp(),
      version,
      templateStatus: template?.status || 'published',
      totalParents: parentCount,
      totalSubtasks: subtaskCount,
    },
    { merge: true },
  );

  return {
    seeded: parentCount > 0,
    version,
    totals: {
      parents: parentCount,
      subtasks: subtaskCount,
    },
  };
}
