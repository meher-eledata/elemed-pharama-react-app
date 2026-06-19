global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../SideBar';

const theme = createTheme();

// Stub navigate so we can assert the route an item navigates to (the sidebar
// stores the destination on the item.route and calls navigate(route) on click).
const navigateSpy = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateSpy,
}));

// Minimal auth store — Sidebar only reads state.auth.user.
const createStore = (user: any = { id: 1, role: 0 }) =>
  configureStore({
    reducer: {
      auth: (state = { user, token: 'JWT', isAuthenticated: true }) => state,
    },
  });

// Render the Sidebar at a given path. isOpen={true} forces the expanded layout
// so the ListItemText labels (which only render when open) are in the DOM.
const renderSidebar = (initialPath: string) =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Sidebar isOpen={true} />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Sidebar', () => {
  describe('admin sidebar (on an /admin/* path)', () => {
    it('includes a "Master" entry alongside the other admin items', () => {
      renderSidebar('/admin/users');

      // The admin set is shown — Dashboard / User Management / Master all present.
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Master')).toBeInTheDocument();
    });

    it('navigates to /admin/master when the admin "Master" entry is clicked', () => {
      renderSidebar('/admin/users');

      fireEvent.click(screen.getByText('Master'));

      expect(navigateSpy).toHaveBeenCalledWith('/admin/master');
    });

    it('renders exactly one "Master" entry in the admin set', () => {
      renderSidebar('/admin');

      expect(screen.getAllByText('Master')).toHaveLength(1);
    });
  });

  describe('base (pharmacist) sidebar (on a non-admin path)', () => {
    it('still includes its own "Master" entry', () => {
      renderSidebar('/dashboard');

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Master')).toBeInTheDocument();
    });

    it('navigates to the pharmacist /master route (unchanged) when its "Master" entry is clicked', () => {
      renderSidebar('/dashboard');

      fireEvent.click(screen.getByText('Master'));

      // Pharmacist Master route is /master, NOT /admin/master.
      expect(navigateSpy).toHaveBeenCalledWith('/master');
    });
  });
});
