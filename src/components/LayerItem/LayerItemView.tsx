import React, { memo } from 'react';
import LayerControls from './LayerControls';
import LayerPreview from './LayerPreview';
import { LayerItemViewProps } from './types';

/**
 * LayerItemView Component
 *
 * Pure presentation component for LayerItem UI.
 * Handles layout, styling, and structure only.
 * No direct state management - all data via props.
 *
 * Features:
 * - Layout and styling management
 * - Selection state visualization
 * - Multi-select state handling
 * - Drag and drop visual feedback
 * - Expansion state rendering
 * - Name editing interface
 * - Group indicator display
 */
export const LayerItemView = memo<LayerItemViewProps>(
  ({
    layer,
    isSelected,
    isMultiSelected,
    isAnimating,
    isDragging,
    isDraggedOver,
    isExpanded,
    isEditingName,
    tempName,
    theme,
    groupName,
    children,
    onClick,
    onMouseDown,
    onToggleExpanded,
    onNameEdit,
    onNameSave,
    onNameKeyDown,
    onTempNameChange,
    actualIndex,
    layerCount,
    onVisibilityToggle,
    onImageUpload,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    onDelete,
    onGroupLayers,
    onUngroupLayers,
  }) => {
    // UI state calculations
    const showAsSelected = isSelected || isMultiSelected;

    // Dynamic class name generation
    const layerItemClass = [
      'layer-item',
      theme === 'frost_light'
        ? 'frostlight-layer-item'
        : 'frostdark-layer-item',
      showAsSelected && 'selected',
      isMultiSelected && 'multi-selected',
      !layer.visible && 'opacity-50',
      isDragging && 'dragging',
      isDraggedOver && 'drag-over',
      isAnimating && 'animating',
      'transition-all duration-200 ease-out',
    ]
      .filter(Boolean)
      .join(' ');

    const buttonClass =
      theme === 'frost_light'
        ? 'frostlight-button-icon'
        : 'frostdark-button-icon';

    const layerTypeLabel = (() => {
      const rawType =
        typeof layer.type === 'string' ? layer.type : String(layer.type ?? '');
      if (!rawType) return 'Unknown';
      return rawType.charAt(0).toUpperCase() + rawType.slice(1);
    })();

    // Dynamic styling based on state
    const containerStyle: React.CSSProperties = {
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: showAsSelected
        ? theme === 'frost_light'
          ? 'rgba(59, 130, 246, 0.1)'
          : 'rgba(96, 165, 250, 0.1)'
        : 'transparent',
      border: `1px solid ${
        showAsSelected
          ? theme === 'frost_light'
            ? 'rgba(59, 130, 246, 0.3)'
            : 'rgba(96, 165, 250, 0.3)'
          : 'transparent'
      }`,
      transition: 'all 0.2s ease-out',
      willChange: 'background-color, border-color',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      opacity: isDragging ? 0.8 : 1,
    };

    /**
     * Renders the layer name or name editing input
     */
    const renderLayerName = () => {
      if (isEditingName) {
        return (
          <input
            type='text'
            value={tempName}
            onChange={e => onTempNameChange(e.target.value)}
            onBlur={onNameSave}
            onKeyDown={onNameKeyDown}
            autoFocus
            className={
              theme === 'frost_light'
                ? 'frostlight-input-field'
                : 'frostdark-input-field'
            }
            style={{
              width: '100%',
              padding: '2px 6px',
              fontSize: '14px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
            }}
            onClick={e => e.stopPropagation()}
          />
        );
      }

      return (
        <div
          className={`layer-name-text ${theme === 'frost_light' ? `frostlight-layer-name ${showAsSelected ? 'selected' : ''}` : `frostdark-layer-name ${showAsSelected ? 'selected' : ''}`}`}
          onDoubleClick={onNameEdit}
          style={{
            fontSize: '14px',
            fontWeight: showAsSelected ? '600' : '500',
            color:
              theme === 'frost_light'
                ? showAsSelected
                  ? '#1d4ed8'
                  : '#374151'
                : showAsSelected
                  ? '#60a5fa'
                  : '#e5e7eb',
            cursor: 'text',
            userSelect: 'none',
            transition: 'color 0.2s ease-out',
          }}
          title='Double-click to edit name'
        >
          {layer.name}
        </div>
      );
    };

    /**
     * Renders the layer type and group indicator
     */
    const renderLayerTypeAndGroup = () => (
      <div
        className={`layer-type-text ${theme === 'frost_light' ? 'frostlight-layer-type' : 'frostdark-layer-type'}`}
        style={{
          fontSize: '12px',
          color: theme === 'frost_light' ? '#6b7280' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{layerTypeLabel}</span>
        {groupName && (
          <span
            className='group-indicator'
            style={{
              fontSize: '10px',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color:
                theme === 'frost_light'
                  ? 'rgba(59, 130, 246, 0.8)'
                  : 'rgba(96, 165, 250, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
            title={`Group: ${groupName}`}
          >
            📁 {groupName}
          </span>
        )}
      </div>
    );

    /**
     * Renders the expand/collapse toggle button
     */
    const renderExpandToggle = () => (
      <button
        onClick={onToggleExpanded}
        className={buttonClass}
        title={isExpanded ? 'Collapse layer settings' : 'Expand layer settings'}
        style={{
          padding: '4px',
          fontSize: '12px',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease-out',
          flexShrink: 0,
        }}
      >
        ▶️
      </button>
    );

    return (
      <div className='layer-item-wrapper' style={{ marginBottom: '4px' }}>
        <div
          className={layerItemClass}
          data-layer-id={layer.id}
          data-index={layer.id}
          onClick={onClick}
          onMouseDown={onMouseDown}
          style={containerStyle}
        >
          {/* Layer Preview Thumbnail */}
          <LayerPreview
            layer={layer}
            theme={theme}
            className='layer-item__preview'
          />

          {/* Layer Information Section */}
          <div
            className='layer-item__content'
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {renderLayerName()}
            {renderLayerTypeAndGroup()}
          </div>

          {/* Control Actions Section */}
          <div
            className='layer-item__controls'
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {/* Expand/Collapse Toggle */}
            {renderExpandToggle()}

            {/* Action Controls */}
            <LayerControls
              layer={layer}
              theme={theme}
              actualIndex={actualIndex}
              layerCount={layerCount}
              groupName={groupName}
              onVisibilityToggle={onVisibilityToggle}
              onImageUpload={onImageUpload}
              onDuplicate={onDuplicate}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onDelete={onDelete}
              onGroupLayers={onGroupLayers}
              onUngroupLayers={onUngroupLayers}
            />
          </div>
        </div>

        {/* Expanded Layer Properties Panel */}
        {isExpanded && children && (
          <div
            className={`layer-expanded-panel ${theme === 'frost_light' ? 'frostlight-panel-secondary' : 'frostdark-panel-secondary'}`}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              borderLeft: `2px solid ${theme === 'frost_light' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`,
              animation: 'fadeIn 0.2s ease-out',
              background:
                theme === 'frost_light'
                  ? 'rgba(249, 250, 251, 0.8)'
                  : 'rgba(17, 24, 39, 0.8)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${theme === 'frost_light' ? 'rgba(229, 231, 235, 0.6)' : 'rgba(75, 85, 99, 0.6)'}`,
              boxShadow:
                theme === 'frost_light'
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Re-render when the layer reference or children change, plus other relevant UI flags
    return (
      prevProps.layer === nextProps.layer &&
      prevProps.children === nextProps.children &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isMultiSelected === nextProps.isMultiSelected &&
      prevProps.isAnimating === nextProps.isAnimating &&
      prevProps.isDragging === nextProps.isDragging &&
      prevProps.isDraggedOver === nextProps.isDraggedOver &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.isEditingName === nextProps.isEditingName &&
      prevProps.tempName === nextProps.tempName &&
      prevProps.theme === nextProps.theme &&
      prevProps.groupName === nextProps.groupName &&
      prevProps.actualIndex === nextProps.actualIndex &&
      prevProps.layerCount === nextProps.layerCount
    );
  }
);

LayerItemView.displayName = 'LayerItemView';

export default LayerItemView;
