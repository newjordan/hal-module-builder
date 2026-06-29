import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppearanceSection } from '../components/shared-sections/AppearanceSection';
import { DEFAULT_BAR_SETTINGS } from '../utils/settings-defaults';

describe('Visualization Settings - AppearanceSection', () => {
  it('renders without crashing and shows blend mode control', () => {
    const onChange = jest.fn();

    render(
      <AppearanceSection
        settings={DEFAULT_BAR_SETTINGS as any}
        onChange={onChange as any}
        theme={'frost_dark'}
      />
    );

    // Section title
    expect(screen.getByText('Appearance')).toBeInTheDocument();

    // Blend Mode select is rendered (label hidden, but role is combobox)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });
});

