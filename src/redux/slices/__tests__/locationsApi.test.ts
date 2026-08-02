import { locationsApi } from '../locationsApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';
import type { Location } from '../orgApi';

// Mock the shared reauth base query so we assert the built request args directly.
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<typeof baseQueryWithReauth>;

const makeStore = () =>
  configureStore({
    reducer: {
      [locationsApi.reducerPath]: locationsApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(locationsApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/admin/locations'),
  response: { status: 200, statusText: 'OK' } as Response,
};

const expectExtraArgs = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const location: Location = {
  id: 1,
  name: 'Main Branch',
  code: 'MB',
  type: 'pharmacy',
  gstin: '22AAAAA0000A1Z5',
  drug_license_1: 'DL-1',
  drug_license_2: 'DL-2',
  address: '12 Main Road',
  phone: '040-1234567',
  status: 1,
};

describe('locationsApi (admin location CRUD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET admin/locations returns { locations }', async () => {
    mockBaseQuery.mockResolvedValueOnce({ data: { locations: [location] }, meta: okMeta });

    const store = makeStore();
    const result = await store.dispatch(locationsApi.endpoints.getLocations.initiate());

    expect(result.data).toEqual({ locations: [location] });
    expect(mockBaseQuery).toHaveBeenCalledWith(
      { url: 'admin/locations', method: 'GET' },
      expectExtraArgs,
      undefined
    );
  });

  it('POST admin/locations builds the create request and returns { location }', async () => {
    mockBaseQuery.mockResolvedValueOnce({ data: { location }, meta: okMeta });

    const body = { name: 'Main Branch', code: 'MB', gstin: '22AAAAA0000A1Z5' };
    const store = makeStore();
    const result = await store.dispatch(locationsApi.endpoints.createLocation.initiate(body));

    expect('data' in result && result.data).toEqual({ location });
    expect(mockBaseQuery).toHaveBeenCalledWith(
      { url: 'admin/locations', method: 'POST', body },
      expectExtraArgs,
      undefined
    );
  });

  it('PUT admin/locations/:id puts the id in the URL and the rest in the body (incl. status)', async () => {
    mockBaseQuery.mockResolvedValueOnce({
      data: { location: { ...location, status: 0 } },
      meta: okMeta,
    });

    const store = makeStore();
    await store.dispatch(
      locationsApi.endpoints.updateLocation.initiate({ id: 5, name: 'Renamed', status: 0 })
    );

    expect(mockBaseQuery).toHaveBeenCalledWith(
      { url: 'admin/locations/5', method: 'PUT', body: { name: 'Renamed', status: 0 } },
      expectExtraArgs,
      undefined
    );
  });

  it('surfaces the 400 when deactivating the last active location', async () => {
    mockBaseQuery.mockResolvedValueOnce({
      error: { status: 400, data: { error: 'Cannot deactivate the last active location' } },
      meta: okMeta,
    });

    const store = makeStore();
    const result = await store.dispatch(
      locationsApi.endpoints.updateLocation.initiate({ id: 1, name: 'Main Branch', status: 0 })
    );

    expect('error' in result && (result.error as { status: number }).status).toBe(400);
  });

  it('a successful mutation invalidates the Locations tag and refetches the list', async () => {
    const store = makeStore();

    mockBaseQuery.mockResolvedValueOnce({ data: { locations: [location] }, meta: okMeta });
    const listSub = store.dispatch(locationsApi.endpoints.getLocations.initiate());
    await listSub;

    const callsBefore = mockBaseQuery.mock.calls.length;
    mockBaseQuery.mockResolvedValue({ data: { locations: [location] }, meta: okMeta });
    mockBaseQuery.mockResolvedValueOnce({ data: { location }, meta: okMeta });

    await store.dispatch(locationsApi.endpoints.createLocation.initiate({ name: 'B2' }));
    await flush();

    const urlsAfter = mockBaseQuery.mock.calls
      .slice(callsBefore)
      .map((c) => (c[0] as { url: string }).url);
    expect(urlsAfter.filter((u) => u === 'admin/locations').length).toBeGreaterThanOrEqual(2);

    listSub.unsubscribe();
  });

  it('exports the three hooks', () => {
    expect(locationsApi.useGetLocationsQuery).toBeDefined();
    expect(locationsApi.useCreateLocationMutation).toBeDefined();
    expect(locationsApi.useUpdateLocationMutation).toBeDefined();
  });
});
