import React, { useEffect, useState, useRef } from 'react';
import { Layer } from '../../types/layer-types';
import { EqualizerEngine } from '../EqualizerEngine/EqualizerEngine';
import { ShapeRenderer } from '../ShapeRenderer';
import { RadialTextRenderer } from '../RadialText/RadialTextRenderer';
import { AudioProcessor } from '../../assets/equalizer/AudioProcessor';

/**
 * Creates a lightweight proxy that returns the max signal from two AudioProcessors.
 * Lets a layer react to both input (mic) and output (TTS) simultaneously.
 */
function mergeProcessors(a: AudioProcessor, b: AudioProcessor): AudioProcessor {
  return {
    newFrame: () => {
      a.newFrame();
      b.newFrame();
    },
    getAverageFrequency: () =>
      Math.max(a.getAverageFrequency(), b.getAverageFrequency()),
    getBassLevel: () => Math.max(a.getBassLevel(), b.getBassLevel()),
    getMidLevel: () => Math.max(a.getMidLevel(), b.getMidLevel()),
    getTrebleLevel: () => Math.max(a.getTrebleLevel(), b.getTrebleLevel()),
    getBeatInfo: () => {
      const beatA = a.getBeatInfo();
      const beatB = b.getBeatInfo();
      return beatA.intensity > beatB.intensity ? beatA : beatB;
    },
    getFrequencyData: (range?: any) => {
      const dataA = a.getFrequencyData(range);
      const dataB = b.getFrequencyData(range);
      const merged = new Uint8Array(Math.max(dataA.length, dataB.length));
      for (let i = 0; i < merged.length; i++) {
        merged[i] = Math.max(dataA[i] ?? 0, dataB[i] ?? 0);
      }
      return merged;
    },
  } as AudioProcessor;
}

interface HalCompositeProps {
  size: number;
  isActive: boolean;
  audioData: number[];
  layers: Layer[];
  onClick: () => void;
  onUpdateLayer?: (layerId: string, updates: Partial<Layer>) => void;
  theme?: 'frost_light' | 'frost_dark';
  debugOverlay?: boolean;
  inputAudioProcessor?: AudioProcessor | null;
  outputAudioProcessor?: AudioProcessor | null;
  /** True when any TTS (browser or ElevenLabs) is actively speaking */
  isSpeaking?: boolean;
  /** Force synthetic speaking pulse even when an audio processor exists (used for browser TTS) */
  forceSyntheticSpeaking?: boolean;
}

