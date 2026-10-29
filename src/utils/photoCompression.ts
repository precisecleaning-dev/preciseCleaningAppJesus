import type { PhotoConfig } from '../types';

// Limits match the ranges the web offers in Photo Settings, so a bad value in
// app_settings/photo_config never means "upload the original".
export const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;
const MIN_LONGEST_SIDE = 960;
const BYTES_PER_MB = 1024 * 1024;

const DEFAULT_LONGEST_SIDE = 1920;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_MAX_SIZE_MB = 1;

export interface CompressionSettings {
    maxLongestSide: number;
    startQuality: number;
    maxBytes: number;
}

const clampOrDefault = (value: unknown, min: number, max: number, fallback: number): number => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.min(max, Math.max(min, number)) : fallback;
};

export const compressionSettingsOf = (photoConfig: Partial<PhotoConfig>): CompressionSettings => ({
    maxLongestSide: clampOrDefault(photoConfig.maxImageWidth, 640, 3840, DEFAULT_LONGEST_SIDE),
    startQuality: clampOrDefault(photoConfig.compressionQuality, MIN_QUALITY, 1, DEFAULT_QUALITY),
    maxBytes: clampOrDefault(photoConfig.maxSizeMB, 0.3, 5, DEFAULT_MAX_SIZE_MB) * BYTES_PER_MB,
});

export const lowerQuality = (quality: number): number => Math.max(MIN_QUALITY, Math.round((quality - QUALITY_STEP) * 100) / 100);

/** Longest side to try next when a photo is still too heavy at the lowest quality; null when it can't shrink more. */
export const smallerLongestSide = (longestSide: number, bytes: number, maxBytes: number): number | null => {
    if (longestSide <= MIN_LONGEST_SIDE || bytes <= maxBytes) return null;
    // The file size grows with the pixel area, so the side shrinks with the square root (with a margin).
    const scale = Math.min(0.9, Math.sqrt(maxBytes / bytes) * 0.95);
    return Math.max(MIN_LONGEST_SIDE, Math.floor(longestSide * scale));
};
