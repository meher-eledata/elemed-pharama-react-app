global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

// Mock the signup mutation so no RTK Query reducer/middleware is needed.
jest.mock('../../../redux/slices/authSlice', () => ({
  ...jest.requireActual('../../../redux/slices/authSlice'),
  useSignupMutation: () => [jest.fn(), { isLoading: false }],
}));

import SignUp from '../SignUp';

const renderSignUp = () =>
  render(
    <Provider store={configureStore({ reducer: { dummy: (s = {}) => s } })}>
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    </Provider>,
  );

describe('SignUp — coming-soon module treatment', () => {
  it('shows Outpatient with a "Coming Soon" chip and a disabled, unchecked checkbox', () => {
    renderSignUp();

    expect(screen.getByText('Outpatient')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    // Registry order: pharmacy (required/checked), inpatient, outpatient.
    const outpatientCheckbox = checkboxes[2];
    expect(outpatientCheckbox).toBeDisabled();
    expect(outpatientCheckbox).not.toBeChecked();
  });

  it('clicking the Outpatient row does not select it', () => {
    renderSignUp();

    fireEvent.click(screen.getByText('Outpatient'));

    const outpatientCheckbox = screen.getAllByRole('checkbox')[2];
    expect(outpatientCheckbox).not.toBeChecked();
  });

  it('a selectable optional module (Inpatient) still toggles', () => {
    renderSignUp();

    const inpatientCheckbox = screen.getAllByRole('checkbox')[1];
    expect(inpatientCheckbox).not.toBeChecked();

    fireEvent.click(screen.getByText('Inpatient'));
    expect(inpatientCheckbox).toBeChecked();
  });
});
