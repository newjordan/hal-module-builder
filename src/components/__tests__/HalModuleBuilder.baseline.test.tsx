import { render, screen, waitFor } from '@testing-library/react';
import HalModuleBuilder from '../HalModuleBuilder';
import { ApiKeyProvider } from '../../context/ApiKeyContext';

jest.mock('../../utils/PerformanceBaselines', () => ({
  ...jest.requireActual('../../utils/PerformanceBaselines'),
  PerformanceBaselineManager: {
    getInstance: () => ({
      establishBaseline: jest.fn().mockResolvedValue(null),
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
    }),
  },
}));

describe('HalModuleBuilder', () => {
  beforeAll(() => {
    if (!(global as any).ResizeObserver) {
      (global as any).ResizeObserver = class {
        observe() {}
        disconnect() {}
        unobserve() {}
      };
    }
  });

  it('renders baseline controls without runtime errors', async () => {
    const { container } = render(
      <ApiKeyProvider>
        <HalModuleBuilder theme="frost_dark" onThemeToggle={() => {}} />
      </ApiKeyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Layer Controls')).toBeInTheDocument();
    });

    // A small delay to allow for any final rendering after the controls are visible
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(container.querySelector('.hal-demo')).toBeInTheDocument();
    expect(screen.getByText('Layer Controls')).toBeInTheDocument();
    expect(screen.getByText(/Animation Studio/i)).toBeInTheDocument();
  });
});
