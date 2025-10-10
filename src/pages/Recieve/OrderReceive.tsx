import React, { useState, useMemo, useEffect, ChangeEvent } from "react";
import { Box, Button, Typography, Snackbar, Alert, TextField, InputAdornment, Select, MenuItem } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import "./OrderReceive.scss";
import { ReusableTable, TableColumn, FilterOption } from "../../components/PharmaTable";
import ReceiveSupplierModal from "../../components/Modal/ReceiveSupplier/ReceiveSupplierModal";
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

import {
  useGetReceiptsQuery, useEditReceiptMutation, useDeleteReceiptMutation,
  useGetCurrentPurchaseOrdersQuery, useGetReceiptLinesQuery,
  Receipt, EditReceiptRequest, PurchaseOrder
} from "../../redux/slices/receiveApi";

// Shared styles
const commonStyles = {
  inputField: {
    '& .MuiOutlinedInput-root': {
      height: '32px', borderRadius: '6px', backgroundColor: '#FFFFFF',
      '& fieldset': { borderColor: '#D1D5DB', borderWidth: '1px' },
      '&:hover fieldset': { borderColor: '#9CA3AF' },
      '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '1px' },
    },
    '& .MuiOutlinedInput-input': { padding: '6px 8px', fontSize: '13px', color: '#374151' },
  },
  numberInput: {
    '& input[type=number]': { MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'textfield' },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }
  },
  searchField: {
    '& .MuiOutlinedInput-root': {
      height: '40px', borderRadius: '12px', backgroundColor: '#fff',
      boxShadow: 'inset 0 0 0 1px #BFD1E6', '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
      '&:hover': { boxShadow: 'inset 0 0 0 1px #AFC3DD' },
      '&.Mui-focused': { boxShadow: 'inset 0 0 0 2px #9EB6D6' },
    }
  },
  filterButton: {
    minWidth: 160, height: 40, borderRadius: '12px', bgcolor: '#EEF2F7',
    color: '#1A212B', textTransform: 'none', px: 2, border: '1px solid #D7DFEA',
    boxShadow: '0 2px 8px rgba(2, 6, 23, 0.08)', '&:hover': { bgcolor: '#E6EBF2' }, fontWeight: 600,
  }
};

export interface ProductItem {
  productName: string;
  type: string;
  quantity: number;
  hsnCode: string;
  amount: number;
  lineId?: number;
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
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(2);
  
  // Get logged-in user data from Redux store
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "", direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<{ [key: string]: string | null }>({});
  const [dateRange, setDateRange] = useState<{ startDate: Dayjs | null; endDate: Dayjs | null }>({
    startDate: null,
    endDate: null
  });
  
  // ADD THIS LINE: State to manage filter visibility
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<OrderReceiveRow | null>(null);
  const [currentReceiptsOverride, setCurrentReceiptsOverride] = useState<OrderReceiveRow[]>([]);
  const [tableData, setTableData] = useState<OrderReceiveRow[]>([]);
  const [purchaseOrderData, setPurchaseOrderData] = useState<PurchaseOrderRow[]>([]);
  const [supplier, setSupplier] = useState("");
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

