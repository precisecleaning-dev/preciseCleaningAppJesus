type DateLike = string | number | Date | { toDate: () => Date } | null | undefined;

const pad = (n: number) => String(n).padStart(2, '0');
const toMDY = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
const valid = (d: Date) => (isNaN(d.getTime()) ? null : d);

function parseDayString(str: string): Date | null {
    const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    const slash = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    const parts = iso ? [iso[1], iso[2], iso[3]] : slash ? [slash[3], slash[1], slash[2]] : null;
    if (!parts) return null;
    const [y, a, b] = parts.map(Number);
    const [month, day] = slash && a > 12 && b <= 12 ? [b, a] : [a, b];
    const d = new Date(y, month - 1, day);
    return d.getMonth() === month - 1 && d.getDate() === day ? d : null;
}

function toDate(value: DateLike, dayOnly: boolean): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return valid(value);
    if (typeof value === 'number') return valid(new Date(value));
    if (typeof value === 'object') return typeof value.toDate === 'function' ? valid(value.toDate()) : null;
    const str = value.trim();
    const looksLikeDay = /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/.test(str);
    return looksLikeDay && (dayOnly || !str.includes('T')) ? parseDayString(str) : valid(new Date(str));
}

export function formatDate(value: DateLike): string {
    const d = toDate(value, true);
    return d ? toMDY(d) : typeof value === 'string' ? value : '';
}

export function formatTime(value: DateLike): string {
    const d = toDate(value, false);
    if (!d) return '';
    const h = d.getHours() % 12 || 12;
    return `${h}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

export function formatDateTime(value: DateLike): string {
    const d = toDate(value, false);
    return d ? `${toMDY(d)}, ${formatTime(d)}` : formatDate(value);
}

export const dateSortValue = (value: DateLike): number => toDate(value, true)?.getTime() ?? 0;

export function startOfToday(now = new Date()): number {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function weekStartOf(t: number): number {
    const d = new Date(t);
    const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    base.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    return base.getTime();
}

export const money = (n: number | string | null | undefined): string => `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
