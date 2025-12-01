import { randomUUID } from 'crypto';
import admin from 'firebase-admin';

import logger from '../utils/logger.js';
import { listRules } from './automationService.js';

const SUPPORTED_CHANNELS = new Set(['email', 'chat', 'whatsapp']);
const DEFAULT_EVENT_VERSION = '2025-10-15';

const CONDITION_KEYS = new Set([
  'operator',
  'op',
  'value',
  'equals',
  'expected',
  'anyOf',
  'oneOf',
  'in',
  'allOf',
  'contains',
  'regex',
  'pattern',
  'match',
  'gte',
  'gt',
  'lte',
  'lt',
  'between',
  'exists',
  'not',
  'negate',
  'caseInsensitive',
  'ignoreCase',
  'comparePath',
  'compareToPath',
  'compareTarget',
  'valuePath',
  'valueFrom',
  'valueKey',
]);

const DEFAULT_ACTION_STRATEGY = 'async';
const TOKEN_REGEX = /\{([^}]+)\}/g;

function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeString(value, { lowercase = true } = {}) {
  if (value == null) return '';
  const str = String(value).trim();
  return lowercase ? str.toLowerCase() : str;
}

function getValueAtPath(target, rawPath) {
  if (!target || rawPath == null) return undefined;
  if (rawPath === '' || rawPath === '.') return target;
  const path = String(rawPath)
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  let current = target;
  for (const key of path) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

function getScopedSource(event, scope = 'payload') {
  switch (scope) {
    case 'payload':
      return event.payload || {};
    case 'metadata':
      return event.metadata || {};
    case 'actor':
      return event.actor || {};
    case 'event':
      return event;
    case 'wedding':
    case 'context':
      return { weddingId: event.weddingId };
    default:
      return event.payload || {};
  }
}

function resolveToken(token, event, context) {
  const candidates = String(token)
    .split('||')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    let raw = candidate;
    let defaultValue;

    if (candidate.includes('??')) {
      const [path, fallback] = candidate.split('??');
      raw = path.trim();
      defaultValue = fallback;
    }

    let resolved;
    if (raw.startsWith('payload.')) {
      resolved = getValueAtPath(event.payload || {}, raw.slice(8));
    } else if (raw === 'payload') {
      resolved = event.payload;
    } else if (raw.startsWith('metadata.')) {
      resolved = getValueAtPath(event.metadata || {}, raw.slice(9));
    } else if (raw === 'metadata') {
      resolved = event.metadata;
    } else if (raw.startsWith('actor.')) {
      resolved = getValueAtPath(event.actor || {}, raw.slice(6));
    } else if (raw === 'actor') {
      resolved = event.actor;
    } else if (raw.startsWith('event.')) {
      resolved = getValueAtPath(event, raw.slice(6));
    } else if (raw.startsWith('context.')) {
      resolved = getValueAtPath(context || {}, raw.slice(8));
    } else if (raw.startsWith('rule.')) {
      resolved = getValueAtPath(context?.rule || {}, raw.slice(5));
    } else if (raw === 'weddingId') {
      resolved = event.weddingId;
    } else if (raw in (context || {})) {
      resolved = context[raw];
    } else if (raw === 'event') {
      resolved = event;
    } else if (raw === 'rule') {
      resolved = context?.rule;
    } else {
      resolved = getValueAtPath(event.payload || {}, raw);
      if (resolved === undefined) {
        resolved = getValueAtPath(event, raw);
      }
    }

    if (resolved !== undefined && resolved !== null && resolved !== '') {
      return resolved;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
  }
  return '';
}

function interpolateValue(value, event, context) {
  if (typeof value === 'string') {
    if (!value.includes('{')) return value;
    return value.replace(TOKEN_REGEX, (_, token) => {
      const resolved = resolveToken(token, event, context);
      if (resolved === undefined || resolved === null) return '';
      if (typeof resolved === 'object') {
        try {
          return JSON.stringify(resolved);
        } catch {
          return '';
        }
      }
      return String(resolved);
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateValue(item, event, context));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, interpolateValue(val, event, context)])
    );
  }
  return value;
}

