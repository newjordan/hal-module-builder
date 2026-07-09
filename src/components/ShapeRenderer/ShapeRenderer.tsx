import * as React from 'react';
import { useMemo, useRef } from 'react';
import {
  ShapeProperties,
  ShapeRenderContext,
  shapeLibrary,
  initializeShapeLibrary,
} from '../../assets/shapes';

// Ensure shapes are registered before any rendering
initializeShapeLibrary();
import { AudioProcessor } from '../../assets/equalizer/AudioProcessor';
import { useAudioReactiveProps } from '../../hooks/useAudioReactiveProps';
import type { Layer } from '../../types/layer-types';

export interface ShapeRendererProps {
  layer: ShapeProperties & {
    shapeType?: string;
    audioReactive?: Layer['audioReactive'];
  };
  size: number;
  audioData?: number[];
  isActive?: boolean;
  animationFrame?: number;
  audioProcessor?: AudioProcessor | null;
  /** True when TTS (browser or ElevenLabs) is actively speaking */
  isSpeaking?: boolean;
  /** Force synthetic speaking pulse even when audio processor is present */
  forceSyntheticSpeaking?: boolean;
}

/**
 * Build a layer with implicit audio reactivity when no explicit config exists.
 * This gives the HAL a default "alive/talking" effect driven by audio volume,
 * so it animates out of the box when TTS plays.
 */
function withImplicitReactivity(
  layer: ShapeRendererProps['layer']
): ShapeRendererProps['layer'] {
  if (layer.audioReactive?.enabled != null) return layer; // already configured
  return {
    ...layer,
    audioReactive: {
      enabled: true,
      mappings: [
        // Subtle scale pulse driven by mid frequencies (speech band)
        {
          audioFeature: 'mid',
          targetProperty: 'scale',
          intensity: 0.4,
          smoothing: 0.6,
        },
        // Gentle glow pulse on volume
        {
          audioFeature: 'volume',
          targetProperty: 'glowIntensity',
          intensity: 0.5,
          smoothing: 0.65,
        },
      ],
    },
  } as ShapeRendererProps['layer'];
}

/**
 * Generate a synthetic "talking" pulse when browser TTS is active but the
 * audio processor has no signal (because window.speechSynthesis bypasses Web Audio).
 * Uses a combination of sine waves at speech-like frequencies to mimic natural mouth movement.
 */
