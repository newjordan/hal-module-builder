import { ApiKeyProvider } from '../context/ApiKeyContext';

/**
 * Configuration for component extraction tests
 */

import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import type { Layer, AppState, PerformanceMetrics } from '../types';

/**
 * Configuration for component extraction tests
 */
export interface ExtractionTestConfig {
  /** Whether to capture performance metrics */
  enablePerformanceTracking?: boolean;
  /** Whether to generate snapshots for regression testing */
  enableSnapshots?: boolean;
  /** Timeout for async operations in milliseconds */
  asyncTimeout?: number;
  /** Memory usage threshold in MB */
  memoryThreshold?: number;
}

/**
 * Result of a component extraction test
 */
export interface ExtractionTestResult {
  /** Rendered component result */
  renderResult: RenderResult;
  /** Performance metrics captured during test */
  metrics?: PerformanceMetrics | undefined;
  /** DOM snapshot for regression testing */
  snapshot?: string | undefined;
  /** Whether the test passed all validations */
  isValid: boolean;
  /** Any validation errors encountered */
  errors: string[];
}

/**
 * Default test configuration for component extraction
 */
const DEFAULT_EXTRACTION_CONFIG: ExtractionTestConfig = {
  enablePerformanceTracking: true,
  enableSnapshots: true,
  asyncTimeout: 5000,
  memoryThreshold: 100, // 100MB threshold
};

/**
 * Creates a test wrapper with all necessary providers for component testing
 *
 * @param children - React components to wrap
 * @param initialState - Initial application state for testing
 * @returns JSX element with all required providers
 */
export const createTestWrapper = (
  children: React.ReactNode,
  initialState?: Partial<AppState>
): React.ReactElement => {
  // Mock theme provider
  const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => <div data-theme='frost_light'>{children}</div>;

  // Mock app context with initial state
  const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const mockState: AppState = {
      layers: [],
      groups: [],
      selectedLayerIds: [],
      currentTheme: 'frost_light',
      audioEnabled: false, // Disabled for testing
      templates: [],
      performance: {
        fps: 60,
        frameTime: 16.67,
        renderTime: 12,
        memoryUsage: 45,
        timestamp: Date.now(),
      },
      error: null,
      ...initialState,
    };

    // Mock context value - simplified for testing without jest functions
    // Using data attributes instead of React context for test simplicity

    return (
      <div data-testid='app-context' data-state={JSON.stringify(mockState)}>
        {children}
      </div>
    );
  };

  return (
    <ApiKeyProvider>
      <ThemeProvider>
        <AppContextProvider>{children}</AppContextProvider>
      </ThemeProvider>
    </ApiKeyProvider>
  );
};

/**
 * Renders a component with extraction test configuration
 *
 * @param component - React component to test
 * @param config - Test configuration options
 * @returns Promise that resolves to extraction test results
 */
