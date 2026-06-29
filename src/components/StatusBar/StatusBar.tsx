import React from 'react';
import { useTheme } from '../ThemeSystem/ThemeProvider';

interface StatusBarProps {
  layerCount: number;
  selectedCount: number;
  audioActive: boolean;
  performanceMode?: 'normal' | 'optimized';
  memoryUsage?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  layerCount,
  selectedCount,
  audioActive,
  performanceMode = 'normal',
  memoryUsage,
}) => {
  const { theme, themeClasses } = useTheme();

  return (
    <div
      className={`status-bar ${themeClasses.standardCard}`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '12px',
        zIndex: 100,
      }}
    >
      <div className='status-left' style={{ display: 'flex', gap: '16px' }}>
        <span>Layers: {layerCount}</span>
        {selectedCount > 0 && <span>Selected: {selectedCount}</span>}
      </div>

      <div className='status-center' style={{ display: 'flex', gap: '16px' }}>
        <span className={audioActive ? 'status-active' : 'status-inactive'}>
          Audio: {audioActive ? '● Active' : '○ Inactive'}
        </span>
      </div>

      <div className='status-right' style={{ display: 'flex', gap: '16px' }}>
        {memoryUsage !== undefined && (
          <span>Memory: {memoryUsage.toFixed(1)}MB</span>
        )}
        <span>Mode: {performanceMode}</span>
        <span>Theme: {theme === 'frost_light' ? 'Light' : 'Dark'}</span>
      </div>
    </div>
  );
};

export default StatusBar;
