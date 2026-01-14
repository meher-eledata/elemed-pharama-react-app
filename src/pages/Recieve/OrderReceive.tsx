import React, { useState, useMemo, useEffect, ChangeEvent } from "react";
import { Box, Typography, Snackbar, Alert, TextField, InputAdornment, Select, MenuItem, Autocomplete, IconButton, Tooltip, TableCell, TableRow } from "@mui/material";
import { StandardButton, PharmaDatePicker } from "../../components/Common";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import "./OrderReceive.scss";
import { ReusableTable, TableColumn, FilterOption } from "../../components/PharmaTable";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import CommonModal from "../../components/CommonModal/CommonModal";
import ProductDetailsModalContent from "./ProductDetailsModalContent";
import LastModal from "../../components/Modal/lastOne/LastModal";
import {
  ORDER_RECEIVE_TITLE, ADD_RECEIVE_BUTTON, TAB_RECEIVE_HISTORY,
  ORDER_RECEIVE_TABLE_HEADERS, PURCHASE_ORDER_TABLE_HEADERS,
  ORDER_RECEIVE_MESSAGES, ORDER_RECEIVE_DIALOG, ORDER_RECEIVE_MODAL,
} from "../../config/label/OrderReceive.labels";
import { ADD_BUTTON_COLOR, ORDER_RECEIVE_CONSTANTS } from "../../config/constants/OrderReceive.constants";
import { baseButtonStyle } from "../../config/constants/inventoryConstants";
import { extractErrorMessage, logError } from "../../utils/errorUtils";

import {
  useGetReceiptsQuery, useEditReceiptMutation, useDeleteReceiptMutation,
  useGetCurrentPurchaseOrdersQuery, useGetReceiptLinesQuery,
  Receipt, EditReceiptRequest, PurchaseOrder, getReceiptFileUrl, useGetReceiptFileQuery
} from "../../redux/slices/receiveApi";
import { useGetBatchesForProductMutation } from "../../redux/slices/inventoryApi";

const TickMarkIcon = (props: any) => (
  <svg
    {...(props as any)}
    width="18"
    height="18"
    viewBox="0 0 16 16"
    fill="none"
    style={{
      pointerEvents: "none",
      color: "currentColor",
    }}
  >
    <path
      d="M13.5 4.5L6 12L2.5 8.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const commonStyles = {
  inputField: {
    '& .MuiOutlinedInput-root': {
      height: '2rem', borderRadius: '0.375rem', backgroundColor: '#FFFFFF', // 32px = 2rem, 6px = 0.375rem
      '& fieldset': { borderColor: '#D1D5DB', borderWidth: '0.0625rem' }, // 1px = 0.0625rem
      '&:hover fieldset': { borderColor: '#9CA3AF' },
      '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '0.0625rem' }, // 1px = 0.0625rem
      '& .MuiOutlinedInput-input': { padding: '0.375rem 0.5rem', fontSize: '0.8125rem', color: '#374151' }, // 6px = 0.375rem, 8px = 0.5rem, 13px = 0.8125rem
    },
  },
  numberInput: {
    '& input[type=number]': { MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'textfield' },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }
  },
  searchField: {
    '& .MuiOutlinedInput-root': {
      height: '2.5rem', borderRadius: '0.75rem', backgroundColor: '#fff', // 40px = 2.5rem, 12px = 0.75rem
      boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, // 1px = 0.0625rem
      '&:hover': { boxShadow: 'inset 0 0 0 0.0625rem #AFC3DD' }, // 1px = 0.0625rem
      '&.Mui-focused': { boxShadow: 'inset 0 0 0 0.125rem #9EB6D6' }, // 2px = 0.125rem
    },
  },
  filterButton: {
    minWidth: '10rem', height: '2.5rem', borderRadius: '0.75rem', bgcolor: '#EEF2F7', // 160px = 10rem, 40px = 2.5rem, 12px = 0.75rem
    color: '#1A212B', textTransform: 'none', px: 2, border: '0.0625rem solid #D7DFEA', // 1px = 0.0625rem
    boxShadow: '0 0.125rem 0.5rem rgba(2, 6, 23, 0.08)', '&:hover': { bgcolor: '#E6EBF2' }, fontWeight: 600, // 2px = 0.125rem, 8px = 0.5rem
  }
};

export interface ProductItem {
  productName: string;
  type: string;
  quantity: number;
  hsnCode: string;
  amount: number;
  lineId?: number;
  transaction_number?: string;
  payment_vendor?: string;
  invoice_date?: string;
}

export interface OrderReceiveRow {
  receiptId: number;
  reNo: string;
  poNo: string;
  supplier: string;
  received: string;
  status: string;
  reBy: string;
  amt: number;
  products: ProductItem[];
  transaction_number?: string;
  payment_vendor?: string;
  invoice_date?: string;
  invoice_attachment?: string;
  receipt_file_name?: string; // File name from server upload
  receipt_file_url?: string; // File URL from server upload
  amountPaid?: number; // Amount paid to supplier
  pendingAmount?: number; // Pending amount
  creditAvailable?: number; // Credit available for supplier
}

export interface PurchaseOrderRow {
  receiptId: number;
  poNo: string;
  orderedDate: string;
  supplier: string;
  totalAmount: string;
  status: string;
  createdBy?: string;
}

