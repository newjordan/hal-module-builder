import React, { useState } from 'react';
import { Panel } from '../DesignLayout';
import type {
  Layer,
  AudioFeature,
  ReactiveProperty,
  AudioReactiveMapping,
} from '../../../types';

interface PropertiesPanelProps {
  selectedLayer: Layer | null;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
}

type PropertyTab = 'transform' | 'appearance' | 'effects' | 'audio';

const TABS: { id: PropertyTab; label: string; icon: string }[] = [
  { id: 'transform', label: 'Transform', icon: '⊞' },
  { id: 'appearance', label: 'Appearance', icon: '◐' },
  { id: 'effects', label: 'Effects', icon: '✦' },
  { id: 'audio', label: 'Audio', icon: '♫' },
];

export function PropertiesPanel({
  selectedLayer,
  onUpdateLayer,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<PropertyTab>('transform');
  const prevLayerIdRef = React.useRef<string | null>(null);

  // Auto-switch to Appearance tab when selecting an image layer without a source
  React.useEffect(() => {
    if (
      selectedLayer &&
      selectedLayer.id !== prevLayerIdRef.current &&
      selectedLayer.type === 'image' &&
      !selectedLayer.src
    ) {
      setActiveTab('appearance');
    }
    prevLayerIdRef.current = selectedLayer?.id ?? null;
  }, [selectedLayer]);

  if (!selectedLayer) {
    return (
      <Panel position='right' title='PROPERTIES'>
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: 13,
          }}
        >
          Select a layer to view properties
        </div>
      </Panel>
    );
  }

  return (
    <Panel position='right' title='PROPERTIES'>
      {/* Layer Name Header */}
      <div style={{ marginBottom: 12 }}>
        <TextInput
          value={selectedLayer.name}
          onChange={value => onUpdateLayer(selectedLayer.id, { name: value })}
          placeholder='Layer name'
        />
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 12,
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 6,
          padding: 3,
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '6px 4px',
              background:
                activeTab === tab.id
                  ? 'rgba(100, 150, 255, 0.2)'
                  : 'transparent',
              border: 'none',
              borderRadius: 4,
              color:
                activeTab === tab.id
                  ? 'rgba(100, 150, 255, 1)'
                  : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 500,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.15s ease',
            }}
            title={tab.label}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTab === 'transform' && (
          <TransformTab layer={selectedLayer} onUpdate={onUpdateLayer} />
        )}
        {activeTab === 'appearance' && (
          <AppearanceTab layer={selectedLayer} onUpdate={onUpdateLayer} />
        )}
        {activeTab === 'effects' && (
          <EffectsTab layer={selectedLayer} onUpdate={onUpdateLayer} />
        )}
        {activeTab === 'audio' && (
          <AudioTab layer={selectedLayer} onUpdate={onUpdateLayer} />
        )}
      </div>
    </Panel>
  );
}

// ============================================
// TAB COMPONENTS
// ============================================

