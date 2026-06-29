import { useEffect, useRef } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private isEnabled = true;

  private getShortcutKey(
    config: Pick<ShortcutConfig, 'key' | 'ctrl' | 'shift' | 'alt'>
  ): string {
    const parts = [];
    if (config.ctrl) parts.push('ctrl');
    if (config.shift) parts.push('shift');
    if (config.alt) parts.push('alt');
    parts.push(config.key.toLowerCase());
    return parts.join('+');
  }

  register(config: ShortcutConfig) {
    const key = this.getShortcutKey(config);
    this.shortcuts.set(key, config);
  }

  unregister(config: Pick<ShortcutConfig, 'key' | 'ctrl' | 'shift' | 'alt'>) {
    const key = this.getShortcutKey(config);
    this.shortcuts.delete(key);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isEnabled) return;

    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');

    const key = event.key.toLowerCase();
    if (key === 'control' || key === 'shift' || key === 'alt' || key === 'meta')
      return;

    parts.push(key);
    const shortcutKey = parts.join('+');

    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  };

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  getShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  clear() {
    this.shortcuts.clear();
  }
}

export const useKeyboardShortcuts = (
  shortcuts: ShortcutConfig[],
  dependencies: any[] = []
) => {
  const managerRef = useRef(new KeyboardShortcutManager());

  useEffect(() => {
    const manager = managerRef.current;

    manager.clear();
    shortcuts.forEach(shortcut => manager.register(shortcut));

    const handleKeyDown = manager.handleKeyDown;
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      manager.clear();
    };
  }, [...dependencies, shortcuts]);

  return managerRef.current;
};

export const defaultLayerShortcuts: ShortcutConfig[] = [
  {
    key: 'd',
    ctrl: true,
    action: () => {},
    description: 'Duplicate selected layer',
  },
  {
    key: 'Delete',
    action: () => {},
    description: 'Delete selected layer',
  },
  {
    key: 'h',
    action: () => {},
    description: 'Toggle layer visibility',
  },
  {
    key: 'ArrowUp',
    ctrl: true,
    action: () => {},
    description: 'Move layer up',
  },
  {
    key: 'ArrowDown',
    ctrl: true,
    action: () => {},
    description: 'Move layer down',
  },
  {
    key: 'a',
    ctrl: true,
    action: () => {},
    description: 'Select all layers',
  },
  {
    key: 'Escape',
    action: () => {},
    description: 'Deselect all layers',
  },
  {
    key: 'c',
    ctrl: true,
    action: () => {},
    description: 'Copy selected layer',
  },
  {
    key: 'v',
    ctrl: true,
    action: () => {},
    description: 'Paste layer',
  },
  {
    key: 'z',
    ctrl: true,
    action: () => {},
    description: 'Undo',
  },
  {
    key: 'y',
    ctrl: true,
    action: () => {},
    description: 'Redo',
  },
];
