const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;

export const MAX_ATTACHMENT_BYTES = 25 * MEGABYTE;

export const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes < 0) return '';
    if (bytes < KILOBYTE) return `${bytes} B`;
    if (bytes < MEGABYTE) return `${Math.round(bytes / KILOBYTE)} KB`;
    return `${(bytes / MEGABYTE).toFixed(1)} MB`;
};
