import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../redux/slices/authSlice';
import { complianceApi } from '../../../redux/slices/complianceApi';
import ComplianceDocuments from '../ComplianceDocuments';

const types = [
  { id: 1, key: 'pharmacy_licence', name: 'Pharmacy Licence', description: null, category: 'Licence', is_required: true, default_validity_months: null, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, key: 'ndps_licence', name: 'NDPS Licence', description: null, category: 'Licence', is_required: true, default_validity_months: 12, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];
const version = { id: 10, document_id: 5, version_no: 2, file_name: 'licence.pdf', file_type: 'application/pdf', size_bytes: 2048, valid_from: '2026-01-01', valid_to: null, issued_by: 'Drug Control', notes: null, uploaded_by: 3, uploaded_by_username: 'r.patel', uploaded_at: '2026-01-02T10:00:00Z', is_current: true };
const documents = [
  { id: 5, title: 'Pharmacy Licence', reference_number: 'PL-1', status: 'ACTIVE', notes: null, created_by: 1, created_by_username: 'a.owner', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z', document_type: { id: 1, key: 'pharmacy_licence', name: 'Pharmacy Licence', category: 'Licence', is_required: true, default_validity_months: null, status: 'ACTIVE' }, current_version_id: 10, current_version: version, version_count: 2 },
];

beforeEach(() => {
  global.fetch = jest.fn(async (input: any) => {
    const url = typeof input === 'string' ? input : input.url;
    const body = url.includes('document-types') ? types
      : url.includes('notification-settings') ? { lead_days: [60, 30, 7], is_default: true, overrides: [] }
      : url.includes('/documents/5') ? {
          ...documents[0],
          versions: [version, { ...version, id: 9, version_no: 1, is_current: false, valid_to: '2025-12-31', file_name: 'old.pdf', uploaded_by_username: null }],
          versions_page: { total: 2, limit: 50, offset: 0, has_more: false },
        }
      : { documents, total: documents.length, limit: 50, offset: 0, has_more: false };
    return { ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => body, text: async () => JSON.stringify(body), clone() { return this; } } as any;
  }) as any;
});

const renderPage = () => {
  const store = configureStore({
    reducer: { auth: authReducer, [complianceApi.reducerPath]: complianceApi.reducer },
    middleware: (gdm) => gdm().concat(complianceApi.middleware),
  });
  return render(
    <Provider store={store}>
      <MemoryRouter><ComplianceDocuments /></MemoryRouter>
    </Provider>,
  );
};

it('renders grouped documents, the nothing-filed action and the version history', async () => {
  renderPage();
  expect(await screen.findByText('NDPS Licence')).toBeInTheDocument();
  expect(await screen.findByText('Nothing has been filed for this document type yet.')).toBeInTheDocument();
  expect(await screen.findByText('Does not expire')).toBeInTheDocument();
  fireEvent.click(await screen.findByText('Show 1 earlier version'));
  await waitFor(() => expect(screen.getByText('Version 1')).toBeInTheDocument());
  // The "Current" badge lives in version history, where rows differ. The document
  // row itself shows only its current version, so a badge there said nothing.
  expect(screen.getAllByText('Current').length).toBeGreaterThan(0);
  expect(screen.getByText('Superseded')).toBeInTheDocument();
  expect(screen.getByText('old.pdf (2 KB)')).toBeInTheDocument();
});

it('keeps both edit actions behind the row overflow menu, distinctly labelled', async () => {
  renderPage();
  await screen.findByTestId('compliance-document-5');

  // Neither edit action crowds the row until the menu is opened.
  expect(screen.queryByText('Edit version details')).not.toBeInTheDocument();
  expect(screen.queryByText('Edit document')).not.toBeInTheDocument();

  fireEvent.click(screen.getAllByLabelText('More actions')[0]);

  // Both are reachable, and neither is the bare "Edit details" that used to read
  // as a near-homonym of the document action sitting next to it.
  expect(await screen.findByText('Edit version details')).toBeInTheDocument();
  expect(screen.getByText('Edit document')).toBeInTheDocument();
});

it('never renders a truncated list as complete, and loads the next page', async () => {
  // A FULL page (50 rows) means the server may hold more behind the limit.
  const page = Array.from({ length: 50 }, (_, i) => ({
    ...documents[0],
    id: 100 + i,
    title: `Licence ${i}`,
  }));
  const requested: string[] = [];
  global.fetch = jest.fn(async (input: any) => {
    const url = typeof input === 'string' ? input : input.url;
    requested.push(url);
    const body = url.includes('document-types')
      ? types
      : url.includes('notification-settings')
        ? { lead_days: [60, 30, 7], is_default: true, overrides: [] }
        : { documents: page, total: 120, limit: 50, offset: 0, has_more: true };
    return {
      ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => body, text: async () => JSON.stringify(body), clone() { return this; },
    } as any;
  }) as any;

  renderPage();
  expect(await screen.findByText('Showing 50 of 120')).toBeInTheDocument();
  // The first request is explicit about the page it asked for.
  expect(requested.some((url) => url.includes('limit=50') && url.includes('offset=0'))).toBe(true);

  fireEvent.click(screen.getByText('Load more'));
  await waitFor(() => expect(requested.some((url) => url.includes('limit=100'))).toBe(true));
});

it('offers make-current to any member (staff included)', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Show 1 earlier version'));
  const makeCurrent = await screen.findByText('Make current');
  // Version-in-force is member-level — the control is live for a staff user.
  expect(makeCurrent.closest('button')).not.toBeDisabled();
});

it('names the uploader, falling back to the id when the join could not resolve it', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Show 1 earlier version'));
  // Current version: joined username.
  expect(await screen.findByText('r.patel')).toBeInTheDocument();
  // Older version: null username (deleted user, or one outside this org) -> raw id.
  expect(screen.getByText('User #3')).toBeInTheDocument();
});

it('opens the upload modal with valid_to marked optional', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Upload new version'));
  expect(await screen.findByText('Upload a new version')).toBeInTheDocument();
  expect(screen.getByText('Optional — leave blank if this document does not expire.')).toBeInTheDocument();
});

// A pharmacy's catalogue now starts EMPTY, a state this page had never rendered.
it('points an empty catalogue at setup and cannot start a dead-end create', async () => {
  global.fetch = jest.fn(async (input: any) => {
    const url = typeof input === 'string' ? input : input.url;
    const body = url.includes('document-types') ? []
      : url.includes('notification-settings') ? { lead_days: [60, 30, 7], is_default: true, overrides: [] }
      : { documents: [], total: 0, limit: 50, offset: 0, has_more: false };
    return { ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => body, text: async () => JSON.stringify(body), clone() { return this; } } as any;
  }) as any;
  renderPage();

  expect(
    await screen.findByText(
      'No document types are set up yet. Add the documents this pharmacy keeps, then file them here.',
    ),
  ).toBeInTheDocument();
  // Nothing can be filed against an empty catalogue, so the create flow is closed.
  expect(screen.getByText('Add document').closest('button')).toBeDisabled();
  // No "0 of 0" paging line on an empty list.
  expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
});
