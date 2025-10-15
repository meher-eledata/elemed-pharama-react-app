import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  InputAdornment,
  MenuItem,
  Autocomplete,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { receiveApi, useSubmitReceiptMutation, useEditReceiptMutation } from "../../redux/slices/receiveApi";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { orderLabels } from "../../config/label/OrderDetail.labels";
import {
  themeColors,
  buttonSizes,
  typography,
  paymentMethods,
  paymentVendors,
} from "../../config/constants/OrderDetail.constants";
import TickMarkSvg from "../../assets/Right.svg";
import PlusIcon from "../../assets/PlusIcon.svg";
import { ReusableTable, TableColumn } from "../../components/PharmaTable";
import NewProductModal from "../../components/Modal/NewProduct/NewProductModal";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import DropDownIcon from "../../assets/DropDown.svg"; 
import { masterProducts, ProductMaster } from "../../data/masterData";

interface OrderDetailsProps {
  labels: typeof orderLabels;
}

export interface PharmaTableRow {
  id?: string;
  productId: string;
  qtyReceived: number;
  qtyFree: number;
  batch: string;
  pp: number;
  sp: number;
  mrp: number;
  cgst: number;
  sgst: number;
  igst: number;
  disc: number | string;
  margPercent: number | string;
  salesDiscPercent: number | string;
  isEditing?: boolean;
  transaction_number?: string;
  payment_vendor?: string;
  invoice_date?: string;
}

