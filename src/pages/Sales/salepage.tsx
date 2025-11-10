import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { StandardButton } from "../../components/Common";
import { useDispatch, useSelector } from "react-redux";
import { ReusableTable } from "../../components/PharmaTable";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import { 
  useGetProductTypeQuery, 
  useLazyGetProductTypeQuery, 
  useValidateSaleMutation
} from "../../redux/slices/salesApi";
import { useGetProductsQuery } from "../../redux/slices/receiveApi";
import { 
  addToCart,
  removeFromCart,
  updateItemQuantity,
  updateItemDetails,
  clearCart,
  setCartItems,
  saveFormData,
  clearFormData,
  bulkDeleteItems,
  selectCartItems,
  selectCartTotal,
  selectCartItemsCount,
  selectFormData,
  CartItem
} from "../../redux/slices/cartSlice";
import { RootState } from "../../redux/store";
import { SALES_PAGE_LABELS } from "../../config/label/SalesPage.labels";
import { SALES_PAGE_CONSTANTS } from "../../config/constants/SalesPage.constants";
import { useDebounce } from "../../hooks/useDebounce";

// Import Types
import { Product } from "./SalesPage.types";

// Import Utilities
import {
  processProductOptions,
  extractProductId,
  calculateCartTotal,
  canAddToCart,
  createCartItem,
  getInitialFormState,
} from "./SalesPage.utils";

// Import Table Columns
import { getTableColumns } from "./SalesPage.columns";

// Import Components
import ProductSelectionForm from "./components/ProductSelectionForm";
import ValidationErrorAlert from "./components/ValidationErrorAlert";
import BulkActionsBar from "./components/BulkActionsBar";

// Mock products data
const products: Product[] = [
  {
    id: "1",
    name: "2-0 Mersilk Syringe",
    batch: "2897655790...",
    avlQty: "28 Capsule",
    mrp: 50,
    sp: 50,
    expiry: "21 May, 2025",
    quantity: 10,
    type: "Capsule",
    discount: 0,
  },
  {
    id: "2",
    name: "3-0 Mersilk 90cm NW 5003 SUTURE",
    batch: "3289765764...",
    avlQty: "3 Capsule",
    mrp: 5,
    sp: 5,
    expiry: "2 Jun, 2025",
    quantity: 10,
    type: "Capsule",
    discount: 0,
  },
];

