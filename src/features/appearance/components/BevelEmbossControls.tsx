import React from 'react';
import type { Layer } from '../../../types/layer-types';
import PropertySection from '../../../components/PropertySection';
import PropertyRow from '../../../components/PropertyRow';
import { BLEND_MODE_OPTIONS, formatBlendMode } from '../utils/blend-mode';
import { clamp01, clampAngle, clampRange } from '../utils/validation';

export interface BevelEmbossControlsProps {
  value: NonNullable<Layer['bevelEmboss']>;
  globalLight: NonNullable<Layer['globalLight']>;
  theme: 'frost_light' | 'frost_dark';
  onChange: (
    updates:
      | Partial<NonNullable<Layer['bevelEmboss']>>
      | ((prev: NonNullable<Layer['bevelEmboss']>) => Partial<NonNullable<Layer['bevelEmboss']>>)
  ) => void;
  onChangeGlobalLight: (updates: Partial<NonNullable<Layer['globalLight']>>) => void;
}

const BevelEmbossControls: React.FC<BevelEmbossControlsProps> = ({ value, globalLight, theme, onChange, onChangeGlobalLight }) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight ? 'frostlight-input-field' : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;

  const b = value;
  const angleValue = b.useGlobalLight ? globalLight.angle : b.angle;
  const altitudeValue = b.useGlobalLight ? globalLight.altitude : b.altitude;

  return (
    <PropertySection
      title='Bevel & Emboss'
      collapsible
      defaultExpanded={b.enabled}
      onToggle={enabled => onChange({ enabled })}
      theme={theme}
    >
      <PropertyRow label='Style'>
        <select
          value={b.style}
          onChange={e => onChange({ style: e.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!b.enabled}
        >
          <option value='innerBevel'>Inner Bevel</option>
          <option value='outerBevel'>Outer Bevel</option>
          <option value='emboss'>Emboss</option>
          <option value='pillowEmboss'>Pillow Emboss</option>
          <option value='strokeEmboss'>Stroke Emboss</option>
        </select>
      </PropertyRow>

      <PropertyRow label='Technique'>
        <select
          value={b.technique}
          onChange={e => onChange({ technique: e.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!b.enabled}
        >
          <option value='smooth'>Smooth</option>
          <option value='chiselSoft'>Chisel Soft</option>
          <option value='chiselHard'>Chisel Hard</option>
        </select>
      </PropertyRow>

      <PropertyRow label='Depth'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={1}
            max={1000}
            value={Math.round(b.depth)}
            onChange={e => onChange({ depth: clampRange(Number(e.target.value) || 0, 1, 1000, b.depth) })}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!b.enabled}
          />
          <input
            type='range'
            min='1'
            max='1000'
            step='1'
            value={Math.round(b.depth)}
            onChange={e => onChange({ depth: clampRange(Number(e.target.value) || 0, 1, 1000, b.depth) })}
            className={sliderClass}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Direction'>
        <select
          value={b.direction}
          onChange={e => onChange({ direction: e.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!b.enabled}
        >
          <option value='up'>Up</option>
          <option value='down'>Down</option>
        </select>
      </PropertyRow>

      <PropertyRow label='Size'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={500}
            value={Math.round(b.size)}
            onChange={e => onChange({ size: clampRange(Number(e.target.value) || 0, 0, 500, b.size) })}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!b.enabled}
          />
          <input
            type='range'
            min='0'
            max='500'
            step='1'
            value={Math.round(b.size)}
            onChange={e => onChange({ size: clampRange(Number(e.target.value) || 0, 0, 500, b.size) })}
            className={sliderClass}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Soften'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={50}
            value={Math.round(b.soften)}
            onChange={e => onChange({ soften: clampRange(Number(e.target.value) || 0, 0, 50, b.soften) })}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!b.enabled}
          />
          <input
            type='range'
            min='0'
            max='50'
            step='1'
            value={Math.round(b.soften)}
            onChange={e => onChange({ soften: clampRange(Number(e.target.value) || 0, 0, 50, b.soften) })}
            className={sliderClass}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Use Global Light'>
        <input
          type='checkbox'
          checked={b.useGlobalLight ?? false}
          onChange={e =>
            onChange({ useGlobalLight: e.target.checked, angle: e.target.checked ? globalLight.angle : b.angle, altitude: e.target.checked ? globalLight.altitude : b.altitude })
          }
          className={inputClass}
          disabled={!b.enabled}
        />
      </PropertyRow>

      <PropertyRow label='Angle'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={360}
            value={angleValue}
            onChange={e => {
              const raw = clampAngle(Number(e.target.value) || 0, angleValue);
              onChange({ angle: raw });
              if (b.useGlobalLight) onChangeGlobalLight({ angle: raw });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!b.enabled}
          />
          <input
            type='range'
            min='0'
            max='360'
            step='1'
            value={angleValue}
            onChange={e => {
              const raw = clampAngle(Number(e.target.value) || 0, angleValue);
              onChange({ angle: raw });
              if (b.useGlobalLight) onChangeGlobalLight({ angle: raw });
            }}
            className={sliderClass}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Altitude'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={90}
            value={altitudeValue}
            onChange={e => {
              const raw = clampRange(Number(e.target.value) || 0, 0, 90, altitudeValue);
              onChange({ altitude: raw });
              if (b.useGlobalLight) onChangeGlobalLight({ altitude: raw });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!b.enabled}
          />
          <input
            type='range'
            min='0'
            max='90'
            step='1'
            value={altitudeValue}
            onChange={e => {
              const raw = clampRange(Number(e.target.value) || 0, 0, 90, altitudeValue);
              onChange({ altitude: raw });
              if (b.useGlobalLight) onChangeGlobalLight({ altitude: raw });
            }}
            className={sliderClass}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Highlight Blend Mode'>
        <select
          value={b.highlightBlendMode}
          onChange={e => onChange({ highlightBlendMode: e.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!b.enabled}
        >
          {BLEND_MODE_OPTIONS.map(mode => (
            <option key={`bevel-highlight-${mode}`} value={mode}>
              {formatBlendMode(mode)}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label='Highlight Color'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='color'
            value={b.highlightColor}
            onChange={e => onChange({ highlightColor: e.target.value })}
            className={inputClass}
            style={{ width: '52px', height: '32px', padding: 0 }}
            disabled={!b.enabled}
          />
          <input
            type='text'
            value={b.highlightColor}
            onChange={e => onChange({ highlightColor: e.target.value })}
            className={inputClass}
            style={{ flex: 1 }}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Highlight Opacity (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(clamp01(b.highlightOpacity) * 100)}
            onChange={e => {
              const raw = clampRange(Number(e.target.value) || 0, 0, 100, Math.round(clamp01(b.highlightOpacity) * 100));
              onChange({ highlightOpacity: clamp01(raw / 100) });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!b.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(clamp01(b.highlightOpacity) * 100)}
            onChange={e => {
              const raw = clampRange(Number(e.target.value) || 0, 0, 100, Math.round(clamp01(b.highlightOpacity) * 100));
              onChange({ highlightOpacity: clamp01(raw / 100) });
            }}
            className={sliderClass}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Shadow Blend Mode'>
        <select
          value={b.shadowBlendMode}
          onChange={e => onChange({ shadowBlendMode: e.target.value as any })}
          className={inputClass}
          style={{ width: '100%', padding: '4px 6px' }}
          disabled={!b.enabled}
        >
          {BLEND_MODE_OPTIONS.map(mode => (
            <option key={`bevel-shadow-${mode}`} value={mode}>
              {formatBlendMode(mode)}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label='Shadow Color'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='color'
            value={b.shadowColor}
            onChange={e => onChange({ shadowColor: e.target.value })}
            className={inputClass}
            style={{ width: '52px', height: '32px', padding: 0 }}
            disabled={!b.enabled}
          />
          <input
            type='text'
            value={b.shadowColor}
            onChange={e => onChange({ shadowColor: e.target.value })}
            className={inputClass}
            style={{ flex: 1 }}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Shadow Opacity (%)'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={100}
            value={Math.round(clamp01(b.shadowOpacity) * 100)}
            onChange={e => {
              const raw = clampRange(Number(e.target.value) || 0, 0, 100, Math.round(clamp01(b.shadowOpacity) * 100));
              onChange({ shadowOpacity: clamp01(raw / 100) });
            }}
            className={inputClass}
            style={{ width: '72px' }}
            disabled={!b.enabled}
          />
          <input
            type='range'
            min='0'
            max='100'
            step='1'
            value={Math.round(clamp01(b.shadowOpacity) * 100)}
            onChange={e => {
              const raw = clampRange(Number(e.target.value) || 0, 0, 100, Math.round(clamp01(b.shadowOpacity) * 100));
              onChange({ shadowOpacity: clamp01(raw / 100) });
            }}
            className={sliderClass}
            disabled={!b.enabled}
          />
        </div>
      </PropertyRow>
    </PropertySection>
  );
};

export default BevelEmbossControls;

