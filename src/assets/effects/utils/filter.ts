import { distance } from './math';

export function radialAmount(
  dx: number,
  dy: number,
  radius: number,
  exponent = 2
): number {
  const d = distance(dx, dy);
  if (radius <= 0) return 0;
  const base = Math.max(0, (radius - d) / radius);
  return Math.pow(base, exponent);
}

export function bulgeFactor(strength: number, amount: number): number {
  return 1 + strength * amount;
}

export function pinchFactor(strength: number, amount: number): number {
  return 1 - strength * amount;
}
