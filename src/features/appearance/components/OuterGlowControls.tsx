import React from 'react';
import type { Layer } from '../../../types/layer-types';
import PropertySection from '../../../components/PropertySection';
import PropertyRow from '../../../components/PropertyRow';
import { BLEND_MODE_OPTIONS, formatBlendMode } from '../utils/blend-mode';
import { clamp01, clampRange } from '../utils/validation';

export interface OuterGlowControlsProps {
  value: NonNullable<Layer['outerGlow']>;
  theme: 'frost_light' | 'frost_dark';
  onChange: (
    updates:
      | Partial<NonNullable<Layer['outerGlow']>>
      | ((prev: NonNullable<Layer['outerGlow']>) => Partial<NonNullable<Layer['outerGlow']>>)
  ) => void;
}

const OuterGlowControls: React.FC<OuterGlowControlsProps> = ({ value, theme, onChange }) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight ? 'frostlight-input-field' : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;

  const outerGlow = value;
  const outerGlowOpacity = Math.round(clamp01(outerGlow.opacity) * 100);

  return (
    <PropertySection
      title='Outer Glow'
      collapsible
      defaultExpanded={outerGlow.enabled}
      onToggle={enabled => onChange({ enabled })}
      theme={theme}
    >

      <PropertyRow label='Blend Mode'>
        <select
          value={outerGlow.blendMode}
          onChange={event => onChange({ blendMode: event.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!outerGlow.enabled}
        >
          {BLEND_MODE_OPTIONS.map(mode => (
            <option key={`outer-glow-${mode}`} value={mode}>
              {formatBlendMode(mode)}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label='Color'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='color'
            value={outerGlow.color}
            onChange={event => onChange({ color: event.target.value })}
            className={inputClass}
            style={{ width: '52px', height: '32px', padding: 0 }}
            disabled={!outerGlow.enabled}
          />
          <input
            type='text'
            value={outerGlow.color}
            onChange={event => onChange({ color: event.target.value })}
            className={inputClass}
            style={{ flex: 1 }}
            disabled={!outerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Opacity (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={outerGlowOpacity}
            onChange={event => {
              const raw = clampRange(Number(event.target.value) || 0, 0, 100, outerGlowOpacity);
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!outerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={outerGlowOpacity}
            onChange={event => {
              const raw = clampRange(Number(event.target.value) || 0, 0, 100, outerGlowOpacity);
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={sliderClass}
            disabled={!outerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Spread (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(outerGlow.spread)}
            onChange={event =>
              onChange({ spread: clampRange(Number(event.target.value) || 0, 0, 100, outerGlow.spread) })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!outerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(outerGlow.spread)}
            onChange={event =>
              onChange({ spread: clampRange(Number(event.target.value) || 0, 0, 100, outerGlow.spread) })
            }
            className={sliderClass}
            disabled={!outerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Size'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={500}
            value={Math.round(outerGlow.size)}
            onChange={event =>
              onChange({ size: clampRange(Number(event.target.value) || 0, 0, 500, outerGlow.size) })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!outerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='500'
            step='1'
            value={Math.round(outerGlow.size)}
            onChange={event =>
              onChange({ size: clampRange(Number(event.target.value) || 0, 0, 500, outerGlow.size) })
            }
            className={sliderClass}
            disabled={!outerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Range (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(outerGlow.range ?? 0)}
            onChange={event =>
              onChange({ range: clampRange(Number(event.target.value) || 0, 0, 100, outerGlow.range ?? 0) })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!outerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(outerGlow.range ?? 0)}
            onChange={event =>
              onChange({ range: clampRange(Number(event.target.value) || 0, 0, 100, outerGlow.range ?? 0) })
            }
            className={sliderClass}
            disabled={!outerGlow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Jitter (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(outerGlow.jitter ?? 0)}
            onChange={event =>
              onChange({ jitter: clampRange(Number(event.target.value) || 0, 0, 100, outerGlow.jitter ?? 0) })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!outerGlow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(outerGlow.jitter ?? 0)}
            onChange={event =>
              onChange({ jitter: clampRange(Number(event.target.value) || 0, 0, 100, outerGlow.jitter ?? 0) })
            }
            className={sliderClass}
            disabled={!outerGlow.enabled}
          />
        </div>
      </PropertyRow>
    </PropertySection>
  );
};

export default OuterGlowControls;

