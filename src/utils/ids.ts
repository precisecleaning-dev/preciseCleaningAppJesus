import type { SystemUser } from '../types';

export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const fullName = (u: SystemUser) => `${u.firstName} ${u.lastName}`.trim();

export const initialsOf = (u: SystemUser) => `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase();

export const errorCode = (err: unknown) => String((err as { code?: string })?.code || (err as Error)?.message || err);
