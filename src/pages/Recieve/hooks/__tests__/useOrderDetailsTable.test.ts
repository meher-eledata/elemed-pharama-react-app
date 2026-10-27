import { act, renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import { useOrderDetailsTable } from "../useOrderDetailsTable";
import { PharmaTableRow, ProductOption } from "../../types";

// Catalog with a deliberate name-overlap: "Paracetamol 500" is a substring of the
// free-typed "Paracetamol 500 New Variant", which is exactly the case the edit-save
// path must NOT mis-resolve to the existing product's id.
const products: ProductOption[] = [
  { name: "Paracetamol 500", id: 10 },
  { name: "NAZOMAC-M", id: 20 },
];

const norm = (s: string) => s.trim().toLowerCase();

// Mirrors the SHARED substring resolver (used by add-to-table / submit) — it WOULD
// wrongly grab id 10 for "Paracetamol 500 New Variant".
const substringResolver = (name: string): number | null => {
  const t = norm(name);
  const p =
    products.find((x) => norm(x.name) === t) ||
    products.find((x) => norm(x.name).includes(t) || t.includes(norm(x.name)));
  return p ? p.id : null;
};

// Mirrors the exact resolver used on the edit-save path.
const exactResolver = (name: string): number | null => {
  const t = norm(name);
  const p = products.find((x) => norm(x.name) === t);
  return p ? p.id : null;
};

const baseRow: PharmaTableRow = {
  id: "r1",
  productId: "NAZOMAC-M",
  product_id: 20,
  batchNumber: "B1",
  qtyReceived: 5,
  qtyFree: 0,
  batch: null,
  expiryDate: dayjs().add(1, "year"),
  pp: 10,
  sp: 10,
  pack: "10x10",
  mrp: 20,
  cgst: 2.5,
  sgst: 2.5,
  igst: 0,
  disc: 0,
  margPercent: 0,
  salesDiscPercent: 0,
  isEditing: false,
};

const setup = () => {
  const showError = jest.fn();
  const hook = renderHook(() =>
    useOrderDetailsTable(products, substringResolver, exactResolver, showError)
  );
  act(() => {
    hook.result.current.setPharmaTableData([baseRow]);
    hook.result.current.startEditing(baseRow);
  });
  return { hook, showError };
};

const savedRow = (hook: ReturnType<typeof setup>["hook"]) =>
  hook.result.current.pharmaTableData[0];

describe("useOrderDetailsTable saveEditedRow — product_id resolution", () => {
  it("does NOT resolve a free-typed NON-exact name to an overlapping existing id", () => {
    const { hook, showError } = setup();
    act(() => {
      // Simulate free typing in the edit cell: name set, any prior id dropped.
      hook.result.current.updateEditingData("productId", "Paracetamol 500 New Variant");
      hook.result.current.updateEditingData("product_id", undefined);
    });
    act(() => hook.result.current.saveEditedRow());

    expect(showError).not.toHaveBeenCalled();
    expect(savedRow(hook).productId).toBe("Paracetamol 500 New Variant");
    // Exact-only: the substring match to "Paracetamol 500" (id 10) must be rejected.
    expect(savedRow(hook).product_id).toBeUndefined();
  });

  it("resolves an EXACT typed name to the catalog id", () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.updateEditingData("productId", "Paracetamol 500");
      hook.result.current.updateEditingData("product_id", undefined);
    });
    act(() => hook.result.current.saveEditedRow());

    expect(savedRow(hook).product_id).toBe(10);
  });

  it("keeps the id from a dropdown selection", () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.updateEditingData("productId", "NAZOMAC-M");
      hook.result.current.updateEditingData("product_id", 20);
    });
    act(() => hook.result.current.saveEditedRow());

    expect(savedRow(hook).product_id).toBe(20);
  });

  it("never submits the add-new sentinel id (-1)", () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.updateEditingData("productId", "A Brand New Product");
      hook.result.current.updateEditingData("product_id", -1 as any);
    });
    act(() => hook.result.current.saveEditedRow());

    expect(savedRow(hook).product_id).toBeUndefined();
  });
});

describe("useOrderDetailsTable — selling price follows MRP until the user sets it", () => {
  const setupBlankSp = () => {
    const showError = jest.fn();
    const hook = renderHook(() =>
      useOrderDetailsTable(products, substringResolver, exactResolver, showError)
    );
    const fresh = { ...baseRow, sp: 0, mrp: 0 };
    act(() => {
      hook.result.current.setPharmaTableData([fresh]);
      hook.result.current.startEditing(fresh);
    });
    return { hook, showError };
  };

  it("fills a blank SP with the MRP as it is typed", () => {
    const { hook } = setupBlankSp();
    act(() => hook.result.current.updateEditingData("mrp", 120));
    expect(hook.result.current.editingData.sp).toBe(120);
  });

  it("keeps following while SP still equals the previous MRP", () => {
    const { hook } = setupBlankSp();
    act(() => hook.result.current.updateEditingData("mrp", 120));
    act(() => hook.result.current.updateEditingData("mrp", 150));
    expect(hook.result.current.editingData.sp).toBe(150);
  });

  it("stops following once the user types their own SP", () => {
    const { hook } = setupBlankSp();
    act(() => hook.result.current.updateEditingData("mrp", 120));
    act(() => hook.result.current.updateEditingData("sp", 100));
    act(() => hook.result.current.updateEditingData("mrp", 200));
    expect(hook.result.current.editingData.sp).toBe(100);
    expect(hook.result.current.editingData.mrp).toBe(200);
  });

  it("refuses to save a row whose SP is above its MRP", () => {
    const { hook, showError } = setup(); // baseRow: mrp 20, sp 10
    act(() => hook.result.current.updateEditingData("sp", 25));
    act(() => hook.result.current.saveEditedRow());

    expect(showError).toHaveBeenCalledWith('Selling Price cannot be more than MRP for "NAZOMAC-M"');
    expect(hook.result.current.editingRowId).toBe("r1");
    expect(savedRow(hook).sp).toBe(10);
  });

  it("saves a row whose SP is blank or at most the MRP", () => {
    const { hook, showError } = setup();
    act(() => hook.result.current.updateEditingData("sp", 20));
    act(() => hook.result.current.saveEditedRow());

    expect(showError).not.toHaveBeenCalled();
    expect(savedRow(hook).sp).toBe(20);
  });
});
