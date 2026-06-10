/**
 * Appends a 2-hex-digit alpha to a 6-char hex color.
 * e.g. hexWithAlpha('#F472B6', 0.10) → '#F472B61A'
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const base = hex.startsWith('#') ? hex : `#${hex}`;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${base}${a}`;
}
