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
  product_id?: number; // Store actual product_id from backend
  batchNumber?: string;
  batch_id?: number; // Store batch_id for edited items
  po_line_id?: number; // Store po_line_id for edited items
  qtyReceived: number;
  qtyFree: number;
  batch: string; // This is the expiry_date in DD/MM/YYYY format
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
    isEditMode && selectedOrder ? selectedOrder.supplier : selectedSupplier
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
      setSupplierOptions(Array.isArray(data) ? data : []);
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
    const selectedSupplierData = supplierOptions.find(s => s.supplier_name === supplierName);
    const isExistingSupplier = selectedSupplierData && selectedSupplierData.supplier_id > 0;

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
      let expiryDate: string = '';
      if (row.batch && row.batch.trim() !== '') {
        try {
          const parsedDate = dayjs(row.batch, 'DD/MM/YYYY');
          if (parsedDate.isValid()) {
            expiryDate = parsedDate.format('YYYY-MM-DD');
          } else {
            const altParsedDate = dayjs(row.batch);
            if (altParsedDate.isValid()) {
              expiryDate = altParsedDate.format('YYYY-MM-DD');
            } else {
              expiryDate = '';
            }
          }
        } catch (error) {
          expiryDate = '';
        }
      }

      const productId = getProductIdFromName(row.productId);

      const line = {
        product: row.productId,
        product_id: productId,
        batch_number: row.batchNumber || "",
        received_qty: Number(row.qtyReceived) || 0,
        free_qty: Number(row.qtyFree) || 0,
        expiry_date: expiryDate,
        unit_price: Number(row.pp) || 0,
        cgst: Number(row.cgst) || 0,
        sgst: Number(row.sgst) || 0,
        igst: Number(row.igst) || 0,
        discount: Number(row.disc) || 0
      };
      return line;
    });

    const payload = {
      supplier_name: supplierName.trim(),
      ...(isExistingSupplier && { supplier_id: selectedSupplierData.supplier_id }),
      po_number: poNumber.trim(),
      payment_method: paymentMethod || 'Cash',
      payment_vendor: paymentVendor.trim(),
      transaction_number: transactionNumber.trim(),
      notes: "",
      created_by: "meher",
      lines: lines
    };

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

    const formatExpiryDate = (batchDate: string): string => {
      if (!batchDate || !batchDate.trim()) return '';
      try {
        const parsed = dayjs(batchDate, 'DD/MM/YYYY');
        if (parsed.isValid()) {
          return parsed.format('YYYY-MM-DD');
        }
        const altParsed = dayjs(batchDate);
        if (altParsed.isValid()) {
          return altParsed.format('YYYY-MM-DD');
        }
      } catch (error) {
        // Ignore parsing errors
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
        if (!productId) {
          console.warn(`Could not find product_id for product: ${row.productId}`);
        }
        if (!row.batchNumber || row.batchNumber.trim() === '') {
          console.warn(`batch_number is required for product: ${row.productId}`);
        }
        
        return {
          product: row.productId,
          product_id: productId || 0, // Fallback to 0 if not found, backend will reject
          batch_number: row.batchNumber || '', // Required by backend
          received_qty: row.qtyReceived,
          free_qty: row.qtyFree,
          expiry_date: formatExpiryDate(row.batch),
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
        
        return (
          originalRow.productId !== currentRow.productId ||
          originalRow.qtyReceived !== currentRow.qtyReceived ||
          originalRow.qtyFree !== currentRow.qtyFree ||
          originalRow.batch !== currentRow.batch ||
          originalRow.pp !== currentRow.pp ||
          originalRow.cgst !== currentRow.cgst ||
          originalRow.sgst !== currentRow.sgst ||
          originalRow.igst !== currentRow.igst ||
          originalRow.disc !== currentRow.disc
        );
      })
      .map(row => {
        const originalRow = originalReceiptLines.find(orig => orig.id === row.id);
        const productId = row.product_id || originalRow?.product_id || getProductIdFromName(row.productId);
        
        return {
          receipt_line_id: parseInt(row.id || '0'),
          po_line_id: row.po_line_id || originalRow?.po_line_id || 0,
          batch_id: row.batch_id || originalRow?.batch_id || 0, // Backend expects batch_id from InventoryBatch
          product_id: productId || 0,
          product_name: row.productId,
          received_qty: row.qtyReceived,
          free_qty: row.qtyFree,
          expiry_date: formatExpiryDate(row.batch),
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
        setSaveError('Please complete all required fields for products (Product Name, Quantity Received, and valid Expiry Date if provided)');
        setIsSaving(false);
        return;
      }

      let result;
      
      if (isEditMode && receiptId) {
        const editPayload = transformFormDataToEditPayload();
        result = await editReceipt(editPayload).unwrap();
      } else {
        const submitPayload = transformFormDataToApiPayload();
        
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
    
    let productMRP = 0;
    let productSellingPrice = 0;
    
    if (resolvedProductId) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/inventory/get-product-details?product_id=${resolvedProductId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const productData = await response.json();
          productMRP = productData.mrp || 0;
          productSellingPrice = productData.selling_price || productData.mrp || 0;
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    }
    
    const newProduct: PharmaTableRow = {
      id: Date.now().toString(),
      productId: productName,
      product_id: resolvedProductId || undefined,
      batchNumber: batchNumber || "",
      qtyReceived: 0,
      qtyFree: 0,
      batch: "",
      pp: 0, // Purchase price - user needs to enter
      sp: productSellingPrice || 0, // Selling price - populate from product if available
      mrp: productMRP || 0, // MRP - populate from product
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
    setIsProductSelected(false);
  };

  const startEditing = (row: PharmaTableRow) => {
    setEditingRowId(row.id!);
    setEditingData({ ...row });
  };

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

  const updateEditingData = (field: keyof PharmaTableRow, value: string | number) => {
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
    
    let hasValidExpiryDate = true;
    if (row.batch && row.batch.trim() !== '') {
      const parsedDate = dayjs(row.batch, 'DD/MM/YYYY');
      hasValidExpiryDate = parsedDate.isValid();
    }
    
    return hasProductName && hasValidQuantity && hasValidExpiryDate;
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
      
      const transformedLines: PharmaTableRow[] = receiptLines.map((line: any, index: number) => {
        // Parse expiry_date to DD/MM/YYYY format for display
        let expiryDateFormatted = '';
        if (line.expiry_date) {
          try {
            const parsed = dayjs(line.expiry_date);
            if (parsed.isValid()) {
              expiryDateFormatted = parsed.format('DD/MM/YYYY');
            }
          } catch (e) {
            expiryDateFormatted = '';
          }
        }

        return {
          id: line.receipt_line_id?.toString() || line.id?.toString() || index.toString(),
          productId: line.product_name || line.product || `Product ID: ${line.product_id || 'Unknown'}`,
          product_id: line.product_id ? Number(line.product_id) : undefined,
          batchNumber: line.batch_number || '',
          batch_id: line.batch_id || undefined, // Will need to fetch from inventory_batch if not in response
          po_line_id: line.po_line_id ? Number(line.po_line_id) : undefined,
          qtyReceived: line.received_qty || 0,
          qtyFree: line.free_qty || 0,
          batch: expiryDateFormatted, // Expiry date in DD/MM/YYYY format
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
      key: "batch",
      header: orderLabels.expiryDate,
      sortable: false,
      render: (row) => {
        const currentBatch = editingRowId === row.id ? editingData.batch : row.batch;
        const dateValue = currentBatch 
          ? (() => {
              const parsed = dayjs(currentBatch, 'DD/MM/YYYY');
              return parsed.isValid() ? parsed : null;
            })()
          : null;
        
        return (
          <Box sx={{ 
            position: 'relative',
            width: '100%',
            overflow: 'visible !important',
            '& > *': {
              overflow: 'visible !important',
            },
            '& .MuiInputBase-root': {
              overflow: 'visible !important',
            },
            '& .MuiOutlinedInput-root': {
              overflow: 'visible !important',
              '& .MuiInputAdornment-root': {
                display: 'flex !important',
                visibility: 'visible !important',
                opacity: '1 !important',
                position: 'relative !important',
                overflow: 'visible !important',
                '& .MuiIconButton-root': {
                  display: 'inline-flex !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                  '& svg': {
                    display: 'block !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                  },
                },
              },
            },
            '& .MuiInputAdornment-root': {
              display: 'flex !important',
              visibility: 'visible !important',
              opacity: '1 !important',
              '& .MuiIconButton-root': {
                display: 'inline-flex !important',
                visibility: 'visible !important',
                opacity: '1 !important',
                '& svg': {
                  display: 'block !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                },
              },
            },
            '& .MuiPickersInputAdornment-root': {
              display: 'flex !important',
              visibility: 'visible !important',
              opacity: '1 !important',
              '& .MuiIconButton-root': {
                display: 'inline-flex !important',
                visibility: 'visible !important',
                opacity: '1 !important',
                '& svg': {
                  display: 'block !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                },
              },
            },
          }}>
            <PharmaDatePicker
              value={dateValue}
              onChange={(newValue: Dayjs | null) => {
                const formattedDate = newValue ? newValue.format('DD/MM/YYYY') : '';
                if (editingRowId === row.id) {
                  updateEditingData("batch", formattedDate);
                } else {
                  setPharmaTableData(prev => 
                    prev.map(item => 
                      item.id === row.id 
                        ? { ...item, batch: formattedDate }
                        : item
                    )
                  );
                }
              }}
              minDate={dayjs()}
              width={320}
            />
          </Box>
        );
      },
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
          (item.batch || '').toLowerCase().includes(searchTerm.toLowerCase())
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
              width: "220px",
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
              Batch Number
            </Typography>

            <TextField 
              variant="outlined"
              fullWidth
              value={batchNumber}
              onChange={(e) => {
                const value = e.target.value;
                const alphanumericValue = value.replace(/[^A-Za-z0-9]/g, '');
                if (alphanumericValue.length <= 8) {
                  setBatchNumber(alphanumericValue);
                }
              }}
              placeholder="Enter Batch Number (max 8 alphanumeric)"
              inputProps={{
                maxLength: 8,
                pattern: '[A-Za-z0-9]*',
              }}
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
            value={findProductTerm ? findProductTerm : undefined}
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