function TransformTab({
  layer,
  onUpdate,
}: {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
}) {
  return (
    <>
      <PropertySection title='Opacity & Scale'>
        <PropertyRow label='Opacity'>
          <RangeInput
            value={layer.opacity}
            min={0}
            max={1}
            step={0.01}
            onChange={value => onUpdate(layer.id, { opacity: value })}
          />
        </PropertyRow>
        <PropertyRow label='Scale'>
          <RangeInput
            value={layer.scale}
            min={0.1}
            max={3}
            step={0.05}
            onChange={value => onUpdate(layer.id, { scale: value })}
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection title='Rotation'>
        <PropertyRow label='Angle'>
          <RangeInput
            value={layer.rotation}
            min={0}
            max={360}
            step={1}
            onChange={value => onUpdate(layer.id, { rotation: value })}
          />
        </PropertyRow>
        <PropertyRow label='Animation'>
          <SelectInput
            value={layer.animation || 'none'}
            options={[
              { value: 'none', label: 'None' },
              { value: 'rotate', label: 'Rotate' },
              { value: 'pulse', label: 'Pulse' },
            ]}
            onChange={value =>
              onUpdate(layer.id, {
                animation: value as NonNullable<Layer['animation']>,
              })
            }
          />
        </PropertyRow>
        {layer.animation && layer.animation !== 'none' && (
          <PropertyRow label='Speed'>
            <RangeInput
              value={layer.animationSpeed || 1}
              min={0.1}
              max={5}
              step={0.1}
              onChange={value => onUpdate(layer.id, { animationSpeed: value })}
            />
          </PropertyRow>
        )}
      </PropertySection>

      <PropertySection title='Position'>
        <PropertyRow label='Offset X'>
          <NumberInput
            value={layer.offsetX || 0}
            onChange={value => onUpdate(layer.id, { offsetX: value })}
          />
        </PropertyRow>
        <PropertyRow label='Offset Y'>
          <NumberInput
            value={layer.offsetY || 0}
            onChange={value => onUpdate(layer.id, { offsetY: value })}
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection title='Blending'>
        <PropertyRow label='Mode'>
          <SelectInput
            value={layer.blendMode || 'normal'}
            options={BLEND_MODES}
            onChange={value => onUpdate(layer.id, { blendMode: value })}
          />
        </PropertyRow>
      </PropertySection>

      {/* Equalizer-specific transform settings */}
      {layer.type === 'equalizer' && (
        <>
          <PropertySection title='Symmetry'>
            <PropertyRow label='Mode'>
              <SelectInput
                value={layer.equalizerSettings?.symmetry || 'none'}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'mirror', label: 'Mirror' },
                  { value: 'rotate', label: 'Rotate' },
                  { value: '4-fold', label: '4-Fold' },
                  { value: '6-fold', label: '6-Fold' },
                  { value: '8-fold', label: '8-Fold' },
                  { value: '12-fold', label: '12-Fold' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      symmetry: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
          </PropertySection>

          <PropertySection title='Radial Layout'>
            <PropertyRow label='Inner Radius'>
              <RangeInput
                value={layer.equalizerSettings?.innerRadius || 80}
                min={20}
                max={200}
                step={5}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      innerRadius: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Start Angle'>
              <RangeInput
                value={layer.equalizerSettings?.startAngle || 0}
                min={0}
                max={360}
                step={5}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      startAngle: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='End Angle'>
              <RangeInput
                value={layer.equalizerSettings?.endAngle || 360}
                min={0}
                max={360}
                step={5}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      endAngle: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Arc Mode'>
              <ToggleInput
                value={layer.equalizerSettings?.arcMode || false}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      arcMode: value,
                    },
                  })
                }
              />
            </PropertyRow>
            {layer.equalizerSettings?.arcMode && (
              <>
                <PropertyRow label='Invert'>
                  <ToggleInput
                    value={layer.equalizerSettings?.invert || false}
                    onChange={value =>
                      onUpdate(layer.id, {
                        equalizerSettings: {
                          ...layer.equalizerSettings,
                          invert: value,
                        },
                      })
                    }
                  />
                </PropertyRow>
                <PropertyRow label='Reverse Dir.'>
                  <ToggleInput
                    value={layer.equalizerSettings?.invertDirection || false}
                    onChange={value =>
                      onUpdate(layer.id, {
                        equalizerSettings: {
                          ...layer.equalizerSettings,
                          invertDirection: value,
                        },
                      })
                    }
                  />
                </PropertyRow>
              </>
            )}
          </PropertySection>
        </>
      )}
    </>
  );
}

