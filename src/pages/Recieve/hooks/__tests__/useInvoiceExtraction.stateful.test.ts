/**
 * Stateful tests for the useInvoiceExtraction HOOK itself — specifically the
 * correction-signal `extractionId` lifecycle added for invoice-extraction
 * capture:
 *
 * - a successful draft exposes the persisted draft id (`extraction_id`) as
 *   `extractionId`;
 * - a non-number / null `extraction_id` (backend persistence failed) exposes
 *   null — extraction still works;
 * - a NEW extraction resets the id to null BEFORE the request resolves, so a
 *   stale id from a previous file can never leak onto the next submit;
 * - `clearExtractionId` (called by the submit flow after a successful save)
 *   nulls it;
 * - edit mode / failed extraction never produce an id.
 *
 * The RTK Query mutation hook is mocked (module-level jest.fn), following the
 * useOrderDetailsSubmit.test.ts pattern; the pure draft->rows transforms are
 * covered by the sibling useInvoiceExtraction.test.ts.
 */
import { act, renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useInvoiceExtraction } from "../useInvoiceExtraction";
import { ExtractInvoiceDraft } from "../../../../redux/slices/receiveApi";

// Mirror the app's runtime: dayjs parses "YYYY-MM-DD" with the custom-format plugin.
dayjs.extend(customParseFormat);

const mockExtractInvoice = jest.fn();

jest.mock("../../../../redux/slices/receiveApi", () => ({
  useExtractInvoiceMutation: () => [mockExtractInvoice, { isLoading: false }],
}));

// A minimal successful draft: no lines and nothing resolved above threshold, so
// the setter side-effects stay quiet — these tests are about extractionId only.
const makeDraft = (extractionId: number | null): ExtractInvoiceDraft => ({
  header: {
    supplier: { id: null, matched_name: null, confidence: 0, candidates: [] },
    invoice_number: { value: null, confidence: 0 },
    invoice_date: { value: null, confidence: 0 },
    po_number: { value: null, confidence: 0 },
  },
  lines: [],
  unresolved_fields: [],
  meta: { driver: "stub", threshold: 0.85 },
  extraction_id: extractionId,
});

const makeParams = (overrides: Partial<{ isEditMode: boolean }> = {}) => ({
  isEditMode: false,
  setSupplierName: jest.fn(),
  setSupplierSearchTerm: jest.fn(),
  setInvoiceNumber: jest.fn(),
  setInvoiceDate: jest.fn(),
  setPoNumber: jest.fn(),
  setPharmaTableData: jest.fn(),
  updateRow: jest.fn(),
  onFallback: jest.fn(),
  ...overrides,
});

const file = new File(["%PDF-1.4 fake"], "inv.pdf", { type: "application/pdf" });

const resolveWith = (draft: ExtractInvoiceDraft) =>
  mockExtractInvoice.mockReturnValue({ unwrap: () => Promise.resolve(draft) });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useInvoiceExtraction — extractionId lifecycle", () => {
  it("starts null and exposes the draft's extraction_id after a successful extraction", async () => {
    resolveWith(makeDraft(42));
    const { result } = renderHook(() => useInvoiceExtraction(makeParams()));

    expect(result.current.extractionId).toBeNull();

    await act(async () => {
      await result.current.runExtraction(file);
    });

    expect(mockExtractInvoice).toHaveBeenCalledWith({ file });
    expect(result.current.extractionId).toBe(42);
  });

  it.each([
    ["null (backend persistence failed)", null],
    ["a non-number", "42" as unknown as number],
    ["absent", undefined as unknown as number],
  ])("exposes null when the draft's extraction_id is %s", async (_label, value) => {
    const draft = makeDraft(null);
    (draft as any).extraction_id = value;
    resolveWith(draft);
    const { result } = renderHook(() => useInvoiceExtraction(makeParams()));

    await act(async () => {
      await result.current.runExtraction(file);
    });

    expect(result.current.extractionId).toBeNull();
  });

  it("resets to null at the START of a new extraction (before the request resolves)", async () => {
    resolveWith(makeDraft(42));
    const { result } = renderHook(() => useInvoiceExtraction(makeParams()));

    await act(async () => {
      await result.current.runExtraction(file);
    });
    expect(result.current.extractionId).toBe(42);

    // Second extraction: hold the response open and observe the reset.
    let resolveSecond!: (d: ExtractInvoiceDraft) => void;
    mockExtractInvoice.mockReturnValue({
      unwrap: () => new Promise<ExtractInvoiceDraft>((res) => { resolveSecond = res; }),
    });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.runExtraction(file);
    });
    // The stale 42 must be gone while the new request is still in flight.
    expect(result.current.extractionId).toBeNull();

    await act(async () => {
      resolveSecond(makeDraft(99));
      await pending;
    });
    expect(result.current.extractionId).toBe(99);
  });

  it("a FAILED extraction leaves extractionId null (and falls back), even after a prior success", async () => {
    resolveWith(makeDraft(42));
    const params = makeParams();
    const { result } = renderHook(() => useInvoiceExtraction(params));

    await act(async () => {
      await result.current.runExtraction(file);
    });
    expect(result.current.extractionId).toBe(42);

    mockExtractInvoice.mockReturnValue({ unwrap: () => Promise.reject(new Error("422")) });
    await act(async () => {
      await result.current.runExtraction(file);
    });

    expect(result.current.extractionId).toBeNull();
    expect(params.onFallback).toHaveBeenCalledTimes(1);
  });

  it("clearExtractionId nulls a held id (consumed by the submit flow after a save)", async () => {
    resolveWith(makeDraft(42));
    const { result } = renderHook(() => useInvoiceExtraction(makeParams()));

    await act(async () => {
      await result.current.runExtraction(file);
    });
    expect(result.current.extractionId).toBe(42);

    act(() => {
      result.current.clearExtractionId();
    });
    expect(result.current.extractionId).toBeNull();
  });

  it("edit mode never extracts: no request, extractionId stays null", async () => {
    resolveWith(makeDraft(42));
    const { result } = renderHook(() =>
      useInvoiceExtraction(makeParams({ isEditMode: true }))
    );

    await act(async () => {
      await result.current.runExtraction(file);
    });

    expect(mockExtractInvoice).not.toHaveBeenCalled();
    expect(result.current.extractionId).toBeNull();
  });
});
