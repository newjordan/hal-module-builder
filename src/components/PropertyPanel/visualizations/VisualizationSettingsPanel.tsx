/**
 * VisualizationSettingsPanel - Reactive settings panel that switches based on visualization type
 * Single Responsibility: Route to the correct visualization-specific settings component
 */
import React from 'react';
import { DotVisualizationSettings } from './DotVisualizationSettings';
import { BarVisualizationSettings } from './BarVisualizationSettings';

interface VisualizationSettingsPanelProps {
  visualizationType: string;
  settings: any;
  onUpdate: (updates: any) => void;
  theme: 'frost_light' | 'frost_dark';
}

export const VisualizationSettingsPanel: React.FC<
  VisualizationSettingsPanelProps
> = ({ visualizationType, settings, onUpdate, theme }) => {
  const labelClasses = `
    frost-block frost-text-sm frost-font-medium frost-mb-2
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  // Render visualization-specific settings based on type
  const renderTypeSpecificSettings = () => {
    switch (visualizationType) {
      case 'dot':
        return (
          <DotVisualizationSettings
            settings={settings}
            onChange={onUpdate}
            theme={theme}
          />
        );

      case 'bar':
        return (
          <BarVisualizationSettings
            settings={settings}
            onChange={onUpdate}
            theme={theme}
          />
        );

      case 'line':
        // Line mode uses BAR visualization with line style
        return (
          <BarVisualizationSettings
            settings={{ ...settings, style: 'line' }}
            onChange={onUpdate}
            theme={theme}
          />
        );

      case 'block':
        // Block mode uses BAR visualization with block style
        return (
          <BarVisualizationSettings
            settings={{ ...settings, style: 'block' }}
            onChange={onUpdate}
            theme={theme}
          />
        );

      case 'circle':
      case 'hexagon':
      case 'diamond':
      case 'triangle':
        // Shape visualizations can share some common settings
        return (
          <div className='frost-text-sm frost-text-gray-500'>
            {visualizationType.charAt(0).toUpperCase() +
              visualizationType.slice(1)}{' '}
            visualization settings
            {/* TODO: Create ShapeVisualizationSettings component */}
          </div>
        );

      default:
        return (
          <div className='frost-text-sm frost-text-gray-500'>
            No specific settings for {visualizationType}
          </div>
        );
    }
  };

  return (
    <div className='frost-space-y-3'>
      <h5 className={labelClasses}>
        {visualizationType.charAt(0).toUpperCase() + visualizationType.slice(1)}{' '}
        Settings
      </h5>
      {renderTypeSpecificSettings()}
    </div>
  );
};
