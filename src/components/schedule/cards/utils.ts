const FALLBACK_HEX = '6B6B78';

/**
 * Appends a 2-hex-digit alpha to a 6-digit hex color.
 * e.g. hexWithAlpha('#F472B6', 0.10) → '#F472B61A'
 *
 * Guards the inputs so a malformed/short/empty color (or an out-of-range alpha)
 * can never produce an invalid color string that crashes the native renderer:
 * a non-6-digit hex falls back to a neutral gray, and alpha is clamped to [0, 1].
 */
export function hexWithAlpha(hex: string | null | undefined, alpha: number): string {
  const digits = (hex ?? '').replace(/^#/, '');
  const base = /^[0-9a-fA-F]{6}$/.test(digits) ? digits : FALLBACK_HEX;
  const clamped = Math.max(0, Math.min(1, alpha));
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${base}${a}`;
}
