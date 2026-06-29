/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HalInterface } from '../HalInterface';
import { Layer } from '../../../types/layer-types';

// Mock the HalComposite component
jest.mock('../../HalComposite', () => ({
  HalComposite: jest.fn(
    ({ size, isActive, audioData, layers, onClick, theme, debugOverlay }) => (
      <div
        data-testid='hal-composite-mock'
        data-size={size}
        data-active={isActive}
        data-theme={theme}
        data-debug={debugOverlay}
        data-layers-count={layers.length}
        onClick={onClick}
      >
        HAL Composite Mock
      </div>
    )
  ),
}));

describe('HalInterface', () => {
  const mockOnHalClick = jest.fn();
  const mockSetShowControls = jest.fn();
  const mockSetDebugOverlay = jest.fn();
  const mockOnThemeToggle = jest.fn();
  const mockAudioData = new Array(64)
    .fill(0)
    .map((_, i) => Math.sin((i / 64) * Math.PI * 2) * 0.5 + 0.5);

  const createMockLayer = (overrides: Partial<Layer> = {}): Layer => ({
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
    ...overrides,
  });

  const defaultProps = {
    layers: [createMockLayer()],
    isActive: false,
    audioData: mockAudioData,
    onHalClick: mockOnHalClick,
    theme: 'frost_light' as const,
    debugOverlay: false,
    showControls: true,
    setShowControls: mockSetShowControls,
    setDebugOverlay: mockSetDebugOverlay,
    onThemeToggle: mockOnThemeToggle,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<HalInterface {...defaultProps} />);
      expect(screen.getByText('HAL 9000 LAYER COMPOSER')).toBeInTheDocument();
    });

    it('should render the main title', () => {
      render(<HalInterface {...defaultProps} />);
      const title = screen.getByText('HAL 9000 LAYER COMPOSER');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('hal-title', 'frost-text-primary');
    });

    it('should render the HalComposite component with correct props', () => {
      const { HalComposite } = require('../../HalComposite');

      render(<HalInterface {...defaultProps} />);

      expect(HalComposite).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 400,
          isActive: false,
          audioData: mockAudioData,
          layers: defaultProps.layers,
          onClick: mockOnHalClick,
          theme: 'frost_light',
          debugOverlay: false,
        }),
        expect.anything()
      );
    });

    it('should render the subtitle with correct text when inactive', () => {
      render(<HalInterface {...defaultProps} isActive={false} />);
      expect(
        screen.getByText('Click HAL to start listening')
      ).toBeInTheDocument();
    });

    it('should render the subtitle with correct text when active', () => {
      render(<HalInterface {...defaultProps} isActive={true} />);
      expect(
        screen.getByText('Click HAL to stop listening')
      ).toBeInTheDocument();
    });
  });

  describe('Control Buttons', () => {
    it('should render all control buttons', () => {
      render(<HalInterface {...defaultProps} />);

      expect(screen.getByText(/Hide Controls/)).toBeInTheDocument();
      expect(screen.getByText(/Show Debug/)).toBeInTheDocument();
      expect(screen.getByText(/Theme/)).toBeInTheDocument();
    });

    it('should show "Hide Controls" when showControls is true', () => {
      render(<HalInterface {...defaultProps} showControls={true} />);
      expect(screen.getByText('🎛️ Hide Controls')).toBeInTheDocument();
    });

    it('should show "Show Controls" when showControls is false', () => {
      render(<HalInterface {...defaultProps} showControls={false} />);
      expect(screen.getByText('🎛️ Show Controls')).toBeInTheDocument();
    });

    it('should show "Hide Debug" when debugOverlay is true', () => {
      render(<HalInterface {...defaultProps} debugOverlay={true} />);
      expect(screen.getByText('🔍 Hide Debug')).toBeInTheDocument();
    });

    it('should show "Show Debug" when debugOverlay is false', () => {
      render(<HalInterface {...defaultProps} debugOverlay={false} />);
      expect(screen.getByText('🔍 Show Debug')).toBeInTheDocument();
    });

    it('should show moon icon for light theme', () => {
      render(<HalInterface {...defaultProps} theme='frost_light' />);
      expect(screen.getByText('🌙 Theme')).toBeInTheDocument();
    });

    it('should show sun icon for dark theme', () => {
      render(<HalInterface {...defaultProps} theme='frost_dark' />);
      expect(screen.getByText('☀️ Theme')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call setShowControls when controls button is clicked', () => {
      render(<HalInterface {...defaultProps} showControls={true} />);

      const controlsButton = screen.getByText('🎛️ Hide Controls');
      fireEvent.click(controlsButton);

      expect(mockSetShowControls).toHaveBeenCalledWith(false);
    });

    it('should call setDebugOverlay when debug button is clicked', () => {
      render(<HalInterface {...defaultProps} debugOverlay={false} />);

      const debugButton = screen.getByText('🔍 Show Debug');
      fireEvent.click(debugButton);

      expect(mockSetDebugOverlay).toHaveBeenCalledWith(true);
    });

    it('should call onThemeToggle when theme button is clicked', () => {
      render(<HalInterface {...defaultProps} />);

      const themeButton = screen.getByText('🌙 Theme');
      fireEvent.click(themeButton);

      expect(mockOnThemeToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onHalClick when HalComposite is clicked', () => {
      render(<HalInterface {...defaultProps} />);

      const halComposite = screen.getByTestId('hal-composite-mock');
      fireEvent.click(halComposite);

      expect(mockOnHalClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Styling', () => {
    it('should apply active styling to controls button when showControls is true', () => {
      render(<HalInterface {...defaultProps} showControls={true} />);

      const controlsButton = screen.getByText('🎛️ Hide Controls');
      expect(controlsButton).toHaveClass('frost-btn-primary');
    });

    it('should not apply active styling to controls button when showControls is false', () => {
      render(<HalInterface {...defaultProps} showControls={false} />);

      const controlsButton = screen.getByText('🎛️ Show Controls');
      expect(controlsButton).not.toHaveClass('frost-btn-primary');
    });

    it('should apply active styling to debug button when debugOverlay is true', () => {
      render(<HalInterface {...defaultProps} debugOverlay={true} />);

      const debugButton = screen.getByText('🔍 Hide Debug');
      expect(debugButton).toHaveClass('frost-btn-accent');
    });

    it('should not apply active styling to debug button when debugOverlay is false', () => {
      render(<HalInterface {...defaultProps} debugOverlay={false} />);

      const debugButton = screen.getByText('🔍 Show Debug');
      expect(debugButton).not.toHaveClass('frost-btn-accent');
    });

    it('should always apply secondary styling to theme button', () => {
      render(<HalInterface {...defaultProps} />);

      const themeButton = screen.getByText('🌙 Theme');
      expect(themeButton).toHaveClass('frost-btn-secondary');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles for accessibility', () => {
      render(<HalInterface {...defaultProps} />);

      expect(
        screen.getByTitle('Toggle layer controls panel')
      ).toBeInTheDocument();
      expect(
        screen.getByTitle('Toggle debug overlay for all layers')
      ).toBeInTheDocument();
      expect(
        screen.getByTitle('Switch between light and dark theme')
      ).toBeInTheDocument();
    });
  });

  describe('Props Propagation', () => {
    it('should pass all required props to HalComposite', () => {
      const customLayers = [
        createMockLayer({ id: 'layer1', name: 'Layer 1' }),
        createMockLayer({ id: 'layer2', name: 'Layer 2' }),
      ];

      const customProps = {
        ...defaultProps,
        layers: customLayers,
        isActive: true,
        theme: 'frost_dark' as const,
        debugOverlay: true,
      };

      render(<HalInterface {...customProps} />);

      const halComposite = screen.getByTestId('hal-composite-mock');
      expect(halComposite).toHaveAttribute('data-size', '400');
      expect(halComposite).toHaveAttribute('data-active', 'true');
      expect(halComposite).toHaveAttribute('data-theme', 'frost_dark');
      expect(halComposite).toHaveAttribute('data-debug', 'true');
      expect(halComposite).toHaveAttribute('data-layers-count', '2');
    });
  });

  describe('Layout Structure', () => {
    it('should have correct main container structure', () => {
      render(<HalInterface {...defaultProps} />);

      const mainCanvas = document.querySelector('.main-canvas');
      expect(mainCanvas).toBeInTheDocument();

      const centerContainer = document.querySelector('.hal-center-container');
      expect(centerContainer).toBeInTheDocument();
    });

    it('should have buttons container with correct styling', () => {
      render(<HalInterface {...defaultProps} />);

      const buttonsContainer = document.querySelector(
        '.frost-flex.frost-gap-2'
      );
      expect(buttonsContainer).toBeInTheDocument();
      expect(buttonsContainer?.children).toHaveLength(3);
    });
  });
});
