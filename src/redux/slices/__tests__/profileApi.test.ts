import { profileApi, type Profile, type UpdateProfileRequest } from '../profileApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the baseQueryWithReauth (mirrors historicalFilesApi.test.ts) so no real
// network happens; we assert the exact request descriptor each endpoint hands
// to it.
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<
  typeof baseQueryWithReauth
>;

const makeStore = () =>
  configureStore({
    reducer: {
      [profileApi.reducerPath]: profileApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(profileApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/profile'),
  response: { status: 200, statusText: 'OK' } as Response,
};

const expectExtraArgs = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const mockOk = (data: unknown) =>
  mockBaseQuery.mockResolvedValueOnce({ data: data as any, meta: okMeta });

const mockErr = (status: number) =>
  mockBaseQuery.mockResolvedValueOnce({
    error: { status, data: { error: 'boom' } },
    meta: okMeta,
  });

const sampleProfile: Profile = {
  id: 5,
  username: 'jdoe',
  email: 'jdoe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'pharmacist',
  status: 'active',
  last_login: '2026-07-14T10:00:00.000Z',
  created_at: '2025-01-01T00:00:00.000Z',
  mobile: '9876543210',
  address_line1: '12 Main St',
  address_line2: null,
  city: 'Mumbai',
  state: 'MH',
  postal_code: '400001',
  country: 'India',
  identity_document_type: 'Aadhaar',
  identity_document_number_masked: '••••9012',
  documents: {
    id_document: { uploaded: true, filename: 'aadhaar-card.png' },
    pharmacist_certificate: { uploaded: false, filename: null },
  },
};

describe('profileApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile query', () => {
    it('GETs profile and returns the documents presence object', async () => {
      mockOk(sampleProfile);
      const store = makeStore();
      const result = await store.dispatch(
        profileApi.endpoints.getProfile.initiate()
      );

      expect(mockBaseQuery).toHaveBeenCalledWith('profile', expectExtraArgs, undefined);
      expect((result.data as Profile).documents.id_document.uploaded).toBe(true);
      expect((result.data as Profile).documents.pharmacist_certificate.filename).toBeNull();
    });
  });

  describe('updateProfile mutation', () => {
    it('PUTs profile with the given body — email is not part of the request type', async () => {
      mockOk(sampleProfile);
      const store = makeStore();
      const body: UpdateProfileRequest = {
        first_name: 'Johnny',
        identity_document: 1,
        identity_document_number: 'DL-1234567',
      };

      const result = await store.dispatch(
        profileApi.endpoints.updateProfile.initiate(body)
      );

      expect((result as { data: Profile }).data.id).toBe(5);
      const callArg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        method: string;
        body: UpdateProfileRequest;
      };
      expect(callArg.url).toBe('profile');
      expect(callArg.method).toBe('PUT');
      // The body is passed through untouched — the caller controls the
      // whitelist, and no email key exists on it.
      expect(callArg.body).toEqual(body);
      expect(callArg.body).not.toHaveProperty('email');
    });

    it('surfaces a backend 400 error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        profileApi.endpoints.updateProfile.initiate({ identity_document: 1 })
      );
      expect((result as { error: { status: number } }).error.status).toBe(400);
    });
  });

  describe('uploadProfileDocuments mutation', () => {
    it('builds multipart FormData with the id_document field and POSTs to profile/documents', async () => {
      mockOk(sampleProfile);
      const store = makeStore();
      const file = new File(['png'], 'aadhaar.png', { type: 'image/png' });

      const result = await store.dispatch(
        profileApi.endpoints.uploadProfileDocuments.initiate({ id_document: file })
      );

      expect((result as { data: Profile }).data.id).toBe(5);
      const callArg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        method: string;
        body: FormData;
      };
      expect(callArg.url).toBe('profile/documents');
      expect(callArg.method).toBe('POST');
      expect(callArg.body).toBeInstanceOf(FormData);
      expect(callArg.body.get('id_document')).toBe(file);
      expect(callArg.body.get('pharmacist_certificate')).toBeNull();
    });

    it('appends both file fields when both are provided', async () => {
      mockOk(sampleProfile);
      const store = makeStore();
      const idFile = new File(['a'], 'id.pdf', { type: 'application/pdf' });
      const certFile = new File(['b'], 'cert.pdf', { type: 'application/pdf' });

      await store.dispatch(
        profileApi.endpoints.uploadProfileDocuments.initiate({
          id_document: idFile,
          pharmacist_certificate: certFile,
        })
      );

      const body = (mockBaseQuery.mock.calls[0][0] as { body: FormData }).body;
      expect(body.get('id_document')).toBe(idFile);
      expect(body.get('pharmacist_certificate')).toBe(certFile);
    });
  });

  describe('getProfileDocumentDownloadLink query', () => {
    it('interpolates the doc type into profile/documents/:type/download-link', async () => {
      mockOk({
        url: 'https://s3.example/presigned',
        file_name: 'aadhaar-card.png',
        file_type: 'image/png',
        expires_in: 300,
      });
      const store = makeStore();
      const result = await store.dispatch(
        profileApi.endpoints.getProfileDocumentDownloadLink.initiate('id_document')
      );

      expect((result.data as { expires_in: number }).expires_in).toBe(300);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'profile/documents/id_document/download-link',
        expectExtraArgs,
        undefined
      );
    });

    it('returns url null on the disk driver (frontend must fall back to the blob fetch)', async () => {
      mockOk({
        url: null,
        file_name: 'cert.pdf',
        file_type: 'application/pdf',
        expires_in: null,
      });
      const store = makeStore();
      const result = await store.dispatch(
        profileApi.endpoints.getProfileDocumentDownloadLink.initiate(
          'pharmacist_certificate'
        )
      );
      expect((result.data as { url: string | null }).url).toBeNull();
    });
  });

  describe('getProfileDocumentBlob query', () => {
    it('interpolates the doc type into profile/documents/:type and provides a blob responseHandler', async () => {
      const blob = new Blob(['bytes']);
      mockOk(blob);
      const store = makeStore();
      const result = await store.dispatch(
        profileApi.endpoints.getProfileDocumentBlob.initiate('id_document')
      );

      expect(result.data).toBe(blob);
      const callArg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        responseHandler: unknown;
      };
      expect(callArg.url).toBe('profile/documents/id_document');
      expect(typeof callArg.responseHandler).toBe('function');
    });
  });

  describe('endpoint + hook configuration', () => {
    it('defines all endpoints', () => {
      expect(profileApi.endpoints.getProfile).toBeDefined();
      expect(profileApi.endpoints.getProfileActivity).toBeDefined();
      expect(profileApi.endpoints.updateProfile).toBeDefined();
      expect(profileApi.endpoints.uploadProfileDocuments).toBeDefined();
      expect(profileApi.endpoints.getProfileDocumentDownloadLink).toBeDefined();
      expect(profileApi.endpoints.getProfileDocumentBlob).toBeDefined();
    });

    it('exports all hooks', () => {
      expect(profileApi.useGetProfileQuery).toBeDefined();
      expect(profileApi.useGetProfileActivityQuery).toBeDefined();
      expect(profileApi.useUpdateProfileMutation).toBeDefined();
      expect(profileApi.useUploadProfileDocumentsMutation).toBeDefined();
      expect(profileApi.useLazyGetProfileDocumentDownloadLinkQuery).toBeDefined();
      expect(profileApi.useLazyGetProfileDocumentBlobQuery).toBeDefined();
    });
  });
});
