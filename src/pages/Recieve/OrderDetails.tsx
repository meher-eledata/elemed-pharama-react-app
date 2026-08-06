import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../redux/store";
import {
  Box,
  Typography,
  Divider,
  Button,
  Snackbar,
  Alert,
  TableCell,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAddSupplierMutation, useUpdateProductMutation } from "../../redux/slices/masterApi";
import { useGetBatchesForProductMutation } from "../../redux/slices/inventoryApi";
import { getReceiptFileUrl, receiveApi } from "../../redux/slices/receiveApi";
import { ReusableTable } from "../../components/PharmaTable";
import NewProductModal from "../../components/Modal/NewProduct/NewProductModal";
import ScheduleAttributionModal from "../../components/Modal/ScheduleAttribution/ScheduleAttributionModal";
import NewSupplierModal from "../../components/Modal/NewSupplier/NewSupplierModal";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import { StandardButton } from "../../components/Common";
import { orderLabels } from "../../config/label/OrderDetail.labels";
import { themeColors, typography } from "../../config/constants/OrderDetail.constants";

// Types
import { OrderDetailsProps, PharmaTableRow } from "./types";

// Hooks
import { useOrderDetailsData } from "./hooks/useOrderDetailsData";
import { useOrderDetailsForm } from "./hooks/useOrderDetailsForm";
import { useOrderDetailsTable } from "./hooks/useOrderDetailsTable";
import { useOrderDetailsSubmit } from "./hooks/useOrderDetailsSubmit";
import { useInvoiceExtraction } from "./hooks/useInvoiceExtraction";

// Components
import SupplierSection from "./components/SupplierSection";
import ProductSearchSection from "./components/ProductSearchSection";
import InvoiceReviewBanner from "./components/InvoiceReviewBanner";
import { getProductTableColumns } from "./components/ProductTableColumns";
import { INVOICE_EXTRACTION } from "../../config/constants/OrderReceive.constants";

