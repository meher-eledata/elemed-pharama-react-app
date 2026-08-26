import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../redux/slices/authSlice';
import { complianceApi } from '../../../redux/slices/complianceApi';
import ComplianceSettings from '../ComplianceSettings';

const types = [
  { id: 1, key: 'pharmacy_licence', name: 'Pharmacy Licence', description: null, category: 'Licence', is_required: true, default_validity_months: null, status: 'ACTIVE', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];
const settings = { lead_days: [60, 30, 7], is_default: true, overrides: [] };
// The shipped catalogue is a PICK LIST — a new org has added none of it.
const library = [
  { key: 'pharmacy_licence', name: 'Pharmacy Licence', category: 'Licence', is_required: true, default_validity_months: null, already_added: true, id: 1, status: 'ACTIVE' },
  { key: 'ndps_licence', name: 'NDPS Licence', category: 'Licence', is_required: true, default_validity_months: 12, already_added: false, id: null, status: null },
  { key: 'ndps_challan', name: 'Original Challan', category: 'NDPS', is_required: false, default_validity_months: null, already_added: true, id: 42, status: 'ARCHIVED' },
];

// 409 for the next DELETE, when the test needs the documents-filed refusal.
let deleteConflict: unknown = null;
// A new org's catalogue starts empty; existing orgs keep what they have.
let catalogue: unknown[] = types;

const calls: Array<{ url: string; method: string; body: unknown }> = [];

const json = (body: unknown, status = 200) => ({
  ok: status < 400, status, headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => body, text: async () => JSON.stringify(body), clone() { return this; },
}) as any;

beforeEach(() => {
  calls.length = 0;
  deleteConflict = null;
  catalogue = types;
  global.fetch = jest.fn(async (input: any, init: any) => {
    // RTK Query hands fetch a Request object, so the body lives on it, not on init.
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method ?? (typeof input === 'string' ? 'GET' : input.method) ?? 'GET';
    const rawBody = init?.body ?? (typeof input === 'string' ? undefined : await input.clone().text());
    calls.push({ url, method, body: rawBody ? JSON.parse(rawBody as string) : undefined });
    if (url.includes('document-type-library')) return json(library);
    if (method === 'DELETE') {
      return deleteConflict ? json(deleteConflict, 409) : json({ ...types[0], deleted: true });
    }
    if (method === 'POST' && url.includes('document-types')) {
      // The archived-key 409: the body names the row so the UI can offer a restore.
      return json({ error: "A document type with key 'ndps_challan' already exists", id: 42, status: 'ARCHIVED' }, 409);
    }
    if (method === 'PUT') return json({ ...types[0], id: 42, status: 'ACTIVE' });
    if (url.includes('notification-settings')) return json(settings);
    return json(catalogue);
  }) as any;
});

const renderPage = () => {
  const store = configureStore({
    reducer: { auth: authReducer, [complianceApi.reducerPath]: complianceApi.reducer },
    middleware: (gdm) => gdm().concat(complianceApi.middleware),
    preloadedState: {
      auth: {
        user: { id: 1, username: 'o', email: 'o@x.com', org_role: 'owner' },
        token: 't', isAuthenticated: true,
      } as never,
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter><ComplianceSettings /></MemoryRouter>
    </Provider>,
  );
};

it('offers a restore when the key collides with an ARCHIVED type', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Add document type'));
  // The picker leads; the free-form form is the "not on the list" escape hatch.
  fireEvent.click(await screen.findByText('Define a custom type'));
  fireEvent.change(await screen.findByLabelText('Key *'), { target: { value: 'ndps_challan' } });
  fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Original Challan' } });
  fireEvent.click(within(screen.getByRole('dialog')).getByText('Save'));

  const restore = await screen.findByText('Restore the archived type');
  expect(screen.getByText("A document type with key 'ndps_challan' already exists")).toBeInTheDocument();
  fireEvent.click(restore);

  await waitFor(() =>
    expect(
      calls.some((c) => c.method === 'PUT' && c.url.endsWith('/42') && (c.body as { status: string }).status === 'ACTIVE'),
    ).toBe(true),
  );
});

it('saves org-wide lead days from the reminders form', async () => {
  renderPage();
  const field = await screen.findByLabelText('Days before expiry');
  expect(field).toHaveValue('60, 30, 7');
  fireEvent.change(field, { target: { value: '90, 30' } });
  fireEvent.click(screen.getAllByText('Save')[0]);
  await waitFor(() =>
    expect(
      calls.some(
        (c) => c.method === 'PUT' && c.url.includes('notification-settings') &&
          JSON.stringify((c.body as { lead_days: number[] }).lead_days) === '[90,30]',
      ),
    ).toBe(true),
  );
});

it('adds a standard type from the library and never offers one twice', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Add document type'));
  await screen.findByText('Already added');
  const dialog = screen.getByRole('dialog');

  // Already in the catalogue: shown as added, with no second Add for it.
  expect(within(dialog).getByText('Already added')).toBeInTheDocument();
  // Archived counts as added — it must be restored, not re-created.
  expect(within(dialog).getByText('Restore')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByText('Add'));
  await waitFor(() =>
    expect(
      calls.some(
        (c) =>
          c.method === 'POST' &&
          (c.body as { key: string; is_required: boolean }).key === 'ndps_licence' &&
          (c.body as { is_required: boolean }).is_required === true,
      ),
    ).toBe(true),
  );
});

it('restores an archived standard type instead of re-adding it', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Add document type'));
  fireEvent.click(await screen.findByText('Restore'));
  await waitFor(() =>
    expect(
      calls.some(
        (c) => c.method === 'PUT' && c.url.endsWith('/42') &&
          (c.body as { status: string }).status === 'ACTIVE',
      ),
    ).toBe(true),
  );
});

