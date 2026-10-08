// src/utils/dateFormat.ts
// ⭐ Port de src/utils/dateFormat.ts de la web (misma lógica de fechas mixtas:
//    ISO, MM/DD/YYYY, DD/MM/YYYY, Timestamps). Así la fecha de una casa se lee
//    IGUAL en la web y en el teléfono.

type DateLike = string | number | Date | { toDate: () => Date } | null | undefined;

const pad = (n: number) => String(n).padStart(2, '0');
const toMDY = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
const hasToDate = (v: unknown): v is { toDate: () => Date } =>
  typeof v === 'object' && v !== null && typeof (v as { toDate?: unknown }).toDate === 'function';

export function formatDate(value: DateLike): string {
  if (value === null || value === undefined || value === '') return '';
  if (hasToDate(value)) {
    const d = value.toDate();
    return isNaN(d.getTime()) ? '' : toMDY(d);
  }
  if (value instanceof Date) return isNaN(value.getTime()) ? '' : toMDY(value);
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : toMDY(d);
  }
  const str = String(value).trim();
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${pad(Number(iso[2]))}/${pad(Number(iso[3]))}/${iso[1]}`;
  const slash = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    if (a > 12 && b <= 12) return `${pad(b)}/${pad(a)}/${slash[3]}`;
    return `${pad(a)}/${pad(b)}/${slash[3]}`;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : toMDY(d);
}

export function formatDateTime(value: DateLike): string {
  if (value === null || value === undefined || value === '') return '';
  let d: Date | null = null;
  if (hasToDate(value)) d = value.toDate();
  else if (value instanceof Date) d = value;
  else {
    const p = new Date(value);
    if (!isNaN(p.getTime())) d = p;
  }
  if (!d || isNaN(d.getTime())) return formatDate(value);
  return `${toMDY(d)}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

/** Valor numérico para ORDENAR fechas de formatos mixtos. Sin fecha => 0. */
export function dateSortValue(value: DateLike): number {
  if (value === null || value === undefined || value === '') return 0;
  if (hasToDate(value)) {
    const d = value.toDate();
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  if (value instanceof Date) return isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
  const slash = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = Number(slash[3]);
    const [mon, day] = a > 12 && b <= 12 ? [b, a] : [a, b];
    return new Date(y, mon - 1, day).getTime();
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Medianoche local de hoy, para separar "Hoy" / "Próximas" / "Atrasadas". */
export function startOfToday(now = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Lunes 00:00 de la semana de `t` (misma convención que timeClockService de la web). */
export function weekStartOf(t: number): number {
  const d = new Date(t);
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  base.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return base.getTime();
}

export const money = (n: number | string | null | undefined): string =>
  `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
