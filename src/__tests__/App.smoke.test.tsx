/**
 * @jest-environment jsdom
 *
 * End-to-end mount smoke test: renders the whole <App/> tree and asserts the
 * agent operations shell mounts without throwing.
 * Guards against runtime wiring regressions that build/type-check cannot catch.
 */
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App (mount smoke)', () => {
  it('mounts the full app shell without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
    expect(screen.getByText('HAL')).toBeInTheDocument();
    expect(screen.getByText('Agent Operations')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Agents' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Cognition stream' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Attention' })
    ).toBeInTheDocument();
  });
});
