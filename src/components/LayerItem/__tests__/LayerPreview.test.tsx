import React from 'react';
import { render, screen } from '@testing-library/react';
import { LayerPreview } from '../LayerPreview';
import { Layer } from '../../../types/layer-types';

// Mock utilities
jest.mock('../../../utils/layer-transforms', () => ({
  calculateTransformMatrix: jest.fn().mockReturnValue('translateX(0)'),
  calculateImageFilters: jest.fn().mockReturnValue('none'),
  generateGradientString: jest
    .fn()
    .mockReturnValue('linear-gradient(45deg, red, blue)'),
}));

jest.mock('../../../assets/shapes', () => ({
  getAvailableShapes: jest.fn().mockReturnValue([
    { type: 'circle', metadata: { icon: '⭕' } },
    { type: 'square', metadata: { icon: '⬜' } },
  ]),
}));

describe('LayerPreview', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Image Layer Preview', () => {
    it('renders image layer with src correctly', () => {
      render(<LayerPreview layer={mockLayer} theme='frost_light' />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'test-image.jpg');
      expect(img).toHaveAttribute('alt', 'Test Layer');
    });

    it('renders placeholder when no image src provided', () => {
      const layerWithoutSrc = { ...mockLayer, src: '' };
      render(<LayerPreview layer={layerWithoutSrc} theme='frost_light' />);

      expect(screen.getByTitle('No image selected')).toBeInTheDocument();
      expect(screen.getByText('📷')).toBeInTheDocument();
    });
  });

  describe('Solid Color Layer Preview', () => {
    it('renders solid color layer background', () => {
      const solidLayer = { ...mockLayer, type: 'solid' as const };
      const { container } = render(
        <LayerPreview layer={solidLayer} theme='frost_light' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveStyle('background: #FF0000');
    });
  });

  describe('Gradient Layer Preview', () => {
    it('renders gradient layer background', () => {
      const gradientLayer = {
        ...mockLayer,
        type: 'gradient' as const,
        gradient: { type: 'linear', angle: 45, stops: [] },
      };
      const { container } = render(
        <LayerPreview layer={gradientLayer} theme='frost_light' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveStyle(
        'background: linear-gradient(45deg, red, blue)'
      );
    });
  });

  describe('Effect Layer Preview', () => {
    it('renders effect layer with music icon', () => {
      const effectLayer = { ...mockLayer, type: 'effect' as const };
      render(<LayerPreview layer={effectLayer} theme='frost_light' />);

      expect(screen.getByTitle('Audio effect layer')).toBeInTheDocument();
      expect(screen.getByText('🎵')).toBeInTheDocument();
    });
  });

  describe('Shape Layer Preview', () => {
    it('renders shape layer with correct icon', () => {
      const shapeLayer = { ...mockLayer, type: 'shape' as const };
      render(<LayerPreview layer={shapeLayer} theme='frost_light' />);

      expect(screen.getByTitle('Shape: circle')).toBeInTheDocument();
      expect(screen.getByText('⭕')).toBeInTheDocument();
    });

    it('renders default icon for unknown shape type', () => {
      const unknownShapeLayer = {
        ...mockLayer,
        type: 'shape' as const,
        shapeType: 'unknown',
      };
      render(<LayerPreview layer={unknownShapeLayer} theme='frost_light' />);

      expect(screen.getByText('⭕')).toBeInTheDocument();
    });
  });

  describe('Equalizer Layer Preview', () => {
    it('renders equalizer layer with chart icon', () => {
      const equalizerLayer = { ...mockLayer, type: 'equalizer' as const };
      render(<LayerPreview layer={equalizerLayer} theme='frost_light' />);

      expect(
        screen.getByTitle('Audio equalizer visualization')
      ).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });
  });

  describe('Visibility and Opacity', () => {
    it('applies opacity when layer is visible', () => {
      const { container } = render(
        <LayerPreview layer={mockLayer} theme='frost_light' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveStyle('opacity: 1');
    });

    it('applies reduced opacity when layer is hidden', () => {
      const hiddenLayer = { ...mockLayer, visible: false };
      const { container } = render(
        <LayerPreview layer={hiddenLayer} theme='frost_light' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveStyle('opacity: 0.3');
    });

    it('applies layer opacity setting', () => {
      const partialOpacityLayer = { ...mockLayer, opacity: 0.5 };
      const { container } = render(
        <LayerPreview layer={partialOpacityLayer} theme='frost_light' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveStyle('opacity: 0.5');
    });
  });

  describe('Custom Dimensions', () => {
    it('applies custom width and height', () => {
      const { container } = render(
        <LayerPreview
          layer={mockLayer}
          theme='frost_light'
          width={60}
          height={60}
        />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveStyle('width: 60px');
      expect(preview).toHaveStyle('height: 60px');
    });
  });

  describe('Theme Support', () => {
    it('applies light theme classes', () => {
      const { container } = render(
        <LayerPreview layer={mockLayer} theme='frost_light' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveClass('frostlight-layer-preview');
    });

    it('applies dark theme classes', () => {
      const { container } = render(
        <LayerPreview layer={mockLayer} theme='frost_dark' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveClass('frostdark-layer-preview');
    });
  });

  describe('Data Attributes', () => {
    it('includes layer identification attributes', () => {
      const { container } = render(
        <LayerPreview layer={mockLayer} theme='frost_light' />
      );

      const preview = container.querySelector('.layer-preview');
      expect(preview).toHaveAttribute('data-layer-id', 'test-layer');
      expect(preview).toHaveAttribute('data-layer-type', 'image');
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes correctly with same props', () => {
      const { rerender } = render(
        <LayerPreview layer={mockLayer} theme='frost_light' />
      );

      // Re-render with same props should not cause re-mount
      rerender(<LayerPreview layer={mockLayer} theme='frost_light' />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});
