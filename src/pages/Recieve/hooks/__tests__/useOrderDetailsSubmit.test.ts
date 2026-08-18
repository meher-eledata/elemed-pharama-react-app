/**
 * Focused tests for the receive submit flow (useOrderDetailsSubmit):
 *
 * 1. When the RTK Query submit-receipt mutation rejects, the hook must NOT
 *    fall back to a raw fetch re-POST of the same payload (a timeout-after-
 *    commit re-submit was duplicating stock). The error surfaces via
 *    setSaveError instead.
 * 2. Every submit carries an idempotency_key that is REUSED when the same
 *    failed payload is retried and REGENERATED after a successful submit.
 */
import { act, renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import { useOrderDetailsSubmit } from "../useOrderDetailsSubmit";
import { PharmaTableRow } from "../../types";

const mockSubmitReceipt = jest.fn();
const mockEditReceipt = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => "test-token",
}));

jest.mock("../../../../redux/slices/receiveApi", () => ({
  receiveApi: { util: { invalidateTags: jest.fn() } },
  useSubmitReceiptMutation: () => [mockSubmitReceipt, { isLoading: false }],
  useEditReceiptMutation: () => [mockEditReceipt, { isLoading: false }],
  useUploadReceiptFileMutation: () => [jest.fn()],
}));

const row: PharmaTableRow = {
  id: "r1",
  productId: "Paracetamol 500",
  product_id: 10,
  batchNumber: "B1",
  qtyReceived: 5,
  qtyFree: 0,
  batch: null,
  expiryDate: dayjs("2027-06-30"),
  pp: 10,
  sp: 12,
  pack: "10x10",
  mrp: 20,
  cgst: 2.5,
  sgst: 2.5,
  igst: 0,
  disc: 0,
  margPercent: 0,
  salesDiscPercent: 0,
};

const makeParams = () => ({
  supplierName: "Medico",
  supplierOptions: [{ supplier_name: "Medico", supplier_id: 3 }],
  poNumber: "PO-1",
  invoiceDate: "15/02/2026",
  invoiceNumber: "INV-7",
  transactionNumber: "",
  paymentVendor: "",
  paymentMethod: "CASH",
  pharmaTableData: [row],
  originalReceiptLines: [],
  productOptionsWithIds: [{ name: "Paracetamol 500", id: 10 }],
  invoiceFile: null,
  isEditMode: false,
  receiptId: null,
  user: { username: "tester" },
  setIsSaving: jest.fn(),
  setSaveError: jest.fn(),
  setSaveSuccess: jest.fn(),
  setSavedReceiptNumber: jest.fn(),
  setIsDeleting: jest.fn(),
  setDeleteError: jest.fn(),
  setDeleteSuccess: jest.fn(),
  resetForm: jest.fn(),
  setPharmaTableData: jest.fn(),
  setFindProductTerm: jest.fn(),
  setEditingRowId: jest.fn(),
  setEditingData: jest.fn(),
  setIsProductSelected: jest.fn(),
  isProductRowComplete: () => true,
});

