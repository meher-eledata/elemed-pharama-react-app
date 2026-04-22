import React, { useMemo, useState, useCallback, useEffect, startTransition } from 'react';
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
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
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
  useGetAllBrandsQuery,
  useGetProductsForBrandMutation,
  useGetTypesForBrandAndProductMutation,
  useAdjustInventoryBatchesMutation,
  useGetProductIdsQuery,
  ProductInfo,
  Brand,
  ProductForBrand,
  TypeForBrandAndProduct,
} from '../../redux/slices/inventoryApi';

type BatchRow = {
  id: string;
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
};

type SelectedBrand = Brand | null;
type SelectedProduct = ProductForBrand | null;
type SelectedType = TypeForBrandAndProduct | null;

type SearchType = 'product' | 'id';


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

const InventoryAdjustment: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [getBatchesForProduct, { isLoading: isLoadingBatches, error: batchesError }] = useGetBatchesForProductMutation();
  const [getProductsForBrand] = useGetProductsForBrandMutation();
  const [getTypesForBrandAndProduct] = useGetTypesForBrandAndProductMutation();
  const [adjustInventoryBatches, { isLoading: isSaving }] = useAdjustInventoryBatchesMutation();
  const { data: brands = [], isLoading: isLoadingBrands } = useGetAllBrandsQuery();

  const [selectedBrand, setSelectedBrand] = useState<SelectedBrand>(null);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct>(null);
  const [selectedType, setSelectedType] = useState<SelectedType>(null);
  const [productsForBrand, setProductsForBrand] = useState<ProductForBrand[]>([]);
  const [typesForProduct, setTypesForProduct] = useState<TypeForBrandAndProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  const [searchType, setSearchType] = useState<SearchType>('product');

  // New efficient endpoint for fetching all product IDs
  const { data: productIdData, isLoading: isLoadingProductIds } = useGetProductIdsQuery(undefined, {
    skip: searchType !== 'id'
  });

  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'asc'
  });
  const [productIdSearch, setProductIdSearch] = useState<string>('');
  const [productIdOptions, setProductIdOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedProductById, setSelectedProductById] = useState<{ id: number; name: string } | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<{ quantity: number; expiryDate: string; mrp: number; packQty: number } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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

  // Fetch products when brand is selected
  const fetchProductsForBrand = useCallback(async (brandId: number) => {
    setIsLoadingProducts(true);
    try {
      const result = await getProductsForBrand({ brand_id: brandId }).unwrap();
      setProductsForBrand(result);
      setSelectedProduct(null);
      setSelectedType(null);
      setTypesForProduct([]);
      setProductInfo(null);
      setBatchRows([]);
    } catch (error) {
      console.error('Error fetching products for brand:', error);
      setProductsForBrand([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [getProductsForBrand]);

  // Fetch types when product is selected
  const fetchTypesForProduct = useCallback(async (brandId: number, brandName: string, productName: string) => {
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
    } catch (error) {
      console.error('Error fetching types for product:', error);
      setTypesForProduct([]);
    } finally {
      setIsLoadingTypes(false);
    }
  }, [getTypesForBrandAndProduct]);

  const fetchBatchesForProduct = useCallback(async (productId: number) => {
    try {
      const result = await getBatchesForProduct({ product_id: productId }).unwrap();

      // Transform API batches to BatchRow format
      const transformedBatches: BatchRow[] = result.batches.map((batch: any) => {
        const expiryDateStr = batch.expiry_date ? dayjs(batch.expiry_date).format('YYYY-MM-DD') : '';
        // batch_number from API can be string (like "CTZ-2026-06-A") or number
        // We'll use it as-is for the API call
        const batchNumber = batch.batch_number || batch.batchNumber;

        return {
          id: String(batchNumber), // Use batch_number as the id for display
          batchNumber: batchNumber, // Store batch_number for API calls
          quantity: batch.current_qty,
          oldQuantity: batch.current_qty, // Store original quantity
          expiryDate: expiryDateStr,
          oldExpiryDate: expiryDateStr, // Store original expiry date
          mrp: batch.mrp || 0,
          oldMrp: batch.mrp || 0,
          packQty: batch.pack_qty || 1,
          oldPackQty: batch.pack_qty || 1,
        };
      });

      startTransition(() => {
        setProductInfo(result.product);
        setBatchRows(transformedBatches);

        // If selectedType is null (searching by Product ID), create it from productInfo
        if (!selectedType && result.product) {
          setSelectedType({
            type: result.product.type,
            product_id: result.product.product_id,
          });
        }
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      startTransition(() => {
        setProductInfo(null);
        setBatchRows([]);
      });
    }
  }, [getBatchesForProduct, selectedType]);

  // Update product ID options when new data arrives from the single efficient endpoint
  useEffect(() => {
    if (productIdData?.product_ids) {
      const options = productIdData.product_ids.map(id => ({
        id: id,
        name: String(id)
      }));
      setProductIdOptions(options);
    }
  }, [productIdData]);

  const sortedRows = useMemo(() => {
    const rowsCopy = [...batchRows];
    const activeSortKey = sortConfig.key || 'id';
    const activeSortDirection = sortConfig.direction || 'asc';

    return rowsCopy.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (activeSortKey) {
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'mrp':
          aValue = a.mrp;
          bValue = b.mrp;
          break;
        case 'packQty':
          aValue = a.packQty;
          bValue = b.packQty;
          break;
        case 'expiryDate':
          aValue = a.expiryDate;
          bValue = b.expiryDate;
          break;
        case 'id':
        default:
          aValue = a.id;
          bValue = b.id;
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
    return sortedRows.filter((row) => row.id.toLowerCase().includes(query));
  }, [sortedRows, searchTerm]);

  // Handle brand selection
  const handleBrandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const brandId = parseInt(event.target.value);
    const brand = brands.find((b) => b.id === brandId) || null;
    setSelectedBrand(brand);
    if (brand) {
      fetchProductsForBrand(brand.id);
    } else {
      setProductsForBrand([]);
      setSelectedProduct(null);
      setSelectedType(null);
      setTypesForProduct([]);
      setProductInfo(null);
      setBatchRows([]);
    }
  };

  // Handle product selection
  const handleProductChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const productName = event.target.value;
    const product = productsForBrand.find((p) => p.name === productName) || null;
    setSelectedProduct(product);
    if (product && selectedBrand) {
      fetchTypesForProduct(selectedBrand.id, selectedBrand.brand_name, product.name);
    } else {
      setTypesForProduct([]);
      setSelectedType(null);
      setProductInfo(null);
      setBatchRows([]);
    }
  };

  // Handle type selection
  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const type = event.target.value;
    const typeData = typesForProduct.find((t) => t.type === type) || null;
    setSelectedType(typeData);
    if (typeData) {
      fetchBatchesForProduct(typeData.product_id);
    } else {
      setProductInfo(null);
      setBatchRows([]);
    }
  };

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
      return;
    }

    try {
      const username = user?.username || 'admin';

      // Get all batches that have been modified (quantity or expiry date changed)
      const modifiedBatches = batchRows.filter((batch) => {
        const quantityChanged = batch.quantity !== batch.oldQuantity;
        const expiryDateChanged = batch.expiryDate !== batch.oldExpiryDate;
        const mrpChanged = batch.mrp !== batch.oldMrp;
        const packQtyChanged = batch.packQty !== batch.oldPackQty;
        return quantityChanged || expiryDateChanged || mrpChanged || packQtyChanged;
      });

      if (modifiedBatches.length === 0) {
        setConfirmDialogOpen(false);
        return;
      }

      const lines = modifiedBatches.map((batch) => {
        // Use batch.batchNumber (the original batch_number from API) for the API call
        // The backend expects batch_number, not batch_id
        const batchNumber = batch.batchNumber; // This is the batch_number (string or number) like "AMX-2026-02-A"

        if (batchNumber === undefined || batchNumber === null) {
          console.error('Invalid batchNumber for batch:', batch);
          throw new Error(`Invalid batch_number for batch ${batch.id}`);
        }

        return {
          batch_number: batchNumber, // Use batch_number (string or number) for API as backend expects
          old_qty: batch.oldQuantity,
          new_qty: batch.quantity,
          expiry_date: batch.expiryDate || dayjs().format('YYYY-MM-DD'),
          mrp: batch.mrp,
          pack_qty: batch.packQty,
        };
      });

      await adjustInventoryBatches({
        user: username,
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

      setConfirmDialogOpen(false);

      // Refresh batches to get latest data
      const productIdToRefresh = selectedType?.product_id || productInfo?.product_id;
      if (productIdToRefresh) {
        fetchBatchesForProduct(productIdToRefresh);
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      // TODO: Show error toast/notification
      setConfirmDialogOpen(false);
    }
  };


  const handleRemoveRow = (batchId: string) => {
    setBatchRows((prev) => prev.filter((batch) => batch.id !== batchId));
  };

  const handleReset = () => {
    setSelectedBrand(null);
    setSelectedProduct(null);
    setSelectedType(null);
    setProductsForBrand([]);
    setTypesForProduct([]);
    setProductInfo(null);
    setBatchRows([]);
    setSelectedRows([]);
    setSearchTerm('');
    setSortConfig({ key: 'id', direction: 'asc' });
    setProductIdSearch('');
    setSelectedProductById(null);
  };

  const handleSave = () => {
    // When searching by Product ID, selectedType may be null, but productInfo has product_id
    const productId = selectedType?.product_id || productInfo?.product_id;

    if (!productInfo || !productId || batchRows.length === 0) {
      return;
    }

    const modifiedBatches = batchRows.filter((batch) => {
      const quantityChanged = batch.quantity !== batch.oldQuantity;
      const expiryDateChanged = batch.expiryDate !== batch.oldExpiryDate;
      const mrpChanged = batch.mrp !== batch.oldMrp;
      const packQtyChanged = batch.packQty !== batch.oldPackQty;
      return quantityChanged || expiryDateChanged || mrpChanged || packQtyChanged;
    });

    if (modifiedBatches.length === 0) {
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
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {batch.id}
        </Typography>
      )
    },
    {
      key: 'quantity',
      header: 'Current Qty',
      sortable: true,
      headerRender: () => (
        <Box sx={{ textAlign: 'left', width: '100%' }}>Current Qty</Box>
      ),
      render: (batch) => {
        const isEditing = editingRowId === batch.id;

        // Use quantityInput if available (during editing), otherwise use quantity
        const displayValue = isEditing && batch.quantityInput !== undefined
          ? batch.quantityInput
          : (batch.quantity === 0 ? '' : batch.quantity.toString());

        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <TextField
              value={displayValue}
              size="small"
              type="text"
              onChange={(event) => handleQuantityChange(batch.id, event.target.value)}
              onBlur={(event) => {
                // On blur, ensure we have a valid number, default to 0 if empty
                const value = event.target.value.trim();
                if (value === '') {
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, quantity: 0, quantityInput: '' }
                        : b
                    )
                  );
                } else {
                  // Clear quantityInput so it uses the parsed number
                  setBatchRows((prev) =>
                    prev.map((b) =>
                      b.id === batch.id
                        ? { ...b, quantityInput: undefined }
                        : b
                    )
                  );
                }
              }}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              disabled={!isEditing}
              placeholder="0"
              sx={{
                ...inputFieldStyles,
                width: 120,
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
            <TextField
              value={displayValue}
              size="small"
              type="text"
              onChange={(event) => handleMrpChange(batch.id, event.target.value)}
              onBlur={(event) => {
                const value = event.target.value.trim();
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
              disabled={!isEditing}
              placeholder="0.00"
              sx={{
                ...inputFieldStyles,
                width: 100,
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
      header: 'Pack Qty',
      sortable: true,
      headerRender: () => (
        <Box sx={{ textAlign: 'left', width: '100%' }}>Pack Qty</Box>
      ),
      render: (batch) => {
        const isEditing = editingRowId === batch.id;
        const displayValue = isEditing && batch.packQtyInput !== undefined
          ? batch.packQtyInput
          : (batch.packQty === 0 ? '' : batch.packQty.toString());

        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <TextField
              value={displayValue}
              size="small"
              type="text"
              onChange={(event) => handlePackQtyChange(batch.id, event.target.value)}
              onBlur={(event) => {
                const value = event.target.value.trim();
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
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              disabled={!isEditing}
              placeholder="1"
              sx={{
                ...inputFieldStyles,
                width: 80,
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
            <Box className="search-type-wrapper">
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={searchType}
                  onChange={(e) => {
                    const newSearchType = e.target.value as SearchType;
                    setSearchType(newSearchType);
                    // Reset all state when switching search types
                    setSelectedBrand(null);
                    setSelectedProduct(null);
                    setSelectedType(null);
                    setProductsForBrand([]);
                    setTypesForProduct([]);
                    setProductInfo(null);
                    setBatchRows([]);
                    setSelectedProductById(null);
                  }}
                  className="search-type-radio-group"
                >
                  <FormControlLabel
                    value="product"
                    control={<Radio />}
                    label="Search by Brand"
                  />
                  <FormControlLabel
                    value="id"
                    control={<Radio />}
                    label="Search by Product ID"
                  />
                </RadioGroup>
              </FormControl>
            </Box>
            <Box className="product-selection-fields">
              {searchType === 'product' ? (
                <>
                  <Box className="selection-field-group">
                    <Typography variant="body2" className="field-label">
                      Brand
                    </Typography>
                    <Autocomplete
                      options={brands}
                      getOptionLabel={(option) => option.brand_name}
                      value={selectedBrand}
                      onChange={(_, newValue) => {
                        setSelectedBrand(newValue);
                        if (newValue) {
                          fetchProductsForBrand(newValue.id);
                        } else {
                          setProductsForBrand([]);
                          setSelectedProduct(null);
                          setSelectedType(null);
                          setTypesForProduct([]);
                          setProductInfo(null);
                          setBatchRows([]);
                        }
                      }}
                      disabled={isLoadingBrands}
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
                      Medicine Name
                    </Typography>
                    <Autocomplete
                      options={productsForBrand}
                      getOptionLabel={(option) => option.name}
                      value={selectedProduct}
                      onChange={(_, newValue) => {
                        setSelectedProduct(newValue);
                        if (newValue && selectedBrand) {
                          fetchTypesForProduct(selectedBrand.id, selectedBrand.brand_name, newValue.name);
                        } else {
                          setTypesForProduct([]);
                          setSelectedType(null);
                          setProductInfo(null);
                          setBatchRows([]);
                        }
                      }}
                      disabled={!selectedBrand || isLoadingProducts}
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
                      Type
                    </Typography>
                    <Autocomplete
                      options={typesForProduct}
                      getOptionLabel={(option) => option.type}
                      value={selectedType}
                      onChange={(_, newValue) => {
                        setSelectedType(newValue);
                        if (newValue) {
                          fetchBatchesForProduct(newValue.product_id);
                        } else {
                          setProductInfo(null);
                          setBatchRows([]);
                        }
                      }}
                      disabled={!selectedProduct || isLoadingTypes}
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
                </>
              ) : (
                <Box className="selection-field-group">
                  <Typography variant="body2" className="field-label">
                    Product ID
                  </Typography>
                  <Autocomplete
                    options={productIdOptions}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.id.toString()}
                    value={selectedProductById}
                    onChange={(_, newValue) => {
                      setSelectedProductById(newValue);
                      if (newValue) {
                        fetchBatchesForProduct(newValue.id);
                      } else {
                        setProductInfo(null);
                        setBatchRows([]);
                      }
                    }}
                    loading={isLoadingProductIds}
                    filterOptions={(options, params) => {
                      const filtered = options.filter((option) => {
                        const searchValue = params.inputValue.toLowerCase();
                        return option.id.toString().includes(searchValue);
                      });
                      return filtered;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Select Product ID"
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
                            minHeight: "unset !important",
                            padding: "0px !important",
                            overflow: "hidden",
                            "& .MuiAutocomplete-listbox": {
                              padding: "0px !important",
                              maxHeight: "300px !important",
                              minHeight: "unset !important",
                              overflow: "auto",
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
              )}
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
                          {productInfo.brand_name || (brands.find(b => b.id.toString() === productInfo.brand_id)?.brand_name || productInfo.brand_id)}
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
    </Box>
  );
};

export default InventoryAdjustment;