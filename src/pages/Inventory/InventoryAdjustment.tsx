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
  ProductInfo,
  Brand,
  ProductForBrand,
  TypeForBrandAndProduct,
} from '../../redux/slices/inventoryApi';

type BatchRow = {
  id: string;
  quantity: number;
  oldQuantity: number; // Original quantity when batch was loaded
  expiryDate: string;
};

type SelectedBrand = Brand | null;
type SelectedProduct = ProductForBrand | null;
type SelectedType = TypeForBrandAndProduct | null;

type SearchType = 'product' | 'id' | 'code';


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
      padding: '10px 14px',
      fontSize: '0.875rem',
      color: '#1f2937',
      borderRadius: '10px !important',
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
  
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'asc'
  });
  const [searchType, setSearchType] = useState<SearchType>('product');
  const [productIdSearch, setProductIdSearch] = useState<string>('');
  const [productCodeSearch, setProductCodeSearch] = useState<string>('');
  const [productIdOptions, setProductIdOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [productCodeOptions, setProductCodeOptions] = useState<Array<{ code: string; name: string; id: number }>>([]);
  const [isLoadingProductOptions, setIsLoadingProductOptions] = useState(false);
  const [selectedProductById, setSelectedProductById] = useState<{ id: number; name: string } | null>(null);
  const [selectedProductByCode, setSelectedProductByCode] = useState<{ code: string; name: string; id: number } | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<{ quantity: number; expiryDate: string } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingBatchId, setPendingBatchId] = useState<string | null>(null);

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
        brand_name: brandName,
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

  // Fetch batches when type is selected
  const fetchBatchesForProduct = useCallback(async (productId: number) => {
    try {
      const result = await getBatchesForProduct({ product_id: productId }).unwrap();
      
      // Transform API batches to BatchRow format
      const transformedBatches: BatchRow[] = result.batches.map((batch) => ({
        id: batch.batch_id.toString(),
        quantity: batch.current_qty,
        oldQuantity: batch.current_qty, // Store original quantity
        expiryDate: batch.expiry_date ? dayjs(batch.expiry_date).format('YYYY-MM-DD') : ''
      }));
      
      // Batch state updates together to prevent blinking
      startTransition(() => {
        setProductInfo(result.product);
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

  // Fetch all product IDs and codes for dropdown options
  const fetchProductOptions = useCallback(async () => {
    setIsLoadingProductOptions(true);
    try {
      const productIds: Array<{ id: number; name: string }> = [];
      const productCodes: Array<{ code: string; name: string; id: number }> = [];

      for (const brand of brands) {
        try {
          const products = await getProductsForBrand({ brand_id: brand.id }).unwrap();
          for (const product of products) {
            try {
              const types = await getTypesForBrandAndProduct({
                brand_id: brand.id,
                brand_name: brand.brand_name,
                product_name: product.name,
              }).unwrap();
              
              for (const type of types) {
                try {
                  const batchResult = await getBatchesForProduct({ product_id: type.product_id }).unwrap();
                  const productInfo = batchResult.product;
                  
                  // Add to product ID options
                  if (!productIds.find(p => p.id === productInfo.product_id)) {
                    productIds.push({
                      id: productInfo.product_id,
                      name: `${productInfo.product_name} (${productInfo.type})`
                    });
                  }
                  
                  // Add to product code options
                  if (productInfo.product_code && !productCodes.find(p => p.code === productInfo.product_code)) {
                    productCodes.push({
                      code: productInfo.product_code,
                      name: `${productInfo.product_name} (${productInfo.type})`,
                      id: productInfo.product_id
                    });
                  }
                } catch (e) {
                  // Continue
                }
              }
            } catch (e) {
              // Continue
            }
          }
        } catch (e) {
          // Continue to next brand
        }
      }

      setProductIdOptions(productIds);
      setProductCodeOptions(productCodes);
    } catch (error) {
      console.error('Error fetching product options:', error);
    } finally {
      setIsLoadingProductOptions(false);
    }
  }, [brands, getProductsForBrand, getTypesForBrandAndProduct, getBatchesForProduct]);

  useEffect(() => {
    if ((searchType === 'id' || searchType === 'code') && brands.length > 0) {
      fetchProductOptions();
    }
  }, [searchType, brands.length, fetchProductOptions]);

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
    const parsed = Number(value.replace(/[^0-9]/g, ''));
    setBatchRows((prev) =>
      prev.map((batch) => (batch.id === batchId ? { ...batch, quantity: Number.isNaN(parsed) ? 0 : parsed } : batch))
    );
  };

  const handleEditRow = (batchId: string) => {
    const batch = batchRows.find(b => b.id === batchId);
    if (batch) {
      setEditingRowId(batchId);
      // Store original values to restore if user cancels
      setOriginalValues({
        quantity: batch.quantity,
        expiryDate: batch.expiryDate
      });
    }
  };

  const handleCancelEdit = (batchId?: string) => {
    const rowToCancel = batchId || editingRowId;
    if (rowToCancel && originalValues) {
      // Restore original values
      setBatchRows((prev) =>
        prev.map((b) =>
          b.id === rowToCancel
            ? {
                ...b,
                quantity: originalValues.quantity,
                expiryDate: originalValues.expiryDate,
              }
            : b
        )
      );
    }
    setEditingRowId(null);
    setOriginalValues(null);
  };

  const handleConfirmEdit = (batchId: string) => {
    setPendingBatchId(batchId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAdjustment = async () => {
    if (!pendingBatchId || !productInfo || !selectedType) {
      setConfirmDialogOpen(false);
      setPendingBatchId(null);
      return;
    }

    const batch = batchRows.find(b => b.id === pendingBatchId);
    if (!batch) {
      setConfirmDialogOpen(false);
      setPendingBatchId(null);
      return;
    }

    try {
      const username = user?.username || 'admin';
      
      const lines = [{
        batch_id: parseInt(pendingBatchId),
        old_qty: batch.oldQuantity,
        new_qty: batch.quantity,
        expiry_date: batch.expiryDate ? new Date(batch.expiryDate).toISOString() : new Date().toISOString(),
      }];

      await adjustInventoryBatches({
        user: username,
        product_id: selectedType.product_id,
        lines,
      }).unwrap();

      // Update oldQuantity to reflect the new quantity after successful save
      setBatchRows((prev) =>
        prev.map((b) =>
          b.id === pendingBatchId
            ? {
                ...b,
                oldQuantity: b.quantity, // Update old quantity to current quantity
              }
            : b
        )
      );

      // Exit edit mode
      setEditingRowId(null);
      setOriginalValues(null);
      setConfirmDialogOpen(false);
      setPendingBatchId(null);
      
      // Optionally refresh batches to get latest data
      if (selectedType) {
        fetchBatchesForProduct(selectedType.product_id);
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      // TODO: Show error toast/notification
      // On error, restore original values
      if (originalValues) {
    setBatchRows((prev) =>
          prev.map((b) =>
            b.id === pendingBatchId
              ? {
                  ...b,
                  quantity: originalValues.quantity,
                  expiryDate: originalValues.expiryDate,
                }
              : b
          )
        );
      }
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
    setProductCodeSearch('');
    setSelectedProductById(null);
    setSelectedProductByCode(null);
  };

  const handleSave = async () => {
    if (!productInfo || !selectedType || batchRows.length === 0) {
      return;
    }
    
    try {
      // Get user from auth state
      const username = user?.username || 'admin';
      
      // Transform batch rows to API format
      const lines = batchRows.map((batch) => ({
        batch_id: parseInt(batch.id),
        old_qty: batch.oldQuantity,
        new_qty: batch.quantity,
        expiry_date: batch.expiryDate ? new Date(batch.expiryDate).toISOString() : new Date().toISOString(),
      }));

      const result = await adjustInventoryBatches({
        user: username,
        product_id: selectedType.product_id,
        lines,
      }).unwrap();

      console.log('Inventory adjusted successfully:', result);
      // TODO: Show success toast/notification
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      // TODO: Show error toast/notification
    }
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
      header: 'Batch ID',
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
      render: (batch) => {
        const isEditing = editingRowId === batch.id;
        
        return (
        <TextField
          value={batch.quantity}
          size="small"
          type="number"
          onChange={(event) => handleQuantityChange(batch.id, event.target.value)}
          InputProps={{ inputProps: { min: 0 } }}
            disabled={!isEditing}
            sx={{ 
              ...inputFieldStyles, 
              width: 120,
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: '#1f2937',
                backgroundColor: 'transparent'
              }
            }}
          />
        );
      }
    },
    {
      key: 'expiryDate',
      header: 'Expiry date',
      sortable: true,
      render: (batch) => {
        const isEditing = editingRowId === batch.id;
        
        return (
        <PharmaDatePicker
          value={batch.expiryDate ? dayjs(batch.expiryDate) : null}
            onChange={(newValue) => {
            setBatchRows((prev) =>
              prev.map((row) =>
                row.id === batch.id ? { ...row, expiryDate: newValue ? newValue.format('YYYY-MM-DD') : '' } : row
              )
              );
            }}
            disabled={!isEditing}
          width={220}
          height={36}
        />
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
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
                    padding: '4px',
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
                      color: '#EF4444',
                      backgroundColor: '#FEF2F2'
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
                  onChange={(e) => setSearchType(e.target.value as SearchType)}
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
                  <FormControlLabel
                    value="code"
                    control={<Radio />}
                    label="Search by Product Code"
                  />
                </RadioGroup>
              </FormControl>
            </Box>
            <Box className="product-selection-fields">
              <Box className="selection-field-group">
                <Typography variant="body2" className="field-label">
                  {searchType === 'product' ? 'Brand' : searchType === 'id' ? 'Product ID' : 'Product Code'}
                </Typography>
                {searchType === 'product' ? (
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
                    sx={{ width: '100%' }}
                  />
                ) : searchType === 'id' ? (
                  <Autocomplete
                    options={productIdOptions}
                    getOptionLabel={(option) => typeof option === 'string' ? option : `${option.id} - ${option.name}`}
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
                    loading={isLoadingProductOptions}
                    filterOptions={(options, params) => {
                      const filtered = options.filter((option) => {
                        const searchValue = params.inputValue.toLowerCase();
                        return (
                          option.id.toString().includes(searchValue) ||
                          option.name.toLowerCase().includes(searchValue)
                        );
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
                    sx={{ width: '100%' }}
                  />
                ) : (
                  <Autocomplete
                    options={productCodeOptions}
                    getOptionLabel={(option) => typeof option === 'string' ? option : `${option.code} - ${option.name}`}
                    value={selectedProductByCode}
                    onChange={(_, newValue) => {
                      setSelectedProductByCode(newValue);
                      if (newValue) {
                        fetchBatchesForProduct(newValue.id);
                      } else {
                        setProductInfo(null);
                        setBatchRows([]);
                      }
                    }}
                    loading={isLoadingProductOptions}
                    filterOptions={(options, params) => {
                      const filtered = options.filter((option) => {
                        const searchValue = params.inputValue.toLowerCase();
                        return (
                          option.code.toLowerCase().includes(searchValue) ||
                          option.name.toLowerCase().includes(searchValue)
                        );
                      });
                      return filtered;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Select Product Code"
                      sx={inputFieldStyles}
                    />
                    )}
                    sx={{ width: '100%' }}
                  />
                )}
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
                          Product ID
                      </Typography>
                        <Typography variant="body2" className="detail-value">
                          {productInfo.product_id}
                      </Typography>

                        <Typography variant="body2" className="detail-label">
                          Product Code
                      </Typography>
                        <Typography variant="body2" className="detail-value">
                          {productInfo.product_code}
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
                          {totalQuantity}
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
        message={`Are you sure you want to adjust the inventory for Batch ID ${pendingBatchId}? This action cannot be undone.`}
        onClose={() => {
          setConfirmDialogOpen(false);
          setPendingBatchId(null);
        }}
        onConfirm={handleConfirmAdjustment}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    </Box>
  );
};

export default InventoryAdjustment;