export const renderWithExtractionTesting = async (
  component: React.ReactElement,
  config: ExtractionTestConfig = {}
): Promise<ExtractionTestResult> => {
  const testConfig = { ...DEFAULT_EXTRACTION_CONFIG, ...config };
  const errors: string[] = [];
  let metrics: PerformanceMetrics | undefined;
  let snapshot: string | undefined;

  // Start performance tracking if enabled
  const startTime = testConfig.enablePerformanceTracking
    ? performance.now()
    : 0;
  const startMemory = testConfig.enablePerformanceTracking
    ? (performance as any).memory?.usedJSHeapSize || 0
    : 0;

  // Render component with test wrapper
  let renderResult: RenderResult;
  try {
    await act(async () => {
      renderResult = render(createTestWrapper(component));
    });
  } catch (error) {
    errors.push(
      `Render failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }

  // Wait for any async operations to complete
  if (testConfig.asyncTimeout) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  }

  // Capture performance metrics if enabled
  if (testConfig.enablePerformanceTracking) {
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryUsage = (endMemory - startMemory) / (1024 * 1024); // Convert to MB

    metrics = {
      fps: 60, // Assumed for test environment
      frameTime: endTime - startTime,
      renderTime: endTime - startTime,
      memoryUsage,
      timestamp: Date.now(),
    };

    // Validate performance thresholds
    if (metrics.frameTime > 50) {
      errors.push(
        `Slow render time: ${metrics.frameTime.toFixed(2)}ms (threshold: 50ms)`
      );
    }

    if (
      testConfig.memoryThreshold &&
      memoryUsage > testConfig.memoryThreshold
    ) {
      errors.push(
        `High memory usage: ${memoryUsage.toFixed(2)}MB (threshold: ${testConfig.memoryThreshold}MB)`
      );
    }
  }

  // Generate snapshot if enabled
  if (testConfig.enableSnapshots) {
    try {
      snapshot = renderResult!.container.innerHTML;
    } catch (error) {
      errors.push(
        `Snapshot generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Validate DOM structure
  try {
    const container = renderResult!.container;
    if (!container.firstChild) {
      errors.push('Component rendered with empty DOM');
    }
  } catch (error) {
    errors.push(
      `DOM validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    renderResult: renderResult!,
    metrics,
    snapshot,
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Creates mock layer data for component testing
 *
 * @param overrides - Properties to override in mock layer
 * @returns Mock layer object for testing
 */
export const createMockLayer = (overrides: Partial<Layer> = {}): Layer => ({
  id: `test-layer-${Date.now()}`,
  name: 'Test Layer',
  type: 'shape',
  shapeType: 'circle',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  fillType: 'solid',
  fillColor: '#ffffff',
  strokeType: 'solid',
  strokeColor: '#000000',
  strokeWidth: 2,
  animation: 'none',
  animationSpeed: 1,
  ...overrides,
});

/**
 * Creates multiple mock layers for testing layer interactions
 *
 * @param count - Number of layers to create
 * @param baseOverrides - Base properties for all layers
 * @returns Array of mock layers
 */
export const createMockLayers = (
  count: number,
  baseOverrides: Partial<Layer> = {}
): Layer[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockLayer({
      id: `test-layer-${index}`,
      name: `Test Layer ${index + 1}`,
      ...baseOverrides,
    })
  );
};

/**
 * Validates that a component maintains expected behavior after extraction
 *
 * @param beforeSnapshot - DOM snapshot before extraction
 * @param afterSnapshot - DOM snapshot after extraction
 * @param tolerances - Acceptable differences for validation
 * @returns Validation result with any detected issues
 */
export const validateExtractionBehavior = (
  beforeSnapshot: string,
  afterSnapshot: string,
  tolerances = { textContent: true, attributes: true, structure: true }
): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Basic structure comparison
  if (tolerances.structure) {
    const beforeLength = beforeSnapshot.length;
    const afterLength = afterSnapshot.length;
    const lengthDiff = Math.abs(beforeLength - afterLength) / beforeLength;

    if (lengthDiff > 0.1) {
      // More than 10% difference
      issues.push(
        `Significant structure change detected: ${(lengthDiff * 100).toFixed(1)}% difference`
      );
    }
  }

  // Content comparison (simplified for now)
  if (tolerances.textContent) {
    const beforeText = beforeSnapshot.replace(/<[^>]*>/g, '').trim();
    const afterText = afterSnapshot.replace(/<[^>]*>/g, '').trim();

    if (beforeText !== afterText) {
      issues.push('Text content changed after extraction');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

/**
 * Measures component rendering performance
 *
 * @param renderFunction - Function that renders the component
 * @param iterations - Number of iterations to measure
 * @returns Performance statistics
 */
export const measureRenderPerformance = async (
  renderFunction: () => Promise<void> | void,
  iterations = 10
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
}> => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await renderFunction();
    const endTime = performance.now();
    times.push(endTime - startTime);
  }

  return {
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    totalTime: times.reduce((sum, time) => sum + time, 0),
  };
};

/**
 * Creates a test suite for component extraction validation
 *
 * @param componentName - Name of the component being tested
 * @param renderComponent - Function that renders the component
 * @param validationTests - Array of custom validation functions
 */
export const createExtractionTestSuite = (
  componentName: string,
  renderComponent: () => React.ReactElement,
  validationTests: Array<(result: ExtractionTestResult) => void> = []
) => {
  describe(`${componentName} - Component Extraction Validation`, () => {
    it('should render without crashing after extraction', async () => {
      const result = await renderWithExtractionTesting(renderComponent());
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should maintain performance characteristics after extraction', async () => {
      const result = await renderWithExtractionTesting(renderComponent(), {
        enablePerformanceTracking: true,
      });

      expect(result.metrics?.frameTime).toBeLessThan(50); // 50ms threshold
      expect(result.metrics?.memoryUsage).toBeLessThan(100); // 100MB threshold
    });

    it('should generate consistent DOM structure after extraction', async () => {
      const result1 = await renderWithExtractionTesting(renderComponent());
      const result2 = await renderWithExtractionTesting(renderComponent());

      expect(result1.snapshot).toBeDefined();
      expect(result2.snapshot).toBeDefined();

      // Basic consistency check
      expect(result1.snapshot?.length).toBeCloseTo(
        result2.snapshot?.length || 0,
        -1
      );
    });

    // Run custom validation tests
    validationTests.forEach((test, index) => {
      it(`should pass custom validation test ${index + 1}`, async () => {
        const result = await renderWithExtractionTesting(renderComponent());
        test(result);
      });
    });
  });
};
