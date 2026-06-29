import React from 'react';
import type { Layer } from '../../../types/layer-types';
import PropertySection from '../../../components/PropertySection';
import PropertyRow from '../../../components/PropertyRow';
import { BLEND_MODE_OPTIONS, formatBlendMode } from '../utils/blend-mode';
import { clamp01, clampAngle, clampRange } from '../utils/validation';

export interface DropShadowControlsProps {
  value: NonNullable<Layer['dropShadow']>;
  globalLight: NonNullable<Layer['globalLight']>;
  theme: 'frost_light' | 'frost_dark';
  onChange: (
    updates:
      | Partial<NonNullable<Layer['dropShadow']>>
      | ((prev: NonNullable<Layer['dropShadow']>) => Partial<NonNullable<Layer['dropShadow']>>)
  ) => void;
  onChangeGlobalLight: (updates: Partial<NonNullable<Layer['globalLight']>>) => void;
}

const DropShadowControls: React.FC<DropShadowControlsProps> = ({
  value,
  globalLight,
  theme,
  onChange,
  onChangeGlobalLight,
}) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight ? 'frostlight-input-field' : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;

  const dropShadow = value;
  const dropShadowAngle = dropShadow.useGlobalLight ? globalLight.angle : dropShadow.angle;
  const dropShadowOpacity = Math.round(clamp01(dropShadow.opacity) * 100);

  return (
    <PropertySection
      title='Drop Shadow'
      collapsible
      defaultExpanded={dropShadow.enabled}
      onToggle={enabled => onChange({ enabled })}
      theme={theme}
    >

      <PropertyRow label='Blend Mode'>
        <select
          value={dropShadow.blendMode}
          onChange={event => onChange({ blendMode: event.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!dropShadow.enabled}
        >
          {BLEND_MODE_OPTIONS.map(mode => (
            <option key={`drop-shadow-${mode}`} value={mode}>
              {formatBlendMode(mode)}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label='Color'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='color'
            value={dropShadow.color}
            onChange={event => onChange({ color: event.target.value })}
            className={inputClass}
            style={{ width: '52px', height: '32px', padding: 0 }}
            disabled={!dropShadow.enabled}
          />
          <input
            type='text'
            value={dropShadow.color}
            onChange={event => onChange({ color: event.target.value })}
            className={inputClass}
            style={{ flex: 1 }}
            disabled={!dropShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Opacity (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={dropShadowOpacity}
            onChange={event => {
              const raw = clampRange(Number(event.target.value) || 0, 0, 100, dropShadowOpacity);
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!dropShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={dropShadowOpacity}
            onChange={event => {
              const raw = clampRange(Number(event.target.value) || 0, 0, 100, dropShadowOpacity);
              onChange({ opacity: clamp01(raw / 100) });
            }}
            className={sliderClass}
            disabled={!dropShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Angle'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={360}
            value={dropShadowAngle}
            onChange={event => {
              const raw = clampAngle(Number(event.target.value) || 0, dropShadowAngle);
              onChange({ angle: raw });
              if (dropShadow.useGlobalLight) onChangeGlobalLight({ angle: raw });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!dropShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='360'
            step='1'
            value={dropShadowAngle}
            onChange={event => {
              const raw = clampAngle(Number(event.target.value) || 0, dropShadowAngle);
              onChange({ angle: raw });
              if (dropShadow.useGlobalLight) onChangeGlobalLight({ angle: raw });
            }}
            className={sliderClass}
            disabled={!dropShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Distance'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={500}
            value={Math.round(dropShadow.distance)}
            onChange={event =>
              onChange({
                distance: clampRange(Number(event.target.value) || 0, 0, 500, dropShadow.distance),
              })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!dropShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='500'
            step='1'
            value={Math.round(dropShadow.distance)}
            onChange={event =>
              onChange({
                distance: clampRange(Number(event.target.value) || 0, 0, 500, dropShadow.distance),
              })
            }
            className={sliderClass}
            disabled={!dropShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Spread (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(dropShadow.spread)}
            onChange={event =>
              onChange({
                spread: clampRange(Number(event.target.value) || 0, 0, 100, dropShadow.spread),
              })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!dropShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(dropShadow.spread)}
            onChange={event =>
              onChange({
                spread: clampRange(Number(event.target.value) || 0, 0, 100, dropShadow.spread),
              })
            }
            className={sliderClass}
            disabled={!dropShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Size'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={500}
            value={Math.round(dropShadow.size)}
            onChange={event =>
              onChange({
                size: clampRange(Number(event.target.value) || 0, 0, 500, dropShadow.size),
              })
            }
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!dropShadow.enabled}
          />
          <input
            type='range'
            min='0'
            max='500'
            step='1'
            value={Math.round(dropShadow.size)}
            onChange={event =>
              onChange({
                size: clampRange(Number(event.target.value) || 0, 0, 500, dropShadow.size),
              })
            }
            className={sliderClass}
            disabled={!dropShadow.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Use Global Light'>
        <input
          type='checkbox'
          checked={dropShadow.useGlobalLight ?? false}
          onChange={event => {
            const checked = event.target.checked;
            onChange({
              useGlobalLight: checked,
              angle: checked ? globalLight.angle : dropShadow.angle,
            });
          }}
          className={inputClass}
          disabled={!dropShadow.enabled}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default DropShadowControls;

