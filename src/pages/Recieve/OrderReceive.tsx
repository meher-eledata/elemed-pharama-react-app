import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { StandardButton } from "../../components/Common";
import DateRangeFilter from "../../components/mainDashboard/DateRangeFilter/DateRangeFilter";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import "./OrderReceive.scss";
import { ReusableTable } from "../../components/PharmaTable";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import CommonModal from "../../components/CommonModal/CommonModal";
import ProductDetailsModalContent from "./ProductDetailsModalContent";
import {
  ORDER_RECEIVE_TITLE,
  ADD_RECEIVE_BUTTON,
  ORDER_RECEIVE_MESSAGES,
  ORDER_RECEIVE_DIALOG,
  ORDER_RECEIVE_MODAL,
} from "../../config/label/OrderReceive.labels";
import { ORDER_RECEIVE_CONSTANTS } from "../../config/constants/OrderReceive.constants";
import { OrderReceiveRow, PurchaseOrderRow, ProductItem } from "./types";
import { useOrderReceiveData } from "./hooks/useOrderReceiveData";
import { useOrderReceiveFilters } from "./hooks/useOrderReceiveFilters";
import { useOrderReceiveActions } from "./hooks/useOrderReceiveActions";
import { getOrderReceiveColumns, getPurchaseOrderColumns } from "./components/TableColumns";
import OrderReceiveFooter from "./components/OrderReceiveFooter";

