import React, { useCallback, useMemo } from 'react';
import { getAvailableShapes } from '../assets/shapes';
import EditableNumericValue from '../components/EditableNumericValue';
import { AnimationSection } from '../components/PropertyPanel/AnimationSection';
import AudioLayerSettings from '../components/PropertyPanel/AudioLayerSettings';
import { RadialTextSettingsPanel } from '../components/PropertyPanel/RadialTextSettingsPanel';
import { ReactiveEqualizerPanel } from '../components/PropertyPanel/ReactiveEqualizerPanel';
import { adaptSrpToLegacy } from '../components/PropertyPanel/utils/equalizerMapping';
import PropertyRow from '../components/PropertyRow';
import PropertySection from '../components/PropertySection';
import { Layer } from '../types/layer-types';

interface UseLayerPropertiesProps {
  layer: Layer;
  theme: string;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onShapeTypeChange?:
    | ((layerId: string, newShapeType: string) => void)
    | undefined;
  onAddLayers?: (layers: Layer[]) => void | undefined;
}

interface UseLayerPropertiesReturn {
  handleSliderChange: (property: keyof Layer, value: number) => void;
  handleColorChange: (property: keyof Layer, value: string) => void;
  renderPropertyPanel: () => React.ReactElement;
  availableShapes: Array<{ type: string; metadata: any }>;
  inputClass: string;
}

/**
 * Hook for managing layer properties and property panel rendering
 * Extracts property validation logic, update handlers, and state synchronization
 * from the LayerItem monolith (Lines 191-1288)
 *
 * @param props - Layer properties configuration
 * @returns Property management functions and rendered panel
 */
