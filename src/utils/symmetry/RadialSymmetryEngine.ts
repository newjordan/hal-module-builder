import type { SymmetryMode } from '../../config/equalizerSymmetry';

export interface RadialSymmetryEngineOptions {
  /** Total arc (in degrees) used to build the canonical segment before mirroring */
  arcClampDegrees?: number;
  /** Upper bound for number of mirrored segments */
  maxSegments?: number;
}
export interface RadialSymmetryPlan {
  mode: SymmetryMode;
  segmentCount: number;
  segmentLengths: number[];
  canonicalLength: number;
  totalLength: number;
}

export const DEFAULT_ARC_DEGREES = 360;
const FULL_CIRCLE_DEGREES = 360;
export const DEFAULT_MAX_SEGMENTS = 12;

export const resolveSymmetrySegmentCount = (
  mode: SymmetryMode,
  dataLength: number,
  maxSegments: number = DEFAULT_MAX_SEGMENTS
): number => {
  if (!mode || mode === 'none' || dataLength <= 0) {
    return 1;
  }

  if (mode === 'rotate') {
    return 1;
  }

  if (mode === 'mirror') {
    return Math.min(2, Math.max(1, dataLength));
  }

  const foldMatch = mode.match(/(\d+)-fold/);
  if (foldMatch) {
    const rawCount = parseInt(foldMatch[1] ?? '', 10);
    if (Number.isFinite(rawCount) && rawCount > 1) {
      return Math.min(rawCount, maxSegments, Math.max(1, dataLength));
    }
  }

  return 1;
};

/**
 * RadialSymmetryEngine - isolates a canonical segment, clamps it to a target arc, and
 * replicates it around the circle with alternating reversal to create mirror/fold symmetry.
 */
export class RadialSymmetryEngine {
  private readonly maxSegments: number;
  private lastPlan: RadialSymmetryPlan | null = null;

  constructor(options: RadialSymmetryEngineOptions = {}) {
    this.maxSegments = options.maxSegments ?? DEFAULT_MAX_SEGMENTS;
  }

  getLastPlan(): RadialSymmetryPlan | null {
    if (!this.lastPlan) {
      return null;
    }

    return {
      ...this.lastPlan,
      segmentLengths: [...this.lastPlan.segmentLengths],
    };
  }

  clearPlan(): void {
    this.lastPlan = null;
  }

  transform(
    data: number[],
    mode: SymmetryMode,
    arcClampDegrees?: number,
    smoothing?: {
      method?: 'none' | 'monotone' | 'catmull-rom';
      strength?: number;
      tension?: number;
      clamp?: boolean;
    }
  ): number[] {
    this.clearPlan();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const segments = this.resolveSegmentCount(mode, data.length);

    if (segments <= 1) {
      return this.resample(data, data.length);
    }

    const segmentLengths = this.distributeSegmentLengths(data.length, segments);
    const canonicalLength = Math.max(1, ...segmentLengths);
    const canonical = this.buildCanonicalSegment(
      data,
      canonicalLength,
      arcClampDegrees,
      segments // Pass segment count for proper division
    );
    const result = new Array<number>(data.length);

    let writeIndex = 0;

    // Prepare smoothing if requested
    const method = smoothing?.method ?? 'none';
    const sStrength = Math.min(1, Math.max(0, smoothing?.strength ?? 0.5));
    const tension = Math.min(1, Math.max(0, smoothing?.tension ?? 0.5));
    const doClamp = smoothing?.clamp ?? true;

    const useSmooth = method !== 'none' && canonical.length >= 2;
    let tangents: number[] | null = null;
    if (useSmooth) {
      if (method === 'monotone') {
        tangents = this.computeTangentsMonotone(canonical);
      } else {
        tangents = this.computeTangentsCatmullRom(canonical, tension);
      }
    }

    for (
      let segmentIndex = 0;
      segmentIndex < segmentLengths.length;
      segmentIndex++
    ) {
      const segmentLength = segmentLengths[segmentIndex] ?? 0;
      if (segmentLength <= 0) {
        continue;
      }

      for (let i = 0; i < segmentLength && writeIndex < result.length; i++) {
        const denom = Math.max(1, segmentLength - 1);
        const t = i / denom;
        const tSeg = segmentIndex % 2 === 1 ? 1 - t : t;

        if (useSmooth && tangents) {
          result[writeIndex++] = this.sampleCubic(
            canonical,
            tSeg,
            method as 'monotone' | 'catmull-rom',
            sStrength,
            doClamp,
            tangents
          );
        } else {
          // Nearest discrete mapping fallback
          const idx = Math.round(tSeg * (canonical.length - 1));
          result[writeIndex++] = canonical[idx] ?? 0;
        }
      }
    }

    // Fill any remaining slots with the last canonical sample to avoid undefined gaps.
    const fallback = canonical[canonical.length - 1] ?? 0;
    for (let i = writeIndex; i < result.length; i++) {
      result[i] = fallback;
    }

    this.lastPlan = {
      mode,
      segmentCount: segments,
      segmentLengths: segmentLengths.slice(),
      canonicalLength: canonical.length,
      totalLength: result.length,
    };

    return result;
  }

