import React, { useState } from 'react';
import { WidgetSettings } from '../../types/widget-types';

export interface WidgetControlsProps {
  settings: Partial<WidgetSettings>;
  onSettingsChange: (settings: Partial<WidgetSettings>) => void;
}

export const WidgetControls: React.FC<WidgetControlsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleCloseWidget = async () => {
    if (window.electronAPI?.closeWidget) {
      await window.electronAPI.closeWidget();
    }
  };

  const toggleClickThrough = () => {
    onSettingsChange({ clickThrough: !settings.clickThrough });
  };

  const adjustOpacity = (delta: number) => {
    const newOpacity = Math.max(
      0.1,
      Math.min(1, (settings.opacity || 1) + delta)
    );
    onSettingsChange({ opacity: newOpacity });
  };

  const adjustSize = (delta: number) => {
    const newSize = Math.max(
      100,
      Math.min(400, (settings.size || 200) + delta)
    );
    onSettingsChange({ size: newSize });
  };

  return (
    <div
      className='widget-controls'
      style={{
        position: 'absolute',
        top: '5px',
        right: '5px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: 1000,
      }}
    >
      {/* Main control button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title='Widget Controls'
      >
        ⋯
      </button>

      {/* Control menu */}
      {showMenu && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '120px',
            fontSize: '11px',
            color: 'white',
          }}
        >
          {/* Opacity controls */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ marginBottom: '2px' }}>
              Opacity: {Math.round((settings.opacity || 1) * 100)}%
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => adjustOpacity(-0.1)}
                style={buttonStyle}
                title='Decrease opacity'
              >
                −
              </button>
              <button
                onClick={() => adjustOpacity(0.1)}
                style={buttonStyle}
                title='Increase opacity'
              >
                +
              </button>
            </div>
          </div>

          {/* Size controls */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ marginBottom: '2px' }}>
              Size: {settings.size || 200}px
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => adjustSize(-20)}
                style={buttonStyle}
                title='Decrease size'
              >
                −
              </button>
              <button
                onClick={() => adjustSize(20)}
                style={buttonStyle}
                title='Increase size'
              >
                +
              </button>
            </div>
          </div>

          {/* Click through toggle */}
          <div style={{ marginBottom: '4px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <input
                type='checkbox'
                checked={settings.clickThrough || false}
                onChange={toggleClickThrough}
                style={{ width: '12px', height: '12px' }}
              />
              Click-through
            </label>
          </div>

          {/* Action buttons */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '4px',
            }}
          >
            <button
              onClick={() => {
                // Return to composer mode
                if (window.electronAPI?.closeWidget) {
                  window.electronAPI.closeWidget();
                }
              }}
              style={{
                ...buttonStyle,
                width: '100%',
                marginBottom: '2px',
                padding: '4px 8px',
              }}
              title='Return to composer'
            >
              📝 Composer
            </button>

            <button
              onClick={handleCloseWidget}
              style={{
                ...buttonStyle,
                width: '100%',
                backgroundColor: 'rgba(255, 64, 64, 0.3)',
                padding: '4px 8px',
              }}
              title='Close widget'
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '10px',
  padding: '2px 6px',
  minWidth: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
