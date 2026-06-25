import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the adminSlice so we can feed the activity-log query a controlled payload.
// IMPORTANT (auto-mock gotcha): AuditLog only uses useGetActivityLogQuery from this slice,
// so a partial mock of just that hook is enough.
jest.mock('../../../redux/slices/adminSlice', () => ({
  useGetActivityLogQuery: jest.fn(),
}));

import { useGetActivityLogQuery } from '../../../redux/slices/adminSlice';
import AuditLog from '../AuditLog';
import { AUDIT_LOG_LABELS } from '../../../config/label/AuditLog.labels';

const mockedUseGetActivityLog = useGetActivityLogQuery as unknown as jest.Mock;

// Raw rows AS SENT BY THE BACKEND: snake_case fields + INTEGER role (0/1) / null.
const RAW_ROWS = [
  {
    id: 1,
    username: 'alice',
    role: 0, // Admin (integer)
    module: 'Doctor', // rolls up to "Master"
    event_type: 'User Creation', // → Create
    event_time: '2026-06-20 10:00',
    event_details: 'Created a new doctor named Strangelove',
    quantity_changed: '',
    related_id: 42,
  },
  {
    id: 2,
    username: 'bob',
    role: 1, // Pharmacist (integer)
    module: 'Sale',
    event_type: 'Submit',
    event_time: '2026-06-21 11:00',
    event_details: 'Submitted invoice INV-001',
    quantity_changed: 3,
    related_id: 7,
  },
  {
    id: 3,
    username: 'system',
    role: null, // System row
    module: 'Authentication',
    event_type: 'Logout',
    event_time: '2026-06-22 12:00',
    event_details: 'test-zebra-detail', // only matchable via details search (has "test" & "zebra")
    quantity_changed: '',
    related_id: '',
  },
];

const renderPage = (rows: unknown[] = RAW_ROWS) => {
  mockedUseGetActivityLog.mockReturnValue({
    data: { activityLog: rows },
    isLoading: false,
    error: undefined,
  });
  return render(
    <MemoryRouter>
      <AuditLog />
    </MemoryRouter>,
  );
};

const openFilters = () => {
  fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
};

const getSearchInput = () =>
  screen.getByPlaceholderText(AUDIT_LOG_LABELS.SEARCH_PLACEHOLDER) as HTMLInputElement;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuditLog — canonical display mapping', () => {
  it('rolls a raw "Doctor" module up to "Master" in the table', () => {
    renderPage();
    expect(screen.getByText('Master')).toBeInTheDocument();
    // No standalone "Doctor" module cell.
    expect(screen.queryByText('Doctor')).not.toBeInTheDocument();
  });

  it('maps integer role 0/1 → Admin/Pharmacist chips and null → System', () => {
    renderPage();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Pharmacist')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    // The raw integer must NOT be rendered as a role.
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('maps event_type "User Creation" → "Create"', () => {
    renderPage();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.queryByText('User Creation')).not.toBeInTheDocument();
  });
});

describe('AuditLog — fixed canonical filter dropdowns', () => {
  const openAutocomplete = (placeholder: string) => {
    const input = screen.getByPlaceholderText(placeholder);
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    return screen.getByRole('listbox');
  };

  it('Module filter shows the fixed canonical options (incl. Master, not Doctor)', () => {
    renderPage();
    openFilters();
    const listbox = openAutocomplete('Search module...');
    expect(within(listbox).getByText('Master')).toBeInTheDocument();
    expect(within(listbox).getByText('Sales')).toBeInTheDocument();
    expect(within(listbox).queryByText('Doctor')).not.toBeInTheDocument();
  });

  it('Role filter shows exactly [Admin, Pharmacist]', () => {
    renderPage();
    openFilters();
    const listbox = openAutocomplete('Search access level...');
    expect(within(listbox).getByText('Admin')).toBeInTheDocument();
    expect(within(listbox).getByText('Pharmacist')).toBeInTheDocument();
    expect(within(listbox).queryByText('System')).not.toBeInTheDocument();
  });
});

describe('AuditLog — search', () => {
  it('finds a row whose term is ONLY in event_details', () => {
    renderPage();
    fireEvent.change(getSearchInput(), { target: { value: 'zebra' } });
    expect(screen.getByText('test-zebra-detail')).toBeInTheDocument();
    // Other rows' details are filtered out.
    expect(screen.queryByText('Submitted invoice INV-001')).not.toBeInTheDocument();
  });

  it('searches canonical role label (e.g. "pharmacist")', () => {
    renderPage();
    fireEvent.change(getSearchInput(), { target: { value: 'pharmacist' } });
    expect(screen.getByText('Submitted invoice INV-001')).toBeInTheDocument();
    expect(screen.queryByText('Created a new doctor named Strangelove')).not.toBeInTheDocument();
  });

  it('does NOT crash on arbitrary input "testa" (the prior ErrorBoundary repro)', () => {
    renderPage();
    // Before the fix, the integer role hit .toLowerCase() in the search predicate and threw.
    expect(() => {
      fireEvent.change(getSearchInput(), { target: { value: 'testa' } });
    }).not.toThrow();
    // "testa" matches nothing → page still renders the title (no ErrorBoundary).
    expect(screen.getByText(AUDIT_LOG_LABELS.PAGE_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('partial term "test" also filters gracefully without crashing', () => {
    renderPage();
    expect(() => {
      fireEvent.change(getSearchInput(), { target: { value: 'test' } });
    }).not.toThrow();
    // "test" appears in the detail token row.
    expect(screen.getByText('test-zebra-detail')).toBeInTheDocument();
  });
});
