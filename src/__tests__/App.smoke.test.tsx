/**
 * @jest-environment jsdom
 *
 * End-to-end mount smoke test: renders the whole <App/> tree (Router → modes →
 * panels → canvas) and asserts it mounts without throwing and shows the shell.
 * Guards against runtime wiring regressions that build/type-check cannot catch.
 */
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App (mount smoke)', () => {
  it('mounts the full app shell without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
    // ModeBar renders the HAL label and the Design/Present mode buttons.
    expect(screen.getByText('HAL')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Present')).toBeInTheDocument();
  });
});
