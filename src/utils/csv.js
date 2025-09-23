// Simple CSV utilities for parsing and auto-mapping headers
// Encoding note: ensure files are saved as UTF-8.

export function parseCSVToRows(text) {
  if (!text || typeof text !== 'string') return { headers: [], rows: [] };
  const lines = text.split(/\r?\n/).filter((l) => l && l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter: prefer comma, fallback to semicolon
  const sample = lines[0];
  const delimiter =
    (sample.match(/,/g) || []).length >= (sample.match(/;/g) || []).length ? ',' : ';';

  const splitLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => splitLine(line));
  return { headers, rows };
}

export function autoDetectCSVMapping(headers) {
  const lower = (headers || []).map((h) => (h || '').toString().toLowerCase());
  const findIndex = (preds) => lower.findIndex((h) => preds.some((p) => p.test(h)));
  return {
    date: findIndex([/\bfecha\b/, /\bdate\b/]),
    desc: findIndex([/\bconcepto\b/, /descrip/, /\bdescription\b/, /\bdetalle\b/, /\bconcept\b/]),
    amount: findIndex([/\bmonto\b/, /\bimporte\b/, /\bamount\b/, /\btotal\b/, /\bvalue\b/]),
    type: findIndex([/\btipo\b/, /\btype\b/]),
    category: findIndex([/\bcategoria\b/, /\bcategory\b/]),
  };
}
