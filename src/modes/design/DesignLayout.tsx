import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

// Panel configuration
interface PanelState {
  collapsed: boolean;
  width: number;
}

interface DesignLayoutContextValue {
  leftPanel: PanelState;
  rightPanel: PanelState;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
}

const STORAGE_KEYS = {
  leftPanel: 'hal-design-left-panel',
  rightPanel: 'hal-design-right-panel',
};

const DEFAULT_PANEL_WIDTH = 280;
const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 400;

const DesignLayoutContext = createContext<DesignLayoutContextValue | null>(
  null
);

export function useDesignLayout(): DesignLayoutContextValue {
  const context = useContext(DesignLayoutContext);
  if (!context) {
    throw new Error('useDesignLayout must be used within DesignLayoutProvider');
  }
  return context;
}

interface DesignLayoutProviderProps {
  children: ReactNode;
}

export function DesignLayoutProvider({ children }: DesignLayoutProviderProps) {
  const [leftPanel, setLeftPanel] = useState<PanelState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.leftPanel);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { collapsed: false, width: DEFAULT_PANEL_WIDTH };
  });

  const [rightPanel, setRightPanel] = useState<PanelState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.rightPanel);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { collapsed: false, width: DEFAULT_PANEL_WIDTH };
  });

  // Persist panel states
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.leftPanel, JSON.stringify(leftPanel));
  }, [leftPanel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.rightPanel, JSON.stringify(rightPanel));
  }, [rightPanel]);

  const toggleLeftPanel = useCallback(() => {
    setLeftPanel(prev => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setRightPanel(prev => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  const setLeftPanelWidth = useCallback((width: number) => {
    setLeftPanel(prev => ({
      ...prev,
      width: Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width)),
    }));
  }, []);

  const setRightPanelWidth = useCallback((width: number) => {
    setRightPanel(prev => ({
      ...prev,
      width: Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width)),
    }));
  }, []);

  return (
    <DesignLayoutContext.Provider
      value={{
        leftPanel,
        rightPanel,
        toggleLeftPanel,
        toggleRightPanel,
        setLeftPanelWidth,
        setRightPanelWidth,
      }}
    >
      {children}
    </DesignLayoutContext.Provider>
  );
}

// Panel wrapper component for consistent styling
interface PanelProps {
  position: 'left' | 'right';
  title: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

export function Panel({
  position,
  title,
  children,
  headerActions,
}: PanelProps) {
  const { leftPanel, rightPanel, toggleLeftPanel, toggleRightPanel } =
    useDesignLayout();

  const panel = position === 'left' ? leftPanel : rightPanel;
  const toggle = position === 'left' ? toggleLeftPanel : toggleRightPanel;

  if (panel.collapsed) {
    return (
      <div
        style={{
          width: 40,
          height: '100%',
          background: 'rgba(30, 30, 35, 0.95)',
          borderLeft:
            position === 'right'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : 'none',
          borderRight:
            position === 'left'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
        }}
      >
        <button
          onClick={toggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            padding: 8,
            fontSize: 16,
            transform: position === 'left' ? 'rotate(-90deg)' : 'rotate(90deg)',
          }}
          title={`Expand ${title}`}
        >
          ▼
        </button>
        <span
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: 8,
            letterSpacing: 1,
          }}
        >
          {title}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: panel.width,
        height: '100%',
        background: 'rgba(30, 30, 35, 0.95)',
        borderLeft:
          position === 'right' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        borderRight:
          position === 'left' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(20, 20, 25, 0.5)',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: 0.5,
          }}
        >
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {headerActions}
          <button
            onClick={toggle}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: 4,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={`Collapse ${title}`}
          >
            {position === 'left' ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Main layout container
interface DesignLayoutProps {
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  children: ReactNode; // Center content (canvas)
}

export function DesignLayout({
  leftPanel,
  rightPanel,
  children,
}: DesignLayoutProps) {
  return (
    <DesignLayoutProvider>
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          background: '#1a1a1e',
        }}
      >
        {/* Left Panel */}
        {leftPanel}

        {/* Center Canvas Area */}
        <div
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>

        {/* Right Panel */}
        {rightPanel}
      </div>
    </DesignLayoutProvider>
  );
}
