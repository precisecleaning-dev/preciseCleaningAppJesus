export const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

export const asNullableText = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);
