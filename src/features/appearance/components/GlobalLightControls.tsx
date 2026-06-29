import React from 'react';
import type { Layer } from '../../../types/layer-types';
import PropertySection from '../../../components/PropertySection';
import PropertyRow from '../../../components/PropertyRow';
import { clampAngle, clampRange } from '../utils/validation';

export interface GlobalLightControlsProps {
  value: NonNullable<Layer['globalLight']>;
  theme: 'frost_light' | 'frost_dark';
  onChange: (
    updates:
      | Partial<NonNullable<Layer['globalLight']>>
      | ((prev: NonNullable<Layer['globalLight']>) => Partial<NonNullable<Layer['globalLight']>>)
  ) => void;
}

const GlobalLightControls: React.FC<GlobalLightControlsProps> = ({ value, theme, onChange }) => {
  const isLight = theme === 'frost_light';
  const inputClass = isLight ? 'frostlight-input-field' : 'frostdark-input-field';
  const sliderClass = `${inputClass} property-slider`;

  const g = value;

  return (
    <PropertySection title='Global Light' collapsible defaultExpanded theme={theme}>
      <PropertyRow label='Angle'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={360}
            value={g.angle}
            onChange={e => onChange({ angle: clampAngle(Number(e.target.value) || 0, g.angle) })}
            className={inputClass}
            style={{ width: '72px' }}
          />
          <input
            type='range'
            min='0'
            max='360'
            step='1'
            value={g.angle}
            onChange={e => onChange({ angle: clampAngle(Number(e.target.value) || 0, g.angle) })}
            className={sliderClass}
          />
        </div>
      </PropertyRow>

      <PropertyRow label='Altitude'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='number'
            min={0}
            max={90}
            value={g.altitude}
            onChange={e => onChange({ altitude: clampRange(Number(e.target.value) || 0, 0, 90, g.altitude) })}
            className={inputClass}
            style={{ width: '72px' }}
          />
          <input
            type='range'
            min='0'
            max='90'
            step='1'
            value={g.altitude}
            onChange={e => onChange({ altitude: clampRange(Number(e.target.value) || 0, 0, 90, g.altitude) })}
            className={sliderClass}
          />
        </div>
      </PropertyRow>
    </PropertySection>
  );
};

export default GlobalLightControls;

