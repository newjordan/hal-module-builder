import React from 'react';
import PropertyRow from '../../../components/PropertyRow';
import PropertySection from '../../../components/PropertySection';
import type { Layer } from '../../../types/layer-types';
import { BLEND_MODE_OPTIONS, formatBlendMode } from '../utils/blend-mode';
import { clamp01, clampRange } from '../utils/validation';

export interface InnerGlowControlsProps {
  value: NonNullable<Layer['innerGlow']>;
  theme: 'frost_light' | 'frost_dark';
  onChange: (
    updates:
      | Partial<NonNullable<Layer['innerGlow']>>
      | ((
          prev: NonNullable<Layer['innerGlow']>
        ) => Partial<NonNullable<Layer['innerGlow']>>)
  ) => void;
}

const InnerGlowControls: React.FC<InnerGlowControlsProps> = ({
  value,
  theme,
  onChange,
}) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight
    ? 'frostlight-input-field'
    : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;

  const innerGlow = value;
  const opacityPct = Math.round(clamp01(innerGlow.opacity) * 100);

  return (
    <PropertySection
      title='Inner Glow'
      collapsible
      defaultExpanded={innerGlow.enabled}
      onToggle={enabled => onChange({ enabled })}
      theme={theme}
    >
      <PropertyRow label='Blend Mode'>
        <select
          value={innerGlow.blendMode}
          onChange={e => onChange({ blendMode: e.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!innerGlow.enabled}
        >
          {BLEND_MODE_OPTIONS.map(mode => (
            <option key={`inner-glow-${mode}`} value={mode}>
              {formatBlendMode(mode)}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label='Color'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='color'
            value={innerGlow.color}
            onChange={e => onChange({ color: e.target.value })}
            className={inputClass}
            style={{ width: '52px', height: '32px', padding: 0 }}
            disabled={!innerGlow.enabled}
          />
          <input
            type='text'
            value={innerGlow.color}
            onChange={e => onChange({ color: e.target.value })}
            className={inputClass}
            style={{ flex: 1 }}
            disabled={!innerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Opacity (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={opacityPct}
            onChange={e => {
              const raw = clampRange(
                Number(e.target.value) || 0,
                0,
                100,
                opacityPct
              );
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={opacityPct}
            onChange={e => {
              const raw = clampRange(
                Number(e.target.value) || 0,
                0,
                100,
                opacityPct
              );
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={sliderClass}
            disabled={!innerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Spread (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(innerGlow.spread)}
            onChange={e =>
              onChange({
                spread: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  100,
                  innerGlow.spread
                ),
              })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(innerGlow.spread)}
            onChange={e =>
              onChange({
                spread: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  100,
                  innerGlow.spread
                ),
              })
            }
            className={sliderClass}
            disabled={!innerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Size'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={500}
            value={Math.round(innerGlow.size)}
            onChange={e =>
              onChange({
                size: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  500,
                  innerGlow.size
                ),
              })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='500'
            step='1'
            value={Math.round(innerGlow.size)}
            onChange={e =>
              onChange({
                size: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  500,
                  innerGlow.size
                ),
              })
            }
            className={sliderClass}
            disabled={!innerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Range (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(innerGlow.range ?? 0)}
            onChange={e =>
              onChange({
                range: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  100,
                  innerGlow.range ?? 0
                ),
              })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(innerGlow.range ?? 0)}
            onChange={e =>
              onChange({
                range: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  100,
                  innerGlow.range ?? 0
                ),
              })
            }
            className={sliderClass}
            disabled={!innerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Jitter (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(innerGlow.jitter ?? 0)}
            onChange={e =>
              onChange({
                jitter: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  100,
                  innerGlow.jitter ?? 0
                ),
              })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(innerGlow.jitter ?? 0)}
            onChange={e =>
              onChange({
                jitter: clampRange(
                  Number(e.target.value) || 0,
                  0,
                  100,
                  innerGlow.jitter ?? 0
                ),
              })
            }
            className={sliderClass}
            disabled={!innerGlow.enabled}
          />
        </div>
      </PropertyRow>
    </PropertySection>
  );
};

export default InnerGlowControls;
