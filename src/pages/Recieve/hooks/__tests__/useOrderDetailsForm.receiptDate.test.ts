/**
 * feature/receipt-date (2026-09-22): the editable Receipt Date (goods-in date)
 * DEFAULTS TO TODAY on a NEW receipt, and is PREFILLED from the record on edit
 * (navigation state carries receiptDate as DD/MM/YYYY). This pins the useOrderDetailsForm
 * seeding of `receiptDate` — the value SupplierSection then renders.
 */
import { renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import { useOrderDetailsForm } from "../useOrderDetailsForm";

// Drive the hook's two external inputs directly: router location state and the
// auth slice. locationState is swapped per-test via the mutable holder below.
let mockLocationState: any = {};
jest.mock("react-router-dom", () => ({
  useLocation: () => ({ state: mockLocationState }),
}));
jest.mock("react-redux", () => ({
  useSelector: () => ({ user: { username: "tester" } }),
}));

describe("useOrderDetailsForm — receiptDate seeding", () => {
  beforeEach(() => {
    mockLocationState = {};
  });

  it("defaults receiptDate to TODAY (DD/MM/YYYY) on a new receipt (no navigation state)", () => {
    const today = dayjs().format("DD/MM/YYYY");
    const { result } = renderHook(() => useOrderDetailsForm());
    expect(result.current.receiptDate).toBe(today);
  });

  it("prefills receiptDate from navigation state on edit (does NOT force today)", () => {
    mockLocationState = { isEditMode: true, receiptDate: "10/06/2026" };
    const { result } = renderHook(() => useOrderDetailsForm());
    expect(result.current.receiptDate).toBe("10/06/2026");
  });
});
