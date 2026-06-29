import React, { useMemo } from 'react';
import { Panel } from '../DesignLayout';
import type { Layer } from '../../../types';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onAddLayer: (type: Layer['type']) => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
}

const LAYER_TYPES: { value: Layer['type']; label: string; icon: string }[] = [
  { value: 'shape', label: 'Shape', icon: '◇' },
  { value: 'image', label: 'Image', icon: '🖼' },
  { value: 'equalizer', label: 'Equalizer', icon: '≋' },
  { value: 'radialText', label: 'Text', icon: 'T' },
];

export function LayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayer,
}: LayersPanelProps) {
  // Show newest layers at top
  const reversedLayers = useMemo(() => [...layers].reverse(), [layers]);

  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const headerActions = (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowAddMenu(!showAddMenu)}
        style={{
          background: 'rgba(100, 150, 255, 0.2)',
          border: 'none',
          borderRadius: 4,
          color: 'rgba(100, 150, 255, 1)',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        + Add
      </button>

      {showAddMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'rgba(40, 40, 45, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: 4,
            zIndex: 100,
            minWidth: 120,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {LAYER_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => {
                onAddLayer(type.value);
                setShowAddMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ width: 16, textAlign: 'center' }}>
                {type.icon}
              </span>
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Panel position='left' title='LAYERS' headerActions={headerActions}>
      {/* Close dropdown when clicking outside */}
      {showAddMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowAddMenu(false)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {reversedLayers.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: 13,
            }}
          >
            No layers yet.
            <br />
            <span style={{ fontSize: 12 }}>Click + Add to create one.</span>
          </div>
        ) : (
          reversedLayers.map((layer, index) => (
            <LayerListItem
              key={layer.id}
              layer={layer}
              isSelected={layer.id === selectedLayerId}
              onSelect={() => onSelectLayer(layer.id)}
              onToggleVisibility={() => onToggleVisibility(layer.id)}
              onDelete={() => onDeleteLayer(layer.id)}
              onDuplicate={() => onDuplicateLayer(layer.id)}
              onMoveUp={
                index > 0 ? () => onMoveLayer(layer.id, 'down') : undefined
              }
              onMoveDown={
                index < reversedLayers.length - 1
                  ? () => onMoveLayer(layer.id, 'up')
                  : undefined
              }
            />
          ))
        )}
      </div>
    </Panel>
  );
}

// Individual layer list item
interface LayerListItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: (() => void) | undefined;
  onMoveDown?: (() => void) | undefined;
}

function LayerListItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: LayerListItemProps) {
  const [showActions, setShowActions] = React.useState(false);

  const typeIcons: Record<string, string> = {
    shape: '◇',
    image: '🖼',
    equalizer: '≋',
    'radial-text': 'T',
    radialText: 'T',
    audio: '♫',
    'asset-generator': '⚙',
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: isSelected ? 'rgba(100, 150, 255, 0.15)' : 'transparent',
        borderRadius: 6,
        cursor: 'pointer',
        border: isSelected
          ? '1px solid rgba(100, 150, 255, 0.3)'
          : '1px solid transparent',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Visibility toggle */}
      <button
        onClick={e => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 2,
          cursor: 'pointer',
          color: layer.visible
            ? 'rgba(255, 255, 255, 0.7)'
            : 'rgba(255, 255, 255, 0.2)',
          fontSize: 14,
        }}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        {layer.visible ? '👁' : '○'}
      </button>

      {/* Layer type icon */}
      <span
        style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.5)',
          width: 16,
          textAlign: 'center',
        }}
      >
        {typeIcons[layer.type] || '?'}
      </span>

      {/* Layer name */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: layer.visible
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(255, 255, 255, 0.4)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {layer.name}
      </span>

      {/* Action buttons (show on hover) */}
      {showActions && (
        <div style={{ display: 'flex', gap: 2 }}>
          {onMoveUp && (
            <ActionButton
              icon='↑'
              title='Move up'
              onClick={e => {
                e.stopPropagation();
                onMoveUp();
              }}
            />
          )}
          {onMoveDown && (
            <ActionButton
              icon='↓'
              title='Move down'
              onClick={e => {
                e.stopPropagation();
                onMoveDown();
              }}
            />
          )}
          <ActionButton
            icon='⧉'
            title='Duplicate'
            onClick={e => {
              e.stopPropagation();
              onDuplicate();
            }}
          />
          <ActionButton
            icon='×'
            title='Delete'
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            danger
          />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: string;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '2px 4px',
        cursor: 'pointer',
        color: danger ? 'rgba(255, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        borderRadius: 3,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger
          ? 'rgba(255, 100, 100, 0.2)'
          : 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
    </button>
  );
}
