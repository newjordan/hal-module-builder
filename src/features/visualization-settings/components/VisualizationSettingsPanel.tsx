/**
 * VisualizationSettingsPanel - Main settings panel orchestrator
 * Single Responsibility: Compose all sections into a complete settings panel
 *
 * Structure (following equalizer_panel_categories_and_items.md):
 * 1. Type - Visualization type selector
 * 2. Style - Visualization-specific settings
 * 3. Appearance - Full appearance panel
 * 4. Symmetry - Symmetry mode and bar layout
 * 5. Position - Position, rotation, radial settings
 * 6. Audio Integration - Response speed, pulse mode
 */

import React from 'react';
import { useVisualizationSettings } from '../hooks/useVisualizationSettings';
import type { VisualizationSettings } from '../types';
import {
  AppearanceSection,
  AudioIntegrationSection,
  PositionSection,
  SymmetrySection,
} from './shared-sections';
import {
  BarStyleSection,
  CircleStyleSection,
  DiamondStyleSection,
  DotStyleSection,
  HexagonStyleSection,
  TriangleStyleSection,
} from './style-sections';

export interface VisualizationSettingsPanelProps {
  settings: Partial<VisualizationSettings>;
  onUpdate: (updates: Partial<VisualizationSettings>) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

export const VisualizationSettingsPanel: React.FC<
  VisualizationSettingsPanelProps
> = ({ settings: initialSettings, onUpdate, theme, className = '' }) => {
  const { settings, updateSettings } = useVisualizationSettings({
    initialSettings,
    onUpdate,
  });

  const visualizationType = settings.visualizationType || 'bar';

  // Render the appropriate style section based on visualization type
  const renderStyleSection = () => {
    switch (visualizationType) {
      case 'bar':
        return (
          <BarStyleSection
            settings={settings as any}
            onChange={updateSettings}
            theme={theme}
          />
        );
      case 'dot':
        return (
          <DotStyleSection
            settings={settings as any}
            onChange={updateSettings}
            theme={theme}
          />
        );
      case 'triangle':
        return (
          <TriangleStyleSection
            settings={settings as any}
            onChange={updateSettings}
            theme={theme}
          />
        );
      case 'diamond':
        return (
          <DiamondStyleSection
            settings={settings as any}
            onChange={updateSettings}
            theme={theme}
          />
        );
      case 'hexagon':
        return (
          <HexagonStyleSection
            settings={settings as any}
            onChange={updateSettings}
            theme={theme}
          />
        );
      case 'circle':
        return (
          <CircleStyleSection
            settings={settings as any}
            onChange={updateSettings}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`visualization-settings-panel ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px',
      }}
    >
      {/* 1. Type Section - TODO: Will be added when needed */}

      {/* 2. Style Section - Visualization-specific */}
      {renderStyleSection()}

      {/* 3. Appearance Section - Full appearance panel */}
      <AppearanceSection
        settings={settings}
        onChange={updateSettings}
        theme={theme}
      />

      {/* 4. Symmetry Section */}
      <SymmetrySection
        settings={settings}
        onChange={updateSettings}
        theme={theme}
      />

      {/* 5. Position Section */}
      <PositionSection
        settings={settings}
        onChange={updateSettings}
        theme={theme}
      />

      {/* 6. Audio Integration Section */}
      <AudioIntegrationSection
        settings={settings}
        onChange={updateSettings}
        theme={theme}
      />
    </div>
  );
};

export default VisualizationSettingsPanel;
