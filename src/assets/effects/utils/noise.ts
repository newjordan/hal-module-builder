export function animatedSin(
  timeMs: number | undefined,
  speed: number,
  scale: number
): number {
  const t = (timeMs ?? 0) * 0.001;
  return Math.sin(t * speed) * scale;
}

export function animatedTwist(
  base: number,
  intensity: number | undefined,
  timeMs: number | undefined,
  speed: number | undefined,
  scale: number
): number {
  const baseVal = base * (intensity ?? 1);
  return baseVal + animatedSin(timeMs, speed ?? 1, scale);
}
