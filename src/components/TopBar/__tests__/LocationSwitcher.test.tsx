import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LocationSwitcher from '../LocationSwitcher';
import orgReducer from '../../../redux/slices/orgSlice';

const location = (id: number, name: string) => ({
  id,
  name,
  code: null,
  type: 'pharmacy',
  gstin: null,
  drug_license_1: null,
  drug_license_2: null,
  address: null,
  phone: null,
  status: 1,
});

const renderSwitcher = () => {
  const store = configureStore({
    reducer: { org: orgReducer },
    preloadedState: {
      org: {
        organization: { id: 1, name: 'Acme Health Org', slug: 'acme' },
        activeModules: ['pharmacy'],
        orgRole: 'admin' as const,
        moduleRoles: {},
        canManageRoles: false,
        loaded: true,
        locations: [location(1, 'Main Branch'), location(2, 'Riverside Branch')],
        currentLocationId: 1,
      },
    },
  });
  return render(
    <Provider store={store}>
      <LocationSwitcher />
    </Provider>,
  );
};

describe('LocationSwitcher keyboard accessibility', () => {
  it('is a focusable control that opens the menu on Enter', () => {
    renderSwitcher();

    const trigger = screen.getByRole('button', { name: 'Select location' });
    expect(trigger).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /riverside branch/i })).toBeInTheDocument();
  });

  it('opens the menu on Space', () => {
    renderSwitcher();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Select location' }), { key: ' ' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
