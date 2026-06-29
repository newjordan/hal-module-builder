/**
 * LayerManager Component - Layer list rendering and management
 * Extracted from HalModuleBuilder.tsx for better organization and testability
 */
import React, { useCallback } from 'react';
import { Layer } from '../../types/layer-types';
import { LayerItem } from '../LayerItem';

export interface LayerManagerProps {
  theme: 'frost_light' | 'frost_dark';
  layers: Layer[];
  selectedLayerId: string;
  multiSelectedLayers: Set<string>;
  expandedLayers: Set<string>;
  onLayerClick: (layerId: string, event: React.MouseEvent) => void;
  onToggleExpanded: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onRenameLayer: (layerId: string, newName: string) => void;
  onAddGradientColor: (
    layerId: string,
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  onRemoveGradientColor: (
    layerId: string,
    index: number,
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  onUpdateGradientColor: (
    layerId: string,
    index: number,
    color: string,
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  onUpdateGradientStop: (
    layerId: string,
    index: number,
    stop: number,
    isEqualizer?: boolean,
    gradientTarget?: 'layer' | 'fill' | 'stroke' | 'radial' | 'custom'
  ) => void;
  className?: string;
  showLayerCount?: boolean;
  enableDragDrop?: boolean;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  theme,
  layers,
  selectedLayerId,
  multiSelectedLayers,
  expandedLayers,
  onLayerClick,
  onToggleExpanded,
  onUpdateLayer,
  onMoveLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onRenameLayer,
  onAddGradientColor,
  onRemoveGradientColor,
  onUpdateGradientColor,
  onUpdateGradientStop,
  className = '',
  showLayerCount = true,
}) => {
  const handleSetSelectedLayerId = useCallback(
    (layerId: string) => {
      // This is handled by onLayerClick - we create a synthetic event
      const syntheticEvent = new MouseEvent('click', { bubbles: true });
      onLayerClick(layerId, syntheticEvent as any);
    },
    [onLayerClick]
  );

  return (
    <div className={`layer-manager ${className}`}>
      {showLayerCount && (
        <div
          className={`
            frost-mb-3 frost-pb-2 frost-border-b
            ${theme === 'frost_light' ? 'frost-border-gray-200' : 'frost-border-gray-600'}
          `}
        >
          <div className='frost-flex frost-items-center frost-justify-between'>
            <h3
              className={`
                frost-font-medium
                ${theme === 'frost_light' ? 'frost-text-gray-900' : 'frost-text-gray-100'}
              `}
            >
              Layers ({layers.length})
            </h3>

            {multiSelectedLayers.size > 0 && (
              <span
                className={`
                  frost-text-sm frost-px-2 frost-py-1 frost-rounded
                  ${
                    theme === 'frost_light'
                      ? 'frost-bg-blue-100 frost-text-blue-700'
                      : 'frost-bg-blue-900/30 frost-text-blue-300'
                  }
                `}
              >
                {multiSelectedLayers.size} selected
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={`
          layer-list 
          ${theme === 'frost_light' ? 'frostlight-app-content-card' : 'frostdark-app-content-card'}
        `}
      >
        {layers.length === 0 ? (
          <div
            className={`
              frost-py-8 frost-text-center
              ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
            `}
          >
            <div className='frost-mb-2 frost-text-2xl'>🎨</div>
            <div className='frost-text-sm'>No layers yet</div>
            <div className='frost-text-xs frost-mt-1'>
              Add a layer to get started
            </div>
          </div>
        ) : (
          <div className='layer-items'>
            {[...layers].reverse().map((layer, reverseIndex) => {
              const actualIndex = layers.length - 1 - reverseIndex;

              return (
                <LayerItem
                  key={layer.id}
                  layer={layer}
                  actualIndex={actualIndex}
                  layerCount={layers.length}
                  selectedLayerId={selectedLayerId}
                  updateLayer={onUpdateLayer}
                  moveLayer={onMoveLayer}
                  setSelectedLayerId={handleSetSelectedLayerId}
                  duplicateLayer={onDuplicateLayer}
                  deleteLayer={onDeleteLayer}
                  renameLayer={onRenameLayer}
                  addGradientColor={onAddGradientColor}
                  removeGradientColor={onRemoveGradientColor}
                  updateGradientColor={onUpdateGradientColor}
                  updateGradientStop={onUpdateGradientStop}
                  theme={theme}
                  onLayerClick={onLayerClick}
                  isMultiSelected={multiSelectedLayers.has(layer.id)}
                  isExpanded={expandedLayers.has(layer.id)}
                  onToggleExpanded={onToggleExpanded}
                  groupName={undefined}
                  onGroupLayers={undefined}
                  onUngroupLayers={undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Layer Management Tips */}
      {layers.length > 0 && (
        <div
          className={`
            frost-mt-2 frost-text-xs frost-p-2 frost-rounded
            ${
              theme === 'frost_light'
                ? 'frost-bg-blue-50 frost-text-blue-600 frost-border frost-border-blue-200'
                : 'frost-bg-blue-900/20 frost-text-blue-300 frost-border frost-border-blue-700/50'
            }
          `}
        >
          <div className='frost-font-medium frost-mb-1'>Layer Controls:</div>
          <div className='frost-space-y-1'>
            <div>• Ctrl+Click: Multi-select layers</div>
            <div>• Shift+Click: Select range</div>
            <div>• Ctrl+D: Duplicate selected</div>
            <div>• Delete: Remove selected</div>
            <div>• H: Toggle visibility</div>
            <div>• Ctrl+↑/↓: Move layer</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerManager;
