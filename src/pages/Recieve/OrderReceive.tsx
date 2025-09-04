import React, { useState, useMemo, useEffect } from "react";
import { Box, Button, Tabs, Tab, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import "./OrderReceive.scss";
import { ReusableTable, TableColumn } from "../../components/PharmaTable";
import ReceiveSupplierModal from "../../components/Modal/ReceiveSupplier/ReceiveSupplierModal";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog"
import CommonModal from "../../components/CommonModal/CommonModal";
import ProductDetailsModalContent from "./ProductDetailsModalContent";

import {
  ORDER_RECEIVE_TITLE,
  ADD_RECEIVE_BUTTON,
  TAB_RECEIVE_HISTORY,
  TAB_CURRENT_ORDER,
} from "../../config/label/OrderReceive.labels";
import {
  ADD_BUTTON_COLOR,
  ADD_BUTTON_HOVER_COLOR,
  TAB_INDICATOR_STYLE,
} from "../../config/constants/OrderReceive.constants";

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
  poNo: string;
  orderedDate: string;
  supplier: string;
  totalAmount: string;
  status: string;
  createdBy?: string;
}

const OrderReceive: React.FC = () => {
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
  const { data: receipts, isLoading: loadingReceipts, error: receiptsError, refetch: refetchReceipts } = useGetReceiptsQuery(undefined, { skip: activeTab !== 1 });
  const { data: purchaseOrders, isLoading: loadingPurchaseOrders, error: purchaseOrdersError, refetch: refetchPurchaseOrders } = useGetCurrentPurchaseOrdersQuery(undefined, { skip: activeTab !== 2 });

  const [editReceipt, { isLoading: saving }] = useEditReceiptMutation();
  const [deleteReceipt, { isLoading: deleting }] = useDeleteReceiptMutation();

  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const { data: receiptLines } = useGetReceiptLinesQuery(
    selectedReceiptId !== null ? { receipt_id: selectedReceiptId } : (undefined as any),
    { skip: selectedReceiptId === null }
  );

  const mappedReceipts: OrderReceiveRow[] = useMemo(() => {
    return (receipts || []).map((receipt, idx) => ({
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
    return (purchaseOrders || []).map((po) => ({
      poNo: po.po_number,
      orderedDate: po.ordered_date,
      supplier: po.supplier_name,
      totalAmount: po.total_amount,
      status: po.status,
      createdBy: po.created_by ? String(po.created_by) : undefined
    }));
  }, [purchaseOrders]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);


  const handleEditClick = (row: OrderReceiveRow) => {
    setEditingRowId(row.reNo);
    setEditingDraft({ ...row });
  };

  const buildChanges = (original: OrderReceiveRow, draft: OrderReceiveRow): EditReceiptRequest => {
    const originalReceipt = receipts?.find(r => `RA${r.id}` === original.reNo);
    if (!originalReceipt) {
      throw new Error("Original receipt not found");
    }

    return {
      id: originalReceipt.id,
      po_id: Number(draft.poNo),
      received_on: draft.received,
      received_by: draft.reBy,
      receipt_status: draft.status,
      total_amount: draft.amt
    };
  };

  const handleSaveClick = async (row: OrderReceiveRow) => {
    if (!editingDraft) {
      setEditingRowId(null);
      return;
    }

    try {
      const editRequest = buildChanges(row, editingDraft);
      await editReceipt(editRequest).unwrap();
      const updated = currentReceiptsOverride.length > 0 ? currentReceiptsOverride : tableData;
      const next = updated.map((r) => (r.reNo === row.reNo ? { ...r, ...editingDraft } : r));
      setCurrentReceiptsOverride(next);
      setTableData(next);
    } catch (e) {
      console.error("Save failed", e);
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
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setIsDeleteDialogOpen(false);
      setRowToDeleteId(null);
    }
  };

  const handleViewDetailsClick = (row: OrderReceiveRow) => {
    setSelectedProduct(row);
    const receiptId = Number(row.reNo.replace('RA', ''));
    setSelectedReceiptId(receiptId);
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
      setTableData(currentReceiptsData);
    } else if (activeTab === 2) {
      setPurchaseOrderData(mappedPurchaseOrders);
    }
  }, [activeTab, currentReceiptsData, mappedPurchaseOrders]);

  const sortedData = useMemo(() => {
    if (activeTab === 1) {
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

  const rowsPerPage = 5;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalRows = activeTab === 1 ? tableData.length : purchaseOrderData.length;

  const columns: TableColumn<OrderReceiveRow>[] = [
    {
      key: "reNo",
      header: "Receipt number",
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <>
            <span>{row.reNo}</span>
            <VisibilityIcon
              sx={{ fontSize: '18px', color: '#666', cursor: 'pointer' }}
              onClick={() => handleViewDetailsClick(row)}
            />
          </>
        </Box>
      )
    },
    {
      key: "poNo", header: "PO number", render: (row) => (
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
      key: "supplier", header: "Supplier name", render: (row) => (
        <span>{row.supplier}</span>
      )
    },
    {
      key: "received", header: "Received on", render: (row) => (
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
      key: "status", header: "Received status", render: (row) => (
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
      key: "reBy", header: "Created by", render: (row) => (
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
      key: "amt", header: "Total amount", render: (row) => (
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
      header: "",
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingRowId === row.reNo ? (
            <>
              <CheckIcon sx={{ color: '#000000', cursor: 'pointer' }} onClick={() => handleSaveClick(row)} />
              <CloseIcon sx={{ color: '#000000', cursor: 'pointer' }} onClick={() => handleCancelClick()} />
              <DeleteIcon sx={{ color: '#000000', cursor: 'pointer' }} onClick={() => handleDeleteClick(row.reNo)} />
            </>
          ) : (
            <EditIcon sx={{ color: '#666', cursor: 'pointer' }} onClick={() => handleEditClick(row)} />
          )}
        </Box>
      )
    }
  ];

  const purchaseOrderColumns: TableColumn<PurchaseOrderRow>[] = [
    {
      key: "poNo",
      header: "PO number",
      render: (row) => <span>{row.poNo}</span>
    },
    {
      key: "orderedDate",
      header: "Ordered date",
      render: (row) => <span>{row.orderedDate}</span>
    },
    {
      key: "supplier",
      header: "Supplier name",
      render: (row) => <span>{row.supplier}</span>
    },
    {
      key: "totalAmount",
      header: "Total amount",
      render: (row) => <span>{row.totalAmount}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <span>{row.status}</span>
    },
    {
      key: "createdBy",
      header: "Created by",
      render: (row) => <span>{row.createdBy || '-'}</span>
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
          }}
          onClick={() => setOpen(true)}
        >
          {ADD_RECEIVE_BUTTON}
        </Button>
      </Box>
      <Box className="tabs" sx={{ mb: '24px' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: TAB_INDICATOR_STYLE }}
          sx={{ '& .MuiTabs-flexContainer': { gap: '8px' } }}
        >
          <Tab label={TAB_RECEIVE_HISTORY} />
          <Tab label={TAB_CURRENT_ORDER} />
        </Tabs>
      </Box>
      <Box className="tab-content">
        {loadingReceipts && activeTab === 1 ? (
          <Typography variant="body2">Loading receipts...</Typography>
        ) : loadingPurchaseOrders && activeTab === 2 ? (
          <Typography variant="body2">Loading purchase orders...</Typography>
        ) : receiptsError && activeTab === 1 ? (
          <Box>
            <Typography variant="body2" color="error">Failed to load receipts.</Typography>
            <Button size="small" onClick={() => refetchReceipts()}>Retry</Button>
          </Box>
        ) : purchaseOrdersError && activeTab === 2 ? (
          <Box>
            <Typography variant="body2" color="error">Failed to load purchase orders.</Typography>
            <Button size="small" onClick={() => refetchPurchaseOrders()}>Retry</Button>
          </Box>
        ) : activeTab === 1 ? (
          <ReusableTable<OrderReceiveRow>
            columns={columns}
            data={paginatedData as OrderReceiveRow[]}
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
          />
        ) : (
          <ReusableTable<PurchaseOrderRow>
            columns={purchaseOrderColumns}
            data={paginatedData as PurchaseOrderRow[]}
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
          />
        )}
      </Box>
      <ReceiveSupplierModal
        open={open}
        onClose={() => setOpen(false)}
        supplier={supplier}
        setSupplier={setSupplier}
        onNext={async () => {
          try {
            const filtered = (receipts || []).filter(receipt => !supplier || receipt.supplier_name === supplier);
            const mapped: OrderReceiveRow[] = filtered.map((receipt, idx) => ({
              reNo: `RA${receipt.id}`,
              poNo: String(receipt.po_id),
              supplier: receipt.supplier_name,
              received: receipt.received_on,
              status: receipt.receipt_status,
              reBy: receipt.received_by,
              amt: receipt.total_amount,
              products: []
            }));
            setCurrentReceiptsOverride(mapped);
            setTableData(mapped);
            setActiveTab(1);
            setSearchTerm("");
            setCurrentPage(1);
          } catch (e) {
            console.error("Supplier action failed", e);
          } finally {
            setOpen(false);
          }
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record? This action cannot be undone."
      />

      <CommonModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Details of products"
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