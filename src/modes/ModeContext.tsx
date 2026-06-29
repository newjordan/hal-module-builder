import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

export type AppMode = 'present' | 'design';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isPresenting: boolean;
  isDesigning: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

const STORAGE_KEY = 'hal-app-mode';

interface ModeProviderProps {
  children: React.ReactNode;
  defaultMode?: AppMode;
}

export function ModeProvider({
  children,
  defaultMode = 'design',
}: ModeProviderProps) {
  const [mode, setModeState] = useState<AppMode>(() => {
    // Restore from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['present', 'design'].includes(stored)) {
        return stored as AppMode;
      }
    }
    return defaultMode;
  });

  // Persist mode changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
  }, []);

  // Keyboard shortcuts for mode switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + number to switch modes
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setMode('present');
            break;
          case '2':
            e.preventDefault();
            setMode('design');
            break;
        }
      }
      // Escape to exit present mode back to design
      if (e.key === 'Escape') {
        if (mode === 'present') {
          setMode('design');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode]);

  const value: ModeContextValue = {
    mode,
    setMode,
    isPresenting: mode === 'present',
    isDesigning: mode === 'design',
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}

// Hook for components that only need to know if we're in a specific mode
export function useIsMode(targetMode: AppMode): boolean {
  const { mode } = useMode();
  return mode === targetMode;
}
