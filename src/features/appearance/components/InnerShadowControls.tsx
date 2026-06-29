import React from 'react';
import type { Layer } from '../../../types/layer-types';
import PropertySection from '../../../components/PropertySection';
import PropertyRow from '../../../components/PropertyRow';
import { BLEND_MODE_OPTIONS, formatBlendMode } from '../utils/blend-mode';
import { clamp01, clampAngle, clampRange } from '../utils/validation';

export interface InnerShadowControlsProps {
  value: NonNullable<Layer['innerShadow']>;
  globalLight: NonNullable<Layer['globalLight']>;
  theme: 'frost_light' | 'frost_dark';
  onChange: (
    updates:
      | Partial<NonNullable<Layer['innerShadow']>>
      | ((prev: NonNullable<Layer['innerShadow']>) => Partial<NonNullable<Layer['innerShadow']>>)
  ) => void;
  onChangeGlobalLight: (updates: Partial<NonNullable<Layer['globalLight']>>) => void;
}

const InnerShadowControls: React.FC<InnerShadowControlsProps> = ({
  value,
  globalLight,
  theme,
  onChange,
  onChangeGlobalLight,
}) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight ? 'frostlight-input-field' : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;

  const innerShadow = value;
  const innerShadowAngle = innerShadow.useGlobalLight ? globalLight.angle : innerShadow.angle;
  const innerShadowOpacity = Math.round(clamp01(innerShadow.opacity) * 100);

  return (
    <PropertySection
      title='Inner Shadow'
      collapsible
      defaultExpanded={innerShadow.enabled}
      onToggle={enabled => onChange({ enabled })}
      theme={theme}
    >

      <PropertyRow label='Blend Mode'>
        <select
          value={innerShadow.blendMode}
          onChange={event => onChange({ blendMode: event.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!innerShadow.enabled}
        >
          {BLEND_MODE_OPTIONS.map(mode => (
            <option key={`inner-shadow-${mode}`} value={mode}>
              {formatBlendMode(mode)}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label='Color'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='color'
            value={innerShadow.color}
            onChange={event => onChange({ color: event.target.value })}
            className={inputClass}
            style={{ width: '52px', height: '32px', padding: 0 }}
            disabled={!innerShadow.enabled}
          />
          <input
            type='text'
            value={innerShadow.color}
            onChange={event => onChange({ color: event.target.value })}
            className={inputClass}
            style={{ flex: 1 }}
            disabled={!innerShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Opacity (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={innerShadowOpacity}
            onChange={event => {
              const raw = clampRange(Number(event.target.value) || 0, 0, 100, innerShadowOpacity);
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={innerShadowOpacity}
            onChange={event => {
              const raw = clampRange(Number(event.target.value) || 0, 0, 100, innerShadowOpacity);
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={sliderClass}
            disabled={!innerShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Angle'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={360}
            value={innerShadowAngle}
            onChange={event => {
              const raw = clampAngle(Number(event.target.value) || 0, innerShadowAngle);
              onChange({ angle: raw });
              if (innerShadow.useGlobalLight) onChangeGlobalLight({ angle: raw });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='360'
            step='1'
            value={innerShadowAngle}
            onChange={event => {
              const raw = clampAngle(Number(event.target.value) || 0, innerShadowAngle);
              onChange({ angle: raw });
              if (innerShadow.useGlobalLight) onChangeGlobalLight({ angle: raw });
            }}
            className={sliderClass}
            disabled={!innerShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Distance'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={500}
            value={Math.round(innerShadow.distance)}
            onChange={event =>
              onChange({ distance: clampRange(Number(event.target.value) || 0, 0, 500, innerShadow.distance) })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='500'
            step='1'
            value={Math.round(innerShadow.distance)}
            onChange={event =>
              onChange({ distance: clampRange(Number(event.target.value) || 0, 0, 500, innerShadow.distance) })
            }
            className={sliderClass}
            disabled={!innerShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Spread (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(innerShadow.spread)}
            onChange={event =>
              onChange({ spread: clampRange(Number(event.target.value) || 0, 0, 100, innerShadow.spread) })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(innerShadow.spread)}
            onChange={event =>
              onChange({ spread: clampRange(Number(event.target.value) || 0, 0, 100, innerShadow.spread) })
            }
            className={sliderClass}
            disabled={!innerShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Size'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={500}
            value={Math.round(innerShadow.size)}
            onChange={event =>
              onChange({ size: clampRange(Number(event.target.value) || 0, 0, 500, innerShadow.size) })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!innerShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='500'
            step='1'
            value={Math.round(innerShadow.size)}
            onChange={event =>
              onChange({ size: clampRange(Number(event.target.value) || 0, 0, 500, innerShadow.size) })
            }
            className={sliderClass}
            disabled={!innerShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Use Global Light'>
        <input
          type='checkbox'
          checked={innerShadow.useGlobalLight ?? false}
          onChange={event => {
            const checked = event.target.checked;
            onChange({
              useGlobalLight: checked,
              angle: checked ? globalLight.angle : innerShadow.angle,
            });
          }}
          className={inputClass}
          disabled={!innerShadow.enabled}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default InnerShadowControls;

