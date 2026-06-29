/**
 * ColorSettings - Grouped color-related controls
 * Single Responsibility: Manages all color-related settings for a visualization
 */
import React from 'react';
import PropertyRow from '../../PropertyRow';
import type { SelectOption } from '../controls';

import { ColorPicker, SelectControl } from '../controls';

export interface ColorSettingsProps {
  primaryColor: string;
  secondaryColor?: string | undefined;
  glowColor?: string | undefined;
  colorMode:
    | 'solid'
    | 'gradient'
    | 'rainbow'
    | 'reactive'
    | 'custom-gradient'
    | 'radial-gradient';
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange?: ((color: string) => void) | undefined;
  onGlowColorChange?: ((color: string) => void) | undefined;
  onColorModeChange: (mode: string) => void;
  theme: 'frost_light' | 'frost_dark';
  showSecondaryColor?: boolean | undefined;
  showGlowColor?: boolean | undefined;
}

const COLOR_MODE_OPTIONS: SelectOption[] = [
  { value: 'solid', label: 'Solid Color' },
  { value: 'gradient', label: 'Linear Gradient' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'reactive', label: 'Audio Reactive' },
  { value: 'custom-gradient', label: 'Custom Gradient' },
  { value: 'radial-gradient', label: 'Radial Gradient' },
];

export const ColorSettings: React.FC<ColorSettingsProps> = ({
  primaryColor,
  secondaryColor,
  glowColor,
  colorMode,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onGlowColorChange,
  onColorModeChange,
  theme,
  showSecondaryColor = false,
  showGlowColor = false,
}) => {
  // Determine if secondary color should be shown based on color mode
  const shouldShowSecondaryColor =
    showSecondaryColor ||
    ['gradient', 'custom-gradient', 'radial-gradient'].includes(colorMode);

  return (
    <>
      <PropertyRow label='Color Mode'>
        <SelectControl
          label='Color Mode'
          value={colorMode}
          options={COLOR_MODE_OPTIONS}
          onChange={onColorModeChange}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      <PropertyRow label='Primary Color'>
        <ColorPicker
          label='Primary Color'
          value={primaryColor}
          onChange={onPrimaryColorChange}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      {shouldShowSecondaryColor && onSecondaryColorChange && (
        <PropertyRow label='Secondary Color'>
          <ColorPicker
            label='Secondary Color'
            value={secondaryColor || '#ffffff'}
            onChange={onSecondaryColorChange}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      {showGlowColor && onGlowColorChange && (
        <PropertyRow label='Glow Color'>
          <ColorPicker
            label='Glow Color'
            value={glowColor || primaryColor}
            onChange={onGlowColorChange}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}
    </>
  );
};

export default ColorSettings;