function isConditionLeaf(obj = {}) {
  return Object.keys(obj).some((key) => CONDITION_KEYS.has(key));
}

function conditionsFromMap(scope, map, prefix = '') {
  const conditions = [];
  Object.entries(map || {}).forEach(([key, rawValue]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      rawValue &&
      typeof rawValue === 'object' &&
      !Array.isArray(rawValue) &&
      !isConditionLeaf(rawValue)
    ) {
      conditions.push(...conditionsFromMap(scope, rawValue, path));
      return;
    }
    const condition = {
      scope,
      target: scope,
      path,
    };
    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      const {
        operator,
        op,
        value,
        equals,
        expected,
        anyOf,
        oneOf,
        in: inList,
        allOf,
        contains,
        pattern,
        match,
        regex,
        caseInsensitive,
        ignoreCase,
        negate,
        not,
        comparePath,
        compareToPath,
        compareTarget,
        valuePath,
        valueFrom,
        valueKey,
      } = rawValue;
      condition.operator = operator || op;
      condition.value =
        value ??
        equals ??
        expected ??
        anyOf ??
        oneOf ??
        inList ??
        contains ??
        pattern ??
        match ??
        regex ??
        null;
      if (anyOf || oneOf || inList) condition.anyOf = anyOf || oneOf || inList;
      if (allOf) condition.allOf = allOf;
      if (contains && condition.operator == null) {
        condition.operator = Array.isArray(contains) ? 'contains_any' : 'contains';
      }
      if (pattern && condition.operator == null) condition.operator = 'regex';
      if (match && condition.operator == null) condition.operator = 'regex';
      if (regex && condition.operator == null) condition.operator = 'regex';
      condition.caseInsensitive = caseInsensitive ?? ignoreCase ?? false;
      condition.negate = negate ?? not ?? false;
      condition.comparePath = comparePath || compareToPath || valuePath || null;
      condition.compareTarget = compareTarget || valueFrom || valueKey || null;
    } else {
      condition.value = rawValue;
    }
    conditions.push(condition);
  });
  return conditions;
}

