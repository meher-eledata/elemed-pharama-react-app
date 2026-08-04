/**
 * Unit tests for the PURE helpers in
 * src/pages/Recieve/hooks/useInvoiceExtraction.ts — `buildRowsFromDraft` and
 * `buildReview`. These are dependency-free transforms over an ExtractInvoiceDraft
 * (the shape POST /api/receive/extract-invoice returns), so they need no store,
 * router, or rendered hook — we just feed a draft and assert the mapped output.
 *
 * The stateful hook (`useInvoiceExtraction`) drives the RTK Query mutation and
 * setter side-effects; those are exercised via OrderDetails' own suite. Here we
 * pin down the confidence gate, the no-day-shift date parse, and the review model.
 */

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  buildRowsFromDraft,
  buildReview,
} from "../useInvoiceExtraction";
import {
  ExtractInvoiceDraft,
} from "../../../../redux/slices/receiveApi";
import { INVOICE_EXTRACTION } from "../../../../config/constants/OrderReceive.constants";

// Mirror the app's runtime: dayjs parses "YYYY-MM-DD" with the custom-format plugin.
dayjs.extend(customParseFormat);

const THRESHOLD = INVOICE_EXTRACTION.DEFAULT_THRESHOLD; // 0.85

// A two-line draft: line 0 has a RESOLVED product + a below-threshold free_qty;
// line 1 has an UNRESOLVED product + several low-confidence cells.
const makeDraft = (): ExtractInvoiceDraft => ({
  header: {
    supplier: {
      id: null,
      matched_name: "Medico Distributors Pvt Ltd",
      confidence: 0.6,
      candidates: [
        { id: 3, name: "Medico Distributors Pvt Ltd", score: 0.6 },
        { id: 4, name: "Medicorp", score: 0.4 },
      ],
    },
    invoice_number: { value: "INV-2026-0007", confidence: 0.98 },
    invoice_date: { value: "2026-02-15", confidence: 0.95 },
    po_number: { value: null, confidence: 0 },
  },
  lines: [
    {
      raw_text: "Paracetamol 500mg Tablets",
      product: {
        id: 100,
        name: "Paracetamol 500mg Tablet",
        confidence: 0.95,
        candidates: [{ id: 100, name: "Paracetamol 500mg Tablet", score: 0.95 }],
      },
      batch_number: { value: "PCM-A", confidence: 0.9 },
      expiry_date: { value: "2027-06-30", confidence: 0.88 },
      received_qty: { value: 40, confidence: 0.95 },
      free_qty: { value: 10, confidence: 0.8 }, // below threshold → blanked
      purchase_price: { value: 28, confidence: 0.92 },
      cgst: { value: 6, confidence: 0.9 },
      sgst: { value: 6, confidence: 0.9 },
      igst: { value: 0, confidence: 0.9 },
      discount: { value: 5, confidence: 0.85 }, // inclusive → filled
      mrp: { value: 35, confidence: 0.9 },
    },
    {
      raw_text: "Amoxicillin 250mg Capsules",
      product: {
        id: null,
        name: "Amoxicillin 250mg Cap",
        confidence: 0.5,
        candidates: [{ id: 200, name: "Amoxicillin 250mg Cap", score: 0.5 }],
      },
      batch_number: { value: "AMX-B", confidence: 0.4 }, // low → blank
      expiry_date: { value: "2028-01-01", confidence: 0.3 }, // low → null
      received_qty: { value: 5, confidence: 0.5 }, // low → 0
      free_qty: { value: 2, confidence: 0.9 }, // above → 2
      purchase_price: { value: null, confidence: 0 },
      cgst: { value: 6, confidence: 0.4 },
      sgst: { value: 6, confidence: 0.4 },
      igst: { value: 0, confidence: 0.4 },
      discount: { value: 5, confidence: 0.4 },
      mrp: { value: 35, confidence: 0.4 },
    },
  ],
  unresolved_fields: [
    "header.supplier",
    "lines[0].free_qty",
    "lines[1].product",
    "lines[1].batch_number",
    "lines[1].received_qty",
  ],
  meta: { driver: "stub", threshold: 0.85 },
});

