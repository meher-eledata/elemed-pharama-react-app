import React, { useState, useMemo, useEffect, startTransition } from "react";
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
  Tooltip,
} from "@mui/material";
import { PharmaDatePicker } from "../../components/Common";
import dayjs, { Dayjs } from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { receiveApi, useSubmitReceiptMutation, useEditReceiptMutation } from "../../redux/slices/receiveApi";
import { useGetBatchesForProductMutation } from "../../redux/slices/inventoryApi";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

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
import { masterProducts, ProductMaster } from "../../data/masterData";

interface OrderDetailsProps {
  labels: typeof orderLabels;
}

export interface PharmaTableRow {
  id?: string;
  productId: string;
  product_id?: number; 
  batchNumber?: string;
  batch_id?: number;
  po_line_id?: number; 
  qtyReceived: number;
  qtyFree: number;
  batch: Dayjs | null;
  expiryDate: Dayjs | null;
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
  const [getBatchesForProduct] = useGetBatchesForProductMutation();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "productName", direction: "asc" });
  const [isNewProductModalOpen, setIsNewProductModalOpen] =
    useState<boolean>(false);

  const [findProductTerm, setFindProductTerm] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState<string>("");
  
  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [isVendorFocused, setIsVendorFocused] = useState(false);
  const [isFindProductFocused, setIsFindProductFocused] = useState(false);
  const [isFindProductHovered, setIsFindProductHovered] = useState(false);
  const [isTransactionFocused, setIsTransactionFocused] = useState(false);
  const [isTransactionHovered, setIsTransactionHovered] = useState(false);

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
  
  const [supplierName, setSupplierName] = useState<string>(
    (isEditMode && selectedOrder ? selectedOrder.supplier : selectedSupplier) || ""
  );
  const [poNumber, setPoNumber] = useState<string>(
    isEditMode && selectedOrder ? selectedOrder.poNo : selectedPO
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  const [originalReceiptLines, setOriginalReceiptLines] = useState<PharmaTableRow[]>([]);
  
  const [originalFormValues, setOriginalFormValues] = useState({
    supplierName: '',
    poNumber: '',
    invoiceDate: '',
    transactionNumber: '',
    paymentVendor: '',
    paymentMethod: 'Cash',
  });
  
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);

  const [pharmaTableData, setPharmaTableData] = useState<PharmaTableRow[]>([]);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<PharmaTableRow>>({});
  
  const [isProductSelected, setIsProductSelected] = useState<boolean>(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);
  
  const [isReceiptDeleteDialogOpen, setIsReceiptDeleteDialogOpen] = useState<boolean>(false);

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
        borderColor: '#9AA8BC',
        borderWidth: '1px',
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '6px 8px',
      fontSize: '13px',
      color: '#374151',
    },
  };

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

  const [supplierOptions, setSupplierOptions] = useState<{supplier_name: string, supplier_id: number}[]>([]);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState<boolean>(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [productOptionsWithIds, setProductOptionsWithIds] = useState<{name: string, id: number}[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const autocompleteOptions = useMemo(() => {
    if (isProductsLoading) {
      return ["Loading products..."];
    }
    const validOptions = productOptions.filter(option => option && typeof option === 'string');
    return [...validOptions, orderLabels.addProducts];
  }, [productOptions, isProductsLoading]);

  const filterOptions = useMemo(() => {
    return (options: string[], state: any) => {
      const inputValue = state.inputValue.toLowerCase().trim();
      if (!inputValue) {
        const uniqueOptions = Array.from(new Set(options));
        return uniqueOptions;
      }
      
      const filtered = options.filter(option => {
        const optionStr = String(option).toLowerCase();
        return optionStr.includes(inputValue) || option === orderLabels.addProducts || option === "Loading products...";
      });
      
      const uniqueFiltered = Array.from(new Set(filtered));
      return uniqueFiltered;
    };
  }, []);

  const fetchSupplierNames = async () => {
    try {
      setIsSuppliersLoading(true);
      setSuppliersError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/receive/unique-supplier-names`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Normalize the response - handle both {supplier_name, supplier_id} and {supplier_name, id} formats
      const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
        supplier_name: item.supplier_name || item.name || '',
        supplier_id: item.supplier_id || item.id || 0
      })) : [];
      console.log('Fetched suppliers:', normalizedData.slice(0, 5)); // Log first 5 for debugging
      setSupplierOptions(normalizedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch suppliers';
      setSuppliersError(errorMessage);
      setSupplierOptions([]);
    } finally {
      startTransition(() => {
        setIsSuppliersLoading(false);
      });
    }
  };

  const fetchAllProducts = async () => {
    try {
      setIsProductsLoading(true);
      setProductsError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/receive/get-products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      
      const productData = products
        .filter((product: any) => product && Array.isArray(product) && product.length >= 2)
        .map((product: any) => ({
          name: product[0],
          id: product[1]
        }))
        .filter((product: {name: string, id: number}) => product.name && product.name.trim() !== '' && product.id);
      
      setProductOptions(productData.map((p: {name: string; id: number}) => p.name) as string[]);
      setProductOptionsWithIds(productData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      setProductsError(errorMessage);
      setProductOptions([]);
    } finally {
      startTransition(() => {
        setIsProductsLoading(false);
      });
    }
  };

  const retryFetchSuppliers = () => {
    fetchSupplierNames();
  };

  const transformFormDataToApiPayload = () => {
    // Find supplier with case-insensitive matching
    const normalize = (str: string) => str.trim().toLowerCase();
    const normalizedSupplierName = normalize(supplierName);
    const selectedSupplierData = supplierOptions.find(s => 
      normalize(s.supplier_name) === normalizedSupplierName
    );
    const isExistingSupplier = selectedSupplierData && selectedSupplierData.supplier_id > 0;

    // Debug logging
    console.log('Supplier lookup:', {
      supplierName,
      normalizedSupplierName,
      supplierOptionsCount: supplierOptions.length,
      selectedSupplierData,
      isExistingSupplier
    });

    const getProductIdFromName = (productName: string): number | null => {
      if (!productName || !productOptionsWithIds || productOptionsWithIds.length === 0) {
        return null;
      }
      
      const normalize = (str: string) => str.trim().toLowerCase();
      const normalizedProductName = normalize(productName);
      
      let product = productOptionsWithIds.find(p => normalize(p.name) === normalizedProductName);
      
      if (!product) {
        product = productOptionsWithIds.find(p => 
          normalize(p.name).includes(normalizedProductName) || 
          normalizedProductName.includes(normalize(p.name))
        );
      }
      
      return product ? product.id : null;
    };

    const lines = pharmaTableData.map((row, index) => {
      const productId = getProductIdFromName(row.productId);
      
      // Format expiry_date to ISO format (YYYY-MM-DD) as expected by backend
      // Always provide a value - use today's date as fallback if not provided
      let expiryDateFormatted: string;
      if (row.expiryDate) {
        if (dayjs.isDayjs(row.expiryDate) && row.expiryDate.isValid()) {
          expiryDateFormatted = row.expiryDate.format('YYYY-MM-DD');
        } else if (typeof row.expiryDate === 'string') {
          // Try to parse if it's a string
          const parsed = dayjs(row.expiryDate);
          if (parsed.isValid()) {
            expiryDateFormatted = parsed.format('YYYY-MM-DD');
          } else {
            // Fallback to today's date if parsing fails
            expiryDateFormatted = dayjs().format('YYYY-MM-DD');
          }
        } else {
          // Fallback to today's date
          expiryDateFormatted = dayjs().format('YYYY-MM-DD');
        }
      } else {
        // Fallback to today's date if no expiry date provided
        expiryDateFormatted = dayjs().format('YYYY-MM-DD');
      }

      const line: {
        product: string;
        product_id: number | null;
        batch_number: string;
        received_qty: number;
        free_qty: number;
        expiry_date: string;
        unit_price: number;
        cgst: number;
        sgst: number;
        igst: number;
        discount: number;
      } = {
        product: row.productId,
        product_id: productId,
        batch_number: row.batchNumber || "",
        received_qty: Number(row.qtyReceived) || 0,
        free_qty: Number(row.qtyFree) || 0,
        expiry_date: expiryDateFormatted,
        unit_price: Number(row.pp) || 0,
        cgst: Number(row.cgst) || 0,
        sgst: Number(row.sgst) || 0,
        igst: Number(row.igst) || 0,
        discount: Number(row.disc) || 0
      };
      return line;
    });

    // Format invoice_date to ISO string if provided, otherwise omit it
    let formattedInvoiceDate: string | undefined;
    if (invoiceDate && invoiceDate.trim()) {
      const parsedDate = dayjs(invoiceDate, 'DD/MM/YYYY');
      if (parsedDate.isValid()) {
        formattedInvoiceDate = parsedDate.toISOString();
      }
    }

    // Validate that we have a valid supplier_id before proceeding
    if (!isExistingSupplier || !selectedSupplierData?.supplier_id || selectedSupplierData.supplier_id <= 0) {
      console.error('Supplier validation failed:', {
        supplierName,
        selectedSupplierData,
        supplierOptions: supplierOptions.slice(0, 5) // Log first 5 for debugging
      });
      throw new Error(`Supplier "${supplierName}" not found. Please select a supplier from the dropdown.`);
    }

    const payload: {
      supplier_name: string;
      supplier_id: number;
      po_number: string;
      payment_method: string;
      payment_vendor: string;
      transaction_number: string;
      invoice_date?: string;
      notes: string;
      created_by: string;
      lines: typeof lines;
    } = {
      supplier_name: supplierName.trim(),
      supplier_id: selectedSupplierData.supplier_id,
      po_number: poNumber.trim(),
      payment_method: paymentMethod || 'Cash',
      payment_vendor: paymentVendor.trim(),
      transaction_number: transactionNumber.trim(),
      ...(formattedInvoiceDate && { invoice_date: formattedInvoiceDate }),
      notes: "",
      created_by: "meher",
      lines: lines
    };

    // Debug: Log the payload being sent
    console.log('Submitting receipt payload:', JSON.stringify(payload, null, 2));

    return payload;
  };

  const detectChanges = () => {
    const originalIds = new Set(originalReceiptLines.map(row => row.id));
    const currentIds = new Set(pharmaTableData.map(row => row.id));
    
    const isDatabaseId = (id: string | undefined) => {
      if (!id) return false;
      return /^\d+$/.test(id) && parseInt(id) < 1000000000000;
    };

    const getProductIdFromName = (productName: string): number | null => {
      if (!productName || !productOptionsWithIds || productOptionsWithIds.length === 0) {
        return null;
      }
      
      const normalize = (str: string) => str.trim().toLowerCase();
      const normalizedProductName = normalize(productName);
      
      let product = productOptionsWithIds.find(p => normalize(p.name) === normalizedProductName);
      
      if (!product) {
        product = productOptionsWithIds.find(p => 
          normalize(p.name).includes(normalizedProductName) || 
          normalizedProductName.includes(normalize(p.name))
        );
      }
      
      return product ? product.id : null;
    };

    const formatExpiryDate = (row: PharmaTableRow): string => {
      if (row.expiryDate && dayjs.isDayjs(row.expiryDate) && row.expiryDate.isValid()) {
        // Format as ISO (YYYY-MM-DD) to match backend format and new receipt submission
        return row.expiryDate.format('YYYY-MM-DD');
      }
      return '';
    };
    
    const deleted = originalReceiptLines
      .filter(originalRow => !currentIds.has(originalRow.id))
      .map(row => ({ receipt_line_id: parseInt(row.id || '0') }));
    
    const added = pharmaTableData
      .filter(currentRow => {
        if (!originalIds.has(currentRow.id)) return true;
        if (currentRow.id && !isDatabaseId(currentRow.id)) return true;
        return false;
      })
      .map(row => {
        const productId = row.product_id || getProductIdFromName(row.productId);
        
        return {
          product: row.productId,
          product_id: productId || 0,
          batch_number: row.batchNumber || '',
          received_qty: row.qtyReceived,
          free_qty: row.qtyFree,
          expiry_date: formatExpiryDate(row),
          unit_price: row.pp,
          cgst: row.cgst,
          sgst: row.sgst,
          igst: row.igst,
          discount: typeof row.disc === 'number' ? row.disc : 0
        };
      });
    
    const edited = pharmaTableData
      .filter(currentRow => {
        if (!isDatabaseId(currentRow.id)) return false;
        
        const originalRow = originalReceiptLines.find(orig => orig.id === currentRow.id);
        if (!originalRow) return false;
        
        const expiryDateChanged = 
          (originalRow.expiryDate === null && currentRow.expiryDate !== null) ||
          (originalRow.expiryDate !== null && currentRow.expiryDate === null) ||
          (originalRow.expiryDate && currentRow.expiryDate && 
           !originalRow.expiryDate.isSame(currentRow.expiryDate, 'day'));
        
        return (
          originalRow.productId !== currentRow.productId ||
          originalRow.qtyReceived !== currentRow.qtyReceived ||
          originalRow.qtyFree !== currentRow.qtyFree ||
          originalRow.pp !== currentRow.pp ||
          originalRow.cgst !== currentRow.cgst ||
          originalRow.sgst !== currentRow.sgst ||
          originalRow.igst !== currentRow.igst ||
          originalRow.disc !== currentRow.disc ||
          expiryDateChanged
        );
      })
      .map(row => {
        const originalRow = originalReceiptLines.find(orig => orig.id === row.id);
        const productId = row.product_id || originalRow?.product_id || getProductIdFromName(row.productId);
        
        // Format expiry_date - use empty string if not provided (backend may handle this)
        const expiryDateFormatted = formatExpiryDate(row);
        
        return {
          receipt_line_id: parseInt(row.id || '0'),
          po_line_id: row.po_line_id || originalRow?.po_line_id || 0,
          batch_id: row.batch_id || originalRow?.batch_id || 0,
          batch_number: row.batchNumber || originalRow?.batchNumber || '',
          product_id: productId || 0,
          product_name: row.productId,
          received_qty: row.qtyReceived,
          free_qty: row.qtyFree,
          expiry_date: expiryDateFormatted,
          unit_price: row.pp.toString(),
          cgst: row.cgst.toString(),
          sgst: row.sgst.toString(),
          igst: row.igst.toString(),
          discount: (typeof row.disc === 'number' ? row.disc : 0).toString()
        };
      });

    return { deleted, added, edited };
  };

  const transformFormDataToEditPayload = () => {
    const selectedSupplierData = supplierOptions.find(s => s.supplier_name === supplierName);
    const supplierId = selectedSupplierData ? selectedSupplierData.supplier_id : 0;

    const { deleted, added, edited } = detectChanges();

    // Format invoice_date to ISO string if provided, otherwise omit it
    let formattedInvoiceDate: string | undefined;
    if (invoiceDate && invoiceDate.trim()) {
      const parsedDate = dayjs(invoiceDate, 'DD/MM/YYYY');
      if (parsedDate.isValid()) {
        formattedInvoiceDate = parsedDate.toISOString();
      }
    }

    const payload = {
      receipt_id: receiptId,
      po_id: parseInt(poNumber) || 1,
      supplier_name: supplierName,
      supplier_id: supplierId,
      po_number: poNumber,
      payment_method: paymentMethod,
      payment_vendor: paymentVendor,
      transaction_number: transactionNumber,
      ...(formattedInvoiceDate && { invoice_date: formattedInvoiceDate }),
      notes: "",
      created_by: "meher",
      Deleted: deleted,
      Added: added,
      Edited: edited
    };

    return payload;
  };

  const deleteReceipt = () => {
    if (!isEditMode || !receiptId) {
      setDeleteError('No receipt selected for deletion');
      return;
    }
    setIsReceiptDeleteDialogOpen(true);
  };

  const handleConfirmReceiptDelete = async () => {
    if (!isEditMode || !receiptId) {
      setIsReceiptDeleteDialogOpen(false);
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(false);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/receive/delete-receipt/${receiptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setDeleteSuccess(true);
      
      dispatch(receiveApi.util.invalidateTags(['Receive']));
      
      setTimeout(() => {
        navigate('/receive/order-receive');
      }, 2000);

    } catch (error) {
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
        const editPayload = transformFormDataToEditPayload();
        result = await editReceipt(editPayload).unwrap();
      } else {
        let submitPayload;
        try {
          submitPayload = transformFormDataToApiPayload();
        } catch (validationError: any) {
          setSaveError(validationError.message || 'Invalid form data. Please ensure supplier is selected from dropdown.');
          setIsSaving(false);
          return;
        }
        
        try {
          result = await submitReceipt(submitPayload).unwrap();
        } catch (rtkError) {
          
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/';
          const response = await fetch(`${apiBaseUrl}receive/submit-receipt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submitPayload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          result = await response.json();
        }
      }
      
      if (!isEditMode) {
        const receiptData = {
          poNumber: poNumber,
          supplierName: supplierName,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('lastReceiptData', JSON.stringify(receiptData));
      }
      
      setSaveSuccess(true);
      
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
      let errorMessage = 'Failed to submit receipt';
      
      if (error?.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (Array.isArray(error.data.errors) && error.data.errors.length > 0) {
          errorMessage = error.data.errors[0];
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status) {
        errorMessage = `Server error (${error.status}): ${error.status === 404 ? 'Endpoint not found' : error.status === 500 ? 'Internal server error' : 'Unknown error'}`;
      }
      
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const addProductToTable = async (productName: string) => {
    const getProductIdFromName = (name: string): number | null => {
      if (!name || !productOptionsWithIds || productOptionsWithIds.length === 0) {
        return null;
      }
      const normalize = (str: string) => str.trim().toLowerCase();
      const normalizedName = normalize(name);
      let product = productOptionsWithIds.find(p => normalize(p.name) === normalizedName);
      if (!product) {
        product = productOptionsWithIds.find(p => 
          normalize(p.name).includes(normalizedName) || 
          normalizedName.includes(normalize(p.name))
        );
      }
      return product ? product.id : null;
    };

    const resolvedProductId = getProductIdFromName(productName);
    
    const productMRP = 0;
    const productSellingPrice = 0;
    
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
      sp: productSellingPrice || 0,
      mrp: productMRP || 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      disc: 0,
      margPercent: 0,
      salesDiscPercent: 0,
      isEditing: true,
      invoice_date: invoiceDate || '',
      transaction_number: transactionNumber || '',
      payment_vendor: paymentVendor || '',
    };

    setPharmaTableData(prev => [...prev, newProduct]);
    setEditingRowId(newProduct.id!);
    setEditingData(newProduct);
    setIsProductSelected(false);
  };

  const startEditing = (row: PharmaTableRow) => {
    setEditingRowId(row.id!);
    setEditingData({ 
      ...row,
      batchNumber: row.batchNumber || '', // Ensure batchNumber is included
      expiryDate: row.expiryDate || null, // Explicitly ensure expiryDate is copied (can be null)
    });
  };

  const saveRow = () => {
    if (editingRowId && editingData) {
      // Convert empty strings to 0 for numeric fields
      const cleanedData: any = { ...editingData };
      if (cleanedData.cgst === "" || cleanedData.cgst === null || cleanedData.cgst === undefined) cleanedData.cgst = 0;
      if (cleanedData.sgst === "" || cleanedData.sgst === null || cleanedData.sgst === undefined) cleanedData.sgst = 0;
      if (cleanedData.igst === "" || cleanedData.igst === null || cleanedData.igst === undefined) cleanedData.igst = 0;
      if (cleanedData.disc === "" || cleanedData.disc === null || cleanedData.disc === undefined) cleanedData.disc = 0;
      
      setPharmaTableData(prev => 
        prev.map(row => 
          row.id === editingRowId 
            ? { ...row, ...cleanedData, isEditing: false }
            : row
        )
      );
      setEditingRowId(null);
      setEditingData({});
    }
  };

  const cancelEditing = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const deleteRow = (rowId: string) => {
    setRowToDeleteId(rowId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (rowToDeleteId) {
      const rowToDelete = pharmaTableData.find(row => row.id === rowToDeleteId);
      setPharmaTableData(prev => prev.filter(row => row.id !== rowToDeleteId));
      if (editingRowId === rowToDeleteId) {
        setEditingRowId(null);
        setEditingData({});
      }
      setFindProductTerm("");
      setIsProductSelected(false);
    }
    setIsDeleteDialogOpen(false);
    setRowToDeleteId(null);
  };

  const updateEditingData = (field: keyof PharmaTableRow, value: string | number | Dayjs | null) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  };

  const validateRequiredFields = () => {
    if (!supplierName.trim()) {
      return false;
    }
    if (!poNumber.trim()) {
      return false;
    }
    
    if (pharmaTableData.length === 0) {
      return false;
    }
    
    const hasValidProducts = pharmaTableData.some(row => {
      const isValid = row.productId && row.productId.trim() !== '' && 
             row.qtyReceived && row.qtyReceived > 0;
      return isValid;
    });
    
    return hasValidProducts;
  };

  const isProductRowComplete = (row: PharmaTableRow) => {
    const hasProductName = row.productId && row.productId.trim() !== '';
    const hasValidQuantity = row.qtyReceived && row.qtyReceived > 0;
    
    return hasProductName && hasValidQuantity;
  };

  const hasFormChanges = useMemo(() => {
    if (!isEditMode) {
      return true;
    }

    const formFieldsChanged = 
      supplierName !== originalFormValues.supplierName ||
      poNumber !== originalFormValues.poNumber ||
      invoiceDate !== originalFormValues.invoiceDate ||
      transactionNumber !== originalFormValues.transactionNumber ||
      paymentVendor !== originalFormValues.paymentVendor ||
      paymentMethod !== originalFormValues.paymentMethod;

    const tableDataChanged = JSON.stringify(pharmaTableData) !== JSON.stringify(originalReceiptLines);

    return formFieldsChanged || tableDataChanged;
  }, [
    isEditMode,
    supplierName,
    poNumber,
    invoiceDate,
    transactionNumber,
    paymentVendor,
    paymentMethod,
    pharmaTableData,
    originalFormValues,
    originalReceiptLines
  ]);

  useEffect(() => {
    const styleId = 'order-details-input-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Target dynamically generated MUI TextField classes */
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root,
        .MuiFormControl-root.MuiTextField-root .MuiOutlinedInput-root {
          border-radius: 18px !important;
        }
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root fieldset,
        .MuiFormControl-root.MuiTextField-root .MuiOutlinedInput-root fieldset {
          border-radius: 18px !important;
          border-color: #D1D5DB !important;
        }
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root:hover fieldset,
        .MuiFormControl-root.MuiTextField-root .MuiOutlinedInput-root:hover fieldset {
          border-color: #D1D5DB !important;
          border-radius: 18px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    fetchSupplierNames();
  }, []);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const autocompleteElement = document.querySelector('[data-product-search]');
      const popperElement = document.querySelector('.MuiAutocomplete-popper');
      
      if (autocompleteElement && autocompleteElement.contains(target)) {
        return;
      }
      if (popperElement && popperElement.contains(target)) {
        return;
      }
      
      setIsFindProductFocused(false);
      setIsFindProductHovered(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isEditMode && receiptId) {
      fetchReceiptLines();
    }
  }, [isEditMode, receiptId]);

  const fetchReceiptLines = async () => {
    if (!receiptId) {
      return;
    }


    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/receive/get-receipt-lines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receipt_id: receiptId })
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const receiptLinesData = await response.json();
      const receiptLines = Array.isArray(receiptLinesData) ? receiptLinesData : [];
      
      // NOTE: The backend API /receive/get-receipt-lines does NOT return expiry_date
      // This is a backend issue that should be fixed. As a workaround, we'll try to fetch
      // expiry dates from the batch table using batch_number and product_id
      
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
        // Auto-populate batch number form field from first receipt line
        if (firstLine.batch_number) {
          setBatchNumber(firstLine.batch_number);
        }
      } else {
        if (navigationTransactionNumber) {
          setTransactionNumber(navigationTransactionNumber);
        }
        if (navigationPaymentVendor) {
          setPaymentVendor(navigationPaymentVendor);
        }
      }
      
      if (navigationInvoiceDate && navigationInvoiceDate.trim() !== '') {
        setInvoiceDate(navigationInvoiceDate);
      }
      
      // Workaround: Fetch expiry dates from batches since backend doesn't return them
      // Group lines by product_id to minimize API calls
      const productBatchMap = new Map<string, { product_id: number; batch_number: string }>();
      receiptLines.forEach((line: any) => {
        if (line.product_id && line.batch_number) {
          const key = `${line.product_id}_${line.batch_number}`;
          if (!productBatchMap.has(key)) {
            productBatchMap.set(key, { product_id: line.product_id, batch_number: line.batch_number });
          }
        }
      });

      // Fetch batches for each unique product to get expiry dates
      const batchExpiryMap = new Map<string, string | null>();
      await Promise.all(
        Array.from(productBatchMap.values()).map(async ({ product_id, batch_number }) => {
          try {
            const result = await getBatchesForProduct({ product_id }).unwrap();
            const matchingBatch = result.batches?.find(
              (batch: any) => String(batch.batch_number) === String(batch_number)
            );
            if (matchingBatch?.expiry_date) {
              batchExpiryMap.set(`${product_id}_${batch_number}`, matchingBatch.expiry_date);
            }
          } catch (error) {
            console.warn(`Failed to fetch batches for product ${product_id}:`, error);
          }
        })
      );

      const transformedLines: PharmaTableRow[] = receiptLines.map((line: any, index: number) => {
        // Try to get expiry_date from batch lookup first, then from line data
        const batchKey = line.product_id && line.batch_number ? `${line.product_id}_${line.batch_number}` : null;
        const expiryDateFromBatch = batchKey ? batchExpiryMap.get(batchKey) : null;
        const expiryDateRaw = expiryDateFromBatch || line.expiry_date || line.expiryDate || line.expiry || null;
        
        const expiryDateValue = (expiryDateRaw !== null && expiryDateRaw !== undefined && expiryDateRaw !== '' && expiryDateRaw !== 'null' && expiryDateRaw !== 'undefined') 
          ? (() => {
              // Try parsing with multiple formats - backend might return ISO (YYYY-MM-DD) or DD/MM/YYYY
              let parsed = dayjs(expiryDateRaw, 'YYYY-MM-DD', true); // Try ISO format first
              if (!parsed.isValid()) {
                parsed = dayjs(expiryDateRaw, 'DD/MM/YYYY', true); // Try DD/MM/YYYY
              }
              if (!parsed.isValid()) {
                parsed = dayjs(expiryDateRaw, 'MM/DD/YYYY', true); // Try MM/DD/YYYY
              }
              if (!parsed.isValid()) {
                parsed = dayjs(expiryDateRaw); // Try auto-parsing
              }
              return parsed.isValid() ? parsed : null;
            })()
          : null;
        
        return {
          id: line.receipt_line_id?.toString() || line.id?.toString() || index.toString(),
          productId: line.product_name || line.product || `Product ID: ${line.product_id || 'Unknown'}`,
          product_id: line.product_id ? Number(line.product_id) : undefined,
          batchNumber: line.batch_number || '',
          batch_id: line.batch_id || undefined,
          po_line_id: line.po_line_id ? Number(line.po_line_id) : undefined,
          qtyReceived: line.received_qty || 0,
          qtyFree: line.free_qty || 0,
          batch: null,
          expiryDate: expiryDateValue,
          pp: parseFloat(line.unit_price) || 0,
          sp: parseFloat(line.selling_price) || parseFloat(line.unit_price) || 0,
          mrp: parseFloat(line.mrp) || parseFloat(line.unit_price) || 0,
          cgst: parseFloat(line.cgst) || 0,
          sgst: parseFloat(line.sgst) || 0,
          igst: parseFloat(line.igst) || 0,
          disc: parseFloat(line.discount) || 0,
          margPercent: 0,
          salesDiscPercent: 0,
          isEditing: false,
          transaction_number: line.transaction_number || '',
          payment_vendor: line.payment_vendor || '',
          invoice_date: line.invoice_date || navigationInvoiceDate || '',
        };
      });

      setPharmaTableData(transformedLines);
      setOriginalReceiptLines(transformedLines);
      
      setOriginalFormValues({
        supplierName: supplierName,
        poNumber: poNumber,
        invoiceDate: navigationInvoiceDate || '',
        transactionNumber: receiptLines && receiptLines.length > 0 ? (receiptLines[0].transaction_number || navigationTransactionNumber || '') : navigationTransactionNumber || '',
        paymentVendor: receiptLines && receiptLines.length > 0 ? (receiptLines[0].payment_vendor || navigationPaymentVendor || '') : navigationPaymentVendor || '',
        paymentMethod: paymentMethod,
      });
    } catch (error) {
      setPharmaTableData([]);
      setOriginalReceiptLines([]);
    }
  };

  const transformedSupplierOptions = useMemo(() => {
    if (!Array.isArray(supplierOptions) || supplierOptions.length === 0) return [];
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
          <Tooltip title={row.productId} arrow placement="top">
            <span style={{ 
              display: 'inline-block',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'help'
            }}>
              {row.productId}
            </span>
          </Tooltip>
        )
      ),
    },
    {
      key: "batchNumber",
      header: orderLabels.batchNumber,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            value={editingData.batchNumber || ""}
            onChange={(e) => {
              const value = e.target.value;
              const alphanumericValue = value.replace(/[^A-Za-z0-9]/g, '');
              if (alphanumericValue.length <= 8) {
                updateEditingData("batchNumber", alphanumericValue);
              }
            }}
            variant="outlined"
            fullWidth
            inputProps={{
              maxLength: 8,
              pattern: '[A-Za-z0-9]*',
            }}
            sx={inputFieldStyles}
          />
        ) : (
          <span>{row.batchNumber || '-'}</span>
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
      key: "expiryDate",
      header: orderLabels.expiryDate,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PharmaDatePicker
              value={
                'expiryDate' in editingData
                  ? editingData.expiryDate ?? null
                  : row.expiryDate ?? null
              }
              onChange={(newValue: Dayjs | null) => {
                updateEditingData("expiryDate", newValue);
              }}
              placeholder="MM/DD/YYYY"
              width="100%"
              height={32}
            />
          </Box>
        ) : (
          <span>{row.expiryDate && dayjs.isDayjs(row.expiryDate) && row.expiryDate.isValid() ? row.expiryDate.format('DD/MM/YYYY') : '-'}</span>
        )
      ),
    },
    {
      key: "pp",
      header: orderLabels.unitPrice,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <TextField
              size="small"
              type="number"
              value={editingData.pp || ""}
              onChange={(e) => updateEditingData("pp", Number(e.target.value))}
              variant="outlined"
              fullWidth
              sx={{ ...numberInputStyles, width: '100%', maxWidth: '100%' }}
            />
          </Box>
        ) : (
          <span>{row.pp}</span>
        )
      ),
    },
    {
      key: "cgst",
      header: `${orderLabels.cgst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.cgst !== undefined ? ((editingData.cgst as any) === "" || editingData.cgst === null ? "" : Number(editingData.cgst)) : (row.cgst || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("cgst", val === "" ? ("" as any) : Number(val) || 0);
            }}
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
      header: `${orderLabels.sgst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.sgst !== undefined ? ((editingData.sgst as any) === "" || editingData.sgst === null ? "" : Number(editingData.sgst)) : (row.sgst || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("sgst", val === "" ? ("" as any) : Number(val) || 0);
            }}
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
      key: "igst",
      header: `${orderLabels.igst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.igst !== undefined ? (String(editingData.igst) === "" || editingData.igst === null ? "" : Number(editingData.igst)) : (row.igst || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("igst", val === "" ? ("" as any) : Number(val) || 0);
            }}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.igst}</span>
        )
      ),
    },
    {
      key: "disc",
      header: `${orderLabels.discount} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.disc !== undefined ? ((editingData.disc as any) === "" || editingData.disc === null ? "" : Number(editingData.disc)) : (row.disc || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("disc", val === "" ? ("" as any) : Number(val) || 0);
            }}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.disc}</span>
        )
      ),
    },
    {
      key: "actions",
      header: orderLabels.actions,
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center',marginRight: '10px' }}>
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
                  color: '#6B7280',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#374151'
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
          item.productId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
      </Box>
      <Divider sx={{ marginTop: "16px", border: "0.5px solid #CBD4E1" }} />

      <Box sx={{ display: "flex", gap: "32px", marginTop: "10px" }}>
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
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.supplierName}
          </Typography>
          <Autocomplete
            freeSolo
            forcePopupIcon
            options={isSuppliersLoading ? ["Loading suppliers..."] : transformedSupplierOptions}
            value={supplierName}
            onInputChange={(_, v) => setSupplierName(v)}
            onChange={(_, v) => {
              if (v !== "Loading suppliers...") {
                setSupplierName(v || "");
              }
            }}
            onFocus={() => setIsSupplierFocused(true)}
            onBlur={() => {
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
            disableClearable={!supplierName}
            popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
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
                    <Box 
                      component="span" 
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
                    >
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
                FormHelperTextProps={{
                  component: 'div'
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    height: "44px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#D1D5DB",
                    },
                    "&:hover fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#D1D5DB",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#728197",
                      borderWidth: "2px",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                  "& .MuiAutocomplete-endAdornment": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                  "& .MuiAutocomplete-popupIndicator": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                }}
              />
            )}
          />
        </Box>

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
              fontFamily: "'Lexend', sans-serif",
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
                borderRadius: "18px",
                height: "44px",
                backgroundColor: "#FFFFFF",
                "& fieldset": {
                  borderColor: "#D1D5DB",
                },
                "&:hover fieldset": {
                  borderColor: "#D1D5DB",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#728197",
                  borderWidth: "2px",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "'Lexend', sans-serif",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
            }}
          />
        </Box>

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
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.invoiceDate}
          </Typography>

          <PharmaDatePicker
            value={
              invoiceDate 
                ? (() => {
                    const parsed = dayjs(invoiceDate, 'DD/MM/YYYY');
                    return parsed.isValid() ? parsed : null;
                  })()
                : null
            }
            onChange={(newValue: Dayjs | null) => {
              const formattedDate = newValue ? newValue.format('DD/MM/YYYY') : '';
              setInvoiceDate(formattedDate);
            }}
            width={274}
          />
        </Box>

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
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.paymentMethod}
          </Typography>

          <Autocomplete
            options={paymentMethods}
            value={paymentMethod}
            onChange={(_, newValue) => {
              if (newValue) {
                setPaymentMethod(newValue);
              }
            }}
            disableClearable
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select payment method"
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    height: "44px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&:hover fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#728197",
                      borderWidth: "2px",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                  "& .MuiAutocomplete-endAdornment": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                  "& .MuiAutocomplete-popupIndicator": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: params.InputProps.endAdornment, 
                }}
              />
            )}
          />
        </Box>

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
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.paymentVendor}
          </Typography>

          <Autocomplete
            options={paymentVendors}
            value={paymentVendor || null}
            isOptionEqualToValue={(option, value) => {
              if (!value) return false;
              return option === value;
            }}
            onChange={(_, newValue) => {
              setPaymentVendor(newValue || "");
            }}
            onFocus={() => setIsVendorFocused(true)}
            onBlur={() => setIsVendorFocused(false)}
            disableClearable={!paymentVendor}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={orderLabels.selectBankVendor}
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    height: "44px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&:hover fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#728197",
                      borderWidth: "2px",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                  "& .MuiAutocomplete-endAdornment": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                  "& .MuiAutocomplete-popupIndicator": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                }}
                InputProps={params.InputProps}
              />
            )}
          />
        </Box>

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
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.transactionNumber}
          </Typography>
          <TextField
            variant="outlined"
            fullWidth
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            onFocus={() => setIsTransactionFocused(true)}
            onBlur={() => setIsTransactionFocused(false)}
            onMouseEnter={() => setIsTransactionHovered(true)}
            onMouseLeave={() => setIsTransactionHovered(false)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "18px",
                height: "44px",
                backgroundColor: "#FFFFFF",
                "& fieldset": { borderColor: "#D1D5DB" },
                "&:hover fieldset": { borderColor: "#D1D5DB" },
                "&.Mui-focused fieldset": { 
                  borderColor: "#728197",
                  borderWidth: "2px",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "'Lexend', sans-serif",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
            }}
            InputProps={{
              endAdornment: transactionNumber && (isTransactionFocused || isTransactionHovered) ? (
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: "32px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              flex: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "18px",
                color: "#728197",
              }}
            >
              {orderLabels.findProduct}
            </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "32px",
            }}
          >
          <Box
            onMouseEnter={() => setIsFindProductHovered(true)}
            onMouseLeave={() => setIsFindProductHovered(false)}
            sx={{ display: 'inline-block', width: '500px' }}
            data-product-search
          >
          <Autocomplete
            freeSolo
            forcePopupIcon
            options={autocompleteOptions}
            filterOptions={filterOptions}
            inputValue={findProductTerm}
            onInputChange={(_, v) => {
              setFindProductTerm(v);
            }}
            value={findProductTerm || ""}
            isOptionEqualToValue={(option, value) => {
              if (!value) return false;
              return option === value;
            }}
            onChange={(_, v) => {
              if (v === orderLabels.addProducts) {
                setIsNewProductModalOpen(true);
                setFindProductTerm(""); 
                setIsProductSelected(false);
                return;
              }
              const value = (v as string) || "";
              if (value && value !== orderLabels.addProducts && value !== "Loading products...") {
                const isFromDropdown = productOptions.includes(value);
                
                if (isFromDropdown) {
                  setIsProductSelected(true);
                  addProductToTable(value);
                  setFindProductTerm(value);
                  setIsProductSelected(false);
                } else {
                  setFindProductTerm(value);
                  setIsProductSelected(false);
                }
              } else {
                setFindProductTerm(value);
                setIsProductSelected(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && findProductTerm && findProductTerm !== orderLabels.addProducts) {
                e.preventDefault();
                addProductToTable(findProductTerm);
                setFindProductTerm("");
                setIsProductSelected(false);
              }
            }}
            onFocus={() => setIsFindProductFocused(true)}
            onBlur={() => {
              setIsFindProductFocused(false);
              setIsFindProductHovered(false);
            }}
            disableClearable={true}
            popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
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
                  width: "500px",
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
                    padding: "10px 14px",
                    paddingLeft: "6px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "#6B7280",
                    "&::placeholder": {
                      color: "#9CA3AF",
                      opacity: 1,
                      fontSize: "14px",
                    },
                  },
                  "& .MuiAutocomplete-endAdornment": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                  "& .MuiAutocomplete-popupIndicator": {
                    display: "flex !important",
                    visibility: "visible !important",
                  },
                  "& .MuiAutocomplete-clearIndicator": {
                    display: "flex !important",
                    visibility: "visible !important",
                    color: "#6B7280",
                    "&:hover": {
                      color: "#374151",
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: !(findProductTerm && findProductTerm.trim() !== "") ? (
                    <InputAdornment position="start" sx={{ marginRight: "0px" }}>
                      <SearchIcon sx={{ color: "#9CA3AF", fontSize: "24px" }} />
                    </InputAdornment>
                  ) : null,
                  endAdornment: (
                    <>
                      {findProductTerm && findProductTerm.trim() !== "" && (isFindProductFocused || isFindProductHovered) ? (
                        <InputAdornment position="end" sx={{ marginRight: "8px" }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const productToRemove = pharmaTableData.find(row => row.productId === findProductTerm);
                              if (productToRemove && productToRemove.id) {
                                setPharmaTableData(prev => prev.filter(row => row.id !== productToRemove.id));
                                if (editingRowId === productToRemove.id) {
                                  setEditingRowId(null);
                                  setEditingData({});
                                }
                              }
                              setFindProductTerm("");
                              setIsProductSelected(false);
                            }}
                            sx={{
                              padding: "4px",
                              color: "#6B7280",
                              "&:hover": {
                                color: "#374151",
                                backgroundColor: "transparent",
                              },
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          </Box>
          
          {isEditMode && (
            <TextField
              placeholder="Search for items in the table below..."
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              sx={{
                width: "500px",
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                  borderRadius: "12px",
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
                  },
                },
                "& .MuiInputBase-input": {
                  padding: "10px 14px",
                  paddingLeft: "6px",
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  color: "#6B7280",
                  "&::placeholder": {
                    color: "#9CA3AF",
                    opacity: 1,
                    fontSize: "14px",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ marginRight: "0px" }}>
                    <SearchIcon sx={{ color: "#9CA3AF", fontSize: "24px" }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
          </Box>
          </Box>
        </Box>
      </Box>

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
          data={sortedData}
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

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
        <Box sx={{ display: "flex", gap: "12px" }}>
          <Button
            variant="outlined"
            disableRipple
            onClick={() => {
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
              fontFamily: "'Lexend', sans-serif",
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
            disabled={isSaving || !validateRequiredFields() || !hasFormChanges}
            onClick={handleSubmitReceipt}
            sx={{
              backgroundColor: isSaving ? "#6B7280" : "#5C17E5",
              "&:hover": {
                backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&:focus": {
                backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&:active": {
                backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&:focus-visible": {
                backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "&.Mui-focusVisible": {
                backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                boxShadow: "none",
              },
              "& .MuiTouchRipple-root": {
                display: "none",
              },
              "& .MuiButtonBase-root": {
                "&:active": {
                  backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                },
              },
              "& .MuiButton-contained": {
                "&:active": {
                  backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                },
              },
              "& .MuiButton-root": {
                "&:active": {
                  backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
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
              fontFamily: "'Lexend', sans-serif",
              textTransform: "none",
              boxShadow: "none",
              position: "relative",
              overflow: "hidden",
              "& *": {
                "&:active": {
                  backgroundColor: isSaving ? "#6B7280" : "#4A14C7",
                },
              },
            }}
          >
            {isSaving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              orderLabels.saveButton
            )}
          </Button>
        </Box>
        
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
              fontFamily: "'Lexend', sans-serif",
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
          fetchAllProducts();
        }}
      />

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
        message={
          rowToDeleteId 
            ? `Are you sure you want to delete "${pharmaTableData.find(row => row.id === rowToDeleteId)?.productId || 'this product'}" from the table?`
            : "Are you sure you want to delete this product from the table?"
        }
        itemName={rowToDeleteId ? pharmaTableData.find(row => row.id === rowToDeleteId)?.productId : undefined}
      />

      <ConfirmationDialog
        open={isReceiptDeleteDialogOpen}
        onClose={() => setIsReceiptDeleteDialogOpen(false)}
        onConfirm={handleConfirmReceiptDelete}
        title="Delete Receipt"
        message="Are you sure you want to delete the entire receipt? This action cannot be undone."
        itemName={receiptNumber ? `Receipt ${receiptNumber}` : undefined}
      />
    </>
  );
};

export default OrderDetails;