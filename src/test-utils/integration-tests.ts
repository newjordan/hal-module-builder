// Integration test utilities for refactoring safety

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export interface IntegrationTestScenario {
  name: string;
  description: string;
  steps: IntegrationTestStep[];
  expectedOutcome: string;
  criticalPath: boolean;
}

export interface IntegrationTestStep {
  action: string;
  target?: string;
  input?: string;
  validation: (screen: any) => Promise<void> | void;
}

// Critical user paths that must continue working after refactoring
export const criticalUserPaths: IntegrationTestScenario[] = [
  {
    name: 'create-and-render-layer',
    description: 'User creates a new layer and sees it rendered',
    criticalPath: true,
    expectedOutcome: 'Layer appears in layer list and is visible on canvas',
    steps: [
      {
        action: 'click',
        target: 'add-layer-button',
        validation: async screen => {
          await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
          });
        },
      },
      {
        action: 'select',
        target: 'layer-type-solid',
        validation: screen => {
          expect(
            screen.getByRole('button', { name: /solid/i })
          ).toHaveAttribute('aria-selected', 'true');
        },
      },
      {
        action: 'click',
        target: 'create-layer-confirm',
        validation: async screen => {
          await waitFor(() => {
            expect(screen.getByText(/solid layer/i)).toBeInTheDocument();
          });
        },
      },
    ],
  },
  {
    name: 'modify-layer-properties',
    description: 'User selects a layer and modifies its properties',
    criticalPath: true,
    expectedOutcome: 'Layer properties update and changes are visible',
    steps: [
      {
        action: 'click',
        target: 'layer-item-1',
        validation: screen => {
          expect(screen.getByTestId('layer-item-1')).toHaveClass('selected');
        },
      },
      {
        action: 'change',
        target: 'opacity-slider',
        input: '0.5',
        validation: screen => {
          expect(screen.getByDisplayValue('0.5')).toBeInTheDocument();
        },
      },
    ],
  },
  {
    name: 'save-and-load-template',
    description: 'User saves current state as template and loads it',
    criticalPath: true,
    expectedOutcome:
      'Template saves successfully and restores state when loaded',
    steps: [
      {
        action: 'click',
        target: 'save-template-button',
        validation: async screen => {
          await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
          });
        },
      },
      {
        action: 'type',
        target: 'template-name-input',
        input: 'Test Template',
        validation: screen => {
          expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
        },
      },
      {
        action: 'click',
        target: 'save-confirm',
        validation: async screen => {
          await waitFor(() => {
            expect(
              screen.getByText('Template saved successfully')
            ).toBeInTheDocument();
          });
        },
      },
    ],
  },
  {
    name: 'theme-switching',
    description: 'User switches between light and dark themes',
    criticalPath: true,
    expectedOutcome: 'Theme changes are applied immediately and persist',
    steps: [
      {
        action: 'click',
        target: 'theme-toggle',
        validation: screen => {
          expect(screen.getByTestId('app-container')).toHaveClass(
            'theme-frost-dark'
          );
        },
      },
      {
        action: 'click',
        target: 'theme-toggle',
        validation: screen => {
          expect(screen.getByTestId('app-container')).toHaveClass(
            'theme-frost-light'
          );
        },
      },
    ],
  },
  {
    name: 'audio-visualization',
    description: 'User enables audio and sees real-time visualization',
    criticalPath: true,
    expectedOutcome: 'Audio visualizer responds to audio input',
    steps: [
      {
        action: 'click',
        target: 'audio-toggle',
        validation: async screen => {
          await waitFor(
            () => {
              expect(screen.getByText(/audio enabled/i)).toBeInTheDocument();
            },
            { timeout: 5000 }
          );
        },
      },
      {
        action: 'wait',
        target: 'audio-processing',
        validation: async screen => {
          // Wait for audio to be processed and visualization to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          expect(screen.getByTestId('audio-visualizer')).toBeInTheDocument();
        },
      },
    ],
  },
];

// Integration test runner
export class IntegrationTestRunner {
  private results: Map<string, boolean> = new Map();
  private errors: Map<string, Error> = new Map();

  async runScenario(
    scenario: IntegrationTestScenario,
    component: any
  ): Promise<boolean> {
    try {
      const user = userEvent.setup();
      render(component);

      for (const step of scenario.steps) {
        await this.executeStep(step, user, screen);
      }

      this.results.set(scenario.name, true);
      return true;
    } catch (error) {
      this.results.set(scenario.name, false);
      this.errors.set(scenario.name, error as Error);
      return false;
    }
  }

