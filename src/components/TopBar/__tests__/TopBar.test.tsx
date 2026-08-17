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

// Mock the notificationsApi hooks (notification centre) so the test store needs no
// RTK Query reducer. Data is driven by mutable refs so individual tests can seed it.
let mockSummary: { unreadCount: number; byType: any; byModule: any } = {
  unreadCount: 0,
  byType: {},
  byModule: {},
};
let mockList: { unreadCount: number; count: number; notifications: any[] } | undefined = {
  unreadCount: 0,
  count: 0,
  notifications: [],
};
let mockListFetching = false;
let mockListError: unknown = undefined;
// Every `useGetNotificationsQuery` arg the component asked for, in order.
const mockListArgs: any[] = [];
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockDismiss = jest.fn();
const mockRefetch = jest.fn();
jest.mock('../../../redux/slices/notificationsApi', () => ({
  useGetNotificationSummaryQuery: () => ({ data: mockSummary }),
  // Emulates the two server-side params the panel relies on (`type`, `limit`) so
  // a test can prove a filter/limit actually changes what is on screen rather
  // than only what was requested.
  useGetNotificationsQuery: (args: any) => {
    mockListArgs.push(args);
    // A failed fetch leaves RTK Query with no data — mirror that here.
    const page = mockListError ? undefined : mockList;
    return {
      data: page
        ? {
            ...page,
            notifications: page.notifications
              .filter((n: any) => !args?.type || n.type === args.type)
              .slice(0, args?.limit ?? 50),
          }
        : undefined,
      isFetching: mockListFetching,
      error: mockListError,
      refetch: mockRefetch,
    };
  },
  useMarkNotificationReadMutation: () => [mockMarkRead],
  useMarkAllNotificationsReadMutation: () => [mockMarkAllRead],
  useDismissNotificationMutation: () => [mockDismiss],
}));

import { TopBar } from '../TopBar';
import { notificationTypeLabel } from '../../../config/label/Notifications.labels';

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
  // Default: empty bell. Individual tests override before rendering.
  mockSummary = { unreadCount: 0, byType: {}, byModule: {} };
  mockList = { unreadCount: 0, count: 0, notifications: [] };
  mockListFetching = false;
  mockListError = undefined;
  mockListArgs.length = 0;
  mockMarkRead.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1, read_at: 'now' }) });
  mockMarkAllRead.mockReturnValue({ unwrap: () => Promise.resolve({ updated: 2 }) });
  mockDismiss.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1, dismissed_at: 'now' }) });
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


