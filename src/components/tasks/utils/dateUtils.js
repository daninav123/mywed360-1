// Utilidades de fechas para Tasks

export function validateAndNormalizeDate(date) {
  if (!date) return null;
  let validDate = date;
  if (date && typeof date.toDate === 'function') {
    validDate = date.toDate();
  } else if (!(date instanceof Date)) {
    try {
      if (typeof date === 'string') {
        const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
          const y = parseInt(m[1], 10);
          const mo = parseInt(m[2], 10) - 1;
          const da = parseInt(m[3], 10);
          validDate = new Date(y, mo, da, 0, 0, 0, 0);
        } else {
          validDate = new Date(date);
        }
      } else {
        validDate = new Date(date);
      }
    } catch {
      return null;
    }
  }
  return isNaN(validDate.getTime()) ? null : validDate;
}

export function normalizeAnyDate(d) {
  try {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    if (typeof d?.toDate === 'function') {
      const x = d.toDate();
      return isNaN(x.getTime()) ? null : x;
    }
    if (typeof d === 'number') {
      const n = new Date(d);
      return isNaN(n.getTime()) ? null : n;
    }
    if (typeof d === 'string') {
      const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const da = parseInt(m[3], 10);
        const local = new Date(y, mo, da, 0, 0, 0, 0);
        return isNaN(local.getTime()) ? null : local;
      }
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function addMonths(base, delta) {
  const d = new Date(base.getTime());
  const targetMonthIndex = d.getMonth() + delta;
  const targetYear = d.getFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(d.getDate(), lastDay);
  return new Date(
    targetYear,
    targetMonth,
    day,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  );
}
