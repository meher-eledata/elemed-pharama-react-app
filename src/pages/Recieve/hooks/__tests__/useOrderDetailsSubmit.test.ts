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
  useEditReceiptMutation: () => [jest.fn(), { isLoading: false }],
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
