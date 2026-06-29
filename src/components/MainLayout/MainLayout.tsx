import React, { ReactNode, useEffect, useRef } from 'react';
import { initResizablePanel, cleanupResizablePanel } from '../../resize-panel';
import { useTheme } from '../ThemeSystem/ThemeProvider';

interface MainLayoutProps {
  children: ReactNode;
  showControls?: boolean;
  debugOverlay?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showControls = true,
  debugOverlay = false,
}) => {
  const { theme } = useTheme();

  // Initialize resizable panel
  useEffect(() => {
    if (!showControls) {
      return undefined;
    }

    const instance = initResizablePanel();

    return () => {
      instance?.cleanup();
      cleanupResizablePanel();
    };
  }, [showControls]);

  return (
    <div className={`hal-demo ${theme}`}>
      {debugOverlay && (
        <div
          className='debug-overlay'
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px',
            zIndex: 1000,
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          Debug Mode Active
        </div>
      )}

      <div className='main-layout'>{children}</div>
    </div>
  );
};

interface SidebarProps {
  children: ReactNode;
  showControls: boolean;
  onToggleControls: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  showControls,
  onToggleControls,
}) => {
  const { theme } = useTheme();
  const resizablePanelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={resizablePanelRef}
      className={`${theme} sidebar`}
      style={{
        width: showControls ? '400px' : '0px',
        minWidth: showControls ? '320px' : '0px',
        maxWidth: showControls ? '600px' : '0px',
        transition: showControls ? 'none' : 'width 0.3s ease',
      }}
    >
      {showControls && <div className='sidebar-content'>{children}</div>}

      <button
        className='sidebar-toggle'
        onClick={onToggleControls}
        title={showControls ? 'Hide Controls' : 'Show Controls'}
        style={{
          position: 'absolute',
          right: showControls ? '10px' : '-30px',
          top: '10px',
          zIndex: 10,
        }}
      >
        {showControls ? '◀' : '▶'}
      </button>
    </div>
  );
};

interface WorkspaceAreaProps {
  children: ReactNode;
}

export const WorkspaceArea: React.FC<WorkspaceAreaProps> = ({ children }) => {
  return (
    <div
      className='workspace-area'
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

export default MainLayout;
