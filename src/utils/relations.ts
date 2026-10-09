import type { CatalogItem, Customer } from '../types';

const norm = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .trim();

export function findRelation<T extends CatalogItem>(list: T[], idOrName?: string | null): T | undefined {
  if (!idOrName) return undefined;
  const key = norm(idOrName);
  return list.find((item) => norm(item.id) === key || norm(item.name) === key);
}

function looksLikeOrphanId(value: string): boolean {
  const v = value.trim();
  if (!v || v.includes(' ') || !/^[0-9a-zA-Z_-]+$/.test(v)) return false;
  return (/[0-9]/.test(v) && v.length >= 8) || v.length >= 15;
}

export function displayClientName(list: Customer[], idOrName: string | null | undefined, labels: { unknown: string; deleted: string }): string {
  if (!idOrName) return labels.unknown;
  const key = norm(idOrName);
  const found = list.find((c) => norm(c.id) === key || (!!c.legacyId && norm(c.legacyId) === key) || norm(c.name) === key);
  if (found) return found.name;
  const raw = String(idOrName);
  return looksLikeOrphanId(raw) ? `${labels.deleted} · ${raw.slice(0, 8)}` : raw;
}
