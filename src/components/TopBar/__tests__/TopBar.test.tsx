global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

// Spy on navigation.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the activityApi logout hook (lazy mutation tuple: [trigger]).
const mockLogoutTrigger = jest.fn();
jest.mock('../../../redux/slices/activityApi', () => ({
  useLogoutMutation: () => [mockLogoutTrigger],
}));

import { TopBar } from '../TopBar';

const createStore = () =>
  configureStore({
    reducer: {
      auth: (
        state = {
          token: 'JWT123',
          isAuthenticated: true,
          user: { first_name: 'Pat', last_name: 'Lee', role: 1 },
        },
      ) => state,
      // Minimal org context so the ModuleSwitcher (rendered in the TopBar) can read
      // state.org. `loaded: false` → no accessible areas → switcher renders nothing.
      org: (
        state = {
          organization: null,
          activeModules: [],
          orgRole: null,
          moduleRoles: {},
          canManageRoles: false,
          loaded: false,
        },
      ) => state,
    },
  });

const renderTopBar = () =>
  render(
    <Provider store={createStore()}>
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>
    </Provider>,
  );

const openMenuAndClickLogout = () => {
  fireEvent.click(screen.getByText('Pat Lee'));
  fireEvent.click(screen.getByText('Logout'));
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TopBar — logout calls the server endpoint', () => {
  it('calls the logout mutation, then clears auth and navigates to /', async () => {
    mockLogoutTrigger.mockReturnValue({ unwrap: () => Promise.resolve({ message: 'Logged out' }) });
    renderTopBar();
    openMenuAndClickLogout();

    expect(mockLogoutTrigger).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('still logs out (navigates) even if the logout request fails', async () => {
    mockLogoutTrigger.mockReturnValue({ unwrap: () => Promise.reject(new Error('network')) });
    renderTopBar();
    openMenuAndClickLogout();

    expect(mockLogoutTrigger).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });
});
