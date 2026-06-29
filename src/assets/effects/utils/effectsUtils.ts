export {};

import { clamp } from './math';

export function createTempCanvas(
  width: number,
  height: number
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  if (typeof document === 'undefined') {
    throw new Error('Canvas APIs not available in this environment');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to acquire 2D rendering context');
  return [canvas, ctx];
}

export function copyImageData(source: ImageData, dest: ImageData): void {
  if (dest.data.length !== source.data.length) {
    throw new Error('ImageData sizes do not match');
  }
  dest.data.set(source.data);
}

export function clampCoordinates(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: clamp(x, 0, width - 1),
    y: clamp(y, 0, height - 1),
  };
}

export function getPixelIndex(x: number, y: number, width: number): number {
  return (y * width + x) * 4;
}

export function copyPixel(
  sourceData: Uint8ClampedArray,
  destData: Uint8ClampedArray,
  sourceIdx: number,
  destIdx: number
): void {
  destData[destIdx] = sourceData[sourceIdx] ?? 0;
  destData[destIdx + 1] = sourceData[sourceIdx + 1] ?? 0;
  destData[destIdx + 2] = sourceData[sourceIdx + 2] ?? 0;
  destData[destIdx + 3] = sourceData[sourceIdx + 3] ?? 255;
}

export function interpolatePixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): [number, number, number, number] {
  // Nearest-neighbor fallback for simplicity (placeholder for bilinear filtering)
  const clamped = clampCoordinates(Math.round(x), Math.round(y), width, height);
  const idx = getPixelIndex(clamped.x, clamped.y, width);
  return [
    data[idx] ?? 0,
    data[idx + 1] ?? 0,
    data[idx + 2] ?? 0,
    data[idx + 3] ?? 255,
  ];
}
