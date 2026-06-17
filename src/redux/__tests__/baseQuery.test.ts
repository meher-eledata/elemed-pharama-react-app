import { baseQueryWithReauth, redirect } from '../baseQuery';
import { logout } from '../slices/authSlice';

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
const makeApi = () => ({
  dispatch: jest.fn(),
  getState: () => ({ auth: { token: null } }),
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
});
