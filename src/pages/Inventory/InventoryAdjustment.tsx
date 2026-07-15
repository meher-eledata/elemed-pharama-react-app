import React, { useMemo, useState, useCallback, useEffect, useLayoutEffect, useRef, startTransition } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteNewIcon from '../../assets/DeleteNew.svg';
import './InventoryAdjustment.scss';
import dayjs from 'dayjs';
import { StandardButton, PharmaDatePicker } from '../../components/Common';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import { ReusableTable, TableColumn, SearchAndFilterConfig } from '../../components/PharmaTable';
import {
  useGetBatchesForProductMutation,
  useGetBrandsFromProductNameMutation,
  useGetTypesForBrandAndProductMutation,
  useAdjustInventoryBatchesMutation,
  useDeleteBatchMutation,
  DeleteBatchSoldError,
  ProductInfo,
  GetBrandsFromProductNameResponse,
  TypeForBrandAndProduct,
} from '../../redux/slices/inventoryApi';
import { useGetProductsQuery } from '../../redux/slices/receiveApi';
import { processProductOptions } from '../Sales/SalesPage.utils';
import { extractErrorMessage } from '../../utils/errorUtils';

type BatchRow = {
  id: string; // stable unique row id derived from batch_id (batch_number is NOT unique)
  batch_id: number; // unique PK — the delete identity
  batchNumber: string | number;
  quantity: number;
  oldQuantity: number;
  expiryDate: string;
  oldExpiryDate: string;
  quantityInput?: string;
  mrp: number;
  oldMrp: number;
  packQty: number;
  oldPackQty: number;
  mrpInput?: string;
  packQtyInput?: string;
  markedForDeletion?: boolean;
};

type ProductOption = { name: string; currentQuantity?: number };
type SelectedBrand = GetBrandsFromProductNameResponse | null;
type SelectedType = TypeForBrandAndProduct | null;


