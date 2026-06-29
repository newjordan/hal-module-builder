import { useRef } from 'react';
import { Layer, AudioReactiveMapping } from '../types/layer-types';
import { AudioProcessor } from '../assets/equalizer/AudioProcessor';

/**
 * Audio analysis data extracted from the processor
 */
interface AudioAnalysis {
  volume: number; // 0-1
  bass: number; // 0-1
  mid: number; // 0-1
  treble: number; // 0-1
  beat: number; // 0-1 (spikes on beats)
}

/**
 * Modulated property values to apply to the layer
 */
interface ReactivePropertyValues {
  scale: number;
  opacity: number;
  rotation: number;
  glowIntensity: number;
  offsetX: number;
  offsetY: number;
  strokeWidth: number;
  brightness: number;
  hueRotate: number;
}

/** Internal envelope state per mapping */
interface EnvelopeState {
  current: number;
  lastTimestamp: number;
}

// Noise gate: audio values below this are treated as silence.
// This prevents ambient mic noise from driving jittery visuals.
const NOISE_GATE = 0.035;

// Attack/release times in seconds.
// Fast attack makes speech onset snappy; slow release gives graceful fade.
const DEFAULT_ATTACK_TIME = 0.04; // 40ms — responsive to transients
const DEFAULT_RELEASE_TIME = 0.18; // 180ms — smooth fade, preserves "talking" feel

// Beat detection: time-based exponential decay (seconds)
const BEAT_HOLD_TIME = 0.06; // Hold peak for 60ms
const BEAT_DECAY_TIME = 0.35; // Decay to zero over 350ms

/**
 * Hook to calculate audio-reactive property modulations.
 *
 * Uses an attack/release envelope per mapping for smooth, jitter-free
 * reactivity. The AudioProcessor's per-frame caching ensures all band
 * values come from the same FFT snapshot.
 */
export const useAudioReactiveProps = (
  layer: Layer,
  audioProcessor: AudioProcessor | null
): Partial<ReactivePropertyValues> => {
  // Per-mapping envelope state (keyed by mapping index)
  const envelopeRef = useRef<Record<string, EnvelopeState>>({});
  const beatRef = useRef({ peakTime: 0, value: 0 });

  const isEnabled = layer.audioReactive?.enabled && audioProcessor;

  // --- Extract audio analysis (one consistent FFT snapshot per frame) ---
  let audioAnalysis: AudioAnalysis | null = null;

  if (isEnabled && audioProcessor) {
    try {
      // Tell the processor this is a new frame so it fetches FFT data once
      audioProcessor.newFrame();

      const volume = audioProcessor.getAverageFrequency() / 255;
      const bass = audioProcessor.getBassLevel() / 255;
      const mid = audioProcessor.getMidLevel() / 255;
      const treble = audioProcessor.getTrebleLevel() / 255;

      // --- Time-based beat detection with hold + decay ---
      const beatInfo = audioProcessor.getBeatInfo();
      const now = performance.now() / 1000; // seconds

      if (beatInfo.isBeat) {
        beatRef.current.peakTime = now;
        beatRef.current.value = 1.0;
      } else {
        const elapsed = now - beatRef.current.peakTime;
        if (elapsed < BEAT_HOLD_TIME) {
          // Hold at peak
          beatRef.current.value = 1.0;
        } else {
          // Exponential decay based on wall-clock time
          const decayElapsed = elapsed - BEAT_HOLD_TIME;
          // tau chosen so value reaches ~0.01 at BEAT_DECAY_TIME
          const tau = BEAT_DECAY_TIME / 4.6; // ln(100) ≈ 4.6
          beatRef.current.value = Math.exp(-decayElapsed / tau);
        }
      }
      const beatValue = Math.max(0, beatRef.current.value);

      audioAnalysis = { volume, bass, mid, treble, beat: beatValue };
    } catch (error) {
      console.error('Error extracting audio analysis:', error);
      audioAnalysis = null;
    }
  }

  if (!isEnabled || !audioAnalysis || !layer.audioReactive?.mappings) {
    return {};
  }

  const now = performance.now();

  // --- Calculate modulated properties ---
  const baseValues: Partial<ReactivePropertyValues> = {};
  const modulatedValues: Partial<
    Record<keyof ReactivePropertyValues, number[]>
  > = {};

  layer.audioReactive.mappings.forEach(
    (mapping: AudioReactiveMapping, idx: number) => {
      let audioValue = audioAnalysis[mapping.audioFeature];
      if (audioValue === undefined) return;

      // Apply noise gate: kill low-level noise so silence = truly zero
      if (mapping.audioFeature !== 'beat') {
        audioValue = audioValue <= NOISE_GATE ? 0 : audioValue;
      }

      // Get base value from layer (only once per property)
      if (baseValues[mapping.targetProperty] === undefined) {
        baseValues[mapping.targetProperty] = getBasePropertyValue(
          layer,
          mapping.targetProperty
        );
      }
      const baseValue = baseValues[mapping.targetProperty]!;

      // Calculate modulation range
      const minValue =
        mapping.minValue ??
        getDefaultMinValue(mapping.targetProperty, baseValue);
      const maxValue =
        mapping.maxValue ??
        getDefaultMaxValue(mapping.targetProperty, baseValue);
      const range = maxValue - minValue;

      // Map audio value through intensity to target value
      const modulationAmount = audioValue * mapping.intensity * range;
      const targetValue = minValue + modulationAmount;

      // --- Attack/Release envelope ---
      // This replaces the old symmetric EMA smoothing. Rising values (attack)
      // respond quickly so speech onset is snappy. Falling values (release)
      // decay slowly so the visual doesn't jitter back to zero between syllables.
      const envKey = `${mapping.targetProperty}_${idx}`;
      const envelope = envelopeRef.current[envKey] ?? {
        current: baseValue,
        lastTimestamp: now,
      };

      const dt = Math.max(0, (now - envelope.lastTimestamp) / 1000); // seconds
      const smoothing = mapping.smoothing ?? 0.7;
      // Scale attack/release times by smoothing parameter (higher = slower)
      const attackTime = DEFAULT_ATTACK_TIME * (0.3 + smoothing * 1.4);
      const releaseTime = DEFAULT_RELEASE_TIME * (0.3 + smoothing * 1.4);

      const isRising = targetValue > envelope.current;
      const tau = isRising ? attackTime : releaseTime;
      // Time-based exponential approach: independent of frame rate
      const alpha = 1 - Math.exp(-dt / Math.max(tau, 0.001));
      const smoothedValue =
        envelope.current + (targetValue - envelope.current) * alpha;

      envelope.current = smoothedValue;
      envelope.lastTimestamp = now;
      envelopeRef.current[envKey] = envelope;

      // Collect modulated values for this property
      if (!modulatedValues[mapping.targetProperty]) {
        modulatedValues[mapping.targetProperty] = [];
      }
      modulatedValues[mapping.targetProperty]!.push(smoothedValue);
    }
  );

  // Combine multiple modulations per property using additive deltas
  const result: Partial<ReactivePropertyValues> = {};
  Object.keys(modulatedValues).forEach(prop => {
    const property = prop as keyof ReactivePropertyValues;
    const values = modulatedValues[property]!;
    const baseValue = baseValues[property]!;

    const sumOfDeltas = values.reduce((acc, val) => acc + (val - baseValue), 0);
    const combinedValue = baseValue + sumOfDeltas;

    // Apply property-specific clamping
    switch (property) {
      case 'scale':
        result[property] = Math.max(0.01, combinedValue);
        break;
      case 'opacity':
        result[property] = Math.max(0, Math.min(1, combinedValue));
        break;
      case 'strokeWidth':
      case 'brightness':
        result[property] = Math.max(0, combinedValue);
        break;
      default:
        result[property] = combinedValue;
        break;
    }
  });

  return result;
};

