import type { BlendMode } from '../../../assets/effects/IEffect';

/** Centralized blend mode options and label formatter */
export const BLEND_MODE_OPTIONS: BlendMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'soft-light',
  'hard-light',
  'color-dodge',
  'color-burn',
  'darken',
  'lighten',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

export const formatBlendMode = (mode: BlendMode): string =>
  mode
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getBlendModeSelectOptions = () =>
  BLEND_MODE_OPTIONS.map(mode => ({ value: mode, label: formatBlendMode(mode) }));