describe("useOrderDetailsSubmit — no re-submit on RTK error", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("surfaces the RTK error via setSaveError and never re-POSTs via raw fetch", async () => {
    mockSubmitReceipt.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: "Request timed out" } }),
    });
    const params = makeParams();
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave();
    });

    expect(mockSubmitReceipt).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(params.setSaveError).toHaveBeenCalledWith("Request timed out");
    expect(params.setSaveSuccess).not.toHaveBeenCalledWith(true);
    expect(params.setIsSaving).toHaveBeenLastCalledWith(false);
  });

  it("does not re-submit on RTK error in handleSaveAndPayLater either", async () => {
    mockSubmitReceipt.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: "boom" } }),
    });
    const params = makeParams();
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.handleSaveAndPayLater();
    });

    expect(mockSubmitReceipt).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(params.setSaveError).toHaveBeenCalledWith("boom");
  });

  it("reuses the idempotency_key on retry of the same failed payload and regenerates it after success", async () => {
    mockSubmitReceipt
      .mockReturnValueOnce({
        unwrap: () => Promise.reject({ data: { message: "timeout" } }),
      })
      .mockReturnValueOnce({
        unwrap: () => Promise.resolve({ receipt_id: 42 }),
      })
      .mockReturnValueOnce({
        unwrap: () => Promise.reject({ data: { message: "timeout" } }),
      });
    const params = makeParams();
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave(); // fails
      await result.current.proceedWithSave(); // retry of the same payload — succeeds
      await result.current.proceedWithSave(); // new logical submission (same payload)
    });

    const keys = mockSubmitReceipt.mock.calls.map(([body]) => body.idempotency_key);
    expect(keys[0]).toEqual(expect.any(String));
    expect(keys[0].length).toBeGreaterThan(0);
    expect(keys[0].length).toBeLessThanOrEqual(64);
    // Retry of the same failed submission reuses the key…
    expect(keys[1]).toBe(keys[0]);
    // …but after a successful submit the key is reset.
    expect(keys[2]).not.toBe(keys[1]);
  });

  it("names the server-issued receipt number on success", async () => {
    mockSubmitReceipt.mockReturnValue({
      unwrap: () => Promise.resolve({ receipt_id: 42, receipt_number: "GRN-2608-0042" }),
    });
    const params = makeParams();
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.handleSaveAndPayLater();
    });

    expect(params.setSavedReceiptNumber).toHaveBeenCalledWith("GRN-2608-0042");
  });

  // A response WITHOUT receipt_number is the legacy shape (a backend that predates
  // migration 019, or a rollback to it). It must degrade to null — never to the string
  // "undefined" and never left holding a previous submit's number — so the success
  // banner falls back to its generic wording instead of naming a number that does not
  // exist.
  it.each([
    ["the field is absent", { receipt_id: 42 }],
    ["the field is explicitly null", { receipt_id: 42, receipt_number: null }],
  ])("sets the saved receipt number to null when %s", async (_label, response) => {
    mockSubmitReceipt.mockReturnValue({ unwrap: () => Promise.resolve(response) });
    const params = makeParams();
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.handleSaveAndPayLater();
    });

    expect(params.setSavedReceiptNumber).toHaveBeenCalledWith(null);
    expect(params.setSaveSuccess).toHaveBeenCalledWith(true);
  });

  it("surfaces the duplicate-receipt-number 409 as its own message", async () => {
    mockSubmitReceipt.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            error: "DUPLICATE_RECEIPT_NUMBER",
            message: "This receipt number is already used in this pharmacy",
          },
        }),
    });
    const params = makeParams();
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave();
    });

    expect(params.setSaveError).toHaveBeenCalledWith(
      "This receipt number is already used in this pharmacy",
    );
  });
});

