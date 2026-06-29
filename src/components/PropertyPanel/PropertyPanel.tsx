/**
 * PropertyPanel Component - Layer property controls and editing
 * Now powered by useLayerProperties hook for comprehensive controls
 */
import React, { useMemo } from 'react';
import { Layer } from '../../types/layer-types';
import { BulkEditPanel } from './BulkEditPanel';
import { useLayerProperties } from '../../hooks/useLayerProperties';

export interface PropertyPanelProps {
  theme: 'frost_light' | 'frost_dark';
  selectedLayer: Layer | null;
  multiSelectedLayers: Layer[];
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onBulkUpdateLayers: (layerIds: string[], updates: Partial<Layer>) => void;
  className?: string;
  compact?: boolean;
  layers?: Layer[];
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  theme,
  selectedLayer,
  multiSelectedLayers,
  onUpdateLayer,
  onBulkUpdateLayers,
  className = '',
  layers: _layers = [],
}) => {
  // Determine what to show based on selection
  const displayMode = useMemo(() => {
    if (multiSelectedLayers.length > 1) {
      return 'bulk';
    } else if (selectedLayer) {
      return 'single';
    } else {
      return 'none';
    }
  }, [selectedLayer, multiSelectedLayers]);

  if (displayMode === 'none') {
    return (
      <div className={`property-panel ${className}`}>
        <div
          className={`
            frost-py-8 frost-text-center
            ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
          `}
        >
          <div className='frost-mb-2 frost-text-2xl'>⚙️</div>
          <div className='frost-text-sm'>Select a layer to edit properties</div>
        </div>
      </div>
    );
  }

  if (displayMode === 'bulk') {
    return (
      <div className={`property-panel ${className}`}>
        <BulkEditPanel
          theme={theme}
          multiSelectedLayers={multiSelectedLayers}
          onBulkUpdate={onBulkUpdateLayers}
        />
      </div>
    );
  }

  // Single layer editing - now using useLayerProperties hook
  if (displayMode === 'single' && selectedLayer) {
    // Connect useLayerProperties hook for comprehensive controls
    const propertyControls = useLayerProperties({
      layer: selectedLayer,
      theme,
      updateLayer: (layerId: string, updates: Partial<Layer>) => {
        onUpdateLayer(layerId, updates);
      },
      onShapeTypeChange: (layerId: string, newShapeType: string) => {
        onUpdateLayer(layerId, { shapeType: newShapeType as any });
      },
    });

    return (
      <div className={`property-panel ${className}`}>
        <div className='frost-mb-4'>
          <h3
            className={`
              frost-font-medium frost-mb-1
              ${theme === 'frost_light' ? 'frost-text-gray-900' : 'frost-text-gray-100'}
            `}
          >
            {selectedLayer.name}
          </h3>
          <div
            className={`
              frost-text-xs frost-px-2 frost-py-1 frost-rounded
              ${
                theme === 'frost_light'
                  ? 'frost-bg-gray-100 frost-text-gray-600'
                  : 'frost-bg-gray-700 frost-text-gray-300'
              }
            `}
          >
            {selectedLayer.type.charAt(0).toUpperCase() +
              selectedLayer.type.slice(1)}{' '}
            Layer
          </div>
        </div>

        {/* Use comprehensive hook-based controls with 20+ equalizer parameters */}
        {propertyControls.renderPropertyPanel()}
      </div>
    );
  }

  return null;
};

export default PropertyPanel;
