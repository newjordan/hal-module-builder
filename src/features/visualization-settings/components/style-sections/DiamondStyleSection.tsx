/**
 * DiamondStyleSection - Diamond-specific style settings
 * Single Responsibility: Handle diamond count, size, and spacing
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { SliderControl } from '../../../../components/PropertyPanel/controls';
import { DIAMOND_CONSTRAINTS } from '../../utils/settings-schema';
import type { DiamondStyleSettings, SectionProps } from '../../types';

interface DiamondStyleSectionProps extends SectionProps {
  settings: DiamondStyleSettings;
}

export const DiamondStyleSection: React.FC<DiamondStyleSectionProps> = ({
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
      {/* Diamond Count */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Diamond Count:
            <EditableNumericValue
              value={settings.diamondCount}
              onChange={value => onChange({ diamondCount: value })}
              min={DIAMOND_CONSTRAINTS.diamondCount.min}
              max={DIAMOND_CONSTRAINTS.diamondCount.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Diamond Count'
          value={settings.diamondCount}
          min={DIAMOND_CONSTRAINTS.diamondCount.min}
          max={DIAMOND_CONSTRAINTS.diamondCount.max}
          step={DIAMOND_CONSTRAINTS.diamondCount.step}
          onChange={value => onChange({ diamondCount: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Diamond Size */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Diamond Size:
            <EditableNumericValue
              value={settings.diamondSize}
              onChange={value => onChange({ diamondSize: value })}
              suffix='px'
              min={DIAMOND_CONSTRAINTS.diamondSize.min}
              max={DIAMOND_CONSTRAINTS.diamondSize.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Diamond Size'
          value={settings.diamondSize}
          min={DIAMOND_CONSTRAINTS.diamondSize.min}
          max={DIAMOND_CONSTRAINTS.diamondSize.max}
          step={DIAMOND_CONSTRAINTS.diamondSize.step}
          onChange={value => onChange({ diamondSize: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Diamond Spacing */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Diamond Spacing:
            <EditableNumericValue
              value={settings.diamondSpacing}
              onChange={value => onChange({ diamondSpacing: value })}
              suffix='px'
              min={DIAMOND_CONSTRAINTS.diamondSpacing.min}
              max={DIAMOND_CONSTRAINTS.diamondSpacing.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Diamond Spacing'
          value={settings.diamondSpacing}
          min={DIAMOND_CONSTRAINTS.diamondSpacing.min}
          max={DIAMOND_CONSTRAINTS.diamondSpacing.max}
          step={DIAMOND_CONSTRAINTS.diamondSpacing.step}
          onChange={value => onChange({ diamondSpacing: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default DiamondStyleSection;

