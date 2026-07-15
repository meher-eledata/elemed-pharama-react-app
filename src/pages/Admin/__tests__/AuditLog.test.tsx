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
    ip_address: '10.0.0.1',
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
    ip_address: '192.168.1.5',
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
    ip_address: null, // historical row — renders as '-'
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

describe('AuditLog — time zone + IP column (#1/#4)', () => {
  // Locate the table row whose event_details text identifies it, then scope queries to it.
  const rowFor = (detail: string): HTMLElement => {
    const row = screen.getByText(detail).closest('tr');
    if (!row) throw new Error(`row for "${detail}" not found`);
    return row as HTMLElement;
  };

  it('renders a UTC event_time in IST (Asia/Kolkata), crossing to the next calendar day', () => {
    // 2026-06-20 20:00 UTC + 05:30 (IST) = 2026-06-21 01:30 IST — the DATE and HOUR
    // both differ from the UTC value, proving the offset is actually applied.
    renderPage([
      {
        id: 10,
        username: 'alice',
        role: 0,
        module: 'Sale',
        event_type: 'Submit',
        event_time: '2026-06-20 20:00:00',
        event_details: 'ist-offset-row',
        quantity_changed: '',
        related_id: 1,
        ip_address: '203.0.113.9',
      },
    ]);

    // Format is 'DD MMM YYYY, hh:mm A' in IST.
    expect(screen.getByText('21 Jun 2026, 01:30 AM')).toBeInTheDocument();
    // The raw UTC calendar day must NOT be shown.
    expect(screen.queryByText(/20 Jun 2026/)).not.toBeInTheDocument();
  });

  it('shows the IP address for a row that has one, and "-" for a null-ip row', () => {
    renderPage([
      {
        id: 20,
        username: 'alice',
        role: 0,
        module: 'Sale',
        event_type: 'Submit',
        event_time: '2026-06-20 10:00:00',
        event_details: 'has-ip-row',
        quantity_changed: '',
        related_id: 1,
        ip_address: '198.51.100.23',
      },
      {
        id: 21,
        username: 'system',
        role: null,
        module: 'Authentication',
        event_type: 'Logout',
        event_time: '2026-06-20 11:00:00',
        event_details: 'null-ip-row',
        quantity_changed: '',
        related_id: '',
        ip_address: null, // historical row — must render as '-'
      },
    ]);

    // The populated row shows its IP.
    expect(within(rowFor('has-ip-row')).getByText('198.51.100.23')).toBeInTheDocument();

    // The null-ip row shows a dash (scoped to that row so we don't match other '-' cells
    // in the populated row).
    const nullRow = rowFor('null-ip-row');
    expect(within(nullRow).queryByText('198.51.100.23')).not.toBeInTheDocument();
    expect(within(nullRow).getAllByText('-').length).toBeGreaterThan(0);
  });
});