export default function SalePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux selectors
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const cartItemsCount = useSelector(selectCartItemsCount);
  const formData = useSelector(selectFormData);
  
  // Form State
  const [productType, setProductType] = useState("");
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [brand, setBrand] = useState(SALES_PAGE_CONSTANTS.BRANDS[0]);
  const [qty, setQty] = useState(SALES_PAGE_CONSTANTS.DEFAULT_QUANTITY);
  const [discount, setDiscount] = useState(SALES_PAGE_CONSTANTS.DEFAULT_DISCOUNT);
  const [findProduct, setFindProduct] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [productsData, setProductsData] = useState<Product[]>(products);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [validatedData, setValidatedData] = useState<any>(null);
  const [productId, setProductId] = useState<string>("");

  // UI State
  const [priceType, setPriceType] = useState<'SP' | 'MRP'>(SALES_PAGE_CONSTANTS.PRICE_TYPE_SP as 'SP');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  
  // Toast State
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: SALES_PAGE_CONSTANTS.DEFAULT_SORT_KEY,
    direction: SALES_PAGE_CONSTANTS.SORT_DIRECTION_ASC
  });

  // RTK Query hooks
  const { 
    data: apiProducts = [], 
    isLoading: isProductsLoading,
    error: productsError,
    isFetching: isProductsFetching
  } = useGetProductsQuery();
  const [getProductType, { isLoading: isProductTypeLoading }] = useLazyGetProductTypeQuery();
  const [validateSale, { isLoading: isValidating }] = useValidateSaleMutation();
  
  // Cart is managed by Redux - no need for session storage
  // Removed verbose logging for cleaner test output
  
  // Helper function to show toast messages
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Debug: Log API response
  useEffect(() => {
    if (productsError) {
      console.error('❌ Products API Error Details:', productsError);
      console.error('❌ Error status:', (productsError as any)?.status);
      console.error('❌ Error data:', (productsError as any)?.data);
      showToast('Failed to load products. Please check the console for details.', 'error');
    }
    if (apiProducts.length === 0 && !isProductsLoading && !isProductsFetching && !productsError) {
      console.warn('⚠️ No products returned from API');
      console.warn('⚠️ API URL should be: receive/get-products');
      showToast('No products found. Please check if the products endpoint is working.', 'warning');
    }
  }, [apiProducts, isProductsLoading, productsError, isProductsFetching]);
  
  // Extract product names for autocomplete
  const productOptions = useMemo(() => {
    return processProductOptions(apiProducts);
  }, [apiProducts]);

  // Monitor validation error state changes
  useEffect(() => {
  }, [validationError]);

  // Debounced validation parameters
  const debouncedQty = useDebounce(qty, 500);
  const debouncedProductType = useDebounce(productType, 500);
  const debouncedDiscount = useDebounce(discount, 500);

  // Validate sale with debouncing
  useEffect(() => {
    const validateProduct = async () => {
      if (!findProduct || !productId || debouncedQty <= 0 || !debouncedProductType) {
        setValidationError("");
        setValidatedData(null);
        return;
      }

      try {
        const requestPayload = {
          product_name: findProduct,
          product_id: productId,
          quantity: debouncedQty,
          type: debouncedProductType,
          disc: debouncedDiscount / 100,
        };
        
        console.log('🔄 Debounced validation call with params:', requestPayload);
        
        // Direct API call with debounced parameters
        const response = await validateSale(requestPayload).unwrap();

        if (response.message && !response.mrp && !response.selling_price) {
          console.error('❌ Backend returned error in success response:', response.message);
          setValidatedData(null);
          setValidationError(response.message);
        } else {
          setValidatedData(response);
          setValidationError("");
        }
      } catch (error: any) {
        console.error('❌ Validation error:', error);
        setValidatedData(null);
        
        let errorMessage = "";
        if (error.data && error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data && error.data.error) {
          errorMessage = error.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else {
          errorMessage = "Unable to validate product availability";
        }
        
        setValidationError(errorMessage);
      }
    };

    validateProduct();
  }, [findProduct, productId, debouncedQty, debouncedProductType, debouncedDiscount, validateSale]);

  // Product Selection Handlers
  const handleProductInputChange = (value: string) => {
    setFindProduct(value);
    if (value !== findProduct) {
      setIsProductSelected(false);
      setProductId("");
      setValidationError("");
      setValidatedData(null);
    }
  };

  const handleProductChange = async (value: string | null) => {
    if (value && typeof value === 'string') {
      setFindProduct(value);
      setIsProductSelected(true);
      
      setProductType("");
      setAvailableTypes([]);
      setShowTypeDropdown(false);
      setValidationError("");
      setValidatedData(null);
      
      const productID = extractProductId(apiProducts, value);
      
      
      if (productID) {
        setProductId(productID);
        
        const numericId = parseInt(productID);
        if (numericId > 0) {
          try {
            const result = await getProductType({ productID: numericId }).unwrap();
            
            if (result && result.length > 0) {
              const types = result.map(item => item.type).filter(type => type && type.trim() !== '');
              setAvailableTypes(types);
              setShowTypeDropdown(true);
              
              if (types.length === 1) {
                setProductType(types[0]);
              } else if (types.length > 1) {
              }
            } else {
              setShowTypeDropdown(false);
            }
          } catch (error) {
            console.error('Error fetching product types:', error);
            setShowTypeDropdown(false);
          }
        }
      } else {
        console.error('❌ Failed to extract product ID from selected product');
      }
    } else {
      handleClearProduct();
    }
  };

  const handleClearProduct = () => {
    const initialState = getInitialFormState(
      SALES_PAGE_CONSTANTS.DEFAULT_QUANTITY,
      SALES_PAGE_CONSTANTS.DEFAULT_DISCOUNT
    );
    setFindProduct(initialState.findProduct);
    setQty(initialState.qty);
    setDiscount(initialState.discount);
    setProductType(initialState.productType);
    setAvailableTypes(initialState.availableTypes);
    setShowTypeDropdown(initialState.showTypeDropdown);
    setIsProductSelected(initialState.isProductSelected);
    setProductId(initialState.productId);
    setValidationError(initialState.validationError);
    setValidatedData(initialState.validatedData);
  };

  // Add to Cart Handler
  const handleAddToCart = async () => {
    const validation = canAddToCart(
      findProduct,
      qty,
      availableTypes,
      productType,
      validationError,
      validatedData
    );

    if (!validation.canAdd) {
      showToast(validation.message || 'Cannot add product to cart', 'warning');
      return;
    }

    const newCartItem = createCartItem(
      findProduct,
      qty,
      productType,
      availableTypes,
      discount,
      validatedData,
      SALES_PAGE_CONSTANTS.DEFAULT_PRODUCT_STRUCTURE.expiry
    );

    // Dispatch to Redux instead of local state
    dispatch(addToCart(newCartItem));
    handleClearProduct();
    showToast('Product added to cart successfully!', 'success');
    
  };

  // Edit/Delete Handlers
  const handleEditClick = (productId: string) => {
    setEditingRowId(productId);
  };

  const handleSaveClick = () => {
    setEditingRowId(null);
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
  };

  const handleDeleteClick = (productId?: string) => {
    if (productId) {
      setItemsToDelete([productId]);
    } else {
      setItemsToDelete(selectedItems);
    }
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    const itemCount = itemsToDelete.length;
    // Dispatch to Redux instead of local state
    dispatch(bulkDeleteItems(itemsToDelete));
    setSelectedItems(prev => prev.filter(id => !itemsToDelete.includes(id)));
    setDeleteDialogOpen(false);
    setItemsToDelete([]);
    showToast(`${itemCount} item${itemCount > 1 ? 's' : ''} removed from cart`, 'success');
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemsToDelete([]);
  };

  const handleNext = () => {
    if (cartItems.length === 0) {
      showToast('Please add items to cart before proceeding', 'warning');
      return;
    }
    
    const totalAmount = cartTotal; // Use Redux selector
    
    navigate(SALES_PAGE_CONSTANTS.ROUTE_SALES_RECEIPT, { 
      state: { 
        cartItems: cartItems,
        totalAmount: totalAmount 
      } 
    });
  };

  // Sorting handler
  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: SALES_PAGE_CONSTANTS.DEFAULT_SORT_KEY, direction: SALES_PAGE_CONSTANTS.SORT_DIRECTION_ASC });
      return;
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to cart items
  const sortedProducts = useMemo(() => {
    const currentSort = sortConfig.key || SALES_PAGE_CONSTANTS.DEFAULT_SORT_KEY;
    const currentDirection = sortConfig.key ? sortConfig.direction : SALES_PAGE_CONSTANTS.SORT_DIRECTION_ASC;
    
    return [...cartItems].sort((a, b) => {
      const aValue = a[currentSort as keyof CartItem];
      const bValue = b[currentSort as keyof CartItem];

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
  }, [cartItems, sortConfig]);

  // Get table columns
  const columns = getTableColumns({
    editingRowId,
    selectedItems,
    dispatch,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
  });

  const totalAmount = cartTotal; // Use Redux selector instead of calculation

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        {SALES_PAGE_LABELS.PAGE_TITLE}
      </Typography>

      {/* Product Selection Form */}
      <Box sx={{ position: 'relative' }}>
        <ProductSelectionForm
          findProduct={findProduct}
          isProductSelected={isProductSelected}
          isProductsLoading={isProductsLoading}
          productOptions={productOptions}
          onProductInputChange={handleProductInputChange}
          onProductChange={handleProductChange}
          onClearProduct={handleClearProduct}
          qty={qty}
          onQtyChange={setQty}
          showTypeDropdown={showTypeDropdown}
          availableTypes={availableTypes}
          productType={productType}
          onTypeChange={setProductType}
          discount={discount}
          onDiscountChange={setDiscount}
          onAddToCart={handleAddToCart}
          isValidating={isValidating}
          validationError={validationError}
          validatedData={validatedData}
        />
        
        {/* Validation Error Alert */}
        <ValidationErrorAlert error={validationError} />
      </Box>

      {/* Bulk Actions Bar */}
      <BulkActionsBar 
        selectedCount={selectedItems.length} 
        onDelete={() => handleDeleteClick()}
      />

      {/* Table */}
      <ReusableTable
        data={sortedProducts as unknown as Product[]}
        columns={columns}
        selectedRows={selectedItems.map(id => sortedProducts.findIndex(p => p.id === id))}
        setSelectedRows={(newSelected: number[] | ((prevState: number[]) => number[])) => {
          const indices = typeof newSelected === 'function' 
            ? newSelected(selectedItems.map(id => sortedProducts.findIndex(p => p.id === id))) 
            : newSelected;
          const newSelectedIds = indices.map((index: number) => sortedProducts[index].id);
          setSelectedItems(newSelectedIds);
        }}
        totalRows={sortedProducts.length}
        rowsPerPage={SALES_PAGE_CONSTANTS.DEFAULT_ROWS_PER_PAGE}
        currentPage={SALES_PAGE_CONSTANTS.DEFAULT_CURRENT_PAGE}
        onPageChange={() => {}}
        onSortRequest={handleSortRequest}
        sortConfig={sortConfig}
        searchAndFilterConfig={{ filterOptions: [] }}
        currentSearchTerm=""
        onSearchChange={() => {}}
        showFilters={false}
        onShowFiltersToggle={() => {}}
        currentFilterKey=""
        onFilterSelect={() => {}}
      />
      
      {/* Total and Next Button */}
      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Typography 
          sx={{ 
            fontWeight: 700, 
            fontStyle: 'italic',
            color: 'black',
            mb: 2
          }}
        >
          {SALES_PAGE_LABELS.TOTAL_CART_VALUE.replace('{amount}', totalAmount.toFixed(0))}
        </Typography>
        <StandardButton
          onClick={handleNext}
          variant="primary"
          size="large"
        >
          {SALES_PAGE_LABELS.NEXT_BUTTON}
        </StandardButton>
      </Box>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title={SALES_PAGE_LABELS.DELETE_ITEMS_TITLE}
        message={SALES_PAGE_LABELS.DELETE_CONFIRMATION_MESSAGE.replace('{count}', itemsToDelete.length.toString())}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast Notifications */}
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
}
