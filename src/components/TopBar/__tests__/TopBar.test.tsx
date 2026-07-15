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

// Mock the alertsApi query hook (notification bell) so the test store needs no RTK Query reducer.
// The returned data is driven by a mutable ref so individual tests can seed alerts.
let mockAlertsData: { count: number; alerts: any[] } = { count: 0, alerts: [] };
jest.mock('../../../redux/slices/alertsApi', () => ({
  useGetAlertsQuery: () => ({ data: mockAlertsData, refetch: jest.fn() }),
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
  // Default: empty alerts feed. Individual tests override before rendering.
  mockAlertsData = { count: 0, alerts: [] };
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

describe('TopBar — near-expiry notification bell', () => {
  const oneMonthAlert = {
    id: 'near-expiry-1',
    type: 'NEAR_EXPIRY',
    product_id: 10,
    name: 'Amoxicillin',
    brand_name: 'Acme',
    medicine_type: 'Tablet',
    batch_id: 1,
    batchNumber: 'B-1M',
    currentQuantity: 25,
    expiryDate: '2026-07-29',
    daysUntilExpiry: 20,
    window: '1month' as const,
  };
  const threeMonthAlert = {
    id: 'near-expiry-2',
    type: 'NEAR_EXPIRY',
    product_id: 20,
    name: 'Cetirizine',
    brand_name: 'Acme',
    medicine_type: 'Tablet',
    batch_id: 2,
    batchNumber: 'B-3M',
    currentQuantity: 40,
    expiryDate: '2026-09-07',
    daysUntilExpiry: 60,
    window: '3month' as const,
  };

  const seedAlerts = () => {
    mockAlertsData = { count: 2, alerts: [oneMonthAlert, threeMonthAlert] };
  };

  const openBell = () => {
    fireEvent.click(screen.getByLabelText('Notifications'));
  };

  it('shows the alert count on the bell badge and renders each alert row', () => {
    seedAlerts();
    renderTopBar();

    // Badge shows the count from the feed.
    expect(screen.getByText('2')).toBeInTheDocument();

    openBell();

    // Both medicine names render (name · batchNumber primary text).
    expect(screen.getByText('Amoxicillin · B-1M')).toBeInTheDocument();
    expect(screen.getByText('Cetirizine · B-3M')).toBeInTheDocument();

    // "Expires in" secondary text for each row.
    expect(screen.getByText('Expires in 20 days')).toBeInTheDocument();
    expect(screen.getByText('Expires in 60 days')).toBeInTheDocument();
  });

  it("navigates to inventory nearExpiry tab with month=1 when a '1month' alert is clicked", () => {
    seedAlerts();
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByText('Amoxicillin · B-1M'));

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', {
      state: { tab: 'nearExpiry', nearExpiryMonths: 1 },
    });
  });

  it("navigates to inventory nearExpiry tab with month=3 when a '3month' alert is clicked", () => {
    seedAlerts();
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByText('Cetirizine · B-3M'));

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', {
      state: { tab: 'nearExpiry', nearExpiryMonths: 3 },
    });
  });
});
