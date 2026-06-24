import { adminApi } from '../adminSlice';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the baseQueryWithReauth
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<
  typeof baseQueryWithReauth
>;

const makeStore = () =>
  configureStore({
    reducer: {
      [adminApi.reducerPath]: adminApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(adminApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/admin'),
  response: { status: 200, statusText: 'OK' } as Response,
};

const expectExtraArgs = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

describe('Admin API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET admin/get-all-users', () => {
    it('builds the correct request and returns data', async () => {
      const mockResponse = {
        users: [
          {
            id: 1,
            name: 'Alice',
            email: 'alice@example.com',
            role: 'admin',
            status: 'active',
            last_login: null,
          },
        ],
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.getAllUsers.initiate(undefined)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'admin/get-all-users', method: 'GET' },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST admin/create-user', () => {
    const body = {
      superusername: 'super',
      username: 'newuser',
      email: 'new@example.com',
      first_name: 'New',
      last_name: 'User',
      mobile: '9876543210',
      address_line1: 'Line 1',
      city: 'City',
      state: 'State',
      postal_code: '123456',
      country: 'Country',
      identity_document: 0 as const,
      identity_document_number: 'ID-1',
      role: 1 as const,
    };

    it('builds a multipart FormData request (text fields + pharmacist_certificate file) and returns data', async () => {
      const mockResponse = {
        message: 'created',
        user: {
          id: 5,
          username: 'newuser',
          email: 'new@example.com',
          first_name: 'New',
          last_name: 'User',
          identity_document: 0 as const,
          identity_document_number: 'ID-1',
          role: 1 as const,
        },
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const certificate = new File(['cert'], 'cert.pdf', { type: 'application/pdf' });
      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.createUser.initiate({
          ...body,
          pharmacist_certificate: certificate,
        })
      );

      expect(result.data).toEqual(mockResponse);
      // The mutation now sends FormData (multipart) — assert the path/method and the
      // FormData payload rather than a plain JSON body.
      const call = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        method: string;
        body: FormData;
      };
      expect(call.url).toBe('admin/create-user');
      expect(call.method).toBe('POST');
      expect(call.body).toBeInstanceOf(FormData);
      expect(call.body.get('mobile')).toBe('9876543210');
      expect(call.body.get('email')).toBe('new@example.com');
      expect(call.body.get('role')).toBe('1');
      expect(call.body.get('pharmacist_certificate')).toBeInstanceOf(File);
    });

    it('handles error', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { message: 'User exists' } },
        meta: okMeta,
      });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.createUser.initiate(body)
      );

      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('POST admin/send-email-test', () => {
    const body = { toEmail: 'test@example.com', rawToken: 'tok' };

    it('builds the correct request and returns data', async () => {
      const mockResponse = { message: 'sent' };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.sendEmailTest.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'admin/send-email-test', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'SMTP failure' } },
        meta: okMeta,
      });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.sendEmailTest.initiate(body)
      );

      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(500);
    });
  });

  describe('PUT admin/update-user-role/:userId', () => {
    it('interpolates userId in the url and sends only role in body', async () => {
      const mockResponse = { message: 'updated', user: { id: 7, role: 'admin' } };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.updateUserRole.initiate({ userId: 7, role: 'admin' })
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: 'admin/update-user-role/7',
          method: 'PUT',
          body: { role: 'admin' },
        },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 404, data: { message: 'Not found' } },
        meta: okMeta,
      });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.updateUserRole.initiate({ userId: 99, role: 'pharmacist' })
      );

      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('PUT admin/users/:id/disable', () => {
    it('builds the correct request and returns data', async () => {
      const mockResponse = {
        message: 'User disabled',
        user: { id: 3, username: 'u3', email: 'u3@x.com', status: 'inactive' },
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.disableUser.initiate(3)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'admin/users/3/disable', method: 'PUT' },
        expectExtraArgs,
        undefined
      );
    });

    it('handles the guard error', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { error: 'You cannot disable your own account.' } },
        meta: okMeta,
      });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.disableUser.initiate(1)
      );

      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('PUT admin/users/:id/enable', () => {
    it('builds the correct request and returns data', async () => {
      const mockResponse = {
        message: 'User enabled',
        user: { id: 3, username: 'u3', email: 'u3@x.com', status: 'active' },
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.enableUser.initiate(3)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'admin/users/3/enable', method: 'PUT' },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('GET admin/get-activity-log', () => {
    it('builds the correct request and returns data', async () => {
      const mockResponse = { activityLog: [] };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminApi.endpoints.getActivityLog.initiate(undefined)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'admin/get-activity-log', method: 'GET' },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('Endpoint Configuration', () => {
    it('defines all endpoints', () => {
      expect(adminApi.endpoints.getAllUsers).toBeDefined();
      expect(adminApi.endpoints.createUser).toBeDefined();
      expect(adminApi.endpoints.disableUser).toBeDefined();
      expect(adminApi.endpoints.enableUser).toBeDefined();
      expect(adminApi.endpoints.sendEmailTest).toBeDefined();
      expect(adminApi.endpoints.updateUserRole).toBeDefined();
      expect(adminApi.endpoints.getActivityLog).toBeDefined();
    });

    it('exports all hooks', () => {
      expect(adminApi.useGetAllUsersQuery).toBeDefined();
      expect(adminApi.useCreateUserMutation).toBeDefined();
      expect(adminApi.useDisableUserMutation).toBeDefined();
      expect(adminApi.useEnableUserMutation).toBeDefined();
      expect(adminApi.useSendEmailTestMutation).toBeDefined();
      expect(adminApi.useUpdateUserRoleMutation).toBeDefined();
      expect(adminApi.useGetActivityLogQuery).toBeDefined();
    });
  });
});