  const mappedReceipts: OrderReceiveRow[] = useMemo(() => {
    return (receipts || [])
      .filter((receipt) => receipt.receipt_status.toLowerCase() === 'received')
      .map((receipt, idx) => ({
        receiptId: receipt.id,
        reNo: `RA${receipt.id}`,
        poNo: String(receipt.po_id),
        supplier: receipt.supplier_name,
        received: receipt.received_on,
        status: receipt.receipt_status,
        reBy: receipt.received_by,
        amt: receipt.total_amount,
        products: []
      }));
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
        createdBy: user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'System'
      }));
  }, [purchaseOrders, user]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  const handleEditClick = (row: OrderReceiveRow) => {
    // Navigate to Order Details page with the selected order data
    navigate('/receive/order-details', {
      state: {
        isEditMode: true,
        selectedOrder: row,
        receiptId: row.receiptId,
        receiptNumber: row.reNo
      }
    });
  };
  
  const buildChanges = (original: OrderReceiveRow, draft: OrderReceiveRow): EditReceiptRequest => {
    const originalReceipt = receipts?.find(r => `RA${r.id}` === original.reNo);
    if (!originalReceipt) {
      throw new Error("Original receipt not found");
    }

    const parsedPoId = Number(draft.poNo);
    const safePoId = Number.isNaN(parsedPoId) ? originalReceipt.po_id : parsedPoId;

    const parsedAmount = Number(draft.amt);
    const safeAmount = Number.isNaN(parsedAmount) ? originalReceipt.total_amount : parsedAmount;

    return {
      id: originalReceipt.id,
      po_id: safePoId,
      received_on: draft.received,
      received_by: draft.reBy,
      receipt_status: draft.status,
      total_amount: safeAmount
    };
  };

  const extractApiErrorMessage = (error: any): string => {
    try {
      if (error?.data) {
        if (typeof error.data === 'string') return error.data;
        if (typeof error.data?.message === 'string') return error.data.message;
        if (Array.isArray(error.data?.errors) && error.data.errors.length > 0) {
          const first = error.data.errors[0];
          if (typeof first === 'string') return first;
          if (typeof first?.message === 'string') return first.message;
        }
      }
      if (typeof error?.error === 'string') return error.error;
      if (typeof error?.message === 'string') return error.message;
    } catch (_) {
    }
    return 'Unexpected error occurred';
  };

  const handleSaveClick = async (row: OrderReceiveRow) => {
    if (!editingDraft) {
      setEditingRowId(null);
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
      console.error("Save failed", e);
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
      console.error("Delete failed", e);
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
    setFilters(prev => ({
        ...prev,
        [key]: value
    }));
    setCurrentPage(1);
  };

  const orderReceiveFilterOptions: FilterOption[] = useMemo(() => {
    const suppliers = Array.from(new Set(tableData.map(row => row.supplier)));
    const receivedDates = Array.from(new Set(tableData.map(row => row.received)));

    return [
      {
        key: 'supplier',
        label: 'Supplier',
        // Update this to match your component's needs. Example below:
        // options: suppliers.map(s => ({ key: s, label: s })) 
      },
      {
        key: 'received',
        label: 'Received On',
        // options: receivedDates.map(d => ({ key: d, label: d }))
      }
    ];
  }, [tableData]);

  const sortedData = useMemo(() => {
    if (activeTab === 2) {
      let sortableItems = [...tableData];

      if (filters.supplier) {
        sortableItems = sortableItems.filter(item => item.supplier === filters.supplier);
      }
      
      // Date range filtering for received on
      if (dateRange.startDate || dateRange.endDate) {
        sortableItems = sortableItems.filter(item => {
          const receivedDate = dayjs(item.received);
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
          item.reNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (sortConfig.key) {
        sortableItems.sort((a, b) => {
          const aValue = a[sortConfig.key as keyof OrderReceiveRow];
          const bValue = b[sortConfig.key as keyof OrderReceiveRow];

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
          return 0;
        });
      }
      return sortableItems;
    } else {
      let sortableItems = [...purchaseOrderData];

      if (searchTerm.trim()) {
        sortableItems = sortableItems.filter(item =>
          item.poNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (sortConfig.key) {
        sortableItems.sort((a, b) => {
          const aValue = a[sortConfig.key as keyof PurchaseOrderRow];
          const bValue = b[sortConfig.key as keyof PurchaseOrderRow];

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          }
          return 0;
        });
      }
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
          <span style={{ minWidth: 'fit-content' }}>{row.reNo}</span>
          <VisibilityIcon
            sx={{ 
              fontSize: ORDER_RECEIVE_CONSTANTS.ICONS.RECEIPT_VIEW_SIZE, 
              color: ORDER_RECEIVE_CONSTANTS.ICONS.MUTED_COLOR, 
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: ORDER_RECEIVE_CONSTANTS.ICONS.MUTED_COLOR
              }
            }}
            onClick={() => handleViewDetailsClick(row)}
          />
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
    // {
    //   key: "status",
    //   header: ORDER_RECEIVE_TABLE_HEADERS.RECEIVED_STATUS,
    //   sortable: false,
    //   render: (row) => (
    //     editingRowId === row.reNo ? (
    //       <input
    //         type="text"
    //         value={editingDraft?.status ?? ''}
    //         onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, status: e.target.value } : prev))}
    //         style={{ width: '100%', boxSizing: 'border-box' }}
    //       />
    //     ) : (
    //       <span>{row.status}</span>
    //     )
    //   )
    // },
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
          <span>{row.reBy}</span>
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
      key: "actions",
      header: ORDER_RECEIVE_TABLE_HEADERS.ACTIONS,
      sortable: false,
      columnWidth: "10%",
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {editingRowId === row.reNo ? (
            <Box sx={{ display: 'flex', gap: '12px' }}>
              <CheckIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleSaveClick(row)}
              />
              <CloseIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleCancelClick()}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: '18px' }}>
              <EditIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer', fontSize: 18 }}
                onClick={() => handleEditClick(row)}
              />
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
      render: (row) => <span>{row.createdBy || 'System'}</span>
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
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  // ADD THIS FUNCTION: The handler for toggling filter visibility
  const handleShowFiltersToggle = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <Box className="order-receive">
      <Box className="header">
        <Typography variant="h5" className="title">
          {ORDER_RECEIVE_TITLE}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            
            startIcon={<AddIcon />}
            className="add-btn"
            disableRipple
            sx={{
              backgroundColor: ADD_BUTTON_COLOR,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#5C17E5", boxShadow: "none" },
              "&:focus": { backgroundColor: "#5C17E5" },
              "&:active": { backgroundColor: "#5C17E5" },
              "& .MuiButton-startIcon": {
                "& > *:nth-of-type(1)": {
                  fontSize: "24px",
                },
              },
            }}
            onClick={() => navigate('/receive/order-details')}
          >
            {ADD_RECEIVE_BUTTON}
          </Button>
        </Box>
      </Box>

      {/* <Box
        className="inventory-tabs"
        sx={{ mb: '24px', display: 'inline-flex', bgcolor: '#eef4ff', borderRadius: '16px', p: '6px', gap: '8px' }}
      >
        <Button
          onClick={() => handleTabChange({} as any, 2)}
          sx={{
            ...baseButtonStyle,
            width: '8.5rem',
            height: '2.35rem',
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            border: '1px solid transparent',
            boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
            '&:hover': {
              outline: 'none',
              backgroundColor: '#1976d2',
              color: '#000000',
              boxShadow: '0 6px 16px rgba(21, 101, 192, 0.35)'
            }
          }}
        >
          {TAB_RECEIVE_HISTORY}
        </Button>
      </Box> */}


      <Box className="tab-content">
        {loadingReceipts && activeTab === 2 ? (
          <Typography variant="body2">{ORDER_RECEIVE_MESSAGES.LOADING_RECEIPTS}</Typography>
        ) : loadingPurchaseOrders && activeTab === 1 ? (
          <Typography variant="body2">{ORDER_RECEIVE_MESSAGES.LOADING_ORDERS}</Typography>
        ) : receiptsError && activeTab === 2 ? (
          <Box>
            <Typography variant="body2" color="error">{ORDER_RECEIVE_MESSAGES.LOAD_RECEIPTS_FAILED}</Typography>
            <Button size="small" onClick={() => refetchReceipts()}>Retry</Button>
          </Box>
        ) : purchaseOrdersError && activeTab === 1 ? (
          <Box>
            <Typography variant="body2" color="error">{ORDER_RECEIVE_MESSAGES.LOAD_ORDERS_FAILED}</Typography>
            <Button size="small" onClick={() => refetchPurchaseOrders()}>Retry</Button>
          </Box>
        ) : (
          <>
            {activeTab === 2 && (
              <>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    bgcolor: '#F6F8FB', borderRadius: '16px', border: '1px solid #E6ECF5', p: '12px', gap: '540px', mb: 2, mt: 2,
                  }}
                >
                  <TextField
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#8A99AF', fontSize: '18px' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: '#fff',
                        boxShadow: 'inset 0 0 0 1px #BFD1E6',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&:hover': { boxShadow: 'inset 0 0 0 1px #AFC3DD' },
                        '&.Mui-focused': { boxShadow: 'inset 0 0 0 2px #9EB6D6' },
                      },
                    }}
                    sx={{ flex: 1, borderRadius: '12px' }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<FilterListIcon sx={{ color: '#1A212B', fontSize: 18 }} />}
                    onClick={handleShowFiltersToggle}
                    sx={{
                      minWidth: 160,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: '#EEF2F7',
                      color: '#1A212B',
                      textTransform: 'none',
                      px: 2,
                      border: '1px solid #D7DFEA',
                      boxShadow: '0 2px 8px rgba(2, 6, 23, 0.08)',
                      '&:hover': { bgcolor: '#E6EBF2' },
                      fontWeight: 600,
                    }}
                  >
                    {showFilters ? 'Hide filters' : 'Show filters'}
                  </Button>
                </Box>
                {showFilters && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography sx={{ fontSize: '12px', color: '#728197' }}>Supplier Name</Typography>
                      <Select
                        value={filters.supplier || ''}
                        onChange={(e) => handleFilterChange('supplier', e.target.value || null)}
                        displayEmpty
                        sx={{
                          width: 240,
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #D1D5DB',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                          '&:hover': {
                            border: '2px solid #D1D5DB',
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                          },
                          '&.Mui-focused': {
                            border: '2px solid #D1D5DB',
                            outline: 'none',
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                          },
                          '& .MuiSelect-select': {
                            color: '#1A212B',
                            fontWeight: 500,
                          },
                          '& .MuiSelect-icon': {
                            color: '#000000',
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                              border: '1px solid #E6ECF5',
                              '& .MuiMenuItem-root': {
                                '&:hover': {
                                  backgroundColor: '#F3E8FF',
                                  color: '#5C17E5',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: '#5C17E5',
                                  color: '#ffffff',
                                  '&:hover': {
                                    backgroundColor: '#4A14C7',
                                  },
                                },
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {[...new Set(tableData.map(r => r.supplier))].map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography sx={{ fontSize: '12px', color: '#728197' }}>Received On</Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="From"
                            value={dateRange.startDate}
                            onChange={(newValue: Dayjs | null) => setDateRange(prev => ({ ...prev, startDate: newValue }))}
                            slotProps={{
                              textField: {
                                size: 'small',
                                sx: {
                                  width: 120,
                                  '& .MuiOutlinedInput-root': {
                                    height: '40px',
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #D1D5DB',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: 'none',
                                    },
                                    '&:hover': {
                                      border: '2px solid #D1D5DB',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none',
                                      },
                                    },
                                    '&.Mui-focused': {
                                      border: '2px solid #D1D5DB',
                                      outline: 'none',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none',
                                      },
                                    },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: '#000000',
                                    '&.Mui-focused': {
                                      color: '#000000',
                                    },
                                  },
                                },
                              },
                              popper: {
                                sx: {
                                  '& .MuiPaper-root': {
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    border: '1px solid #E6ECF5',
                                  },
                                  '& .MuiDayCalendar-root': {
                                    width: '280px',
                                    padding: '16px',
                                  },
                                  '& .MuiDayCalendar-header': {
                                    color: '#5C17E5',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    marginBottom: '8px',
                                  },
                                  '& .MuiDayCalendar-weekDayLabel': {
                                    color: '#5C17E5',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  },
                                  '& .MuiDayCalendar-weekContainer': {
                                    marginBottom: '4px',
                                  },
                                  '& .MuiPickersDay-root': {
                                    width: '32px',
                                    height: '32px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#1A212B',
                                    borderRadius: '50%',
                                    margin: '2px',
                                    backgroundColor: 'transparent',
                                    '&:hover': {
                                      backgroundColor: '#F3E8FF !important',
                                      color: '#5C17E5 !important',
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: '#5C17E5 !important',
                                      color: '#ffffff !important',
                                      '&:hover': {
                                        backgroundColor: '#4A14C7 !important',
                                        color: '#ffffff !important',
                                      },
                                    },
                                    '&.MuiPickersDay-today': {
                                      border: '1px solid #D1D5DB',
                                      color: '#5C17E5',
                                      backgroundColor: 'transparent',
                                      '&:hover': {
                                        backgroundColor: '#F3E8FF !important',
                                        color: '#5C17E5 !important',
                                      },
                                      '&.Mui-selected': {
                                        backgroundColor: '#5C17E5 !important',
                                        color: '#ffffff !important',
                                        '&:hover': {
                                          backgroundColor: '#4A14C7 !important',
                                          color: '#ffffff !important',
                                        },
                                      },
                                    },
                                  },
                                  '& .MuiPickersCalendarHeader-root': {
                                    padding: '0 8px 16px 8px',
                                    '& .MuiPickersCalendarHeader-labelContainer': {
                                      '& .MuiPickersCalendarHeader-label': {
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1A212B',
                                      },
                                    },
                                    '& .MuiIconButton-root': {
                                      color: '#5C17E5',
                                      '&:hover': {
                                        backgroundColor: '#F3E8FF',
                                      },
                                    },
                                  },
                                },
                              },
                            }}
                          />
                          <Typography sx={{ fontSize: '14px', color: '#728197' }}>to</Typography>
                          <DatePicker
                            label="To"
                            value={dateRange.endDate}
                            onChange={(newValue: Dayjs | null) => setDateRange(prev => ({ ...prev, endDate: newValue }))}
                            slotProps={{
                              textField: {
                                size: 'small',
                                sx: {
                                  width: 120,
                                  '& .MuiOutlinedInput-root': {
                                    height: '40px',
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #D1D5DB',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: 'none',
                                    },
                                    '&:hover': {
                                      border: '2px solid #D1D5DB',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none',
                                      },
                                    },
                                    '&.Mui-focused': {
                                      border: '2px solid #D1D5DB',
                                      outline: 'none',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none',
                                      },
                                    },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: '#000000',
                                    '&.Mui-focused': {
                                      color: '#000000',
                                    },
                                  },
                                },
                              },
                              popper: {
                                sx: {
                                  '& .MuiPaper-root': {
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    border: '1px solid #E6ECF5',
                                  },
                                  '& .MuiDayCalendar-root': {
                                    width: '280px',
                                    padding: '16px',
                                  },
                                  '& .MuiDayCalendar-header': {
                                    color: '#5C17E5',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    marginBottom: '8px',
                                  },
                                  '& .MuiDayCalendar-weekDayLabel': {
                                    color: '#5C17E5',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  },
                                  '& .MuiDayCalendar-weekContainer': {
                                    marginBottom: '4px',
                                  },
                                  '& .MuiPickersDay-root': {
                                    width: '32px',
                                    height: '32px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#1A212B',
                                    borderRadius: '50%',
                                    margin: '2px',
                                    backgroundColor: 'transparent',
                                    '&:hover': {
                                      backgroundColor: '#F3E8FF !important',
                                      color: '#5C17E5 !important',
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: '#5C17E5 !important',
                                      color: '#ffffff !important',
                                      '&:hover': {
                                        backgroundColor: '#4A14C7 !important',
                                        color: '#ffffff !important',
                                      },
                                    },
                                    '&.MuiPickersDay-today': {
                                      border: '1px solid #D1D5DB',
                                      color: '#5C17E5',
                                      backgroundColor: 'transparent',
                                      '&:hover': {
                                        backgroundColor: '#F3E8FF !important',
                                        color: '#5C17E5 !important',
                                      },
                                      '&.Mui-selected': {
                                        backgroundColor: '#5C17E5 !important',
                                        color: '#ffffff !important',
                                        '&:hover': {
                                          backgroundColor: '#4A14C7 !important',
                                          color: '#ffffff !important',
                                        },
                                      },
                                    },
                                  },
                                  '& .MuiPickersCalendarHeader-root': {
                                    padding: '0 8px 16px 8px',
                                    '& .MuiPickersCalendarHeader-labelContainer': {
                                      '& .MuiPickersCalendarHeader-label': {
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1A212B',
                                      },
                                    },
                                    '& .MuiIconButton-root': {
                                      color: '#5C17E5',
                                      '&:hover': {
                                        backgroundColor: '#F3E8FF',
                                      },
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="text" onClick={() => { setSearchTerm(''); setFilters({}); setDateRange({ startDate: null, endDate: null }); }} sx={{ textTransform: 'none', color: '#27313F', mt: '24px' }}>
                      Reset filters
                    </Button>
                  </Box>
                )}
              </>
            )}
            {activeTab === 1 ? (
              <ReusableTable<PurchaseOrderRow>
                columns={purchaseOrderColumns}
                data={paginatedData as PurchaseOrderRow[]}
                emptyMessage={ORDER_RECEIVE_MESSAGES.EMPTY_ORDERS}
                searchAndFilterConfig={{ filterOptions: [] }}
                currentSearchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                showFilters={false}
                onShowFiltersToggle={() => {}}
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
              <ReusableTable<OrderReceiveRow>
                columns={orderReceiveColumns}
                data={paginatedData as OrderReceiveRow[]}
                emptyMessage={ORDER_RECEIVE_MESSAGES.EMPTY_RECEIPTS}
                searchAndFilterConfig={{ filterOptions: [] }}
                currentSearchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                showFilters={false}
                onShowFiltersToggle={() => {}}
                onFilterSelect={(key, value) => handleFilterChange(key, value)}
                totalRows={sortedData.length}
                rowsPerPage={rowsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                currentFilter={filters}
              />
            )}
          </>
        )}
      </Box>
      <ReceiveSupplierModal
        open={open}
        onClose={() => setOpen(false)}
        supplier={supplier}
        setSupplier={setSupplier}
        onNext={async () => {
          try {
            navigate('/receive/order-details', {
              state: { selectedSupplier: supplier }
            });
          } catch (e) {
            console.error("Navigation failed", e);
          } finally {
            setOpen(false);
          }
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={ORDER_RECEIVE_DIALOG.DELETE_TITLE}
        message={ORDER_RECEIVE_DIALOG.DELETE_MESSAGE}
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
        content={
          <ProductDetailsModalContent
            productData={
              selectedProduct
                ? {
                  ...selectedProduct,
                  products: (receiptLines || []).map((line) => ({
                    lineId: line.id,
                    productName: line.name,
                    type: line.type,
                    quantity: line.received_qty,
                    hsnCode: line.hsn_id,
                    amount: line.total_amount,
                  })) as ProductItem[],
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