describe('TopBar — notification centre bell', () => {
  const notification = (over: Record<string, any>) => ({
    id: 1,
    module: 'pharmacy',
    type: 'NEAR_EXPIRY',
    severity: 'HIGH',
    title: 'Amoxicillin (B-1M) expires in 20 days',
    body: '25 units expiring on 29/07/2026',
    payload: { window: '1month' },
    status: 'ACTIVE',
    first_seen_at: '2026-08-17T00:00:00.000Z',
    last_seen_at: '2026-08-17T00:00:00.000Z',
    read_at: null,
    dismissed_at: null,
    resolved_at: null,
    ...over,
  });

  const nearExpiry1Month = notification({ id: 1 });
  const nearExpiry3Month = notification({
    id: 2,
    severity: 'MEDIUM',
    title: 'Cetirizine (B-3M) expires in 60 days',
    payload: { window: '3month' },
  });
  const expired = notification({
    id: 3,
    type: 'EXPIRED',
    severity: 'CRITICAL',
    title: 'Paracetamol (B-EXP) has expired',
    payload: { daysPastExpiry: 4 },
  });
  const lowStock = notification({
    id: 4,
    type: 'LOW_STOCK',
    severity: 'HIGH',
    title: 'Ibuprofen is below its minimum quantity',
    payload: { currentQuantity: 2, min_qty: 10 },
  });
  const excessStock = notification({
    id: 5,
    type: 'EXCESS_STOCK',
    severity: 'LOW',
    title: 'Vitamin C is above its maximum quantity',
    payload: { currentQuantity: 900, max_qty: 500 },
    read_at: '2026-08-17T06:00:00.000Z',
  });

  const futureType = notification({
    id: 6,
    type: 'FUTURE_TYPE',
    severity: 'WEIRD',
    title: 'A type this build has never seen',
    payload: {},
  });

  const seed = (notifications: any[], unreadCount = notifications.length) => {
    // Mirrors the server summary: byType counts UNREAD active rows only and is
    // zero-filled from the registry, so it is the list of types that exist.
    const byType: Record<string, number> = {};
    notifications.forEach((item) => {
      byType[item.type] = (byType[item.type] ?? 0) + (item.read_at ? 0 : 1);
    });
    mockSummary = { unreadCount, byType, byModule: { pharmacy: unreadCount } };
    mockList = { unreadCount, count: notifications.length, notifications };
  };

  const chip = (type: string, count: number) =>
    screen.getByRole('button', { name: `${notificationTypeLabel(type)} (${count})` });

  const openBell = () => fireEvent.click(screen.getByLabelText('Notifications'));

  it('shows the empty state and a disabled "Mark all read" when there are no notifications', () => {
    renderTopBar();
    openBell();

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.getByText('All read')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
  });

  it("badges the server's unreadCount (not the returned page size) and lists every type", () => {
    // unreadCount deliberately differs from notifications.length — the badge must
    // follow the server value.
    seed([nearExpiry1Month, nearExpiry3Month, expired, lowStock, excessStock], 4);
    renderTopBar();

    expect(screen.getByText('4')).toBeInTheDocument();

    openBell();

    expect(screen.getAllByText('Near expiry')).toHaveLength(2);
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Low stock')).toBeInTheDocument();
    expect(screen.getByText('Excess stock')).toBeInTheDocument();
    // Server-rendered title + body are displayed verbatim.
    expect(screen.getByText('Paracetamol (B-EXP) has expired')).toBeInTheDocument();
    expect(screen.getAllByText('25 units expiring on 29/07/2026').length).toBeGreaterThan(0);
    expect(screen.getByText('4 unread')).toBeInTheDocument();
  });

  // The badge is capped so it never grows wide enough to cover the bell glyph.
  it.each([
    [1, '1'],
    [9, '9'],
    [150, '9+'],
  ])('caps the badge at "9+" (unreadCount %i)', (unreadCount, expected) => {
    mockSummary = { unreadCount, byType: {}, byModule: {} };
    renderTopBar();

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    ['LOW_STOCK', lowStock, { tab: 'low' }],
    ['EXCESS_STOCK', excessStock, { tab: 'excess' }],
    ['EXPIRED', expired, { tab: 'expired' }],
    ['NEAR_EXPIRY 1month', nearExpiry1Month, { tab: 'nearExpiry', nearExpiryMonths: 1 }],
    ['NEAR_EXPIRY 3month', nearExpiry3Month, { tab: 'nearExpiry', nearExpiryMonths: 3 }],
  ])('deep-links a %s notification to the matching inventory tab', (_name, item, state) => {
    seed([item]);
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByText(item.title));

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', { state });
  });

  it('marks an unread notification read on click', async () => {
    seed([nearExpiry1Month]);
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByText(nearExpiry1Month.title));

    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith(1));
  });

  it('does not re-mark an already-read notification (read state comes from the server)', () => {
    seed([excessStock], 0);
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByText(excessStock.title));

    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('renders an unknown type as a generic row with no deep-link and still marks it read', async () => {
    seed([notification({ id: 9, type: 'FUTURE_TYPE', severity: 'WEIRD', title: 'Something new' })]);
    renderTopBar();
    openBell();

    expect(screen.getByText('Alert')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Something new'));

    expect(mockNavigate).not.toHaveBeenCalled();
    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith(9));
  });

  it('dismisses a single notification without navigating', async () => {
    seed([lowStock]);
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByLabelText(`Dismiss: ${lowStock.title}`));

    await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith(4));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('marks every notification read from the header action', async () => {
    seed([nearExpiry1Month, lowStock]);
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));

    await waitFor(() => expect(mockMarkAllRead).toHaveBeenCalledTimes(1));
  });

  it('surfaces a failed mutation as an error message in the menu', async () => {
    mockDismiss.mockReturnValue({ unwrap: () => Promise.reject({ data: { error: 'Notification not found' } }) });
    seed([lowStock]);
    renderTopBar();
    openBell();

    fireEvent.click(screen.getByLabelText(`Dismiss: ${lowStock.title}`));

    expect(await screen.findByText('Notification not found')).toBeInTheDocument();
  });

  it('shows the fetch error (never "all caught up") when the list fails to load', () => {
    // The badge still says 6 unread — telling the user they are caught up would
    // be the exact opposite of the truth.
    mockSummary = { unreadCount: 6, byType: {}, byModule: {} };
    mockListError = { status: 500, data: { error: 'Server error' } };
    renderTopBar();
    openBell();

    expect(screen.getByText('Server error')).toBeInTheDocument();
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    expect(screen.queryByText('Stock and expiry alerts will appear here.')).not.toBeInTheDocument();
    expect(screen.getByText('6 unread')).toBeInTheDocument();
  });

  it('retries the list fetch from the error state', () => {
    mockListError = { status: 500, data: { error: 'Server error' } };
    renderTopBar();
    openBell();
    mockRefetch.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  // REGRESSION GUARD (QA 2026-08-17): the server sorts by severity rank, so one
  // unfiltered page of 50 was entirely CRITICAL/HIGH and the MEDIUM/LOW types
  // never rendered at all. Every type the server reports must be reachable, and
  // this test derives them from `byType` — it must keep working when the
  // registry grows a fifth type, so nothing here may enumerate the types.
  it('makes every type in the summary byType reachable through the panel filters', () => {
    const items = [expired, lowStock, nearExpiry1Month, nearExpiry3Month, excessStock, futureType];
    seed(items);
    const byType = mockSummary.byType as Record<string, number>;
    // Sanity: the fixture must actually contain a type the frontend has no
    // literal for, otherwise this proves nothing about an open type set.
    expect(Object.keys(byType).length).toBeGreaterThan(4);

    renderTopBar();
    openBell();

    Object.entries(byType).forEach(([type, count]) => {
      fireEvent.click(chip(type, count));

      const ofType = items.filter((item) => item.type === type);
      ofType.forEach((item) =>
        expect(screen.getByText(item.title)).toBeInTheDocument(),
      );
      items
        .filter((item) => item.type !== type)
        .forEach((item) =>
          expect(screen.queryByText(item.title)).not.toBeInTheDocument(),
        );
      // The list is narrowed server-side, never by slicing a page client-side.
      expect(mockListArgs[mockListArgs.length - 1]).toEqual({ type, limit: 50 });
    });
  });

  it('counts only the active type in the header, so the count never contradicts the rows', () => {
    seed([expired, lowStock, nearExpiry1Month]);
    renderTopBar();
    openBell();
    expect(screen.getByText('3 unread')).toBeInTheDocument();

    fireEvent.click(chip('NEAR_EXPIRY', 1));

    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(screen.getByText(nearExpiry1Month.title)).toBeInTheDocument();
  });

  it('scopes "Mark all read" to the active type filter', async () => {
    seed([expired, lowStock, nearExpiry1Month]);
    renderTopBar();
    openBell();
    fireEvent.click(chip('LOW_STOCK', 1));

    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));

    await waitFor(() => expect(mockMarkAllRead).toHaveBeenCalledWith({ type: 'LOW_STOCK' }));
  });

  it('returns to the unfiltered list from the "All" chip', () => {
    seed([expired, lowStock]);
    renderTopBar();
    openBell();
    fireEvent.click(chip('EXPIRED', 1));
    expect(screen.queryByText(lowStock.title)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All (2)' }));

    expect(screen.getByText(lowStock.title)).toBeInTheDocument();
    expect(screen.getByText(expired.title)).toBeInTheDocument();
    expect(mockListArgs[mockListArgs.length - 1]).toEqual({ type: undefined, limit: 50 });
  });

  it('loads more of a full page without ever exceeding the server limit of 200', () => {
    const many = Array.from({ length: 60 }, (_, index) =>
      notification({ id: 100 + index, type: 'LOW_STOCK', title: `Low stock item ${index}` }),
    );
    seed(many);
    renderTopBar();
    openBell();
    // A full page: 50 of the 60 unread the header advertises.
    expect(screen.getByText('60 unread')).toBeInTheDocument();
    expect(screen.queryByText('Low stock item 59')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(screen.getByText('Low stock item 59')).toBeInTheDocument();
    expect(mockListArgs[mockListArgs.length - 1]).toEqual({ type: undefined, limit: 100 });
    // The page is no longer full, so there is nothing left to load.
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    mockListArgs.forEach((args) => expect(args.limit).toBeLessThanOrEqual(200));
  });

  it('shows neither the empty state nor an error while the first fetch is in flight', () => {
    // First open: fetch in flight, so RTK Query has no data yet.
    mockListFetching = true;
    mockList = undefined;
    renderTopBar();
    openBell();

    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    expect(screen.queryByText('Could not load notifications.')).not.toBeInTheDocument();
  });
});