const CustomDropdownIcon = (props: any) => (
  <svg
    {...(props as any)}
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    style={{
      pointerEvents: "none",
      color: "#6B7280",
    }}
  >
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TickMarkIcon = (props: any) => (
  <svg
    {...(props as any)}
    width="16"
    height="16"
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

const OrderDetails: React.FC<OrderDetailsProps> = ({ labels }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitReceipt, { isLoading: isSubmittingReceipt }] = useSubmitReceiptMutation();
  const [editReceipt, { isLoading: isEditingReceipt }] = useEditReceiptMutation();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "productName", direction: "asc" });
  const [isNewProductModalOpen, setIsNewProductModalOpen] =
    useState<boolean>(false);

  const [findProductTerm, setFindProductTerm] = useState<string>("");
  
  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [isVendorFocused, setIsVendorFocused] = useState(false);
  const [isFindProductFocused, setIsFindProductFocused] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [paymentVendor, setPaymentVendor] = useState<string>("");
  const [supplierQuery, setSupplierQuery] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [transactionNumber, setTransactionNumber] = useState<string>("");

  const selectedSupplier = (location.state as any)?.selectedSupplier || "";
  const selectedPO = (location.state as any)?.selectedPO || "";
  const selectedOrder = (location.state as any)?.selectedOrder || null;
  const isEditMode = (location.state as any)?.isEditMode || false;
  const receiptId = (location.state as any)?.receiptId || null;
  const receiptNumber = (location.state as any)?.receiptNumber || "";
  const navigationTransactionNumber = (location.state as any)?.transactionNumber || "";
  const navigationPaymentVendor = (location.state as any)?.paymentVendor || "";
  const navigationInvoiceDate = (location.state as any)?.invoiceDate || "";
  
  // Initialize form fields based on edit mode or new order
  const [supplierName, setSupplierName] = useState<string>(
    isEditMode && selectedOrder ? selectedOrder.supplier : selectedSupplier
  );
  const [poNumber, setPoNumber] = useState<string>(
    isEditMode && selectedOrder ? selectedOrder.poNo : selectedPO
  );

  // Save functionality states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // Track original receipt lines for change detection
  const [originalReceiptLines, setOriginalReceiptLines] = useState<PharmaTableRow[]>([]);
  
  // Delete functionality states
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);

  // Start with empty table - rows will be added when products are selected
  const [pharmaTableData, setPharmaTableData] = useState<PharmaTableRow[]>([]);

  // State for tracking editing rows
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<PharmaTableRow>>({});
  
  // State to track if a product was selected from dropdown
  const [isProductSelected, setIsProductSelected] = useState<boolean>(false);
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);
  
  // State for receipt delete confirmation dialog
  const [isReceiptDeleteDialogOpen, setIsReceiptDeleteDialogOpen] = useState<boolean>(false);

  // Reusable input field styles
  const inputFieldStyles = {
    '& .MuiOutlinedInput-root': {
      height: '32px',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      '& fieldset': {
        borderColor: '#D1D5DB',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: '#9CA3AF',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3B82F6',
        borderWidth: '1px',
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '6px 8px',
      fontSize: '13px',
      color: '#374151',
    },
  };

  // Reusable number input field styles (includes spinner removal)
  const numberInputStyles = {
    ...inputFieldStyles,
    '& input[type=number]': {
      MozAppearance: 'textfield',
      WebkitAppearance: 'none',
      appearance: 'textfield'
    },
    '& input[type=number]::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    },
    '& input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    }
  };

  // Direct API state for supplier names
  const [supplierOptions, setSupplierOptions] = useState<{supplier_name: string, supplier_id: number}[]>([]);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState<boolean>(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  // API state for products by supplier
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Direct API call for supplier names
  const fetchSupplierNames = async () => {
    try {
      setIsSuppliersLoading(true);
      setSuppliersError(null);
      
      const response = await fetch('http://localhost:3000/api/receive/unique-supplier-names', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSupplierOptions(data);
    } catch (error) {
      console.error('Error fetching supplier names:', error);
      setSuppliersError(error instanceof Error ? error.message : 'Failed to fetch suppliers');
    } finally {
      setIsSuppliersLoading(false);
    }
  };

  // Function to fetch ALL products (not filtered by supplier)
  const fetchAllProducts = async () => {
    try {
      setIsProductsLoading(true);
      setProductsError(null);
      
      const response = await fetch('http://localhost:3000/api/receive/get-products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      console.log('All products API response data:', products);
      
      // Extract product names from the response - API returns array of [name, id] arrays
      const productNames = products
        .filter((product: any) => product && Array.isArray(product) && product.length >= 2)
        .map((product: any) => product[0]) // First element is the product name
        .filter((name: string) => name && name.trim() !== '');
      
      console.log('Extracted all product names:', productNames);
      setProductOptions(productNames);
    } catch (error) {
      console.error('Error fetching all products:', error);
      setProductsError(error instanceof Error ? error.message : 'Failed to fetch products');
      setProductOptions([]);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Retry function for failed API calls
  const retryFetchSuppliers = () => {
    fetchSupplierNames();
  };

  // Function to transform form data to API payload for NEW receipts
  const transformFormDataToApiPayload = () => {
    // Find supplier ID from supplier options
    const selectedSupplierData = supplierOptions.find(s => s.supplier_name === supplierName);
    const isExistingSupplier = selectedSupplierData && selectedSupplierData.supplier_id > 0;

    // Transform table data to lines format
    const lines = pharmaTableData.map((row, index) => ({
      product: row.productId,
      product_id: null, // Let backend handle product ID assignment
      received_qty: row.qtyReceived,
      free_qty: row.qtyFree,
      expiry_date: row.batch, // Using batch field for expiry date
      unit_price: row.pp,
      cgst: row.sp, // Using sp field for CGST
      sgst: row.mrp, // Using mrp field for SGST
      igst: row.cgst, // Using cgst field for IGST
      discount: typeof row.sgst === 'number' ? row.sgst : 0 // Using sgst field for discount
    }));

    const payload = {
      supplier_name: supplierName,
      // Only include supplier_id if it's an existing supplier
      ...(isExistingSupplier && { supplier_id: selectedSupplierData.supplier_id }),
      po_number: poNumber,
      payment_method: paymentMethod,
      payment_vendor: paymentVendor,
      transaction_number: transactionNumber,
      notes: "", // Add notes field if needed
      created_by: "meher", // You might want to get this from user context
      lines: lines
    };

    console.log('API Payload being sent:', payload);
    return payload;
  };

  // Function to detect changes between original and current data
  const detectChanges = () => {
    const originalIds = new Set(originalReceiptLines.map(row => row.id));
    const currentIds = new Set(pharmaTableData.map(row => row.id));
    
    // Helper function to check if an ID is a database ID (numeric) or a new product ID (timestamp)
    const isDatabaseId = (id: string | undefined) => {
      if (!id) return false;
      // Database IDs are numeric, new product IDs are timestamps (long numbers)
      return /^\d+$/.test(id) && parseInt(id) < 1000000000000; // Timestamps are > 1000000000000
    };
    
    // Find deleted lines (in original but not in current)
    const deleted = originalReceiptLines
      .filter(originalRow => !currentIds.has(originalRow.id))
      .map(row => ({ receipt_line_id: parseInt(row.id || '0') }));
    
    // Find added lines (in current but not in original, or new products with timestamp IDs)
    const added = pharmaTableData
      .filter(currentRow => {
        // If it's not in original IDs, it's either deleted and re-added, or truly new
        if (!originalIds.has(currentRow.id)) return true;
        // If it has a timestamp ID, it's a new product
        if (currentRow.id && !isDatabaseId(currentRow.id)) return true;
        return false;
      })
      .map(row => ({
        product: row.productId,
        product_id: 101, // This might need to be adjusted based on your data structure
        received_qty: row.qtyReceived,
        free_qty: row.qtyFree,
        expiry_date: row.batch,
        unit_price: row.pp,
        cgst: row.sp,
        sgst: row.mrp,
        igst: row.cgst,
        discount: typeof row.sgst === 'number' ? row.sgst : 0
      }));
    
    // Find edited lines (in both original and current, with database IDs, and with different values)
    const edited = pharmaTableData
      .filter(currentRow => {
        // Must be a database ID (not a new product)
        if (!isDatabaseId(currentRow.id)) return false;
        
        const originalRow = originalReceiptLines.find(orig => orig.id === currentRow.id);
        if (!originalRow) return false;
        
        // Check if any field has changed
        return (
          originalRow.productId !== currentRow.productId ||
          originalRow.qtyReceived !== currentRow.qtyReceived ||
          originalRow.qtyFree !== currentRow.qtyFree ||
          originalRow.batch !== currentRow.batch ||
          originalRow.pp !== currentRow.pp ||
          originalRow.sp !== currentRow.sp ||
          originalRow.mrp !== currentRow.mrp ||
          originalRow.cgst !== currentRow.cgst ||
          originalRow.sgst !== currentRow.sgst
        );
      })
      .map(row => ({
        receipt_line_id: parseInt(row.id || '0'),
        po_line_id: parseInt(row.id || '0'), // This might need to be adjusted based on your data structure
        batch_id: 1, // This might need to be adjusted based on your data structure
        product_id: 101, // This might need to be adjusted based on your data structure
        product_name: row.productId,
        received_qty: row.qtyReceived,
        free_qty: row.qtyFree,
        unit_price: row.pp.toString(),
        cgst: row.sp.toString(),
        sgst: row.mrp.toString(),
        igst: row.cgst.toString(),
        discount: (typeof row.sgst === 'number' ? row.sgst : 0).toString()
      }));

    return { deleted, added, edited };
  };

  // Function to transform form data to EDIT payload for existing receipts
  const transformFormDataToEditPayload = () => {
    // Find supplier ID from supplier options
    const selectedSupplierData = supplierOptions.find(s => s.supplier_name === supplierName);
    const supplierId = selectedSupplierData ? selectedSupplierData.supplier_id : 0;

    // Detect what actually changed
    const { deleted, added, edited } = detectChanges();

    const payload = {
      receipt_id: receiptId,
      po_id: parseInt(poNumber) || 1,
      supplier_name: supplierName,
      supplier_id: supplierId,
      po_number: poNumber,
      payment_method: paymentMethod,
      payment_vendor: paymentVendor,
      transaction_number: transactionNumber,
      notes: "",
      created_by: "meher",
      Deleted: deleted,
      Added: added,
      Edited: edited
    };

    console.log('Edit API Payload being sent:', payload);
    console.log('Changes detected:', { deleted: deleted.length, added: added.length, edited: edited.length });
    console.log('Original receipt lines:', originalReceiptLines);
    console.log('Current receipt lines:', pharmaTableData);
    return payload;
  };

  // Function to show receipt delete confirmation dialog
  const deleteReceipt = () => {
    if (!isEditMode || !receiptId) {
      setDeleteError('No receipt selected for deletion');
      return;
    }
    setIsReceiptDeleteDialogOpen(true);
  };

  // Function to confirm receipt deletion
  const handleConfirmReceiptDelete = async () => {
    if (!isEditMode || !receiptId) {
      setIsReceiptDeleteDialogOpen(false);
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(false);

      const response = await fetch(`http://localhost:3000/api/receive/delete-receipt/${receiptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Receipt deleted successfully');
      setDeleteSuccess(true);
      
      // Invalidate cache to refresh data
      dispatch(receiveApi.util.invalidateTags(['Receive']));
      
      setTimeout(() => {
        navigate('/receive/order-receive');
      }, 2000);

    } catch (error) {
      console.error('Error deleting receipt:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete receipt');
    } finally {
      setIsDeleting(false);
      setIsReceiptDeleteDialogOpen(false);
    }
  };

  const handleSubmitReceipt = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      if (!supplierName.trim()) {
        setSaveError('Please fill in the Supplier Name');
        setIsSaving(false);
        return;
      }
      
      if (!poNumber.trim()) {
        setSaveError('Please fill in the PO Number');
        setIsSaving(false);
        return;
      }
      
      if (pharmaTableData.length === 0) {
        setSaveError('Please add at least one product to the table');
        setIsSaving(false);
        return;
      }
      
      const incompleteProducts = pharmaTableData.filter(row => !isProductRowComplete(row));
      if (incompleteProducts.length > 0) {
        setSaveError('Please complete all required fields for products (Product Name and Quantity Received)');
        setIsSaving(false);
        return;
      }

      let result;
      
      if (isEditMode && receiptId) {
        // Use editReceipt API for existing receipts (Edit Receive Flow)
        const editPayload = transformFormDataToEditPayload();
        result = await editReceipt(editPayload).unwrap();
        console.log('Receipt updated successfully:', result);
      } else {
        // Use submitReceipt API for new receipts (Add Receive Flow)
        const submitPayload = transformFormDataToApiPayload();
        result = await submitReceipt(submitPayload).unwrap();
        console.log('Receipt submitted successfully:', result);
      }
      
      setSaveSuccess(true);
      
      // Reset form after successful save and navigate back to main page
      setTimeout(() => {
        setPharmaTableData([]);
        setFindProductTerm("");
        setEditingRowId(null);
        setEditingData({});
        setSupplierName("");
        setPoNumber("");
        setInvoiceDate("");
        setTransactionNumber("");
        setPaymentVendor("");
        setIsProductSelected(false);
        setSaveSuccess(false);
                navigate('/receive/order-receive');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting receipt:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to submit receipt';
      
      if (error?.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to add new product to table
  const addProductToTable = (productName: string) => {
    const newProduct: PharmaTableRow = {
      id: Date.now().toString(), // Simple ID generation
      productId: productName,
      qtyReceived: 0,
      qtyFree: 0,
      batch: "",
      pp: 0,
      sp: 0,
      mrp: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      disc: 0,
      margPercent: 0,
      salesDiscPercent: 0,
      isEditing: true, // Start in editing mode
    };

    setPharmaTableData(prev => [...prev, newProduct]);
    setEditingRowId(newProduct.id!);
    setEditingData(newProduct);
    // Reset the product selected state since we're clearing the field
    setIsProductSelected(false);
  };

  // Function to start editing a row
  const startEditing = (row: PharmaTableRow) => {
    setEditingRowId(row.id!);
    setEditingData({ ...row });
  };

  // Function to save edited row
  const saveRow = () => {
    if (editingRowId && editingData) {
      setPharmaTableData(prev => 
        prev.map(row => 
          row.id === editingRowId 
            ? { ...row, ...editingData, isEditing: false }
            : row
        )
      );
      setEditingRowId(null);
      setEditingData({});
    }
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  // Function to delete a row
  const deleteRow = (rowId: string) => {
    setRowToDeleteId(rowId);
    setIsDeleteDialogOpen(true);
  };

  // Function to confirm delete
  const handleConfirmDelete = () => {
    if (rowToDeleteId) {
      setPharmaTableData(prev => prev.filter(row => row.id !== rowToDeleteId));
      if (editingRowId === rowToDeleteId) {
        setEditingRowId(null);
        setEditingData({});
      }
    }
    setIsDeleteDialogOpen(false);
    setRowToDeleteId(null);
  };

  // Function to update editing data
  const updateEditingData = (field: keyof PharmaTableRow, value: string | number) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  };

  // Function to validate if all required fields are filled
  const validateRequiredFields = () => {
    // Check basic required fields
    if (!supplierName.trim()) {
      console.log('Validation failed: Supplier name is empty');
      return false;
    }
    if (!poNumber.trim()) {
      console.log('Validation failed: PO Number is empty');
      return false;
    }
    
    // Check if there's at least one product in the table
    if (pharmaTableData.length === 0) {
      console.log('Validation failed: No products in table');
      return false;
    }
    
    // Check if at least one product has essential fields filled (only Product Name and Quantity)
    const hasValidProducts = pharmaTableData.some(row => {
      const isValid = row.productId && row.productId.trim() !== '' && 
             row.qtyReceived && row.qtyReceived > 0;
      console.log('Product validation:', {
        productId: row.productId,
        qtyReceived: row.qtyReceived,
        batch: row.batch,
        pp: row.pp,
        isValid
      });
      return isValid;
    });
    
    console.log('Overall validation result:', hasValidProducts);
    return hasValidProducts;
  };

  // Function to check if a specific product row is complete
  const isProductRowComplete = (row: PharmaTableRow) => {
    return row.productId && row.productId.trim() !== '' && 
           row.qtyReceived && row.qtyReceived > 0;
  };

  // Fetch supplier names on component mount
  useEffect(() => {
    fetchSupplierNames();
  }, []);

  // Fetch all products on component mount (not filtered by supplier)
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Load existing receipt data when in edit mode
  useEffect(() => {
    if (isEditMode && receiptId) {
      fetchReceiptLines();
    }
  }, [isEditMode, receiptId]);

  // Function to fetch existing receipt lines
  const fetchReceiptLines = async () => {
    if (!receiptId) {
      console.log('No receiptId provided for fetchReceiptLines');
      return;
    }

    console.log('Fetching receipt lines for receiptId:', receiptId);

    try {
      const response = await fetch('http://localhost:3000/api/receive/get-receipt-lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receipt_id: receiptId })
      });

      console.log('Receipt lines API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const receiptLines = await response.json();
      console.log('Receipt lines API response data:', receiptLines);
      
      // Initialize transaction_number and payment_vendor from first receipt line if available
      if (receiptLines && receiptLines.length > 0) {
        const firstLine = receiptLines[0];
        if (firstLine.transaction_number) {
          setTransactionNumber(firstLine.transaction_number);
        } else if (navigationTransactionNumber) {
          setTransactionNumber(navigationTransactionNumber);
        }
        if (firstLine.payment_vendor) {
          setPaymentVendor(firstLine.payment_vendor);
        } else if (navigationPaymentVendor) {
          setPaymentVendor(navigationPaymentVendor);
        }
      } else {
        // Fallback to navigation state if no receipt lines
        if (navigationTransactionNumber) {
          setTransactionNumber(navigationTransactionNumber);
        }
        if (navigationPaymentVendor) {
          setPaymentVendor(navigationPaymentVendor);
        }
      }
      
      // Initialize invoice date from navigation state (since it's not in receipt lines)
      if (navigationInvoiceDate) {
        setInvoiceDate(navigationInvoiceDate);
      }
      
      // Transform API response to PharmaTableRow format
      const transformedLines: PharmaTableRow[] = receiptLines.map((line: any, index: number) => ({
        id: line.receipt_line_id?.toString() || line.id?.toString() || index.toString(),
        productId: line.product_name || line.product || `Product ID: ${line.product_id || 'Unknown'}`,
        qtyReceived: line.received_qty || 0,
        qtyFree: line.free_qty || 0,
        batch: line.expiry_date || '',
        pp: parseFloat(line.unit_price) || 0,
        sp: parseFloat(line.cgst) || 0,
        mrp: parseFloat(line.sgst) || 0,
        cgst: parseFloat(line.igst) || 0,
        sgst: parseFloat(line.discount) || 0,
        igst: 0,
        disc: 0,
        margPercent: 0,
        salesDiscPercent: 0,
        isEditing: false,
        transaction_number: line.transaction_number || '',
        payment_vendor: line.payment_vendor || '',
        invoice_date: line.invoice_date || navigationInvoiceDate || '',
      }));

      setPharmaTableData(transformedLines);
      // Store original data for change detection
      setOriginalReceiptLines(transformedLines);
    } catch (error) {
      console.error('Error fetching receipt lines:', error);
      // Set empty array on error
      setPharmaTableData([]);
      setOriginalReceiptLines([]);
    }
  };

  // Transform supplier options to extract supplier names
  const transformedSupplierOptions = useMemo(() => {
    if (!supplierOptions || supplierOptions.length === 0) return [];
    return supplierOptions.map((supplier) => supplier.supplier_name);
  }, [supplierOptions]);

  const pharmaTableColumns: TableColumn<PharmaTableRow>[] = [
    {
      key: "productId",
      header: orderLabels.productName,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            value={editingData.productId || ""}
            onChange={(e) => updateEditingData("productId", e.target.value)}
            variant="outlined"
            fullWidth
            sx={inputFieldStyles}
          />
        ) : (
          <span>{row.productId}</span>
        )
      ),
    },
    {
      key: "qtyReceived",
      header: orderLabels.receivedQty,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.qtyReceived || ""}
            onChange={(e) => updateEditingData("qtyReceived", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.qtyReceived}</span>
        )
      ),
    },
    {
      key: "qtyFree",
      header: orderLabels.freeQty,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.qtyFree || ""}
            onChange={(e) => updateEditingData("qtyFree", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.qtyFree}</span>
        )
      ),
    },
    {
      key: "batch",
      header: orderLabels.expiryDate,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={editingData.batch ? dayjs(editingData.batch, 'DD/MM/YYYY') : null}
              onChange={(newValue: Dayjs | null) => {
                const formattedDate = newValue ? newValue.format('DD/MM/YYYY') : '';
                updateEditingData("batch", formattedDate);
              }}
              minDate={dayjs()} // Disable past dates
              openTo="day"
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  placeholder: 'DD/MM/YYYY',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #9AA8BC',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                        borderRadius: '6px',
                      },
                      '&:hover': {
                        border: '2px solid #9AA8BC',
                        borderRadius: '6px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                          borderRadius: '6px',
                        },
                      },
                      '&.Mui-focused': {
                        border: '2px solid #9AA8BC',
                        borderRadius: '6px',
                        outline: 'none',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                          borderRadius: '6px',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#728197',
                      '&.Mui-focused': {
                        color: '#728197',
                      },
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#728197',
                      opacity: 1,
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#728197',
                      padding: '6px 8px',
                      fontSize: '13px',
                      lineHeight: '18px',
                      '&::placeholder': {
                        color: '#728197',
                        opacity: 1,
                      },
                    },
                    '& input::placeholder': {
                      color: '#728197',
                      opacity: 1,
                    },
                    '& input': {
                      color: '#728197',
                    },
                  },
                },
                popper: {
                  placement: 'bottom-start',
                  modifiers: [
                    {
                      name: 'flip',
                      enabled: false, // Disable automatic flipping to prevent opening upward
                    },
                    {
                      name: 'preventOverflow',
                      options: {
                        boundary: 'viewport',
                        altBoundary: true,
                      },
                    },
                  ],
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
        ) : (
          <span>{row.batch}</span>
        )
      ),
    },
    {
      key: "pp",
      header: orderLabels.unitPrice,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.pp || ""}
            onChange={(e) => updateEditingData("pp", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.pp}</span>
        )
      ),
    },
    {
      key: "sp",
      header: `${orderLabels.cgst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.sp || ""}
            onChange={(e) => updateEditingData("sp", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.sp}</span>
        )
      ),
    },
    {
      key: "mrp",
      header: `${orderLabels.sgst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.mrp || ""}
            onChange={(e) => updateEditingData("mrp", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.mrp}</span>
        )
      ),
    },
    {
      key: "cgst",
      header: `${orderLabels.igst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.cgst || ""}
            onChange={(e) => updateEditingData("cgst", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.cgst}</span>
        )
      ),
    },
    {
      key: "sgst",
      header: `${orderLabels.discount} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.sgst || ""}
            onChange={(e) => updateEditingData("sgst", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.sgst}</span>
        )
      ),
    },
    {
      key: "actions",
      header: orderLabels.actions,
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          {editingRowId === row.id ? (
            <>
              <IconButton
                size="small"
                onClick={saveRow}
                sx={{ 
                  padding: '4px',
                  color: '#10B981',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#059669'
                  }
                }}
              >
                <TickMarkIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={cancelEditing}
                sx={{ 
                  padding: '4px',
                  color: '#EF4444',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#DC2626'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={() => startEditing(row)}
                sx={{ 
                  padding: '4px',
                  color: '#6B7280',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#374151'
                  }
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => deleteRow(row.id!)}
                sx={{ 
                  padding: '4px',
                  color: '#EF4444',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#DC2626'
                  }
                }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      ),
    },
  ];

  const handleSortRequest = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      // Revert to default sorting instead of clearing
      setSortConfig({ key: "productName", direction: "asc" });
      return;
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...pharmaTableData];

    if (searchTerm.trim()) {
      sortableItems = sortableItems.filter(
        (item) =>
          item.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batch.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Always apply sorting - if no specific sort, use default
    const currentSortKey = sortConfig.key || 'productName';
    const currentDirection = sortConfig.key ? sortConfig.direction : 'asc';
    
    sortableItems.sort((a, b) => {
      const aValue = a[currentSortKey as keyof PharmaTableRow];
      const bValue = b[currentSortKey as keyof PharmaTableRow];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return currentDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return currentDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      return 0;
    });
    return sortableItems;
  }, [pharmaTableData, sortConfig, searchTerm]);

  const rowsPerPage = 5;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: themeColors.textPrimary,
            fontSize: typography.headerSize,
          }}
        >
          {isEditMode ? `${labels.orderDetails} (Editing ${receiptNumber})` : labels.orderDetails}
        </Typography>
      </Box>
      <Divider sx={{ marginTop: "16px", border: "0.5px solid #CBD4E1" }} />

      <Box sx={{ display: "flex", gap: "32px", marginTop: "10px" }}>
        {/* supplier field (UPDATED: Autocomplete to control clear icon visibility) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "275px",
            gap: "4px",
            height: "48px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#9AA8BC",
            }}
          >
            {orderLabels.supplierName}
          </Typography>
          <Autocomplete
            freeSolo
            options={isSuppliersLoading ? ["Loading suppliers..."] : transformedSupplierOptions}
            value={supplierName}
            onInputChange={(_, v) => setSupplierName(v)}
            onChange={(_, v) => {
              // Don't allow selection of loading option
              if (v !== "Loading suppliers...") {
                setSupplierName(v || "");
              }
            }}
            onFocus={() => setIsSupplierFocused(true)}
            onBlur={() => {
              // Add small delay to prevent dropdown from closing too quickly during loading
              setTimeout(() => {
                if (!isSuppliersLoading) {
                  setIsSupplierFocused(false);
                }
              }, 150);
            }}
            loading={isSuppliersLoading}
            disabled={isSuppliersLoading}
            isOptionEqualToValue={(option, value) => option === value}
            getOptionLabel={(option) => String(option)}
            disableClearable
            renderOption={(props, option) => {
              const isLoading = String(option) === "Loading suppliers...";
              return (
                <li 
                  {...props} 
                  key={String(option)}
                  style={{
                    ...props.style,
                    cursor: isLoading ? 'default' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    backgroundColor: isLoading ? '#f5f5f5' : 'transparent',
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    width: '100%',
                    padding: isLoading ? '8px 16px' : '0px',
                    fontStyle: isLoading ? 'italic' : 'normal'
                  }}>
                    {isLoading && <CircularProgress size={16} color="primary" />}
                    <span>{String(option)}</span>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  isSuppliersLoading 
                    ? "Loading suppliers..." 
                    : suppliersError 
                    ? "Error loading suppliers" 
                    : orderLabels.enterSupplierName
                }
                variant="outlined"
                fullWidth
                error={!!suppliersError}
                helperText={
                  suppliersError ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{suppliersError}</span>
                      <Button 
                        size="small" 
                        onClick={retryFetchSuppliers}
                        sx={{ 
                          minWidth: 'auto', 
                          padding: '2px 8px',
                          fontSize: '12px',
                          textTransform: 'none'
                        }}
                      >
                        Retry
                      </Button>
                    </Box>
                  ) : ""
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    height: "48px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#9AA8BC",
                    },
                    "&:hover fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#9AA8BC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#9AA8BC",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "Lexend",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {/* Loading spinner - show when loading */}
                      {isSuppliersLoading && (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      )}
                      
                      {/* Manually render the CloseIcon only if text is present and not loading */}
                      {supplierName && !isSuppliersLoading && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); setSupplierName(""); }}
                            sx={{ padding: 0, marginRight: '4px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}
                      
                      {/* Custom Dropdown Icon - show when not loading */}
                      {!isSuppliersLoading && (
                        <InputAdornment 
                          position="end" 
                          sx={{
                            marginRight: '8px', 
                            transform: 'translateY(0)' 
                          }}
                        >
                          <CustomDropdownIcon />
                        </InputAdornment>
                      )}
                      {/* Autocomplete's default toggle button (chevron) is rendered here if not handled by renderInput */}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* PO Number field (kept unchanged) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.poNumber}
          </Typography>

          <TextField 
            variant="outlined"
            fullWidth
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder={orderLabels.enterPoNumber}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                height: "48px",
                backgroundColor: "#FFFFFF",
                "& fieldset": {
                  borderColor: "#9AA8BC",
                },
                "&:hover fieldset": {
                  borderColor: "#9AA8BC",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#9AA8BC",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "Lexend",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
            }}
          />
        </Box>

        {/* Invoice Date field (UPDATED: DatePicker implementation) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.invoiceDate}
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={invoiceDate ? dayjs(invoiceDate, 'DD/MM/YYYY') : null}
              onChange={(newValue: Dayjs | null) => {
                const formattedDate = newValue ? newValue.format('DD/MM/YYYY') : '';
                setInvoiceDate(formattedDate);
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  placeholder: orderLabels.dateFormat,
                },
                popper: {
                  placement: 'bottom-start',
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
        
        {/* Payment method (UPDATED: Autocomplete for searchable dropdown) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.paymentMethod}
          </Typography>

          <Autocomplete
            freeSolo
            options={paymentMethods.filter((method) => method.toLowerCase().includes(paymentMethod.toLowerCase()))}
            value={paymentMethod}
            onInputChange={(_, v) => setPaymentMethod(v)}
            onChange={(_, v) => setPaymentMethod(v || "")}
            disableClearable
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select payment method"
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    height: "48px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#9AA8BC",
                    },
                    "&:hover fieldset": {
                      borderColor: "#9AA8BC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#9AA8BC",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "Lexend",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {/* Custom Dropdown Icon positioned at the very end */}
                      <InputAdornment 
                        position="end" 
                        sx={{ 
                          marginRight: '8px', 
                          transform: 'translateY(0)' 
                        }}
                      >
                        <CustomDropdownIcon />
                      </InputAdornment>
                      {/* Autocomplete's default toggle button (chevron) is rendered here if not handled by renderInput */}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Payment vendor field (UPDATED: Autocomplete to control clear icon visibility) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.paymentVendor}
          </Typography>

          <Autocomplete
            freeSolo
            options={paymentVendors.filter((b) => b.toLowerCase().startsWith(paymentVendor.toLowerCase()))}
            value={paymentVendor}
            onInputChange={(_, v) => setPaymentVendor(v)}
            onChange={(_, v) => setPaymentVendor(v || "")}
            onFocus={() => setIsVendorFocused(true)}
            onBlur={() => setIsVendorFocused(false)}
            // UPDATED: Disable the default clear button rendering (clearIcon)
            disableClearable
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={orderLabels.selectBankVendor}
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    height: "48px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#9AA8BC",
                    },
                    "&:hover fieldset": {
                      borderColor: "#9AA8BC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#9AA8BC",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "Lexend",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  // Manually placing the icons for better control of spacing
                  endAdornment: (
                    <>
                      {/* Manually render the CloseIcon only if text is present */}
                      {paymentVendor && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); setPaymentVendor(""); }}
                            sx={{ padding: 0, marginRight: '4px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}

                      {/* Custom Dropdown Icon positioned at the very end */}
                      <InputAdornment 
                        position="end" 
                        sx={{ 
                          marginRight: '8px', 
                          transform: 'translateY(0)' 
                        }}
                      >
                        <CustomDropdownIcon />
                      </InputAdornment>
                      {/* Autocomplete's default toggle button (chevron) is rendered here if not handled by renderInput */}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Transaction Number field (kept unchanged) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "275px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525E6F",
            }}
          >
            {orderLabels.transactionNumber}
          </Typography>
          <TextField
            variant="outlined"
            fullWidth
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                height: "48px",
                backgroundColor: "#FFFFFF",
                "& fieldset": { borderColor: "#9AA8BC" },
                "&:hover fieldset": { borderColor: "#9AA8BC" },
                "&.Mui-focused fieldset": { 
                  borderColor: "#9AA8BC",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "Lexend",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
            }}
            InputProps={{
              endAdornment: transactionNumber ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setTransactionNumber("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
        </Box>
      </Box>
      <Divider sx={{ marginTop: "10px", border: "0.3px solid #CBD4E14D" }} />

      {/* Find Product section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          marginTop: "24px",
          marginBottom: "24px",
          gap: "16px",
          width: "100%",
        }}
      >
        {/* Find Product row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.findProduct}
          </Typography>
          <Autocomplete
            key={isProductSelected ? 'selected' : 'not-selected'}
            freeSolo
            options={[
              ...(isProductsLoading ? ["Loading products..."] : productOptions.filter(option => option && typeof option === 'string')),
              orderLabels.addProducts,
            ]}
            value={findProductTerm}
            onInputChange={(_, v) => {
              console.log('Input changed:', v);
              setFindProductTerm(v);
              // Reset selected state when user starts typing
              if (v !== findProductTerm) {
                setIsProductSelected(false);
              }
            }}
            onChange={(_, v) => {
              if (v === orderLabels.addProducts) {
                setIsNewProductModalOpen(true);
                setFindProductTerm(""); // Clear field when opening modal
                return;
              }
              const value = (v as string) || "";
              if (value && value !== orderLabels.addProducts && value !== "Loading products...") {
                // Add product to table and immediately clear the input field
                addProductToTable(value);
                // Use setTimeout to ensure the clear happens after the selection
                setTimeout(() => {
                  setFindProductTerm("");
                }, 0);
              } else {
                setFindProductTerm(value);
              }
            }}
            onKeyDown={(e) => {
              // Allow adding custom products by pressing Enter
              if (e.key === 'Enter' && findProductTerm && findProductTerm !== orderLabels.addProducts) {
                e.preventDefault();
                addProductToTable(findProductTerm);
                // Use setTimeout to ensure the clear happens after adding
                setTimeout(() => {
                  setFindProductTerm("");
                }, 0);
              }
            }}
            onFocus={() => setIsFindProductFocused(true)}
            onBlur={() => setIsFindProductFocused(false)}
            // Disable the default clear button - we'll handle it manually
            disableClearable
            ListboxProps={{
              style: {
                maxHeight: '200px',
                overflowY: 'auto',
                paddingBottom: '0px',
              }
            }}
                renderOption={(props, option) => {
                  const isAddProduct = String(option) === orderLabels.addProducts;
              return (
                <li 
                  {...props} 
                  key={String(option)}
                  style={{
                    ...props.style,
                    backgroundColor: isAddProduct ? "#5C17E5" : "transparent",
                    color: isAddProduct ? "#ffffff" : "inherit",
                    fontWeight: isAddProduct ? "600" : "normal",
                    padding: isAddProduct ? "8px 12px" : "8px 16px",
                    borderRadius: isAddProduct ? "6px" : "0px",
                    margin: isAddProduct ? "2px 8px" : "0px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "14px",
                    minHeight: "auto",
                    lineHeight: "1.4",
                    position: isAddProduct ? "sticky" : "relative",
                    bottom: isAddProduct ? "0" : "auto",
                    zIndex: isAddProduct ? "10" : "1",
                  }}
                  onMouseEnter={(e) => {
                    if (isAddProduct) {
                      e.currentTarget.style.backgroundColor = "#4A14C7";
                    } else {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isAddProduct) {
                      e.currentTarget.style.backgroundColor = "#5C17E5";
                    } else {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {String(option)}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  isProductsLoading 
                    ? "Loading products..." 
                    : productsError 
                    ? "Error loading products" 
                    : orderLabels.search
                }
                variant="outlined"
                sx={{
                  width: "344px",
                  "& .MuiOutlinedInput-root": {
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    "& fieldset": { 
                      borderColor: "transparent",
                      display: "none",
                    },
                    "&:hover fieldset": { 
                      borderColor: "transparent",
                    },
                    "&.Mui-focused fieldset": { 
                      borderColor: "transparent",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                      border: "1px solid #D1D5DB",
                    },
                    "&:hover": {
                      border: "1px solid #D1D5DB",
                    },
                  },
                  "& .MuiInputBase-input": {
                    padding: "8px 12px",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "#6B7280",
                    "&::placeholder": {
                      color: "#9CA3AF",
                      opacity: 1,
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ marginLeft: "12px" }}>
                      <SearchIcon sx={{ color: "#9CA3AF", width: "16px", height: "16px" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {/* Manually render the CloseIcon only when a product was selected from dropdown */}
                      {isProductSelected && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setFindProductTerm(""); 
                              setIsProductSelected(false);
                            }}
                            sx={{ padding: 0, marginRight: '4px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}

                      {/* Custom Dropdown Icon positioned at the very end */}
                      <InputAdornment 
                        position="end" 
                        sx={{ 
                          marginRight: '8px', 
                          transform: 'translateY(0)' 
                        }}
                      >
                        <CustomDropdownIcon />
                      </InputAdornment>
                      {/* Autocomplete's default toggle button (chevron) is rendered here if not handled by renderInput */}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Extra search bar for edit mode - positioned under Find Product */}
        {isEditMode && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <TextField
              placeholder="Search for items in the table below..."
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              sx={{
                width: "344px",
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  "& fieldset": { 
                    borderColor: "transparent",
                    display: "none",
                  },
                  "&:hover fieldset": { 
                    borderColor: "#5C17E5",
                  },
                  "&.Mui-focused fieldset": { 
                    borderColor: "#5C17E5",
                    outline: "none",
                  },
                  "&.Mui-focused": {
                    outline: "none",
                    border: "3px solid #5C17E5",
                  },
                  "&:hover": {
                    border: "2px solid #5C17E5",
                  },
                },
                "& .MuiInputBase-input": {
                  padding: "8px 12px",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  color: "#6B7280",
                  "&::placeholder": {
                    color: "#9CA3AF",
                    opacity: 1,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ marginLeft: "12px" }}>
                    <SearchIcon sx={{ color: "#9CA3AF", width: "16px", height: "16px" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </Box>

      {/* Pharma Table */}
      <Box sx={{ 
        marginTop: "24px",
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          height: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#c1c1c1",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "#a8a8a8",
          },
        },
      }}>
        <ReusableTable
          columns={pharmaTableColumns}
          selectedRows={[]}
          setSelectedRows={() => {}}
          data={paginatedData}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey={""}
          onFilterSelect={() => {}}
          totalRows={sortedData.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      </Box>

      {/* Footer actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
        {/* Left side buttons */}
        <Box sx={{ display: "flex", gap: "12px" }}>
          <Button
            variant="outlined"
            disableRipple
            onClick={() => {
              // Clear all form data and table
              setPharmaTableData([]);
              setFindProductTerm("");
              setEditingRowId(null);
              setEditingData({});
              setSupplierName("");
              setPoNumber("");
              setInvoiceDate("");
              setTransactionNumber("");
              setPaymentVendor("");
              setIsProductSelected(false);
              
              // Navigate back to order-receive page
              navigate('/receive/order-receive');
            }}
            sx={{
              borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
              color: themeColors.cancelButtonBorder || "#27313F",
              backgroundColor: "transparent",
              "&:hover": { 
                backgroundColor: "transparent",
                borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
                color: themeColors.cancelButtonBorder || "#27313F",
                borderWidth: "2px",
              },
              "&:focus": {
                backgroundColor: "transparent",
                borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
                color: themeColors.cancelButtonBorder || "#27313F",
                borderWidth: "2px",
              },
              "&:active": {
                backgroundColor: "transparent",
                borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
                color: themeColors.cancelButtonBorder || "#27313F",
                borderWidth: "2px",
              },
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
                  borderWidth: "2px",
                },
              },
              height: "48px",
              width: "86px",
              borderRadius: "12px",
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "24px",
              border: "2px solid",
              textTransform: "none",
              "& .MuiButton-outlined": {
                border: "2px solid",
                "&:hover": {
                  border: "2px solid",
                },
              },
            }}
          >
            {orderLabels.cancelButton}
          </Button>
          <Button
            variant="contained"
            disableRipple
            disableElevation
            disabled={isSaving || !validateRequiredFields()}
            onClick={handleSubmitReceipt}
            sx={{
              backgroundColor: saveSuccess ? "#10B981" : isSaving ? "#6B7280" : "#5C17E5",
              "&:hover": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&:focus": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&:active": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&:focus-visible": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&.Mui-focusVisible": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "& .MuiTouchRipple-root": {
                display: "none",
              },
              "& .MuiButtonBase-root": {
                "&:active": {
                  backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                },
              },
              "& .MuiButton-contained": {
                "&:active": {
                  backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                },
              },
              "& .MuiButton-root": {
                "&:active": {
                  backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                },
              },
              "&::before": {
                display: "none",
              },
              "&::after": {
                display: "none",
              },
              borderRadius: "12px",
              width: "86px",
              height: "48px",
              fontFamily: "Lexend",
              textTransform: "none",
              boxShadow: "none",
              position: "relative",
              overflow: "hidden",
              "& *": {
                "&:active": {
                  backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
                },
              },
            }}
          >
            {isSaving ? (
              <CircularProgress size={16} color="inherit" />
            ) : saveSuccess ? (
              "Saved!"
            ) : (
              orderLabels.saveButton
            )}
          </Button>
        </Box>
        
        {/* Right side - Delete button (edit mode only) */}
        {isEditMode && (
          <Button
            variant="contained"
            disableRipple
            disabled={isDeleting}
            onClick={deleteReceipt}
            sx={{
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              border: "2px solid #EF4444",
              "&:hover": { 
                backgroundColor: "#DC2626",
                borderColor: "#DC2626",
                color: "#FFFFFF",
                borderWidth: "2px",
              },
              "&:focus": {
                backgroundColor: "#DC2626",
                borderColor: "#DC2626",
                color: "#FFFFFF",
                borderWidth: "2px",
              },
              "&:active": {
                backgroundColor: "#DC2626",
                borderColor: "#DC2626",
                color: "#FFFFFF",
                borderWidth: "2px",
              },
              "&:disabled": {
                backgroundColor: "#6B7280",
                borderColor: "#6B7280",
                color: "#FFFFFF",
              },
              height: "48px",
              borderRadius: "12px",
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "24px",
              textTransform: "none",
              minWidth: "140px",
              boxShadow: "none",
            }}
          >
            {isDeleting ? (
              <CircularProgress size={16} color="inherit" />
            ) : deleteSuccess ? (
              "Deleted!"
            ) : (
              "Delete the full receipt"
            )}
          </Button>
        )}
      </Box>

      <NewProductModal
        open={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onProductAdded={() => {
          // Refresh the product list when a new product is added
          fetchAllProducts();
        }}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!saveError}
        autoHideDuration={6000}
        onClose={() => setSaveError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSaveError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {saveError}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSaveSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Receipt submitted successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!deleteError}
        autoHideDuration={6000}
        onClose={() => setDeleteError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setDeleteError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {deleteError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={deleteSuccess}
        autoHideDuration={3000}
        onClose={() => setDeleteSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setDeleteSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Receipt deleted successfully!
        </Alert>
      </Snackbar>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product from the table?"
      />

      <ConfirmationDialog
        open={isReceiptDeleteDialogOpen}
        onClose={() => setIsReceiptDeleteDialogOpen(false)}
        onConfirm={handleConfirmReceiptDelete}
        title="Delete Receipt"
        message="Are you sure you want to delete the entire receipt? This action cannot be undone."
      />
    </>
  );
};

export default OrderDetails;