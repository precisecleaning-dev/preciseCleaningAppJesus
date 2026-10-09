export function withAlpha(color: string | undefined | null, alpha: number): string | null {
  if (!color) return null;
  const c = color.trim();
  const hex = c.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const full =
      hex.length === 3 || hex.length === 4
        ? hex
            .slice(0, 3)
            .split('')
            .map((x) => x + x)
            .join('')
        : hex.slice(0, 6);
    if (full.length !== 6) return null;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  return null;
}

export function safeColor(color: string | undefined | null, fallback: string): string {
  if (!color) return fallback;
  return withAlpha(color, 1) || (/^[a-z]+$/i.test(color.trim()) ? color.trim() : fallback);
}
