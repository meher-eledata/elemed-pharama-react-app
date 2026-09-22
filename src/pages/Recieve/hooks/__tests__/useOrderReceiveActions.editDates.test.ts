/**
 * REGRESSION (feature/receipt-date, 2026-09-22): the receive EDIT prefill must NOT
 * copy the goods-received date into the Invoice Date field.
 *
 * Background / the fixed blocker: submit-receipt/edit-receipt now PERSIST invoice_date
 * (the supplier's own invoice date) as a real, nullable column. The old
 * handleEditClick had an `else if (row.received)` fallback that, when a receipt had NO
 * supplier invoice_date, prefilled the Invoice Date picker from the goods-received
 * timestamp. On save that goods-in date was written back AS the supplier invoice date,
 * permanently corrupting the very two dates this feature separates. Code-review caught
 * it; this test pins the fix:
 *   - a NULL/absent invoice_date leaves Invoice Date BLANK even when `received` is set;
 *   - a real invoice_date is still formatted through to the picker;
 *   - receipt_date prefills the new Receipt Date field.
 * If the `else if (row.received)` fallback is ever reintroduced, the first test FAILS.
 */
import { renderHook } from "@testing-library/react";
import { useOrderReceiveActions } from "../useOrderReceiveActions";
import { OrderReceiveRow } from "../../types";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// The hook calls useEditReceiptMutation at mount; a no-op tuple is enough here.
jest.mock("../../../../redux/slices/receiveApi", () => ({
  useEditReceiptMutation: () => [jest.fn(), { isLoading: false }],
}));

const baseRow = (overrides: Partial<OrderReceiveRow> = {}): OrderReceiveRow =>
  ({
    receiptId: 42,
    reNo: "RA42",
    poNo: "PO-9",
    po_id: 500,
    supplier: "Acme",
    supplierId: 3,
    // A goods-received display timestamp is ALWAYS present — the trap the old
    // fallback sprang from.
    received: "Jun 10, 2026 2:30 PM",
    status: "Received",
    reBy: "meher",
    amt: 100,
    products: [],
    receipt_number: "GRN-000042",
    ...overrides,
  } as OrderReceiveRow);

const renderActions = () =>
  renderHook(() =>
    useOrderReceiveActions([], jest.fn(), [], jest.fn())
  );

const navState = () => mockNavigate.mock.calls[0][1].state;

describe("useOrderReceiveActions.handleEditClick — date prefill", () => {
  beforeEach(() => jest.clearAllMocks());

  it("leaves Invoice Date BLANK when invoice_date is null, even though `received` is set (no goods-in fallback)", () => {
    const { result } = renderActions();

    result.current.handleEditClick(
      baseRow({ invoice_date: undefined, receipt_date: "2026-06-10" })
    );

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    // The pinned invariant: Invoice Date must NOT be derived from the goods-received
    // date. Reintroducing `else if (row.received)` would make this '10/06/2026'.
    expect(navState().invoiceDate).toBe("");
  });

  it("still prefills a real supplier invoice_date (formatted DD/MM/YYYY)", () => {
    const { result } = renderActions();

    result.current.handleEditClick(
      baseRow({ invoice_date: "2026-06-01", receipt_date: "2026-06-10" })
    );

    expect(navState().invoiceDate).toBe("01/06/2026");
  });

  it("prefills the new Receipt Date field from receipt_date (DD/MM/YYYY)", () => {
    const { result } = renderActions();

    result.current.handleEditClick(
      baseRow({ invoice_date: undefined, receipt_date: "2026-06-10" })
    );

    expect(navState().receiptDate).toBe("10/06/2026");
  });

  it("leaves Receipt Date blank when receipt_date is null (legacy row), still no invoice fallback", () => {
    const { result } = renderActions();

    result.current.handleEditClick(
      baseRow({ invoice_date: undefined, receipt_date: null })
    );

    expect(navState().receiptDate).toBe("");
    expect(navState().invoiceDate).toBe("");
  });
});
