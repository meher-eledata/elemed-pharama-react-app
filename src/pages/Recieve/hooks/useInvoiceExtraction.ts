import { useState } from "react";
import dayjs from "dayjs";
import {
  useExtractInvoiceMutation,
  ExtractInvoiceDraft,
  ExtractInvoiceField,
  ExtractInvoiceCandidate,
} from "../../../redux/slices/receiveApi";
import { PharmaTableRow } from "../types";
import { INVOICE_EXTRACTION } from "../../../config/constants/OrderReceive.constants";

// ---- Review model surfaced to the user for blank / low-confidence fields ----
export interface InvoiceReviewFieldItem {
  path: string; // draft field key (e.g. "header.supplier", "product", "mrp")
  label: string; // human label
  candidates: ExtractInvoiceCandidate[]; // quick-pick options (supplier / product only)
}

export interface InvoiceReviewLine {
  rowId: string; // matches the generated PharmaTableRow.id
  index: number;
  label: string; // product name (if matched) or raw invoice text
  fields: InvoiceReviewFieldItem[];
}

export interface InvoiceReview {
  count: number; // headline count — driven by draft.unresolved_fields
  header: InvoiceReviewFieldItem[];
  lines: InvoiceReviewLine[];
  driver: string;
}

const meetsThreshold = (f: ExtractInvoiceField<any> | undefined, threshold: number): boolean =>
  !!f && f.confidence >= threshold && f.value != null && f.value !== "";

const fieldNum = (f: ExtractInvoiceField<any> | undefined, threshold: number): number => {
  if (!meetsThreshold(f, threshold)) return 0;
  const n = Number(f!.value);
  return Number.isFinite(n) ? n : 0;
};

const fieldStr = (f: ExtractInvoiceField<any> | undefined, threshold: number): string =>
  meetsThreshold(f, threshold) ? String(f!.value) : "";

const fieldDate = (f: ExtractInvoiceField<any> | undefined, threshold: number) => {
  if (!meetsThreshold(f, threshold)) return null;
  // Local-time parse of YYYY-MM-DD (avoids the UTC one-day-shift bug).
  const parsed = dayjs(String(f!.value), "YYYY-MM-DD");
  return parsed.isValid() ? parsed : null;
};

// Pure: draft.lines[] -> PharmaTableRow[]. Only cells at/above threshold are
// filled; everything else is left blank (0 / "" / null) for manual review.
export const buildRowsFromDraft = (
  draft: ExtractInvoiceDraft,
  threshold: number
): PharmaTableRow[] => {
  const base = Date.now();
  return draft.lines.map((line, i) => {
    const productResolved =
      line.product.id != null && line.product.confidence >= threshold;
    const pp = fieldNum(line.purchase_price, threshold);
    return {
      id: String(base + i),
      productId: productResolved ? line.product.name ?? "" : "",
      product_id: productResolved ? line.product.id! : undefined,
      batchNumber: fieldStr(line.batch_number, threshold),
      qtyReceived: fieldNum(line.received_qty, threshold),
      qtyFree: fieldNum(line.free_qty, threshold),
      batch: null,
      expiryDate: fieldDate(line.expiry_date, threshold),
      pp,
      sp: pp, // default selling price to purchase price (mirrors edit-mode load)
      pack: "",
      mrp: fieldNum(line.mrp, threshold),
      cgst: fieldNum(line.cgst, threshold),
      sgst: fieldNum(line.sgst, threshold),
      igst: fieldNum(line.igst, threshold),
      disc: fieldNum(line.discount, threshold),
      margPercent: 0,
      salesDiscPercent: 0,
      isEditing: false,
    };
  });
};

// Pure: build the "needs review" model from the canonical unresolved_fields list,
// pulling candidates for supplier / product paths out of the draft.
export const buildReview = (
  draft: ExtractInvoiceDraft,
  rows: PharmaTableRow[]
): InvoiceReview => {
  const header: InvoiceReviewFieldItem[] = [];
  const lineMap = new Map<number, InvoiceReviewLine>();

  for (const path of draft.unresolved_fields || []) {
    if (path.startsWith("header.")) {
      header.push({
        path,
        label: INVOICE_EXTRACTION.FIELD_LABELS[path] ?? path,
        candidates: path === "header.supplier" ? draft.header.supplier.candidates ?? [] : [],
      });
      continue;
    }
    const m = path.match(/^lines\[(\d+)\]\.(.+)$/);
    if (!m) continue;
    const idx = Number(m[1]);
    const field = m[2];
    const line = draft.lines[idx];
    const row = rows[idx];
    if (!line || !row) continue;

    let entry = lineMap.get(idx);
    if (!entry) {
      entry = {
        rowId: row.id!,
        index: idx,
        label:
          (row.productId && row.productId.trim()) ||
          (line.raw_text && line.raw_text.trim()) ||
          INVOICE_EXTRACTION.lineLabel(idx + 1),
        fields: [],
      };
      lineMap.set(idx, entry);
    }
    entry.fields.push({
      path: field,
      label: INVOICE_EXTRACTION.FIELD_LABELS[field] ?? field,
      candidates: field === "product" ? line.product.candidates ?? [] : [],
    });
  }

  return {
    count: (draft.unresolved_fields || []).length,
    header,
    lines: [...lineMap.values()].sort((a, b) => a.index - b.index),
    driver: draft.meta?.driver ?? "stub",
  };
};