function extractRuleConditions(rule = {}) {
  const collected = [];
  const add = (condition) => {
    if (!condition) return;
    if (!condition.path && typeof condition.path !== 'string') return;
    collected.push({
      scope: condition.scope || condition.target || 'payload',
      target: condition.target || condition.scope || 'payload',
      path: condition.path,
      operator: condition.operator || condition.op || null,
      value:
        condition.value ??
        condition.equals ??
        condition.expected ??
        condition.anyOf ??
        condition.in ??
        condition.oneOf ??
        null,
      anyOf: condition.anyOf || condition.oneOf || condition.in || null,
      allOf: condition.allOf || null,
      caseInsensitive: condition.caseInsensitive ?? condition.ignoreCase ?? false,
      regexFlags: condition.regexFlags || null,
      negate: condition.negate ?? condition.not ?? false,
      comparePath: condition.comparePath || condition.compareToPath || condition.valuePath || null,
      compareTarget: condition.compareTarget || condition.valueFrom || condition.valueKey || null,
    });
  };

  if (Array.isArray(rule.matchers)) {
    rule.matchers.forEach((matcher) => {
      if (!matcher) return;
      add({
        scope: matcher.scope || matcher.target || matcher.source || 'payload',
        target: matcher.target || matcher.scope || matcher.source || 'payload',
        path: matcher.path || matcher.field || matcher.key,
        operator: matcher.operator || matcher.op || (matcher.contains ? 'contains' : null),
        value:
          matcher.value ??
          matcher.equals ??
          matcher.expected ??
          matcher.anyOf ??
          matcher.oneOf ??
          matcher.in ??
          matcher.contains ??
          matcher.match ??
          matcher.regex ??
          matcher.pattern ??
          null,
        anyOf: matcher.anyOf || matcher.oneOf || matcher.in || null,
        allOf: matcher.allOf || matcher.requireAll || null,
        caseInsensitive: matcher.caseInsensitive ?? matcher.ignoreCase ?? false,
        regexFlags: matcher.regexFlags || matcher.flags || null,
        negate: matcher.negate ?? matcher.not ?? false,
        comparePath: matcher.comparePath || matcher.compareToPath || matcher.valuePath || null,
        compareTarget: matcher.compareTarget || matcher.valueFrom || matcher.valueKey || null,
      });
    });
  }

  if (Array.isArray(rule.conditions)) {
    rule.conditions.forEach((condition) => {
      if (!condition) return;
      if (typeof condition === 'string') {
        add({ path: condition, operator: 'exists', value: true });
        return;
      }
      add(condition);
    });
  }

  if (rule.conditions && typeof rule.conditions === 'object' && !Array.isArray(rule.conditions)) {
    conditionsFromMap('payload', rule.conditions).forEach(add);
  }

  if (rule.filters && typeof rule.filters === 'object') {
    Object.entries(rule.filters).forEach(([scope, descriptor]) => {
      if (['payload', 'metadata', 'actor', 'event', 'context', 'wedding'].includes(scope)) {
        conditionsFromMap(scope, descriptor).forEach(add);
      } else if (descriptor != null) {
        add({
          scope: 'payload',
          target: 'payload',
          path: scope,
          value: descriptor,
        });
      }
    });
  }

  if (rule.payloadMatch && typeof rule.payloadMatch === 'object') {
    conditionsFromMap('payload', rule.payloadMatch).forEach(add);
  }

  if (rule.metadataMatch && typeof rule.metadataMatch === 'object') {
    conditionsFromMap('metadata', rule.metadataMatch).forEach(add);
  }

  if (rule.actorMatch && typeof rule.actorMatch === 'object') {
    conditionsFromMap('actor', rule.actorMatch).forEach(add);
  }

  return collected;
}

function normalizeSpec(spec) {
  if (spec == null) return [];
  if (Array.isArray(spec)) {
    return spec
      .map((item) => (typeof item === 'string' ? normalizeString(item) : item))
      .filter((item) => item !== undefined && item !== null);
  }
  return [typeof spec === 'string' ? normalizeString(spec) : spec];
}

function valueMatchesListSpec(spec, actual) {
  if (spec == null || (Array.isArray(spec) && spec.length === 0)) return true;
  const normalizedActual = Array.isArray(actual)
    ? actual.map((item) => normalizeString(item))
    : [normalizeString(actual)];
  const list = normalizeSpec(spec);
  if (!list.length) return true;
  const includesWildcard = list.some((item) => item === '*' || item === 'any');
  if (includesWildcard) return true;
  return list.some((expected) => normalizedActual.includes(expected));
}