const inputFieldStyles = {
  borderRadius: '10px !important',
  backgroundColor: '#ffffff',
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px !important',
    height: 40,
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    '& input': {
      padding: '0.625rem 0.875rem', // 10px = 0.625rem, 14px = 0.875rem
      fontSize: '0.875rem',
      color: '#1f2937',
      borderRadius: '0.625rem !important', // 10px = 0.625rem
    },
    '& fieldset': {
      borderColor: '#e5e7eb !important',
      borderWidth: '1.5px',
      borderRadius: '10px !important',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: '10px !important',
      borderColor: '#e5e7eb !important',
    },
    '&:hover': {
      borderRadius: '10px !important',
      backgroundColor: '#f9fafb',
      '& fieldset': {
        borderColor: '#d1d5db !important',
        borderRadius: '10px !important',
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderRadius: '10px !important',
        borderColor: '#d1d5db !important',
      },
    },
    '&.Mui-focused': {
      borderRadius: '10px !important',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
      '& fieldset': {
        borderColor: '#6366f1 !important',
        borderWidth: '2px',
        borderRadius: '10px !important',
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderRadius: '10px !important',
        borderColor: '#6366f1 !important',
      },
    },
    '&.Mui-disabled': {
      backgroundColor: '#f3f4f6',
      '& fieldset': {
        borderColor: '#e5e7eb !important',
      },
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  '& .MuiSelect-icon': {
    color: '#6b7280',
  },
};

// Editable numeric cell with caret preservation. MUI TextField with a controlled `value`
// prop loses the caret position on every state-update render (cursor jumps to end).
// We capture the caret before each onChange and restore it via useLayoutEffect.
interface EditableNumberInputProps {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  allowDecimal?: boolean;
  width?: number;
  sx?: any;
  onChange: (sanitized: string) => void;
  onBlur?: (value: string) => void;
}

const EditableNumberInput: React.FC<EditableNumberInputProps> = ({
  value,
  disabled = false,
  placeholder = '0',
  allowDecimal = false,
  width = 120,
  sx,
  onChange,
  onBlur,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caretRef.current !== null && inputRef.current && document.activeElement === inputRef.current) {
      const pos = caretRef.current;
      try {
        inputRef.current.setSelectionRange(pos, pos);
      } catch {}
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanRegex = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    const sanitized = raw.replace(cleanRegex, '');
    if (allowDecimal && (sanitized.match(/\./g) || []).length > 1) return;

    const removedBefore = (raw.slice(0, e.target.selectionStart || 0).match(cleanRegex) || []).length;
    caretRef.current = Math.max(0, (e.target.selectionStart || 0) - removedBefore);

    onChange(sanitized);
  };

  return (
    <TextField
      inputRef={inputRef}
      value={value}
      size="small"
      type="text"
      onChange={handleChange}
      onBlur={(e) => onBlur?.(e.target.value)}
      inputProps={{
        inputMode: allowDecimal ? 'decimal' : 'numeric',
        pattern: allowDecimal ? '[0-9.]*' : '[0-9]*',
      }}
      disabled={disabled}
      placeholder={placeholder}
      sx={{
        ...sx,
        width,
      }}
    />
  );
};

const InventoryAdjustment: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [getBatchesForProduct, { isLoading: isLoadingBatches, error: batchesError }] = useGetBatchesForProductMutation();
  const [getBrandsFromProductName] = useGetBrandsFromProductNameMutation();
  const [getTypesForBrandAndProduct] = useGetTypesForBrandAndProductMutation();
  const [adjustInventoryBatches, { isLoading: isSaving }] = useAdjustInventoryBatchesMutation();
  const [deleteBatch] = useDeleteBatchMutation();
  // Medicine-name autocomplete options — IDENTICAL source as the Sales flow (receiveApi get-products).
  const { data: apiProducts = [], isLoading: isLoadingProducts } = useGetProductsQuery();

  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<SelectedBrand>(null);
  const [selectedType, setSelectedType] = useState<SelectedType>(null);
  const [brandsForProduct, setBrandsForProduct] = useState<GetBrandsFromProductNameResponse[]>([]);
  const [typesForProduct, setTypesForProduct] = useState<TypeForBrandAndProduct[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'asc'
  });
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<{ quantity: number; expiryDate: string; mrp: number; packQty: number } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  // Message modal shown when one or more batches were blocked from deletion (sold; backend 409).
  const [blockedMessage, setBlockedMessage] = useState<React.ReactNode>(null);

  // Ensure consistent border radius from the start
  useEffect(() => {
    const styleId = 'inventory-adjustment-input-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root,
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root fieldset,
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline {
          border-radius: 10px !important;
        }
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root:hover,
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root:hover fieldset,
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root.Mui-focused,
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root.Mui-focused fieldset,
        .inventory-adjustment-page .MuiTextField-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-radius: 10px !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const searchAndFilterConfig: SearchAndFilterConfig = useMemo(
    () => ({
      filterOptions: []
    }),
    []
  );

  const totalQuantity = useMemo(
    () => batchRows.reduce((acc, batch) => acc + (Number.isNaN(batch.quantity) ? 0 : batch.quantity), 0),
    [batchRows]
  );

  // Medicine-name autocomplete options — IDENTICAL source as the Sales flow.
  const productOptions: ProductOption[] = useMemo(
    () => processProductOptions(apiProducts),
    [apiProducts]
  );

  const fetchBatchesForProduct = useCallback(async (productId: number) => {
    try {
      const result = await getBatchesForProduct({ product_id: productId }).unwrap();

      // Transform API batches to BatchRow format
      const transformedBatches: BatchRow[] = result.batches.map((batch: any) => {
        const expiryDateStr = batch.expiry_date ? dayjs(batch.expiry_date).format('YYYY-MM-DD') : '';
        // batch_number from API can be string (like "CTZ-2026-06-A") or number, and is NOT unique
        // (duplicates allowed). batch_id is the unique PK — use it as the stable row identity.
        const batchNumber = batch.batch_number || batch.batchNumber;

        // pg serializes DECIMAL columns as JSON strings (e.g. "73.00"); normalize to numbers at
        // load time so edit seeds/display render "73" and change detection compares numerically.
        const quantity = Number(batch.current_qty) || 0;
        const mrp = Number(batch.mrp) || 0;
        const packQty = Number(batch.pack_qty) || 1;

        return {
          id: String(batch.batch_id), // Unique row id (batch_number is NOT unique)
          batch_id: batch.batch_id, // Unique PK — the delete identity
          batchNumber: batchNumber, // Display value only (may be duplicated across rows)
          quantity,
          oldQuantity: quantity, // Store original quantity
          expiryDate: expiryDateStr,
          oldExpiryDate: expiryDateStr, // Store original expiry date
          mrp,
          oldMrp: mrp,
          packQty,
          oldPackQty: packQty,
        };
      });

      startTransition(() => {
        // total_quantity is a SUM() → also a JSON string from pg; normalize for display.
        setProductInfo({ ...result.product, total_quantity: Number(result.product.total_quantity) || 0 });
        setBatchRows(transformedBatches);
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      startTransition(() => {
        setProductInfo(null);
        setBatchRows([]);
      });
    }
  }, [getBatchesForProduct]);

  // Fetch types when a brand is selected (mirrors the Sales cascade: brand_id + product_name).
  const fetchTypesForBrandAndProduct = useCallback(async (brandId: number, productName: string) => {
    setIsLoadingTypes(true);
    try {
      const result = await getTypesForBrandAndProduct({
        brand_id: brandId,
        product_name: productName,
      }).unwrap();
      setTypesForProduct(result);
      setSelectedType(null);
      setProductInfo(null);
      setBatchRows([]);
      // Auto-select when exactly one type (matches Sales behaviour) → load its batches.
      if (result.length === 1) {
        setSelectedType(result[0]);
        await fetchBatchesForProduct(result[0].product_id);
      }
    } catch (error) {
      console.error('Error fetching types for product:', error);
      setTypesForProduct([]);
    } finally {
      setIsLoadingTypes(false);
    }
  }, [getTypesForBrandAndProduct, fetchBatchesForProduct]);

  // Fetch brands for the selected medicine name (mirrors the Sales cascade).
  const fetchBrandsForProductName = useCallback(async (productName: string) => {
    setIsLoadingBrands(true);
    setSelectedBrand(null);
    setBrandsForProduct([]);
    setSelectedType(null);
    setTypesForProduct([]);
    setProductInfo(null);
    setBatchRows([]);
    try {
      const result = await getBrandsFromProductName({ product_name: productName }).unwrap();
      setBrandsForProduct(result);
      // Auto-select when exactly one brand (matches Sales behaviour).
      if (result.length === 1) {
        setSelectedBrand(result[0]);
        await fetchTypesForBrandAndProduct(result[0].id, productName);
      }
    } catch (error) {
      console.error('Error fetching brands for product:', error);
      setBrandsForProduct([]);
    } finally {
      setIsLoadingBrands(false);
    }
  }, [getBrandsFromProductName, fetchTypesForBrandAndProduct]);

  const sortedRows = useMemo(() => {
    const rowsCopy = [...batchRows];
    const activeSortKey = sortConfig.key || 'id';
    const activeSortDirection = sortConfig.direction || 'asc';

    return rowsCopy.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      // Sort by the LAST-SAVED values (oldXxx) for editable fields, not the live ones.
      // Otherwise every keystroke in the input re-sorts the table, the row moves position,
      // React remounts the input, and the cursor jumps to the end.
      switch (activeSortKey) {
        case 'quantity':
          aValue = a.oldQuantity;
          bValue = b.oldQuantity;
          break;
        case 'mrp':
          aValue = a.oldMrp;
          bValue = b.oldMrp;
          break;
        case 'packQty':
          aValue = a.oldPackQty;
          bValue = b.oldPackQty;
          break;
        case 'expiryDate':
          aValue = a.oldExpiryDate ?? a.expiryDate;
          bValue = b.oldExpiryDate ?? b.expiryDate;
          break;
        case 'id':
        default:
          // The "Batch Number" column sorts by the displayed batch_number, not the internal id.
          aValue = String(a.batchNumber);
          bValue = String(b.batchNumber);
          break;
      }

      if (aValue < bValue) {
        return activeSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return activeSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [batchRows, sortConfig]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedRows;
    }
    const query = searchTerm.toLowerCase();
    return sortedRows.filter((row) => String(row.batchNumber).toLowerCase().includes(query));
  }, [sortedRows, searchTerm]);

  const handleQuantityChange = (batchId: string, value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');

    setBatchRows((prev) =>
      prev.map((batch) => {
        if (batch.id === batchId) {
          // Store the raw input string for display
          const inputValue = numericValue === '' ? '' : numericValue;
          // Parse to number for storage (remove leading zeros)
          const parsed = numericValue === '' ? 0 : parseInt(numericValue, 10);
          return {
            ...batch,
            quantity: Number.isNaN(parsed) ? 0 : parsed,
            quantityInput: inputValue
          };
        }
        return batch;
      })
    );
  };

  const handleMrpChange = (batchId: string, value: string) => {
    // Allow numeric input (float)
    const numericValue = value.replace(/[^0-9.]/g, '');

    // Prevent multiple decimals
    if ((numericValue.match(/\./g) || []).length > 1) return;

    setBatchRows((prev) =>
      prev.map((batch) => {
        if (batch.id === batchId) {
          const inputValue = numericValue === '' ? '' : numericValue;
          const parsed = numericValue === '' ? 0 : parseFloat(numericValue);
          return {
            ...batch,
            mrp: Number.isNaN(parsed) ? 0 : parsed,
            mrpInput: inputValue
          };
        }
        return batch;
      })
    );
  };

  const handlePackQtyChange = (batchId: string, value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');

    setBatchRows((prev) =>
      prev.map((batch) => {
        if (batch.id === batchId) {
          const inputValue = numericValue === '' ? '' : numericValue;
          const parsed = numericValue === '' ? 0 : parseInt(numericValue, 10);
          return {
            ...batch,
            packQty: Number.isNaN(parsed) ? 0 : parsed,
            packQtyInput: inputValue
          };
        }
        return batch;
      })
    );
  };

  const handleEditRow = (batchId: string) => {
    const batch = batchRows.find(b => b.id === batchId);
    if (batch) {
      setEditingRowId(batchId);
      // Store the committed values (oldQuantity/oldExpiryDate) to restore if user cancels
      // This way cancel restores to the last "checked" state, not the current edited state
      setOriginalValues({
        quantity: batch.oldQuantity,
        expiryDate: batch.oldExpiryDate,
        mrp: batch.oldMrp,
        packQty: batch.oldPackQty
      });
      // Initialize quantityInput, mrpInput, packQtyInput with current values for editing
      setBatchRows((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? {
              ...b,
              quantityInput: b.quantity === 0 ? '' : b.quantity.toString(),
              mrpInput: b.mrp === 0 ? '' : b.mrp.toString(),
              packQtyInput: b.packQty === 0 ? '' : b.packQty.toString()
            }
            : b
        )
      );
    }
  };

  const handleCancelEdit = (batchId?: string) => {
    const rowToCancel = batchId || editingRowId;
    if (rowToCancel && originalValues) {
      // Restore to the last committed values (when check was last clicked)
      setBatchRows((prev) =>
        prev.map((b) =>
          b.id === rowToCancel
            ? {
              ...b,
              quantity: originalValues.quantity,
              expiryDate: originalValues.expiryDate,
              mrp: originalValues.mrp,
              packQty: originalValues.packQty,
              quantityInput: undefined, // Clear input value
              mrpInput: undefined,
              packQtyInput: undefined,
            }
            : b
        )
      );
    }
    setEditingRowId(null);
    setOriginalValues(null);
  };

  const handleConfirmEdit = (batchId: string) => {
    // Just update the frontend display - exit edit mode
    // DO NOT update oldQuantity/oldExpiryDate here - keep them as original values
    // They will be updated only after successful save
    setBatchRows((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          // If input exists, use it to update quantity (convert/parse)
          let finalQuantity = b.quantity;
          if (b.quantityInput !== undefined && b.quantityInput !== '') {
            const parsed = parseInt(b.quantityInput, 10);
            finalQuantity = Number.isNaN(parsed) ? 0 : parsed;
          }

          let finalMrp = b.mrp;
          if (b.mrpInput !== undefined && b.mrpInput !== '') {
            const parsed = parseFloat(b.mrpInput);
            finalMrp = Number.isNaN(parsed) ? 0 : parsed;
          }

          let finalPackQty = b.packQty;
          if (b.packQtyInput !== undefined && b.packQtyInput !== '') {
            const parsed = parseInt(b.packQtyInput, 10);
            finalPackQty = Number.isNaN(parsed) ? 0 : parsed;
          }

          return {
            ...b,
            quantity: finalQuantity,
            mrp: finalMrp,
            packQty: finalPackQty,
            // Keep oldValues unchanged - they represent the original loaded values
            quantityInput: undefined,
            mrpInput: undefined,
            packQtyInput: undefined,
          };
        }
        return b;
      })
    );

    // Exit edit mode
    setEditingRowId(null);
    setOriginalValues(null);
  };

  const handleConfirmAdjustment = async () => {
    // When searching by Product ID, selectedType may be null, but productInfo has product_id
    const productId = selectedType?.product_id || productInfo?.product_id;

    if (!productInfo || !productId || batchRows.length === 0) {
      setConfirmDialogOpen(false);
      showSnackbar('Please select a product with at least one batch before saving.', 'error');
      return;
    }

    try {
      const username = user?.username || 'admin';

      // Batches the user marked for deletion (handled separately via the delete-batch endpoint).
      const deletionBatches = batchRows.filter((batch) => batch.markedForDeletion);

      // Get all NON-deleted batches that have been modified (quantity / expiry / mrp / pack changed)
      const modifiedBatches = batchRows.filter((batch) => {
        if (batch.markedForDeletion) return false;
        const quantityChanged = batch.quantity !== batch.oldQuantity;
        const expiryDateChanged = batch.expiryDate !== batch.oldExpiryDate;
        const mrpChanged = batch.mrp !== batch.oldMrp;
        const packQtyChanged = batch.packQty !== batch.oldPackQty;
        return quantityChanged || expiryDateChanged || mrpChanged || packQtyChanged;
      });

      if (modifiedBatches.length === 0 && deletionBatches.length === 0) {
        setConfirmDialogOpen(false);
        showSnackbar('No changes to save.', 'error');
        return;
      }

      const lines = modifiedBatches.map((batch) => {
        const batchNumber = batch.batchNumber; // The original batch_number (string or number) like "AMX-2026-02-A"

        if (batchNumber === undefined || batchNumber === null) {
          console.error('Invalid batchNumber for batch:', batch);
          throw new Error(`Invalid batch_number for batch ${batch.id}`);
        }

        return {
          // batch_id is the unique PK — batch_number is NOT unique (duplicates exist), so the
          // backend resolves the row by batch_id; batch_number stays as a legacy fallback.
          batch_id: batch.batch_id,
          batch_number: batchNumber,
          old_qty: batch.oldQuantity,
          new_qty: batch.quantity,
          expiry_date: batch.expiryDate || dayjs().format('YYYY-MM-DD'),
          mrp: batch.mrp,
          pack_qty: batch.packQty,
        };
      });

      if (modifiedBatches.length > 0) {
        await adjustInventoryBatches({
          username,
          product_id: productId,
          lines,
        }).unwrap();

        // Update oldQuantity and oldExpiryDate for all modified batches to reflect the new values after successful save
        setBatchRows((prev) =>
          prev.map((b) => {
            const modified = modifiedBatches.find(mb => mb.id === b.id);
            return modified
              ? {
                ...b,
                oldQuantity: b.quantity, // Update old quantity to current quantity
                oldExpiryDate: b.expiryDate, // Update old expiry date to current expiry date
                oldMrp: b.mrp,
                oldPackQty: b.packQty,
              }
              : b;
          })
        );
      }

      // Process deletions sequentially so error handling stays simple. Collect successes and the
      // batches the backend blocked (409 — sold) so we can explain why and list the invoice numbers.
      const deletedIds: string[] = [];
      const blocked: { batchId: number; batchNumber: string | number; invoiceNumbers: string[] }[] = [];
      let otherDeleteError: unknown = null;

      for (const batch of deletionBatches) {
        try {
          // Delete the single unique row by its PK — batch_number is NOT unique, so deleting by
          // batch_number would remove every duplicate-numbered row.
          await deleteBatch({ batch_id: batch.batch_id }).unwrap();
          deletedIds.push(batch.id);
        } catch (err) {
          const status = (err as { status?: number })?.status;
          const data = (err as { data?: DeleteBatchSoldError })?.data;
          if (status === 409 && data && Array.isArray(data.invoice_numbers)) {
            const invoiceNumbers = data.invoice_numbers.length
              ? data.invoice_numbers
              : (data.invoices || []).map((inv) => inv.invoice_number);
            blocked.push({ batchId: batch.batch_id, batchNumber: batch.batchNumber, invoiceNumbers });
          } else {
            otherDeleteError = err;
          }
        }
      }

      setConfirmDialogOpen(false);

      // Drop successfully-deleted rows immediately so they disappear; blocked rows stay marked.
      if (deletedIds.length > 0) {
        setBatchRows((prev) => prev.filter((b) => !deletedIds.includes(b.id)));
      }

      // Surface a clear message modal for any blocked (sold) batches, listing the invoice numbers.
      if (blocked.length > 0) {
        setBlockedMessage(
          <Box sx={{ textAlign: 'left' }}>
            {blocked.map((b) => (
              <Typography key={b.batchId} variant="body2" sx={{ mb: 1 }}>
                Batch <strong>{String(b.batchNumber)}</strong> cannot be deleted because product
                from it was sold on invoice(s): <strong>{b.invoiceNumbers.join(', ')}</strong>.
              </Typography>
            ))}
          </Box>
        );
      } else if (otherDeleteError) {
        showSnackbar(extractErrorMessage(otherDeleteError, 'Failed to delete batch.'), 'error');
      } else {
        showSnackbar('Inventory adjustment saved successfully.', 'success');
      }

      // Refresh batches to get latest data (deleted batches gone, balances updated)
      const productIdToRefresh = selectedType?.product_id || productInfo?.product_id;
      if (productIdToRefresh) {
        fetchBatchesForProduct(productIdToRefresh);
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      setConfirmDialogOpen(false);
      showSnackbar(extractErrorMessage(error, 'Failed to save inventory adjustment.'), 'error');
    }
  };


  // Toggle the batch's "marked for deletion" flag. The row stays in the table so the user can see
  // what will be deleted on Save and can undo by clicking again. Actual deletion happens on Save.
  const handleRemoveRow = (batchId: string) => {
    setBatchRows((prev) =>
      prev.map((batch) =>
        batch.id === batchId
          ? { ...batch, markedForDeletion: !batch.markedForDeletion }
          : batch
      )
    );
  };

  const handleReset = () => {
    setSelectedProductName(null);
    setSelectedBrand(null);
    setSelectedType(null);
    setBrandsForProduct([]);
    setTypesForProduct([]);
    setProductInfo(null);
    setBatchRows([]);
    setSelectedRows([]);
    setSearchTerm('');
    setSortConfig({ key: 'id', direction: 'asc' });
  };

  const handleSave = () => {
    // When searching by Product ID, selectedType may be null, but productInfo has product_id
    const productId = selectedType?.product_id || productInfo?.product_id;

    if (!productInfo || !productId || batchRows.length === 0) {
      return;
    }

    const hasDeletions = batchRows.some((batch) => batch.markedForDeletion);

    const modifiedBatches = batchRows.filter((batch) => {
      if (batch.markedForDeletion) return false;
      const quantityChanged = batch.quantity !== batch.oldQuantity;
      const expiryDateChanged = batch.expiryDate !== batch.oldExpiryDate;
      const mrpChanged = batch.mrp !== batch.oldMrp;
      const packQtyChanged = batch.packQty !== batch.oldPackQty;
      return quantityChanged || expiryDateChanged || mrpChanged || packQtyChanged;
    });

    if (modifiedBatches.length === 0 && !hasDeletions) {
      // No changes to save
      return;
    }

    // Show confirmation modal
    setConfirmDialogOpen(true);
  };

  const handleSortRequest = (key: string) => {
    setSortConfig((prev) => {
      const isSameKey = prev.key === key;
      const nextDirection = isSameKey && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction: nextDirection };
    });
  };

  const batchColumns: TableColumn<BatchRow>[] = [
    {
      key: 'id',
      header: 'Batch Number',
      sortable: true,
      render: (batch) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: batch.markedForDeletion ? '#9CA3AF' : 'inherit',
              textDecoration: batch.markedForDeletion ? 'line-through' : 'none',
            }}
          >
            {batch.batchNumber}
          </Typography>
          {batch.markedForDeletion && (
            <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
              Will be deleted
            </Typography>
          )}
        </Box>
      )
    },
    {
      key: 'quantity',
      header: 'Current Units',
      sortable: true,
      headerRender: () => (
        <Box sx={{ textAlign: 'left', width: '100%' }}>Current Units</Box>
      ),
      render: (batch) => {
        const isEditing = editingRowId === batch.id;

        // Use quantityInput if available (during editing), otherwise use quantity
        const displayValue = isEditing && batch.quantityInput !== undefined
          ? batch.quantityInput
          : (batch.quantity === 0 ? '' : batch.quantity.toString());

        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <EditableNumberInput
              value={displayValue}
              disabled={!isEditing}
              onChange={(sanitized) => handleQuantityChange(batch.id, sanitized)}
              onBlur={(rawValue) => {
                const value = rawValue.trim();
                if (value === '') {
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, quantity: 0, quantityInput: '' }
                        : b
                    )
                  );
                } else {
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, quantityInput: undefined }
                        : b
                    )
                  );
                }
              }}
              sx={{
                ...inputFieldStyles,
                textAlign: 'left',
                '& .MuiInputBase-input': {
                  textAlign: 'left',
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#1f2937',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                }
              }}
            />
          </Box>
        );
      }
    },
    {
      key: 'mrp',
      header: 'MRP',
      sortable: true,
      headerRender: () => (
        <Box sx={{ textAlign: 'left', width: '100%' }}>MRP</Box>
      ),
      render: (batch) => {
        const isEditing = editingRowId === batch.id;
        const displayValue = isEditing && batch.mrpInput !== undefined
          ? batch.mrpInput
          : (batch.mrp === 0 ? '' : batch.mrp.toString());

        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <EditableNumberInput
              value={displayValue}
              disabled={!isEditing}
              placeholder="0.00"
              allowDecimal
              width={100}
              onChange={(sanitized) => handleMrpChange(batch.id, sanitized)}
              onBlur={(rawValue) => {
                const value = rawValue.trim();
                if (value === '') {
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, mrp: 0, mrpInput: '' }
                        : b
                    )
                  );
                } else {
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, mrpInput: undefined }
                        : b
                    )
                  );
                }
              }}
              sx={{
                ...inputFieldStyles,
                textAlign: 'left',
                '& .MuiInputBase-input': { textAlign: 'left' },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#1f2937',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                }
              }}
            />
          </Box>
        );
      }
    },
    {
      key: 'packQty',
      header: 'Package Info',
      sortable: true,
      headerRender: () => (
        <Box sx={{ textAlign: 'left', width: '100%' }}>Package Info</Box>
      ),
      render: (batch) => {
        const isEditing = editingRowId === batch.id;
        const displayValue = isEditing && batch.packQtyInput !== undefined
          ? batch.packQtyInput
          : (batch.packQty === 0 ? '' : batch.packQty.toString());

        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <EditableNumberInput
              value={displayValue}
              disabled={!isEditing}
              placeholder="1"
              width={80}
              onChange={(sanitized) => handlePackQtyChange(batch.id, sanitized)}
              onBlur={(rawValue) => {
                const value = rawValue.trim();
                if (value === '') {
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, packQty: 0, packQtyInput: '' }
                        : b
                    )
                  );
                } else {
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, packQtyInput: undefined }
                        : b
                    )
                  );
                }
              }}
              sx={{
                ...inputFieldStyles,
                textAlign: 'left',
                '& .MuiInputBase-input': { textAlign: 'left' },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#1f2937',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                }
              }}
            />
          </Box>
        );
      }
    },
    {
      key: 'expiryDate',
      header: 'Expiry date',
      sortable: true,
      columnWidth: '180px',
      render: (batch) => {
        const isEditing = editingRowId === batch.id;

        return (
          <Box sx={{ width: 150, maxWidth: 150 }}>
            <PharmaDatePicker
              value={batch.expiryDate ? dayjs(batch.expiryDate) : null}
              onChange={(newValue) => {
                setBatchRows((prev) =>
                  prev.map((row) =>
                    row.id === batch.id ? { ...row, expiryDate: newValue ? newValue.format('YYYY-MM-DD') : '' } : row
                  )
                );
              }}
              minDate={dayjs().startOf('day')} // Only allow today and future dates
              disabled={!isEditing}
              width={150}
              height={36}
            />
          </Box>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      columnWidth: '120px',
      headerRender: () => (
        <Box sx={{ textAlign: 'center', width: '100%' }}>Actions</Box>
      ),
      render: (batch) => {
        const isEditing = editingRowId === batch.id;

        // A row marked for deletion shows only an undo affordance (click again to un-mark).
        if (batch.markedForDeletion) {
          return (
            <Box display="flex" justifyContent="center" gap={1}>
              <StandardButton
                variant="outline"
                size="small"
                onClick={() => handleRemoveRow(batch.id)}
                title="Undo delete"
              >
                Undo
              </StandardButton>
            </Box>
          );
        }

        return (
          <Box display="flex" justifyContent="center" gap={1}>
            {isEditing ? (
              <>
                <IconButton
                  size="small"
                  onClick={() => handleConfirmEdit(batch.id)}
                  sx={{
                    padding: '0.25rem', // 4px = 0.25rem
                    color: '#5C17E5',
                    '&:hover': {
                      backgroundColor: '#F3E8FF',
                      color: '#5C17E5'
                    }
                  }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleCancelEdit(batch.id)}
                  title="Cancel editing"
                  sx={{
                    padding: '4px',
                    color: '#728197',
                    '&:hover': {
                      color: '#EF4444',
                      backgroundColor: '#FEF2F2'
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
                  onClick={() => handleEditRow(batch.id)}
                  sx={{
                    padding: '4px',
                    color: '#728197',
                    '&:hover': {
                      color: '#5C17E5'
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveRow(batch.id)}
                  sx={{
                    padding: '4px',
                    color: '#728197',
                    '&:hover': {
                      color: '#728197',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <img
                    src={DeleteNewIcon}
                    alt="Delete"
                    style={{
                      width: '16px',
                      height: '16px'
                    }}
                  />
                </IconButton>
              </>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <Box className="inventory-adjustment-page">
      <Container maxWidth="xl" disableGutters>
        <Typography variant="h3" className="page-heading">
          Inventory Adjustment
        </Typography>

        <Paper elevation={0} className="adjustment-card">
          <Box className="product-selection-section">
            <Box className="product-selection-header">
              <Typography variant="h6" className="product-selection-title">
                Product Selection
              </Typography>
              <StandardButton
                variant="outline"
                size="medium"
                onClick={handleReset}
                sx={{ minWidth: '100px' }}
              >
                Clear All
              </StandardButton>
            </Box>
            <Box className="product-selection-fields">
              <Box className="selection-field-group">
                <Typography variant="body2" className="field-label">
                  Medicine Name
                </Typography>
                <Autocomplete
                  options={productOptions}
                  getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                  value={selectedProductName ? { name: selectedProductName } : null}
                  isOptionEqualToValue={(option, value) => option.name === value.name}
                  onChange={(_, newValue) => {
                    const productName = newValue ? newValue.name : null;
                    setSelectedProductName(productName);
                    if (productName) {
                      fetchBrandsForProductName(productName);
                    } else {
                      setSelectedBrand(null);
                      setBrandsForProduct([]);
                      setSelectedType(null);
                      setTypesForProduct([]);
                      setProductInfo(null);
                      setBatchRows([]);
                    }
                  }}
                  disabled={isLoadingProducts}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Select Medicine"
                      sx={inputFieldStyles}
                    />
                  )}
                  slotProps={{
                    popper: {
                      sx: {
                        "& .MuiPaper-root": {
                          borderRadius: "12px",
                          marginTop: "4px",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                          border: "1px solid #E6ECF5",
                          height: "auto !important",
                          padding: "0px !important",
                          overflow: "hidden",
                          minHeight: "unset !important",
                          "& .MuiAutocomplete-listbox": {
                            padding: "0px !important",
                            maxHeight: "300px !important",
                            overflow: "auto",
                            minHeight: "unset !important",
                          },
                        },
                      },
                    },
                  }}
                  ListboxProps={{
                    sx: {
                      padding: '0px !important',
                      maxHeight: '300px !important',
                      minHeight: 'unset !important',
                      overflow: 'auto',
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </Box>
              <Box className="selection-field-group">
                <Typography variant="body2" className="field-label">
                  Brand
                </Typography>
                <Autocomplete
                  options={brandsForProduct}
                  getOptionLabel={(option) => option.brand_name}
                  value={selectedBrand}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => {
                    setSelectedBrand(newValue);
                    if (newValue && selectedProductName) {
                      fetchTypesForBrandAndProduct(newValue.id, selectedProductName);
                    } else {
                      setTypesForProduct([]);
                      setSelectedType(null);
                      setProductInfo(null);
                      setBatchRows([]);
                    }
                  }}
                  disabled={!selectedProductName || isLoadingBrands}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Select Brand"
                      sx={inputFieldStyles}
                    />
                  )}
                  slotProps={{
                    popper: {
                      sx: {
                        "& .MuiPaper-root": {
                          borderRadius: "12px",
                          marginTop: "4px",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                          border: "1px solid #E6ECF5",
                          height: "auto !important",
                          padding: "0px !important",
                          overflow: "hidden",
                          minHeight: "unset !important",
                          "& .MuiAutocomplete-listbox": {
                            padding: "0px !important",
                            maxHeight: "300px !important",
                            overflow: "auto",
                            minHeight: "unset !important",
                          },
                        },
                      },
                    },
                  }}
                  ListboxProps={{
                    sx: {
                      padding: '0px !important',
                      maxHeight: '300px !important',
                      minHeight: 'unset !important',
                      overflow: 'auto',
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </Box>
              <Box className="selection-field-group">
                <Typography variant="body2" className="field-label">
                  Type
                </Typography>
                <Autocomplete
                  options={typesForProduct}
                  getOptionLabel={(option) => option.type}
                  value={selectedType}
                  isOptionEqualToValue={(option, value) => option.product_id === value.product_id}
                  onChange={(_, newValue) => {
                    setSelectedType(newValue);
                    if (newValue) {
                      fetchBatchesForProduct(newValue.product_id);
                    } else {
                      setProductInfo(null);
                      setBatchRows([]);
                    }
                  }}
                  disabled={!selectedBrand || isLoadingTypes}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Select Type"
                      sx={inputFieldStyles}
                    />
                  )}
                  slotProps={{
                    popper: {
                      sx: {
                        "& .MuiPaper-root": {
                          borderRadius: "12px",
                          marginTop: "4px",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                          border: "1px solid #E6ECF5",
                          height: "auto !important",
                          padding: "0px !important",
                          overflow: "hidden",
                          minHeight: "unset !important",
                          "& .MuiAutocomplete-listbox": {
                            padding: "0px !important",
                            maxHeight: "300px !important",
                            overflow: "auto",
                            minHeight: "unset !important",
                          },
                        },
                      },
                    },
                  }}
                  ListboxProps={{
                    sx: {
                      padding: '0px !important',
                      maxHeight: '300px !important',
                      minHeight: 'unset !important',
                      overflow: 'auto',
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </Box>
              <Box className="product-details-wrapper">
                <Card variant="outlined" className="product-details-card">
                  <CardContent>
                    <Typography variant="subtitle1" className="product-details-title">
                      Product Details
                    </Typography>
                    {productInfo ? (
                      <Box className="product-details-grid">
                        <Typography variant="body2" className="detail-label">
                          Product Name
                        </Typography>
                        <Typography variant="body2" className="detail-value">
                          {productInfo.product_name}
                        </Typography>

                        <Typography variant="body2" className="detail-label">
                          Type
                        </Typography>
                        <Typography variant="body2" className="detail-value">
                          {productInfo.type}
                        </Typography>

                        <Typography variant="body2" className="detail-label">
                          Brand Name
                        </Typography>
                        <Typography variant="body2" className="detail-value">
                          {productInfo.brand_name || selectedBrand?.brand_name || productInfo.brand_id}
                        </Typography>

                        <Typography variant="body2" className="detail-label">
                          HSN ID
                        </Typography>
                        <Typography variant="body2" className="detail-value">
                          {productInfo.hsn_id}
                        </Typography>

                        <Typography variant="body2" className="detail-label">
                          Total Quantity
                        </Typography>
                        <Typography variant="body2" className="detail-value">
                          {productInfo.total_quantity ?? totalQuantity}
                        </Typography>
                      </Box>
                    ) : (
                      <Box className="product-details-empty">
                        <Typography variant="body2" className="empty-message">
                          Select a product to view details
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>

          {batchesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading batches. Please try again.
            </Alert>
          )}

          <Box className="inventory-table-wrapper" sx={{ position: 'relative' }}>
            <Typography variant="subtitle1" className="section-title">
              Inventory Details
            </Typography>
            {isLoadingBatches && (
              <Box sx={{
                position: 'absolute',
                top: '48px', // Start below the title
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1
              }}>
                <CircularProgress />
              </Box>
            )}
            <ReusableTable
              data={filteredRows}
              columns={batchColumns}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              searchAndFilterConfig={searchAndFilterConfig}
              currentSearchTerm={searchTerm}
              onSearchChange={(event) => setSearchTerm(event.target.value)}
              showFilters={false}
              onShowFiltersToggle={() => undefined}
              currentFilterKey=""
              onFilterSelect={() => undefined}
              totalRows={filteredRows.length}
              rowsPerPage={Math.max(filteredRows.length, 1)}
              currentPage={1}
              onPageChange={() => undefined}
              onSortRequest={handleSortRequest}
              sortConfig={sortConfig}
              emptyMessage={productInfo ? "No batches for this product" : "No data available"}
            />
          </Box>

          <Box className="actions-row">
            <StandardButton variant="outline" size="large" onClick={handleReset}>
              Cancel
            </StandardButton>
            <StandardButton
              variant="primary"
              size="large"
              onClick={handleSave}
              disabled={!productInfo || batchRows.length === 0 || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </StandardButton>
          </Box>
        </Paper>
      </Container>

      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Confirm Inventory Adjustment"
        message={`Are you sure you want to save all inventory adjustments? This action cannot be undone.`}
        onClose={() => {
          setConfirmDialogOpen(false);
        }}
        onConfirm={handleConfirmAdjustment}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />

      <ConfirmationDialog
        open={blockedMessage !== null}
        title="Batch cannot be deleted"
        message={blockedMessage}
        onClose={() => setBlockedMessage(null)}
        onConfirm={() => setBlockedMessage(null)}
        confirmLabel="OK"
        cancelLabel="Close"
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryAdjustment;