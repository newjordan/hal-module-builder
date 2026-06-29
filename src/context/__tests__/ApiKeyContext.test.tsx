import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ApiKeyProvider, useApiKey } from '../ApiKeyContext';

const TestComponent = () => {
  const { apiKey, setApiKey, isApiKeyModalOpen, setIsApiKeyModalOpen } =
    useApiKey();

  return (
    <div>
      <div data-testid='api-key'>{apiKey}</div>
      <div data-testid='modal-open'>{isApiKeyModalOpen.toString()}</div>
      <button onClick={() => setApiKey('test-key')}>Set Key</button>
      <button onClick={() => setIsApiKeyModalOpen(true)}>Open Modal</button>
    </div>
  );
};

describe('ApiKeyContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide a default null API key and false modal state', () => {
    render(
      <ApiKeyProvider>
        <TestComponent />
      </ApiKeyProvider>
    );

    expect(screen.getByTestId('api-key').textContent).toBe('');
    expect(screen.getByTestId('modal-open').textContent).toBe('false');
  });

  it('should allow setting the API key', () => {
    render(
      <ApiKeyProvider>
        <TestComponent />
      </ApiKeyProvider>
    );

    fireEvent.click(screen.getByText('Set Key'));

    expect(screen.getByTestId('api-key').textContent).toBe('test-key');
    expect(localStorage.getItem('generation-api-key')).toBe('test-key');
  });

  it('should allow opening the modal', () => {
    render(
      <ApiKeyProvider>
        <TestComponent />
      </ApiKeyProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));

    expect(screen.getByTestId('modal-open').textContent).toBe('true');
  });

  it('should load an existing key from localStorage on mount', () => {
    localStorage.setItem('generation-api-key', 'stored-key');

    render(
      <ApiKeyProvider>
        <TestComponent />
      </ApiKeyProvider>
    );

    expect(screen.getByTestId('api-key').textContent).toBe('stored-key');
  });
});
