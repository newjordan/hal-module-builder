import type { Layer } from '../types/layer-types';

/**
 * Turns a HAL Studio layer stack into a stack of 3D eye parts.
 *
 * The studio composes layers on a 500px canvas, background first. Owl3D keeps
 * that order but gives every layer its own depth, so the 2D design becomes a
 * physical lens assembly you can look into on a stereo display. This module is
 * pure (no three.js) so the mapping is unit tested.
 */

export type EyePartKind = 'disc' | 'ring' | 'bars' | 'image';

export interface EyePart {
  id: string;
  kind: EyePartKind;
  /** Outer radius, normalized so the outermost layer is 1. */
  radius: number;
  /** Ring stroke width or bar base radius, normalized like `radius`. */
  inner: number;
  /** Distance in front of the rearmost layer, normalized 0..1. */
  depth: number;
  colors: string[];
  stops: number[];
  gradient: 'radial' | 'linear' | 'conic' | 'solid';
  opacity: number;
  additive: boolean;
  /** Radians per second. */
  spin: number;
  /** Normalized offset from the eye center (+y up). */
  offsetX: number;
  offsetY: number;
  /** Polygon side count; 0 is a circle. */
  sides: number;
  /** Dashed rings become ticks: how many around the ring and the lit fraction. */
  dash: { count: number; duty: number } | null;
  barCount: number;
  barHeight: number;
  barStyle: 'line' | 'dot' | 'bar';
  /** Scales with agent activity, like the studio's audio-reactive layers. */
  reactive: boolean;
  glow: number;
  src: string;
}

const ADDITIVE_BLENDS = new Set([
  'screen',
  'add',
  'lighten',
  'color-dodge',
  'plus-lighter',
  'lighter',
]);
const POLYGON_SIDES: Record<string, number> = {
  circle: 0,
  rectangle: 4,
  triangle: 3,
  polygon: 6,
  star: 10,
};

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function layerRadius(layer: Layer): number {
  const specific = layer.shapeSpecific ?? {};
  if (layer.type === 'equalizer') {
    const settings = layer.equalizerSettings ?? {};
    return (
      numberOr(settings.innerRadius, 120) + numberOr(settings.maxHeight, 30)
    );
  }
  if (layer.type === 'image') return 250 * numberOr(layer.scale, 1);
  return (
    (numberOr(specific.radius, 0) ||
      Math.max(numberOr(specific.width, 0), numberOr(specific.height, 0)) / 2 ||
      100) * numberOr(layer.scale, 1)
  );
}

function parseDash(
  value: string | undefined,
  radiusPx: number
): EyePart['dash'] {
  if (!value) return null;
  const parts = value
    .split(/[\s,]+/)
    .map(Number)
    .filter(n => Number.isFinite(n) && n >= 0);
  if (parts.length < 2) return null;
  const on = parts[0] ?? 0;
  const off = parts[1] ?? 0;
  if (on <= 0 || off <= 0) return null;
  const count = Math.round((2 * Math.PI * radiusPx) / (on + off));
  return count >= 3
    ? { count: Math.min(720, count), duty: on / (on + off) }
    : null;
}

function isReactive(layer: Layer): boolean {
  if (layer.type === 'equalizer') return true;
  const reactive = (
    layer as Layer & {
      audioReactive?: { enabled?: boolean; mappings?: unknown[] };
    }
  ).audioReactive;
  return Boolean(
    reactive && reactive.enabled !== false && reactive.mappings?.length
  );
}