export const useLayerProperties = ({
  layer,
  theme,
  updateLayer,
  onShapeTypeChange,
  onAddLayers,
}: UseLayerPropertiesProps): UseLayerPropertiesReturn => {
  const handleSliderChange = useCallback(
    (property: keyof Layer, value: number) => {
      updateLayer(layer.id, { [property]: value });
    },
    [layer.id, updateLayer]
  );

  const handleColorChange = useCallback(
    (property: keyof Layer, value: string) => {
      updateLayer(layer.id, { [property]: value });
    },
    [layer.id, updateLayer]
  );

  // Get available shapes from the shape library (extracted from LayerItem lines 205-212)
  const availableShapes = useMemo(() => {
    try {
      return getAvailableShapes();
    } catch (error) {
      console.error('Error getting available shapes:', error);
      return [];
    }
  }, []);

  // Input class based on theme (extracted from LayerItem lines 200-203)
  const inputClass = useMemo(() => {
    return theme === 'frost_light'
      ? 'frostlight-input-field'
      : 'frostdark-input-field';
  }, [theme]);

  // Helper to create labels with editable numeric values
  const createEditableLabel = useCallback(
    (
      label: string,
      value: number,
      property: keyof Layer | string,
      suffix: string = '',
      min: number = -Infinity,
      max: number = Infinity,
      precision: number = 0,
      converter?: (displayValue: number) => number
    ) => {
      const handleChange = (newValue: number) => {
        const actualValue = converter ? converter(newValue) : newValue;

        // Handle nested properties like 'equalizerSettings.barCount'
        if (typeof property === 'string' && property.includes('.')) {
          const parts = property.split('.');
          const parentKey = parts[0];
          const childKey = parts[1] as string;
          if (parentKey === 'equalizerSettings') {
            updateLayer(layer.id, {
              equalizerSettings: {
                ...(layer.equalizerSettings || {}),
                [childKey]: actualValue,
              },
            });
          }
        } else {
          handleSliderChange(property as keyof Layer, actualValue);
        }
      };

      return (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: 'auto',
            minHeight: 'auto',
          }}
        >
          {label}:
          <EditableNumericValue
            value={value}
            onChange={handleChange}
            suffix={suffix}
            min={min}
            max={max}
            precision={precision}
            theme={theme === 'frost_light' ? 'frost_light' : 'frost_dark'}
            style={{
              fontWeight: 'bold',
              flex: 'none',
              alignSelf: 'center',
              height: 'auto',
              minHeight: 'auto',
            }}
          />
        </span>
      );
    },
    [handleSliderChange, theme, updateLayer, layer.id, layer.equalizerSettings]
  );

  // Render property panel (extracted from LayerItem lines 228-1288)
  const renderPropertyPanel = useCallback(() => {
    // Debug logging
    console.log('🔍 useLayerProperties rendering for layer type:', layer.type);
    console.log(
      '🔍 Should show old sections?',
      layer.type !== 'audio' && layer.type !== 'equalizer'
    );

    return (
      <div className='layer-properties-container' style={{ fontSize: '13px' }}>
        <>
          {/* Hide Essential/Style/Position Properties for equalizer - new panel handles everything */}
          {layer.type !== 'audio' && layer.type !== 'equalizer' && (
            <>
              <PropertySection
                title='Essential Properties'
                defaultExpanded={true}
                collapsible={true}
                theme={theme}
              >
                <PropertyRow
                  label={createEditableLabel(
                    'Opacity',
                    layer.opacity * 100,
                    'opacity',
                    '%',
                    0,
                    100,
                    0,
                    val => val / 100
                  )}
                >
                  <input
                    type='range'
                    min='0'
                    max='1'
                    step='0.01'
                    value={layer.opacity}
                    onChange={e =>
                      handleSliderChange('opacity', parseFloat(e.target.value))
                    }
                    className={`${inputClass} property-slider`}
                    style={{ width: '100%' }}
                  />
                </PropertyRow>

                <PropertyRow
                  label={createEditableLabel(
                    'Scale',
                    layer.scale * 100,
                    'scale',
                    '%',
                    10,
                    300,
                    0,
                    val => val / 100
                  )}
                >
                  <input
                    type='range'
                    min='0.1'
                    max='3'
                    step='0.01'
                    value={layer.scale}
                    onChange={e =>
                      handleSliderChange('scale', parseFloat(e.target.value))
                    }
                    className={`${inputClass} property-slider`}
                    style={{ width: '100%' }}
                  />
                </PropertyRow>

                <PropertyRow
                  label={createEditableLabel(
                    'Rotation',
                    layer.rotation,
                    'rotation',
                    '°',
                    0,
                    360
                  )}
                >
                  <input
                    type='range'
                    min='0'
                    max='360'
                    step='1'
                    value={layer.rotation}
                    onChange={e =>
                      handleSliderChange('rotation', parseInt(e.target.value))
                    }
                    className={`${inputClass} property-slider`}
                    style={{ width: '100%' }}
                  />
                </PropertyRow>
              </PropertySection>

              <PropertySection
                title='Style Properties'
                defaultExpanded={true}
                collapsible={true}
                theme={theme}
              >
                <PropertyRow label='Blend Mode'>
                  <select
                    value={layer.blendMode}
                    onChange={e =>
                      updateLayer(layer.id, { blendMode: e.target.value })
                    }
                    className={inputClass}
                    style={{ width: '100%', padding: '4px 6px' }}
                  >
                    <option value='normal'>Normal</option>
                    <option value='multiply'>Multiply</option>
                    <option value='screen'>Screen</option>
                    <option value='overlay'>Overlay</option>
                    <option value='soft-light'>Soft Light</option>
                    <option value='hard-light'>Hard Light</option>
                    <option value='color-dodge'>Color Dodge</option>
                    <option value='color-burn'>Color Burn</option>
                    <option value='darken'>Darken</option>
                    <option value='lighten'>Lighten</option>
                    <option value='difference'>Difference</option>
                    <option value='exclusion'>Exclusion</option>
                  </select>
                </PropertyRow>

                {layer.type === 'shape' && (
                  <PropertyRow label='Color'>
                    <input
                      type='color'
                      value={layer.color || '#ffffff'}
                      onChange={e => handleColorChange('color', e.target.value)}
                      className={inputClass}
                      style={{ width: '100%', height: '32px' }}
                    />
                  </PropertyRow>
                )}
              </PropertySection>

              <PropertySection
                title='Position Properties'
                defaultExpanded={true}
                collapsible={true}
                theme={theme}
              >
                <PropertyRow
                  label={createEditableLabel(
                    'Offset X',
                    layer.offsetX,
                    'offsetX',
                    'px',
                    -500,
                    500
                  )}
                >
                  <input
                    type='range'
                    min='-500'
                    max='500'
                    step='1'
                    value={layer.offsetX}
                    onChange={e =>
                      handleSliderChange('offsetX', parseInt(e.target.value))
                    }
                    className={`${inputClass} property-slider`}
                    style={{ width: '100%' }}
                  />
                </PropertyRow>

                <PropertyRow
                  label={createEditableLabel(
                    'Offset Y',
                    layer.offsetY,
                    'offsetY',
                    'px',
                    -500,
                    500
                  )}
                >
                  <input
                    type='range'
                    min='-500'
                    max='500'
                    step='1'
                    value={layer.offsetY}
                    onChange={e =>
                      handleSliderChange('offsetY', parseInt(e.target.value))
                    }
                    className={`${inputClass} property-slider`}
                    style={{ width: '100%' }}
                  />
                </PropertyRow>
              </PropertySection>
            </>
          )}

          {/* Shape Specific Controls - extracted from lines 404-787 */}
          {(layer.type === 'shape' ||
            !!layer.shapeType ||
            !!layer.shapeSpecific) && (
            <PropertySection
              title='Shape Settings'
              collapsible={true}
              defaultExpanded={true}
              theme={theme}
            >
              <PropertyRow label='Shape Type'>
                <select
                  value={
                    layer.shapeType ||
                    (availableShapes.length > 0
                      ? (availableShapes[0]?.type ?? 'circle')
                      : 'circle')
                  }
                  onChange={e => {
                    if (onShapeTypeChange) {
                      onShapeTypeChange(layer.id, e.target.value);
                    } else {
                      updateLayer(layer.id, {
                        shapeType: e.target.value as any,
                      });
                    }
                  }}
                  className={inputClass}
                  style={{ width: '100%', padding: '4px 6px' }}
                >
                  {availableShapes.length > 0 ? (
                    availableShapes.map(shape => (
                      <option key={shape.type} value={shape.type}>
                        {shape.metadata.icon} {shape.metadata.displayName}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value='circle'>⭕ Circle</option>
                      <option value='rectangle'>⬛ Rectangle</option>
                      <option value='triangle'>🔺 Triangle</option>
                      <option value='polygon'>⬢ Polygon</option>
                      <option value='star'>⭐ Star</option>
                    </>
                  )}
                </select>
              </PropertyRow>
            </PropertySection>
          )}

          {/* Audio Specific Controls */}
          {layer.type === 'audio' && (
            <AudioLayerSettings
              layer={layer}
              updateLayer={updateLayer}
              theme={theme === 'frost_light' ? 'frost_light' : 'frost_dark'}
            />
          )}

          {/* Equalizer Specific Controls - SRP Panel Only */}
          {layer.type === 'equalizer' && (
            <ReactiveEqualizerPanel
              equalizerSettings={
                layer.equalizerSettings || ({ barStyle: 'bar' } as any)
              }
              onUpdate={srpSettings => {
                const adapted = adaptSrpToLegacy({
                  ...(layer.equalizerSettings || {}),
                  ...srpSettings,
                }) as any;
                try {
                  console.debug(
                    '[Sync][Panel->Layer] equalizerSettings update',
                    {
                      incomingInvert: (srpSettings as any)?.invert,
                      adaptedInvert: adapted?.invert,
                      adaptedInvertDirection: adapted?.invertDirection,
                    }
                  );
                } catch {}
                updateLayer(layer.id, {
                  equalizerSettings: adapted,
                });
              }}
              theme={theme === 'frost_light' ? 'frost_light' : 'frost_dark'}
            />
          )}
          {/* Radial Text Specific Controls */}
          {layer.type === 'radialText' && (
            <RadialTextSettingsPanel
              theme={theme === 'frost_light' ? 'frost_light' : 'frost_dark'}
              layer={layer}
              updateLayer={updateLayer}
            />
          )}

          {/* Animation Section - Available for all layer types */}
          {onAddLayers && (
            <PropertySection
              title='Animation'
              defaultExpanded={false}
              collapsible={true}
              theme={theme}
            >
              <AnimationSection
                layer={layer}
                theme={theme === 'frost_light' ? 'frost_light' : 'frost_dark'}
                onUpdateLayer={updateLayer}
                onAddLayers={onAddLayers}
              />
            </PropertySection>
          )}
        </>
      </div>
    );
  }, [
    layer,
    theme,
    inputClass,
    availableShapes,
    handleSliderChange,
    handleColorChange,
    updateLayer,
    onShapeTypeChange,
    onAddLayers,
  ]);

  return {
    handleSliderChange,
    handleColorChange,
    renderPropertyPanel,
    availableShapes,
    inputClass,
  };
};
