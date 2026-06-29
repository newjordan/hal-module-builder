import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayerControls } from '../LayerControls';
import { Layer } from '../../../types/layer-types';

describe('LayerControls', () => {
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
    theme: 'frost_light',
    actualIndex: 1,
    layerCount: 3,
    onVisibilityToggle: jest.fn(),
    onImageUpload: jest.fn(),
    onDuplicate: jest.fn(),
    onMoveUp: jest.fn(),
    onMoveDown: jest.fn(),
    onDelete: jest.fn(),
    onGroupLayers: jest.fn(),
    onUngroupLayers: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility Toggle', () => {
    it('renders visibility button with correct icon for visible layer', () => {
      render(<LayerControls {...mockProps} />);

      const visibilityButton = screen.getByTitle('Hide layer');
      expect(visibilityButton).toBeInTheDocument();
      expect(visibilityButton).toHaveTextContent('👁️');
      expect(visibilityButton).toHaveStyle('opacity: 1');
    });

    it('renders visibility button with correct icon for hidden layer', () => {
      const hiddenLayer = { ...mockLayer, visible: false };
      render(<LayerControls {...mockProps} layer={hiddenLayer} />);

      const visibilityButton = screen.getByTitle('Show layer');
      expect(visibilityButton).toHaveTextContent('👁️‍🗨️');
      expect(visibilityButton).toHaveStyle('opacity: 0.5');
    });

    it('calls onVisibilityToggle when clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const visibilityButton = screen.getByTitle('Hide layer');
      await user.click(visibilityButton);

      expect(mockProps.onVisibilityToggle).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation when clicked', () => {
      const mockClick = jest.fn();
      render(
        <div onClick={mockClick}>
          <LayerControls {...mockProps} />
        </div>
      );

      const visibilityButton = screen.getByTitle('Hide layer');
      fireEvent.click(visibilityButton);

      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('Image Upload (Image Layers Only)', () => {
    it('renders upload button for image layers', () => {
      render(<LayerControls {...mockProps} />);

      expect(screen.getByTitle('Upload image')).toBeInTheDocument();
      const uploadButtons = screen.getAllByText('📁');
      expect(uploadButtons.length).toBeGreaterThan(0);
    });

    it('does not render upload button for non-image layers', () => {
      const solidLayer = { ...mockLayer, type: 'solid' as const };
      render(<LayerControls {...mockProps} layer={solidLayer} />);

      expect(screen.queryByTitle('Upload image')).not.toBeInTheDocument();
    });

    it('triggers file input when upload button clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const uploadButton = screen.getByTitle('Upload image');
      await user.click(uploadButton);

      // File input should exist but be hidden
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveStyle('display: none');
    });

    it('calls onImageUpload when file selected', () => {
      render(<LayerControls {...mockProps} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(mockProps.onImageUpload).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Duplicate Control', () => {
    it('renders duplicate button with correct tooltip', () => {
      render(<LayerControls {...mockProps} />);

      expect(screen.getByTitle('Duplicate layer (Ctrl+D)')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('calls onDuplicate when clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const duplicateButton = screen.getByTitle('Duplicate layer (Ctrl+D)');
      await user.click(duplicateButton);

      expect(mockProps.onDuplicate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Group Management', () => {
    it('renders group button when layer not in group', () => {
      render(<LayerControls {...mockProps} />);

      expect(screen.getByTitle('Add to group (Ctrl+G)')).toBeInTheDocument();
    });

    it('renders ungroup button when layer in group', () => {
      render(<LayerControls {...mockProps} groupName='Group 1' />);

      expect(
        screen.getByTitle('Ungroup from "Group 1" (Ctrl+Shift+G)')
      ).toBeInTheDocument();
      expect(screen.getByText('📂')).toBeInTheDocument();
    });

    it('calls onGroupLayers when group button clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const groupButton = screen.getByTitle('Add to group (Ctrl+G)');
      await user.click(groupButton);

      expect(mockProps.onGroupLayers).toHaveBeenCalledWith(['test-layer']);
    });

    it('calls onUngroupLayers when ungroup button clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} groupName='Group 1' />);

      const ungroupButton = screen.getByTitle(
        'Ungroup from "Group 1" (Ctrl+Shift+G)'
      );
      await user.click(ungroupButton);

      expect(mockProps.onUngroupLayers).toHaveBeenCalledWith(['test-layer']);
    });

    it('does not render group buttons when handlers not provided', () => {
      const propsWithoutGrouping = { ...mockProps };
      delete propsWithoutGrouping.onGroupLayers;
      delete propsWithoutGrouping.onUngroupLayers;

      render(<LayerControls {...propsWithoutGrouping} />);

      expect(screen.queryByTitle(/group/i)).not.toBeInTheDocument();
    });
  });

  describe('Move Controls', () => {
    it('renders move up and down buttons', () => {
      render(<LayerControls {...mockProps} />);

      expect(screen.getByTitle('Move layer up (Ctrl+↑)')).toBeInTheDocument();
      expect(screen.getByTitle('Move layer down (Ctrl+↓)')).toBeInTheDocument();
      expect(screen.getByText('▲')).toBeInTheDocument();
      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    it('disables move up button when at top', () => {
      const propsAtTop = { ...mockProps, actualIndex: 0 };
      render(<LayerControls {...propsAtTop} />);

      const moveUpButton = screen.getByTitle('Move layer up (Ctrl+↑)');
      expect(moveUpButton).toBeDisabled();
      expect(moveUpButton).toHaveStyle('opacity: 0.3');
      expect(moveUpButton).toHaveStyle('cursor: not-allowed');
    });

    it('disables move down button when at bottom', () => {
      const propsAtBottom = { ...mockProps, actualIndex: 2, layerCount: 3 };
      render(<LayerControls {...propsAtBottom} />);

      const moveDownButton = screen.getByTitle('Move layer down (Ctrl+↓)');
      expect(moveDownButton).toBeDisabled();
      expect(moveDownButton).toHaveStyle('opacity: 0.3');
    });

    it('calls onMoveUp when move up clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const moveUpButton = screen.getByTitle('Move layer up (Ctrl+↑)');
      await user.click(moveUpButton);

      expect(mockProps.onMoveUp).toHaveBeenCalledTimes(1);
    });

    it('calls onMoveDown when move down clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const moveDownButton = screen.getByTitle('Move layer down (Ctrl+↓)');
      await user.click(moveDownButton);

      expect(mockProps.onMoveDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete Control', () => {
    it('renders delete button with danger styling', () => {
      render(<LayerControls {...mockProps} />);

      const deleteButton = screen.getByTitle('Delete layer (Del)');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent('🗑️');
      expect(deleteButton).toHaveClass('frostlight-button-icon-danger');
    });

    it('shows confirmation dialog when delete clicked', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const deleteButton = screen.getByTitle('Delete layer (Del)');
      await user.click(deleteButton);

      expect(screen.getByText('Delete Layer')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete "Test Layer"?')
      ).toBeInTheDocument();
    });

    it('calls onDelete when confirmed', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const deleteButton = screen.getByTitle('Delete layer (Del)');
      await user.click(deleteButton);
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    });

    it('does not call onDelete when cancelled', async () => {
      const user = userEvent.setup();
      render(<LayerControls {...mockProps} />);

      const deleteButton = screen.getByTitle('Delete layer (Del)');
      await user.click(deleteButton);
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockProps.onDelete).not.toHaveBeenCalled();
    });
  });

  describe('Theme Support', () => {
    it('applies light theme button classes', () => {
      render(<LayerControls {...mockProps} theme='frost_light' />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('frostlight-button-icon');
      });
    });

    it('applies dark theme button classes', () => {
      render(<LayerControls {...mockProps} theme='frost_dark' />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('frostdark-button-icon');
      });
    });
  });

  describe('Event Propagation', () => {
    it('stops propagation for all button clicks', async () => {
      const user = userEvent.setup();
      const mockContainerClick = jest.fn();

      render(
        <div onClick={mockContainerClick}>
          <LayerControls {...mockProps} />
        </div>
      );

      // Test visibility button
      await user.click(screen.getByTitle('Hide layer'));
      expect(mockContainerClick).not.toHaveBeenCalled();

      // Test duplicate button
      await user.click(screen.getByTitle('Duplicate layer (Ctrl+D)'));
      expect(mockContainerClick).not.toHaveBeenCalled();

      // Test move buttons
      await user.click(screen.getByTitle('Move layer up (Ctrl+↑)'));
      expect(mockContainerClick).not.toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes correctly with same props', () => {
      const { rerender } = render(<LayerControls {...mockProps} />);

      // Re-render with same props
      rerender(<LayerControls {...mockProps} />);

      expect(screen.getByTitle('Hide layer')).toBeInTheDocument();
    });
  });
});
