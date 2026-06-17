import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  authApi,
  authSlice,
  setCredentials,
  logout,
  useLoginMutation,
  usePasswordRecoveryMutation,
  useResetPasswordMutation,
  useCreatePasswordMutation,
  User,
} from '../authSlice';

const TOKEN_KEY = 'pharma_auth_token';
const USER_KEY = 'pharma_user';

const mockUser: User = {
  id: 1,
  username: 'jdoe',
  email: 'jdoe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 1,
};

describe('authSlice reducer', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const loggedOutState = {
    token: null,
    user: null,
    isAuthenticated: false,
  };

  describe('setCredentials', () => {
    it('sets token, user and isAuthenticated=true', () => {
      const next = authReducer(
        loggedOutState,
        setCredentials({ token: 'abc123', user: mockUser })
      );

      expect(next.token).toBe('abc123');
      expect(next.user).toEqual(mockUser);
      expect(next.isAuthenticated).toBe(true);
    });

    it('persists token and stringified user to localStorage', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      authReducer(
        loggedOutState,
        setCredentials({ token: 'abc123', user: mockUser })
      );

      expect(setItemSpy).toHaveBeenCalledWith(TOKEN_KEY, 'abc123');
      expect(setItemSpy).toHaveBeenCalledWith(
        USER_KEY,
        JSON.stringify(mockUser)
      );

      // also verify the values actually landed in storage
      expect(localStorage.getItem(TOKEN_KEY)).toBe('abc123');
      expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(mockUser));
    });
  });

  describe('logout', () => {
    const loggedInState = {
      token: 'abc123',
      user: mockUser,
      isAuthenticated: true,
    };

    it('clears token, user and sets isAuthenticated=false', () => {
      const next = authReducer(loggedInState, logout());

      expect(next.token).toBeNull();
      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
    });

    it('removes both auth keys from localStorage', () => {
      localStorage.setItem(TOKEN_KEY, 'abc123');
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      authReducer(loggedInState, logout());

      expect(removeItemSpy).toHaveBeenCalledWith(TOKEN_KEY);
      expect(removeItemSpy).toHaveBeenCalledWith(USER_KEY);

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });
  });

  it('returns a sensible state for an unknown action', () => {
    const state = authReducer(loggedOutState, { type: '@@INIT' });
    expect(state).toEqual(loggedOutState);
  });

  it('exposes setCredentials and logout via authSlice.actions', () => {
    expect(authSlice.actions.setCredentials).toBeDefined();
    expect(authSlice.actions.logout).toBeDefined();
  });
});

describe('authApi endpoints', () => {
  const BASE_URL = 'http://localhost:3000/api/';

  const buildStore = () =>
    configureStore({
      reducer: {
        [authApi.reducerPath]: authApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
    });

  // fetchBaseQuery calls global fetch with a Request object.
  const mockFetchOk = (responseBody: unknown) => {
    const fetchMock = jest.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  };

  // Returns { url, method, body } captured from the Request passed to fetch.
  const captureRequest = async (fetchMock: jest.Mock) => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][0] as Request;
    const body = await request.clone().text();
    return {
      url: request.url,
      method: request.method,
      body,
    };
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('endpoint and hook existence', () => {
    it('defines all mutation endpoints', () => {
      expect(authApi.endpoints.login).toBeDefined();
      expect(authApi.endpoints.passwordRecovery).toBeDefined();
      expect(authApi.endpoints.resetPassword).toBeDefined();
      expect(authApi.endpoints.createPassword).toBeDefined();
    });

    it('exports the generated mutation hooks', () => {
      expect(useLoginMutation).toBeDefined();
      expect(usePasswordRecoveryMutation).toBeDefined();
      expect(useResetPasswordMutation).toBeDefined();
      expect(useCreatePasswordMutation).toBeDefined();
    });
  });

  describe('login mutation', () => {
    it('POSTs credentials to login', async () => {
      const fetchMock = mockFetchOk({ token: 't', user: mockUser });
      const store = buildStore();
      const args = { username: 'jdoe', password: 'secret' };

      const result = await store.dispatch(
        authApi.endpoints.login.initiate(args)
      );

      expect(result.data).toEqual({ token: 't', user: mockUser });

      const req = await captureRequest(fetchMock);
      expect(req.url).toBe(`${BASE_URL}login`);
      expect(req.method).toBe('POST');
      expect(JSON.parse(req.body)).toEqual(args);
    });
  });

  describe('passwordRecovery mutation', () => {
    it('POSTs to send-password-change-email', async () => {
      const fetchMock = mockFetchOk({ message: 'sent' });
      const store = buildStore();
      const args = { username: 'jdoe' };

      const result = await store.dispatch(
        authApi.endpoints.passwordRecovery.initiate(args)
      );

      expect(result.data).toEqual({ message: 'sent' });

      const req = await captureRequest(fetchMock);
      expect(req.url).toBe(`${BASE_URL}send-password-change-email`);
      expect(req.method).toBe('POST');
      expect(JSON.parse(req.body)).toEqual(args);
    });
  });

  describe('resetPassword mutation', () => {
    it('POSTs to create-new-password', async () => {
      const fetchMock = mockFetchOk({ message: 'reset' });
      const store = buildStore();
      const args = { token: 'tok', password: 'newpass' };

      const result = await store.dispatch(
        authApi.endpoints.resetPassword.initiate(args)
      );

      expect(result.data).toEqual({ message: 'reset' });

      const req = await captureRequest(fetchMock);
      expect(req.url).toBe(`${BASE_URL}create-new-password`);
      expect(req.method).toBe('POST');
      expect(JSON.parse(req.body)).toEqual(args);
    });
  });

  describe('createPassword mutation', () => {
    it('POSTs to create-new-password', async () => {
      const fetchMock = mockFetchOk({ message: 'created' });
      const store = buildStore();
      const args = { token: 'tok', password: 'newpass' };

      const result = await store.dispatch(
        authApi.endpoints.createPassword.initiate(args)
      );

      expect(result.data).toEqual({ message: 'created' });

      const req = await captureRequest(fetchMock);
      expect(req.url).toBe(`${BASE_URL}create-new-password`);
      expect(req.method).toBe('POST');
      expect(JSON.parse(req.body)).toEqual(args);
    });
  });
});