function coerceComparable(value, preferredType = null) {
  if (value == null) return null;
  if (preferredType === 'number') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  if (preferredType === 'date') {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value;
  const num = Number(value);
  if (!Number.isNaN(num)) return num;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date;
  return value;
}

function evaluateOperator(value, operator, expected, options = {}) {
  const { caseInsensitive = false, anyOf = null, allOf = null, regexFlags = undefined } = options;

  const normalizeForCompare = (input) => {
    if (input == null) return input;
    if (typeof input === 'string') return caseInsensitive ? input.toLowerCase() : input;
    return input;
  };

  const asArray = (input) => (Array.isArray(input) ? input : [input]);

  const compareEquals = (a, b) => {
    const left = normalizeForCompare(a);
    const right = normalizeForCompare(b);
    if (Array.isArray(left)) {
      return left.some((item) => compareEquals(item, b));
    }
    if (Array.isArray(right)) {
      return right.some((item) => compareEquals(a, item));
    }
    return left === right;
  };

  const containsValue = (container, needle) => {
    if (container == null) return false;
    if (Array.isArray(container)) {
      return container.some((item) => compareEquals(item, needle));
    }
    if (typeof container === 'string') {
      const haystack = caseInsensitive ? container.toLowerCase() : container;
      const searchNeedle = caseInsensitive ? String(needle).toLowerCase() : String(needle);
      return haystack.includes(searchNeedle);
    }
    return false;
  };

  const numericCompare = (left, right) => {
    const a = coerceComparable(left, 'number');
    const b = coerceComparable(right, 'number');
    if (a == null || b == null) return null;
    return a - b;
  };

  const dateCompare = (left, right) => {
    const a = coerceComparable(left, 'date');
    const b = coerceComparable(right, 'date');
    if (!(a instanceof Date) || !(b instanceof Date)) return null;
    return a.getTime() - b.getTime();
  };

  const valueExists = value !== undefined && value !== null && value !== '';

  switch ((operator || '').toLowerCase()) {
    case '':
    case 'equals':
    case 'eq':
      if (Array.isArray(expected)) {
        return expected.some((item) => compareEquals(value, item));
      }
      return compareEquals(value, expected);
    case 'not_equals':
    case 'neq':
      if (Array.isArray(expected)) {
        return expected.every((item) => !compareEquals(value, item));
      }
      return !compareEquals(value, expected);
    case 'in':
    case 'any_of':
      return asArray(expected).some((item) => compareEquals(value, item));
    case 'not_in':
      return asArray(expected).every((item) => !compareEquals(value, item));
    case 'contains':
      return containsValue(value, expected);
    case 'not_contains':
      return !containsValue(value, expected);
    case 'contains_any':
      return asArray(expected).some((needle) => containsValue(value, needle));
    case 'contains_all':
      return asArray(expected).every((needle) => containsValue(value, needle));
    case 'starts_with': {
      if (typeof value !== 'string' || typeof expected !== 'string') return false;
      const v = caseInsensitive ? value.toLowerCase() : value;
      const exp = caseInsensitive ? expected.toLowerCase() : expected;
      return v.startsWith(exp);
    }
    case 'ends_with': {
      if (typeof value !== 'string' || typeof expected !== 'string') return false;
      const v = caseInsensitive ? value.toLowerCase() : value;
      const exp = caseInsensitive ? expected.toLowerCase() : expected;
      return v.endsWith(exp);
    }
    case 'regex':
    case 'matches': {
      if (value == null) return false;
      const flagsToUse = regexFlags != null ? regexFlags : caseInsensitive ? 'i' : undefined;
      const pattern =
        expected instanceof RegExp
          ? expected
          : flagsToUse != null
            ? new RegExp(String(expected), flagsToUse)
            : new RegExp(String(expected));
      return pattern.test(String(value));
    }
    case 'gt': {
      const diff = numericCompare(value, expected);
      if (diff == null) return false;
      return diff > 0;
    }
    case 'gte':
    case 'ge': {
      const diff = numericCompare(value, expected);
      if (diff == null) return false;
      return diff >= 0;
    }
    case 'lt': {
      const diff = numericCompare(value, expected);
      if (diff == null) return false;
      return diff < 0;
    }
    case 'lte':
    case 'le': {
      const diff = numericCompare(value, expected);
      if (diff == null) return false;
      return diff <= 0;
    }
    case 'date_after': {
      const diff = dateCompare(value, expected);
      if (diff == null) return false;
      return diff > 0;
    }
    case 'date_before': {
      const diff = dateCompare(value, expected);
      if (diff == null) return false;
      return diff < 0;
    }
    case 'between': {
      if (!Array.isArray(expected) || expected.length < 2) return false;
      const [min, max] = expected;
      const lower = numericCompare(value, min);
      const upper = numericCompare(value, max);
      if (lower == null || upper == null) return false;
      return lower >= 0 && upper <= 0;
    }
    case 'exists':
      return valueExists;
    case 'not_exists':
    case 'missing':
      return !valueExists;
    case 'truthy':
      return Boolean(value);
    case 'falsy':
      return !value;
    default: {
      const arrayExpected = anyOf || expected;
      if (arrayExpected != null && Array.isArray(arrayExpected)) {
        return arrayExpected.some((item) => compareEquals(value, item));
      }
      return compareEquals(value, expected);
    }
  }
}

function evaluateCondition(event, condition) {
  const scope = condition.scope || condition.target || 'payload';
  const source = getScopedSource(event, scope);
  const actual = getValueAtPath(source, condition.path);
  let expected = condition.anyOf ?? condition.value;

  if (condition.comparePath) {
    expected = getValueAtPath(
      getScopedSource(event, condition.compareTarget || scope),
      condition.comparePath
    );
  }

  const operator = condition.operator || (Array.isArray(condition.value) ? 'in' : 'equals');
  const matches = evaluateOperator(actual, operator, expected, {
    caseInsensitive: condition.caseInsensitive,
    anyOf: condition.anyOf,
    allOf: condition.allOf,
    regexFlags: condition.regexFlags,
  });

  return condition.negate ? !matches : matches;
}

function ruleMatchesEvent(rule, event) {
  if (!rule || rule.enabled === false) {
    return { matched: false, reason: 'disabled' };
  }

  const channelSpec =
    rule.channel ??
    rule.channels ??
    rule.trigger?.channel ??
    rule.trigger?.channels ??
    rule?.conditions?.channel ??
    null;
  const typeSpec =
    rule.type ?? rule.types ?? rule.trigger?.type ?? rule.trigger?.types ?? rule.eventTypes ?? null;
  const actorRoleSpec =
    rule.actorRole ??
    rule.actorRoles ??
    rule.trigger?.actorRole ??
    rule.trigger?.actorRoles ??
    rule.filters?.actor?.role ??
    null;

  if (!valueMatchesListSpec(channelSpec, event.channel)) {
    return { matched: false, reason: 'channel' };
  }

  if (!valueMatchesListSpec(typeSpec, event.type)) {
    return { matched: false, reason: 'type' };
  }

  if (actorRoleSpec && !valueMatchesListSpec(actorRoleSpec, event.actor?.role)) {
    return { matched: false, reason: 'actorRole' };
  }

  const conditions = extractRuleConditions(rule);
  const matchedConditions = [];

  for (const condition of conditions) {
    const ok = evaluateCondition(event, condition);
    if (!ok) {
      return {
        matched: false,
        reason: 'condition',
        failedCondition: {
          scope: condition.scope,
          path: condition.path,
          operator: condition.operator || 'equals',
          expected: condition.value ?? condition.anyOf,
        },
      };
    }
    const source = getScopedSource(event, condition.scope || condition.target);
    matchedConditions.push({
      scope: condition.scope || condition.target || 'payload',
      path: condition.path,
      operator: condition.operator || 'equals',
      expected: condition.value ?? condition.anyOf ?? condition.allOf ?? null,
      actual: getValueAtPath(source, condition.path),
    });
  }

  return {
    matched: true,
    matchedConditions,
    channelSpec,
    typeSpec,
    actorRoleSpec,
  };
}

function buildActionContext(rule, event, extras = {}) {
  return {
    event,
    rule,
    matchedConditions: extras.matchedConditions || [],
    metadata: extras.metadata || {},
  };
}

function normalizeRuleActions(rule, event, contextExtras = {}) {
  const actions = Array.isArray(rule.actions) ? rule.actions : [];
  const context = buildActionContext(rule, event, contextExtras);
  return actions
    .map((action) => {
      if (!action || typeof action !== 'object') return null;
      const interpolated = interpolateValue(action, event, context);
      return {
        ...interpolated,
        ruleId: rule.id,
      };
    })
    .filter(Boolean);
}

/**
 * Normaliza un evento recibido desde un canal externo antes de procesarlo.
 * @param {Record<string, any>} input
 * @returns {AutomationEvent}
 */
export function normalizeAutomationEvent(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error('automationEvent.invalid_payload');
  }

  const channelRaw = typeof input.channel === 'string' ? input.channel.trim().toLowerCase() : '';
  if (!SUPPORTED_CHANNELS.has(channelRaw)) {
    throw new Error(`automationEvent.unsupported_channel:${channelRaw || 'unknown'}`);
  }

  const typeRaw = typeof input.type === 'string' ? input.type.trim() : '';
  if (!typeRaw) {
    throw new Error('automationEvent.type_required');
  }

  const eventId =
    typeof input.id === 'string' && input.id.trim()
      ? input.id.trim()
      : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const weddingId = input.weddingId != null ? String(input.weddingId).trim() : null;

  const actor =
    input.actor && typeof input.actor === 'object'
      ? {
          id: input.actor.id != null ? String(input.actor.id).trim() : null,
          role: input.actor.role != null ? String(input.actor.role).trim() : null,
          metadata:
            input.actor.metadata && typeof input.actor.metadata === 'object'
              ? input.actor.metadata
              : undefined,
        }
      : null;

  const payload = input.payload && typeof input.payload === 'object' ? input.payload : {};
  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};

  return {
    id: eventId,
    version: input.version ? String(input.version) : DEFAULT_EVENT_VERSION,
    channel: channelRaw,
    type: typeRaw,
    weddingId,
    actor,
    payload,
    metadata,
    receivedAt: new Date().toISOString(),
  };
}

