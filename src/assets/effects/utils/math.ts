export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundToInt(value: number): number {
  return Math.round(value);
}

export function distance(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

export function angle(dx: number, dy: number): number {
  return Math.atan2(dy, dx);
}
