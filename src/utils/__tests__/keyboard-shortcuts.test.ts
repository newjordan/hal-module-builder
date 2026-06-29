import {
  KeyboardShortcutManager,
  ShortcutConfig,
  useKeyboardShortcuts,
} from '../keyboard-shortcuts';
import { renderHook } from '@testing-library/react';

describe('KeyboardShortcutManager', () => {
  let manager: KeyboardShortcutManager;
  let mockAction: jest.Mock;

  beforeEach(() => {
    manager = new KeyboardShortcutManager();
    mockAction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shortcut registration', () => {
    it('should register simple key shortcut', () => {
      const config: ShortcutConfig = {
        key: 's',
        action: mockAction,
        description: 'Save',
      };

      manager.register(config);

      // Simulate keydown event
      const event = new KeyboardEvent('keydown', { key: 's' });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should register ctrl+key shortcut', () => {
      const config: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should register complex shortcut with modifiers', () => {
      const config: ShortcutConfig = {
        key: 'z',
        ctrl: true,
        shift: true,
        action: mockAction,
        description: 'Redo',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should handle meta key as ctrl on Mac', () => {
      const config: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true, // Mac command key
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should handle alt modifier', () => {
      const config: ShortcutConfig = {
        key: 'f4',
        alt: true,
        action: mockAction,
        description: 'Close',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', {
        key: 'f4',
        altKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('shortcut unregistration', () => {
    it('should unregister shortcut', () => {
      const config: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      manager.register(config);
      manager.unregister(config);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should only unregister exact matches', () => {
      const config1: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      const config2: ShortcutConfig = {
        key: 's',
        action: jest.fn(),
        description: 'Search',
      };

      manager.register(config1);
      manager.register(config2);
      manager.unregister({ key: 's' }); // Only unregister plain 's'

      // Ctrl+S should still work
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('key handling behavior', () => {
    beforeEach(() => {
      const config: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };
      manager.register(config);
    });

    it('should ignore shortcuts in input fields', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: input });
      manager.handleKeyDown(event);

      expect(mockAction).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should ignore shortcuts in textarea', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: textarea });
      manager.handleKeyDown(event);

      expect(mockAction).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should ignore shortcuts in contentEditable elements', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div });
      manager.handleKeyDown(event);

      expect(mockAction).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should handle shortcuts when disabled is false', () => {
      manager.setEnabled(true);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not handle shortcuts when disabled', () => {
      manager.setEnabled(false);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).not.toHaveBeenCalled();
    });
  });

  describe('case sensitivity', () => {
    it('should handle uppercase keys', () => {
      const config: ShortcutConfig = {
        key: 'S',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should normalize key case in registration', () => {
      const config: ShortcutConfig = {
        key: 'S', // Uppercase
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', {
        key: 's', // lowercase in event
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('shortcut conflicts', () => {
    it('should handle duplicate shortcut registration', () => {
      const action1 = jest.fn();
      const action2 = jest.fn();

      const config1: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: action1,
        description: 'Save',
      };

      const config2: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: action2,
        description: 'Save As',
      };

      manager.register(config1);
      manager.register(config2); // Should overwrite config1

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(action1).not.toHaveBeenCalled();
      expect(action2).toHaveBeenCalledTimes(1);
    });
  });

  describe('utility methods', () => {
    it('should get registered shortcuts', () => {
      const config1: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      const config2: ShortcutConfig = {
        key: 'o',
        ctrl: true,
        action: jest.fn(),
        description: 'Open',
      };

      manager.register(config1);
      manager.register(config2);

      const shortcuts = manager.getRegisteredShortcuts();

      expect(shortcuts).toHaveLength(2);
      expect(shortcuts.some(s => s.description === 'Save')).toBe(true);
      expect(shortcuts.some(s => s.description === 'Open')).toBe(true);
    });

    it('should clear all shortcuts', () => {
      const config: ShortcutConfig = {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      };

      manager.register(config);
      manager.clear();

      const shortcuts = manager.getRegisteredShortcuts();
      expect(shortcuts).toHaveLength(0);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should check if enabled', () => {
      expect(manager.isEnabled()).toBe(true);

      manager.setEnabled(false);
      expect(manager.isEnabled()).toBe(false);

      manager.setEnabled(true);
      expect(manager.isEnabled()).toBe(true);
    });
  });

  describe('special keys', () => {
    it('should handle function keys', () => {
      const config: ShortcutConfig = {
        key: 'F1',
        action: mockAction,
        description: 'Help',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', { key: 'F1' });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should handle arrow keys', () => {
      const config: ShortcutConfig = {
        key: 'ArrowLeft',
        shift: true,
        action: mockAction,
        description: 'Select left',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        shiftKey: true,
      });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should handle space key', () => {
      const config: ShortcutConfig = {
        key: ' ',
        action: mockAction,
        description: 'Play/Pause',
      };

      manager.register(config);

      const event = new KeyboardEvent('keydown', { key: ' ' });
      manager.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useKeyboardShortcuts hook', () => {
  it('should register shortcuts on mount', () => {
    const mockAction = jest.fn();
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate keydown event
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('should cleanup shortcuts on unmount', () => {
    const mockAction = jest.fn();
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        ctrl: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
    unmount();

    // Simulate keydown event after unmount
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should update shortcuts when dependencies change', () => {
    const mockAction1 = jest.fn();
    const mockAction2 = jest.fn();

    const shortcuts1: ShortcutConfig[] = [
      {
        key: 's',
        ctrl: true,
        action: mockAction1,
        description: 'Save',
      },
    ];

    const shortcuts2: ShortcutConfig[] = [
      {
        key: 's',
        ctrl: true,
        action: mockAction2,
        description: 'Save As',
      },
    ];

    const { rerender } = renderHook(
      ({ shortcuts }) => useKeyboardShortcuts(shortcuts),
      { initialProps: { shortcuts: shortcuts1 } }
    );

    // Rerender with new shortcuts
    rerender({ shortcuts: shortcuts2 });

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    document.dispatchEvent(event);

    expect(mockAction1).not.toHaveBeenCalled();
    expect(mockAction2).toHaveBeenCalledTimes(1);
  });
});
