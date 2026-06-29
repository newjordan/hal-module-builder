import { Layer } from '../types/layer-types';

export type SymmetryMode = Exclude<
  NonNullable<Layer['equalizerSettings']>['symmetry'],
  undefined
>;

export interface EqualizerSymmetryOption {
  value: SymmetryMode;
  label: string;
  description?: string;
  minBars?: number;
}

export const DEFAULT_SYMMETRY_MODE: SymmetryMode = 'none';

export const EQUALIZER_SYMMETRY_OPTIONS: EqualizerSymmetryOption[] = [
  {
    value: 'none',
    label: 'None',
    description: 'Keep original spectrum without symmetry transforms.',
  },
  {
    value: 'mirror',
    label: 'Mirror',
    description:
      'Polar mirror that reflects the full spectrum across the center axis.',
    minBars: 2,
  },
  {
    value: 'rotate',
    label: 'Rotate',
    description:
      'Quarter-phase rotation of the spectrum for alternating motion.',
    minBars: 4,
  },
  {
    value: '4-fold',
    label: '4-Fold',
    description:
      'Split the spectrum into four radial segments with alternating orientation.',
    minBars: 4,
  },
  {
    value: '6-fold',
    label: '6-Fold',
    description: 'Six full-spectrum segments for balanced radial blooms.',
    minBars: 6,
  },
  {
    value: '8-fold',
    label: '8-Fold',
    description: 'Eight alternating segments for intricate radial fans.',
    minBars: 8,
  },
  {
    value: '12-fold',
    label: '12-Fold',
    description: 'Twelve-segment polar symmetry for high-detail bursts.',
    minBars: 12,
  },
];
