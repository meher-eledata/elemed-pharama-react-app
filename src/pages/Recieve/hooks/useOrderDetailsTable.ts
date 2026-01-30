import { useState, useMemo, ChangeEvent } from "react";
import dayjs, { Dayjs } from "dayjs";
import { PharmaTableRow, ProductOption } from "../types";

export const useOrderDetailsTable = (
  productOptionsWithIds: ProductOption[],
  getProductIdFromName: (name: string) => number | null
) => {
  // Table data state
  const [pharmaTableData, setPharmaTableData] = useState<PharmaTableRow[]>([]);

  // Editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<PharmaTableRow>>({});

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "productName", direction: "asc" });

  // Product selection state
  const [findProductTerm, setFindProductTerm] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [isProductSelected, setIsProductSelected] = useState<boolean>(false);

  const isProductRowComplete = (row: PharmaTableRow): boolean => {
    return !!(row.productId && row.productId.trim() !== "" && row.qtyReceived > 0);
  };

  const addProductToTable = async (productName: string) => {
    const resolvedProductId = getProductIdFromName(productName);

    const newProduct: PharmaTableRow = {
      id: Date.now().toString(),
      productId: productName,
      product_id: resolvedProductId || undefined,
      batchNumber: batchNumber || "",
      qtyReceived: 0,
      qtyFree: 0,
      batch: null,
      expiryDate: null,
      pp: 0,
      sp: 0,
      mrp: 0,
      cgst: 2.5,
      sgst: 2.5,
      igst: 0,
      disc: 0,
      margPercent: 0,
      salesDiscPercent: 0,
      isEditing: true,
    };

    setPharmaTableData((prev) => [...prev, newProduct]);
    // Set the new row as editing immediately
    setEditingRowId(newProduct.id!);
    setEditingData(newProduct);
    setFindProductTerm("");
    setBatchNumber("");
    setIsProductSelected(true);
  };

  const updateEditingData = (field: keyof PharmaTableRow, value: any) => {
    setEditingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const startEditing = (row: PharmaTableRow) => {
    setEditingRowId(row.id || null);
    setEditingData({ ...row });
  };

  const saveEditedRow = () => {
    if (!editingRowId) return;

    setPharmaTableData((prev) =>
      prev.map((row) =>
        row.id === editingRowId
          ? { ...row, ...editingData, isEditing: false }
          : row
      )
    );
    setEditingRowId(null);
    setEditingData({});
  };

  const cancelEditing = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const deleteRow = (rowId: string) => {
    setPharmaTableData((prev) => prev.filter((row) => row.id !== rowId));
  };

  const calculateAmount = (row: PharmaTableRow): number => {
    const qty = row.qtyReceived || 0;
    const price = row.pp || 0;
    const discount = typeof row.disc === 'number' ? row.disc : 0;
    const cgst = row.cgst || 0;
    const sgst = row.sgst || 0;
    const igst = row.igst || 0;

    const subtotal = qty * price;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * ((cgst + sgst + igst) / 100);
    return afterDiscount + taxAmount;
  };

  const totalAmount = useMemo(() => {
    return pharmaTableData.reduce((sum, row) => sum + calculateAmount(row), 0);
  }, [pharmaTableData]);

  const sortedData = useMemo(() => {
    let sortableItems = [...pharmaTableData];

    if (searchTerm) {
      sortableItems = sortableItems.filter((item) =>
        item.productId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof PharmaTableRow];
        const bValue = b[sortConfig.key as keyof PharmaTableRow];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [pharmaTableData, sortConfig, searchTerm]);

  const rowsPerPage = 5;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSortRequest = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return {
    // Table data
    pharmaTableData,
    setPharmaTableData,

    // Editing
    editingRowId,
    setEditingRowId,
    editingData,
    setEditingData,
    updateEditingData,
    startEditing,
    saveEditedRow,
    cancelEditing,

    // Search and sort
    searchTerm,
    setSearchTerm,
    handleSearchChange,
    currentPage,
    setCurrentPage,
    sortConfig,
    setSortConfig,
    sortedData,
    paginatedData,
    rowsPerPage,
    handleSortRequest,

    // Product selection
    findProductTerm,
    setFindProductTerm,
    batchNumber,
    setBatchNumber,
    isProductSelected,
    setIsProductSelected,

    // Operations
    addProductToTable,
    deleteRow,
    isProductRowComplete,
    calculateAmount,
    totalAmount,
  };
};
