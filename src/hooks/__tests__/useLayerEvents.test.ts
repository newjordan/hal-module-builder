import { renderHook, act } from '@testing-library/react';
import { useLayerEvents } from '../useLayerEvents';
import { Layer } from '../../types/layer-types';

describe('useLayerEvents', () => {
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
    color: '#ffffff',
  };

  const mockUpdateLayer = jest.fn();
  const mockRenameLayer = jest.fn();
  const mockOnDragStart = jest.fn();
  const mockOnLayerClick = jest.fn();
  const mockOnToggleExpanded = jest.fn();
  const mockSetIsEditingName = jest.fn();
  const mockSetTempName = jest.fn();

  const defaultProps = {
    layer: mockLayer,
    actualIndex: 0,
    updateLayer: mockUpdateLayer,
    renameLayer: mockRenameLayer,
    onDragStart: mockOnDragStart,
    onLayerClick: mockOnLayerClick,
    onToggleExpanded: mockOnToggleExpanded,
    isEditingName: false,
    setIsEditingName: mockSetIsEditingName,
    tempName: 'Test Layer',
    setTempName: mockSetTempName,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should initialize with all required event handlers', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      expect(result.current.handleImageUpload).toBeDefined();
      expect(result.current.fileInputRef).toBeDefined();
      expect(result.current.handleVisibilityToggle).toBeDefined();
      expect(result.current.handleNameEdit).toBeDefined();
      expect(result.current.handleNameSave).toBeDefined();
      expect(result.current.handleNameKeyDown).toBeDefined();
      expect(result.current.handleClick).toBeDefined();
      expect(result.current.handleToggleExpanded).toBeDefined();
      expect(result.current.handleMouseDown).toBeDefined();
    });
  });

  describe('handleVisibilityToggle', () => {
    it('should toggle layer visibility', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      act(() => {
        result.current.handleVisibilityToggle();
      });

      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        visible: false,
      });
    });

    it('should toggle visibility from false to true', () => {
      const propsWithInvisibleLayer = {
        ...defaultProps,
        layer: { ...mockLayer, visible: false },
      };

      const { result } = renderHook(() =>
        useLayerEvents(propsWithInvisibleLayer)
      );

      act(() => {
        result.current.handleVisibilityToggle();
      });

      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        visible: true,
      });
    });
  });

  describe('handleNameEdit', () => {
    it('should start name editing mode', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      act(() => {
        result.current.handleNameEdit();
      });

      expect(mockSetIsEditingName).toHaveBeenCalledWith(true);
      expect(mockSetTempName).toHaveBeenCalledWith('Test Layer');
    });
  });

  describe('handleNameSave', () => {
    it('should save valid name changes', () => {
      const propsWithNewName = {
        ...defaultProps,
        tempName: 'New Layer Name',
      };

      const { result } = renderHook(() => useLayerEvents(propsWithNewName));

      act(() => {
        result.current.handleNameSave();
      });

      expect(mockRenameLayer).toHaveBeenCalledWith(
        'test-layer-1',
        'New Layer Name'
      );
      expect(mockSetIsEditingName).toHaveBeenCalledWith(false);
    });

    it('should not save empty names', () => {
      const propsWithEmptyName = {
        ...defaultProps,
        tempName: '   ',
      };

      const { result } = renderHook(() => useLayerEvents(propsWithEmptyName));

      act(() => {
        result.current.handleNameSave();
      });

      expect(mockRenameLayer).not.toHaveBeenCalled();
      expect(mockSetIsEditingName).toHaveBeenCalledWith(false);
    });
  });

  describe('handleNameKeyDown', () => {
    it('should save on Enter key', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      const mockEvent = {
        key: 'Enter',
      } as React.KeyboardEvent;

      act(() => {
        result.current.handleNameKeyDown(mockEvent);
      });

      expect(mockRenameLayer).toHaveBeenCalledWith(
        'test-layer-1',
        'Test Layer'
      );
      expect(mockSetIsEditingName).toHaveBeenCalledWith(false);
    });

    it('should cancel on Escape key', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      const mockEvent = {
        key: 'Escape',
      } as React.KeyboardEvent;

      act(() => {
        result.current.handleNameKeyDown(mockEvent);
      });

      expect(mockSetIsEditingName).toHaveBeenCalledWith(false);
      expect(mockSetTempName).toHaveBeenCalledWith('Test Layer');
    });
  });

  describe('handleClick', () => {
    it('should call onLayerClick when provided', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleClick(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockOnLayerClick).toHaveBeenCalledWith('test-layer-1', mockEvent);
    });
  });

  describe('handleToggleExpanded', () => {
    it('should call onToggleExpanded when provided', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleToggleExpanded(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockOnToggleExpanded).toHaveBeenCalledWith('test-layer-1');
    });
  });

  describe('handleMouseDown', () => {
    it('should call onDragStart on left mouse button when not editing', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      const mockEvent = {
        button: 0,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseDown(mockEvent);
      });

      expect(mockOnDragStart).toHaveBeenCalledWith(mockLayer, 0, mockEvent);
    });

    it('should not call onDragStart when editing name', () => {
      const propsWithEditingName = {
        ...defaultProps,
        isEditingName: true,
      };

      const { result } = renderHook(() => useLayerEvents(propsWithEditingName));

      const mockEvent = {
        button: 0,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseDown(mockEvent);
      });

      expect(mockOnDragStart).not.toHaveBeenCalled();
    });

    it('should ignore non-left mouse buttons', () => {
      const { result } = renderHook(() => useLayerEvents(defaultProps));

      const mockEvent = {
        button: 1, // Middle mouse button
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseDown(mockEvent);
      });

      expect(mockOnDragStart).not.toHaveBeenCalled();
    });
  });

  describe('Performance requirements', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() =>
        useLayerEvents(defaultProps)
      );

      const initialHandlers = {
        handleClick: result.current.handleClick,
        handleVisibilityToggle: result.current.handleVisibilityToggle,
        handleNameEdit: result.current.handleNameEdit,
        handleNameSave: result.current.handleNameSave,
        handleMouseDown: result.current.handleMouseDown,
      };

      rerender();

      expect(result.current.handleClick).toBe(initialHandlers.handleClick);
      expect(result.current.handleVisibilityToggle).toBe(
        initialHandlers.handleVisibilityToggle
      );
      expect(result.current.handleNameEdit).toBe(
        initialHandlers.handleNameEdit
      );
      expect(result.current.handleNameSave).toBe(
        initialHandlers.handleNameSave
      );
      expect(result.current.handleMouseDown).toBe(
        initialHandlers.handleMouseDown
      );
    });
  });
});
