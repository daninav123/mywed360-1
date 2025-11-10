// Utility helpers to clean mojibake (double-encoded UTF-8 sequences)
// that show up in API responses, e.g. "FacturaciÃ³n" -> "Facturación".

const MOJI_REGEX = /Ã|Â|â|ð/;
const decoder =
  typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8', { fatal: false })
    : null;

/**
 * Attempt to fix a single string that contains mojibake markers.
 * If no markers are present or decoding fails, the original string is returned.
 *
 * @param {string} value
 * @returns {string}
 */
export function decodeMojibake(value) {
  if (typeof value !== 'string') return value;
  if (!MOJI_REGEX.test(value)) return value;
  if (!decoder) return value;

  try {
    const bytes = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i++) {
      bytes[i] = value.charCodeAt(i) & 0xff;
    }
    const decoded = decoder.decode(bytes);
    return decoded;
  } catch {
    return value;
  }
}

/**
 * Deep clone structure converting any string values that look affected by mojibake.
 *
 * @template T
 * @param {T} input
 * @param {WeakMap<object, unknown>} [visited]
 * @returns {T}
 */
export function decodeMojibakeDeep(input, visited = new WeakMap()) {
  if (typeof input === 'string') {
    return decodeMojibake(input);
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  if (visited.has(input)) {
    return visited.get(input);
  }

  if (Array.isArray(input)) {
    const arr = input.map((item) => decodeMojibakeDeep(item, visited));
    visited.set(input, arr);
    return arr;
  }

  const output = {};
  visited.set(input, output);
  for (const [key, value] of Object.entries(input)) {
    output[key] = decodeMojibakeDeep(value, visited);
  }
  return /** @type {T} */ (output);
}
