global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { Sidebar } from '../SideBar';

const createStore = (user: any) =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', isAuthenticated: true, user }) => state,
      org: (state = { organization: null, activeModules: [], loaded: false }) => state,
    },
  });

const renderSidebar = (user: any) =>
  render(
    <Provider store={createStore(user)}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </Provider>,
  );

const clickLogo = () => fireEvent.click(screen.getByAltText('Logo'));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Sidebar logo — role-aware navigation', () => {
  it('navigates an admin (role 0) to /admin', () => {
    renderSidebar({ role: 0 });
    clickLogo();
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('navigates an admin (role "admin") to /admin', () => {
    renderSidebar({ role: 'admin' });
    clickLogo();
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('navigates a pharmacist (role 1) to /dashboard', () => {
    renderSidebar({ role: 1 });
    clickLogo();
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
