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

// The sidebar brand reads the org via useGetMeQuery; mock it so the minimal
// test store (no orgApi reducer/middleware) does not need the live query layer.
jest.mock('../../../redux/slices/orgApi', () => ({
  ...jest.requireActual('../../../redux/slices/orgApi'),
  useGetMeQuery: () => ({ data: { organization: null } }),
}));

// Minimal auth store — Sidebar only reads state.auth.user.
const createStore = (user: any = { id: 1, role: 0 }) =>
  configureStore({
    reducer: {
      auth: (state = { user, token: 'JWT', isAuthenticated: true }) => state,
      org: (state = { organization: null, activeModules: [], loaded: false }) => state,
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
  describe('pharmacy admin sidebar (on an /admin/* path)', () => {
    it('includes a "Master" entry alongside the other admin items', () => {
      renderSidebar('/admin/users');

      // The pharmacy admin set is shown — labels mirror the dashboard tiles.
      expect(screen.getByText('Pharmacy Home')).toBeInTheDocument();
      expect(screen.getByText('User Account Management')).toBeInTheDocument();
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

    it('no longer surfaces the org-level Role Management or System Settings items', () => {
      renderSidebar('/admin');

      // Role management + module toggle moved out of pharmacy admin into /org.
      expect(screen.queryByText('Role Management')).not.toBeInTheDocument();
      // System Settings (pharmacy daily-report settings) stays, but the org module
      // toggle does not appear in the pharmacy admin sidebar.
      expect(screen.queryByText('Modules')).not.toBeInTheDocument();
    });
  });

  describe('pharmacy app sidebar (on a non-admin pharmacy path)', () => {
    it('shows Home + pharmacy module items only (no outpatient items)', () => {
      renderSidebar('/dashboard');

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Master')).toBeInTheDocument();
      // Outpatient is a separate area — never mixed into pharmacy.
      expect(screen.queryByText('Appointments')).not.toBeInTheDocument();
      expect(screen.queryByText('Live Queue')).not.toBeInTheDocument();
    });

    it('navigates to the pharmacy /master route (unchanged) when its "Master" entry is clicked', () => {
      renderSidebar('/dashboard');

      fireEvent.click(screen.getByText('Master'));

      // Pharmacy Master route is /master, NOT /admin/master.
      expect(navigateSpy).toHaveBeenCalledWith('/master');
    });
  });

  describe('outpatient sidebar (on an /outpatient/* path)', () => {
    it('shows outpatient items only — no Home or pharmacy items', () => {
      renderSidebar('/outpatient');

      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Live Queue')).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Sales')).not.toBeInTheDocument();
    });
  });

  describe('org sidebar (on an /org/* path)', () => {
    it('shows the org nav — Org Home, Role Management, Modules, Organization Settings, Org Label', () => {
      renderSidebar('/org');

      expect(screen.getByText('Org Home')).toBeInTheDocument();
      expect(screen.getByText('Role Management')).toBeInTheDocument();
      expect(screen.getByText('Modules')).toBeInTheDocument();
      expect(screen.getByText('Organization Settings')).toBeInTheDocument();
      expect(screen.getByText('Org Label')).toBeInTheDocument();
      // No pharmacy/outpatient cross-mixing.
      expect(screen.queryByText('Sales')).not.toBeInTheDocument();
      expect(screen.queryByText('Appointments')).not.toBeInTheDocument();
    });

    it('navigates to /org/roles when Role Management is clicked', () => {
      renderSidebar('/org');

      fireEvent.click(screen.getByText('Role Management'));

      expect(navigateSpy).toHaveBeenCalledWith('/org/roles');
    });
  });
});
