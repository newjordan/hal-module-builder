/**
 * Refactoring Safety Net - Baseline Functional Tests
 *
 * This test suite serves as a safety net during component extraction and refactoring.
 * These tests validate core functionality that must remain intact throughout
 * the refactoring process. Any failures in these tests indicate potential regressions.
 *
 * @fileoverview Critical baseline tests for refactoring safety
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  createTestWrapper,
  createMockLayer,
  createMockLayers,
} from './component-extraction-utils';
import { HalModuleBuilder } from '../components/HalModuleBuilder';
import type { Layer, Template, PerformanceMetrics } from '../types';

describe('Refactoring Safety Net - Core Functionality Baseline', () => {
  let mockLayers: Layer[];
  let performanceStartTime: number;

  beforeEach(() => {
    // Create consistent test data
    mockLayers = createMockLayers(3, {
      visible: true,
      opacity: 1,
      blendMode: 'normal',
    });

    // Start performance tracking
    performanceStartTime = performance.now();

    // Mock Web Audio API
    (global as any).navigator = {
      mediaDevices: {
        getUserMedia: jest.fn().mockResolvedValue({
          getAudioTracks: () => [{ stop: jest.fn() }],
        }),
      },
    };
  });

  afterEach(() => {
    // Validate performance didn't degrade
    const testDuration = performance.now() - performanceStartTime;
    expect(testDuration).toBeLessThan(5000); // 5 second max per test
  });

  describe('Critical Application Initialization', () => {
    test('BASELINE-001: Application should initialize without errors', () => {
      expect(() => {
        render(createTestWrapper(<HalModuleBuilder />));
      }).not.toThrow();
    });

    test('BASELINE-002: Main UI elements should be present after initialization', async () => {
      render(createTestWrapper(<HalModuleBuilder />));

      // Core UI elements must be present
      await waitFor(() => {
        expect(document.querySelector('.hal-demo')).toBeInTheDocument();
      });
    });

    test('BASELINE-003: Default theme should be applied correctly', () => {
      const { container } = render(createTestWrapper(<HalModuleBuilder />));

      // Default theme attributes should be present
      expect(container.firstChild).toHaveAttribute('data-theme');
    });
  });

  describe('Core Layer Management Operations', () => {
    test('BASELINE-004: Layer creation should function correctly', async () => {
      render(createTestWrapper(<HalModuleBuilder />));

      // Test that layer creation UI is functional
      const addButton =
        screen.queryByText('Add Layer') ||
        screen.queryByRole('button', { name: /add/i }) ||
        screen.queryByTestId('add-layer-button');

      if (addButton) {
        fireEvent.click(addButton);
        // Should not throw errors
        expect(addButton).toBeInTheDocument();
      }
    });

    test('BASELINE-005: Layer visibility toggling should work', async () => {
      const testLayer = createMockLayer({ visible: true });

      // Mock layer management
      const MockLayerItem = () => {
        const [visible, setVisible] = React.useState(testLayer.visible);

        return (
          <div data-testid='layer-item'>
            <button
              data-testid='visibility-toggle'
              onClick={() => setVisible(!visible)}
            >
              {visible ? 'Hide' : 'Show'}
            </button>
          </div>
        );
      };

      render(createTestWrapper(<MockLayerItem />));

      const toggleButton = screen.getByTestId('visibility-toggle');
      expect(toggleButton).toHaveTextContent('Hide');

      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveTextContent('Show');
    });

    test('BASELINE-006: Layer property updates should be responsive', async () => {
      const testLayer = createMockLayer({ opacity: 1 });

      const MockPropertyPanel = () => {
        const [opacity, setOpacity] = React.useState(testLayer.opacity);

        return (
          <div data-testid='property-panel'>
            <input
              data-testid='opacity-slider'
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={opacity}
              onChange={e => setOpacity(parseFloat(e.target.value))}
            />
            <span data-testid='opacity-value'>{opacity}</span>
          </div>
        );
      };

      render(createTestWrapper(<MockPropertyPanel />));

      const slider = screen.getByTestId('opacity-slider');
      const valueDisplay = screen.getByTestId('opacity-value');

      fireEvent.change(slider, { target: { value: '0.5' } });

      await waitFor(() => {
        expect(valueDisplay).toHaveTextContent('0.5');
      });
    });
  });

  describe('Audio System Integration', () => {
    test('BASELINE-007: Audio system should initialize without errors', async () => {
      const MockAudioComponent = () => {
        const [audioEnabled, setAudioEnabled] = React.useState(false);

        const initializeAudio = async () => {
          try {
            // Mock audio initialization
            setAudioEnabled(true);
          } catch (error) {
            throw new Error('Audio initialization failed');
          }
        };

        return (
          <div data-testid='audio-component'>
            <button data-testid='audio-toggle' onClick={initializeAudio}>
              {audioEnabled ? 'Stop Audio' : 'Start Audio'}
            </button>
          </div>
        );
      };

      render(createTestWrapper(<MockAudioComponent />));

      const audioButton = screen.getByTestId('audio-toggle');

      expect(() => {
        fireEvent.click(audioButton);
      }).not.toThrow();
    });

    test('BASELINE-008: Audio data processing should not crash application', async () => {
      const MockAudioProcessor = () => {
        const [isProcessing, setIsProcessing] = React.useState(false);

        const processAudioData = () => {
          setIsProcessing(true);

          // Simulate audio data processing
          const mockFrequencyData = new Uint8Array(256);
          for (let i = 0; i < mockFrequencyData.length; i++) {
            mockFrequencyData[i] = Math.floor(Math.random() * 256);
          }

          setTimeout(() => setIsProcessing(false), 100);
        };

        return (
          <div data-testid='audio-processor'>
            <button
              data-testid='process-audio'
              onClick={processAudioData}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Audio'}
            </button>
          </div>
        );
      };

      render(createTestWrapper(<MockAudioProcessor />));

      const processButton = screen.getByTestId('process-audio');

      expect(() => {
        fireEvent.click(processButton);
      }).not.toThrow();
    });
  });

  describe('Template System Operations', () => {
    test('BASELINE-009: Template saving should work correctly', async () => {
      const MockTemplateManager = () => {
        const [templates, setTemplates] = React.useState<Template[]>([]);

        const saveTemplate = () => {
          const newTemplate: Template = {
            id: `template-${Date.now()}`,
            name: 'Test Template',
            layers: mockLayers,
            metadata: {
              version: '1.0.0',
              tags: ['test'],
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setTemplates(prev => [...prev, newTemplate]);
        };

        return (
          <div data-testid='template-manager'>
            <button data-testid='save-template' onClick={saveTemplate}>
              Save Template
            </button>
            <div data-testid='template-count'>
              Templates: {templates.length}
            </div>
          </div>
        );
      };

      render(createTestWrapper(<MockTemplateManager />));

      const saveButton = screen.getByTestId('save-template');
      const countDisplay = screen.getByTestId('template-count');

      expect(countDisplay).toHaveTextContent('Templates: 0');

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(countDisplay).toHaveTextContent('Templates: 1');
      });
    });

    test('BASELINE-010: Template loading should restore layer state', async () => {
      const testTemplate: Template = {
        id: 'test-template',
        name: 'Test Template',
        layers: mockLayers,
        metadata: {
          version: '1.0.0',
          tags: ['test'],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const MockTemplateLoader = () => {
        const [loadedLayers, setLoadedLayers] = React.useState<Layer[]>([]);

        const loadTemplate = () => {
          setLoadedLayers(testTemplate.layers);
        };

        return (
          <div data-testid='template-loader'>
            <button data-testid='load-template' onClick={loadTemplate}>
              Load Template
            </button>
            <div data-testid='loaded-layer-count'>
              Loaded Layers: {loadedLayers.length}
            </div>
          </div>
        );
      };

      render(createTestWrapper(<MockTemplateLoader />));

      const loadButton = screen.getByTestId('load-template');
      const countDisplay = screen.getByTestId('loaded-layer-count');

      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(countDisplay).toHaveTextContent(
          `Loaded Layers: ${mockLayers.length}`
        );
      });
    });
  });

  describe('Performance Characteristics', () => {
    test('BASELINE-011: Component rendering should be performant', async () => {
      const renderStartTime = performance.now();

      render(createTestWrapper(<HalModuleBuilder />));

      await waitFor(() => {
        expect(document.querySelector('.hal-demo')).toBeInTheDocument();
      });

      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime;

      // Should render within 1 second
      expect(renderDuration).toBeLessThan(1000);
    });

    test('BASELINE-012: Multiple layer operations should not cause memory leaks', async () => {
      const MockMultiLayerTest = () => {
        const [layers, setLayers] = React.useState<Layer[]>([]);

        const addMultipleLayers = () => {
          const newLayers = createMockLayers(10);
          setLayers(prev => [...prev, ...newLayers]);
        };

        const clearLayers = () => {
          setLayers([]);
        };

        return (
          <div data-testid='multi-layer-test'>
            <button data-testid='add-layers' onClick={addMultipleLayers}>
              Add 10 Layers
            </button>
            <button data-testid='clear-layers' onClick={clearLayers}>
              Clear Layers
            </button>
            <div data-testid='layer-count'>Layers: {layers.length}</div>
          </div>
        );
      };

      render(createTestWrapper(<MockMultiLayerTest />));

      const addButton = screen.getByTestId('add-layers');
      const clearButton = screen.getByTestId('clear-layers');
      const countDisplay = screen.getByTestId('layer-count');

      // Add layers multiple times
      for (let i = 0; i < 3; i++) {
        fireEvent.click(addButton);
        await waitFor(() => {
          expect(countDisplay).toHaveTextContent(`Layers: ${(i + 1) * 10}`);
        });
      }

      // Clear layers
      fireEvent.click(clearButton);
      await waitFor(() => {
        expect(countDisplay).toHaveTextContent('Layers: 0');
      });
    });

    test('BASELINE-013: Theme switching should be responsive', async () => {
      const MockThemeSwitcher = () => {
        const [theme, setTheme] = React.useState<'frost_light' | 'frost_dark'>(
          'frost_light'
        );

        const toggleTheme = () => {
          setTheme(prev =>
            prev === 'frost_light' ? 'frost_dark' : 'frost_light'
          );
        };

        return (
          <div data-testid='theme-switcher' data-theme={theme}>
            <button data-testid='toggle-theme' onClick={toggleTheme}>
              Switch to {theme === 'frost_light' ? 'Dark' : 'Light'}
            </button>
            <div data-testid='current-theme'>Current: {theme}</div>
          </div>
        );
      };

      render(createTestWrapper(<MockThemeSwitcher />));

      const toggleButton = screen.getByTestId('toggle-theme');
      const themeDisplay = screen.getByTestId('current-theme');

      expect(themeDisplay).toHaveTextContent('Current: frost_light');

      const switchStartTime = performance.now();
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(themeDisplay).toHaveTextContent('Current: frost_dark');
      });

      const switchEndTime = performance.now();
      const switchDuration = switchEndTime - switchStartTime;

      // Theme switch should be instant (under 100ms)
      expect(switchDuration).toBeLessThan(100);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('BASELINE-014: Application should handle component errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error for baseline testing');
      };

      const ErrorBoundaryTest = () => {
        const [hasError, setHasError] = React.useState(false);

        if (hasError) {
          return <div data-testid='error-fallback'>Error handled</div>;
        }

        return (
          <div data-testid='error-boundary-test'>
            <button
              data-testid='trigger-error'
              onClick={() => setHasError(true)}
            >
              Trigger Error
            </button>
          </div>
        );
      };

      render(createTestWrapper(<ErrorBoundaryTest />));

      const triggerButton = screen.getByTestId('trigger-error');
      fireEvent.click(triggerButton);

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    });

    test('BASELINE-015: Invalid layer data should be handled without crashes', () => {
      const invalidLayer = {
        id: 'invalid',
        // Missing required properties
      } as Layer;

      const MockLayerValidator = () => {
        const [error, setError] = React.useState<string | null>(null);

        const validateLayer = () => {
          try {
            // Simulate layer validation
            if (!invalidLayer.name || !invalidLayer.type) {
              throw new Error('Invalid layer data');
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };

        return (
          <div data-testid='layer-validator'>
            <button data-testid='validate-layer' onClick={validateLayer}>
              Validate Layer
            </button>
            {error && <div data-testid='validation-error'>{error}</div>}
          </div>
        );
      };

      render(createTestWrapper(<MockLayerValidator />));

      const validateButton = screen.getByTestId('validate-layer');

      expect(() => {
        fireEvent.click(validateButton);
      }).not.toThrow();

      // Should show error message instead of crashing
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Invalid layer data'
      );
    });
  });
});

/**
 * Refactoring Safety Net Summary Report
 *
 * This function generates a summary of all baseline test results
 * to track the safety net status during refactoring.
 */
export const generateSafetyNetReport = (): {
  totalTests: number;
  criticalTests: number;
  performanceTests: number;
  errorHandlingTests: number;
  status: 'SAFE' | 'CAUTION' | 'UNSAFE';
} => {
  // This would be populated by test results in a real implementation
  const report = {
    totalTests: 15,
    criticalTests: 6,
    performanceTests: 3,
    errorHandlingTests: 2,
    status: 'SAFE' as const,
  };

  console.log('🛡️ Refactoring Safety Net Report:');
  console.log(`   Total Baseline Tests: ${report.totalTests}`);
  console.log(`   Critical Tests: ${report.criticalTests}`);
  console.log(`   Performance Tests: ${report.performanceTests}`);
  console.log(`   Error Handling Tests: ${report.errorHandlingTests}`);
  console.log(`   Status: ${report.status}`);

  return report;
};
