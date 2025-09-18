import React, { useState, useMemo, useEffect } from "react";
import { Box, Button, Typography, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import "./OrderReceive.scss";
import { ReusableTable, TableColumn } from "../../components/PharmaTable";
import ReceiveSupplierModal from "../../components/Modal/ReceiveSupplier/ReceiveSupplierModal";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog"
import CommonModal from "../../components/CommonModal/CommonModal";
import ProductDetailsModalContent from "./ProductDetailsModalContent";
import LastModal from "../../components/Modal/lastOne/LastModal";

import {
  ORDER_RECEIVE_TITLE,
  ADD_RECEIVE_BUTTON,
  TAB_RECEIVE_HISTORY,
  TAB_CURRENT_ORDER,
  ORDER_RECEIVE_TABLE_HEADERS,
  PURCHASE_ORDER_TABLE_HEADERS,
  ORDER_RECEIVE_MESSAGES,
  ORDER_RECEIVE_DIALOG,
  ORDER_RECEIVE_MODAL,
} from "../../config/label/OrderReceive.labels";
import {
  ADD_BUTTON_COLOR,
  ORDER_RECEIVE_CONSTANTS,
} from "../../config/constants/OrderReceive.constants";
import { baseButtonStyle } from "../../config/constants/inventoryConstants";

import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  useGetReceiptsQuery,
  useEditReceiptMutation,
  useDeleteReceiptMutation,
  useGetCurrentPurchaseOrdersQuery,
  useGetReceiptLinesQuery,
  Receipt,
  EditReceiptRequest,
  PurchaseOrder
} from "../../redux/slices/receiveApi";

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
  const [activeTab, setActiveTab] = useState<number>(1);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "", direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState<string>("");

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
      .filter((po) => po.status.toLowerCase() !== 'received') // FIX: Exclude 'received' orders from current orders tab
      .map((po, index) => ({
        receiptId: index + 1000, 
        poNo: po.po_number,
        orderedDate: po.ordered_date,
        supplier: po.supplier_name,
        totalAmount: po.total_amount,
        status: po.status,
        createdBy: po.created_by ? String(po.created_by) : 'System'
      }));
  }, [purchaseOrders]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const handleEditClick = (row: OrderReceiveRow) => {
    setEditingRowId(row.reNo);
    setEditingDraft({ ...row });
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
      // RTK Query error shapes
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
      // no-op
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
      // Refetch from server to ensure DB changes are reflected
      await refetchReceipts();
      // Clear overrides so we show fresh server data
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

  const handleDeleteClick = (reNo: string) => {
    setRowToDeleteId(reNo);
    setIsDeleteDialogOpen(true);
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
      // Ensure server state sync
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
  }, [activeTab, currentReceiptsData, mappedPurchaseOrders]);

  const sortedData = useMemo(() => {
    if (activeTab === 2) {
      let sortableItems = [...tableData];

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
  }, [activeTab, tableData, purchaseOrderData, sortConfig, searchTerm]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: ORDER_RECEIVE_CONSTANTS.TABLE.ACTION_GAP }}>
          <span>{row.reNo}</span>
          <VisibilityIcon
            sx={{ fontSize: ORDER_RECEIVE_CONSTANTS.ICONS.RECEIPT_VIEW_SIZE, color: ORDER_RECEIVE_CONSTANTS.ICONS.MUTED_COLOR, cursor: 'pointer' }}
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
      key: "status",
      header: ORDER_RECEIVE_TABLE_HEADERS.RECEIVED_STATUS,
      // Key change: Set sortable to false
      sortable: false,
      render: (row) => (
        editingRowId === row.reNo ? (
          <input
            type="text"
            value={editingDraft?.status ?? ''}
            onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, status: e.target.value } : prev))}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        ) : (
          <span>{row.status}</span>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}> {/* gap between total and icons */}
          {editingRowId === row.reNo ? (
            <Box sx={{ display: 'flex', gap: '12px' }}> {/* fixed gap between icons */}
              <CheckIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleSaveClick(row)}
              />
              <CloseIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleCancelClick()}
              />
              <DeleteIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleDeleteClick(row.reNo)}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: '18px' }}> {/* fixed gap between icons */}
              <EditIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleEditClick(row)}
              />
              <DeleteIcon
                sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
                onClick={() => handleDeleteClick(row.reNo)}
              />
            </Box>
          )}
        </Box>
      )
    }
  ];

  const handlePurchaseOrderClick = (row: PurchaseOrderRow) => {
    // Navigate to OrderDetails page with selected supplier and PO number
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
    setCurrentPage(1);
  };

  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
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
            onClick={() => setOpen(true)}
          >
            {ADD_RECEIVE_BUTTON}
          </Button>
        </Box>
      </Box>
      <Box
        className="inventory-tabs"
        sx={{ mb: '24px', display: 'inline-flex', bgcolor: '#eef4ff', borderRadius: '16px', p: '6px', gap: '8px' }}
      >
        <Button
          onClick={() => handleTabChange({} as any, 1)}
          sx={{
            ...baseButtonStyle,
            width: '8.5rem',
            height: '2.35rem',
            backgroundColor: activeTab === 1 ? '#ffffff' : 'transparent',
            borderRadius: activeTab === 1 ? '0.5rem' : 0,
            border: '1px solid transparent',
            boxShadow: activeTab === 1
              ? '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)'
              : 'none',
            ...(activeTab === 1
              ? {
                '&:hover': {
                  outline: 'none',
                  backgroundColor: '#1976d2',
                  color: '#000000',
                  boxShadow: '0 6px 16px rgba(21, 101, 192, 0.35)'
                }
              }
              : {
                '&:hover': {
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  borderColor: '#1976d2',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)'
                }
              })
          }}
        >
          {TAB_CURRENT_ORDER}
        </Button>
        <Button
          onClick={() => handleTabChange({} as any, 2)}
          sx={{
            ...baseButtonStyle,
            width: '8.5rem',
            height: '2.35rem',
            backgroundColor: activeTab === 2 ? '#ffffff' : 'transparent',
            borderRadius: activeTab === 2 ? '0.5rem' : 0,
            border: '1px solid transparent',
            boxShadow: activeTab === 2
              ? '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)'
              : 'none',
            ...(activeTab === 2
              ? {
                '&:hover': {
                  outline: 'none',
                  backgroundColor: '#1976d2',
                  color: '#000000',
                  boxShadow: '0 6px 16px rgba(21, 101, 192, 0.35)'
                }
              }
              : {
                '&:hover': {
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  borderColor: '#1976d2',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)'
                }
              })
          }}
        >
          {TAB_RECEIVE_HISTORY}
        </Button>
      </Box>
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
            {activeTab === 1 ? (
              <ReusableTable<PurchaseOrderRow>
                columns={purchaseOrderColumns}
                data={paginatedData as PurchaseOrderRow[]}
                emptyMessage={ORDER_RECEIVE_MESSAGES.EMPTY_ORDERS}
                searchAndFilterConfig={{ filterOptions: [] }}
                currentSearchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                showFilters={false}
                onShowFiltersToggle={() => { }}
                currentFilterKey={""}
                onFilterSelect={() => { }}
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
                onShowFiltersToggle={() => { }}
                currentFilterKey={""}
                onFilterSelect={() => { }}
                totalRows={sortedData.length}
                rowsPerPage={rowsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
                selectedRows={selectedRows}
               setSelectedRows={setSelectedRows}
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

