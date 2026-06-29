import type { Layer } from '../../../types/layer-types';
import { clamp01, clampAngle } from './validation';

export type GradientType = NonNullable<Layer['fillGradient']>['type'];

export type SpreadMethod = 'pad' | 'reflect' | 'repeat';

export type GradientState = {
  type: GradientType;
  colors: string[];
  stops: number[];
  angle: number;
  centerX?: number;
  centerY?: number;
  spreadMethod?: SpreadMethod;
};

export const DEFAULT_GRADIENT_COLORS: [string, string] = ['#ff0000', '#0000ff'];

export const ensureStops = (colors: string[], stops?: number[]) => {
  if (!stops || stops.length !== colors.length) {
    if (colors.length <= 1) return colors.map(() => 0);
    const lastIndex = colors.length - 1;
    return colors.map((_, i) => clamp01(i / lastIndex));
  }
  return stops.map(s => clamp01(s));
};

export const asGradientState = (
  gradient: Layer['fillGradient'] | Layer['strokeGradient'] | undefined,
  includeCenter = false
): GradientState => {
  const colors = gradient?.colors?.length ? [...gradient.colors] : [...DEFAULT_GRADIENT_COLORS];
  const stops = ensureStops(colors, gradient?.stops);
  const angle = clampAngle(gradient?.angle, 0);
  const state: GradientState = { type: gradient?.type ?? 'linear', colors, stops, angle };
  if (includeCenter) {
    const fill = gradient as Layer['fillGradient'] | undefined;
    state.centerX = clamp01(fill?.centerX, 0.5);
    state.centerY = clamp01(fill?.centerY, 0.5);
  }
  state.spreadMethod = (gradient as any)?.spreadMethod || 'pad';
  return state;
};

export const buildFillGradientPayload = (
  state: GradientState
): NonNullable<Layer['fillGradient']> => {
  const colors = state.colors.length ? [...state.colors] : [...DEFAULT_GRADIENT_COLORS];
  const stops = ensureStops(colors, state.stops);
  const payload: NonNullable<Layer['fillGradient']> = { type: state.type, colors, stops };
  if (state.type === 'linear' || state.type === 'conic') payload.angle = clampAngle(state.angle, 0);
  if (state.type === 'radial') {
    payload.centerX = clamp01(state.centerX, 0.5);
    payload.centerY = clamp01(state.centerY, 0.5);
  }
  if (state.spreadMethod && state.spreadMethod !== 'pad') payload.spreadMethod = state.spreadMethod;
  return payload;
};

export const buildStrokeGradientPayload = (
  state: GradientState
): NonNullable<Layer['strokeGradient']> => {
  const colors = state.colors.length ? [...state.colors] : [...DEFAULT_GRADIENT_COLORS];
  const stops = ensureStops(colors, state.stops);
  const payload: NonNullable<Layer['strokeGradient']> = { type: state.type, colors, stops };
  if (state.type === 'linear' || state.type === 'conic') payload.angle = clampAngle(state.angle, 0);
  if (state.spreadMethod && state.spreadMethod !== 'pad') payload.spreadMethod = state.spreadMethod;
  return payload;
};

