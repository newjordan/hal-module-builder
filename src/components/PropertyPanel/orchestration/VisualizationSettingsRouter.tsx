/**
 * VisualizationSettingsRouter - Routes to correct visualization settings panel
 * Single Responsibility: Determines which visualization panel to show based on type
 *
 * NOTE: Now uses the new unified VisualizationSettingsPanel from features/visualization-settings
 */
import React, { Suspense } from 'react';
import { VisualizationSettingsPanel } from '../../../features/visualization-settings';

export type VisualizationType =
  | 'dot'
  | 'bar'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'circle';

export interface VisualizationSettingsRouterProps {
  visualizationType: VisualizationType;
  settings: any; // Will be properly typed when we complete the interface
  onChange: (updates: any) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
  disclosureLevel?: any; // Progressive disclosure configuration
  userPreferences?: any; // User experience preferences
}

const LoadingPlaceholder: React.FC<{ theme: string }> = ({ theme }) => (
  <div
    className={`
    frost-p-4 frost-text-center
    ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
  `}
  >
    <div className='frost-animate-pulse'>Loading settings...</div>
  </div>
);

export const VisualizationSettingsRouter: React.FC<
  VisualizationSettingsRouterProps
> = ({
  visualizationType,
  settings,
  onChange,
  theme,
  className = '',
  disclosureLevel: _disclosureLevel,
  userPreferences: _userPreferences,
}) => {
  // Debug logging
  try {
    console.debug('[Router] VisualizationSettingsRouter render', {
      visualizationType,
      invert: (settings as any)?.invert,
      layout: (settings as any)?.layout,
    });
  } catch {}

  // Use the new unified panel for all visualization types
  const settingsWithType = {
    ...settings,
    visualizationType,
  };

  return (
    <div className={`visualization-settings-router ${className}`}>
      <Suspense fallback={<LoadingPlaceholder theme={theme} />}>
        <VisualizationSettingsPanel
          settings={settingsWithType}
          onUpdate={onChange}
          theme={theme}
        />
      </Suspense>
    </div>
  );
};

export default VisualizationSettingsRouter;
