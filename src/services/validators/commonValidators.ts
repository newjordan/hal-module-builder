// Common validation utilities (parity with existing implementations)

/** Sanitize numeric value with bounds */
export function sanitizeNumber(
  value: any,
  fallback: number,
  min?: number,
  max?: number
): number {
  let num: number;
  if (typeof value === 'number') num = value;
  else {
    num = parseFloat(value);
    if (isNaN(num)) return fallback;
  }
  if (min !== undefined && num < min) num = min;
  if (max !== undefined && num > max) num = max;
  return num;
}

/** Sanitize boolean value with default */
export function sanitizeBoolean(value: any, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Sanitize string with max length and trim */
export function sanitizeString(
  value: any,
  fallback: string,
  maxLength = 1000
): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength).trim();
}