const OrderReceive: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(2);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderReceiveRow | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // State for data that can be modified locally
  const [tableData, setTableData] = useState<OrderReceiveRow[]>([]);
  const [purchaseOrderData, setPurchaseOrderData] = useState<PurchaseOrderRow[]>([]);

  // 1. Data Hook
  const {
    receipts,
    rawReceipts,
    purchaseOrders,
    loadingReceipts,
    loadingPurchaseOrders,
    receiptsError,
    purchaseOrdersError,
    refetchReceipts,
    refetchPurchaseOrders,
    receiptLines,
    setSelectedReceiptId,
    productNameCache
  } = useOrderReceiveData(activeTab);

  // Sync data when receipts or purchaseOrders change
  useEffect(() => {
    if (activeTab === 1) {
      setPurchaseOrderData(purchaseOrders);
    } else if (activeTab === 2) {
      setTableData(receipts);
    }
  }, [activeTab, receipts, purchaseOrders]);

  // 2. Filters Hook
  const {
    currentPage,
    setCurrentPage,
    sortConfig,
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
  } = useOrderReceiveFilters(tableData, purchaseOrderData, activeTab);

  // 3. Actions Hook
  const {
    editingRowId,
    editingDraft,
    setEditingDraft,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    rowToDeleteId,
    snackbar,
    setSnackbar,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
    handleConfirmDelete,
    handlePaymentDetailsClick,
    validateInlineEditing,
  } = useOrderReceiveActions(
    rawReceipts, // Use the raw receipts from hook for buildChanges
    refetchReceipts,
    tableData,
    setTableData
  );

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

  const handleSupplierChange = (newValue: string | null) => {
    handleFilterChange('supplier', newValue);
    setSupplierSearchTerm(newValue || '');
  };

  const orderReceiveColumns = useMemo(() => getOrderReceiveColumns(
    editingRowId,
    editingDraft,
    setEditingDraft,
    handleViewDetailsClick,
    handleEditClick,
    handlePaymentDetailsClick,
    handleSaveClick,
    handleCancelClick,
    validateInlineEditing
  ), [editingRowId, editingDraft, setEditingDraft, handleViewDetailsClick, handleEditClick, handlePaymentDetailsClick, handleSaveClick, handleCancelClick, validateInlineEditing]);

  const purchaseOrderColumns = useMemo(() => getPurchaseOrderColumns(
    (row) => navigate('/receive/order-details', {
      state: {
        selectedSupplier: row.supplier,
        selectedPO: row.poNo,
        selectedOrder: row
      }
    })
  ), [navigate]);

  const currentFilterForTable = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value || null]));
  }, [filters]);

  return (
    <Box className="order-receive">
      <Box className="header">
        <Typography variant="h4" className="title">
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
        {(loadingReceipts && activeTab === 2) ? (
          <Typography variant="body2">{ORDER_RECEIVE_MESSAGES.LOADING_RECEIPTS}</Typography>
        ) : (loadingPurchaseOrders && activeTab === 1) ? (
          <Typography variant="body2">{ORDER_RECEIVE_MESSAGES.LOADING_ORDERS}</Typography>
        ) : (receiptsError && activeTab === 2) ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {ORDER_RECEIVE_MESSAGES.LOAD_RECEIPTS_FAILED}
            </Typography>
            <StandardButton size="small" onClick={() => refetchReceipts()} variant="outline">
              Retry
            </StandardButton>
          </Box>
        ) : (purchaseOrdersError && activeTab === 1) ? (
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
                    bgcolor: '#F6F8FB', borderRadius: '1.5625rem', border: '0.0625rem solid #E6ECF5', p: '0.75rem',
                    gap: { xs: 2, sm: 4, md: 8 },
                    mb: 2, mt: 2,
                    flexWrap: { xs: 'wrap', lg: 'nowrap' },
                  }}
                >
                  <TextField
                    placeholder="Search by Receipt Number, Supplier, or Received By"
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                    InputProps={{
                      startAdornment: !searchTerm.trim() ? (
                        <InputAdornment position="start" sx={{ marginRight: '0.25rem' }}>
                          <SearchIcon sx={{ color: '#8A99AF', fontSize: '1.5rem' }} />
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={{
                      height: '2.5rem',
                      borderRadius: '0.75rem',
                      backgroundColor: '#fff',
                      boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6',
                      flex: 1,
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '&:hover': { boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6' },
                      '&.Mui-focused': { boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6' },
                      '& .MuiOutlinedInput-input': {
                        padding: '0.625rem 0.875rem',
                        paddingLeft: '0.5rem',
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        fontSize: '1rem',
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
                    onClick={() => setShowFilters(!showFilters)}
                    variant="secondary"
                    size="medium"
                    sx={{
                      minWidth: '10rem',
                      bgcolor: '#EEF2F7',
                      color: '#1A212B',
                      px: 2,
                      border: '0.0625rem solid #D7DFEA',
                      boxShadow: '0 0.125rem 0.5rem rgba(2, 6, 23, 0.08)',
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
                        <Typography sx={{ fontSize: '0.75rem', color: '#728197' }}>Supplier Name</Typography>
                        <Autocomplete
                          options={uniqueSuppliers}
                          value={filters.supplier || null}
                          onChange={(_, newValue) => handleSupplierChange(newValue)}
                          onInputChange={(_, newInputValue) => setSupplierSearchTerm(newInputValue)}
                          inputValue={supplierSearchTerm}
                          disableListWrap={true}
                          PaperComponent={({ children }) => (
                            <Box
                              sx={{
                                padding: 0,
                                marginTop: "4px",
                                borderRadius: "12px",
                                border: "1px solid #E5E7EB",
                                backgroundColor: "#fff",
                                boxShadow: '0 0.125rem 0.5rem rgba(2, 6, 23, 0.08)',
                              }}
                            >
                              {children}
                            </Box>
                          )}
                          slotProps={{
                            popper: {
                              sx: {
                                "& .MuiPaper-root": {
                                  minWidth: "15rem",
                                  width: "fit-content",
                                  padding: "0 !important",
                                  marginTop: "4px !important",
                                  maxHeight: "300px !important",
                                  height: "auto !important",
                                  "& ul": {
                                    padding: "4px 0 !important",
                                    margin: "0 !important",
                                  },
                                },
                              },
                            },
                          }}
                          sx={{
                            width: '15rem',
                            '& .MuiOutlinedInput-root': {
                              height: '2.5rem',
                              borderRadius: '30px',
                              backgroundColor: '#ffffff',
                              padding: '2px 14px',
                              '& fieldset': {
                                border: '1px solid #D1D5DB',
                              },
                              '&:hover fieldset': {
                                border: '1px solid #D1D5DB',
                              },
                              '&.Mui-focused fieldset': {
                                border: '1px solid #D1D5DB',
                              },
                            },
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Search supplier..."
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <React.Fragment>
                                    <InputAdornment position="start" sx={{ ml: 1.5, mr: 1.5 }}>
                                      <SearchIcon sx={{ color: '#9CA3AF', fontSize: '20px' }} />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </React.Fragment>
                                ),
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  paddingLeft: '0 !important',
                                  '& fieldset': {
                                    borderColor: '#E5E7EB',
                                    borderWidth: '1.5px',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: '#D1D5DB',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#5C17E5',
                                    borderWidth: '2px',
                                  },
                                },
                                '& .MuiInputBase-input': {
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: '#1A212B',
                                  ml: 1,
                                }
                              }}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <DateRangeFilter
                          dateRange={dateRange}
                          onDateRangeChange={setDateRange}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pt: '1.75rem' }}>
                      <StandardButton
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({});
                          setSupplierSearchTerm('');
                          setDateRange([null, null]);
                        }}
                        variant="secondary"
                        size="medium"
                        sx={{
                          minWidth: '10rem',
                          height: '2.5rem',
                          backgroundColor: '#F5F5F5',
                          border: '1px solid #D1D5DB',
                          color: '#1A212B',
                          fontWeight: 500,
                          marginRight: '0.625rem',
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
                onSearchChange={(e) => handleSearchChange(e.target.value)}
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
              <ReusableTable<OrderReceiveRow>
                columns={orderReceiveColumns}
                data={sortedData as OrderReceiveRow[]}
                emptyMessage={ORDER_RECEIVE_MESSAGES.EMPTY_RECEIPTS}
                searchAndFilterConfig={{ filterOptions: [] }}
                currentSearchTerm={searchTerm}
                onSearchChange={(e) => handleSearchChange(e.target.value)}
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
                footerContent={<OrderReceiveFooter sortedData={sortedData as OrderReceiveRow[]} activeTab={activeTab} currentPage={currentPage} />}
              />
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
        open={snackbar.open}
        autoHideDuration={ORDER_RECEIVE_CONSTANTS.SNACKBAR.AUTOHIDE_MS}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={ORDER_RECEIVE_CONSTANTS.SNACKBAR.ANCHOR}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <CommonModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={ORDER_RECEIVE_MODAL.DETAILS_TITLE}
        maxWidth="56.25rem"
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
