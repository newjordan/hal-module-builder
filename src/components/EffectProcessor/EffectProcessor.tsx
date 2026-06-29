/**
 * EffectProcessor Component
 * Generic effect processing component for HAL Builder Effects Asset System
 * Story 1.3d: Effects Asset System
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  IEffect,
  EffectParameters,
  EffectContext,
} from '../../assets/effects/IEffect';
import { EffectLibrary } from '../../assets/effects/EffectLibrary';
import { Layer } from '../../types/layer-types';

export interface EffectProcessorProps {
  /** Layer containing effect configuration */
  layer: Layer;
  /** Canvas dimensions */
  size: number;
  /** Audio data for reactive effects */
  audioData?: number[];
  /** Animation time for animated effects */
  time?: number;
  /** Theme for consistent styling */
  theme?: 'frost_light' | 'frost_dark';
  /** Whether the effect is active */
  isActive?: boolean;
  /** Input from previous layer/effect */
  input?: ImageData | HTMLCanvasElement;
  /** Callback when processing is complete */
  onProcessed?: (output: HTMLCanvasElement) => void;
  /** Callback for error handling */
  onError?: (error: Error) => void;
}

/**
 * EffectProcessor renders effects using the effects library system
 * Replaces the inline gradient/solid rendering in HalModuleBuilder
 */
export const EffectProcessor: React.FC<EffectProcessorProps> = React.memo(
  ({
    layer,
    size,
    audioData = [],
    time = 0,
    theme = 'frost_light',
    input,
    onProcessed,
    onError,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastError, setLastError] = useState<Error | null>(null);
    const effectLibrary = EffectLibrary.getInstance();

    // Convert layer to effect parameters
    const effectParams = useMemo((): EffectParameters | null => {
      if (layer.type === 'shape') {
        if (layer.fillType === 'gradient' && layer.fillGradient) {
          return {
            type: layer.fillGradient.type || 'radial',
            colors: layer.fillGradient.colors || [
              '#ff0000',
              '#0000ff',
              'transparent',
            ],
            stops: layer.fillGradient.stops || [0, 0.5, 1],
            angle: layer.fillGradient.angle || 0,
            centerX: layer.fillGradient.centerX || 50,
            centerY: layer.fillGradient.centerY || 50,
            opacity: layer.opacity || 1,
            intensity: 1,
            enabled: layer.visible !== false,
            blendMode: (layer.blendMode as any) || 'normal',
          };
        } else if (layer.fillType === 'solid') {
          return {
            color: layer.fillColor || layer.color || '#ffffff',
            opacity: layer.opacity || 1,
            intensity: 1,
            enabled: layer.visible !== false,
            blendMode: (layer.blendMode as any) || 'normal',
          };
        }
      }
      return null;
    }, [layer]);

    // Get the appropriate effect from the library
    const effect = useMemo((): IEffect | null => {
      if (!effectParams) return null;

      const effectType =
        layer.type === 'shape' && layer.fillType === 'gradient'
          ? 'gradient'
          : layer.type === 'shape' && layer.fillType === 'solid'
            ? 'solid'
            : null;
      if (!effectType) return null;

      return effectLibrary.getEffect(effectType);
    }, [layer.type, effectLibrary]);

    // Process effect
    const processEffect = useCallback(async () => {
      if (!effect || !effectParams || !canvasRef.current) {
        return;
      }

      if (isProcessing) {
        return; // Avoid concurrent processing
      }

      setIsProcessing(true);
      setLastError(null);

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2D rendering context');
        }

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Create effect context
        const effectContext: EffectContext = {
          canvas,
          ctx,
          dimensions: { width: size, height: size },
          time,
          deltaTime: 16.67, // Assume 60fps
          audioData,
          theme,
        };

        // Validate parameters
        const validation = effect.validateParameters(effectParams);
        if (!validation.isValid) {
          throw new Error(
            `Invalid effect parameters: ${validation.errors.join(', ')}`
          );
        }

        // Process the effect
        const output = await effect.process(
          input || canvas,
          effectParams,
          effectContext
        );

        // Render output to canvas
        if (output !== canvas) {
          ctx.clearRect(0, 0, size, size);
          if (output instanceof HTMLCanvasElement) {
            ctx.drawImage(output, 0, 0);
          } else if (output instanceof ImageData) {
            ctx.putImageData(output, 0, 0);
          }
        }

        // Notify completion
        if (onProcessed) {
          onProcessed(canvas);
        }
      } catch (error) {
        const effectError =
          error instanceof Error
            ? error
            : new Error('Unknown effect processing error');
        setLastError(effectError);
        // Silent error handling - effect processing error managed internally

        if (onError) {
          onError(effectError);
        }
      } finally {
        setIsProcessing(false);
      }
    }, [
      effect,
      effectParams,
      input,
      size,
      time,
      audioData,
      theme,
      isProcessing,
      onProcessed,
      onError,
    ]);

    // Process effect when parameters change
    useEffect(() => {
      if (effect && effectParams && layer.visible !== false) {
        processEffect();
      }
    }, [effect, effectParams, layer.visible, processEffect]);

    // Handle canvas size changes
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && (canvas.width !== size || canvas.height !== size)) {
        canvas.width = size;
        canvas.height = size;
        processEffect();
      }
    }, [size, processEffect]);

    // If no effect is available, render fallback
    if (!effect || !effectParams) {
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
            border: '2px dashed #ff0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#ff0000',
          }}
        >
          Effect Not Available
        </div>
      );
    }

    return (
      <>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            opacity: isProcessing ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        />

        {/* Error overlay */}
        {lastError && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: '1px dashed #ff0000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: '#ff0000',
              textAlign: 'center',
              padding: '8px',
            }}
            title={lastError.message}
          >
            Error
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div
            style={{
              position: 'absolute',
              top: size - 20,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: theme === 'frost_light' ? '#3b82f6' : '#60a5fa',
              animation: 'pulse 1s infinite',
            }}
            title='Processing effect...'
          />
        )}
      </>
    );
  }
);

EffectProcessor.displayName = 'EffectProcessor';