  private resolveSegmentCount(mode: SymmetryMode, dataLength: number): number {
    return resolveSymmetrySegmentCount(mode, dataLength, this.maxSegments);
  }

  private buildCanonicalSegment(
    data: number[],
    targetLength: number,
    arcClampDegrees?: number,
    segmentCount?: number
  ): number[] {
    const segments = Math.max(1, Math.floor(segmentCount ?? 1));

    // When no explicit arc clamping is requested and we have n-fold symmetry,
    // use strided sampling so the canonical segment captures the FULL frequency
    // spectrum at reduced resolution.  A contiguous slice would only contain
    // low-frequency bins, making everything above the bass band disappear.
    if (segments > 1 && arcClampDegrees === undefined) {
      const strideLen = Math.max(1, Math.ceil(data.length / segments));
      const canonicalSource = new Array<number>(strideLen);
      for (let i = 0; i < strideLen; i++) {
        const srcIdx = Math.min(i * segments, data.length - 1);
        canonicalSource[i] = data[srcIdx] ?? 0;
      }
      return this.resample(canonicalSource, targetLength);
    }

    // Explicit arc clamping: take a contiguous slice (used for arc modes).
    const defaultArcPerSegment = FULL_CIRCLE_DEGREES / segments;
    const effectiveArc =
      arcClampDegrees !== undefined ? arcClampDegrees : defaultArcPerSegment;
    const clampRatio = this.normalizeArcRatio(effectiveArc);
    const clampedSpan = Math.max(1, Math.round(data.length * clampRatio));

    let canonicalSource = data.slice(0, clampedSpan);
    if (canonicalSource.length < 2 && data.length >= 2 && targetLength > 1) {
      canonicalSource = [data[0] ?? 0, data[1] ?? data[0] ?? 0];
    }

    return this.resample(canonicalSource, targetLength);
  }

  private normalizeArcRatio(arcDegrees: number): number {
    if (!Number.isFinite(arcDegrees) || arcDegrees <= 0) {
      return DEFAULT_ARC_DEGREES / FULL_CIRCLE_DEGREES;
    }

    const clampedDegrees = Math.min(Math.abs(arcDegrees), FULL_CIRCLE_DEGREES);
    return clampedDegrees / FULL_CIRCLE_DEGREES;
  }

  private distributeSegmentLengths(
    totalLength: number,
    segmentCount: number
  ): number[] {
    if (segmentCount <= 0) {
      return [];
    }

    const baseLength = Math.floor(totalLength / segmentCount);
    const remainder = totalLength % segmentCount;
    const lengths = new Array<number>(segmentCount).fill(baseLength);

    // Distribute remainder evenly across segments using round-robin
    // For visual symmetry, spread the extra elements across the circle
    // rather than clustering them at the beginning
    // This ensures opposite segments have similar sizes for n-fold symmetry
    for (let i = 0; i < remainder; i++) {
      // Spread remainder evenly: position = i * (segmentCount / remainder)
      // This distributes extras at equal intervals around the circle
      const targetIndex = Math.floor((i * segmentCount) / remainder);
      lengths[targetIndex] = (lengths[targetIndex] ?? baseLength) + 1;
    }

    return lengths;
  }

