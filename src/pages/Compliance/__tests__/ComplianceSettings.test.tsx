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

const calls: Array<{ url: string; method: string; body: unknown }> = [];

const json = (body: unknown, status = 200) => ({
  ok: status < 400, status, headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => body, text: async () => JSON.stringify(body), clone() { return this; },
}) as any;

beforeEach(() => {
  calls.length = 0;
  global.fetch = jest.fn(async (input: any, init: any) => {
    // RTK Query hands fetch a Request object, so the body lives on it, not on init.
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method ?? (typeof input === 'string' ? 'GET' : input.method) ?? 'GET';
    const rawBody = init?.body ?? (typeof input === 'string' ? undefined : await input.clone().text());
    calls.push({ url, method, body: rawBody ? JSON.parse(rawBody as string) : undefined });
    if (method === 'POST' && url.includes('document-types')) {
      // The archived-key 409: the body names the row so the UI can offer a restore.
      return json({ error: "A document type with key 'ndps_challan' already exists", id: 42, status: 'ARCHIVED' }, 409);
    }
    if (method === 'PUT') return json({ ...types[0], id: 42, status: 'ACTIVE' });
    if (url.includes('notification-settings')) return json(settings);
    return json(types);
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
