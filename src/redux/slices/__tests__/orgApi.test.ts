import {
  orgApi,
  type OrgProfile,
  type MeOrganization,
  type UpdateOrgRequest,
} from '../orgApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the shared base query so no real network happens; assert the request
// descriptor each endpoint hands to it (mirrors profileApi.test.ts).
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<typeof baseQueryWithReauth>;

const makeStore = () =>
  configureStore({
    reducer: { [orgApi.reducerPath]: orgApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(orgApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/org'),
  response: { status: 200, statusText: 'OK' } as Response,
};
const mockOk = (data: unknown) =>
  mockBaseQuery.mockResolvedValueOnce({ data: data as any, meta: okMeta });

// Full org shape now carries the 4 invoice-numbering scheme fields.
const sampleOrg: OrgProfile = {
  id: 1,
  name: 'Test Pharmacy',
  slug: 'test-pharmacy',
  status: 'active',
  country: null,
  timezone: null,
  currency: null,
  created_at: '2025-01-01T00:00:00.000Z',
  logo_url: null,
  legal_name: null,
  address: null,
  dl_numbers: null,
  gstin: null,
  phone: null,
  invoice_number_enabled: true,
  invoice_number_template: 'SI-EL-{YY}-{SEQ:6}',
  invoice_number_reset: 'yearly',
  invoice_seq_start: 2296,
};

describe('orgApi — invoice-numbering scheme fields', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getOrg returns the 4 scheme fields on the org', async () => {
    mockOk({ organization: sampleOrg });
    const store = makeStore();
    const result = await store.dispatch(orgApi.endpoints.getOrg.initiate());
    const org = (result.data as { organization: OrgProfile }).organization;

    expect(org.invoice_number_enabled).toBe(true);
    expect(org.invoice_number_template).toBe('SI-EL-{YY}-{SEQ:6}');
    expect(org.invoice_number_reset).toBe('yearly');
    expect(org.invoice_seq_start).toBe(2296);
  });

  it('updateOrg PUTs a partial body of only the scheme fields', async () => {
    mockOk({ organization: sampleOrg });
    const store = makeStore();
    const body: UpdateOrgRequest = {
      invoice_number_enabled: true,
      invoice_number_template: 'ELMD/{YYYY}/{SEQ:5}',
      invoice_number_reset: 'none',
      invoice_seq_start: 0,
    };
    await store.dispatch(orgApi.endpoints.updateOrg.initiate(body));

    const callArg = mockBaseQuery.mock.calls[0][0] as {
      url: string;
      method: string;
      body: UpdateOrgRequest;
    };
    expect(callArg.url).toBe('org');
    expect(callArg.method).toBe('PUT');
    expect(callArg.body).toEqual(body);
  });

  it('getNextDocumentNumber GETs the peek with doc_type + date as query params', async () => {
    mockOk({ doc_type: 'sales_invoice', number: 'SI-EL-26-000001', period_key: 2026, enabled: true });
    const store = makeStore();
    const result = await store.dispatch(
      orgApi.endpoints.getNextDocumentNumber.initiate({ doc_type: 'sales_invoice', date: '2026-04-01' })
    );

    const callArg = mockBaseQuery.mock.calls[0][0] as {
      url: string;
      method: string;
      params: { doc_type: string; date: string };
    };
    expect(callArg.url).toBe('org/document-numbering/next');
    expect(callArg.method).toBe('GET');
    // The date drives both the counter bucket and the {YY}/{MM} tokens.
    expect(callArg.params).toEqual({ doc_type: 'sales_invoice', date: '2026-04-01' });
    expect((result.data as { number: string }).number).toBe('SI-EL-26-000001');
  });

  it('MeOrganization also carries the scheme fields (nullable template/start)', () => {
    // Compile-time coverage: a no-org-scheme org still satisfies the type.
    const meOrg: MeOrganization = {
      id: 1,
      name: 'X',
      slug: 'x',
      logo_url: null,
      legal_name: null,
      address: null,
      dl_numbers: null,
      gstin: null,
      phone: null,
      invoice_number_enabled: false,
      invoice_number_template: null,
      invoice_number_reset: 'none',
      invoice_seq_start: null,
    };
    expect(meOrg.invoice_number_enabled).toBe(false);
    expect(meOrg.invoice_number_template).toBeNull();
  });
});