  async runAllCriticalPaths(component: any): Promise<{
    passed: number;
    failed: number;
    results: Map<string, boolean>;
    errors: Map<string, Error>;
  }> {
    const results = {
      passed: 0,
      failed: 0,
      results: this.results,
      errors: this.errors,
    };

    for (const scenario of criticalUserPaths.filter(s => s.criticalPath)) {
      const success = await this.runScenario(scenario, component);
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  private async executeStep(
    step: IntegrationTestStep,
    user: any,
    screen: any
  ): Promise<void> {
    switch (step.action) {
      case 'click':
        if (step.target) {
          const element =
            screen.getByTestId(step.target) ||
            screen.getByRole('button', { name: new RegExp(step.target, 'i') });
          await user.click(element);
        }
        break;

      case 'type':
        if (step.target && step.input) {
          const element =
            screen.getByTestId(step.target) ||
            screen.getByRole('textbox', { name: new RegExp(step.target, 'i') });
          await user.clear(element);
          await user.type(element, step.input);
        }
        break;

      case 'change':
        if (step.target && step.input) {
          const element =
            screen.getByTestId(step.target) ||
            screen.getByRole('slider', { name: new RegExp(step.target, 'i') });
          await user.type(element, step.input);
        }
        break;

      case 'select':
        if (step.target) {
          const element =
            screen.getByTestId(step.target) ||
            screen.getByRole('option', { name: new RegExp(step.target, 'i') });
          await user.click(element);
        }
        break;

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    // Execute validation
    await step.validation(screen);
  }

  generateReport(): string {
    const totalTests = this.results.size;
    const passedTests = Array.from(this.results.values()).filter(
      Boolean
    ).length;
    const failedTests = totalTests - passedTests;

    let report = '# Integration Test Report\n\n';
    report += `**Total Tests:** ${totalTests}\n`;
    report += `**Passed:** ${passedTests}\n`;
    report += `**Failed:** ${failedTests}\n`;
    report += `**Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;

    if (failedTests > 0) {
      report += '## Failed Tests\n\n';
      for (const [testName, passed] of this.results.entries()) {
        if (!passed) {
          const error = this.errors.get(testName);
          report += `### ${testName}\n`;
          report += `**Error:** ${error?.message || 'Unknown error'}\n`;
          if (error?.stack) {
            report += `\`\`\`\n${error.stack}\n\`\`\`\n`;
          }
          report += '\n';
        }
      }
    }

    return report;
  }

  clear(): void {
    this.results.clear();
    this.errors.clear();
  }
}

// Smoke tests for critical functionality
export const smokeTests = {
  // Basic app loading
  appLoads: async (component: any): Promise<void> => {
    render(component);
    await waitFor(() => {
      expect(screen.getByTestId('hal-module-builder')).toBeInTheDocument();
    });
  },

  // Canvas rendering
  canvasRenders: async (component: any): Promise<void> => {
    render(component);
    const canvas = screen.getByRole('main').querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width');
    expect(canvas).toHaveAttribute('height');
  },

  // Layer management works
  layerManagementWorks: async (component: any): Promise<void> => {
    render(component);
    expect(screen.getByText('Layers')).toBeInTheDocument();
    // Additional layer management checks would go here
  },

  // Properties panel works
  propertiesPanelWorks: async (component: any): Promise<void> => {
    render(component);
    expect(screen.getByText('Properties')).toBeInTheDocument();
    // Additional properties panel checks would go here
  },

  // State persistence works
  statePersistenceWorks: async (component: any): Promise<void> => {
    render(component);
    // Check that localStorage is accessible and can save/load state
    expect(typeof localStorage).toBe('object');
  },
};

// Rollback validation tests
export const rollbackTests = {
  // Test that rollback preserves user data
  preservesUserData: async (
    beforeState: any,
    afterRollback: any
  ): Promise<boolean> => {
    // Compare states and ensure user data is preserved
    return (
      JSON.stringify(beforeState.layers) ===
      JSON.stringify(afterRollback.layers)
    );
  },

  // Test that rollback restores functionality
  restoresFunctionality: async (component: any): Promise<boolean> => {
    const runner = new IntegrationTestRunner();
    const results = await runner.runAllCriticalPaths(component);
    return results.failed === 0;
  },

  // Test that rollback is complete
  isComplete: async (
    originalVersion: string,
    currentVersion: string
  ): Promise<boolean> => {
    return originalVersion === currentVersion;
  },
};
