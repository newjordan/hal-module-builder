import type { Layer } from '../../../../types/layer-types';

export const DEFAULT_DROP_SHADOW: NonNullable<Layer['dropShadow']> = {
  enabled: true,
  blendMode: 'multiply',
  color: '#000000',
  opacity: 0.75,
  angle: 125,
  distance: 15,
  spread: 0,
  size: 20,
  useGlobalLight: true,
};

export const DEFAULT_INNER_SHADOW: NonNullable<Layer['innerShadow']> = {
  enabled: true,
  blendMode: 'multiply',
  color: '#000000',
  opacity: 0.6,
  angle: 120,
  distance: 8,
  spread: 0,
  size: 16,
  useGlobalLight: true,
};