it('confirms before deleting a document type, then deletes it', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Delete'));
  expect(await screen.findByText('Delete "Pharmacy Licence"? This cannot be undone.')).toBeInTheDocument();
  // Nothing has gone yet — the confirm is what sends the request.
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);

  fireEvent.click(screen.getByText('Delete permanently'));
  await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.url.endsWith('/1'))).toBe(true));
});

it('explains the 409 refusal and offers the archive that would have worked', async () => {
  deleteConflict = { error: 'prose that must not be parsed', id: 1, status: 'ACTIVE', document_count: 3 };
  renderPage();
  fireEvent.click(await screen.findByText('Delete'));
  fireEvent.click(await screen.findByText('Delete permanently'));

  expect(
    await screen.findByText(
      '"Pharmacy Licence" cannot be deleted: 3 documents are filed against it and would be destroyed.',
    ),
  ).toBeInTheDocument();
  // The refusal is read from the STATUS CODE and document_count, never the prose.
  expect(screen.queryByText('prose that must not be parsed')).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('Archive instead'));
  await waitFor(() =>
    expect(
      calls.some(
        (c) => c.method === 'PUT' && c.url.endsWith('/1') &&
          (c.body as { status: string }).status === 'ARCHIVED',
      ),
    ).toBe(true),
  );
});

it('archives with a PUT, never with the DELETE that now destroys the type', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Archive'));
  await waitFor(() =>
    expect(
      calls.some(
        (c) => c.method === 'PUT' && c.url.endsWith('/1') &&
          (c.body as { status: string }).status === 'ARCHIVED',
      ),
    ).toBe(true),
  );
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
});

it('offers the standard list from an empty catalogue rather than a bare full stop', async () => {
  catalogue = [];
  renderPage();
  expect(
    await screen.findByText(
      'No document types yet. Add the papers this pharmacy keeps from the standard list.',
    ),
  ).toBeInTheDocument();
  // The empty state is the fastest route into the picker.
  fireEvent.click(screen.getAllByText('Add document type')[1]);
  expect(await screen.findByText('Standard document types', { exact: false })).toBeDefined();
});
