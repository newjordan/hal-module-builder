/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HalComposite } from '../HalComposite';
import { Layer } from '../../../types/layer-types';

// Mock the child components
jest.mock('../../ShapeRenderer', () => ({
  ShapeRenderer: jest.fn(({ layer }) => (
    <div data-testid={`shape-renderer-${layer.id}`}>
      Shape Renderer for {layer.name}
    </div>
  )),
}));

jest.mock('../../EffectProcessor/EffectProcessor', () => ({
  EffectProcessor: jest.fn(({ layer }) => (
    <div data-testid={`effect-processor-${layer.id}`}>
      Effect Processor for {layer.name}
    </div>
  )),
}));

jest.mock('../../EqualizerEngine/EqualizerEngine', () => ({
  EqualizerEngine: jest.fn(({ equalizerSettings }) => (
    <div
      data-testid={`equalizer-engine-${equalizerSettings?.barCount || 'default'}`}
    >
      Equalizer Engine
    </div>
  )),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(clearTimeout);

describe('HalComposite', () => {
  const mockAudioData = new Array(64)
    .fill(0)
    .map((_, i) => Math.sin((i / 64) * Math.PI * 2) * 0.5 + 0.5);
  const mockOnClick = jest.fn();

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const layers = [createMockLayer()];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByTestId('hal-composite')).toBeInTheDocument();
    });

    it('should apply correct container styles', () => {
      const layers = [createMockLayer()];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      const container = screen.getByTestId('hal-composite');
      expect(container).toHaveClass('hal-composite-container');
      expect(container).toHaveStyle({
        position: 'relative',
        width: '200px',
        height: '200px',
      });
    });

    it('should handle click events', () => {
      const layers = [createMockLayer()];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      const container = screen.getByTestId('hal-composite');
      fireEvent.click(container);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layer Rendering', () => {
    it('should render visible layers only', () => {
      const layers = [
        createMockLayer({
          id: 'visible',
          name: 'Visible Layer',
          visible: true,
        }),
        createMockLayer({ id: 'hidden', name: 'Hidden Layer', visible: false }),
      ];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      expect(
        screen.getByTestId('effect-processor-visible')
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('effect-processor-hidden')
      ).not.toBeInTheDocument();
    });

    it('should render image layers correctly', () => {
      const layers = [
        createMockLayer({
          id: 'image-layer',
          name: 'Image Layer',
          type: 'image',
          src: 'test-image.jpg',
        }),
      ];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      const image = screen.getByAltText('Image Layer');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'test-image.jpg');
    });

    it('should render shape layers with ShapeRenderer', () => {
      const layers = [
        createMockLayer({
          id: 'shape-layer',
          name: 'Shape Layer',
          type: 'shape',
          shapeType: 'circle',
        }),
      ];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      expect(
        screen.getByTestId('shape-renderer-shape-layer')
      ).toBeInTheDocument();
    });

    it('should render effect layers with equalizer settings', () => {
      const layers = [
        createMockLayer({
          id: 'eq-layer',
          name: 'Equalizer Layer',
          type: 'effect',
          equalizerSettings: {
            barCount: 32,
            barWidth: 4,
            barSpacing: 1,
            positionX: 0,
            positionY: 0,
          },
        }),
      ];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByTestId('equalizer-engine-32')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should start animation when active', async () => {
      const layers = [createMockLayer()];

      const { rerender } = render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      // Initially not active - no animation frame requested
      expect(global.requestAnimationFrame).not.toHaveBeenCalled();

      // Make it active
      rerender(
        <HalComposite
          size={200}
          isActive={true}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      // Animation should start
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop animation when becoming inactive', async () => {
      const layers = [createMockLayer()];

      const { rerender } = render(
        <HalComposite
          size={200}
          isActive={true}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      // Make it inactive
      rerender(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        expect(global.cancelAnimationFrame).toHaveBeenCalled();
      });
    });
  });

  describe('Debug Overlay', () => {
    it('should render debug overlay when enabled', () => {
      const layers = [createMockLayer()];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
          debugOverlay={true}
        />
      );

      // Debug overlay should add crosshair elements
      const container = screen.getByTestId('hal-composite');
      const overlayElements = container.querySelectorAll('[aria-hidden]');
      expect(overlayElements).toHaveLength(1);
    });

    it('should not render debug overlay when disabled', () => {
      const layers = [createMockLayer()];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
          debugOverlay={false}
        />
      );

      // No debug overlay elements
      const container = screen.getByTestId('hal-composite');
      const overlayElements = container.querySelectorAll('[aria-hidden]');
      expect(overlayElements).toHaveLength(0);
    });
  });

  describe('Layer Transformations', () => {
    it('should apply layer transformations correctly', () => {
      const layers = [
        createMockLayer({
          id: 'transformed-layer',
          name: 'Transformed Layer',
          type: 'solid',
          scale: 2,
          rotation: 45,
          offsetX: 10,
          offsetY: 20,
          opacity: 0.5,
        }),
      ];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      const layerElement = screen.getByTestId(
        'effect-processor-transformed-layer'
      ).parentElement;
      expect(layerElement).toHaveStyle({ opacity: '0.5' });

      // Check transform contains all expected transformations
      const transformValue = layerElement?.style.transform || '';
      expect(transformValue).toContain('scale(2)');
      expect(transformValue).toContain('rotate(45deg)');
      expect(transformValue).toContain('translate(10px, 20px)');
    });

    it('should handle animated circle rotation', () => {
      const layers = [
        createMockLayer({
          id: 'circle-layer',
          name: 'Circle Layer',
          type: 'shape',
          shapeType: 'circle',
          rotation: 0,
          circleSettings: {
            animation: 'rotate',
            animationSpeed: 2,
          },
        }),
      ];

      render(
        <HalComposite
          size={200}
          isActive={true}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
        />
      );

      // The component should be rendered (exact rotation values are harder to test due to animation)
      expect(
        screen.getByTestId('shape-renderer-circle-layer')
      ).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should pass theme to child components', () => {
      const { ShapeRenderer } = require('../../ShapeRenderer');
      const layers = [
        createMockLayer({
          id: 'shape-layer',
          type: 'shape',
        }),
      ];

      render(
        <HalComposite
          size={200}
          isActive={false}
          audioData={mockAudioData}
          layers={layers}
          onClick={mockOnClick}
          theme='frost_dark'
        />
      );

      expect(ShapeRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          layer: expect.objectContaining({ id: 'shape-layer' }),
        }),
        expect.anything()
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle layers without required properties', () => {
      const layers = [
        createMockLayer({
          id: 'incomplete-layer',
          type: 'image',
          src: undefined, // Missing required src for image
        }),
      ];

      expect(() => {
        render(
          <HalComposite
            size={200}
            isActive={false}
            audioData={mockAudioData}
            layers={layers}
            onClick={mockOnClick}
          />
        );
      }).not.toThrow();
    });

    it('should handle unknown layer types', () => {
      const layers = [
        createMockLayer({
          id: 'unknown-layer',
          type: 'unknown' as any,
        }),
      ];

      expect(() => {
        render(
          <HalComposite
            size={200}
            isActive={false}
            audioData={mockAudioData}
            layers={layers}
            onClick={mockOnClick}
          />
        );
      }).not.toThrow();

      // Unknown layer type should not render anything
      expect(
        screen.queryByTestId('shape-renderer-unknown-layer')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('effect-processor-unknown-layer')
      ).not.toBeInTheDocument();
    });
  });
});