export function HalComposite({
  size,
  isActive,
  audioData,
  layers,
  onClick,
  onUpdateLayer,
  theme = 'frost_light',
  debugOverlay = false,
  inputAudioProcessor,
  outputAudioProcessor,
  isSpeaking = false,
  forceSyntheticSpeaking = false,
}: HalCompositeProps) {
  const [animationRotation, setAnimationRotation] = useState(0);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);

  // Initialize internal AudioProcessor when audio becomes active
  // Skip if external dual processors are provided (Chat mode handles its own audio)
  const hasDualProcessors = !!(inputAudioProcessor || outputAudioProcessor);

  useEffect(() => {
    if (hasDualProcessors) return; // External processors provided, don't create internal one

    const initAudio = async () => {
      if (isActive && !audioProcessorRef.current) {
        try {
          const processor = new AudioProcessor({
            fftSize: 1024,
            smoothingTimeConstant: 0.5,
          });
          await processor.initialize();
          await processor.connectMicrophone();
          audioProcessorRef.current = processor;
        } catch (error) {
          console.error(
            'Failed to initialize audio processor for reactivity:',
            error
          );
        }
      } else if (!isActive && audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
      }
    };

    initAudio();

    return () => {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
      }
    };
  }, [isActive, hasDualProcessors]);

  const hasAnimatedLayers = layers.some(
    layer => layer.visible && layer.animation && layer.animation !== 'none'
  );

  useEffect(() => {
    let animationFrameId: number;
    if (isActive || hasAnimatedLayers) {
      const animate = () => {
        setAnimationRotation(prev => prev + 0.1);
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);
    } else {
      setAnimationRotation(0);
    }
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, hasAnimatedLayers]);

  const dimensionPx = `${size}px`;
  const squareFrameStyle: React.CSSProperties = {
    width: dimensionPx,
    height: dimensionPx,
    minWidth: dimensionPx,
    minHeight: dimensionPx,
    maxWidth: dimensionPx,
    maxHeight: dimensionPx,
    aspectRatio: '1 / 1',
  };

  return (
    <div
      className='hal-composite-container frost-relative frost-cursor-pointer frost-inline-block'
      style={{
        position: 'relative',
        background: 'transparent',
        ...squareFrameStyle,
      }}
      onClick={onClick}
      data-testid='hal-composite'
    >
      {/* Debug overlay: center crosshairs */}
      {debugOverlay && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            pointerEvents: 'none',
            ...squareFrameStyle,
          }}
        >
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: size / 2,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(59,130,246,0.6)',
            }}
          />
          {/* Horizontal line */}
          <div
            style={{
              position: 'absolute',
              top: size / 2,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(59,130,246,0.6)',
            }}
          />
        </div>
      )}

      {/* Render layers in order */}
      {layers
        .filter(layer => layer.visible)
        .map((layer: Layer) => {
          // Note: Don't apply scale/rotation/opacity here - let ShapeRenderer handle those
          // for audio reactivity to work. Only apply positioning.
          const transform = `
          translate(-50%, -50%)
          translate(${layer.offsetX}px, ${layer.offsetY}px)
        `;

          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            ...squareFrameStyle,
            transform,
            mixBlendMode: layer.blendMode as any,
            pointerEvents: 'none',
          };
          switch (layer.type) {
            case 'image': {
              // Build CSS filter from layer effects
              const filters: string[] = [];
              filters.push(`brightness(${layer.brightness ?? 1})`);
              filters.push(`contrast(${layer.contrast ?? 1})`);
              if (layer.dropShadow?.enabled) {
                const s = layer.dropShadow;
                const rad = ((s.angle ?? 135) * Math.PI) / 180;
                const dx = Math.round(Math.cos(rad) * (s.distance ?? 4));
                const dy = Math.round(Math.sin(rad) * (s.distance ?? 4));
                filters.push(
                  `drop-shadow(${dx}px ${dy}px ${s.size ?? 10}px ${s.color ?? 'rgba(0,0,0,0.5)'})`
                );
              }
              if (layer.outerGlow?.enabled) {
                const g = layer.outerGlow;
                filters.push(
                  `drop-shadow(0 0 ${g.size ?? 10}px ${g.color ?? '#ffffff'})`
                );
              }

              const imageStyle: React.CSSProperties = {
                ...baseStyle,
                transform:
                  baseStyle.transform +
                  ` scale(${layer.scale ?? 1}) rotate(${layer.rotation ?? 0}deg)`,
                opacity: layer.opacity ?? 1,
                filter: filters.join(' '),
              };

              if (layer.src) {
                return (
                  <img
                    key={layer.id}
                    src={layer.src}
                    alt={layer.name}
                    style={imageStyle}
                  />
                );
              }

              // Only show upload placeholder in design mode (when onUpdateLayer is provided)
              if (!onUpdateLayer) return null;

              return (
                <label
                  key={layer.id}
                  style={{
                    ...imageStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor =
                      'rgba(100, 150, 255, 0.5)';
                    e.currentTarget.style.background =
                      'rgba(100, 150, 255, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor =
                      'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <input
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        onUpdateLayer(layer.id, {
                          src: reader.result as string,
                        });
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.3)',
                      fontSize: Math.max(12, size * 0.04),
                      userSelect: 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: Math.max(24, size * 0.08),
                        marginBottom: 8,
                      }}
                    >
                      +
                    </div>
                    <div>Click to upload image</div>
                  </div>
                </label>
              );
            }

            case 'shape': {
              const shapeLayer = {
                ...layer,
                shapeType:
                  layer.shapeType || (layer as any).shapeType || 'circle',
                shapeSpecific:
                  layer.shapeSpecific ||
                  (layer as any).shapeSpecific ||
                  (layer as any).circleSettings ||
                  undefined,
              };

              // Build animation transform fragment based on layer.animation
              const speed = layer.animationSpeed ?? 1;
              let animTransform = '';
              if (layer.animation === 'rotate') {
                animTransform = ` rotate(${animationRotation * speed}deg)`;
              } else if (layer.animation === 'pulse') {
                animTransform = ` scale(${1 + 0.1 * Math.sin(animationRotation * 0.05 * speed)})`;
              }

              const shapeStyle: React.CSSProperties = {
                ...baseStyle,
                ...(animTransform
                  ? { transform: baseStyle.transform + animTransform }
                  : {}),
              };

              // Select audio processor based on layer.audioType
              // Default to 'both' so layers react to mic AND TTS output
              let layerProcessor: AudioProcessor | null;
              if (inputAudioProcessor || outputAudioProcessor) {
                const audioType = layer.audioType ?? 'both';
                if (
                  audioType === 'both' &&
                  inputAudioProcessor &&
                  outputAudioProcessor
                ) {
                  layerProcessor = mergeProcessors(
                    inputAudioProcessor,
                    outputAudioProcessor
                  );
                } else if (audioType === 'both' || audioType === 'output') {
                  // 'output' explicitly, or 'both' when only one processor is available
                  layerProcessor =
                    outputAudioProcessor ??
                    inputAudioProcessor ??
                    audioProcessorRef.current;
                } else {
                  layerProcessor =
                    inputAudioProcessor ?? audioProcessorRef.current;
                }
              } else {
                layerProcessor = audioProcessorRef.current;
              }

              return (
                <div key={layer.id} style={shapeStyle}>
                  <ShapeRenderer
                    layer={shapeLayer as any}
                    size={size}
                    audioData={audioData}
                    isActive={isActive}
                    animationFrame={animationRotation}
                    audioProcessor={layerProcessor}
                    isSpeaking={isSpeaking}
                    forceSyntheticSpeaking={forceSyntheticSpeaking}
                  />
                </div>
              );
            }
            case 'equalizer': {
              const equalizerStyle: React.CSSProperties = {
                ...baseStyle,
                transform:
                  baseStyle.transform +
                  ` scale(${layer.scale ?? 1}) rotate(${layer.rotation ?? 0}deg)`,
                opacity: layer.opacity ?? 1,
              };
              return (
                <div key={layer.id} style={equalizerStyle} data-eq-wrapper>
                  <EqualizerEngine
                    key={layer.id}
                    equalizerSettings={layer.equalizerSettings}
                    audioData={audioData}
                    isActive={isActive}
                    size={size}
                    theme={theme}
                    {...(layer.visualizationType
                      ? { visualizationType: layer.visualizationType }
                      : {})}
                    onError={error => {
                      console.error(
                        'Equalizer error in layer',
                        layer.id,
                        error
                      );
                    }}
                    {...(debugOverlay && { className: 'debug' })}
                  />
                </div>
              );
            }

            case 'radialText': {
              const radialTextLayer = layer as any;
              if (!radialTextLayer.radialTextConfig) return null;

              const layerTheme =
                radialTextLayer.radialTextConfig.theme ||
                radialTextLayer.theme ||
                theme;

              const radialStyle: React.CSSProperties = {
                ...baseStyle,
                transform:
                  baseStyle.transform +
                  ` scale(${layer.scale ?? 1}) rotate(${layer.rotation ?? 0}deg)`,
                opacity: layer.opacity ?? 1,
              };

              return (
                <div key={layer.id} style={radialStyle}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                    }}
                  >
                    <RadialTextRenderer
                      theme={layerTheme}
                      config={radialTextLayer.radialTextConfig}
                      {...(radialTextLayer.radialTextEffects !== undefined
                        ? { effects: radialTextLayer.radialTextEffects }
                        : {})}
                      appearance={layer as any}
                      {...(radialTextLayer.radialTextAnimation !== undefined
                        ? { animation: radialTextLayer.radialTextAnimation }
                        : {})}
                      {...(audioData.length > 0
                        ? { audioData: new Float32Array(audioData) }
                        : {})}
                      isActive={isActive && layer.visible}
                      size={size}
                      className='frost-absolute frost-inset-0'
                    />
                  </div>
                </div>
              );
            }

            default:
              return null;
          }
        })}
    </div>
  );
}