const OrderReceive: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(2);

  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const { user } = useSelector((state: RootState) => state.auth);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "reNo", direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<{ [key: string]: string | undefined }>({});
  const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ startDate: Dayjs | null; endDate: Dayjs | null }>({
    startDate: null,
    endDate: null
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<OrderReceiveRow | null>(null);
  const [currentReceiptsOverride, setCurrentReceiptsOverride] = useState<OrderReceiveRow[]>([]);
  const [tableData, setTableData] = useState<OrderReceiveRow[]>([]);
  const [purchaseOrderData, setPurchaseOrderData] = useState<PurchaseOrderRow[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderReceiveRow | null>(null);
  const [isLastModalOpen, setIsLastModalOpen] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const { data: receipts, isLoading: loadingReceipts, error: receiptsError, refetch: refetchReceipts } = useGetReceiptsQuery(undefined, {
    skip: activeTab !== 2,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const { data: purchaseOrders, isLoading: loadingPurchaseOrders, error: purchaseOrdersError, refetch: refetchPurchaseOrders } = useGetCurrentPurchaseOrdersQuery(undefined, {
    skip: activeTab !== 1,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [editReceipt, { isLoading: saving }] = useEditReceiptMutation();
  const [deleteReceipt, { isLoading: deleting }] = useDeleteReceiptMutation();

  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const { data: receiptLines, isLoading: loadingReceiptLines, error: receiptLinesError } = useGetReceiptLinesQuery(
    selectedReceiptId !== null ? { receipt_id: selectedReceiptId } : (undefined as any),
    { skip: selectedReceiptId === null }
  );
  const [getBatchesForProduct] = useGetBatchesForProductMutation();
  const [productNameCache, setProductNameCache] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (!receiptLines || receiptLines.length === 0) return;

    const fetchMissingProductNames = async () => {
      const missingNames: { [key: number]: Promise<string> } = {};

      for (const line of receiptLines) {
        if ((!line.product_name || line.product_name === null) && line.product_id && line.product_id > 0) {
          if (!productNameCache[line.product_id]) {
            missingNames[line.product_id] = getBatchesForProduct({ product_id: line.product_id })
              .unwrap()
              .then((result) => result.product.product_name)
              .catch(() => {
                return `Product ID: ${line.product_id}`;
              });
          }
        }
      }

      const results = await Promise.allSettled(
        Object.entries(missingNames).map(async ([productId, promise]) => {
          const name = await promise;
          return { productId: parseInt(productId), name };
        })
      );

      const newCache = { ...productNameCache };
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newCache[result.value.productId] = result.value.name;
        }
      });

      if (Object.keys(newCache).length > Object.keys(productNameCache).length) {
        setProductNameCache(newCache);
      }
    };

    fetchMissingProductNames();
  }, [receiptLines, getBatchesForProduct, productNameCache]);


  const mappedReceipts: OrderReceiveRow[] = useMemo(() => {
    return (receipts || [])
      .filter((receipt) => receipt.receipt_status.toLowerCase() === 'received')
      .map((receipt) => {
        // Use receipt_id as primary ID, fallback to id for backward compatibility
        const receiptId = receipt.receipt_id || receipt.id || 0;

        // Convert po_total_amount from string to number, fallback to total_amount for backward compatibility
        const totalAmount = receipt.po_total_amount
          ? parseFloat(receipt.po_total_amount)
          : (receipt.total_amount || 0);

        // Use total_paid from API response
        const amountPaid = receipt.total_paid || 0;

        // Use amount_left_to_pay from API response
        const pendingAmount = receipt.amount_left_to_pay || 0;

        // Convert supplier_credit_available from string to number
        const creditAvailable = receipt.supplier_credit_available
          ? parseFloat(receipt.supplier_credit_available)
          : 0;

        // Use last_transaction_number and last_payment_vendor from API response
        const transactionNumber = receipt.last_transaction_number || receipt.transaction_number || '';
        const paymentVendor = receipt.last_payment_vendor || receipt.payment_vendor || '';

        // Handle supplier_name (can be null)
        const supplierName = receipt.supplier_name || 'N/A';

        return {
          receiptId: receiptId,
          reNo: `RA${receiptId}`,
          poNo: receipt.po_number || String(receipt.po_id),
          supplier: supplierName,
          received: (receipt as any).invoice_date
            ? dayjs((receipt as any).invoice_date).format('MMM DD, YYYY h:mm A')
            : dayjs(receipt.received_on).format('MMM DD, YYYY h:mm A'),
          status: receipt.receipt_status,
          reBy: receipt.received_by,
          amt: totalAmount,
          products: [],
          transaction_number: transactionNumber,
          payment_vendor: paymentVendor,
          invoice_date: (receipt as any).invoice_date || null,
          invoice_attachment: (receipt as any).invoice_attachment || undefined,
          receipt_file_name: receipt.receipt_file_name || undefined,
          receipt_file_url: receipt.receipt_file_url || undefined,
          amountPaid: amountPaid,
          pendingAmount: pendingAmount,
          creditAvailable: creditAvailable,
        };
      });
  }, [receipts]);


  const mappedPurchaseOrders: PurchaseOrderRow[] = useMemo(() => {
    return (purchaseOrders || [])
      .filter((po) => po.status.toLowerCase() !== 'received')
      .map((po, index) => ({
        receiptId: index + 1000,
        poNo: po.po_number,
        orderedDate: po.ordered_date,
        supplier: po.supplier_name,
        totalAmount: po.total_amount,
        status: po.status,
        createdBy: user ? capitalizeFirstLetter(`${user.first_name} ${user.last_name}`.trim() || user.username) : 'System'
      }));
  }, [purchaseOrders, user]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const handleEditClick = (row: OrderReceiveRow) => {
    let invoiceDateValue = '';
    if (row.invoice_date) {
      try {
        const date = dayjs(row.invoice_date);
        if (date.isValid()) {
          invoiceDateValue = date.format('DD/MM/YYYY');
        } else {
          invoiceDateValue = row.invoice_date;
        }
      } catch (e) {
        invoiceDateValue = row.invoice_date;
      }
    } else if (row.received) {
      try {
        const receivedDate = dayjs(row.received, 'MMM DD, YYYY h:mm A');
        if (receivedDate.isValid()) {
          invoiceDateValue = receivedDate.format('DD/MM/YYYY');
        }
      } catch (e) {
      }
    }

    navigate('/receive/order-details', {
      state: {
        isEditMode: true,
        selectedOrder: row,
        receiptId: row.receiptId,
        receiptNumber: row.reNo,
        transactionNumber: row.transaction_number || '',
        paymentVendor: row.payment_vendor || '',
        invoiceDate: invoiceDateValue
      }
    });
  };

  const buildChanges = (original: OrderReceiveRow, draft: OrderReceiveRow): EditReceiptRequest => {
    // Use receipt_id as primary ID, fallback to id for backward compatibility
    const receiptId = original.receiptId;
    const originalReceipt = receipts?.find(r => {
      const rId = r.receipt_id || r.id || 0;
      return `RA${rId}` === original.reNo;
    });
    if (!originalReceipt) {
      throw new Error("Original receipt not found");
    }

    const parsedPoId = Number(draft.poNo);
    const safePoId = Number.isNaN(parsedPoId) ? originalReceipt.po_id : parsedPoId;

    // Use po_total_amount from API response, fallback to total_amount for backward compatibility
    const originalAmount = originalReceipt.po_total_amount
      ? parseFloat(originalReceipt.po_total_amount)
      : (originalReceipt.total_amount || 0);
    const parsedAmount = Number(draft.amt);
    const safeAmount = Number.isNaN(parsedAmount) ? originalAmount : parsedAmount;

    // Handle supplier_name (can be null)
    const supplierName = originalReceipt.supplier_name || '';

    return {
      receipt_id: receiptId,
      po_id: safePoId,
      supplier_name: supplierName,
      supplier_id: originalReceipt.supplier_id || 0,
      po_number: draft.poNo,
      payment_method: '',
      payment_vendor: '',
      transaction_number: '',
      notes: '',
      created_by: originalReceipt.received_by,
      Deleted: [],
      Edited: [],
      Added: []
    };
  };

  const extractApiErrorMessage = (error: unknown): string => {
    return extractErrorMessage(error, 'Unexpected error occurred');
  };

  const validateInlineEditing = () => {
    if (!editingDraft) {
      return false;
    }

    const isValid = editingDraft.poNo?.trim() &&
      editingDraft.amt && editingDraft.amt > 0;

    return isValid;
  };

  const handleSaveClick = async (row: OrderReceiveRow) => {
    if (!editingDraft) {
      setEditingRowId(null);
      return;
    }

    if (!editingDraft.poNo?.trim()) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Please fill in the PO Number');
      setSnackbarOpen(true);
      return;
    }

    if (!editingDraft.amt || editingDraft.amt <= 0) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Please enter a valid Total Amount');
      setSnackbarOpen(true);
      return;
    }

    try {
      const editRequest = buildChanges(row, editingDraft);
      await editReceipt(editRequest).unwrap();
      await refetchReceipts();
      setCurrentReceiptsOverride([]);
      setSnackbarSeverity('success');
      setSnackbarMessage('Updated successfully');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarSeverity('error');
      setSnackbarMessage(`Update failed: ${extractApiErrorMessage(e)}`);
      setSnackbarOpen(true);
    } finally {
      setEditingRowId(null);
      setEditingDraft(null);
    }
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditingDraft(null);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDeleteId) {
      setIsDeleteDialogOpen(false);
      return;
    }
    const row = tableData.find((r) => r.reNo === rowToDeleteId);
    if (!row) {
      setIsDeleteDialogOpen(false);
      setRowToDeleteId(null);
      return;
    }

    const receiptId = Number(row.reNo.replace('RA', ''));

    try {
      await deleteReceipt({ id: receiptId }).unwrap();
      const newData = tableData.filter((r) => r.reNo !== rowToDeleteId);
      setTableData(newData);
      setCurrentReceiptsOverride((prev) => prev.filter((r) => r.reNo !== rowToDeleteId));
      await refetchReceipts();
      setCurrentReceiptsOverride([]);
      setSnackbarSeverity('success');
      setSnackbarMessage('Deleted successfully');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarSeverity('error');
      setSnackbarMessage(`Delete failed: ${extractApiErrorMessage(e)}`);
      setSnackbarOpen(true);
    } finally {
      setIsDeleteDialogOpen(false);
      setRowToDeleteId(null);
    }
  };

  const handleViewDetailsClick = (row: OrderReceiveRow) => {
    setSelectedProduct(row);
    setSelectedReceiptId(row.receiptId);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateProduct = (updatedProduct: OrderReceiveRow) => {
    setTableData(tableData.map((row) => (row.reNo === updatedProduct.reNo ? updatedProduct : row)));
  };

  const handleDeleteProductFromModal = () => {
    if (selectedProduct) {
      const newData = tableData.filter((row) => row.reNo !== selectedProduct.reNo);
      setTableData(newData);
      setIsDetailsModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const currentReceiptsData = useMemo(() => {
    return currentReceiptsOverride.length > 0 ? currentReceiptsOverride : mappedReceipts;
  }, [currentReceiptsOverride, mappedReceipts]);

  useEffect(() => {
    if (activeTab === 1) {
      setPurchaseOrderData(mappedPurchaseOrders);
    } else if (activeTab === 2) {
      setTableData(currentReceiptsData);
    }
    setFilters({});
  }, [activeTab, currentReceiptsData, mappedPurchaseOrders]);

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value || undefined
      };
      return newFilters;
    });
    setCurrentPage(1);
  };

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(tableData.map(r => r.supplier))).sort();
  }, [tableData]);

  const handleSupplierChange = (event: any, newValue: string | null) => {
    handleFilterChange('supplier', newValue);
    setSupplierSearchTerm(newValue || '');
  };

  const handleSupplierInputChange = (event: any, newInputValue: string) => {
    setSupplierSearchTerm(newInputValue);
    if (uniqueSuppliers.includes(newInputValue)) {
      handleFilterChange('supplier', newInputValue);
    } else if (newInputValue === '') {
      handleFilterChange('supplier', null);
    }
  };

  const handleClearSupplier = () => {
    handleFilterChange('supplier', null);
    setSupplierSearchTerm('');
  };

  const orderReceiveFilterOptions: FilterOption[] = useMemo(() => {
    const suppliers = Array.from(new Set(tableData.map(row => row.supplier)));
    const receivedDates = Array.from(new Set(tableData.map(row => row.received)));

    return [
      {
        key: 'supplier',
        label: 'Supplier',
      },
      {
        key: 'received',
        label: 'Received On',
      }
    ];
  }, [tableData]);

  const sortedData = useMemo(() => {
    if (activeTab === 2) {
      let sortableItems = [...tableData];

      if (filters.supplier) {
        sortableItems = sortableItems.filter(item => item.supplier === filters.supplier);
      }

      if (dateRange.startDate || dateRange.endDate) {
        sortableItems = sortableItems.filter(item => {
          const receivedDate = dayjs(item.received, 'MMM DD, YYYY h:mm A');
          const startDate = dateRange.startDate;
          const endDate = dateRange.endDate;

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
        sortableItems = sortableItems.filter(item =>
          item.reNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.reBy.toLowerCase().includes(searchTerm.toLowerCase())
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

  const totalRows = activeTab === 2 ? tableData.length : purchaseOrderData.length;

  const orderReceiveColumns: TableColumn<OrderReceiveRow>[] = [
    {
      key: "reNo",
      header: ORDER_RECEIVE_TABLE_HEADERS.RECEIPT_NUMBER,
      render: (row) => (
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.125rem', // 2px = 0.125rem
          minHeight: '1.5rem', // 24px = 1.5rem
          width: '100%',
          position: 'relative'
        }}>
          <VisibilityIcon
            sx={{
              fontSize: ORDER_RECEIVE_CONSTANTS.ICONS.RECEIPT_VIEW_SIZE,
              color: ORDER_RECEIVE_CONSTANTS.ICONS.MUTED_COLOR,
              cursor: 'pointer',
              padding: '0.125rem', // 2px = 0.125rem
              borderRadius: '0.25rem', // 4px = 0.25rem
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: ORDER_RECEIVE_CONSTANTS.ICONS.MUTED_COLOR
              }
            }}
            onClick={() => handleViewDetailsClick(row)}
          />
          <span style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {row.reNo}
          </span>
        </Box>
      )
    },
    {
      key: "poNo",
      header: ORDER_RECEIVE_TABLE_HEADERS.PO_NUMBER,
      render: (row) => (
        editingRowId === row.reNo ? (
          <input
            type="text"
            value={editingDraft?.poNo ?? ''}
            onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, poNo: e.target.value } : prev))}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        ) : (
          <span>{row.poNo}</span>
        )
      )
    },
    {
      key: "supplier",
      header: ORDER_RECEIVE_TABLE_HEADERS.SUPPLIER_NAME,
      render: (row) => (
        <span>{row.supplier}</span>
      )
    },
    {
      key: "received",
      header: ORDER_RECEIVE_TABLE_HEADERS.RECEIVED_ON,
      render: (row) => (
        editingRowId === row.reNo ? (
          <input
            type="text"
            value={editingDraft?.received ?? ''}
            onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, received: e.target.value } : prev))}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        ) : (
          <span>{row.received}</span>
        )
      )
    },
    {
      key: "reBy",
      header: ORDER_RECEIVE_TABLE_HEADERS.CREATED_BY,
      render: (row) => (
        editingRowId === row.reNo ? (
          <input
            type="text"
            value={editingDraft?.reBy ?? ''}
            onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, reBy: e.target.value } : prev))}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        ) : (
          <span>{capitalizeFirstLetter(row.reBy)}</span>
        )
      )
    },
    {
      key: "amt",
      header: ORDER_RECEIVE_TABLE_HEADERS.TOTAL_AMOUNT,
      render: (row) => (
        editingRowId === row.reNo ? (
          <input
            type="number"
            value={editingDraft?.amt ?? 0}
            onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, amt: Number(e.target.value) } : prev))}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        ) : (
          <span>{row.amt}</span>
        )
      )
    },
    {
      key: "amountPaid",
      header: ORDER_RECEIVE_TABLE_HEADERS.AMOUNT_PAID,
      sortable: true,
      render: (row) => (
        // TODO: Backend not ready - will show actual data when API provides amount_paid field
        <span>{row.amountPaid !== undefined && row.amountPaid > 0 ? row.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
      )
    },
    {
      key: "pendingAmount",
      header: ORDER_RECEIVE_TABLE_HEADERS.PENDING_AMOUNT,
      sortable: true,
      render: (row) => (
        // TODO: Backend not ready - will show actual data when API provides pending_amount field
        <span>{row.pendingAmount !== undefined && row.pendingAmount > 0 ? row.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
      )
    },
    {
      key: "creditAvailable",
      header: "Credit available for supplier (₹)",
      headerRender: () => (
        <Tooltip title="Credit available for the supplier" arrow placement="top">
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            lineHeight: 1.2,
            cursor: 'help',
            whiteSpace: 'pre-line'
          }}>
            <span>Credit available</span>
            <span>for supplier (₹)</span>
          </Box>
        </Tooltip>
      ),
      sortable: true,
      render: (row) => (
        // TODO: Backend not ready - will show actual data when API provides credit_available field
        <span>{row.creditAvailable !== undefined && row.creditAvailable > 0 ? row.creditAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
      )
    },
    {
      key: "invoice_attachment",
      header: ORDER_RECEIVE_TABLE_HEADERS.INVOICE_ATTACHMENT,
      headerRender: () => (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          lineHeight: 1.2
        }}>
          <span>Invoice</span>
          <span>Attachment</span>
        </Box>
      ),
      render: (row) => {
        // Determine the file URL
        let fileUrl: string | null = null;
        let isBase64 = false;
        let isImage = false;
        let fileName: string | undefined = undefined;

        // Check for receipt_file_name to determine file type
        if (row.receipt_file_name) {
          fileName = row.receipt_file_name.toLowerCase();
          // Check if file is an image based on extension
          isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
        }

        if (row.invoice_attachment) {
          // Check if it's a base64 data URL (starts with data:)
          isBase64 = row.invoice_attachment.startsWith('data:');
          if (isBase64) {
            // Legacy: base64 data URL (old format)
            fileUrl = row.invoice_attachment;
            isImage = row.invoice_attachment.startsWith('data:image/');
          } else {
            // If it's not base64, it might be a URL - use it as-is
            fileUrl = row.invoice_attachment;
            // Check if it's an image URL
            if (!isImage) {
              isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileUrl);
            }
          }
        }

        // If no attachment URL from database, try to use receipt_file_url or construct from receiptId
        // Only try to get file if we have evidence that a file exists (receipt_file_name or receipt_file_url)
        if (!fileUrl && row.receiptId) {
          // Check if we have file metadata from backend
          if (row.receipt_file_name || row.receipt_file_url) {
            // Always use the /receive/{receipt_id}/file endpoint to fetch files
            // The backend serves files through this endpoint, not directly from the file path
            fileUrl = getReceiptFileUrl(row.receiptId);
            // If we have a file name, check if it's an image
            if (!isImage && fileName) {
              isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
            }
          }
          // If no receipt_file_name or receipt_file_url, don't try to construct URL
          // This means no file has been uploaded for this receipt
        }

        // If still no file URL, show "No attachment"
        // Also check explicitly if file fields are null to avoid trying to fetch non-existent files
        if (!fileUrl || (!row.receipt_file_name && !row.receipt_file_url && !row.invoice_attachment)) {
          return <span style={{ color: '#9CA3AF' }}>No attachment</span>;
        }

        if (isImage) {
          // For images (base64 or server-stored), show a clickable thumbnail that opens in a new tab
          return (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                // Prevent navigation if file doesn't exist
                if (!row.receipt_file_name && !row.receipt_file_url && !row.invoice_attachment) {
                  e.preventDefault();
                }
              }}
            >
              <img
                src={fileUrl}
                alt="Invoice Receipt"
                style={{
                  maxWidth: '6.25rem', // 100px = 6.25rem
                  maxHeight: '3.75rem', // 60px = 3.75rem
                  objectFit: 'contain',
                  border: '0.0625rem solid #D1D5DB', // 1px = 0.0625rem
                  borderRadius: '0.25rem', // 4px = 0.25rem
                  padding: '0.125rem', // 2px = 0.125rem
                  backgroundColor: '#F9FAFB'
                }}
                onError={(e) => {
                  // If image fails to load, replace with "No attachment" message
                  const target = e.target as HTMLImageElement;
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span style="color: #9CA3AF;">No attachment</span>';
                  }
                }}
              />
            </a>
          );
        } else {
          // For other file types (PDF, DOC, etc.) or new file URLs, show as clickable link
          return (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3B82F6',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                // Prevent navigation if file doesn't exist
                if (!row.receipt_file_name && !row.receipt_file_url && !row.invoice_attachment) {
                  e.preventDefault();
                }
              }}
            >
              {fileName ? `View ${fileName}` : 'View Attachment'}
            </a>
          );
        }
      }
    },
    {
      key: "actions",
      header: ORDER_RECEIVE_TABLE_HEADERS.ACTIONS,
      sortable: false,
      columnWidth: "12%",
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}> {/* 12px = 0.75rem */}
          {editingRowId === row.reNo ? (
            <Box sx={{ display: 'flex', gap: '0.75rem' }}> {/* 12px = 0.75rem */}
              <Box
                onClick={() => validateInlineEditing() ? handleSaveClick(row) : null}
                sx={{
                  cursor: validateInlineEditing() ? 'pointer' : 'not-allowed',
                  color: validateInlineEditing() ? ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR : '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: validateInlineEditing() ? 1 : 0.5
                }}
              >
                <TickMarkIcon />
              </Box>
              <CloseIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleCancelClick()}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '60px' }}> {/* 8px = 0.5rem */}
              <EditIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}
                onClick={() => handleEditClick(row)}
              />
              <Typography
                onClick={() => handlePaymentDetailsClick(row)}
                sx={{
                  color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR,
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    opacity: 0.7
                  }
                }}
              >
                ₹
              </Typography>
            </Box>
          )}
        </Box>
      )
    }
  ];

  const handlePurchaseOrderClick = (row: PurchaseOrderRow) => {
    navigate('/receive/order-details', {
      state: {
        selectedSupplier: row.supplier,
        selectedPO: row.poNo,
        selectedOrder: row
      }
    });
  };

  const handlePaymentDetailsClick = (row: OrderReceiveRow) => {
    navigate('/receive/payment-details', {
      state: {
        supplierName: row.supplier,
        poNumber: row.poNo,
        invoiceDate: row.invoice_date || "",
        receiptId: row.receiptId,
        receiptNumber: row.reNo,
        isEditMode: true,
        transactionNumber: row.transaction_number || "",
        paymentVendor: row.payment_vendor || "",
        pharmaTableData: [], // Can be populated from receipt lines if needed
      }
    });
  };

  const purchaseOrderColumns: TableColumn<PurchaseOrderRow>[] = [
    {
      key: "reNo",
      header: PURCHASE_ORDER_TABLE_HEADERS.RECEIPT_NUMBER,
      render: (row) => <span>RA{row.receiptId}</span>
    },
    {
      key: "poNo",
      header: PURCHASE_ORDER_TABLE_HEADERS.PO_NUMBER,
      render: (row) => (
        <span
          style={{ cursor: 'pointer' }}
          onClick={() => handlePurchaseOrderClick(row)}
        >
          {row.poNo}
        </span>
      )
    },
    {
      key: "orderedDate",
      header: PURCHASE_ORDER_TABLE_HEADERS.ORDERED_DATE,
      render: (row) => <span>{row.orderedDate}</span>
    },
    {
      key: "supplier",
      header: PURCHASE_ORDER_TABLE_HEADERS.SUPPLIER_NAME,
      render: (row) => <span>{row.supplier}</span>
    },
    {
      key: "totalAmount",
      header: PURCHASE_ORDER_TABLE_HEADERS.TOTAL_AMOUNT,
      render: (row) => <span>{row.totalAmount}</span>
    },
    {
      key: "status",
      header: PURCHASE_ORDER_TABLE_HEADERS.STATUS,
      render: (row) => <span>{row.status}</span>
    },
    {
      key: "createdBy",
      header: PURCHASE_ORDER_TABLE_HEADERS.CREATED_BY,
      render: (row) => <span>{capitalizeFirstLetter(row.createdBy || 'System')}</span>
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchTerm("");
    setFilters({});
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

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleShowFiltersToggle = () => {
    setShowFilters(prev => !prev);
  };

  const currentFilterForTable = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value || null]));
  }, [filters]);

  return (
    <Box className="order-receive">
      <Box className="header">
        <Typography variant="h5" className="title">
          {ORDER_RECEIVE_TITLE}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <StandardButton
            startIcon={<AddIcon />}
            onClick={() => navigate('/receive/order-details')}
            variant="primary"
            size="large"
          >
            {ADD_RECEIVE_BUTTON}
          </StandardButton>
        </Box>
      </Box>

      <Box className="tab-content">
        {loadingReceipts && activeTab === 2 ? (
          <Typography variant="body2">{ORDER_RECEIVE_MESSAGES.LOADING_RECEIPTS}</Typography>
        ) : loadingPurchaseOrders && activeTab === 1 ? (
          <Typography variant="body2">{ORDER_RECEIVE_MESSAGES.LOADING_ORDERS}</Typography>
        ) : receiptsError && activeTab === 2 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {ORDER_RECEIVE_MESSAGES.LOAD_RECEIPTS_FAILED}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              {extractApiErrorMessage(receiptsError)}
            </Typography>
            <StandardButton size="small" onClick={() => refetchReceipts()} variant="outline">
              Retry
            </StandardButton>
          </Box>
        ) : purchaseOrdersError && activeTab === 1 ? (
          <Box>
            <Typography variant="body2" color="error">{ORDER_RECEIVE_MESSAGES.LOAD_ORDERS_FAILED}</Typography>
            <StandardButton size="small" onClick={() => refetchPurchaseOrders()} variant="outline">Retry</StandardButton>
          </Box>
        ) : (
          <>
            {activeTab === 2 && (
              <>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    bgcolor: '#F6F8FB', borderRadius: '1.5625rem', border: '0.0625rem solid #E6ECF5', p: '0.75rem', // 25px = 1.5625rem, 1px = 0.0625rem, 12px = 0.75rem
                    gap: { xs: 2, sm: 4, md: 8 }, // Remove fixed large gap that was causing overflow 
                    mb: 2, mt: 2,
                    flexWrap: { xs: 'wrap', lg: 'nowrap' },
                  }}
                >
                  <TextField
                    placeholder="Search by Receipt Number, Supplier, or Received By"
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e)}
                    InputProps={{
                      startAdornment: !searchTerm.trim() ? (
                        <InputAdornment position="start" sx={{ marginRight: '0.25rem' }}> {/* 4px = 0.25rem */}
                          <SearchIcon sx={{ color: '#8A99AF', fontSize: '1.5rem' }} /> {/* 24px = 1.5rem */}
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={{
                      height: '2.5rem', // 40px = 2.5rem
                      borderRadius: '0.75rem', // 12px = 0.75rem
                      backgroundColor: '#fff',
                      boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6', // 1px = 0.0625rem
                      flex: 1,
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '&:hover': { boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6' }, // 1px = 0.0625rem
                      '&.Mui-focused': { boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6' }, // 1px = 0.0625rem
                      '& .MuiOutlinedInput-input': {
                        padding: '0.625rem 0.875rem', // 10px = 0.625rem, 14px = 0.875rem
                        paddingLeft: '0.5rem', // 8px = 0.5rem
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        fontSize: '1rem', // 16px = 1rem
                        opacity: 1,
                        color: '#9CA3AF',
                      },
                    }}
                  />
                  <StandardButton
                    startIcon={
                      showFilters
                        ? <FilterListOffIcon sx={{ color: '#1A212B', fontSize: 18 }} />
                        : <FilterAltIcon sx={{ color: '#1A212B', fontSize: 18 }} />
                    }
                    onClick={handleShowFiltersToggle}
                    variant="secondary"
                    size="medium"
                    sx={{
                      minWidth: '10rem', // 160px = 10rem
                      bgcolor: '#EEF2F7',
                      color: '#1A212B',
                      px: 2,
                      border: '0.0625rem solid #D7DFEA', // 1px = 0.0625rem
                      boxShadow: '0 0.125rem 0.5rem rgba(2, 6, 23, 0.08)', // 2px = 0.125rem, 8px = 0.5rem
                      '&:hover': { bgcolor: '#E6EBF2' },
                      fontWeight: 600,
                    }}
                  >
                    {showFilters ? 'Hide filters' : 'Show filters'}
                  </StandardButton>
                </Box>
                {showFilters && (
                  <Box sx={{ display: 'flex', gap: 4, mb: 2, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#728197' }}>Supplier Name</Typography> {/* 12px = 0.75rem */}
                        <Autocomplete
                          value={filters.supplier}
                          onChange={handleSupplierChange}
                          onInputChange={handleSupplierInputChange}
                          inputValue={supplierSearchTerm}
                          options={uniqueSuppliers}
                          freeSolo
                          forcePopupIcon
                          disableClearable={!filters.supplier}
                          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '1.5rem' }} />}
                          componentsProps={{
                            popper: {
                              sx: {
                                '& .MuiAutocomplete-listbox': {
                                  '& .MuiAutocomplete-option': {
                                    '&:hover': {
                                      backgroundColor: '#5C17E5',
                                      color: '#ffffff',
                                    }
                                  }
                                }
                              }
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Search supplier..."
                              sx={{
                                width: '15rem', // 240px = 15rem
                                height: '2.5rem', // 40px = 2.5rem
                                borderRadius: '0.75rem', // 12px = 0.75rem
                                backgroundColor: '#ffffff',
                                '& .MuiOutlinedInput-root': {
                                  height: '2.5rem', // 40px = 2.5rem
                                  borderRadius: '0.75rem', // 12px = 0.75rem
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: '1px solid #D1D5DB',
                                  },
                                  '&:hover': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: '1px solid #D1D5DB',
                                    },
                                  },
                                  '&.Mui-focused': {
                                    outline: 'none',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: '1px solid #D1D5DB',
                                    },
                                  },
                                },
                                '& .MuiInputBase-input': {
                                  color: '#1A212B',
                                  fontWeight: 500,
                                  cursor: 'text',
                                },
                                '& .MuiAutocomplete-endAdornment': {
                                  right: '0.5rem', // 8px = 0.5rem
                                },
                              }}
                              InputProps={{
                                ...params.InputProps,
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props}>
                              {option}
                            </Box>
                          )}
                          ListboxProps={{
                            sx: {
                              borderRadius: '0.75rem', // 12px = 0.75rem
                              boxShadow: '0 0.25rem 1.25rem rgba(0, 0, 0, 0.15)', // 4px = 0.25rem, 20px = 1.25rem
                              border: '1px solid #E6ECF5',
                              '& .MuiAutocomplete-option': {
                                '&:hover': {
                                  backgroundColor: '#5C17E5',
                                  color: '#ffffff',
                                  '&:hover': {
                                    backgroundColor: '#4A14C7',
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#728197' }}>Received On</Typography> {/* 12px = 0.75rem */}
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          <PharmaDatePicker
                            value={dateRange.startDate}
                            onChange={(newValue) => setDateRange({ ...dateRange, startDate: newValue })}
                            width={270}
                            height={40}
                          />
                          <PharmaDatePicker
                            value={dateRange.endDate}
                            onChange={(newValue) => setDateRange({ ...dateRange, endDate: newValue })}
                            width={270}
                            height={40}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pt: '1.75rem' }}> {/* 28px = 1.75rem */}
                      <StandardButton
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({});
                          setSupplierSearchTerm('');
                          setDateRange({ startDate: null, endDate: null });
                        }}
                        variant="secondary"
                        size="medium"
                        sx={{
                          minWidth: '10rem', // 160px = 10rem
                          height: '2.5rem', // 40px = 2.5rem
                          backgroundColor: '#F5F5F5',
                          border: '1px solid #D1D5DB',
                          color: '#1A212B',
                          fontWeight: 500,
                          marginRight: '0.625rem', // 10px = 0.625rem
                          '&:hover': {
                            backgroundColor: '#E0E0E0',
                            border: '1px solid #D1D5DB',
                          }
                        }}
                      >
                        Reset filters
                      </StandardButton>
                    </Box>
                  </Box>
                )}
              </>
            )}
            {activeTab === 1 ? (
              <ReusableTable<PurchaseOrderRow>
                columns={purchaseOrderColumns}
                data={sortedData as PurchaseOrderRow[]}
                emptyMessage={ORDER_RECEIVE_MESSAGES.EMPTY_ORDERS}
                searchAndFilterConfig={{ filterOptions: [] }}
                currentSearchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                showFilters={false}
                onShowFiltersToggle={() => { }}
                currentFilterKey={""}
                onFilterSelect={(key, value) => handleFilterChange(key, value)}
                totalRows={sortedData.length}
                rowsPerPage={rowsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
              />
            ) : (
              <>
                <ReusableTable<OrderReceiveRow>
                  columns={orderReceiveColumns}
                  data={sortedData as OrderReceiveRow[]}
                  emptyMessage={ORDER_RECEIVE_MESSAGES.EMPTY_RECEIPTS}
                  searchAndFilterConfig={{ filterOptions: [] }}
                  currentSearchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  showFilters={false}
                  onShowFiltersToggle={() => { }}
                  onFilterSelect={(key, value) => handleFilterChange(key, value)}
                  totalRows={sortedData.length}
                  rowsPerPage={rowsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onSortRequest={handleSortRequest}
                  sortConfig={sortConfig}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  currentFilter={currentFilterForTable}
                  disableFooterWrapper={true}
                  footerContent={sortedData.length > 0 && activeTab === 2 && currentPage === 1 ? (() => {
                    const orderReceiveData = sortedData as OrderReceiveRow[];
                    const totalAmount = orderReceiveData.reduce((sum, row) => sum + (row.amt || 0), 0);
                    const totalAmountPaid = orderReceiveData.reduce((sum, row) => sum + (row.amountPaid || 0), 0);
                    const totalPendingAmount = orderReceiveData.reduce((sum, row) => sum + (row.pendingAmount || 0), 0);
                    const totalCreditAvailable = orderReceiveData.reduce((sum, row) => sum + (row.creditAvailable || 0), 0);

                    return (
                      <TableRow
                        sx={{
                          backgroundColor: '#F9FAFB',
                        }}
                      >
                        {/* Column 1: Total label */}
                        <TableCell
                          sx={{
                            padding: '12px 16px',
                            fontFamily: "'Lexend', sans-serif",
                            fontWeight: 600,
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#374151',
                          }}
                        >
                          Total:
                        </TableCell>

                        {/* Columns 2-5: Empty (PO, Supplier, Received, Created By) */}
                        <TableCell sx={{ padding: '12px 16px' }} />
                        <TableCell sx={{ padding: '12px 16px' }} />
                        <TableCell sx={{ padding: '12px 16px' }} />
                        <TableCell sx={{ padding: '12px 16px' }} />

                        {/* Column 6: Total Amount value (under Total amount column) */}
                        <TableCell
                          sx={{
                            padding: '12px 12px',
                            textAlign: 'left',
                            fontFamily: "'Lexend', sans-serif",
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#1A212B',
                          }}
                        >
                          ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Column 7: Amount Paid (under Amount paid column) */}
                        <TableCell
                          sx={{
                            padding: '12px 12px',
                            textAlign: 'left',
                            fontFamily: "'Lexend', sans-serif",
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#1A212B',
                          }}
                        >
                          ₹{totalAmountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Column 8: Pending Amount (under Pending amount column) */}
                        <TableCell
                          sx={{
                            padding: '12px 12px',
                            textAlign: 'left',
                            fontFamily: "'Lexend', sans-serif",
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#1A212B',
                          }}
                        >
                          ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Column 9: Credit Available (under Credit available column) */}
                        <TableCell
                          sx={{
                            padding: '12px 12px',
                            textAlign: 'left',
                            fontFamily: "'Lexend', sans-serif",
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#1A212B',
                          }}
                        >
                          ₹{totalCreditAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Columns 10-11: Empty (Invoice Attachment, Actions) */}
                        <TableCell sx={{ padding: '12px 16px' }} />
                        <TableCell sx={{ padding: '12px 16px' }} />
                      </TableRow>
                    );
                  })() : undefined}
                />
              </>
            )}
          </>
        )}
      </Box>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={ORDER_RECEIVE_DIALOG.DELETE_TITLE}
        message={ORDER_RECEIVE_DIALOG.DELETE_MESSAGE}
        itemName={rowToDeleteId ? tableData.find((r) => r.reNo === rowToDeleteId)?.reNo : undefined}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={ORDER_RECEIVE_CONSTANTS.SNACKBAR.AUTOHIDE_MS}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={ORDER_RECEIVE_CONSTANTS.SNACKBAR.ANCHOR}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <CommonModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={ORDER_RECEIVE_MODAL.DETAILS_TITLE}
        maxWidth="56.25rem" // 900px = 56.25rem
        content={
          <ProductDetailsModalContent
            productData={
              selectedProduct
                ? {
                  ...selectedProduct,
                  products: (receiptLines || []).map((line) => {
                    const productName = line.product_name ||
                      (line.product_id && line.product_id > 0 ? productNameCache[line.product_id] : null) ||
                      (line.product_id && line.product_id > 0 ? `Product ID: ${line.product_id}` : 'Unknown Product');

                    return {
                      lineId: line.receipt_line_id,
                      productName: productName,
                      type: 'Medicine',
                      quantity: line.received_qty,
                      hsnCode: line.hsn_id || line.hsn_code || 'N/A',
                      amount: parseFloat(line.unit_price) || 0,
                      transaction_number: line.transaction_number || '',
                      payment_vendor: line.payment_vendor || '',
                      invoice_date: '',
                    };
                  }) as ProductItem[],
                }
                : null
            }
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProductFromModal}
          />
        }
      />
    </Box>
  );
};

export default OrderReceive;