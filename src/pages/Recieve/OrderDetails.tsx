import React, { useState, useMemo, useEffect, startTransition, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  TableCell,
  TableRow,
} from "@mui/material";
import { PharmaDatePicker, StandardButton } from "../../components/Common";
import dayjs, { Dayjs } from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { receiveApi, useSubmitReceiptMutation, useEditReceiptMutation, useUploadReceiptFileMutation, getReceiptFileUrl, useGetReceiptsQuery } from "../../redux/slices/receiveApi";
import { useGetBatchesForProductMutation } from "../../redux/slices/inventoryApi";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import UploadIcon from "@mui/icons-material/Upload";

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
import NewSupplierModal from "../../components/Modal/NewSupplier/NewSupplierModal";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import { useAddSupplierMutation } from "../../redux/slices/masterApi";

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
  amount?: number;
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
  const { user } = useSelector((state: RootState) => state.auth);
  const [submitReceipt, { isLoading: isSubmittingReceipt }] = useSubmitReceiptMutation();
  const [editReceipt, { isLoading: isEditingReceipt }] = useEditReceiptMutation();
  const [uploadReceiptFile] = useUploadReceiptFileMutation();
  const [getBatchesForProduct] = useGetBatchesForProductMutation();
  const [addSupplier] = useAddSupplierMutation();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "productName", direction: "asc" });
  const [isNewProductModalOpen, setIsNewProductModalOpen] =
    useState<boolean>(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] =
    useState<boolean>(false);

  const [findProductTerm, setFindProductTerm] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState<string>("");

  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [isVendorFocused, setIsVendorFocused] = useState(false);
  const [isTransactionFocused, setIsTransactionFocused] = useState(false);
  const [isTransactionHovered, setIsTransactionHovered] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [paymentVendor, setPaymentVendor] = useState<string>("");
  const selectedSupplier = (location.state as any)?.selectedSupplier || "";
  const selectedPO = (location.state as any)?.selectedPO || "";
  const selectedOrder = (location.state as any)?.selectedOrder || null;
  const isEditMode = (location.state as any)?.isEditMode || false;
  const receiptId = (location.state as any)?.receiptId || null;
  const receiptNumber = (location.state as any)?.receiptNumber || "";
  const navigationTransactionNumber = (location.state as any)?.transactionNumber || "";
  const navigationPaymentVendor = (location.state as any)?.paymentVendor || "";
  const navigationInvoiceDate = (location.state as any)?.invoiceDate || "";
  const [supplierOptions, setSupplierOptions] = useState<{ supplier_name: string, supplier_id: number }[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>(
    (isEditMode && selectedOrder ? selectedOrder.supplier : selectedSupplier) || ""
  );
  const filteredSupplierOptions = useMemo(() => {
    const options = supplierOptions.map(s => s.supplier_name);
    const validOptions = options.filter(option => option && typeof option === 'string');
    return [...validOptions, orderLabels.addNewSupplier];
  }, [supplierOptions, orderLabels.addNewSupplier]);
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [transactionNumber, setTransactionNumber] = useState<string>("");


  // Fetch receipt data when in edit mode to get receipt_file_name and receipt_file_url
  const { data: receiptsData } = useGetReceiptsQuery(undefined, {
    skip: !isEditMode || !receiptId, // Only fetch when in edit mode and receiptId exists
  });


  // Fetch all receipts for supplier totals calculation (always fetch, filter in useEffect)
  const { data: allReceiptsData } = useGetReceiptsQuery(undefined);
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

  const [originalInvoiceFile, setOriginalInvoiceFile] = useState<File | null>(null);
  const [originalInvoiceAttachmentUrl, setOriginalInvoiceAttachmentUrl] = useState<string>('');

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

  const [isUploadConfirmationDialogOpen, setIsUploadConfirmationDialogOpen] = useState<boolean>(false);

  const [isProceedToPaymentDialogOpen, setIsProceedToPaymentDialogOpen] = useState<boolean>(false);

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string>("");
  const [invoiceAttachmentUrl, setInvoiceAttachmentUrl] = useState<string>("");
  const [isExistingFile, setIsExistingFile] = useState<boolean>(false); // Track if file is from server
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [isSuppliersLoading, setIsSuppliersLoading] = useState<boolean>(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  // Supplier totals state
  const [supplierTotals, setSupplierTotals] = useState<{
    amountPaid: number;
    pendingAmount: number;
    creditAvailable: number;
  }>({
    amountPaid: 0,
    pendingAmount: 0,
    creditAvailable: 0,
  });

  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [productOptionsWithIds, setProductOptionsWithIds] = useState<{ name: string, id: number }[]>([]);
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
        notes: supplierData.tinNumber || '',
      }).unwrap();
      setIsNewSupplierModalOpen(false);
      // Refresh supplier list
      await fetchSupplierNames();
      // Set the newly added supplier name
      setSupplierName(supplierData.supplierName);
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
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
        .filter((product: { name: string, id: number }) => product.name && product.name.trim() !== '' && product.id);

      setProductOptions(productData.map((p: { name: string; id: number }) => p.name) as string[]);
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

    // Get created_by from user, fallback to "meher"
    const createdBy = user?.username || user?.first_name || "meher";

    const payload: {
      supplier_name: string;
      supplier_id: number;
      po_number: string;
      notes: string;
      created_by: string;
      lines: typeof lines;
    } = {
      supplier_name: supplierName.trim(),
      supplier_id: selectedSupplierData.supplier_id,
      po_number: poNumber.trim(),
      notes: "",
      created_by: createdBy,
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
      // Don't send base64 attachment in payload - will upload file separately after receipt is updated
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

  const proceedWithSave = async () => {
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
      let finalReceiptId: number | null = null;

      if (isEditMode && receiptId) {
        const editPayload = transformFormDataToEditPayload();
        console.log('Edit receipt payload:', JSON.stringify(editPayload, null, 2));
        result = await editReceipt(editPayload).unwrap();
        console.log('Edit receipt response:', result);
        finalReceiptId = receiptId;
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
          // Handle new API response structure: { message, po_id, receipt_id, total_amount, amount_paid, amount_due, payment_status }
          finalReceiptId = result.receipt_id || (result as any).receiptId;
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
          // Handle new API response structure
          finalReceiptId = result.receipt_id || result.receiptId;
        }
      }

      // Upload file if a file was selected and we have a receipt ID
      if (invoiceFile && finalReceiptId) {
        try {
          await uploadReceiptFile({ receiptId: finalReceiptId, file: invoiceFile }).unwrap();
          console.log('Invoice file uploaded successfully');
        } catch (uploadError) {
          console.error('Failed to upload invoice file:', uploadError);
          // Don't fail the entire save if file upload fails - just log the error
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
        setInvoiceFile(null);
        setInvoiceFileName("");
        setInvoiceAttachmentUrl("");
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

  const handleSubmitReceipt = async () => {
    // In edit mode, skip file check and save directly
    if (isEditMode) {
      await proceedWithSave();
      return;
    }

    // Check if user forgot to upload invoice file (only for new receipts)
    if (!invoiceFile && !invoiceAttachmentUrl) {
      // Show confirmation dialog asking if they want to upload
      setIsUploadConfirmationDialogOpen(true);
      return;
    }

    // If file exists or user chose to skip, proceed with save
    await proceedWithSave();
  };

  const handleUploadConfirmationYes = () => {
    setIsUploadConfirmationDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadConfirmationNo = async () => {
    setIsUploadConfirmationDialogOpen(false);
    setIsProceedToPaymentDialogOpen(true);
  };

  const handleProceedToPayment = async () => {
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

      let submitPayload;
      try {
        submitPayload = transformFormDataToApiPayload();
      } catch (validationError: any) {
        setSaveError(validationError.message || 'Invalid form data. Please ensure supplier is selected from dropdown.');
        setIsSaving(false);
        return;
      }

      let result;
      try {
        result = await submitReceipt(submitPayload).unwrap();
        // Handle new API response structure: { message, po_id, receipt_id, total_amount, amount_paid, amount_due, payment_status }
        const newReceiptId = result.receipt_id || (result as any).receiptId;

        // Upload file if a file was selected
        if (invoiceFile && newReceiptId) {
          try {
            await uploadReceiptFile({ receiptId: newReceiptId, file: invoiceFile }).unwrap();
            console.log('Invoice file uploaded successfully');
          } catch (uploadError) {
            console.error('Failed to upload invoice file:', uploadError);
            // Don't fail the entire save if file upload fails
          }
        }

        // Navigate to payment details page with receipt_id
        navigate('/receive/payment-details', {
          state: {
            supplierName,
            poNumber,
            invoiceDate,
            pharmaTableData,
            isEditMode: false,
            receiptId: newReceiptId,
            receiptNumber: `RA${newReceiptId}`,
          }
        });
      } catch (rtkError) {
        // Fallback to direct fetch
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
        const newReceiptId = result.receipt_id || result.receiptId;

        // Upload file if a file was selected
        if (invoiceFile && newReceiptId) {
          try {
            await uploadReceiptFile({ receiptId: newReceiptId, file: invoiceFile }).unwrap();
            console.log('Invoice file uploaded successfully');
          } catch (uploadError) {
            console.error('Failed to upload invoice file:', uploadError);
          }
        }

        // Navigate to payment details page with receipt_id
        navigate('/receive/payment-details', {
          state: {
            supplierName,
            poNumber,
            invoiceDate,
            pharmaTableData,
            isEditMode: false,
            receiptId: newReceiptId,
            receiptNumber: `RA${newReceiptId}`,
          }
        });
      }
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
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceedToPaymentClick = () => {
    // Check if user forgot to upload invoice file
    if (!invoiceFile && !invoiceAttachmentUrl) {
      // Show upload confirmation dialog first
      setIsUploadConfirmationDialogOpen(true);
      return;
    }

    // If file exists, show proceed to payment confirmation dialog
    setIsProceedToPaymentDialogOpen(true);
  };

  const handleConfirmProceedToPayment = () => {
    setIsProceedToPaymentDialogOpen(false);
    handleProceedToPayment();
  };

  const handleCancelProceedToPayment = () => {
    setIsProceedToPaymentDialogOpen(false);
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
      // If amount is empty, calculate it from other fields
      if (cleanedData.amount === "" || cleanedData.amount === null || cleanedData.amount === undefined) {
        const unitPrice = typeof cleanedData.pp === 'number' ? cleanedData.pp : parseFloat(String(cleanedData.pp)) || 0;
        const qty = cleanedData.qtyReceived || 0;
        const cgst = typeof cleanedData.cgst === 'number' ? cleanedData.cgst : parseFloat(String(cleanedData.cgst)) || 0;
        const sgst = typeof cleanedData.sgst === 'number' ? cleanedData.sgst : parseFloat(String(cleanedData.sgst)) || 0;
        const igst = typeof cleanedData.igst === 'number' ? cleanedData.igst : parseFloat(String(cleanedData.igst)) || 0;
        const discount = typeof cleanedData.disc === 'number' ? cleanedData.disc : parseFloat(String(cleanedData.disc)) || 0;

        const baseAmount = unitPrice * qty;
        const discountAmount = baseAmount * (discount / 100);
        const amountAfterDiscount = baseAmount - discountAmount;
        const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);
        cleanedData.amount = amountAfterDiscount + taxAmount;
      } else {
        cleanedData.amount = typeof cleanedData.amount === 'number' ? cleanedData.amount : parseFloat(String(cleanedData.amount)) || 0;
      }

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

    // Check if invoice file changed (new file uploaded or file removed)
    // If user only wants to upload/replace invoice file, save button should be enabled
    const invoiceFileChanged =
      (invoiceFile !== null && invoiceFile !== originalInvoiceFile) || // New file uploaded
      (invoiceFile === null && invoiceAttachmentUrl !== originalInvoiceAttachmentUrl && originalInvoiceAttachmentUrl !== ''); // File removed

    return formFieldsChanged || tableDataChanged || invoiceFileChanged;
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
    originalReceiptLines,
    invoiceFile,
    originalInvoiceFile,
    invoiceAttachmentUrl,
    originalInvoiceAttachmentUrl
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
    if (isEditMode && receiptId) {
      // Clear existing data before fetching to prevent duplicates
      setPharmaTableData([]);
      fetchReceiptLines();
    }
  }, [isEditMode, receiptId]);

  // Calculate supplier totals from all receipts data
  useEffect(() => {
    if (!supplierName || !supplierName.trim() || !allReceiptsData) {
      setSupplierTotals({ amountPaid: 0, pendingAmount: 0, creditAvailable: 0 });
      return;
    }

    const receipts = Array.isArray(allReceiptsData) ? allReceiptsData : [];

    // Filter receipts for this supplier and calculate totals
    const supplierReceipts = receipts.filter((receipt: any) =>
      receipt.supplier_name && receipt.supplier_name.toLowerCase() === supplierName.toLowerCase()
    );

    const totalAmountPaid = supplierReceipts.reduce((sum: number, receipt: any) =>
      sum + (receipt.total_paid || 0), 0
    );

    const totalPendingAmount = supplierReceipts.reduce((sum: number, receipt: any) =>
      sum + (receipt.amount_left_to_pay || 0), 0
    );

    // Get credit available from the first receipt (should be same for all receipts from same supplier)
    const creditAvailable = supplierReceipts.length > 0 && supplierReceipts[0].supplier_credit_available
      ? parseFloat(supplierReceipts[0].supplier_credit_available)
      : 0;

    setSupplierTotals({
      amountPaid: totalAmountPaid,
      pendingAmount: totalPendingAmount,
      creditAvailable: creditAvailable,
    });
  }, [supplierName, allReceiptsData]);

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
      let receiptLines = Array.isArray(receiptLinesData) ? receiptLinesData : [];

      // Deduplicate receipt lines by receipt_line_id to prevent duplicates
      const seenIds = new Set();
      receiptLines = receiptLines.filter((line: any) => {
        const lineId = line.receipt_line_id || line.id;
        if (lineId && seenIds.has(lineId)) {
          console.warn('Duplicate receipt line detected and removed:', lineId);
          return false;
        }
        if (lineId) {
          seenIds.add(lineId);
        }
        return true;
      });

      console.log('Fetched receipt lines:', receiptLines.length, receiptLines);

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


      const productBatchMap = new Map<string, { product_id: number; batch_number: string }>();
      receiptLines.forEach((line: any) => {
        if (line.product_id && line.batch_number) {
          const key = `${line.product_id}_${line.batch_number}`;
          if (!productBatchMap.has(key)) {
            productBatchMap.set(key, { product_id: line.product_id, batch_number: line.batch_number });
          }
        }
      });

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
        const batchKey = line.product_id && line.batch_number ? `${line.product_id}_${line.batch_number}` : null;
        const expiryDateFromBatch = batchKey ? batchExpiryMap.get(batchKey) : null;
        const expiryDateRaw = expiryDateFromBatch || line.expiry_date || line.expiryDate || line.expiry || null;

        const expiryDateValue = (expiryDateRaw !== null && expiryDateRaw !== undefined && expiryDateRaw !== '' && expiryDateRaw !== 'null' && expiryDateRaw !== 'undefined')
          ? (() => {
            let parsed = dayjs(expiryDateRaw, 'YYYY-MM-DD', true);
            if (!parsed.isValid()) {
              parsed = dayjs(expiryDateRaw, 'DD/MM/YYYY', true);
            }
            if (!parsed.isValid()) {
              parsed = dayjs(expiryDateRaw, 'MM/DD/YYYY', true);
            }
            if (!parsed.isValid()) {
              parsed = dayjs(expiryDateRaw);
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

      // Load invoice attachment if available
      // Priority: 1) Receipt data from API (receipt_file_url, receipt_file_name)
      //           2) selectedOrder data (invoice_attachment, receipt_file_name)
      //           3) receiptId only (construct URL)

      let receiptFileName: string | undefined = undefined;
      let hasReceiptFile: boolean = false;

      // First, try to get receipt data from API
      if (receiptsData && receiptId) {
        const receipt = receiptsData.find((r: any) => r.id === receiptId);
        if (receipt) {
          receiptFileName = receipt.receipt_file_name !== null ? receipt.receipt_file_name : undefined;
          hasReceiptFile = !!(receipt.receipt_file_url || receipt.receipt_file_name);
        }
      }

      // Fallback to selectedOrder data
      if (!receiptFileName && selectedOrder) {
        const fileName = (selectedOrder as any).receipt_file_name;
        receiptFileName = fileName !== null ? fileName : undefined;
        hasReceiptFile = !!(receiptFileName || (selectedOrder as any).receipt_file_url);
      }

      // Check for old format (base64) in selectedOrder
      const attachmentUrl = selectedOrder ? (selectedOrder as any).invoice_attachment : undefined;

      if (attachmentUrl && attachmentUrl.startsWith('data:')) {
        // Old format: base64 data URL
        setInvoiceAttachmentUrl(attachmentUrl);
        setOriginalInvoiceAttachmentUrl(attachmentUrl);
        setInvoiceFileName(receiptFileName || 'Invoice Receipt');
        setIsExistingFile(true);
      } else if (hasReceiptFile && receiptId) {
        // New format: file stored on server - construct URL from receiptId
        const fileUrl = getReceiptFileUrl(receiptId);
        setInvoiceAttachmentUrl(fileUrl);
        setOriginalInvoiceAttachmentUrl(fileUrl);
        setInvoiceFileName(receiptFileName || 'Invoice Receipt');
        setIsExistingFile(true);
      } else if (receiptId) {
        // receiptId exists but no file info - try to construct URL anyway (file may exist)
        const fileUrl = getReceiptFileUrl(receiptId);
        setInvoiceAttachmentUrl(fileUrl);
        setOriginalInvoiceAttachmentUrl(fileUrl);
        setInvoiceFileName(receiptFileName || 'Invoice Receipt');
        setIsExistingFile(!!receiptFileName);
      } else {
        // No original attachment
        setOriginalInvoiceAttachmentUrl('');
        setInvoiceAttachmentUrl('');
        setInvoiceFileName('');
        setIsExistingFile(false);
      }

      // Reset original invoice file (no file selected initially in edit mode)
      setOriginalInvoiceFile(null);

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
    if (!Array.isArray(supplierOptions) || supplierOptions.length === 0) return [orderLabels.addNewSupplier];
    return [...supplierOptions.map((supplier) => supplier.supplier_name), orderLabels.addNewSupplier];
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
              minDate={dayjs().startOf('day')} // Only allow today and future dates
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
      key: "amount",
      header: "Amount (₹)",
      sortable: false,
      render: (row) => {
        if (editingRowId === row.id) {
          // Calculate default amount if not in editingData
          const calculateAmount = () => {
            const unitPrice = typeof editingData.pp === 'number' ? editingData.pp : (typeof row.pp === 'number' ? row.pp : parseFloat(String(editingData.pp || row.pp)) || 0);
            const qty = editingData.qtyReceived !== undefined ? editingData.qtyReceived : (row.qtyReceived || 0);
            const cgst = typeof editingData.cgst === 'number' ? editingData.cgst : (typeof row.cgst === 'number' ? row.cgst : parseFloat(String(editingData.cgst || row.cgst)) || 0);
            const sgst = typeof editingData.sgst === 'number' ? editingData.sgst : (typeof row.sgst === 'number' ? row.sgst : parseFloat(String(editingData.sgst || row.sgst)) || 0);
            const igst = typeof editingData.igst === 'number' ? editingData.igst : (typeof row.igst === 'number' ? row.igst : parseFloat(String(editingData.igst || row.igst)) || 0);
            const discount = typeof editingData.disc === 'number' ? editingData.disc : (typeof row.disc === 'number' ? row.disc : parseFloat(String(editingData.disc || row.disc)) || 0);

            const baseAmount = unitPrice * qty;
            const discountAmount = baseAmount * (discount / 100);
            const amountAfterDiscount = baseAmount - discountAmount;
            const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);
            return amountAfterDiscount + taxAmount;
          };

          const defaultAmount = calculateAmount();
          const amountValue = editingData.amount !== undefined
            ? ((editingData.amount as any) === "" || editingData.amount === null ? "" : Number(editingData.amount))
            : defaultAmount;

          return (
            <TextField
              size="small"
              type="number"
              value={amountValue}
              onChange={(e) => {
                const val = e.target.value;
                updateEditingData("amount" as keyof PharmaTableRow, val === "" ? ("" as any) : Number(val) || 0);
              }}
              variant="outlined"
              fullWidth
              sx={numberInputStyles}
            />
          );
        } else {
          const unitPrice = typeof row.pp === 'number' ? row.pp : parseFloat(String(row.pp)) || 0;
          const qty = row.qtyReceived || 0;
          const cgst = typeof row.cgst === 'number' ? row.cgst : parseFloat(String(row.cgst)) || 0;
          const sgst = typeof row.sgst === 'number' ? row.sgst : parseFloat(String(row.sgst)) || 0;
          const igst = typeof row.igst === 'number' ? row.igst : parseFloat(String(row.igst)) || 0;
          const discount = typeof row.disc === 'number' ? row.disc : parseFloat(String(row.disc)) || 0;

          // Calculate base amount
          const baseAmount = unitPrice * qty;

          // Apply discount (assuming percentage)
          const discountAmount = baseAmount * (discount / 100);
          const amountAfterDiscount = baseAmount - discountAmount;

          // Apply taxes (assuming percentage)
          const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);

          // Row total = base - discount + taxes
          // Use stored amount if available, otherwise calculate
          const rowTotal = (row as any).amount !== undefined && (row as any).amount !== null
            ? parseFloat(String((row as any).amount))
            : amountAfterDiscount + taxAmount;

          return (
            <span>
              ₹{rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          );
        }
      },
    },
    {
      key: "actions",
      header: orderLabels.actions,
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', marginRight: '10px' }}>
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
            options={isSuppliersLoading ? ["Loading suppliers..."] : filteredSupplierOptions}
            value={supplierName || null}
            onChange={(_, newValue) => {
              if (newValue === orderLabels.addNewSupplier) {
                setIsNewSupplierModalOpen(true);
              } else if (newValue && newValue !== "Loading suppliers...") {
                setSupplierName(newValue);
              } else if (newValue === null) {
                setSupplierName('');
              }
            }}
            onInputChange={(_, newInputValue) => setSupplierSearchTerm(newInputValue)}
            inputValue={supplierSearchTerm}
            disableListWrap={true}
            getOptionDisabled={(option) => option === "Loading suppliers..."}
            PaperComponent={({ children }) => (
              <Box
                sx={{
                  padding: 0,
                  marginTop: "4px",
                  borderRadius: "12px",
                  border: "1px solid #E6ECF5",
                  backgroundColor: "#fff",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              >
                {children}
              </Box>
            )}
            slotProps={{
              popper: {
                sx: {
                  "& .MuiPaper-root": {
                    minWidth: "274px",
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
            renderOption={(props, option) => {
              const isAddNewSupplier = option === orderLabels.addNewSupplier;
              const isLoading = option === "Loading suppliers...";
              const { key, ...optionProps } = props as any;
              return (
                <Box
                  key={key}
                  component="li"
                  {...optionProps}
                  sx={{
                    borderRadius: "8px",
                    margin: "2px 8px !important",
                    fontSize: "14px",
                    fontFamily: "'Lexend', sans-serif",
                    ...(isAddNewSupplier ? {
                      backgroundColor: '#5C17E5 !important',
                      color: '#ffffff !important',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: '#4A14C7 !important',
                      }
                    } : {
                      '&:hover': {
                        backgroundColor: "#F3E8FF",
                        color: "#5C17E5",
                      },
                      '&.Mui-selected': {
                        backgroundColor: "#5C17E5",
                        color: "#ffffff",
                        '&:hover': {
                          backgroundColor: '#4A14C7',
                        },
                      },
                    })
                  }}
                >
                  {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} color="primary" />}
                  {option}
                </Box>
              );
            }}
            sx={{
              width: "274px",
              "& .MuiOutlinedInput-root": {
                height: "44px",
                borderRadius: "30px",
                backgroundColor: "#FFFFFF",
                padding: "0 16px",
                "& fieldset": {
                  borderColor: suppliersError ? "#d32f2f" : "#D1D5DB",
                },
                "&:hover fieldset": {
                  borderColor: suppliersError ? "#d32f2f" : "#D1D5DB",
                },
                "&.Mui-focused fieldset": {
                  borderColor: suppliersError ? "#d32f2f" : "#5C17E5",
                  borderWidth: "2px",
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={isSuppliersLoading ? "Loading suppliers..." : orderLabels.enterSupplierName}
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
                  "& .MuiInputBase-input": {
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A212B",
                    ml: 1,
                  },
                  "& .MuiOutlinedInput-root": {
                    paddingLeft: '0 !important',
                  }
                }}
              />
            )}
          />
          {suppliersError && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 0.5,
                ml: 1.5,
                color: '#d32f2f',
                fontSize: '0.75rem'
              }}
            >
              <span>{suppliersError}</span>
              <Button
                size="small"
                onClick={retryFetchSuppliers}
                sx={{
                  minWidth: 'auto',
                  padding: '0px 4px',
                  fontSize: '10px',
                  textTransform: 'none',
                  color: '#5C17E5'
                }}
              >
                Retry
              </Button>
            </Box>
          )}
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
                sx={{ display: 'inline-block', width: '500px' }}
                data-product-search
              >
                <Autocomplete
                  options={isProductsLoading ? ["Loading products..."] : autocompleteOptions}
                  value={findProductTerm || null}
                  onChange={(_, newValue) => {
                    if (newValue === orderLabels.addProducts) {
                      setIsNewProductModalOpen(true);
                      setFindProductTerm("");
                    } else if (newValue && newValue !== "Loading products...") {
                      setFindProductTerm(newValue);
                      addProductToTable(newValue);
                    } else if (newValue === null) {
                      setFindProductTerm("");
                    }
                  }}
                  disableListWrap={true}
                  getOptionDisabled={(option) => option === "Loading products..."}
                  PaperComponent={({ children }) => (
                    <Box
                      sx={{
                        padding: 0,
                        marginTop: "4px",
                        borderRadius: "12px",
                        border: "1px solid #E6ECF5",
                        backgroundColor: "#fff",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      }}
                    >
                      {children}
                    </Box>
                  )}
                  slotProps={{
                    popper: {
                      sx: {
                        "& .MuiPaper-root": {
                          minWidth: "500px",
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
                  renderOption={(props, option) => {
                    const isAddProduct = option === orderLabels.addProducts;
                    const isLoading = option === "Loading products...";
                    const { key, ...optionProps } = props as any;
                    return (
                      <Box
                        key={key}
                        component="li"
                        {...optionProps}
                        sx={{
                          borderRadius: "8px",
                          margin: "2px 8px !important",
                          fontSize: "14px",
                          fontFamily: "'Lexend', sans-serif",
                          ...(isAddProduct ? {
                            backgroundColor: '#5C17E5 !important',
                            color: '#ffffff !important',
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: '#4A14C7 !important',
                            }
                          } : {
                            '&:hover': {
                              backgroundColor: "#F3E8FF",
                              color: "#5C17E5",
                            },
                            '&.Mui-selected': {
                              backgroundColor: "#5C17E5",
                              color: "#ffffff",
                              '&:hover': {
                                backgroundColor: '#4A14C7',
                              },
                            },
                          })
                        }}
                      >
                        {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} color="primary" />}
                        {option}
                      </Box>
                    );
                  }}
                  sx={{
                    width: "500px",
                    "& .MuiOutlinedInput-root": {
                      height: "44px",
                      borderRadius: "22px",
                      backgroundColor: "#FFFFFF",
                      paddingLeft: '4px !important',
                      "& fieldset": {
                        borderColor: "#E5E7EB",
                        borderWidth: '1.5px',
                      },
                      "&:hover fieldset": {
                        borderColor: "#D1D5DB",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#5C17E5",
                        borderWidth: "2px",
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={isProductsLoading ? "Loading products..." : orderLabels.search}
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
                        "& .MuiInputBase-input": {
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1A212B",
                          ml: 1,
                        },
                        "& .MuiOutlinedInput-root": {
                          paddingLeft: '0 !important',
                        }
                      }}
                    />
                  )}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // File size limit: 15MB (15 * 1024 * 1024 bytes) - matches backend limit
                      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

                      if (file.size > MAX_FILE_SIZE) {
                        setSaveError(`File size exceeds the limit. Maximum file size is 15MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
                        // Reset file input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        setInvoiceFile(null);
                        setInvoiceFileName('');
                        setInvoiceAttachmentUrl('');
                        return;
                      }

                      setInvoiceFile(file);
                      setInvoiceFileName(file.name);
                      setIsExistingFile(false); // New file selected, not from server

                      // Convert file to base64 data URL for storage and display
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64String = reader.result as string;
                        setInvoiceAttachmentUrl(base64String);

                      };
                      reader.onerror = () => {
                        setSaveError('Failed to read the invoice file');
                      };
                      reader.readAsDataURL(file);

                      // Close the confirmation dialog if it was open
                      if (isUploadConfirmationDialogOpen) {
                        setIsUploadConfirmationDialogOpen(false);
                      }
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    height: "40px",
                    borderRadius: "6px",
                    backgroundColor: "#FFFFFF",
                    color: "#374151",
                    borderColor: "#D1D5DB",
                    borderWidth: "1px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#FFFFFF",
                      borderColor: "#9CA3AF",
                    },
                    "&:focus": {
                      borderColor: "#9AA8BC",
                    },
                    whiteSpace: "nowrap",
                    padding: "8px 16px",
                    boxShadow: "none",
                  }}
                >
                  {invoiceFileName
                    ? (isExistingFile
                      ? `Current: ${invoiceFileName.length > 18 ? invoiceFileName.substring(0, 18) + '...' : invoiceFileName}`
                      : `Uploaded: ${invoiceFileName.length > 18 ? invoiceFileName.substring(0, 18) + '...' : invoiceFileName}`)
                    : "Upload Invoice Receipt"}
                </Button>
                {(invoiceFileName || invoiceAttachmentUrl) && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      // Clear the current file selection
                      setInvoiceFile(null);
                      setInvoiceFileName("");
                      setInvoiceAttachmentUrl("");
                      setIsExistingFile(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                      // Note: If there was an original file, clearing it will enable save button
                      // When saved, the new file (null) will replace the old one on the server
                    }}
                    sx={{
                      marginLeft: "8px",
                      color: "#6B7280",
                      "&:hover": {
                        color: "#374151",
                        backgroundColor: "transparent",
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
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
        overflowY: "visible",
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
          setSelectedRows={() => { }}
          data={sortedData}
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
          disableFooterWrapper={true}
          footerContent={sortedData.length > 0 && currentPage === 1 ? (() => {
            const totalAmount = sortedData.reduce((sum, row) => {
              let rowTotal = 0;
              if (editingRowId === row.id) {
                const unitPrice = typeof editingData.pp === 'number' ? editingData.pp : (typeof row.pp === 'number' ? row.pp : parseFloat(String(editingData.pp || row.pp)) || 0);
                const qty = editingData.qtyReceived !== undefined ? editingData.qtyReceived : (row.qtyReceived || 0);
                const cgst = typeof editingData.cgst === 'number' ? editingData.cgst : (typeof row.cgst === 'number' ? row.cgst : parseFloat(String(editingData.cgst || row.cgst)) || 0);
                const sgst = typeof editingData.sgst === 'number' ? editingData.sgst : (typeof row.sgst === 'number' ? row.sgst : parseFloat(String(editingData.sgst || row.sgst)) || 0);
                const igst = typeof editingData.igst === 'number' ? editingData.igst : (typeof row.igst === 'number' ? row.igst : parseFloat(String(editingData.igst || row.igst)) || 0);
                const discount = typeof editingData.disc === 'number' ? editingData.disc : (typeof row.disc === 'number' ? row.disc : parseFloat(String(editingData.disc || row.disc)) || 0);

                const baseAmount = unitPrice * qty;
                const discountAmount = baseAmount * (discount / 100);
                const amountAfterDiscount = baseAmount - discountAmount;
                const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);
                rowTotal = amountAfterDiscount + taxAmount;
              } else {
                const unitPrice = typeof row.pp === 'number' ? row.pp : parseFloat(String(row.pp)) || 0;
                const qty = row.qtyReceived || 0;
                const cgst = typeof row.cgst === 'number' ? row.cgst : parseFloat(String(row.cgst)) || 0;
                const sgst = typeof row.sgst === 'number' ? row.sgst : parseFloat(String(row.sgst)) || 0;
                const igst = typeof row.igst === 'number' ? row.igst : parseFloat(String(row.igst)) || 0;
                const discount = typeof row.disc === 'number' ? row.disc : parseFloat(String(row.disc)) || 0;

                const baseAmount = unitPrice * qty;
                const discountAmount = baseAmount * (discount / 100);
                const amountAfterDiscount = baseAmount - discountAmount;
                const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);
                rowTotal = (row as any).amount !== undefined && (row as any).amount !== "" && (row as any).amount !== null
                  ? parseFloat(String((row as any).amount))
                  : amountAfterDiscount + taxAmount;
              }
              return sum + rowTotal;
            }, 0);

            return (
              <TableRow
                sx={{
                  backgroundColor: '#F9FAFB',
                }}
              >
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
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
                <TableCell sx={{ padding: '12px 16px' }} />
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
                <TableCell sx={{ padding: '12px 16px' }} />
              </TableRow>
            );
          })() : undefined}
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
          <StandardButton
            variant="primary"
            size="large"
            disabled={!validateRequiredFields() || isSaving || isSubmittingReceipt}
            onClick={isEditMode ? handleSubmitReceipt : handleProceedToPaymentClick}
            sx={{ height: "48px", width: "86px", fontSize: "12px" }}
          >
            {isSaving || isSubmittingReceipt ? "Processing..." : isEditMode ? "Save" : "Proceed to Payment"}
          </StandardButton>
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

      <ConfirmationDialog
        open={isUploadConfirmationDialogOpen}
        onClose={handleUploadConfirmationNo}
        onConfirm={handleUploadConfirmationYes}
        title="Upload Invoice Receipt"
        message="You haven't uploaded an invoice receipt. Would you like to upload it now?"
        confirmLabel="Yes, Upload"
        cancelLabel="No, Proceed Without Upload"
      />

      <ConfirmationDialog
        open={isProceedToPaymentDialogOpen}
        onClose={handleCancelProceedToPayment}
        onConfirm={handleConfirmProceedToPayment}
        title="Proceed to Payment"
        message="Proceeding to payment will create the receipt. Would you like to proceed?"
        confirmLabel="Yes, Proceed"
        cancelLabel="Cancel"
      />

      <NewSupplierModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        onSubmit={handleSupplierSubmit}
      />
    </>
  );
};

export default OrderDetails;
