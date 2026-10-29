// Values read from Firestore are written by two apps (and by hand in the console): never trust their shape.

export const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

export const asNullableText = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export const asFiniteNumber = (value: unknown): number => (Number.isFinite(Number(value)) ? Number(value) : 0);
