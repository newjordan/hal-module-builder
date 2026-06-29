import React from 'react';
import PropertyRow from '../../../components/PropertyRow';
import PropertySection from '../../../components/PropertySection';
import type { Layer } from '../../../types/layer-types';
import { clampAngle } from '../utils/validation';

export type GradientType = NonNullable<Layer['strokeGradient']>['type'];
export type GradientState = {
  type: GradientType;
  colors: string[];
  stops: number[]; // fraction [0..1]
  angle: number;
};

export interface StrokeControlsProps {
  theme: 'frost_light' | 'frost_dark';
  strokeType: Layer['strokeType'];
  strokeAlign: Layer['strokeAlign'];
  strokeWidth: number;
  strokeColor: string;
  strokeDasharray: string;
  gradientState: GradientState;
  onStrokeTypeChange: (value: Layer['strokeType']) => void;
  onStrokeAlignChange: (value: Layer['strokeAlign']) => void;
  onStrokeWidthChange: (w: number) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeDasharrayChange: (pattern: string) => void;
  onCommitGradient: (
    updates:
      | Partial<GradientState>
      | ((prev: GradientState) => Partial<GradientState>)
  ) => void;
}

const fractionToPercent = (value: number | undefined) =>
  Math.round((value ?? 0) * 100);
const percentToFraction = (value: number) =>
  Math.max(0, Math.min(1, value / 100));
const toNumber = (value: string, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const StrokeControls: React.FC<StrokeControlsProps> = ({
  theme,
  strokeType,
  strokeWidth,
  strokeColor,
  strokeDasharray,
  strokeAlign,
  gradientState,
  onStrokeTypeChange,
  onStrokeAlignChange,
  onStrokeWidthChange,
  onStrokeColorChange,
  onStrokeDasharrayChange,
  onCommitGradient,
}) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight
    ? 'frostlight-input-field'
    : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;
  const buttonClass = isLight ? 'frostlight-button' : 'frostdark-button';

  return (
    <PropertySection title='Stroke' collapsible defaultExpanded theme={theme}>
      <PropertyRow label='Stroke Type'>
        <select
          value={strokeType}
          onChange={e =>
            onStrokeTypeChange(e.target.value as Layer['strokeType'])
          }
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
        >
          <option value='none'>None</option>
          <option value='solid'>Solid</option>
          <option value='gradient'>Gradient</option>
        </select>
      </PropertyRow>

      {strokeType !== 'none' && (
        <PropertyRow label='Stroke Width'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type='number'
              min={0}
              max={50}
              value={strokeWidth}
              onChange={e =>
                onStrokeWidthChange(toNumber(e.target.value, strokeWidth))
              }
              className={inputClass}
              style={{ width: '72px' }}
            />
            <input
              type='range'
              min='0'
              max='50'
              step='1'
              value={strokeWidth}
              onChange={e =>
                onStrokeWidthChange(toNumber(e.target.value, strokeWidth))
              }
              className={sliderClass}
            />
          </div>
        </PropertyRow>
      )}

      {strokeType === 'solid' && (
        <>
          <PropertyRow label='Stroke Align'>
            <select
              className={inputClass}
              value={strokeAlign}
              onChange={e =>
                onStrokeAlignChange(e.target.value as Layer['strokeAlign'])
              }
              style={{ width: '100%', padding: '4px 6px' }}
            >
              <option value='center'>Center</option>
              <option value='inner'>Inner</option>
              <option value='outer'>Outer</option>
            </select>
          </PropertyRow>
          <PropertyRow label='Stroke Color'>
            <input
              type='color'
              value={strokeColor}
              onChange={e => onStrokeColorChange(e.target.value)}
              className={inputClass}
              style={{ width: '52px', height: '32px', padding: 0 }}
            />
          </PropertyRow>
          <PropertyRow label='Dash Pattern'>
            <input
              type='text'
              value={strokeDasharray}
              onChange={e => onStrokeDasharrayChange(e.target.value)}
              placeholder='e.g., 5,5 or 10,5,2,5'
              className={inputClass}
              style={{ width: '100%', padding: '4px 6px' }}
            />
          </PropertyRow>
        </>
      )}

      {strokeType === 'gradient' && (
        <>
          <PropertyRow label='Gradient Type'>
            <select
              value={gradientState.type}
              onChange={e =>
                onCommitGradient({ type: e.target.value as GradientType })
              }
              className={inputClass}
              style={{ width: '100%', padding: '4px 6px' }}
            >
              <option value='linear'>Linear</option>
              <option value='radial'>Radial</option>
              <option value='conic'>Conic</option>
            </select>
          </PropertyRow>

          {gradientState.colors.map((color, index) => (
            <PropertyRow
              key={`stroke-color-${index}`}
              label={`Color ${index + 1}`}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type='color'
                  value={color}
                  onChange={e =>
                    onCommitGradient(prev => ({
                      colors: prev.colors.map((existing, idx) =>
                        idx === index ? e.target.value : existing
                      ),
                    }))
                  }
                  className={inputClass}
                  style={{ width: '52px', height: '32px', padding: 0 }}
                />
                <input
                  type='number'
                  min={0}
                  max={100}
                  value={fractionToPercent(gradientState.stops[index])}
                  onChange={e =>
                    onCommitGradient(prev => ({
                      stops: prev.stops.map((existing, idx) =>
                        idx === index
                          ? percentToFraction(toNumber(e.target.value, 0))
                          : existing
                      ),
                    }))
                  }
                  className={inputClass}
                  style={{ width: '72px' }}
                />
                <input
                  type='range'
                  min='0'
                  max='100'
                  step='1'
                  value={fractionToPercent(gradientState.stops[index])}
                  onChange={e =>
                    onCommitGradient(prev => ({
                      stops: prev.stops.map((existing, idx) =>
                        idx === index
                          ? percentToFraction(toNumber(e.target.value, 0))
                          : existing
                      ),
                    }))
                  }
                  className={sliderClass}
                />
                {gradientState.colors.length > 2 && (
                  <button
                    type='button'
                    onClick={() =>
                      onCommitGradient(prev => ({
                        colors: prev.colors.filter((_, idx) => idx !== index),
                        stops: prev.stops.filter((_, idx) => idx !== index),
                      }))
                    }
                    className={buttonClass}
                  >
                    Remove
                  </button>
                )}
              </div>
            </PropertyRow>
          ))}

          <PropertyRow label='Add Stop'>
            <button
              type='button'
              onClick={() =>
                onCommitGradient(prev => ({
                  colors: [...prev.colors, '#ffffff'],
                }))
              }
              className={buttonClass}
            >
              Add Color Stop
            </button>
          </PropertyRow>

          {(gradientState.type === 'linear' ||
            gradientState.type === 'conic') && (
            <PropertyRow label='Angle'>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input
                  type='number'
                  min={0}
                  max={360}
                  value={gradientState.angle}
                  onChange={e =>
                    onCommitGradient({
                      angle: clampAngle(toNumber(e.target.value, 0), 0),
                    })
                  }
                  className={inputClass}
                  style={{ width: '72px' }}
                />
                <input
                  type='range'
                  min='0'
                  max='360'
                  step='1'
                  value={gradientState.angle}
                  onChange={e =>
                    onCommitGradient({
                      angle: clampAngle(toNumber(e.target.value, 0), 0),
                    })
                  }
                  className={sliderClass}
                />
              </div>
            </PropertyRow>
          )}
        </>
      )}
    </PropertySection>
  );
};

export default StrokeControls;
