import { historicalFilesApi } from '../historicalFilesApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the baseQueryWithReauth (mirrors receiveApi.test.ts) so no real network
// happens; we assert the exact request descriptor each endpoint hands to it.
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<
  typeof baseQueryWithReauth
>;

const makeStore = () =>
  configureStore({
    reducer: {
      [historicalFilesApi.reducerPath]: historicalFilesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(historicalFilesApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/admin/historical-files'),
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

describe('historicalFilesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST upload — multipart FormData with the `file` field, POSTs to BASE/upload.
  describe('uploadHistoricalFile mutation', () => {
    it('builds FormData with field `file` and POSTs to admin/historical-files/upload', async () => {
      mockOk({
        id: 1,
        file_name: 'h.csv',
        file_type: 'text/csv',
        size_bytes: 10,
        uploaded_at: '2026-06-17T10:00:00.000Z',
        uploaded_by: 7,
      });
      const store = makeStore();
      const file = new File(['a,b,c'], 'h.csv', { type: 'text/csv' });

      const result = await store.dispatch(
        historicalFilesApi.endpoints.uploadHistoricalFile.initiate({ file })
      );

      expect((result.data as { id: number }).id).toBe(1);

      const callArg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        method: string;
        body: FormData;
      };
      expect(callArg.url).toBe('admin/historical-files/upload');
      expect(callArg.method).toBe('POST');
      expect(callArg.body).toBeInstanceOf(FormData);
      // The single multipart field MUST be named `file` and carry the File.
      expect((callArg.body as FormData).get('file')).toBe(file);
    });

    it('surfaces a backend 400 error', async () => {
      mockErr(400);
      const store = makeStore();
      const file = new File(['x'], 'big.bin', { type: 'application/octet-stream' });
      const result = await store.dispatch(
        historicalFilesApi.endpoints.uploadHistoricalFile.initiate({ file })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  // GET list — hits the base path with no body.
  describe('getHistoricalFiles query', () => {
    it('calls baseQuery with the base path string', async () => {
      const rows = [
        { id: 2, file_name: 'b.pdf', file_type: 'application/pdf', size_bytes: 20, uploaded_at: '2026-06-17T12:00:00.000Z', uploaded_by: 7 },
        { id: 1, file_name: 'a.csv', file_type: 'text/csv', size_bytes: 10, uploaded_at: '2026-06-16T12:00:00.000Z', uploaded_by: null },
      ];
      mockOk(rows);
      const store = makeStore();
      const result = await store.dispatch(
        historicalFilesApi.endpoints.getHistoricalFiles.initiate()
      );

      expect(result.data).toEqual(rows);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'admin/historical-files',
        expectExtraArgs,
        undefined
      );
    });

    it('surfaces a 500 error', async () => {
      mockErr(500);
      const store = makeStore();
      const result = await store.dispatch(
        historicalFilesApi.endpoints.getHistoricalFiles.initiate()
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(500);
    });
  });

  // GET download-link — lazy query interpolates :id.
  describe('getHistoricalFileDownloadLink query', () => {
    it('interpolates the id into BASE/:id/download-link', async () => {
      mockOk({
        id: 5,
        url: 'https://s3.example/presigned',
        file_name: 'h.pdf',
        file_type: 'application/pdf',
        expires_in: 300,
      });
      const store = makeStore();
      const result = await store.dispatch(
        historicalFilesApi.endpoints.getHistoricalFileDownloadLink.initiate(5)
      );

      expect((result.data as { expires_in: number }).expires_in).toBe(300);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'admin/historical-files/5/download-link',
        expectExtraArgs,
        undefined
      );
    });

    it('returns url null on the disk driver', async () => {
      mockOk({ id: 5, url: null, file_name: 'h.pdf', file_type: 'application/pdf', expires_in: null });
      const store = makeStore();
      const result = await store.dispatch(
        historicalFilesApi.endpoints.getHistoricalFileDownloadLink.initiate(5)
      );
      expect((result.data as { url: string | null }).url).toBeNull();
    });

    it('surfaces a 404 error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        historicalFilesApi.endpoints.getHistoricalFileDownloadLink.initiate(999)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  // GET file blob — lazy query interpolates :id and provides a blob responseHandler.
  describe('getHistoricalFileBlob query', () => {
    it('interpolates the id into BASE/:id/file and provides a responseHandler', async () => {
      const blob = new Blob(['bytes']);
      mockOk(blob);
      const store = makeStore();
      const result = await store.dispatch(
        historicalFilesApi.endpoints.getHistoricalFileBlob.initiate(9)
      );

      expect(result.data).toBe(blob);
      const callArg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        responseHandler: unknown;
      };
      expect(callArg.url).toBe('admin/historical-files/9/file');
      expect(typeof callArg.responseHandler).toBe('function');
    });
  });

  describe('endpoint + hook configuration', () => {
    it('defines all endpoints', () => {
      expect(historicalFilesApi.endpoints.uploadHistoricalFile).toBeDefined();
      expect(historicalFilesApi.endpoints.getHistoricalFiles).toBeDefined();
      expect(historicalFilesApi.endpoints.getHistoricalFileDownloadLink).toBeDefined();
      expect(historicalFilesApi.endpoints.getHistoricalFileBlob).toBeDefined();
    });

    it('exports all hooks', () => {
      expect(historicalFilesApi.useUploadHistoricalFileMutation).toBeDefined();
      expect(historicalFilesApi.useGetHistoricalFilesQuery).toBeDefined();
      expect(historicalFilesApi.useLazyGetHistoricalFileDownloadLinkQuery).toBeDefined();
      expect(historicalFilesApi.useLazyGetHistoricalFileBlobQuery).toBeDefined();
    });
  });
});
