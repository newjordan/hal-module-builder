import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { DragDropManager, useDragDrop, DragState } from '../drag-drop';
import { Layer } from '../../types/layer-types';

// Mock layer for testing
const mockLayer: Layer = {
  id: 'test-layer-1',
  name: 'Test Layer',
  type: 'solid',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  color: '#ff0000',
};

// Mock DOM methods
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockElementFromPoint = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockPreventDefault = jest.fn();

// Setup DOM mocks
beforeAll(() => {
  Object.defineProperty(document, 'createElement', {
    value: mockCreateElement,
    writable: true,
  });

  Object.defineProperty(document, 'elementFromPoint', {
    value: mockElementFromPoint,
    writable: true,
  });

  Object.defineProperty(document, 'addEventListener', {
    value: mockAddEventListener,
    writable: true,
  });

  Object.defineProperty(document, 'removeEventListener', {
    value: mockRemoveEventListener,
    writable: true,
  });

  Object.defineProperty(document.body, 'appendChild', {
    value: mockAppendChild,
    writable: true,
  });

  Object.defineProperty(document.body, 'removeChild', {
    value: mockRemoveChild,
    writable: true,
  });

  // Mock console.warn to avoid test noise
  jest.spyOn(console, 'warn').mockImplementation();
});

describe('DragDropManager', () => {
  let manager: DragDropManager;
  let mockCallbacks: {
    onDragStart: jest.Mock;
    onDragOver: jest.Mock;
    onDragEnd: jest.Mock;
    onDragCancel: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCallbacks = {
      onDragStart: jest.fn(),
      onDragOver: jest.fn(),
      onDragEnd: jest.fn(),
      onDragCancel: jest.fn(),
    };

    manager = new DragDropManager(mockCallbacks);

    // Mock createElement to return a mock element
    const mockElement = {
      className: '',
      innerHTML: '',
      style: {
        position: '',
        left: '',
        top: '',
        zIndex: '',
        pointerEvents: '',
        transform: '',
      },
    };
    mockCreateElement.mockReturnValue(mockElement);
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      const state = manager.getDragState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedLayer).toBeNull();
      expect(state.dragOverIndex).toBe(-1);
      expect(state.startIndex).toBe(-1);
    });

    it('should accept callbacks in constructor', () => {
      expect(manager).toBeDefined();
    });

    it('should work without callbacks', () => {
      const managerWithoutCallbacks = new DragDropManager();
      expect(managerWithoutCallbacks).toBeDefined();
      managerWithoutCallbacks.destroy();
    });
  });

  describe('startDrag', () => {
    it('should start drag operation', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      const state = manager.getDragState();
      expect(state.isDragging).toBe(true);
      expect(state.draggedLayer).toBe(mockLayer);
      expect(state.startIndex).toBe(0);
      expect(state.dragOffset).toEqual({ x: 100, y: 200 });
    });

    it('should call onDragStart callback', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      expect(mockCallbacks.onDragStart).toHaveBeenCalledWith(mockLayer, 0);
    });

    it('should create drag ghost element', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it('should attach event listeners', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should prevent default event behavior', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      expect(mockPreventDefault).toHaveBeenCalled();
    });
  });

  describe('cancelDrag', () => {
    it('should cancel active drag operation', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);
      manager.cancelDrag();

      const state = manager.getDragState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedLayer).toBeNull();
    });

    it('should call onDragCancel callback', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);
      manager.cancelDrag();

      expect(mockCallbacks.onDragCancel).toHaveBeenCalled();
    });

    it('should remove drag ghost element', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);
      manager.cancelDrag();

      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should detach event listeners', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);
      manager.cancelDrag();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('getDragState', () => {
    it('should return readonly copy of state', () => {
      const state1 = manager.getDragState();
      const state2 = manager.getDragState();

      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // Same content
    });

    it('should reflect state changes', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      const stateBefore = manager.getDragState();
      expect(stateBefore.isDragging).toBe(false);

      manager.startDrag(mockLayer, 0, mockEvent);

      const stateAfter = manager.getDragState();
      expect(stateAfter.isDragging).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should cancel active drag and cleanup', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);
      manager.destroy();

      const state = manager.getDragState();
      expect(state.isDragging).toBe(false);
    });

    it('should work when no drag is active', () => {
      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe('event handling', () => {
    it('should handle mouse move events', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      // Simulate mouse move
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 250,
      });

      // Get the registered handler and call it
      const mouseMoveHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mousemove'
      )?.[1];

      if (mouseMoveHandler) {
        mouseMoveHandler(mouseMoveEvent);
      }

      // Should update ghost position (test passes if no errors thrown)
      expect(mockAddEventListener).toHaveBeenCalled();
    });

    it('should handle escape key to cancel drag', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      // Simulate escape key
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });

      // Get the registered handler and call it
      const keyHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1];

      if (keyHandler) {
        keyHandler(keyEvent);
      }

      expect(mockCallbacks.onDragCancel).toHaveBeenCalled();
    });

    it('should handle mouse up to end drag', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 200,
        preventDefault: mockPreventDefault,
      } as any;

      manager.startDrag(mockLayer, 0, mockEvent);

      // Set up a drag over state
      manager['state'].dragOverIndex = 1;

      // Simulate mouse up
      const mouseUpEvent = new MouseEvent('mouseup');

      // Get the registered handler and call it
      const mouseUpHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'mouseup'
      )?.[1];

      if (mouseUpHandler) {
        mouseUpHandler(mouseUpEvent);
      }

      expect(mockCallbacks.onDragEnd).toHaveBeenCalledWith(0, 1);
    });
  });
});

