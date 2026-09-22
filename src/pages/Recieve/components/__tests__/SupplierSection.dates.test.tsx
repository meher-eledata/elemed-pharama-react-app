/**
 * feature/receipt-date (2026-09-22): the receive form's SupplierSection must render
 * BOTH date pickers — the supplier's Invoice Date AND the new editable Receipt Date
 * (goods-in date) — each seeded from its own prop. The two dates are distinct fields
 * and must never collapse into one (see the useOrderReceiveActions edit-prefill
 * regression test). The "Receipt Date defaults to today on a NEW receipt" default is
 * owned by useOrderDetailsForm and covered in useOrderDetailsForm.receiptDate.test.ts.
 */
import { render, screen } from "@testing-library/react";
import SupplierSection from "../SupplierSection";

const baseProps = () => ({
  supplierName: "Acme",
  setSupplierName: jest.fn(),
  supplierSearchTerm: "",
  setSupplierSearchTerm: jest.fn(),
  filteredSupplierOptions: ["Acme"],
  isSuppliersLoading: false,
  suppliersError: null,
  retryFetchSuppliers: jest.fn(),
  onAddNewSupplier: jest.fn(),
  poNumber: "PO-9",
  setPoNumber: jest.fn(),
  invoiceDate: "01/09/2026",
  setInvoiceDate: jest.fn(),
  receiptDate: "22/09/2026",
  setReceiptDate: jest.fn(),
  invoiceNumber: "INV-1",
  setInvoiceNumber: jest.fn(),
  invoiceNumberError: "",
});

describe("SupplierSection — Invoice Date + Receipt Date", () => {
  it("renders BOTH the Invoice Date and Receipt Date field labels", () => {
    render(<SupplierSection {...baseProps()} />);
    expect(screen.getByText("Invoice Date")).toBeInTheDocument();
    expect(screen.getByText("Receipt Date")).toBeInTheDocument();
  });

  it("seeds each date picker from its OWN prop (the two dates stay distinct)", () => {
    render(<SupplierSection {...baseProps()} />);
    // Each picker input shows its own DD/MM/YYYY value — proof they are separate
    // fields, not one value mirrored into both.
    expect(screen.getByDisplayValue("01/09/2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("22/09/2026")).toBeInTheDocument();
  });
});