interface UseInvoiceExtractionParams {
  isEditMode: boolean;
  setSupplierName: (v: string) => void;
  setSupplierSearchTerm: (v: string) => void;
  setInvoiceNumber: (v: string) => void;
  setInvoiceDate: (v: string) => void;
  setPoNumber: (v: string) => void;
  setPharmaTableData: (rows: PharmaTableRow[]) => void;
  updateRow: (rowId: string, patch: Partial<PharmaTableRow>) => void;
  onFallback: () => void; // subtle toast — extraction failed, use manual entry
}

export const useInvoiceExtraction = ({
  isEditMode,
  setSupplierName,
  setSupplierSearchTerm,
  setInvoiceNumber,
  setInvoiceDate,
  setPoNumber,
  setPharmaTableData,
  updateRow,
  onFallback,
}: UseInvoiceExtractionParams) => {
  const [extractInvoice, { isLoading: isExtracting }] = useExtractInvoiceMutation();
  const [review, setReview] = useState<InvoiceReview | null>(null);

  // Attaching an invoice file in create mode triggers extraction + pre-fill.
  // Never runs in edit mode (would clobber the loaded receipt) and never blocks:
  // any failure (422 / network) silently falls back to manual entry.
  const runExtraction = async (file: File) => {
    if (isEditMode) return;
    setReview(null);
    try {
      const draft = await extractInvoice({ file }).unwrap();
      const threshold = draft.meta?.threshold ?? INVOICE_EXTRACTION.DEFAULT_THRESHOLD;

      // Header — each field only when its confidence clears the threshold.
      const { supplier, invoice_number, invoice_date, po_number } = draft.header;
      if (supplier.id != null && supplier.confidence >= threshold && supplier.matched_name) {
        setSupplierName(supplier.matched_name);
        setSupplierSearchTerm(supplier.matched_name);
      }
      if (meetsThreshold(invoice_number, threshold)) setInvoiceNumber(String(invoice_number.value));
      if (meetsThreshold(po_number, threshold)) setPoNumber(String(po_number.value));
      if (meetsThreshold(invoice_date, threshold)) {
        const d = dayjs(String(invoice_date.value), "YYYY-MM-DD");
        if (d.isValid()) setInvoiceDate(d.format("DD/MM/YYYY"));
      }

      // Lines — replace the (empty) table with the mapped draft rows.
      const rows = buildRowsFromDraft(draft, threshold);
      setPharmaTableData(rows);
      setReview(buildReview(draft, rows));
    } catch {
      onFallback();
    }
  };

  // Quick-pick: user confirms a supplier candidate from the review banner.
  const applySupplierCandidate = (c: ExtractInvoiceCandidate) => {
    setSupplierName(c.name);
    setSupplierSearchTerm(c.name);
    setReview((prev) => {
      if (!prev) return prev;
      const header = prev.header.filter((h) => h.path !== "header.supplier");
      return { ...prev, header, count: Math.max(0, prev.count - 1) };
    });
  };

  // Quick-pick: user confirms a product candidate for a specific line.
  const applyProductCandidate = (rowId: string, c: ExtractInvoiceCandidate) => {
    updateRow(rowId, { productId: c.name, product_id: c.id });
    setReview((prev) => {
      if (!prev) return prev;
      const lines = prev.lines
        .map((l) =>
          l.rowId === rowId
            ? { ...l, fields: l.fields.filter((f) => f.path !== "product") }
            : l
        )
        .filter((l) => l.fields.length > 0);
      return { ...prev, lines, count: Math.max(0, prev.count - 1) };
    });
  };

  const dismissReview = () => setReview(null);

  return {
    isExtracting,
    review,
    runExtraction,
    applySupplierCandidate,
    applyProductCandidate,
    dismissReview,
  };
};
