import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserProfile from '../UserProfile';
import {
  useGetProfileQuery,
  useGetProfileActivityQuery,
  Profile,
  ProfileActivity,
} from '../../../redux/slices/profileApi';
import { USER_PROFILE_LABELS as L } from '../../../config/label/UserProfile.labels';

const theme = createTheme();

// Auto-mock the slice. IMPORTANT: both hooks must be given return values in
// beforeEach so the component's destructuring never reads from `undefined`
// (see agentic-control/.claude/memory/gotchas.md → "New RTK Query hook breaks
// auto-mocked slice test suites").
jest.mock('../../../redux/slices/profileApi');

const mockUseGetProfileQuery = useGetProfileQuery as jest.MockedFunction<
  typeof useGetProfileQuery
>;
const mockUseGetProfileActivityQuery =
  useGetProfileActivityQuery as jest.MockedFunction<
    typeof useGetProfileActivityQuery
  >;

// Minimal RTK Query result shape the component reads (data/isLoading/isError).
const queryResult = (
  data: any,
  { isLoading = false, isError = false }: { isLoading?: boolean; isError?: boolean } = {}
) =>
  ({
    data,
    isLoading,
    isError,
    isSuccess: !isLoading && !isError,
    isFetching: false,
    isUninitialized: false,
    error: isError ? { status: 500 } : undefined,
    refetch: jest.fn(),
  }) as any;

const mockProfile: Profile = {
  id: 5,
  username: 'jdoe',
  email: 'jdoe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'pharmacist',
  status: 'active',
  last_login: '2026-06-17T10:00:00.000Z',
  created_at: '2025-01-01T00:00:00.000Z',
  address_line1: '12 Main St',
  address_line2: 'Apt 4',
  city: 'Mumbai',
  state: 'MH',
  postal_code: '400001',
  country: 'India',
  identity_document_type: 'Aadhaar',
  identity_document_number_masked: '••••9012',
};

const mockActivity: ProfileActivity[] = [
  {
    module: 'Sales',
    event_type: 'Sale Created',
    event_time: '2026-06-17T12:00:00.000Z',
    event_details: 'Invoice INV-1',
  },
  {
    module: 'Admin',
    event_type: 'Login',
    event_time: '2026-06-17T09:00:00.000Z',
    event_details: null,
  },
];

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <UserProfile />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  // Sensible defaults so destructuring never throws; tests override per-case.
  mockUseGetProfileQuery.mockReturnValue(queryResult(mockProfile));
  mockUseGetProfileActivityQuery.mockReturnValue(
    queryResult({ activity: mockActivity })
  );
});

describe('UserProfile', () => {
  it('renders a spinner while the profile is loading', () => {
    mockUseGetProfileQuery.mockReturnValue(queryResult(undefined, { isLoading: true }));
    mockUseGetProfileActivityQuery.mockReturnValue(
      queryResult(undefined, { isLoading: true })
    );

    const { container } = renderPage();
    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    // The profile sections should not be present while loading.
    expect(screen.queryByText('jdoe@example.com')).not.toBeInTheDocument();
  });

  it('renders the error message when the profile query errors', () => {
    mockUseGetProfileQuery.mockReturnValue(queryResult(undefined, { isError: true }));

    renderPage();
    expect(screen.getByText(L.ERROR.PROFILE)).toBeInTheDocument();
  });

  it('renders name, role, status, email and masked identity number on success', () => {
    renderPage();

    // Header: full name + username + role/status chips. The username renders as
    // "@" + value across two text nodes, so match on the containing element.
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, el) =>
          el?.tagName.toLowerCase() === 'p' &&
          el?.textContent === `${L.HEADER.USERNAME_PREFIX}jdoe`
      )
    ).toBeInTheDocument();
    expect(screen.getByText('pharmacist')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();

    // Account + identity fields.
    expect(screen.getByText('jdoe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Aadhaar')).toBeInTheDocument();
    expect(screen.getByText('••••9012')).toBeInTheDocument();
  });

  it('renders the recent-activity rows on success', () => {
    renderPage();

    expect(screen.getByText('Sale Created')).toBeInTheDocument();
    expect(screen.getByText('Invoice INV-1')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    // The activity section title is present.
    expect(screen.getByText(L.SECTIONS.RECENT_ACTIVITY.TITLE)).toBeInTheDocument();
  });

  it('renders the empty-state when the activity array is empty', () => {
    mockUseGetProfileActivityQuery.mockReturnValue(
      queryResult({ activity: [] })
    );

    renderPage();
    expect(screen.getByText(L.SECTIONS.RECENT_ACTIVITY.EMPTY)).toBeInTheDocument();
    // No activity row content from the default mock should appear.
    expect(screen.queryByText('Sale Created')).not.toBeInTheDocument();
  });
});
