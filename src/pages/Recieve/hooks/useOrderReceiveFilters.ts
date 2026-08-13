import { useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { OrderReceiveRow, PurchaseOrderRow } from "../types";
import { ORDER_RECEIVE_CONSTANTS } from "../../../config/constants/OrderReceive.constants";

export const useOrderReceiveFilters = (
  tableData: OrderReceiveRow[],
  purchaseOrderData: PurchaseOrderRow[],
  activeTab: number
) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "reNo", direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<{ [key: string]: string | undefined }>({});
  const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: "", direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
  };

  const uniqueSuppliers = useMemo(() => {
    const suppliers = Array.from(new Set(tableData.map(r => r.supplier))).sort();
    return suppliers.filter(supplier =>
      supplier.toLowerCase().includes(supplierSearchTerm.toLowerCase())
    );
  }, [tableData, supplierSearchTerm]);

  const sortedData = useMemo(() => {
    if (activeTab === 2) {
      let sortableItems = [...tableData];

      if (filters.supplier) {
        sortableItems = sortableItems.filter(item => item.supplier === filters.supplier);
      }

      if (dateRange[0] || dateRange[1]) {
        sortableItems = sortableItems.filter(item => {
          const receivedDate = item.receivedRaw
            ? dayjs(item.receivedRaw)
            : dayjs(item.received, 'MMM DD, YYYY h:mm A');
          const startDate = dateRange[0];
          const endDate = dateRange[1];

          if (startDate && endDate) {
            return receivedDate.isSame(startDate, 'day') ||
              receivedDate.isSame(endDate, 'day') ||
              (receivedDate.isAfter(startDate, 'day') && receivedDate.isBefore(endDate, 'day'));
          } else if (startDate) {
            return receivedDate.isSame(startDate, 'day') || receivedDate.isAfter(startDate, 'day');
          } else if (endDate) {
            return receivedDate.isSame(endDate, 'day') || receivedDate.isBefore(endDate, 'day');
          }
          return true;
        });
      }

      if (searchTerm.trim()) {
        const lowerSearch = searchTerm.toLowerCase();
        sortableItems = sortableItems.filter(item =>
          item.reNo.toLowerCase().includes(lowerSearch) ||
          (item.receipt_number ?? '').toLowerCase().includes(lowerSearch) ||
          (item.invoice_number ?? '').toLowerCase().includes(lowerSearch) ||
          item.supplier.toLowerCase().includes(lowerSearch) ||
          item.reBy.toLowerCase().includes(lowerSearch)
        );
      }

      const activeSortKey = sortConfig.key || 'reNo';
      const activeSortDirection = sortConfig.direction || 'desc';

      sortableItems.sort((a, b) => {
        const aValue = a[activeSortKey as keyof OrderReceiveRow];
        const bValue = b[activeSortKey as keyof OrderReceiveRow];

        if (activeSortKey === 'reNo' && typeof aValue === 'string' && typeof bValue === 'string') {
          const aNum = parseInt(aValue.replace(/\D/g, ''), 10) || 0;
          const bNum = parseInt(bValue.replace(/\D/g, ''), 10) || 0;
          return activeSortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return activeSortDirection === 'asc'
            ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
            : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return activeSortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
          : String(bValue).localeCompare(String(aValue), undefined, { numeric: true, sensitivity: 'base' });
      });
      return sortableItems;
    } else {
      let sortableItems = [...purchaseOrderData];

      if (searchTerm.trim()) {
        sortableItems = sortableItems.filter(item =>
          item.poNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      const activeSortKey = sortConfig.key || 'reNo';
      const activeSortDirection = sortConfig.direction || 'desc';

      sortableItems.sort((a, b) => {
        const aValue = a[activeSortKey as keyof PurchaseOrderRow];
        const bValue = b[activeSortKey as keyof PurchaseOrderRow];

        if (activeSortKey === 'reNo' && typeof aValue === 'string' && typeof bValue === 'string') {
          const aNum = parseInt(aValue.replace(/\D/g, ''), 10) || 0;
          const bNum = parseInt(bValue.replace(/\D/g, ''), 10) || 0;
          return activeSortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return activeSortDirection === 'asc'
            ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
            : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
        }
        return activeSortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
          : String(bValue).localeCompare(String(aValue), undefined, { numeric: true, sensitivity: 'base' });
      });
      return sortableItems;
    }
  }, [activeTab, tableData, purchaseOrderData, sortConfig, searchTerm, filters, dateRange]);

  const rowsPerPage = ORDER_RECEIVE_CONSTANTS.TABLE.ROWS_PER_PAGE;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  return {
    currentPage,
    setCurrentPage,
    sortConfig,
    setSortConfig,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    supplierSearchTerm,
    setSupplierSearchTerm,
    dateRange,
    setDateRange,
    handleFilterChange,
    handleSearchChange,
    handleSortRequest,
    uniqueSuppliers,
    sortedData,
    paginatedData,
    rowsPerPage
  };
};
