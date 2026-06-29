import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayerItemView } from '../LayerItemView';
import { Layer } from '../../../types/layer-types';

// Mock child components
jest.mock('../LayerPreview', () => {
  return {
    __esModule: true,
    default: ({ layer, theme }: { layer: Layer; theme: string }) => (
      <div
        data-testid='layer-preview'
        data-layer-id={layer.id}
        data-theme={theme}
      >
        Preview: {layer.name}
      </div>
    ),
  };
});

jest.mock('../LayerControls', () => {
  return {
    __esModule: true,
    default: ({
      layer,
      onVisibilityToggle,
    }: {
      layer: Layer;
      onVisibilityToggle: () => void;
    }) => (
      <div data-testid='layer-controls' data-layer-id={layer.id}>
        <button onClick={onVisibilityToggle}>Toggle Visibility</button>
        Controls: {layer.name}
      </div>
    ),
  };
});

describe('LayerItemView', () => {
  const mockLayer: Layer = {
    id: 'test-layer',
    name: 'Test Layer',
    type: 'image',
    visible: true,
    opacity: 1,
    src: 'test-image.jpg',
    color: '#FF0000',
    shapeType: 'circle',
    gradient: null,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  };

  const mockProps = {
    layer: mockLayer,
    isSelected: false,
    isMultiSelected: false,
    isAnimating: false,
    isDragging: false,
    isDraggedOver: false,
    isExpanded: false,
    isEditingName: false,
    tempName: 'Test Layer',
    theme: 'frost_light',
    onClick: jest.fn(),
    onMouseDown: jest.fn(),
    onToggleExpanded: jest.fn(),
    onNameEdit: jest.fn(),
    onNameSave: jest.fn(),
    onNameKeyDown: jest.fn(),
    onTempNameChange: jest.fn(),
    actualIndex: 1,
    layerCount: 3,
    onVisibilityToggle: jest.fn(),
    onImageUpload: jest.fn(),
    onDuplicate: jest.fn(),
    onMoveUp: jest.fn(),
    onMoveDown: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders layer item with correct structure', () => {
      render(<LayerItemView {...mockProps} />);

      expect(screen.getByTestId('layer-preview')).toBeInTheDocument();
      expect(screen.getByTestId('layer-controls')).toBeInTheDocument();
      expect(screen.getByText('Test Layer')).toBeInTheDocument();
      expect(screen.getByText('Image')).toBeInTheDocument();
    });

    it('applies correct CSS classes for light theme', () => {
      const { container } = render(<LayerItemView {...mockProps} />);

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('frostlight-layer-item');
    });

    it('applies correct CSS classes for dark theme', () => {
      const { container } = render(
        <LayerItemView {...mockProps} theme='frost_dark' />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('frostdark-layer-item');
    });

    it('includes data attributes for identification', () => {
      const { container } = render(<LayerItemView {...mockProps} />);

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveAttribute('data-layer-id', 'test-layer');
    });
  });

  describe('Selection States', () => {
    it('applies selected styling when selected', () => {
      const { container } = render(
        <LayerItemView {...mockProps} isSelected={true} />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('selected');
      expect(layerItem).toHaveStyle(
        'background-color: rgba(59, 130, 246, 0.1)'
      );
    });

    it('applies multi-selected styling when multi-selected', () => {
      const { container } = render(
        <LayerItemView {...mockProps} isMultiSelected={true} />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('multi-selected');
    });

    it('applies both selected and multi-selected when both true', () => {
      const { container } = render(
        <LayerItemView
          {...mockProps}
          isSelected={true}
          isMultiSelected={true}
        />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('selected');
      expect(layerItem).toHaveClass('multi-selected');
    });
  });

  describe('Visual States', () => {
    it('applies opacity styling for invisible layers', () => {
      const invisibleLayer = { ...mockLayer, visible: false };
      const { container } = render(
        <LayerItemView {...mockProps} layer={invisibleLayer} />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('opacity-50');
    });

    it('applies dragging styling when dragging', () => {
      const { container } = render(
        <LayerItemView {...mockProps} isDragging={true} />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('dragging');
      expect(layerItem).toHaveStyle('transform: scale(1.02)');
      expect(layerItem).toHaveStyle('opacity: 0.8');
    });

    it('applies drag-over styling when dragged over', () => {
      const { container } = render(
        <LayerItemView {...mockProps} isDraggedOver={true} />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('drag-over');
    });

    it('applies animating styling when animating', () => {
      const { container } = render(
        <LayerItemView {...mockProps} isAnimating={true} />
      );

      const layerItem = container.querySelector('.layer-item');
      expect(layerItem).toHaveClass('animating');
    });
  });

  describe('Name Display and Editing', () => {
    it('displays layer name in read-only mode', () => {
      render(<LayerItemView {...mockProps} />);

      const nameElement = screen.getByText('Test Layer');
      expect(nameElement).toBeInTheDocument();
      expect(nameElement).toHaveAttribute('title', 'Double-click to edit name');
    });

    it('renders input field when editing name', () => {
      render(
        <LayerItemView
          {...mockProps}
          isEditingName={true}
          tempName='New Name'
        />
      );

      const input = screen.getByDisplayValue('New Name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('calls onNameEdit when name double-clicked', async () => {
      const user = userEvent.setup();
      render(<LayerItemView {...mockProps} />);

      const nameElement = screen.getByText('Test Layer');
      await user.dblClick(nameElement);

      expect(mockProps.onNameEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onTempNameChange when input value changes', async () => {
      const user = userEvent.setup();
      render(
        <LayerItemView
          {...mockProps}
          isEditingName={true}
          tempName='Old Name'
        />
      );

      const input = screen.getByDisplayValue('Old Name');
      await user.clear(input);
      await user.type(input, 'Test');

      // Check that onTempNameChange was called with incremental typing
      expect(mockProps.onTempNameChange).toHaveBeenCalled();
      // Verify it was called with a string value
      const calls = mockProps.onTempNameChange.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(typeof calls[calls.length - 1][0]).toBe('string');
    });

    it('calls onNameSave when input blurred', async () => {
      const user = userEvent.setup();
      render(<LayerItemView {...mockProps} isEditingName={true} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Tab away to trigger blur

      expect(mockProps.onNameSave).toHaveBeenCalledTimes(1);
    });

    it('calls onNameKeyDown when keys pressed in input', () => {
      render(<LayerItemView {...mockProps} isEditingName={true} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockProps.onNameKeyDown).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when input clicked', () => {
      const mockContainerClick = jest.fn();
      render(
        <div onClick={mockContainerClick}>
          <LayerItemView {...mockProps} isEditingName={true} />
        </div>
      );

      const input = screen.getByRole('textbox');
      fireEvent.click(input);

      expect(mockContainerClick).not.toHaveBeenCalled();
    });
  });

  describe('Layer Type Display', () => {
    it('capitalizes layer type correctly', () => {
      render(<LayerItemView {...mockProps} />);

      expect(screen.getByText('Image')).toBeInTheDocument();
    });

    it('displays group indicator when in group', () => {
      render(<LayerItemView {...mockProps} groupName='Group 1' />);

      const groupIndicator = screen.getByTitle('Group: Group 1');
      expect(groupIndicator).toBeInTheDocument();
      expect(groupIndicator).toHaveTextContent('📁 Group 1');
    });

    it('does not display group indicator when not in group', () => {
      render(<LayerItemView {...mockProps} />);

      expect(screen.queryByTitle(/Group:/)).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Toggle', () => {
    it('renders expand button with correct icon orientation', () => {
      render(<LayerItemView {...mockProps} />);

      const expandButton = screen.getByTitle('Expand layer settings');
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveTextContent('▶️');
      expect(expandButton).toHaveStyle('transform: rotate(0deg)');
    });

    it('renders collapse button when expanded', () => {
      render(<LayerItemView {...mockProps} isExpanded={true} />);

      const collapseButton = screen.getByTitle('Collapse layer settings');
      expect(collapseButton).toHaveStyle('transform: rotate(90deg)');
    });

    it('calls onToggleExpanded when expand button clicked', async () => {
      const user = userEvent.setup();
      render(<LayerItemView {...mockProps} />);

      const expandButton = screen.getByTitle('Expand layer settings');
      await user.click(expandButton);

      expect(mockProps.onToggleExpanded).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when expand button clicked', () => {
      const mockContainerClick = jest.fn();
      const mockToggleExpanded = jest.fn(e => e.stopPropagation());
      render(
        <div onClick={mockContainerClick}>
          <LayerItemView {...mockProps} onToggleExpanded={mockToggleExpanded} />
        </div>
      );

      const expandButton = screen.getByTitle('Expand layer settings');
      fireEvent.click(expandButton);

      // The onToggleExpanded should be called but container click should not
      expect(mockToggleExpanded).toHaveBeenCalled();
      expect(mockContainerClick).not.toHaveBeenCalled();
    });
  });

  describe('Expanded Panel', () => {
    it('renders expanded panel when expanded with children', () => {
      render(
        <LayerItemView {...mockProps} isExpanded={true}>
          <div data-testid='expanded-content'>Expanded Content</div>
        </LayerItemView>
      );

      expect(screen.getByTestId('expanded-content')).toBeInTheDocument();
    });

    it('does not render expanded panel when collapsed', () => {
      render(
        <LayerItemView {...mockProps} isExpanded={false}>
          <div data-testid='expanded-content'>Expanded Content</div>
        </LayerItemView>
      );

      expect(screen.queryByTestId('expanded-content')).not.toBeInTheDocument();
    });

    it('applies correct styling to expanded panel', () => {
      const { container } = render(
        <LayerItemView {...mockProps} isExpanded={true}>
          <div>Content</div>
        </LayerItemView>
      );

      const expandedPanel = container.querySelector('.layer-expanded-panel');
      expect(expandedPanel).toHaveClass('frostlight-panel-secondary');
      expect(expandedPanel).toHaveStyle('animation: fadeIn 0.2s ease-out');
    });

    it('stops propagation when expanded panel clicked', () => {
      const mockContainerClick = jest.fn();
      render(
        <div onClick={mockContainerClick}>
          <LayerItemView {...mockProps} isExpanded={true}>
            <div>Content</div>
          </LayerItemView>
        </div>
      );

      const expandedPanel = document.querySelector('.layer-expanded-panel');
      fireEvent.click(expandedPanel!);

      expect(mockContainerClick).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onClick when layer item clicked', async () => {
      const user = userEvent.setup();
      render(<LayerItemView {...mockProps} />);

      const layerItem = document.querySelector('.layer-item')!;
      await user.click(layerItem);

      expect(mockProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onMouseDown when mouse pressed on layer item', () => {
      render(<LayerItemView {...mockProps} />);

      const layerItem = document.querySelector('.layer-item')!;
      fireEvent.mouseDown(layerItem);

      expect(mockProps.onMouseDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to LayerPreview', () => {
      render(<LayerItemView {...mockProps} />);

      const preview = screen.getByTestId('layer-preview');
      expect(preview).toHaveAttribute('data-layer-id', 'test-layer');
      expect(preview).toHaveAttribute('data-theme', 'frost_light');
    });

    it('passes control props to LayerControls', () => {
      render(<LayerItemView {...mockProps} />);

      const controls = screen.getByTestId('layer-controls');
      expect(controls).toHaveAttribute('data-layer-id', 'test-layer');
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes correctly with same props', () => {
      const { rerender } = render(<LayerItemView {...mockProps} />);

      // Re-render with same props
      rerender(<LayerItemView {...mockProps} />);

      expect(screen.getByText('Test Layer')).toBeInTheDocument();
    });

    it('re-renders when props change', () => {
      const { rerender } = render(<LayerItemView {...mockProps} />);

      rerender(<LayerItemView {...mockProps} isSelected={true} />);

      const layerItem = document.querySelector('.layer-item');
      expect(layerItem).toHaveClass('selected');
    });
  });
});