  private computeTangentsMonotone(y: number[]): number[] {
    const n = y.length;
    const m = new Array<number>(n).fill(0);
    if (n < 2) return m;
    const d = new Array<number>(n - 1);
    for (let i = 0; i < n - 1; i++) d[i] = (y[i + 1] ?? 0) - (y[i] ?? 0);
    m[0] = d[0] ?? 0;
    m[n - 1] = d[n - 2] ?? 0;
    for (let i = 1; i < n - 1; i++) {
      const d0 = d[i - 1] ?? 0;
      const d1 = d[i] ?? 0;
      if (d0 === 0 || d1 === 0 || d0 * d1 <= 0) {
        m[i] = 0;
      } else {
        m[i] = (3 * d0 * d1) / (d0 + d1);
      }
    }
    return m;
  }

  private computeTangentsCatmullRom(y: number[], tension: number): number[] {
    const n = y.length;
    const m = new Array<number>(n).fill(0);
    if (n < 2) return m;
    const scale = Math.max(0, Math.min(1, 1 - tension));
    // Endpoints: one-sided differences
    m[0] = scale * ((y[1] ?? 0) - (y[0] ?? 0));
    for (let i = 1; i < n - 1; i++) {
      const ym1 = y[i - 1] ?? 0;
      const yp1 = y[i + 1] ?? 0;
      m[i] = 0.5 * scale * (yp1 - ym1);
    }
    m[n - 1] = scale * ((y[n - 1] ?? 0) - (y[n - 2] ?? 0));
    return m;
  }

  private sampleCubic(
    y: number[],
    t: number,
    _method: 'monotone' | 'catmull-rom',
    strength: number,
    clamp: boolean,
    tangents: number[]
  ): number {
    const n = y.length;
    if (n === 0) return 0;
    if (n === 1) return y[0] ?? 0;
    const tt = Math.max(0, Math.min(1, t));
    const scaled = tt * (n - 1);
    const j = Math.min(n - 2, Math.floor(scaled));
    const u = scaled - j; // local parameter 0..1

    const y0 = y[j] ?? 0;
    const y1 = y[j + 1] ?? y0;
    const m0 = tangents[j] ?? 0;
    const m1 = tangents[j + 1] ?? 0;

    // Cubic Hermite basis
    const u2 = u * u;
    const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u * u;

    let cubic = h00 * y0 + h10 * m0 + h01 * y1 + h11 * m1;

    if (clamp) {
      const lo = Math.min(y0, y1);
      const hi = Math.max(y0, y1);
      if (cubic < lo) cubic = lo;
      else if (cubic > hi) cubic = hi;
    }

    const linear = y0 + u * (y1 - y0);
    return linear * (1 - strength) + cubic * strength;
  }

  private resample(data: number[], targetLength: number): number[] {
    if (targetLength <= 0) {
      return [];
    }

    if (targetLength === 1) {
      return [data[0] ?? 0];
    }

    if (targetLength === data.length) {
      return data.slice();
    }

    const result = new Array<number>(targetLength);
    const sourceMaxIndex = Math.max(1, data.length - 1);
    const targetMaxIndex = targetLength - 1;

    for (let i = 0; i < targetLength; i++) {
      const position = (i / targetMaxIndex) * sourceMaxIndex;
      const lowerIndex = Math.floor(position);
      const upperIndex = Math.min(sourceMaxIndex, lowerIndex + 1);
      const ratio = position - lowerIndex;

      const lowerValue = data[lowerIndex] ?? 0;
      const upperValue = data[upperIndex] ?? lowerValue;
      result[i] = lowerValue + (upperValue - lowerValue) * ratio;
    }

    return result;
  }
}