const OrderDetails: React.FC<OrderDetailsProps> = ({ labels }) => {
  const navigate = useNavigate();
  // Typed so cross-slice thunks (receiveApi.util.invalidateTags) dispatch cleanly.
  const dispatch = useDispatch<AppDispatch>();
  const [addSupplier] = useAddSupplierMutation();
  const [getBatchesForProduct] = useGetBatchesForProductMutation();
  const [updateProduct, { isLoading: isSavingSchedule }] = useUpdateProductMutation();
  const token = useSelector((state: RootState) => state.auth.token);
  // One-time schedule attribution popup: the product waiting on a choice before
  // its line is added to the receipt table.
  const [pendingScheduleProduct, setPendingScheduleProduct] = useState<{ name: string; product_id: number } | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>('success');

  // Initialize form hook first to get isEditMode and receiptId
  const form = useOrderDetailsForm();

  // Initialize data hook
  const data = useOrderDetailsData(form.isEditMode, form.receiptId);

  // Initialize table hook
  const table = useOrderDetailsTable(
    data.productOptionsWithIds,
    data.getProductIdFromName,
    data.getExactProductIdFromName,
    (msg: string) => {
      setSnackbarMessage(msg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  );

  // Invoice auto-fill: attaching a file in create mode extracts a confidence-scored
  // draft and pre-fills the form; below-threshold fields stay blank and surface in
  // the review banner. Never runs in edit mode; failures fall back to manual entry.
  const extraction = useInvoiceExtraction({
    isEditMode: form.isEditMode,
    setSupplierName: form.setSupplierName,
    setSupplierSearchTerm: form.setSupplierSearchTerm,
    setInvoiceNumber: form.setInvoiceNumber,
    setInvoiceDate: form.setInvoiceDate,
    setPoNumber: form.setPoNumber,
    setPharmaTableData: table.setPharmaTableData,
    updateRow: (rowId, patch) =>
      table.setPharmaTableData((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
      ),
    onFallback: () => {
      setSnackbarMessage(INVOICE_EXTRACTION.FALLBACK_TOAST);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    },
  });

  // Combined handler: keep the existing attach behaviour, then kick off extraction.
  const handleInvoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    form.handleFileChange(event);
    if (file) extraction.runExtraction(file);
  };

  // Add-to-receipt gate: a product whose schedule is NULL (never attributed) asks
  // once via the popup; 'NONE' or a real code adds straight to the table. Products
  // just created via NewProductModal re-enter the options list with their chosen
  // schedule (fetchAllProducts refetch), so they never double-prompt.
  const handleProductSelect = (productName: string) => {
    const pid = data.getProductIdFromName(productName);
    const option = pid != null ? data.productOptionsWithIds.find((p) => p.id === pid) : undefined;
    if (option && (option.schedule ?? null) === null) {
      setPendingScheduleProduct({ name: productName, product_id: option.id });
      return;
    }
    table.addProductToTable(productName);
  };

  // Popup choice: persist the schedule on the product, refresh both product caches
  // (the RTK receive cache AND this page's raw-fetch options list — without the
  // refresh the popup re-fires all session), then add the line. Never blocks.
  const handleScheduleSelect = async (schedule: string) => {
    const pending = pendingScheduleProduct;
    if (!pending) return;
    try {
      await updateProduct({ product_id: pending.product_id, schedule }).unwrap();
      dispatch(receiveApi.util.invalidateTags(['Receive']));
      data.fetchAllProducts();
    } catch {
      // Persist failed — the popup fires again next time; the receipt is not blocked.
    } finally {
      table.addProductToTable(pending.name);
      setPendingScheduleProduct(null);
    }
  };

  // Skipping adds the line without a schedule; the popup fires again next time.
  const handleScheduleCancel = () => {
    if (pendingScheduleProduct) table.addProductToTable(pendingScheduleProduct.name);
    setPendingScheduleProduct(null);
  };

  // Initialize submit hook
  const submit = useOrderDetailsSubmit({
    supplierName: form.supplierName,
    supplierOptions: data.supplierOptions,
    poNumber: form.poNumber,
    invoiceDate: form.invoiceDate,
    invoiceNumber: form.invoiceNumber,
    transactionNumber: form.transactionNumber,
    paymentVendor: form.paymentVendor,
    paymentMethod: form.paymentMethod,
    pharmaTableData: table.pharmaTableData,
    originalReceiptLines: form.originalReceiptLines,
    productOptionsWithIds: data.productOptionsWithIds,
    invoiceFile: form.invoiceFile,
    isEditMode: form.isEditMode,
    receiptId: form.receiptId,
    user: form.user,
    setIsSaving: form.setIsSaving,
    setSaveError: form.setSaveError,
    setSaveSuccess: form.setSaveSuccess,
    setIsDeleting: form.setIsDeleting,
    setDeleteError: form.setDeleteError,
    setDeleteSuccess: form.setDeleteSuccess,
    resetForm: form.resetForm,
    setPharmaTableData: table.setPharmaTableData,
    setFindProductTerm: table.setFindProductTerm,
    setEditingRowId: table.setEditingRowId,
    setEditingData: table.setEditingData,
    setIsProductSelected: table.setIsProductSelected,
    isProductRowComplete: table.isProductRowComplete,
    allReceiptsData: data.allReceiptsData,
  });

  // Fetch suppliers and products on mount
  useEffect(() => {
    data.fetchSupplierNames();
    data.fetchAllProducts();
  }, []);

  const loadReceiptLines = async () => {
    try {
      // Set supplier and PO from navigation state immediately
      if (form.selectedOrder) {
        form.setSupplierName(form.selectedOrder.supplier || '');
        form.setSupplierSearchTerm(form.selectedOrder.supplier || '');
        form.setPoNumber(form.selectedOrder.poNo || '');
        if (form.selectedOrder.invoiceNumber) {
          form.setInvoiceNumber(form.selectedOrder.invoiceNumber);
        }
      }

      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/+$/, '')}/receive/get-receipt-lines/`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ receipt_id: form.receiptId })
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const receiptLines = await response.json();

      // Deduplicate receipt lines by receipt_line_id to handle backend join issues
      const uniqueLinesMap = new Map();
      if (Array.isArray(receiptLines)) {
        receiptLines.forEach((line: any) => {
          const lineId = line.receipt_line_id || line.id;
          if (lineId && !uniqueLinesMap.has(lineId)) {
            uniqueLinesMap.set(lineId, line);
          } else if (!lineId) {
            // If no ID, keep it just in case, but use the object as key (not ideal but safe)
            uniqueLinesMap.set(line, line);
          }
        });
      }
      const uniqueReceiptLines = Array.from(uniqueLinesMap.values());

      // Set transaction and payment details
      if (uniqueReceiptLines && uniqueReceiptLines.length > 0) {
        const firstLine = uniqueReceiptLines[0];
        form.setTransactionNumber(
          firstLine.transaction_number ||
          firstLine.last_transaction_number ||
          form.navigationTransactionNumber ||
          ''
        );
        form.setPaymentVendor(
          firstLine.payment_vendor ||
          firstLine.last_payment_vendor ||
          form.navigationPaymentVendor ||
          ''
        );
        form.setInvoiceNumber(
          firstLine.invoice_number ||
          form.navigationInvoiceNumber ||
          ''
        );
      } else {
        form.setTransactionNumber(form.navigationTransactionNumber || '');
        form.setPaymentVendor(form.navigationPaymentVendor || '');
        form.setInvoiceNumber(form.navigationInvoiceNumber || '');
      }

      if (form.navigationInvoiceDate) {
        form.setInvoiceDate(form.navigationInvoiceDate);
      }

      // Transform receipt lines to table format
      const transformedLines: PharmaTableRow[] = uniqueReceiptLines.map((line: any, index: number) => {
        const expiryDateRaw = line.expiry_date || line.expiryDate || null;
        const expiryDateValue = expiryDateRaw
          ? (() => {
            let parsed = dayjs(expiryDateRaw, 'YYYY-MM-DD', true);
            if (!parsed.isValid()) parsed = dayjs(expiryDateRaw);
            return parsed.isValid() ? parsed : null;
          })()
          : null;

        return {
          id: line.receipt_line_id?.toString() || index.toString(),
          productId: line.product_name || line.product || `Product ID: ${line.product_id || 'Unknown'}`,
          product_id: line.product_id ? Number(line.product_id) : undefined,
          type: line.type,
          batchNumber: line.batch_number || '',
          batch_id: line.batch_id || undefined,
          po_line_id: line.po_line_id ? Number(line.po_line_id) : undefined,
          qtyReceived: line.received_qty || 0,
          qtyFree: line.free_qty || 0,
          batch: null,
          expiryDate: expiryDateValue,
          pp: parseFloat(line.purchase_price) || parseFloat(line.unit_price) || 0,
          sp: parseFloat(line.selling_price) || parseFloat(line.purchase_price) || parseFloat(line.unit_price) || 0,
          pack: line.pack_qty || line.packing_info || '',
          mrp: parseFloat(line.mrp) || parseFloat(line.purchase_price) || parseFloat(line.unit_price) || 0,
          cgst: parseFloat(line.cgst) || 0,
          sgst: parseFloat(line.sgst) || 0,
          igst: parseFloat(line.igst) || 0,
          disc: parseFloat(line.discount) || 0,
          margPercent: 0,
          salesDiscPercent: 0,
          isEditing: false,
        };
      });

      table.setPharmaTableData(transformedLines);
      form.setOriginalReceiptLines(transformedLines);

      // Load invoice attachment
      if (data.receiptsData && form.receiptId) {
        const receipt = data.receiptsData.find((r: any) => r.receipt_id === form.receiptId || r.id === form.receiptId);
        if (receipt?.receipt_file_name || receipt?.receipt_file_url) {
          const fileUrl = getReceiptFileUrl(form.receiptId);
          form.setInvoiceAttachmentUrl(fileUrl);
          form.setInvoiceFileName(receipt.receipt_file_name || 'Invoice Receipt');
          form.setIsExistingFile(true);
        }
        if (receipt?.invoice_number) {
          form.setInvoiceNumber(receipt.invoice_number);
        }
      }
    } catch (error) {
      console.error('Error loading receipt lines:', error);
      table.setPharmaTableData([]);
      form.setOriginalReceiptLines([]);
    }
  };

  // Load receipt lines in edit mode
  useEffect(() => {
    if (form.isEditMode && form.receiptId) {
      loadReceiptLines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.isEditMode, form.receiptId, data.productOptionsWithIds]);

  const handleSupplierSubmit = async (supplierData: any) => {
    try {
      await addSupplier({
        supplier_name: supplierData.supplierName,
        supplier_code: supplierData.supplierCode || '',
        contact_name: supplierData.contactName,
        address: supplierData.address || '',
        city: supplierData.city || '',
        state: supplierData.state || '',
        pin: supplierData.pin || '',
        country: supplierData.country || '',
        phone_number: supplierData.phoneNumber,
        gst_number: supplierData.gstin || '',
        cst_number: supplierData.cstNumber || '',
        notes: supplierData.notes || '',
      }).unwrap();
      form.setIsNewSupplierModalOpen(false);
      await data.fetchSupplierNames();
      form.setSupplierName(supplierData.supplierName);
      setSnackbarMessage('Supplier added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding supplier:', error);
      setSnackbarMessage('Failed to add supplier. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      throw error;
    }
  };

  const validateRequiredFields = () => {
    return form.supplierName.trim() !== '' && table.pharmaTableData.length > 0;
  };

  // Invoice number is required before a receipt can be submitted (mirrors backend rule).
  const validateInvoiceNumber = () => {
    if (!form.invoiceNumber.trim()) {
      form.setInvoiceNumberError('Invoice number is required');
      return false;
    }
    form.setInvoiceNumberError('');
    return true;
  };

  const handleConfirmDelete = () => {
    if (form.rowToDeleteId) {
      table.deleteRow(form.rowToDeleteId);
    }
    form.setIsDeleteDialogOpen(false);
    form.setRowToDeleteId(null);
  };

  const handleCancel = () => {
    table.setPharmaTableData([]);
    table.setFindProductTerm("");
    table.setEditingRowId(null);
    table.setEditingData({});
    form.setSupplierName("");
    form.setPoNumber("");
    form.setInvoiceDate("");
    table.setIsProductSelected(false);
    navigate('/receive/order-receive');
  };

  const handleUploadConfirmationYes = () => {
    form.setIsUploadConfirmationDialogOpen(false);
    if (form.fileInputRef.current) {
      form.fileInputRef.current.click();
    }
  };

  const handleUploadConfirmationNo = async () => {
    form.setIsUploadConfirmationDialogOpen(false);
    form.setIsProceedToPaymentDialogOpen(true);
  };

  const handleProceedToPaymentClick = () => {
    if (!validateInvoiceNumber()) {
      return;
    }
    if (!form.invoiceFile && !form.invoiceAttachmentUrl) {
      form.setIsUploadConfirmationDialogOpen(true);
      return;
    }
    form.setIsProceedToPaymentDialogOpen(true);
  };

  const handleSaveAndPayLaterClick = () => {
    if (!validateInvoiceNumber()) {
      return;
    }
    submit.handleSaveAndPayLater();
  };

  const handleSubmitReceipt = async () => {
    if (!validateInvoiceNumber()) {
      return;
    }

    if (form.isEditMode) {
      await submit.proceedWithSave();
      return;
    }

    if (!form.invoiceFile && !form.invoiceAttachmentUrl) {
      form.setIsUploadConfirmationDialogOpen(true);
      return;
    }

    await submit.proceedWithSave();
  };

  // Product table columns
  const productColumns = useMemo(() => getProductTableColumns({
    editingRowId: table.editingRowId,
    editingData: table.editingData,
    updateEditingData: table.updateEditingData,
    startEditing: table.startEditing,
    saveRow: table.saveEditedRow,
    cancelEditing: table.cancelEditing,
    deleteRow: (rowId) => {
      form.setRowToDeleteId(rowId);
      form.setIsDeleteDialogOpen(true);
    },
    productOptions: data.productOptionsWithIds,
    onAddNewProduct: () => form.setIsNewProductModalOpen(true),
  }), [table.editingRowId, table.editingData, data.productOptionsWithIds]);

  // Calculate total amount for footer
  const calculateTotalAmount = () => {
    return table.sortedData.reduce((sum, row) => {
      return sum + table.calculateAmount(row);
    }, 0);
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px" }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: themeColors.textPrimary, fontSize: typography.headerSize }}
          >
            {form.isEditMode ? `${labels.orderDetails} (Editing ${form.receiptNumber})` : labels.orderDetails}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ marginTop: "16px", border: "0.5px solid #CBD4E1" }} />

      {/* Supplier Section */}
      <SupplierSection
        supplierName={form.supplierName}
        setSupplierName={form.setSupplierName}
        supplierSearchTerm={form.supplierSearchTerm}
        setSupplierSearchTerm={form.setSupplierSearchTerm}
        filteredSupplierOptions={data.filteredSupplierOptions}
        isSuppliersLoading={data.isSuppliersLoading}
        suppliersError={data.suppliersError}
        retryFetchSuppliers={data.fetchSupplierNames}
        onAddNewSupplier={() => form.setIsNewSupplierModalOpen(true)}
        poNumber={form.poNumber}
        setPoNumber={form.setPoNumber}
        invoiceDate={form.invoiceDate}
        setInvoiceDate={form.setInvoiceDate}
        invoiceNumber={form.invoiceNumber}
        setInvoiceNumber={(val: string) => {
          form.setInvoiceNumber(val);
          if (form.invoiceNumberError) form.setInvoiceNumberError('');
        }}
        invoiceNumberError={form.invoiceNumberError}
      />

      <Divider sx={{ marginTop: "10px", border: "0.3px solid #CBD4E14D" }} />

      {/* Product Search Section with Invoice Upload */}
      <ProductSearchSection
        findProductTerm={table.findProductTerm}
        setFindProductTerm={table.setFindProductTerm}
        autocompleteProductOptions={data.autocompleteProductOptions}
        filterProductOptions={data.filterProductOptions}
        isProductsLoading={data.isProductsLoading}
        onProductSelect={handleProductSelect}
        onAddNewProduct={() => form.setIsNewProductModalOpen(true)}
        invoiceFile={form.invoiceFile}
        invoiceFileName={form.invoiceFileName}
        invoiceAttachmentUrl={form.invoiceAttachmentUrl}
        isExistingFile={form.isExistingFile}
        fileInputRef={form.fileInputRef}
        handleFileChange={handleInvoiceFileChange}
        handleRemoveFile={form.handleRemoveFile}
      />

      {/* Invoice auto-fill: extraction progress + "needs your review" banner */}
      {extraction.isExtracting && (
        <Alert
          severity="info"
          icon={<CircularProgress size={18} />}
          sx={{ mt: 2, borderRadius: "12px" }}
        >
          {INVOICE_EXTRACTION.EXTRACTING}
        </Alert>
      )}
      {extraction.review && (
        <InvoiceReviewBanner
          review={extraction.review}
          onSupplierCandidate={extraction.applySupplierCandidate}
          onProductCandidate={extraction.applyProductCandidate}
          onAddNewProduct={() => form.setIsNewProductModalOpen(true)}
          onDismiss={extraction.dismissReview}
        />
      )}

      {/* Product Table */}
      <Box sx={{ 
        marginTop: "16px", 
        width: '100%', 
        overflowX: 'auto',
        '& .MuiTableCell-head': { 
          whiteSpace: 'normal', 
          lineHeight: 1.2, 
          height: 'auto',
          verticalAlign: 'bottom',
          padding: '8px 12px'
        }
      }}>
        <ReusableTable<PharmaTableRow>
          columns={productColumns}
          data={table.sortedData}
          selectedRows={[]}
          setSelectedRows={() => { }}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm={table.searchTerm}
          onSearchChange={table.handleSearchChange}
          showFilters={false}
          onShowFiltersToggle={() => { }}
          currentFilterKey={""}
          onFilterSelect={() => { }}
          emptyMessage="No products added yet"
          totalRows={table.sortedData.length}
          rowsPerPage={table.rowsPerPage}
          currentPage={table.currentPage}
          onPageChange={table.setCurrentPage}
          onSortRequest={table.handleSortRequest}
          sortConfig={table.sortConfig}
          disableFooterWrapper={true}
          footerContent={table.sortedData.length > 0 && table.currentPage === 1 ? (
            <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px' }} />
              <TableCell sx={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'Lexend', sans-serif", fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                Total:
              </TableCell>
              <TableCell sx={{ padding: '12px 12px', textAlign: 'left', fontFamily: "'Lexend', sans-serif", fontWeight: 600, fontSize: '16px', color: '#1A212B' }}>
                ₹{calculateTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell sx={{ padding: '12px 16px' }} />
            </TableRow>
          ) : undefined}
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
        <Box sx={{ display: "flex", gap: "12px" }}>
          <Button
            variant="outlined"
            disableRipple
            onClick={handleCancel}
            sx={{
              borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
              color: themeColors.cancelButtonBorder || "#27313F",
              backgroundColor: "transparent",
              height: "48px",
              width: "86px",
              borderRadius: "12px",
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              border: "2px solid",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "transparent",
                borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
                borderWidth: "2px",
              },
            }}
          >
            {orderLabels.cancelButton}
          </Button>
          <StandardButton
            variant="primary"
            size="large"
            disabled={!validateRequiredFields() || form.isSaving || submit.isSubmittingReceipt}
            onClick={form.isEditMode ? handleSubmitReceipt : handleProceedToPaymentClick}
            sx={{ height: "48px", width: "160px", fontSize: "12px" }}
          >
            {form.isSaving || submit.isSubmittingReceipt ? "Processing..." : form.isEditMode ? "Save" : "Proceed to Payment"}
          </StandardButton>
          {!form.isEditMode && (
            <StandardButton
              variant="secondary"
              size="large"
              disabled={!validateRequiredFields() || form.isSaving || submit.isSubmittingReceipt}
              onClick={handleSaveAndPayLaterClick}
              sx={{ height: "48px", width: "160px", fontSize: "12px", marginLeft: "10px" }}
            >
              {form.isSaving ? "Processing..." : "Save & Pay Later"}
            </StandardButton>
          )}
        </Box>

        {form.isEditMode && (
          <Button
            variant="contained"
            disableRipple
            disabled={form.isDeleting}
            onClick={submit.deleteReceipt}
            sx={{
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              border: "2px solid #EF4444",
              height: "48px",
              borderRadius: "12px",
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              textTransform: "none",
              minWidth: "140px",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#DC2626", borderColor: "#DC2626" },
              "&:disabled": { backgroundColor: "#6B7280", borderColor: "#6B7280", color: "#FFFFFF" },
            }}
          >
            {form.isDeleting ? (
              <CircularProgress size={16} color="inherit" />
            ) : form.deleteSuccess ? (
              "Deleted!"
            ) : (
              "Delete the full receipt"
            )}
          </Button>
        )}
      </Box>

      {/* Modals */}
      <NewProductModal
        open={form.isNewProductModalOpen}
        onClose={() => form.setIsNewProductModalOpen(false)}
        onProductAdded={() => {
          data.fetchAllProducts();
          setSnackbarMessage('Product added successfully!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }}
      />

      <NewSupplierModal
        isOpen={form.isNewSupplierModalOpen}
        onClose={() => form.setIsNewSupplierModalOpen(false)}
        onSubmit={handleSupplierSubmit}
      />

      {/* One-time drug-schedule attribution popup (schedule NULL only) */}
      <ScheduleAttributionModal
        open={pendingScheduleProduct !== null}
        productName={pendingScheduleProduct?.name || ''}
        saving={isSavingSchedule}
        onSelect={handleScheduleSelect}
        onCancel={handleScheduleCancel}
      />

      <ConfirmationDialog
        open={form.isDeleteDialogOpen}
        onClose={() => form.setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={
          form.rowToDeleteId
            ? `Are you sure you want to delete "${table.pharmaTableData.find(row => row.id === form.rowToDeleteId)?.productId || 'this product'}" from the table?`
            : "Are you sure you want to delete this product from the table?"
        }
        itemName={form.rowToDeleteId ? table.pharmaTableData.find(row => row.id === form.rowToDeleteId)?.productId : undefined}
      />

      <ConfirmationDialog
        open={form.isReceiptDeleteDialogOpen}
        onClose={() => form.setIsReceiptDeleteDialogOpen(false)}
        onConfirm={async () => {
          form.setIsReceiptDeleteDialogOpen(false);
          await submit.deleteReceipt();
        }}
        title="Delete Receipt"
        message="Are you sure you want to delete this entire receipt? This action cannot be undone."
      />

      <ConfirmationDialog
        open={form.isUploadConfirmationDialogOpen}
        onClose={() => form.setIsUploadConfirmationDialogOpen(false)}
        onConfirm={handleUploadConfirmationYes}
        onCancel={handleUploadConfirmationNo}
        title="Upload Invoice?"
        message="You haven't uploaded an invoice file. Would you like to upload one now?"
        confirmLabel="Yes, Upload"
        cancelLabel="No, Continue"
      />

      <ConfirmationDialog
        open={form.isProceedToPaymentDialogOpen}
        onClose={() => form.setIsProceedToPaymentDialogOpen(false)}
        onConfirm={async () => {
          form.setIsProceedToPaymentDialogOpen(false);
          await submit.handleProceedToPayment();
        }}
        title="Proceed to Payment"
        message="Save receipt and proceed to payment details?"
        confirmLabel="Proceed"
        cancelLabel="Cancel"
      />

      {/* Snackbars */}
      <Snackbar open={!!form.saveError} autoHideDuration={6000} onClose={() => form.setSaveError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => form.setSaveError(null)} severity="error" sx={{ width: '100%' }}>{form.saveError}</Alert>
      </Snackbar>

      <Snackbar open={form.saveSuccess} autoHideDuration={3000} onClose={() => form.setSaveSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => form.setSaveSuccess(false)} severity="success" sx={{ width: '100%' }}>Receipt submitted successfully!</Alert>
      </Snackbar>

      <Snackbar open={!!form.deleteError} autoHideDuration={6000} onClose={() => form.setDeleteError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => form.setDeleteError(null)} severity="error" sx={{ width: '100%' }}>{form.deleteError}</Alert>
      </Snackbar>

      <Snackbar open={form.deleteSuccess} autoHideDuration={3000} onClose={() => form.setDeleteSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => form.setDeleteSuccess(false)} severity="success" sx={{ width: '100%' }}>Receipt deleted successfully!</Alert>
      </Snackbar>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
      </Snackbar>
    </>
  );
};

export default OrderDetails;
