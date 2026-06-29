/**
 * AudioReactivityPanel - Configure audio-reactive properties for layers
 */
import React from 'react';
import {
  Layer,
  AudioReactiveMapping,
  AudioFeature,
  ReactiveProperty,
} from '../../types/layer-types';

interface AudioReactivityPanelProps {
  theme: 'frost_light' | 'frost_dark';
  layer: Layer;
  layers: Layer[];
  onUpdate: (updates: Partial<Layer>) => void;
}

export const AudioReactivityPanel: React.FC<AudioReactivityPanelProps> = ({
  theme,
  layer,
  layers,
  onUpdate,
}) => {
  const isDark = theme === 'frost_dark';

  const labelClasses = `frost-block frost-text-sm frost-font-medium frost-mb-1 ${
    isDark ? 'frost-text-gray-300' : 'frost-text-gray-700'
  }`;

  const sectionClasses = `frost-mb-4 frost-p-3 frost-rounded ${
    isDark ? 'frostdark-standard-glass-card' : 'frostlight-standard-glass-card'
  }`;

  const inputClasses = `frost-w-full ${isDark ? 'frostdark-input-field' : 'frostlight-input-field'}`;

  // Get audio layers for source selection
  const audioLayers = layers.filter(
    l => l.type === 'audio' || l.type === 'equalizer'
  );

  const isEnabled = layer.audioReactive?.enabled ?? false;
  const mappings = layer.audioReactive?.mappings ?? [];

  const handleToggle = () => {
    const newReactive: Layer['audioReactive'] = {
      enabled: !isEnabled,
      mappings: mappings.length > 0 ? mappings : [getDefaultMapping()],
    };

    if (layer.audioReactive?.sourceLayerId) {
      newReactive.sourceLayerId = layer.audioReactive.sourceLayerId;
    }

    onUpdate({ audioReactive: newReactive });
  };

  const handleSourceChange = (sourceLayerId: string) => {
    onUpdate({
      audioReactive: {
        ...layer.audioReactive,
        enabled: isEnabled,
        ...(sourceLayerId ? { sourceLayerId } : {}),
        mappings,
      },
    });
  };

  const handleAddMapping = () => {
    const newMapping = getDefaultMapping();
    onUpdate({
      audioReactive: {
        ...layer.audioReactive,
        enabled: isEnabled,
        mappings: [...mappings, newMapping],
      },
    });
  };

  const handleRemoveMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onUpdate({
      audioReactive: {
        ...layer.audioReactive,
        enabled: isEnabled,
        mappings: newMappings,
      },
    });
  };

  const handleUpdateMapping = (
    index: number,
    updates: Partial<AudioReactiveMapping>
  ) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index]!, ...updates };
    onUpdate({
      audioReactive: {
        ...layer.audioReactive,
        enabled: isEnabled,
        mappings: newMappings,
      },
    });
  };

  // Quick preset configurations
  const quickPresets = [
    {
      name: '🎵 Pulse',
      description: 'Scale with volume',
      mappings: [
        {
          audioFeature: 'volume' as AudioFeature,
          targetProperty: 'scale' as ReactiveProperty,
          intensity: 0.5,
          smoothing: 0.7,
        },
      ],
    },
    {
      name: '💫 Bass Boom',
      description: 'Scale with bass',
      mappings: [
        {
          audioFeature: 'bass' as AudioFeature,
          targetProperty: 'scale' as ReactiveProperty,
          intensity: 0.8,
          smoothing: 0.6,
        },
      ],
    },
    {
      name: '✨ Beat Flash',
      description: 'Glow on beats',
      mappings: [
        {
          audioFeature: 'beat' as AudioFeature,
          targetProperty: 'glowIntensity' as ReactiveProperty,
          intensity: 1.0,
          smoothing: 0.85,
        },
      ],
    },
    {
      name: '🌈 Full Spectrum',
      description: 'Multiple properties',
      mappings: [
        {
          audioFeature: 'bass' as AudioFeature,
          targetProperty: 'scale' as ReactiveProperty,
          intensity: 0.4,
          smoothing: 0.7,
        },
        {
          audioFeature: 'treble' as AudioFeature,
          targetProperty: 'rotation' as ReactiveProperty,
          intensity: 0.3,
          smoothing: 0.8,
        },
        {
          audioFeature: 'volume' as AudioFeature,
          targetProperty: 'glowIntensity' as ReactiveProperty,
          intensity: 0.6,
          smoothing: 0.75,
        },
      ],
    },
  ];

  const handleApplyPreset = (preset: (typeof quickPresets)[0]) => {
    onUpdate({
      audioReactive: {
        enabled: true,
        mappings: preset.mappings,
      },
    });
  };

  return (
    <div className={sectionClasses}>
      <div className='frost-flex frost-items-center frost-justify-between frost-mb-3'>
        <div>
          <h4 className={labelClasses}>Audio Reactivity</h4>
          <p className='frost-text-xs frost-opacity-60 frost-mt-1'>
            Make shapes respond to audio
          </p>
        </div>
        <label className='frost-flex frost-items-center frost-gap-2 frost-cursor-pointer'>
          <input
            type='checkbox'
            checked={isEnabled}
            onChange={handleToggle}
            className={isDark ? 'frostdark-checkbox' : 'frostlight-checkbox'}
          />
          <span className='frost-text-sm frost-font-medium'>Enable</span>
        </label>
      </div>

      {isEnabled && (
        <>
          {/* Quick Presets */}
          <div className='frost-mb-4'>
            <label className={`${labelClasses} frost-mb-2`}>
              Quick Presets
            </label>
            <div className='frost-grid frost-grid-cols-2 frost-gap-2'>
              {quickPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleApplyPreset(preset)}
                  className={`frost-px-3 frost-py-2 frost-rounded-lg frost-text-left frost-transition-all ${
                    isDark
                      ? 'frostdark-button-raised hover:frost-brightness-110'
                      : 'frostlight-button-raised hover:frost-brightness-95'
                  }`}
                >
                  <div className='frost-font-medium frost-text-sm'>
                    {preset.name}
                  </div>
                  <div className='frost-text-xs frost-opacity-70 frost-mt-1'>
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Source Selection */}
          {audioLayers.length > 0 && (
            <div className='frost-mb-4'>
              <label className={labelClasses}>Audio Source</label>
              <select
                value={layer.audioReactive?.sourceLayerId || ''}
                onChange={e => handleSourceChange(e.target.value)}
                className={inputClasses}
              >
                <option value=''>Auto (Use active audio)</option>
                {audioLayers.map(audioLayer => (
                  <option key={audioLayer.id} value={audioLayer.id}>
                    {audioLayer.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mappings */}
          <div className='frost-space-y-3'>
            <div className='frost-flex frost-items-center frost-justify-between'>
              <label className={labelClasses}>Mappings</label>
              <button
                onClick={handleAddMapping}
                className={`frost-text-xs frost-px-3 frost-py-1.5 frost-rounded-lg frost-transition-all ${
                  isDark
                    ? 'frostdark-button-action'
                    : 'frostlight-button-action'
                }`}
              >
                + Add Mapping
              </button>
            </div>

            {mappings.length === 0 && (
              <p className='frost-text-sm frost-opacity-60 frost-text-center frost-py-4'>
                No mappings configured. Click &quot;Add Mapping&quot; to start.
              </p>
            )}

            {mappings.map((mapping, index) => (
              <div
                key={index}
                className={`frost-p-3 frost-rounded ${
                  isDark
                    ? 'frostdark-elevated-glass-card'
                    : 'frostlight-elevated-glass-card'
                }`}
              >
                <div className='frost-flex frost-items-center frost-justify-between frost-mb-2'>
                  <span className='frost-text-xs frost-font-semibold frost-opacity-75'>
                    Mapping {index + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveMapping(index)}
                    className={`frost-text-xs frost-px-2 frost-py-1 frost-rounded frost-transition-all ${
                      isDark
                        ? 'frost-text-red-400 hover:frost-bg-red-900/30'
                        : 'frost-text-red-600 hover:frost-bg-red-100'
                    }`}
                  >
                    Remove
                  </button>
                </div>

                {/* Audio Feature */}
                <div className='frost-mb-2'>
                  <label className={`${labelClasses} frost-text-xs`}>
                    Audio Feature
                  </label>
                  <select
                    value={mapping.audioFeature}
                    onChange={e =>
                      handleUpdateMapping(index, {
                        audioFeature: e.target.value as AudioFeature,
                      })
                    }
                    className={inputClasses}
                  >
                    <option value='volume'>Volume (Overall)</option>
                    <option value='bass'>Bass (20-250 Hz)</option>
                    <option value='mid'>Mid (250-2000 Hz)</option>
                    <option value='treble'>Treble (2000+ Hz)</option>
                    <option value='beat'>Beat Detection</option>
                  </select>
                </div>

                {/* Target Property */}
                <div className='frost-mb-2'>
                  <label className={`${labelClasses} frost-text-xs`}>
                    Affects Property
                  </label>
                  <select
                    value={mapping.targetProperty}
                    onChange={e =>
                      handleUpdateMapping(index, {
                        targetProperty: e.target.value as ReactiveProperty,
                      })
                    }
                    className={inputClasses}
                  >
                    <option value='scale'>Scale (Size)</option>
                    <option value='opacity'>Opacity</option>
                    <option value='rotation'>Rotation</option>
                    <option value='glowIntensity'>Glow Intensity</option>
                    <option value='offsetX'>Position X</option>
                    <option value='offsetY'>Position Y</option>
                  </select>
                </div>

                {/* Intensity Slider with editable value */}
                <div className='frost-mb-2'>
                  <div className='frost-flex frost-items-center frost-justify-between frost-mb-1'>
                    <label
                      className={`${labelClasses} frost-text-xs frost-mb-0`}
                    >
                      Intensity
                    </label>
                    <input
                      type='number'
                      value={mapping.intensity.toFixed(2)}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          handleUpdateMapping(index, { intensity: val });
                        }
                      }}
                      onBlur={e => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) {
                          handleUpdateMapping(index, { intensity: 0 });
                        } else if (val > 100) {
                          handleUpdateMapping(index, { intensity: 100 });
                        }
                      }}
                      min='0'
                      max='100'
                      step='0.1'
                      className={`frost-w-16 frost-text-xs frost-text-right ${inputClasses}`}
                    />
                  </div>
                  <input
                    type='range'
                    min='0'
                    max='10'
                    step='0.1'
                    value={Math.min(mapping.intensity, 10)}
                    onChange={e =>
                      handleUpdateMapping(index, {
                        intensity: parseFloat(e.target.value),
                      })
                    }
                    className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
                  />
                  <div className='frost-text-xs frost-opacity-60 frost-mt-1'>
                    Slider range: 0-10 (type for higher values)
                  </div>
                </div>

                {/* Smoothing Slider with editable value */}
                <div className='frost-mb-2'>
                  <div className='frost-flex frost-items-center frost-justify-between frost-mb-1'>
                    <label
                      className={`${labelClasses} frost-text-xs frost-mb-0`}
                    >
                      Smoothing
                    </label>
                    <input
                      type='number'
                      value={(mapping.smoothing ?? 0.7).toFixed(3)}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 0.95) {
                          handleUpdateMapping(index, { smoothing: val });
                        }
                      }}
                      onBlur={e => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) {
                          handleUpdateMapping(index, { smoothing: 0 });
                        } else if (val > 0.95) {
                          handleUpdateMapping(index, { smoothing: 0.95 });
                        }
                      }}
                      min='0'
                      max='0.95'
                      step='0.01'
                      className={`frost-w-16 frost-text-xs frost-text-right ${inputClasses}`}
                    />
                  </div>
                  <input
                    type='range'
                    min='0'
                    max='0.95'
                    step='0.01'
                    value={mapping.smoothing ?? 0.7}
                    onChange={e =>
                      handleUpdateMapping(index, {
                        smoothing: parseFloat(e.target.value),
                      })
                    }
                    className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
                  />
                </div>

                {/* Advanced: Min/Max Values */}
                <details className='frost-mt-2'>
                  <summary className='frost-text-xs frost-cursor-pointer frost-opacity-75'>
                    Advanced: Custom Range
                  </summary>
                  <div className='frost-grid frost-grid-cols-2 frost-gap-2 frost-mt-2'>
                    <div>
                      <label className={`${labelClasses} frost-text-xs`}>
                        Min Value
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={mapping.minValue ?? ''}
                        placeholder='Auto'
                        onChange={e => {
                          const updates: Partial<AudioReactiveMapping> = e
                            .target.value
                            ? { minValue: parseFloat(e.target.value) }
                            : {};
                          if (!e.target.value) {
                            const { minValue: _, ...rest } = mappings[index]!;
                            handleUpdateMapping(index, rest);
                          } else {
                            handleUpdateMapping(index, updates);
                          }
                        }}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={`${labelClasses} frost-text-xs`}>
                        Max Value
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={mapping.maxValue ?? ''}
                        placeholder='Auto'
                        onChange={e => {
                          const updates: Partial<AudioReactiveMapping> = e
                            .target.value
                            ? { maxValue: parseFloat(e.target.value) }
                            : {};
                          if (!e.target.value) {
                            const { maxValue: _, ...rest } = mappings[index]!;
                            handleUpdateMapping(index, rest);
                          } else {
                            handleUpdateMapping(index, updates);
                          }
                        }}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          {/* Help Text */}
          {mappings.length === 0 && (
            <div
              className={`frost-mt-4 frost-p-3 frost-text-xs frost-rounded frost-border ${
                isDark
                  ? 'frost-bg-blue-900/20 frost-border-blue-700 frost-text-blue-300'
                  : 'frost-bg-blue-50 frost-border-blue-200 frost-text-blue-700'
              }`}
            >
              <p className='frost-font-medium frost-mb-1'>💡 Getting Started</p>
              <p className='frost-opacity-80'>
                Click a <strong>Quick Preset</strong> above to instantly
                configure audio reactivity, or click{' '}
                <strong>+ Add Mapping</strong> to create custom behavior.
              </p>
            </div>
          )}

          {mappings.length > 0 && (
            <div
              className={`frost-mt-4 frost-p-2 frost-text-xs frost-opacity-60 frost-rounded ${
                isDark ? 'frost-bg-gray-800/50' : 'frost-bg-gray-100'
              }`}
            >
              <p>
                <strong>Tip:</strong> Click HAL to start audio, then watch your
                shape react! Adjust intensity and smoothing for best results.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Get default mapping configuration
 */
function getDefaultMapping(): AudioReactiveMapping {
  return {
    audioFeature: 'volume',
    targetProperty: 'scale',
    intensity: 0.5,
    smoothing: 0.7,
  };
}

export default AudioReactivityPanel;