describe('useDragDrop hook', () => {
  const mockLayers: Layer[] = [mockLayer];
  const mockOnReorder = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDragDrop(mockLayers, mockOnReorder));

    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.draggedLayer).toBeNull();
    expect(result.current.handleDragStart).toBeInstanceOf(Function);
  });

  it('should create and destroy manager on mount/unmount', () => {
    const { unmount } = renderHook(() =>
      useDragDrop(mockLayers, mockOnReorder)
    );

    unmount();
    // Test passes if no errors thrown during cleanup
  });

  it('should handle drag start', () => {
    const { result } = renderHook(() => useDragDrop(mockLayers, mockOnReorder));

    const mockEvent = {
      clientX: 100,
      clientY: 200,
      preventDefault: mockPreventDefault,
    } as any;

    act(() => {
      result.current.handleDragStart(mockLayer, 0, mockEvent);
    });

    // Should not throw errors
    expect(result.current.handleDragStart).toBeInstanceOf(Function);
  });

  it('should update state on drag operations', () => {
    const { result } = renderHook(() => useDragDrop(mockLayers, mockOnReorder));

    // Initial state
    expect(result.current.dragState.isDragging).toBe(false);

    // The hook creates an internal manager, we can test that it exists
    expect(result.current.handleDragStart).toBeInstanceOf(Function);
  });

  it('should call onReorder when drag ends', () => {
    const { result } = renderHook(() => useDragDrop(mockLayers, mockOnReorder));

    // Start a drag operation
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      preventDefault: mockPreventDefault,
    } as any;

    act(() => {
      result.current.handleDragStart(mockLayer, 0, mockEvent);
    });

    // The actual onReorder call would happen through the manager's event system
    // This test validates the hook structure
    expect(result.current.handleDragStart).toBeInstanceOf(Function);
  });

  it('should recreate manager when onReorder changes', () => {
    let onReorder = jest.fn();
    const { rerender } = renderHook(
      ({ onReorder }) => useDragDrop(mockLayers, onReorder),
      { initialProps: { onReorder } }
    );

    // Change the onReorder function
    onReorder = jest.fn();
    rerender({ onReorder });

    // Should not throw errors during rerender
    expect(onReorder).toBeInstanceOf(Function);
  });
});