/**
 * Get the base (non-reactive) value for a property from the layer
 */
function getBasePropertyValue(layer: Layer, property: string): number {
  switch (property) {
    case 'scale':
      return layer.scale ?? 1;
    case 'opacity':
      return layer.opacity ?? 1;
    case 'rotation':
      return layer.rotation ?? 0;
    case 'glowIntensity':
      return layer.glowIntensity ?? 0;
    case 'offsetX':
      return layer.offsetX ?? 0;
    case 'offsetY':
      return layer.offsetY ?? 0;
    case 'strokeWidth':
      return layer.strokeWidth ?? 2;
    case 'brightness':
      return layer.brightness ?? 1;
    case 'hueRotate':
      return 0;
    default:
      return 0;
  }
}

/**
 * Get default minimum value for a property
 */
function getDefaultMinValue(property: string, baseValue: number): number {
  switch (property) {
    case 'scale':
      return baseValue === 0 ? 0 : baseValue * 0.8;
    case 'opacity':
      return Math.max(0, baseValue - 0.3);
    case 'rotation':
      return baseValue - 15;
    case 'glowIntensity':
      return 0;
    case 'offsetX':
    case 'offsetY':
      return baseValue - 20;
    case 'strokeWidth':
      return Math.max(0, baseValue - 2);
    case 'brightness':
      return Math.max(0, baseValue - 0.5);
    case 'hueRotate':
      return 0;
    default:
      return 0;
  }
}

/**
 * Get default maximum value for a property
 */
function getDefaultMaxValue(property: string, baseValue: number): number {
  switch (property) {
    case 'scale':
      return baseValue === 0 ? 1 : baseValue * 2;
    case 'opacity':
      return 1;
    case 'rotation':
      return baseValue + 45;
    case 'glowIntensity':
      return 2;
    case 'offsetX':
    case 'offsetY':
      return baseValue + 50;
    case 'strokeWidth':
      return baseValue + 20;
    case 'brightness':
      return baseValue + 2;
    case 'hueRotate':
      return 360;
    default:
      return 1;
  }
}

export default useAudioReactiveProps;
