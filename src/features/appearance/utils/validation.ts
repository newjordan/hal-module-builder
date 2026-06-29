/** Lightweight clamps used by appearance panel logic (pure utils) */
export const clamp01 = (value: number | undefined, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const clampAngle = (value: number | undefined, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  let a = Math.round(value) % 360;
  if (a < 0) a += 360;
  return a;
};

export const clampRange = (
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

