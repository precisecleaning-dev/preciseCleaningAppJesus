// src/utils/relations.ts
// ⭐ Port de src/utils/relations.ts + src/utils/customerDocs.ts de la web.
//    Las casas guardan a veces el ID y a veces el NOMBRE (datos legacy de
//    AppSheet), así que todo se resuelve "id o nombre", sin distinguir
//    mayúsculas. Los clientes migrados además tienen un `legacyId`.
import type { CatalogItem, Customer } from '../types';

const norm = (v: unknown) => String(v ?? '').toLowerCase().trim();

export function findRelation<T extends CatalogItem>(list: T[], idOrName?: string | null): T | undefined {
  if (!idOrName) return undefined;
  const key = norm(idOrName);
  return list.find((item) => norm(item.id) === key || norm(item.name) === key);
}

export function getRelationName<T extends CatalogItem>(list: T[], idOrName?: string | null, fallback = '-'): string {
  return findRelation(list, idOrName)?.name ?? fallback;
}

interface DocLike {
  id: string;
  data: () => Record<string, unknown>;
}

/** El campo `id` interno (legacy) NUNCA debe pisar al id real del documento. */
export function mapCustomerDoc(d: DocLike): Customer {
  const { id: legacyRaw, ...rest } = d.data() as { id?: unknown } & Record<string, unknown>;
  const legacyId = typeof legacyRaw === 'string' && legacyRaw ? legacyRaw : undefined;
  return { ...(rest as Omit<Customer, 'id'>), id: d.id, ...(legacyId ? { legacyId } : {}) };
}

function looksLikeOrphanId(value: string): boolean {
  const v = value.trim();
  if (!v || v.includes(' ') || !/^[0-9a-zA-Z_-]+$/.test(v)) return false;
  return (/[0-9]/.test(v) && v.length >= 8) || v.length >= 15;
}

export function displayClientName(list: Customer[], idOrName?: string | null): string {
  if (!idOrName) return 'Unknown';
  const key = norm(idOrName);
  const found = list.find(
    (c) => norm(c.id) === key || (!!c.legacyId && norm(c.legacyId) === key) || norm(c.name) === key,
  );
  if (found) return found.name;
  const raw = String(idOrName);
  return looksLikeOrphanId(raw) ? `Cliente eliminado · ${raw.slice(0, 8)}` : raw;
}
