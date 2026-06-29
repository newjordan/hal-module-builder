import React, { memo, useRef, useState } from 'react';
import { LayerControlsProps } from './types';
import { ConfirmDialog } from '../modals/ConfirmDialog';

/**
 * LayerControls Component
 *
 * Interactive controls for layer manipulation.
 * Includes action buttons, dropdowns, and keyboard shortcuts.
 *
 * Features:
 * - Action buttons (delete, duplicate, visibility)
 * - Move controls (up/down)
 * - Group management
 * - Image upload for image layers
 * - Keyboard shortcut indicators
 * - Event handlers passed as props
 */
export const LayerControls = memo<LayerControlsProps>(
  ({
    layer,
    theme,
    actualIndex,
    layerCount,
    groupName,
    onVisibilityToggle,
    onImageUpload,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    onDelete,
    onGroupLayers,
    onUngroupLayers,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // UI state calculations
    const canMoveUp = actualIndex > 0;
    const canMoveDown = actualIndex < layerCount - 1;

    const buttonClass =
      theme === 'frost_light'
        ? 'frostlight-button-icon'
        : 'frostdark-button-icon';
    const dangerButtonClass =
      theme === 'frost_light'
        ? 'frostlight-button-icon-danger'
        : 'frostdark-button-icon-danger';

    /**
     * Handles image upload trigger
     */
    const handleImageUploadClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      fileInputRef.current?.click();
    };

    /**
     * Handles delete with confirmation
     */
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(true);
    };

    /**
     * Confirms deletion
     */
    const handleConfirmDelete = () => {
      setShowDeleteConfirm(false);
      onDelete();
    };

    /**
     * Cancels deletion
     */
    const handleCancelDelete = () => {
      setShowDeleteConfirm(false);
    };

    /**
     * Generic button click handler with event propagation stop
     */
    const createClickHandler =
      (handler: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        handler();
      };

    return (
      <div
        className='layer-controls'
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Visibility Toggle */}
        <button
          onClick={createClickHandler(onVisibilityToggle)}
          className={buttonClass}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
          style={{
            padding: '4px',
            fontSize: '16px',
            opacity: layer.visible ? 1 : 0.5,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          {layer.visible ? '👁️' : '👁️‍🗨️'}
        </button>

        {/* Image Upload (for image layers only) */}
        {layer.type === 'image' && (
          <>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={onImageUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={handleImageUploadClick}
              className={buttonClass}
              title='Upload image'
              style={{ padding: '4px', fontSize: '16px' }}
            >
              📁
            </button>
          </>
        )}

        {/* Duplicate Layer */}
        <button
          onClick={createClickHandler(onDuplicate)}
          className={buttonClass}
          title='Duplicate layer (Ctrl+D)'
          style={{ padding: '4px', fontSize: '16px' }}
        >
          📋
        </button>

        {/* Group Management */}
        {!groupName && onGroupLayers && (
          <button
            onClick={createClickHandler(() => onGroupLayers([layer.id]))}
            className={buttonClass}
            title='Add to group (Ctrl+G)'
            style={{ padding: '4px', fontSize: '14px' }}
          >
            📁
          </button>
        )}

        {groupName && onUngroupLayers && (
          <button
            onClick={createClickHandler(() => onUngroupLayers([layer.id]))}
            className={buttonClass}
            title={`Ungroup from "${groupName}" (Ctrl+Shift+G)`}
            style={{ padding: '4px', fontSize: '14px' }}
          >
            📂
          </button>
        )}

        {/* Move Layer Controls */}
        <div
          className='layer-move-controls'
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <button
            onClick={createClickHandler(onMoveUp)}
            className={buttonClass}
            disabled={!canMoveUp}
            title='Move layer up (Ctrl+↑)'
            style={{
              padding: '2px',
              fontSize: '12px',
              opacity: canMoveUp ? 1 : 0.3,
              transition: 'opacity 0.2s ease-out',
              cursor: canMoveUp ? 'pointer' : 'not-allowed',
            }}
          >
            ▲
          </button>
          <button
            onClick={createClickHandler(onMoveDown)}
            className={buttonClass}
            disabled={!canMoveDown}
            title='Move layer down (Ctrl+↓)'
            style={{
              padding: '2px',
              fontSize: '12px',
              opacity: canMoveDown ? 1 : 0.3,
              transition: 'opacity 0.2s ease-out',
              cursor: canMoveDown ? 'pointer' : 'not-allowed',
            }}
          >
            ▼
          </button>
        </div>

        {/* Delete Layer */}
        <button
          onClick={handleDelete}
          className={`${buttonClass} ${dangerButtonClass}`}
          title='Delete layer (Del)'
          style={{
            padding: '4px',
            fontSize: '16px',
            marginLeft: '4px',
          }}
        >
          🗑️
        </button>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title='Delete Layer'
          message={`Are you sure you want to delete "${layer.name}"?`}
          confirmLabel='Delete'
          cancelLabel='Cancel'
          theme={theme as 'frost_light' | 'frost_dark'}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal re-rendering
    return (
      prevProps.layer.id === nextProps.layer.id &&
      prevProps.layer.name === nextProps.layer.name &&
      prevProps.layer.type === nextProps.layer.type &&
      prevProps.layer.visible === nextProps.layer.visible &&
      prevProps.theme === nextProps.theme &&
      prevProps.actualIndex === nextProps.actualIndex &&
      prevProps.layerCount === nextProps.layerCount &&
      prevProps.groupName === nextProps.groupName
    );
  }
);

LayerControls.displayName = 'LayerControls';

export default LayerControls;
