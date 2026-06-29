import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EqualizerSymmetryControls } from '../EqualizerSymmetryControls';
import { EQUALIZER_SYMMETRY_OPTIONS } from '../../../config/equalizerSymmetry';

describe('EqualizerSymmetryControls', () => {
  it('renders all available symmetry options', () => {
    render(
      <EqualizerSymmetryControls
        value='none'
        onChange={jest.fn()}
        barCount={64}
      />
    );

    EQUALIZER_SYMMETRY_OPTIONS.forEach(option => {
      expect(
        screen.getByRole('option', { name: option.label })
      ).toBeInTheDocument();
    });
  });

  it('disables options that require more bars than available', () => {
    render(
      <EqualizerSymmetryControls
        value='none'
        onChange={jest.fn()}
        barCount={4}
      />
    );

    const eightFoldOption = screen.getByRole('option', { name: '8-Fold' });
    expect(eightFoldOption).toBeDisabled();
  });

  it('invokes onChange when the selection changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <EqualizerSymmetryControls
        value='none'
        onChange={handleChange}
        barCount={64}
      />
    );

    await user.selectOptions(
      screen.getByTestId('equalizer-symmetry-select'),
      screen.getByRole('option', { name: 'Mirror' })
    );

    expect(handleChange).toHaveBeenCalledWith('mirror');
  });
});
