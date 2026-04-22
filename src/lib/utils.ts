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