function AppearanceTab({
  layer,
  onUpdate,
}: {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
}) {
  return (
    <>
      {/* Shape-specific */}
      {layer.type === 'shape' && (
        <>
          <PropertySection title='Shape Type'>
            <PropertyRow label='Type'>
              <SelectInput
                value={layer.shapeType || 'circle'}
                options={[
                  { value: 'circle', label: 'Circle' },
                  { value: 'rectangle', label: 'Rectangle' },
                  { value: 'triangle', label: 'Triangle' },
                  { value: 'polygon', label: 'Polygon' },
                  { value: 'star', label: 'Star' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    shapeType: value as NonNullable<Layer['shapeType']>,
                  })
                }
              />
            </PropertyRow>
          </PropertySection>

          <PropertySection title='Fill'>
            <PropertyRow label='Type'>
              <SelectInput
                value={layer.fillType || 'solid'}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'solid', label: 'Solid' },
                  { value: 'gradient', label: 'Gradient' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    fillType: value as NonNullable<Layer['fillType']>,
                  })
                }
              />
            </PropertyRow>
            {layer.fillType === 'solid' && (
              <PropertyRow label='Color'>
                <ColorInput
                  value={layer.fillColor || '#ffffff'}
                  onChange={value => onUpdate(layer.id, { fillColor: value })}
                />
              </PropertyRow>
            )}
          </PropertySection>

          <PropertySection title='Stroke'>
            <PropertyRow label='Type'>
              <SelectInput
                value={layer.strokeType || 'none'}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'solid', label: 'Solid' },
                  { value: 'gradient', label: 'Gradient' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    strokeType: value as NonNullable<Layer['strokeType']>,
                  })
                }
              />
            </PropertyRow>
            {layer.strokeType === 'solid' && (
              <>
                <PropertyRow label='Color'>
                  <ColorInput
                    value={layer.strokeColor || '#000000'}
                    onChange={value =>
                      onUpdate(layer.id, { strokeColor: value })
                    }
                  />
                </PropertyRow>
                <PropertyRow label='Width'>
                  <RangeInput
                    value={layer.strokeWidth || 2}
                    min={0}
                    max={20}
                    step={0.5}
                    onChange={value =>
                      onUpdate(layer.id, { strokeWidth: value })
                    }
                  />
                </PropertyRow>
                <PropertyRow label='Align'>
                  <SelectInput
                    value={layer.strokeAlign || 'center'}
                    options={[
                      { value: 'inner', label: 'Inner' },
                      { value: 'center', label: 'Center' },
                      { value: 'outer', label: 'Outer' },
                    ]}
                    onChange={value =>
                      onUpdate(layer.id, {
                        strokeAlign: value as 'inner' | 'outer' | 'center',
                      })
                    }
                  />
                </PropertyRow>
                <PropertyRow label='Dash'>
                  <TextInput
                    value={layer.strokeDasharray || ''}
                    onChange={value =>
                      onUpdate(layer.id, { strokeDasharray: value })
                    }
                    placeholder='e.g. 5,5 or 10,5,2,5'
                  />
                </PropertyRow>
              </>
            )}
          </PropertySection>
        </>
      )}

      {/* Equalizer-specific */}
      {layer.type === 'equalizer' && (
        <>
          <PropertySection title='Visualization'>
            <PropertyRow label='Style'>
              <SelectInput
                value={layer.equalizerSettings?.barStyle || 'bar'}
                options={[
                  { value: 'bar', label: 'Bar' },
                  { value: 'line', label: 'Line' },
                  { value: 'dot', label: 'Dot' },
                  { value: 'circle', label: 'Circle' },
                  { value: 'hexagon', label: 'Hexagon' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      barStyle: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Bars'>
              <RangeInput
                value={layer.equalizerSettings?.barCount || 32}
                min={8}
                max={128}
                step={8}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      barCount: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Height'>
              <RangeInput
                value={layer.equalizerSettings?.maxHeight || 100}
                min={20}
                max={300}
                step={10}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      maxHeight: value,
                    },
                  })
                }
              />
            </PropertyRow>
          </PropertySection>

          <PropertySection title='Colors'>
            <PropertyRow label='Primary'>
              <ColorInput
                value={layer.equalizerSettings?.primaryColor || '#00ff00'}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      primaryColor: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Secondary'>
              <ColorInput
                value={layer.equalizerSettings?.secondaryColor || '#0000ff'}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      secondaryColor: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Color Mode'>
              <SelectInput
                value={layer.equalizerSettings?.colorMode || 'solid'}
                options={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'gradient', label: 'Gradient' },
                  { value: 'rainbow', label: 'Rainbow' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      colorMode: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
          </PropertySection>

          <PropertySection title='Response'>
            <PropertyRow label='Speed'>
              <RangeInput
                value={layer.equalizerSettings?.responseSpeed || 0.7}
                min={0.1}
                max={1}
                step={0.05}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      responseSpeed: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Freq. Range'>
              <SelectInput
                value={layer.equalizerSettings?.frequencyRange || 'full'}
                options={[
                  { value: 'full', label: 'Full' },
                  { value: 'bass', label: 'Bass' },
                  { value: 'mid', label: 'Mid' },
                  { value: 'treble', label: 'Treble' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      frequencyRange: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
          </PropertySection>

          <PropertySection title='Bar Size'>
            <PropertyRow label='Width'>
              <RangeInput
                value={layer.equalizerSettings?.barWidth || 4}
                min={1}
                max={20}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      barWidth: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Spacing'>
              <RangeInput
                value={layer.equalizerSettings?.barSpacing || 2}
                min={0}
                max={10}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      barSpacing: value,
                    },
                  })
                }
              />
            </PropertyRow>
          </PropertySection>

          <PropertySection title='Effects'>
            <PropertyRow label='Pulse'>
              <SelectInput
                value={layer.equalizerSettings?.pulseMode || 'none'}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'subtle', label: 'Subtle' },
                  { value: 'strong', label: 'Strong' },
                ]}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      pulseMode: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Glow'>
              <RangeInput
                value={layer.equalizerSettings?.glowIntensity || 0}
                min={0}
                max={1}
                step={0.1}
                onChange={value =>
                  onUpdate(layer.id, {
                    equalizerSettings: {
                      ...layer.equalizerSettings,
                      glowIntensity: value,
                    },
                  })
                }
              />
            </PropertyRow>
          </PropertySection>
        </>
      )}

      {/* Image-specific */}
      {layer.type === 'image' && (
        <>
          <PropertySection title='Image Source'>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type='file'
                accept='image/*'
                id={`image-upload-${layer.id}`}
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    onUpdate(layer.id, { src: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() =>
                  document.getElementById(`image-upload-${layer.id}`)?.click()
                }
                style={{
                  padding: '6px 12px',
                  background: 'rgba(59, 130, 246, 0.3)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: 4,
                  color: '#93c5fd',
                  cursor: 'pointer',
                  fontSize: 12,
                  width: '100%',
                }}
              >
                {layer.src ? 'Replace Image...' : 'Upload Image...'}
              </button>
              {layer.src && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={layer.src}
                    alt='Preview'
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                  <button
                    onClick={() =>
                      onUpdate(layer.id, { src: undefined as any })
                    }
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: 4,
                      color: '#fca5a5',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </PropertySection>
          <PropertySection title='Adjustments'>
            <PropertyRow label='Brightness'>
              <RangeInput
                value={layer.brightness || 1}
                min={0}
                max={2}
                step={0.05}
                onChange={value => onUpdate(layer.id, { brightness: value })}
              />
            </PropertyRow>
            <PropertyRow label='Contrast'>
              <RangeInput
                value={layer.contrast || 1}
                min={0}
                max={2}
                step={0.05}
                onChange={value => onUpdate(layer.id, { contrast: value })}
              />
            </PropertyRow>
          </PropertySection>
        </>
      )}

      {/* Generic color for other types */}
      {!['shape', 'equalizer', 'image'].includes(layer.type) && (
        <PropertySection title='Color'>
          <PropertyRow label='Primary'>
            <ColorInput
              value={layer.color || '#ffffff'}
              onChange={value => onUpdate(layer.id, { color: value })}
            />
          </PropertyRow>
        </PropertySection>
      )}
    </>
  );
}

