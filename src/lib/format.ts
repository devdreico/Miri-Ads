export function formatMoney(cents: number, currency = 'USD', locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatNumber(value: number, locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(date: Date | string, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  );
}

/** Lunes de la semana ISO de una fecha. */
export function weekStartOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
