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

beforeEach(() => {
  mockNavigate.mockClear();
  global.fetch = jest.fn(async () => {
    const body = {
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

it('separates overdue, upcoming, nothing-filed and no-expiry rows', async () => {
  renderPage();
  expect(await screen.findByText('Expired 10 days ago')).toBeInTheDocument();
  expect(screen.getByText('Expires in 5 days')).toBeInTheDocument();
  // Type-only MISSING renders from type_name, NO_VERSION keeps its own title.
  expect(screen.getByText('Affidavit')).toBeInTheDocument();
  expect(screen.getByText('Transport Permit')).toBeInTheDocument();
  expect(screen.getByText('Shop Licence')).toBeInTheDocument();
});

it('routes a type-only row to the create flow and a no-version row to its upload', async () => {
  renderPage();
  await screen.findByText('Expired 10 days ago');
  fireEvent.click(screen.getByText('File this document'));
  expect(mockNavigate).toHaveBeenCalledWith('/compliance', {
    state: { complianceDocumentTypeId: 7 },
  });
  fireEvent.click(screen.getByText('Upload the first version'));
  expect(mockNavigate).toHaveBeenCalledWith('/compliance', {
    state: { complianceUploadDocumentId: 9 },
  });
});
