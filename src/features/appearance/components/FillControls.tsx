import React from 'react';
import PropertySection from '../../../components/PropertySection';
import PropertyRow from '../../../components/PropertyRow';
import type { Layer } from '../../../types/layer-types';
import { clampAngle } from '../utils/validation';

export type GradientType = NonNullable<Layer['fillGradient']>['type'];
export type SpreadMethod = 'pad' | 'reflect' | 'repeat';
export type GradientState = {
  type: GradientType;
  colors: string[];
  stops: number[]; // fraction [0..1]
  angle: number;
  centerX?: number; // fraction
  centerY?: number; // fraction
  spreadMethod?: SpreadMethod;
};

export interface FillControlsProps {
  theme: 'frost_light' | 'frost_dark';
  fillType: Layer['fillType'];
  baseColor: string; // layer.fillColor || layer.color
  gradientState: GradientState;
  onFillTypeChange: (value: Layer['fillType']) => void;
  onFillColorChange: (color: string) => void;
  onCommitGradient: (
    updates: Partial<GradientState> | ((prev: GradientState) => Partial<GradientState>)
  ) => void;
}

const fractionToPercent = (value: number | undefined) => Math.round((value ?? 0) * 100);
const percentToFraction = (value: number) => Math.max(0, Math.min(1, value / 100));
const toNumber = (value: string, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Build a CSS gradient string for the live preview bar */
function buildPreviewCSS(g: GradientState): string {
  const colorStops = g.colors
    .map((c, i) => `${c} ${(g.stops[i] ?? 0) * 100}%`)
    .join(', ');
  switch (g.type) {
    case 'radial': {
      const cx = fractionToPercent(g.centerX ?? 0.5);
      const cy = fractionToPercent(g.centerY ?? 0.5);
      return `radial-gradient(circle at ${cx}% ${cy}%, ${colorStops})`;
    }
    case 'conic':
      return `conic-gradient(from ${g.angle}deg, ${colorStops})`;
    case 'linear':
    default:
      return `linear-gradient(${g.angle}deg, ${colorStops})`;
  }
}

const FillControls: React.FC<FillControlsProps> = ({
  theme,
  fillType,
  baseColor,
  gradientState,
  onFillTypeChange,
  onFillColorChange,
  onCommitGradient,
}) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight ? 'frostlight-input-field' : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;
  const buttonClass = isLight ? 'frostlight-button' : 'frostdark-button';

  return (
    <PropertySection title='Fill' collapsible defaultExpanded theme={theme}>
      <PropertyRow label='Fill Type'>
        <select
          value={fillType}
          onChange={e => onFillTypeChange(e.target.value as Layer['fillType'])}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
        >
          <option value='none'>None</option>
          <option value='solid'>Solid</option>
          <option value='gradient'>Gradient</option>
        </select>
      </PropertyRow>

      {fillType === 'solid' && (
        <PropertyRow label='Fill Color'>
          <input
            type='color'
            value={baseColor}
            onChange={e => onFillColorChange(e.target.value)}
            className={inputClass}
            style={{ width: '52px', height: '32px', padding: 0 }}
          />
        </PropertyRow>
      )}

      {fillType === 'gradient' && (
        <>
          {/* Live gradient preview */}
          <PropertyRow label='Preview'>
            <div
              style={{
                width: '100%',
                height: 32,
                borderRadius: 6,
                background: buildPreviewCSS(gradientState),
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </PropertyRow>

          <PropertyRow label='Gradient Type'>
            <select
              value={gradientState.type}
              onChange={e => onCommitGradient({ type: e.target.value as GradientType })}
              className={inputClass}
              style={{ width: '100%', padding: '4px 6px' }}
            >
              <option value='linear'>Linear</option>
              <option value='radial'>Radial</option>
              <option value='conic'>Conic</option>
            </select>
          </PropertyRow>

          <PropertyRow label='Edge Mode'>
            <select
              value={gradientState.spreadMethod || 'pad'}
              onChange={e => onCommitGradient({ spreadMethod: e.target.value as SpreadMethod })}
              className={inputClass}
              style={{ width: '100%', padding: '4px 6px' }}
            >
              <option value='pad'>Pad (smooth edge)</option>
              <option value='reflect'>Reflect (mirror)</option>
              <option value='repeat'>Repeat (tile)</option>
            </select>
          </PropertyRow>

          {gradientState.colors.map((color, index) => (
            <PropertyRow key={`fill-color-${index}`} label={`Color ${index + 1}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type='color'
                  value={color}
                  onChange={e =>
                    onCommitGradient(prev => ({
                      colors: prev.colors.map((existing, idx) => (idx === index ? e.target.value : existing)),
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
                      stops: prev.stops.map((existing, idx) => (idx === index ? percentToFraction(toNumber(e.target.value, 0)) : existing)),
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
                      stops: prev.stops.map((existing, idx) => (idx === index ? percentToFraction(toNumber(e.target.value, 0)) : existing)),
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
                onCommitGradient(prev => {
                  // Auto-calculate stop position: midpoint of last two stops, or append at end
                  const lastStop = prev.stops[prev.stops.length - 1] ?? 0;
                  const secondLastStop = prev.stops[prev.stops.length - 2] ?? 0;
                  const newStop = Math.min(1, lastStop < 1 ? lastStop + (1 - lastStop) / 2 : (secondLastStop + lastStop) / 2);
                  // Interpolate color between last two
                  const lastColor = prev.colors[prev.colors.length - 1] || '#ffffff';
                  return {
                    colors: [...prev.colors, lastColor],
                    stops: [...prev.stops, newStop],
                  };
                })
              }
              className={buttonClass}
            >
              Add Color Stop
            </button>
          </PropertyRow>

          {(gradientState.type === 'linear' || gradientState.type === 'conic') && (
            <PropertyRow label='Angle'>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type='number'
                  min={0}
                  max={360}
                  value={gradientState.angle}
                  onChange={e => onCommitGradient({ angle: clampAngle(toNumber(e.target.value, 0), 0) })}
                  className={inputClass}
                  style={{ width: '72px' }}
                />
                <input
                  type='range'
                  min='0'
                  max='360'
                  step='1'
                  value={gradientState.angle}
                  onChange={e => onCommitGradient({ angle: clampAngle(toNumber(e.target.value, 0), 0) })}
                  className={sliderClass}
                />
              </div>
            </PropertyRow>
          )}

          {gradientState.type === 'radial' && (
            <>
              <PropertyRow label='Center X'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type='number'
                    min={0}
                    max={100}
                    value={fractionToPercent(gradientState.centerX)}
                    onChange={e => onCommitGradient({ centerX: percentToFraction(toNumber(e.target.value, 50)) })}
                    className={inputClass}
                    style={{ width: '72px' }}
                  />
                  <input
                    type='range'
                    min='0'
                    max='100'
                    step='1'
                    value={fractionToPercent(gradientState.centerX)}
                    onChange={e => onCommitGradient({ centerX: percentToFraction(toNumber(e.target.value, 50)) })}
                    className={sliderClass}
                  />
                </div>
              </PropertyRow>
              <PropertyRow label='Center Y'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type='number'
                    min={0}
                    max={100}
                    value={fractionToPercent(gradientState.centerY)}
                    onChange={e => onCommitGradient({ centerY: percentToFraction(toNumber(e.target.value, 50)) })}
                    className={inputClass}
                    style={{ width: '72px' }}
                  />
                  <input
                    type='range'
                    min='0'
                    max='100'
                    step='1'
                    value={fractionToPercent(gradientState.centerY)}
                    onChange={e => onCommitGradient({ centerY: percentToFraction(toNumber(e.target.value, 50)) })}
                    className={sliderClass}
                  />
                </div>
              </PropertyRow>
            </>
          )}
        </>
      )}
    </PropertySection>
  );
};

export default FillControls;
