import type { Layer } from '../../../../types/layer-types';
import { DEFAULT_GRADIENT_COLORS } from '../gradient';

export const DEFAULT_COLOR_OVERLAY: NonNullable<Layer['colorOverlay']> = {
  enabled: true,
  blendMode: 'normal',
  color: '#ffffff',
  opacity: 1,
};

export const DEFAULT_GRADIENT_OVERLAY: NonNullable<Layer['gradientOverlay']> = {
  enabled: true,
  blendMode: 'overlay',
  opacity: 0.75,
  gradient: {
    type: 'linear',
    colors: [...DEFAULT_GRADIENT_COLORS],
    stops: [0, 1],
    angle: 90,
  },
  scale: 100,
  alignWithLayer: true,
  reverse: false,
};