describe("buildRowsFromDraft", () => {
  it("fills cells at/above threshold and blanks below-threshold cells", () => {
    const rows = buildRowsFromDraft(makeDraft(), THRESHOLD);
    expect(rows).toHaveLength(2);

    const r0 = rows[0];
    // Resolved product → name + product_id carried through.
    expect(r0.productId).toBe("Paracetamol 500mg Tablet");
    expect(r0.product_id).toBe(100);
    // At/above threshold cells fill.
    expect(r0.batchNumber).toBe("PCM-A");
    expect(r0.qtyReceived).toBe(40);
    expect(r0.pp).toBe(28);
    expect(r0.mrp).toBe(35);
    expect(r0.cgst).toBe(6);
    expect(r0.disc).toBe(5); // discount 0.85 inclusive
    // Below threshold (free_qty 0.8) → blanked to 0.
    expect(r0.qtyFree).toBe(0);
  });

  it("defaults sp to the extracted purchase price (pp)", () => {
    const rows = buildRowsFromDraft(makeDraft(), THRESHOLD);
    expect(rows[0].pp).toBe(28);
    expect(rows[0].sp).toBe(28);
  });

  it("parses the expiry date in local time (DD/MM/YYYY) with NO day-shift", () => {
    const rows = buildRowsFromDraft(makeDraft(), THRESHOLD);
    const exp = rows[0].expiryDate;
    expect(exp).not.toBeNull();
    // 2027-06-30 must stay the 30th — never shift to the 29th via a UTC round-trip.
    expect(dayjs(exp!).format("DD/MM/YYYY")).toBe("30/06/2027");
  });

  it("leaves an unresolved product and low-confidence cells blank/0/null", () => {
    const rows = buildRowsFromDraft(makeDraft(), THRESHOLD);
    const r1 = rows[1];
    expect(r1.productId).toBe(""); // product.id null → not filled
    expect(r1.product_id).toBeUndefined();
    expect(r1.batchNumber).toBe(""); // 0.4 < threshold
    expect(r1.expiryDate).toBeNull(); // 0.3 < threshold
    expect(r1.qtyReceived).toBe(0); // 0.5 < threshold
    expect(r1.qtyFree).toBe(2); // 0.9 >= threshold
    expect(r1.pp).toBe(0); // null value
    expect(r1.sp).toBe(0);
  });
});

describe("buildReview", () => {
  it("headline count equals unresolved_fields.length", () => {
    const draft = makeDraft();
    const rows = buildRowsFromDraft(draft, THRESHOLD);
    const review = buildReview(draft, rows);
    expect(review.count).toBe(draft.unresolved_fields.length); // 5
    expect(review.driver).toBe("stub");
  });

  it("produces a header review item with the human label and supplier candidates", () => {
    const draft = makeDraft();
    const rows = buildRowsFromDraft(draft, THRESHOLD);
    const review = buildReview(draft, rows);

    expect(review.header).toHaveLength(1);
    const supplierItem = review.header[0];
    expect(supplierItem.path).toBe("header.supplier");
    expect(supplierItem.label).toBe("Supplier");
    // Candidates carried through for quick-pick.
    expect(supplierItem.candidates).toEqual(draft.header.supplier.candidates);
  });

  it("groups unresolved cells by line with FIELD_LABELS and carries product candidates", () => {
    const draft = makeDraft();
    const rows = buildRowsFromDraft(draft, THRESHOLD);
    const review = buildReview(draft, rows);

    // Two lines have unresolved entries (line 0: free_qty; line 1: product/batch/received).
    expect(review.lines).toHaveLength(2);
    // Sorted by line index.
    expect(review.lines[0].index).toBe(0);
    expect(review.lines[1].index).toBe(1);

    // Line 0 — resolved product name becomes the label; one field (Free packs).
    const l0 = review.lines[0];
    expect(l0.rowId).toBe(rows[0].id);
    expect(l0.label).toBe("Paracetamol 500mg Tablet");
    expect(l0.fields).toEqual([
      { path: "free_qty", label: "Free packs", candidates: [] },
    ]);

    // Line 1 — unresolved product → label falls back to the raw invoice text.
    const l1 = review.lines[1];
    expect(l1.rowId).toBe(rows[1].id);
    expect(l1.label).toBe("Amoxicillin 250mg Capsules");
    const paths = l1.fields.map((f) => f.path);
    expect(paths).toEqual(["product", "batch_number", "received_qty"]);
    // Human labels from FIELD_LABELS.
    const productField = l1.fields.find((f) => f.path === "product")!;
    expect(productField.label).toBe("Product");
    expect(productField.candidates).toEqual(draft.lines[1].product.candidates);
    const batchField = l1.fields.find((f) => f.path === "batch_number")!;
    expect(batchField.label).toBe("Batch number");
    expect(batchField.candidates).toEqual([]); // non-product fields carry no candidates
  });

  it("tolerates a missing/empty unresolved_fields list", () => {
    const draft = makeDraft();
    draft.unresolved_fields = [];
    const rows = buildRowsFromDraft(draft, THRESHOLD);
    const review = buildReview(draft, rows);
    expect(review.count).toBe(0);
    expect(review.header).toEqual([]);
    expect(review.lines).toEqual([]);
  });
});