function useSyntheticSpeakingPulse(
  isSpeaking: boolean,
  _animationFrame: number,
  baseScale: number
): { scale?: number; glowIntensity?: number } | null {
  // Track phase so the animation is continuous, not tied to animationFrame directly
  const phaseRef = useRef(0);

  if (!isSpeaking) {
    phaseRef.current = 0;
    return null;
  }

  // Advance phase — animationFrame increments by ~0.1 per rAF tick
  phaseRef.current += 0.15;
  const t = phaseRef.current;

  // Composite wave: slow breathing + faster syllable rhythm + jitter
  // Mimics natural speech cadence (~3-5 syllables/sec)
  const breath = 0.3 * Math.sin(t * 0.4); // slow ~0.5Hz breathing
  const syllable = 0.5 * Math.sin(t * 2.8); // ~4Hz syllable rhythm
  const jitter = 0.2 * Math.sin(t * 7.1); // fast micro-variation
  const pulse = Math.max(0, (breath + syllable + jitter + 0.3) / 1.3); // normalize ~0-1

  return {
    scale: baseScale + pulse * 0.12 * baseScale, // up to ~12% scale change
    glowIntensity: pulse * 0.8,
  };
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  layer,
  size,
  audioData,
  isActive = false,
  animationFrame = 0,
  audioProcessor = null,
  isSpeaking = false,
  forceSyntheticSpeaking = false,
}) => {
  // If audio processor is active and the layer has no explicit reactivity
  // configuration, add implicit defaults. A layer explicitly configured with
  // enabled=false stays static.
  const reactiveLayer =
    audioProcessor && layer.audioReactive?.enabled == null
      ? withImplicitReactivity(layer)
      : layer;

  // Calculate audio-reactive property modulations from real audio
  const reactiveProps = useAudioReactiveProps(
    reactiveLayer as Layer,
    audioProcessor
  );

  // Browser TTS does not feed Web Audio analyzers, so reported energy can be near zero
  // even while speech is active. Detect that case and allow synthetic speaking fallback.
  const hasProcessorSpeechSignal = useMemo(() => {
    if (!audioProcessor) return false;
    try {
      return audioProcessor.getAverageFrequency() / 255 > 0.03;
    } catch {
      return false;
    }
  }, [audioProcessor, animationFrame, isSpeaking]);

  // Synthetic speaking pulse for browser TTS (no audio processor signal)
  const syntheticPulse = useSyntheticSpeakingPulse(
    isSpeaking &&
      (forceSyntheticSpeaking || !audioProcessor || !hasProcessorSpeechSignal),
    animationFrame,
    layer.scale ?? 1
  );

  // Merge static layer properties with reactive modulations
  const effectiveLayer = useMemo(() => {
    // Real audio reactivity takes priority
    if (
      reactiveLayer.audioReactive?.enabled &&
      Object.keys(reactiveProps).length > 0
    ) {
      return { ...layer, ...reactiveProps };
    }

    // Synthetic pulse fallback for browser TTS
    if (syntheticPulse) {
      return { ...layer, ...syntheticPulse };
    }

    return layer;
  }, [layer, reactiveLayer, reactiveProps, syntheticPulse]);

  // Get the shape implementation from the library
  const shape = useMemo(() => {
    // For shape layers, use shapeType; for legacy layers, use type
    const shapeType = effectiveLayer.shapeType || effectiveLayer.type;
    return shapeLibrary.getShape(shapeType);
  }, [effectiveLayer.shapeType, effectiveLayer.type]);

  // Create render context
  const context: ShapeRenderContext = useMemo(
    () => ({
      size,
      ...(audioData !== undefined && { audioData }),
      isActive,
      animationFrame,
    }),
    [size, audioData, isActive, animationFrame]
  );

  // If shape is not found, render error placeholder
  if (!shape) {
    const shapeType = effectiveLayer.shapeType || effectiveLayer.type;
    console.warn(`Shape type "${shapeType}" not found in shape library`);
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: '2px dashed #ff0000',
          color: '#ff0000',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        Unknown shape: {effectiveLayer.shapeType || effectiveLayer.type}
      </div>
    );
  }

  // Validate layer properties
  const validation = shape.validateProperties(effectiveLayer);
  if (!validation.valid) {
    const shapeType = effectiveLayer.shapeType || effectiveLayer.type;
    console.warn(
      `Invalid properties for shape "${shapeType}":`,
      validation.errors
    );
    // Still render but log warnings
  }

  try {
    // Delegate rendering to the shape implementation
    const renderedShape = shape.render(effectiveLayer, context);
    if (!renderedShape) {
      return null;
    }

    const isAnimating = audioProcessor || isSpeaking;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          pointerEvents: 'none',
          transform: `scale(${effectiveLayer.scale ?? 1}) rotate(${effectiveLayer.rotation ?? 0}deg)`,
          opacity: effectiveLayer.opacity ?? 1,
          filter:
            [
              (effectiveLayer as any).brightness != null &&
              (effectiveLayer as any).brightness !== 1
                ? `brightness(${(effectiveLayer as any).brightness})`
                : '',
              (effectiveLayer as any).hueRotate
                ? `hue-rotate(${(effectiveLayer as any).hueRotate}deg)`
                : '',
              (effectiveLayer as any).glowIntensity
                ? `drop-shadow(0 0 ${(effectiveLayer as any).glowIntensity * 8}px rgba(100,180,255,${Math.min(0.8, (effectiveLayer as any).glowIntensity * 0.4)}))`
                : '',
            ]
              .filter(Boolean)
              .join(' ') || undefined,
          transformOrigin: 'center center',
          willChange: isAnimating ? 'transform, opacity, filter' : 'auto',
        }}
        data-shape-container
      >
        {renderedShape}
      </div>
    );
  } catch (error) {
    const shapeType = effectiveLayer.shapeType || effectiveLayer.type;
    console.error(`Error rendering shape "${shapeType}":`, error);

    // Fallback error display
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: '2px dashed #ff0000',
          color: '#ff0000',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'center',
          padding: '10px',
        }}
      >
        Render Error
        <br />
        {effectiveLayer.shapeType || effectiveLayer.type}
      </div>
    );
  }
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ShapeRenderer);