/**
 * Entrada principal del orquestador. Registra el evento y evalua reglas configuradas.
 * @param {Record<string, any>} rawEvent
 * @returns {Promise<{accepted: boolean, event: AutomationEvent, actions: Array}>}
 */
export async function ingestAutomationEvent(rawEvent) {
  const event = normalizeAutomationEvent(rawEvent);

  logger.info('[automationOrchestrator] evento recibido', {
    eventId: event.id,
    channel: event.channel,
    type: event.type,
    weddingId: event.weddingId,
  });

  const actions = await evaluateRulesForEvent(event);

  return {
    accepted: true,
    event,
    actions,
  };
}

/**
 * Recupera las reglas registradas y determina acciones candidatas.
 * @param {AutomationEvent} event
 * @returns {Promise<Array>}
 */
async function evaluateRulesForEvent(event) {
  if (!event.weddingId) {
    return [];
  }

  let rules = [];
  try {
    rules = await listRules(event.weddingId);
  } catch (error) {
    logger.warn('[automationOrchestrator] no se pudieron cargar reglas', error?.message || error);
    return [];
  }

  if (!Array.isArray(rules) || !rules.length) {
    return [];
  }

  const evaluations = [];

  for (const rawRule of rules) {
    try {
      const outcome = ruleMatchesEvent(rawRule, event);
      if (!outcome.matched) continue;

      const normalizedActions = normalizeRuleActions(rawRule, event, {
        matchedConditions: outcome.matchedConditions || [],
      });
      if (!normalizedActions.length) continue;

      evaluations.push({
        ruleId: rawRule.id,
        ruleName: rawRule.name || rawRule.title || null,
        ruleVersion: rawRule.version || null,
        strategy: rawRule.strategy || DEFAULT_ACTION_STRATEGY,
        actions: normalizedActions,
        matchedConditions: outcome.matchedConditions || [],
      });
    } catch (error) {
      logger.warn(
        `[automationOrchestrator] rule ${rawRule?.id || 'unknown'} evaluation failed`,
        error?.message || error
      );
    }
  }

  return evaluations;
}

/**
 * Genera un contexto estandar para workers o eventos futuros.
 * @param {AutomationEvent} event
 * @returns {{event: AutomationEvent, contextId: string}}
 */
export function createAutomationContext(event) {
  return {
    event,
    contextId: randomUUID(),
  };
}

/**
 * Persistencia opcional del evento bruto para depuracion o workers diferidos.
 * @param {AutomationEvent} event
 * @returns {Promise<void>}
 */
export async function persistRawEvent(event) {
  try {
    await admin
      .firestore()
      .collection('automationQueue')
      .doc(event.id)
      .set({
        ...event,
        storedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    logger.warn('[automationOrchestrator] persistRawEvent fallo', error?.message || error);
  }
}