// ===========================================================================
// extraction_id correction-signal (invoice-extraction capture)
//
// When the form was pre-filled from POST /receive/extract-invoice, the hook
// receives the persisted draft id (`extractionId`) and must echo it as the
// optional body field `extraction_id` on CREATE-mode submits only. Invariants:
// - sent only when a numeric id is provided (manual entry sends NOTHING);
// - kept OUTSIDE the idempotency fingerprint, so the idempotency_key is
//   byte-identical for the same payload with and without an extraction id;
// - consumed (clearExtractionId) only AFTER a successful save — a failed save
//   retains it for the retry;
// - the edit path never sends it.
// ===========================================================================
describe("useOrderDetailsSubmit — extraction_id correction-signal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const success = () =>
    mockSubmitReceipt.mockReturnValue({
      unwrap: () => Promise.resolve({ receipt_id: 42, receipt_number: "GRN-2608-0042" }),
    });

  it("create-mode saves include extraction_id on ALL THREE save paths when provided", async () => {
    success();
    const params = { ...makeParams(), extractionId: 77, clearExtractionId: jest.fn() };
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave();
      await result.current.handleProceedToPayment();
      await result.current.handleSaveAndPayLater();
    });

    expect(mockSubmitReceipt).toHaveBeenCalledTimes(3);
    for (const [body] of mockSubmitReceipt.mock.calls) {
      expect(body.extraction_id).toBe(77);
    }
  });

  it.each([
    ["not provided at all", {}],
    ["explicitly null (extraction failed / manual entry)", { extractionId: null }],
  ])("omits the extraction_id KEY entirely when %s", async (_label, override) => {
    success();
    const params = { ...makeParams(), ...override };
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave();
    });

    expect(mockSubmitReceipt).toHaveBeenCalledTimes(1);
    expect(mockSubmitReceipt.mock.calls[0][0]).not.toHaveProperty("extraction_id");
  });

  it("keeps the idempotency_key byte-identical with and without extraction_id (id is outside the fingerprint)", async () => {
    // First attempt (no extraction id) fails; the retry carries an id. Because
    // extraction_id is spread OUTSIDE the fingerprinted payload, the retry must
    // REUSE the same idempotency_key — the backend then replays/continues the
    // same logical submission instead of double-committing.
    mockSubmitReceipt
      .mockReturnValueOnce({ unwrap: () => Promise.reject({ data: { message: "timeout" } }) })
      .mockReturnValueOnce({ unwrap: () => Promise.resolve({ receipt_id: 42 }) });

    const clearExtractionId = jest.fn();
    const { result, rerender } = renderHook(
      ({ extractionId }: { extractionId: number | null }) =>
        useOrderDetailsSubmit({ ...makeParams(), extractionId, clearExtractionId }),
      { initialProps: { extractionId: null as number | null } }
    );

    await act(async () => {
      await result.current.proceedWithSave(); // fails, no extraction_id
    });
    rerender({ extractionId: 77 });
    await act(async () => {
      await result.current.proceedWithSave(); // retry of the same payload, now WITH the id
    });

    const [firstBody] = mockSubmitReceipt.mock.calls[0];
    const [secondBody] = mockSubmitReceipt.mock.calls[1];
    expect(firstBody).not.toHaveProperty("extraction_id");
    expect(secondBody.extraction_id).toBe(77);
    // Same fingerprint -> the exact same key, byte for byte.
    expect(secondBody.idempotency_key).toBe(firstBody.idempotency_key);
  });

  it("consumes the id (clearExtractionId) after a successful save", async () => {
    success();
    const clearExtractionId = jest.fn();
    const params = { ...makeParams(), extractionId: 77, clearExtractionId };
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave();
    });

    expect(clearExtractionId).toHaveBeenCalledTimes(1);
  });

  it("a FAILED save retains the id (clearExtractionId not called) so the retry can still link", async () => {
    mockSubmitReceipt.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: "timeout" } }),
    });
    const clearExtractionId = jest.fn();
    const params = { ...makeParams(), extractionId: 77, clearExtractionId };
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave();
    });

    expect(mockSubmitReceipt).toHaveBeenCalledTimes(1);
    expect(mockSubmitReceipt.mock.calls[0][0].extraction_id).toBe(77);
    expect(clearExtractionId).not.toHaveBeenCalled();
    expect(params.setSaveError).toHaveBeenCalledWith("timeout");
  });

  it("the EDIT path never sends extraction_id (and never consumes it)", async () => {
    mockEditReceipt.mockReturnValue({
      unwrap: () => Promise.resolve({ receipt_id: 5 }),
    });
    const clearExtractionId = jest.fn();
    const params = {
      ...makeParams(),
      isEditMode: true,
      receiptId: 5,
      extractionId: 77,
      clearExtractionId,
    };
    const { result } = renderHook(() => useOrderDetailsSubmit(params));

    await act(async () => {
      await result.current.proceedWithSave();
    });

    expect(mockSubmitReceipt).not.toHaveBeenCalled();
    expect(mockEditReceipt).toHaveBeenCalledTimes(1);
    expect(mockEditReceipt.mock.calls[0][0]).not.toHaveProperty("extraction_id");
    expect(clearExtractionId).not.toHaveBeenCalled();
  });
});