/** Parts in back-to-front order. Layers that have no 3D meaning are skipped. */
export function planEye(layers: readonly Layer[]): EyePart[] {
  const usable = layers.filter(
    layer =>
      layer.visible !== false &&
      (layer.type === 'shape' ||
        layer.type === 'equalizer' ||
        layer.type === 'gradient' ||
        // IndexedDB-backed images ('idb:…') live only in the studio's page.
        (layer.type === 'image' &&
          typeof layer.src === 'string' &&
          /^(data:|https?:|\/)/.test(layer.src)))
  );
  if (!usable.length) return [];
  const maxRadius = Math.max(...usable.map(layerRadius), 1);
  const lastIndex = Math.max(1, usable.length - 1);

  return usable.map((layer, index): EyePart => {
    const scale = numberOr(layer.scale, 1);
    const base: EyePart = {
      id: layer.id,
      kind: 'disc',
      radius: layerRadius(layer) / maxRadius,
      inner: 0,
      depth: index / lastIndex,
      colors: ['#ffffff'],
      stops: [0],
      gradient: 'solid',
      opacity: Math.min(1, Math.max(0, numberOr(layer.opacity, 1))),
      additive: ADDITIVE_BLENDS.has(String(layer.blendMode)),
      spin:
        layer.animation === 'rotate'
          ? numberOr(layer.animationSpeed, 0.5) * 1.5
          : 0,
      offsetX: numberOr(layer.offsetX, 0) / maxRadius,
      offsetY: -numberOr(layer.offsetY, 0) / maxRadius,
      sides: POLYGON_SIDES[layer.shapeType ?? 'circle'] ?? 0,
      dash: null,
      barCount: 0,
      barHeight: 0,
      barStyle: 'bar',
      reactive: isReactive(layer),
      glow: numberOr(layer.glowIntensity, 0),
      src: '',
    };

    if (layer.type === 'equalizer') {
      const settings = layer.equalizerSettings ?? {};
      const style = String(settings.barStyle ?? 'bar');
      return {
        ...base,
        kind: 'bars',
        inner: (numberOr(settings.innerRadius, 120) * scale) / maxRadius,
        barCount: Math.round(
          Math.min(256, Math.max(8, numberOr(settings.barCount, 64)))
        ),
        barHeight: (numberOr(settings.maxHeight, 30) * scale) / maxRadius,
        barStyle: style === 'line' ? 'line' : style === 'dot' ? 'dot' : 'bar',
        colors: [
          String(settings.primaryColor ?? '#ff2a00'),
          String(settings.secondaryColor ?? settings.primaryColor ?? '#ffa040'),
        ],
        stops: [0, 1],
        gradient: 'linear',
        glow: numberOr(settings.glowIntensity, base.glow),
      };
    }

    if (layer.type === 'image') {
      return { ...base, kind: 'image', src: String(layer.src) };
    }

    const gradient = layer.type === 'gradient' ? layer.gradient : undefined;
    const fill =
      layer.fillType === 'gradient' && layer.fillGradient
        ? layer.fillGradient
        : gradient
          ? gradient
          : undefined;
    if (fill || layer.fillType === 'solid' || layer.type === 'gradient') {
      return {
        ...base,
        kind: 'disc',
        colors: fill?.colors?.length
          ? [...fill.colors]
          : [layer.fillColor ?? layer.color ?? '#ffffff'],
        stops: fill?.stops?.length ? [...fill.stops] : [0],
        gradient: fill ? fill.type : 'solid',
      };
    }

    if (layer.strokeType && layer.strokeType !== 'none') {
      const stroke =
        layer.strokeType === 'gradient' ? layer.strokeGradient : undefined;
      return {
        ...base,
        kind: 'ring',
        inner: Math.max(1, numberOr(layer.strokeWidth, 2) * scale) / maxRadius,
        colors: stroke?.colors?.length
          ? [...stroke.colors]
          : [layer.strokeColor ?? '#ffffff'],
        stops: stroke?.stops?.length ? [...stroke.stops] : [0],
        gradient: stroke ? stroke.type : 'solid',
        dash: parseDash(layer.strokeDasharray, layerRadius(layer)),
      };
    }

    return { ...base, colors: [layer.fillColor ?? layer.color ?? '#ffffff'] };
  });
}

export const DESIGN_STORAGE_KEY = 'hal-layers';

/** The studio's saved design, if any. */
export function readStoredDesign(
  storage: Pick<Storage, 'getItem'> | undefined
): Layer[] | null {
  try {
    const raw = storage?.getItem(DESIGN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return null;
    const layers = parsed.filter(
      (item): item is Layer =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Layer).id === 'string' &&
        typeof (item as Layer).type === 'string'
    );
    return layers.length ? layers : null;
  } catch {
    return null;
  }
}