function EffectsTab({
  layer,
  onUpdate,
}: {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
}) {
  return (
    <>
      {/* Outer Glow */}
      <PropertySection title='Outer Glow'>
        <PropertyRow label='Enabled'>
          <ToggleInput
            value={layer.outerGlow?.enabled || false}
            onChange={value =>
              onUpdate(layer.id, {
                outerGlow: {
                  ...DEFAULT_GLOW,
                  ...layer.outerGlow,
                  enabled: value,
                },
              })
            }
          />
        </PropertyRow>
        {layer.outerGlow?.enabled && (
          <>
            <PropertyRow label='Color'>
              <ColorInput
                value={layer.outerGlow?.color || '#ffffff'}
                onChange={value =>
                  onUpdate(layer.id, {
                    outerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.outerGlow,
                      color: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Size'>
              <RangeInput
                value={layer.outerGlow?.size || 10}
                min={1}
                max={50}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    outerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.outerGlow,
                      size: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Opacity'>
              <RangeInput
                value={layer.outerGlow?.opacity || 0.75}
                min={0}
                max={1}
                step={0.05}
                onChange={value =>
                  onUpdate(layer.id, {
                    outerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.outerGlow,
                      opacity: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Spread'>
              <RangeInput
                value={layer.outerGlow?.spread || 0}
                min={0}
                max={100}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    outerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.outerGlow,
                      spread: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Blend'>
              <SelectInput
                value={layer.outerGlow?.blendMode || 'screen'}
                options={BLEND_MODES}
                onChange={value =>
                  onUpdate(layer.id, {
                    outerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.outerGlow,
                      blendMode: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
          </>
        )}
      </PropertySection>

      {/* Inner Glow */}
      <PropertySection title='Inner Glow'>
        <PropertyRow label='Enabled'>
          <ToggleInput
            value={layer.innerGlow?.enabled || false}
            onChange={value =>
              onUpdate(layer.id, {
                innerGlow: {
                  ...DEFAULT_GLOW,
                  ...layer.innerGlow,
                  enabled: value,
                },
              })
            }
          />
        </PropertyRow>
        {layer.innerGlow?.enabled && (
          <>
            <PropertyRow label='Color'>
              <ColorInput
                value={layer.innerGlow?.color || '#ffffff'}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.innerGlow,
                      color: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Size'>
              <RangeInput
                value={layer.innerGlow?.size || 10}
                min={1}
                max={50}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.innerGlow,
                      size: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Opacity'>
              <RangeInput
                value={layer.innerGlow?.opacity || 0.75}
                min={0}
                max={1}
                step={0.05}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.innerGlow,
                      opacity: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Spread'>
              <RangeInput
                value={layer.innerGlow?.spread || 0}
                min={0}
                max={100}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.innerGlow,
                      spread: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Blend'>
              <SelectInput
                value={layer.innerGlow?.blendMode || 'screen'}
                options={BLEND_MODES}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerGlow: {
                      ...DEFAULT_GLOW,
                      ...layer.innerGlow,
                      blendMode: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
          </>
        )}
      </PropertySection>

      {/* Drop Shadow */}
      <PropertySection title='Drop Shadow'>
        <PropertyRow label='Enabled'>
          <ToggleInput
            value={layer.dropShadow?.enabled || false}
            onChange={value =>
              onUpdate(layer.id, {
                dropShadow: {
                  ...DEFAULT_SHADOW,
                  ...layer.dropShadow,
                  enabled: value,
                },
              })
            }
          />
        </PropertyRow>
        {layer.dropShadow?.enabled && (
          <>
            <PropertyRow label='Color'>
              <ColorInput
                value={layer.dropShadow?.color || '#000000'}
                onChange={value =>
                  onUpdate(layer.id, {
                    dropShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.dropShadow,
                      color: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Distance'>
              <RangeInput
                value={layer.dropShadow?.distance || 5}
                min={0}
                max={50}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    dropShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.dropShadow,
                      distance: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Angle'>
              <RangeInput
                value={layer.dropShadow?.angle || 135}
                min={0}
                max={360}
                step={5}
                onChange={value =>
                  onUpdate(layer.id, {
                    dropShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.dropShadow,
                      angle: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Blur'>
              <RangeInput
                value={layer.dropShadow?.size || 10}
                min={0}
                max={50}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    dropShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.dropShadow,
                      size: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Opacity'>
              <RangeInput
                value={layer.dropShadow?.opacity || 0.5}
                min={0}
                max={1}
                step={0.05}
                onChange={value =>
                  onUpdate(layer.id, {
                    dropShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.dropShadow,
                      opacity: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Spread'>
              <RangeInput
                value={layer.dropShadow?.spread || 0}
                min={0}
                max={100}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    dropShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.dropShadow,
                      spread: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Blend'>
              <SelectInput
                value={layer.dropShadow?.blendMode || 'multiply'}
                options={BLEND_MODES}
                onChange={value =>
                  onUpdate(layer.id, {
                    dropShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.dropShadow,
                      blendMode: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
          </>
        )}
      </PropertySection>

      {/* Inner Shadow */}
      <PropertySection title='Inner Shadow'>
        <PropertyRow label='Enabled'>
          <ToggleInput
            value={layer.innerShadow?.enabled || false}
            onChange={value =>
              onUpdate(layer.id, {
                innerShadow: {
                  ...DEFAULT_SHADOW,
                  ...layer.innerShadow,
                  enabled: value,
                },
              })
            }
          />
        </PropertyRow>
        {layer.innerShadow?.enabled && (
          <>
            <PropertyRow label='Color'>
              <ColorInput
                value={layer.innerShadow?.color || '#000000'}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.innerShadow,
                      color: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Distance'>
              <RangeInput
                value={layer.innerShadow?.distance || 5}
                min={0}
                max={50}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.innerShadow,
                      distance: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Blur'>
              <RangeInput
                value={layer.innerShadow?.size || 10}
                min={0}
                max={50}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.innerShadow,
                      size: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Angle'>
              <RangeInput
                value={layer.innerShadow?.angle || 135}
                min={0}
                max={360}
                step={5}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.innerShadow,
                      angle: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Spread'>
              <RangeInput
                value={layer.innerShadow?.spread || 0}
                min={0}
                max={100}
                step={0.5}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.innerShadow,
                      spread: value,
                    },
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label='Blend'>
              <SelectInput
                value={layer.innerShadow?.blendMode || 'multiply'}
                options={BLEND_MODES}
                onChange={value =>
                  onUpdate(layer.id, {
                    innerShadow: {
                      ...DEFAULT_SHADOW,
                      ...layer.innerShadow,
                      blendMode: value as any,
                    },
                  })
                }
              />
            </PropertyRow>
          </>
        )}
      </PropertySection>
    </>
  );
}

function AudioTab({
  layer,
  onUpdate,
}: {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
}) {
  const audioReactive = layer.audioReactive || { enabled: false, mappings: [] };
  const mappings = audioReactive.mappings || [];

  const addMapping = () => {
    const newMapping = {
      audioFeature: 'volume' as AudioFeature,
      targetProperty: 'scale' as ReactiveProperty,
      intensity: 0.5,
    };
    onUpdate(layer.id, {
      audioReactive: {
        ...audioReactive,
        enabled: true,
        mappings: [...mappings, newMapping],
      },
    });
  };

  const updateMapping = (
    index: number,
    updates: Partial<(typeof mappings)[0]>
  ) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      ...updates,
    } as AudioReactiveMapping;
    onUpdate(layer.id, {
      audioReactive: { ...audioReactive, mappings: newMappings },
    });
  };

  const removeMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onUpdate(layer.id, {
      audioReactive: { ...audioReactive, mappings: newMappings },
    });
  };

  return (
    <>
      <PropertySection title='Audio Source'>
        <PropertyRow label='Source'>
          <SelectInput
            value={layer.audioType || 'input'}
            options={[
              { value: 'input', label: 'Input (Mic)' },
              { value: 'output', label: 'Output (AI Voice)' },
              { value: 'both', label: 'Both (Mic + AI)' },
            ]}
            onChange={value =>
              onUpdate(layer.id, {
                audioType: value as 'input' | 'output' | 'both',
              })
            }
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection title='Audio Reactivity'>
        <PropertyRow label='Enabled'>
          <ToggleInput
            value={audioReactive.enabled}
            onChange={value =>
              onUpdate(layer.id, {
                audioReactive: { ...audioReactive, enabled: value },
              })
            }
          />
        </PropertyRow>
      </PropertySection>

      {audioReactive.enabled && (
        <>
          <PropertySection title='Mappings'>
            {mappings.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: 12,
                }}
              >
                No mappings. Add one below.
              </div>
            ) : (
              mappings.map((mapping, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      Mapping {index + 1}
                    </span>
                    <button
                      onClick={() => removeMapping(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 100, 100, 0.7)',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <PropertyRow label='Source'>
                    <SelectInput
                      value={mapping.audioFeature}
                      options={[
                        { value: 'volume', label: 'Volume' },
                        { value: 'bass', label: 'Bass' },
                        { value: 'mid', label: 'Mid' },
                        { value: 'treble', label: 'Treble' },
                        { value: 'beat', label: 'Beat' },
                      ]}
                      onChange={value =>
                        updateMapping(index, {
                          audioFeature: value as AudioFeature,
                        })
                      }
                    />
                  </PropertyRow>
                  <PropertyRow label='Target'>
                    <SelectInput
                      value={mapping.targetProperty}
                      options={[
                        { value: 'scale', label: 'Scale' },
                        { value: 'opacity', label: 'Opacity' },
                        { value: 'rotation', label: 'Rotation' },
                        { value: 'strokeWidth', label: 'Stroke Width' },
                        { value: 'brightness', label: 'Brightness' },
                        { value: 'hueRotate', label: 'Hue Shift' },
                        { value: 'glowIntensity', label: 'Glow' },
                        { value: 'offsetX', label: 'Offset X' },
                        { value: 'offsetY', label: 'Offset Y' },
                      ]}
                      onChange={value =>
                        updateMapping(index, {
                          targetProperty: value as ReactiveProperty,
                        })
                      }
                    />
                  </PropertyRow>
                  <PropertyRow label='Intensity'>
                    <RangeInput
                      value={mapping.intensity}
                      min={0}
                      max={10}
                      step={0.1}
                      onChange={value =>
                        updateMapping(index, { intensity: value })
                      }
                    />
                  </PropertyRow>
                </div>
              ))
            )}
          </PropertySection>

          <button
            onClick={addMapping}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(100, 150, 255, 0.15)',
              border: '1px solid rgba(100, 150, 255, 0.3)',
              borderRadius: 6,
              color: 'rgba(100, 150, 255, 1)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            + Add Mapping
          </button>
        </>
      )}
    </>
  );
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_GLOW = {
  enabled: false,
  blendMode: 'screen' as const,
  color: '#ffffff',
  opacity: 0.75,
  spread: 0,
  size: 10,
};

const DEFAULT_SHADOW = {
  enabled: false,
  blendMode: 'multiply' as const,
  color: '#000000',
  opacity: 0.5,
  angle: 135,
  distance: 5,
  spread: 0,
  size: 10,
};

const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

// ============================================
// UI COMPONENTS
// ============================================

function PropertySection({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: 'transparent',
          border: 'none',
          borderBottom: expanded
            ? '1px solid rgba(255, 255, 255, 0.05)'
            : 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.5,
          textAlign: 'left',
        }}
      >
        {title}
        <span style={{ fontSize: 10, opacity: 0.5 }}>
          {expanded ? '▼' : '▶'}
        </span>
      </button>
      {expanded && <div style={{ padding: '8px 10px' }}>{children}</div>}
    </div>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.5)',
          minWidth: 70,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type='text'
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '6px 8px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        color: 'white',
        fontSize: 13,
        outline: 'none',
      }}
    />
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type='number'
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{
        width: '100%',
        padding: '6px 8px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        color: 'white',
        fontSize: 13,
        outline: 'none',
      }}
    />
  );
}

function RangeInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const [localValue, setLocalValue] = React.useState(value);
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState('');
  const dragging = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!dragging.current) {
      setLocalValue(value);
    }
  }, [value]);

  const commitEdit = () => {
    const parsed = parseFloat(editText);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      setLocalValue(clamped);
      onChange(clamped);
    }
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type='range'
        value={localValue}
        min={min}
        max={max}
        step={step}
        onPointerDown={() => {
          dragging.current = true;
        }}
        onChange={e => {
          const v = parseFloat(e.target.value);
          setLocalValue(v);
          onChange(v);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onLostPointerCapture={() => {
          dragging.current = false;
        }}
        style={{ flex: 1 }}
      />
      {editing ? (
        <input
          ref={inputRef}
          type='text'
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
          autoFocus
          style={{
            width: 42,
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.9)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(100, 150, 255, 0.5)',
            borderRadius: 3,
            padding: '1px 4px',
            textAlign: 'right',
            outline: 'none',
          }}
        />
      ) : (
        <span
          onClick={() => {
            setEditText(
              localValue.toFixed(step >= 1 ? 0 : step >= 0.1 ? 1 : 2)
            );
            setEditing(true);
          }}
          title='Click to type a value'
          style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.5)',
            minWidth: 35,
            textAlign: 'right',
            cursor: 'text',
            padding: '1px 2px',
            borderRadius: 3,
            border: '1px solid transparent',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {localValue.toFixed(step >= 1 ? 0 : step >= 0.1 ? 1 : 2)}
        </span>
      )}
    </div>
  );
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '6px 8px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        color: 'white',
        fontSize: 13,
        outline: 'none',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type='color'
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: 32,
          height: 24,
          padding: 0,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      />
      <input
        type='text'
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '4px 6px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          color: 'white',
          fontSize: 11,
          fontFamily: 'monospace',
          outline: 'none',
        }}
      />
    </div>
  );
}

function ToggleInput({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: value
          ? 'rgba(100, 200, 100, 0.4)'
          : 'rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: value ? '#90EE90' : 'rgba(255, 255, 255, 0.4)',
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          transition: 'all 0.2s ease',
        }}
      />
    </button>
  );
}
