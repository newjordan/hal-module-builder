import type { Layer } from '../../../../types/layer-types';

export const DEFAULT_BEVEL_EMBOSS: NonNullable<Layer['bevelEmboss']> = {
  enabled: true,
  style: 'innerBevel',
  technique: 'smooth',
  depth: 100,
  direction: 'up',
  size: 12,
  soften: 0,
  angle: 120,
  altitude: 30,
  useGlobalLight: true,
  highlightBlendMode: 'screen',
  highlightColor: '#ffffff',
  highlightOpacity: 0.75,
  shadowBlendMode: 'multiply',
  shadowColor: '#000000',
  shadowOpacity: 0.75,
};

