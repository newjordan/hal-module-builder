import React, { createContext, useContext, ReactNode } from 'react';
import { useKeyboardShortcuts } from '../../utils/keyboard-shortcuts';

export interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface ShortcutContextValue {
  shortcuts: ShortcutDefinition[];
  registerShortcut: (shortcut: ShortcutDefinition) => void;
  unregisterShortcut: (key: string) => void;
  enableShortcut: (key: string) => void;
  disableShortcut: (key: string) => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export const useShortcuts = () => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error(
      'useShortcuts must be used within KeyboardShortcutProvider'
    );
  }
  return context;
};

interface KeyboardShortcutProviderProps {
  children: ReactNode;
  shortcuts: ShortcutDefinition[];
}

export const KeyboardShortcutProvider: React.FC<
  KeyboardShortcutProviderProps
> = ({ children, shortcuts: initialShortcuts }) => {
  const [shortcuts, setShortcuts] =
    React.useState<ShortcutDefinition[]>(initialShortcuts);

  // Use the existing keyboard shortcuts hook
  useKeyboardShortcuts(
    shortcuts.filter(s => s.enabled !== false),
    [shortcuts]
  );

  const registerShortcut = React.useCallback((shortcut: ShortcutDefinition) => {
    setShortcuts(prev => {
      const existing = prev.findIndex(s => s.key === shortcut.key);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = shortcut;
        return updated;
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = React.useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  const enableShortcut = React.useCallback((key: string) => {
    setShortcuts(prev =>
      prev.map(s => (s.key === key ? { ...s, enabled: true } : s))
    );
  }, []);

  const disableShortcut = React.useCallback((key: string) => {
    setShortcuts(prev =>
      prev.map(s => (s.key === key ? { ...s, enabled: false } : s))
    );
  }, []);

  const value = React.useMemo(
    () => ({
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      enableShortcut,
      disableShortcut,
    }),
    [
      shortcuts,
      registerShortcut,
      unregisterShortcut,
      enableShortcut,
      disableShortcut,
    ]
  );

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
};

export default KeyboardShortcutProvider;
