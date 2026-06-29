import { VisualizationFactory } from '../visualizations/VisualizationFactory';
import {
  VisualizationLibrary,
  initializeGlobalLibrary,
} from '../VisualizationLibrary';
import { BarVisualization } from '../visualizations/BarVisualization';
import { LineVisualization } from '../visualizations/LineVisualization';
import { CircleVisualization } from '../visualizations/CircleVisualization';
import { DotVisualization } from '../visualizations/DotVisualization';
import { AudioAnalyzer } from '../processors/AudioAnalyzer';
import { FrequencyProcessor } from '../processors/FrequencyProcessor';
import { VisualizationRenderer } from '../renderers/VisualizationRenderer';
import { AudioProcessor } from '../AudioProcessor';

// Mock Canvas for testing
const mockCanvas = document.createElement('canvas');
mockCanvas.width = 200;
mockCanvas.height = 200;

describe('VisualizationFactory', () => {
  let factory: VisualizationFactory;
  let audioProcessor: AudioProcessor;

  beforeEach(() => {
    // Clear factory state
    VisualizationFactory.clear();

    // Create mock audio processor
    audioProcessor = new AudioProcessor();

    // Initialize factory with visualizations
    VisualizationFactory.initialize(audioProcessor);

    factory = new VisualizationFactory();
  });

  describe('Factory Initialization', () => {
    it('should initialize successfully', () => {
      expect(VisualizationFactory.getRegisteredTypes()).toContain('bar');
      expect(VisualizationFactory.getRegisteredTypes()).toContain('line');
      expect(VisualizationFactory.getRegisteredTypes()).toContain('circle');
      expect(VisualizationFactory.getRegisteredTypes()).toContain('dot');
    });
  });

  describe('Visualization Creation', () => {
    it('should create bar visualization', () => {
      const viz = VisualizationFactory.create('bar', audioProcessor);
      expect(viz).toBeInstanceOf(BarVisualization);
    });

    it('should create line visualization', () => {
      const viz = VisualizationFactory.create('line', audioProcessor);
      expect(viz).toBeInstanceOf(LineVisualization);
    });

    it('should create circle visualization', () => {
      const viz = VisualizationFactory.create('circle', audioProcessor);
      expect(viz).toBeInstanceOf(CircleVisualization);
    });

    it('should create dot visualization', () => {
      const viz = VisualizationFactory.create('dot', audioProcessor);
      expect(viz).toBeInstanceOf(DotVisualization);
    });

    it('should return null for unknown type', () => {
      const viz = VisualizationFactory.create('unknown', audioProcessor);
      expect(viz).toBeNull();
    });
  });

  describe('Registration', () => {
    it('should get available visualization types', () => {
      const types = VisualizationFactory.getRegisteredTypes();
      expect(types).toBeInstanceOf(Array);
      expect(types).toContain('bar');
      expect(types).toContain('line');
      expect(types).toContain('circle');
      expect(types).toContain('dot');
    });

    it('should validate visualization type', () => {
      const barInfo = VisualizationFactory.getRegistrationInfo('bar');
      expect(barInfo).toBeTruthy();

      const invalidInfo = VisualizationFactory.getRegistrationInfo('invalid');
      expect(invalidInfo).toBeNull();
    });
  });

  describe('Instance Management', () => {
    it('should provide different instances from create()', () => {
      const viz1 = VisualizationFactory.create('bar', audioProcessor);
      const viz2 = VisualizationFactory.create('bar', audioProcessor);
      // Different instances but same type
      expect(viz1).not.toBe(viz2);
      expect(viz1!.constructor).toBe(viz2!.constructor);
    });

    it('should provide same instance from getInstance()', () => {
      const viz1 = VisualizationFactory.getInstance('bar', audioProcessor);
      const viz2 = VisualizationFactory.getInstance('bar', audioProcessor);
      // Same instance (singleton pattern)
      expect(viz1).toBe(viz2);
    });
  });

  describe('Integration with VisualizationLibrary', () => {
    it('should work with integrated equalizer system', () => {
      // Initialize the complete system
      const audioAnalyzer = new AudioAnalyzer();
      const frequencyProcessor = new FrequencyProcessor({
        sampleRate: 44100,
        binCount: 1024,
      });
      const renderer = new VisualizationRenderer(mockCanvas);
      const factory = new VisualizationFactory();

      const library = initializeGlobalLibrary(
        audioAnalyzer,
        frequencyProcessor,
        renderer,
        factory
      );

      expect(library).toBeDefined();
      expect(library.getAvailableTypes()).toContain('bar');
    });
  });
});
