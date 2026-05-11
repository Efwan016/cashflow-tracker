export const getTzOffset = () => {
  const offset = new Date().getTimezoneOffset();
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
  const sign = offset <= 0 ? '+' : '-';
  return `${sign}${hours}:${minutes}`;
};

export const getLocalDate = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-CA');
};

export const toDateKey = (d: string) => new Date(d).toISOString().split('T')[0];

export const createCurrencyFormatter = () => {
  const isID = navigator.language.startsWith('id') || Intl.DateTimeFormat().resolvedOptions().timeZone?.includes('Jakarta');
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: isID ? 'IDR' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export const createNumberFormatter = () => new Intl.NumberFormat(navigator.language);

export const ago = (dateString: string): string => {
  const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const formatDateTimeLocal = (date: Date = new Date()) => 
  date.toLocaleString('sv-SE').replace(' ', 'T') + getTzOffset();

// ─── Pagination Utility ───────────────────────────────────────────────────────

export function getPageRange(current: number, total: number): (number | '...')[] {
  const range: (number | '...')[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) range.push(i)
  } else if (current <= 4) {
    range.push(1, 2, 3, 4, 5, '...', total)
  } else if (current >= total - 3) {
    range.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    range.push(1, '...', current - 1, current, current + 1, '...', total)
  }
  return range
}

export function getStockStatus(total: number): 'critical' | 'warning' | 'healthy' {
  if (total <= 5) return 'critical'
  if (total <= 15) return 'warning'
  return 'healthy'
}
