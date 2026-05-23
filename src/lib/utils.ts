/**
 * Builds the current local timezone offset in ISO-like `+HH:mm` or `-HH:mm` form.
 *
 * @returns The user's current timezone offset, including sign and minutes.
 */
export const getTzOffset = () => {
  const offset = new Date().getTimezoneOffset();
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
  const sign = offset <= 0 ? '+' : '-';
  return `${sign}${hours}:${minutes}`;
};

/**
 * Returns a local calendar date string for today or a date in the past.
 *
 * @param daysAgo - Number of days to subtract from the current local date.
 * @returns A date string formatted as `YYYY-MM-DD`.
 */
export const getLocalDate = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-CA');
};

/**
 * Converts a date-like string into a stable UTC date key.
 *
 * @param d - Date string accepted by the JavaScript `Date` constructor.
 * @returns The UTC date portion formatted as `YYYY-MM-DD`.
 */
export const toDateKey = (d: string) => new Date(d).toISOString().split('T')[0];

/**
 * Creates a locale-aware currency formatter for dashboard and report amounts.
 *
 * @returns An `Intl.NumberFormat` that formats whole-number IDR for Indonesian
 * users or whole-number USD for other locales.
 */
export const createCurrencyFormatter = () => {
  const isID = navigator.language.startsWith('id') || Intl.DateTimeFormat().resolvedOptions().timeZone?.includes('Jakarta');
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: isID ? 'IDR' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * Creates a locale-aware formatter for plain numeric values.
 *
 * @returns An `Intl.NumberFormat` using the current browser language.
 */
export const createNumberFormatter = () => new Intl.NumberFormat(navigator.language);

/**
 * Formats a timestamp as a short relative age label.
 *
 * @param dateString - Date string accepted by the JavaScript `Date` constructor.
 * @returns A compact relative time label such as `just now`, `5m ago`, `2h ago`,
 * or `3d ago`.
 */
export const ago = (dateString: string): string => {
  const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/**
 * Formats a `Date` as a local datetime string with the current timezone offset.
 *
 * @param date - Date to format. Defaults to the current date and time.
 * @returns A local datetime string in `YYYY-MM-DDTHH:mm:ss+HH:mm` style.
 */
export const formatDateTimeLocal = (date: Date = new Date()) => 
  date.toLocaleString('sv-SE').replace(' ', 'T') + getTzOffset();

// ─── Pagination Utility ───────────────────────────────────────────────────────

/**
 * Builds the visible page list for pagination controls.
 *
 * @param current - The currently selected page number.
 * @param total - The total number of available pages.
 * @returns A compact page range containing page numbers and ellipsis markers.
 */
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
  if (total <= 3) return 'critical'
  if (total <= 9) return 'warning'
  return 'healthy'
}
