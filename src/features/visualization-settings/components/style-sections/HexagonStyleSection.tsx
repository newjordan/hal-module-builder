/**
 * HexagonStyleSection - Hexagon-specific style settings
 * Single Responsibility: Handle hexagon count, size, and spacing
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { SliderControl } from '../../../../components/PropertyPanel/controls';
import { HEXAGON_CONSTRAINTS } from '../../utils/settings-schema';
import type { HexagonStyleSettings, SectionProps } from '../../types';

interface HexagonStyleSectionProps extends SectionProps {
  settings: HexagonStyleSettings;
}

export const HexagonStyleSection: React.FC<HexagonStyleSectionProps> = ({
  settings,
  onChange,
  theme,
  className = '',
}) => {
  return (
    <PropertySection
      title='Style'
      collapsible={true}
      defaultExpanded={true}
      theme={theme}
      className={className}
    >
      {/* Hexagon Count */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Hexagon Count:
            <EditableNumericValue
              value={settings.hexagonCount}
              onChange={value => onChange({ hexagonCount: value })}
              min={HEXAGON_CONSTRAINTS.hexagonCount.min}
              max={HEXAGON_CONSTRAINTS.hexagonCount.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Hexagon Count'
          value={settings.hexagonCount}
          min={HEXAGON_CONSTRAINTS.hexagonCount.min}
          max={HEXAGON_CONSTRAINTS.hexagonCount.max}
          step={HEXAGON_CONSTRAINTS.hexagonCount.step}
          onChange={value => onChange({ hexagonCount: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Hexagon Size */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Hexagon Size:
            <EditableNumericValue
              value={settings.hexSize}
              onChange={value => onChange({ hexSize: value })}
              suffix='px'
              min={HEXAGON_CONSTRAINTS.hexSize.min}
              max={HEXAGON_CONSTRAINTS.hexSize.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Hexagon Size'
          value={settings.hexSize}
          min={HEXAGON_CONSTRAINTS.hexSize.min}
          max={HEXAGON_CONSTRAINTS.hexSize.max}
          step={HEXAGON_CONSTRAINTS.hexSize.step}
          onChange={value => onChange({ hexSize: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Hexagon Spacing */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Hexagon Spacing:
            <EditableNumericValue
              value={settings.hexSpacing}
              onChange={value => onChange({ hexSpacing: value })}
              suffix='px'
              min={HEXAGON_CONSTRAINTS.hexSpacing.min}
              max={HEXAGON_CONSTRAINTS.hexSpacing.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Hexagon Spacing'
          value={settings.hexSpacing}
          min={HEXAGON_CONSTRAINTS.hexSpacing.min}
          max={HEXAGON_CONSTRAINTS.hexSpacing.max}
          step={HEXAGON_CONSTRAINTS.hexSpacing.step}
          onChange={value => onChange({ hexSpacing: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default HexagonStyleSection;

