import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import authReducer from '../../../redux/slices/authSlice';
import { complianceApi, type ComplianceCalendarItem } from '../../../redux/slices/complianceApi';
import ComplianceCalendar from '../ComplianceCalendar';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const base: ComplianceCalendarItem = {
  document_id: 1, title: 'Pharmacy Licence', reference_number: 'PL-1', document_type_id: 1,
  type_key: 'pharmacy_licence', type_name: 'Pharmacy Licence', category: 'Licence',
  is_required: true, version_id: 3, version_no: 2, valid_from: '2025-01-01',
  valid_to: dayjs().add(5, 'day').format('YYYY-MM-DD'), issued_by: 'Drug Control',
  daysUntilExpiry: 5, daysPastExpiry: null, lead_days: [60, 30, 7], innermost_lead_day: 7,
  state: 'EXPIRING',
};
const expired: ComplianceCalendarItem = {
  ...base, document_id: 2, title: 'NDPS Licence', type_name: 'NDPS Licence',
  valid_to: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), daysUntilExpiry: null,
  daysPastExpiry: 10, state: 'EXPIRED',
};
const typeOnly: ComplianceCalendarItem = {
  ...base, document_id: null, title: null, document_type_id: 7, type_key: 'ndps_affidavit',
  type_name: 'Affidavit', version_id: null, version_no: null, valid_from: null, valid_to: null,
  daysUntilExpiry: null, daysPastExpiry: null, state: 'MISSING',
};
const noVersion: ComplianceCalendarItem = {
  ...typeOnly, document_id: 9, title: 'Transport Permit', document_type_id: 8,
  type_name: 'Transport Permit', state: 'NO_VERSION',
};
const noExpiry: ComplianceCalendarItem = {
  ...base, document_id: 4, title: 'Shop Licence', valid_to: null, daysUntilExpiry: null,
  state: 'NO_EXPIRY',
};

// The page also reads the catalogue: with no document types there is nothing to
// track, which must not read as "all clear".
const DEFAULT_TYPE = { id: 1, key: 'pharmacy_licence', name: 'Pharmacy Licence', description: null, category: 'Licence', is_required: true, default_validity_months: null, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
let catalogue: unknown[] = [DEFAULT_TYPE];
let calendarBody: Record<string, unknown> | null = null;

beforeEach(() => {
  mockNavigate.mockClear();
  catalogue = [DEFAULT_TYPE];
  calendarBody = null;
  global.fetch = jest.fn(async (input: any) => {
    const url = typeof input === 'string' ? input : input.url;
    const body = url.includes('document-types') ? catalogue : calendarBody ?? {
      from: dayjs().startOf('month').format('YYYY-MM-DD'),
      to: dayjs().endOf('month').format('YYYY-MM-DD'),
      items: [expired, base],
      missing: [typeOnly, noVersion],
      no_expiry: [noExpiry],
    };
    return {
      ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => body, text: async () => JSON.stringify(body), clone() { return this; },
    } as any;
  }) as any;
});

const renderPage = () => {
  const store = configureStore({
    reducer: { auth: authReducer, [complianceApi.reducerPath]: complianceApi.reducer },
    middleware: (gdm) => gdm().concat(complianceApi.middleware),
  });
  return render(
    <Provider store={store}>
      <MemoryRouter><ComplianceCalendar /></MemoryRouter>
    </Provider>,
  );
};

it('separates overdue and upcoming rows', async () => {
  renderPage();
  expect(await screen.findByText('Expired 10 days ago')).toBeInTheDocument();
  expect(screen.getByText('Expires in 5 days')).toBeInTheDocument();
});

// The "Nothing filed yet" and "Documents without Expiry" sections were removed from
// this page. The payload still carries `missing` and `no_expiry` (the banner below
// counts `missing`), so this pins that they are not rendered as agenda rows —
// re-adding a section should be a deliberate act, not a silent regression.
it('no longer renders the nothing-filed or no-expiry sections', async () => {
  renderPage();
  await screen.findByText('Expired 10 days ago');
  expect(screen.queryByText('Nothing filed yet')).not.toBeInTheDocument();
  expect(screen.queryByText('Documents without Expiry')).not.toBeInTheDocument();
  // Type-only MISSING rendered from type_name; NO_VERSION kept its own title.
  expect(screen.queryByText('Affidavit')).not.toBeInTheDocument();
  expect(screen.queryByText('Transport Permit')).not.toBeInTheDocument();
  expect(screen.queryByText('Shop Licence')).not.toBeInTheDocument();
});

// An unfiled required licence is still the loudest fact this page can state, so it
// must survive the section's removal at the top of the page.
it('still counts unfiled documents in the next-action banner', async () => {
  renderPage();
  expect(await screen.findByText(/Next action:/)).toBeInTheDocument();
});

// REMOVED WITH THE "Nothing filed yet" SECTION: two tests used to pin the calendar's
// missing-row actions ("File this document" / "Upload the first version") to the
// exact destinations the notification bell uses for the same facts — the divergence
// class this module had been bitten by twice. The calendar no longer renders those
// rows, so there is nothing left to click and the guard could not be kept.
//
// The bell side is still covered on its own in
// src/config/constants/__tests__/Notifications.constants.test.ts, but NOTHING now
// holds the two surfaces to the same answer. If a missing/no-version section is ever
// restored here, restore that parity test with it.
//
// Overdue and upcoming rows still route through the same openItem(), covered below.
it('routes an overdue row to its document', async () => {
  renderPage();
  await screen.findByText('Expired 10 days ago');
  // Overdue is the first section, so its row is the first "Open document".
  fireEvent.click(screen.getAllByText('Open document')[0]);
  expect(mockNavigate).toHaveBeenLastCalledWith('/compliance/documents', {
    state: { complianceDocumentId: 2 },
  });
});

// A pharmacy that has added no document types has nothing to track. The empty
// calendar must say that, not congratulate the user for being all clear.
it('tells a pharmacy with no document types to set them up', async () => {
  catalogue = [];
  calendarBody = {
    from: dayjs().startOf('month').format('YYYY-MM-DD'),
    to: dayjs().endOf('month').format('YYYY-MM-DD'),
    items: [], missing: [], no_expiry: [],
  };
  renderPage();
  expect(
    await screen.findByText('No document types are set up yet, so there is nothing to track here.'),
  ).toBeInTheDocument();
  expect(screen.queryByText('Nothing needs your attention right now.')).not.toBeInTheDocument();
});
