import { baseQueryWithReauth, redirect } from '../baseQuery';
import { logout } from '../slices/authSlice';
import { setCurrentLocation } from '../slices/orgSlice';

// fetchBaseQuery calls global fetch with a Request object; we mock fetch to
// drive the status codes the wrapper reacts to.
const mockFetch = (status: number, body: unknown = {}) => {
  const fetchMock = jest.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

// Minimal BaseQueryApi stub sufficient for fetchBaseQuery + the wrapper.
const makeApi = (state: object = { auth: { token: null } }) => ({
  dispatch: jest.fn(),
  getState: () => state,
  signal: new AbortController().signal,
  abort: jest.fn(),
  endpoint: 'test',
  type: 'query' as const,
  forced: false,
  extra: undefined,
});

describe('baseQueryWithReauth 401 handling', () => {
  let redirectSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom locks down window.location; spy on the redirect helper instead so we
    // can assert the hard redirect without triggering real navigation.
    redirectSpy = jest.spyOn(redirect, 'toLogin').mockImplementation(() => {});
  });

  afterEach(() => {
    redirectSpy.mockRestore();
  });

  it('dispatches logout and redirects to login on a 401 response', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    const api = makeApi();

    await baseQueryWithReauth('protected', api as never, {});

    expect(api.dispatch).toHaveBeenCalledTimes(1);
    expect(api.dispatch).toHaveBeenCalledWith(logout());
    expect(redirectSpy).toHaveBeenCalledTimes(1);
  });

  it('does not logout or redirect on a successful response', async () => {
    mockFetch(200, { ok: true });
    const api = makeApi();

    await baseQueryWithReauth('protected', api as never, {});

    expect(api.dispatch).not.toHaveBeenCalled();
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('does not logout or redirect on a non-401 error response', async () => {
    mockFetch(500, { message: 'Server error' });
    const api = makeApi();

    await baseQueryWithReauth('protected', api as never, {});

    expect(api.dispatch).not.toHaveBeenCalled();
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('does not logout or redirect on a 403 "Forbidden" (non-admin) response', async () => {
    mockFetch(403, { message: 'Forbidden' });
    const api = makeApi();

    await baseQueryWithReauth('protected', api as never, {});

    expect(api.dispatch).not.toHaveBeenCalled();
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('clears the current location on 403 "Invalid location" without logging out', async () => {
    // Stale persisted location: the selection is nulled (which also drops the
    // persisted id) so the /me reseed + location picker can repair it.
    mockFetch(403, { error: 'Invalid location' });
    const api = makeApi({ auth: { token: 'JWT' }, org: { currentLocationId: 99 } });

    await baseQueryWithReauth('protected', api as never, {});

    expect(api.dispatch).toHaveBeenCalledTimes(1);
    expect(api.dispatch).toHaveBeenCalledWith(setCurrentLocation(null));
    expect(api.dispatch).not.toHaveBeenCalledWith(logout());
    expect(redirectSpy).not.toHaveBeenCalled();
  });
});

describe('baseQueryWithReauth x-location-id header', () => {
  it('sends x-location-id when a current location is selected', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    const api = makeApi({ auth: { token: 'JWT' }, org: { currentLocationId: 7 } });

    await baseQueryWithReauth('protected', api as never, {});

    const request = (fetchMock as jest.Mock).mock.calls[0][0] as Request;
    expect(request.headers.get('x-location-id')).toBe('7');
    expect(request.headers.get('Authorization')).toBe('Bearer JWT');
  });

  it('omits x-location-id when no location is selected', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    const api = makeApi({ auth: { token: 'JWT' }, org: { currentLocationId: null } });

    await baseQueryWithReauth('protected', api as never, {});

    const request = (fetchMock as jest.Mock).mock.calls[0][0] as Request;
    expect(request.headers.get('x-location-id')).toBeNull();
  });
});
