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

// The sidebar brand now sources the org logo/name via useGetMeQuery. Mock it so
// the test controls the org context without a live network layer.
let mockMe: any = { organization: null };
jest.mock('../../../redux/slices/orgApi', () => ({
  ...jest.requireActual('../../../redux/slices/orgApi'),
  useGetMeQuery: () => ({ data: mockMe }),
}));

import { Sidebar } from '../SideBar';

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', isAuthenticated: true, user: { role: 1 } }) => state,
      org: (state = { organization: null, activeModules: [], loaded: false }) => state,
    },
  });

const renderSidebar = () =>
  render(
    <Provider store={createStore()}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </Provider>,
  );

const clickLogo = () => fireEvent.click(screen.getByAltText('Logo'));

beforeEach(() => {
  jest.clearAllMocks();
  mockMe = { organization: null };
});

describe('Sidebar logo — org brand + home navigation', () => {
  it('navigates to /home when the logo is clicked', () => {
    renderSidebar();
    clickLogo();
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('shows the default Elemed logo when the org has none', () => {
    renderSidebar();
    // fileMock returns a stub path; the default asset import resolves to it.
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('uses the org logo_url as the image source when present', () => {
    mockMe = { organization: { id: 1, name: 'Acme', slug: 'acme', logo_url: 'data:image/png;base64,AAA' } };
    renderSidebar();
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', 'data:image/png;base64,AAA');
  });
});
