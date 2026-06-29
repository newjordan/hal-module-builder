/**
 * SymmetrySection - Symmetry settings section
 * Single Responsibility: Handle symmetry mode and bar layout settings
 */

import React from 'react';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { SelectControl } from '../../../../components/PropertyPanel/controls';
import { EQUALIZER_SYMMETRY_OPTIONS } from '../../../../config/equalizerSymmetry';
import type { BarLayoutMode, SectionProps, SymmetryMode } from '../../types';

interface SymmetrySectionProps extends SectionProps {
  settings: {
    symmetry: SymmetryMode;
    barLayout?: BarLayoutMode;
    barCount?: number;
  };
}

const BAR_LAYOUT_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'grouped', label: 'Grouped' },
];

export const SymmetrySection: React.FC<SymmetrySectionProps> = ({
  settings,
  onChange,
  theme,
  className = '',
}) => {
  const symmetryOptions = EQUALIZER_SYMMETRY_OPTIONS.map(o => ({
    value: o.value,
    label: o.label,
  }));

  const currentSymmetry = settings.symmetry || 'none';
  const symmetryDescription =
    EQUALIZER_SYMMETRY_OPTIONS.find(o => o.value === currentSymmetry)
      ?.description || undefined;

  return (
    <PropertySection
      title='Symmetry'
      collapsible={true}
      defaultExpanded={true}
      theme={theme}
      className={className}
    >
      <PropertyRow label='Symmetry Mode' description={symmetryDescription}>
        <SelectControl
          label='Symmetry Mode'
          value={currentSymmetry}
          options={symmetryOptions}
          onChange={value => onChange({ symmetry: value as SymmetryMode })}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      {settings.barLayout !== undefined && (
        <PropertyRow label='Bar Layout'>
          <SelectControl
            label='Bar Layout'
            value={settings.barLayout || 'single'}
            options={BAR_LAYOUT_OPTIONS}
            onChange={value => onChange({ barLayout: value as BarLayoutMode })}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}
    </PropertySection>
  );
};

export default SymmetrySection;

