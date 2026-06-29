/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateSaveDialog, TemplateLoadDialog } from '../';
import { Layer, Preset } from '../../../types/layer-types';

describe('TemplateSaveDialog', () => {
  const mockLayers: Layer[] = [
    {
      id: 'test-layer',
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
    },
  ];

  const defaultProps = {
    presetName: '',
    layers: mockLayers,
    isOpen: true,
    onPresetNameChange: jest.fn(),
    onSave: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<TemplateSaveDialog {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(/enter preset name/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/save preset/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TemplateSaveDialog {...defaultProps} isOpen={false} />);
    expect(screen.getByText(/save preset/i)).toBeInTheDocument(); // Shows button
    expect(
      screen.queryByPlaceholderText(/enter preset name/i)
    ).not.toBeInTheDocument(); // Dialog not shown
  });

  it('handles save action', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    render(<TemplateSaveDialog {...defaultProps} onSave={onSave} />);

    const nameInput = screen.getByPlaceholderText(/enter preset name/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    await user.type(nameInput, 'Test Template');
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith('Test Template');
  });

  it('calls onClose when cancelled', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<TemplateSaveDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});

describe('TemplateLoadDialog', () => {
  const mockPresets: Preset[] = [
    {
      id: '1',
      name: 'Test Preset 1',
      timestamp: Date.now(),
      layers: [
        {
          id: 'layer-1',
          name: 'Layer 1',
          type: 'solid',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          color: '#ff0000',
        },
      ],
    },
    {
      id: '2',
      name: 'Test Preset 2',
      timestamp: Date.now() - 1000,
      layers: [],
    },
  ];

  const defaultProps = {
    presets: mockPresets,
    isOpen: true,
    onLoad: jest.fn(),
    onDelete: jest.fn(),
    onExport: jest.fn(),
    onImport: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders preset list when open', () => {
    render(<TemplateLoadDialog {...defaultProps} />);
    expect(screen.getByText(/load preset/i)).toBeInTheDocument();
    expect(screen.getByText('Test Preset 1')).toBeInTheDocument();
    expect(screen.getByText('Test Preset 2')).toBeInTheDocument();
  });

  it('handles load action', async () => {
    const user = userEvent.setup();
    const onLoad = jest.fn();

    render(<TemplateLoadDialog {...defaultProps} onLoad={onLoad} />);

    const loadButton = screen.getByText('Test Preset 1');
    await user.click(loadButton);

    expect(onLoad).toHaveBeenCalledWith(mockPresets[0]);
  });

  it('handles delete action', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    render(<TemplateLoadDialog {...defaultProps} onDelete={onDelete} />);

    // Find the delete button (×)
    const deleteButtons = screen.getAllByText('×');

    // First click shows confirmation
    await user.click(deleteButtons[0]);

    // Second click actually deletes
    const confirmButton = screen.getByText('✓ Delete');
    await user.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith(mockPresets[0].id);
  });

  it('shows empty state when no presets', () => {
    render(<TemplateLoadDialog {...defaultProps} presets={[]} />);
    expect(screen.getByText(/no presets saved yet/i)).toBeInTheDocument();
  });
});
