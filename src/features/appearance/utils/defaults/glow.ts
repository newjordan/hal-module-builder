import type { Layer } from '../../../../types/layer-types';

export const DEFAULT_OUTER_GLOW: NonNullable<Layer['outerGlow']> = {
  enabled: true,
  blendMode: 'screen',
  color: '#ffffff',
  opacity: 0.6,
  spread: 5,
  size: 30,
  range: 50,
  jitter: 0,
};

export const DEFAULT_INNER_GLOW: NonNullable<Layer['innerGlow']> = {
  enabled: true,
  blendMode: 'screen',
  color: '#ffffcc',
  opacity: 0.5,
  spread: 10,
  size: 20,
  range: 50,
  jitter: 0,
};

