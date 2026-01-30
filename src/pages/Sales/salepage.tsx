import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { StandardButton } from "../../components/Common";
import { useDispatch, useSelector } from "react-redux";
import { ReusableTable } from "../../components/PharmaTable";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import {
  useGetProductTypeQuery,
  useLazyGetProductTypeQuery,
  useValidateSaleMutation,
  useGetBatchNumbersByProductIdMutation
} from "../../redux/slices/salesApi";
import {
  useGetBrandsFromProductIdMutation,
  useGetTypesForBrandAndProductMutation,
  useGetBatchesForProductMutation
} from "../../redux/slices/inventoryApi";
import { useGetDoctorNamesQuery } from "../../redux/slices/salesApi";
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

// Helper function to format stock error messages in a user-friendly way
const formatStockErrorMessage = (errorMessage: string): string => {
  if (!errorMessage) return errorMessage;

  // Check for "maximum available quantity" pattern (from backend validation)
  // Pattern: "the maximum available quantity for this product in batch AMX-2026-02-A is 10"
  const maxQtyPattern = /the maximum available quantity for this product (?:in batch )?([^\s]+) is (\d+)/i;
  const maxQtyMatch = errorMessage.match(maxQtyPattern);

  if (maxQtyMatch) {
    const batchName = maxQtyMatch[1] || 'selected batch';
    const maxQty = maxQtyMatch[2] || '0';
    return `⚠️ Insufficient stock: The maximum available quantity for batch "${batchName}" is ${maxQty}. Please reduce the quantity or select a different batch.`;
  }

  // Check for "No stock found" patterns
  const noStockPattern = /no stock found/i;
  const productIdPattern = /product_id\s*(\d+)/i;
  const batchPattern = /batch_number\s*([^\s,]+)/i;

  if (noStockPattern.test(errorMessage)) {
    const productIdMatch = errorMessage.match(productIdPattern);
    const batchMatch = errorMessage.match(batchPattern);

    if (productIdMatch && batchMatch) {
      return `⚠️ Insufficient stock: The selected batch "${batchMatch[1]}" for this product is not available. Please select a different batch or reduce the quantity.`;
    } else if (productIdMatch) {
      return `⚠️ Insufficient stock: This product is not available in the selected quantity. Please reduce the quantity or select a different batch.`;
    } else {
      return `⚠️ Insufficient stock: The selected product/batch is not available. Please select a different batch or reduce the quantity.`;
    }
  }

  // Check for "Insufficient stock in batch" pattern
  // Pattern: "Insufficient stock in batch CTZ-2026-06-B (have 1, need 2)"
  const insufficientBatchPattern1 = /insufficient stock in batch\s+([^\s(]+)\s*\(have\s+(\d+),\s*need\s+(\d+)\)/i;
  const insufficientMatch1 = errorMessage.match(insufficientBatchPattern1);

  if (insufficientMatch1) {
    const batchName = insufficientMatch1[1].trim();
    const available = insufficientMatch1[2];
    const requested = insufficientMatch1[3];
    return `⚠️ Insufficient stock: Batch "${batchName}" has only ${available} unit${available !== '1' ? 's' : ''} available, but ${requested} unit${requested !== '1' ? 's' : ''} ${requested === '1' ? 'is' : 'are'} requested. Please reduce the quantity or select a different batch.`;
  }

  // Check for alternative pattern: "insufficient stock in batch X for product_id Y. have Z, need W"
  const insufficientBatchPattern2 = /insufficient stock in batch\s+([^\s]+)\s+for product_id\s+(\d+).*?have\s+(\d+).*?need\s+(\d+)/i;
  const insufficientMatch2 = errorMessage.match(insufficientBatchPattern2);

  if (insufficientMatch2) {
    const batchName = insufficientMatch2[1];
    const available = insufficientMatch2[3];
    const requested = insufficientMatch2[4];
    return `⚠️ Insufficient stock: Batch "${batchName}" has only ${available} unit${available !== '1' ? 's' : ''} available, but ${requested} unit${requested !== '1' ? 's' : ''} ${requested === '1' ? 'is' : 'are'} requested. Please reduce the quantity or select a different batch.`;
  }

  // Check for other stock-related errors
  if (/insufficient|not available|out of stock|stock.*not found|maximum available/i.test(errorMessage)) {
    return `⚠️ ${errorMessage}`;
  }

  return errorMessage;
};

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
  const [availableTypes, setAvailableTypes] = useState<Array<{ type: string; product_id: number }>>([]);
  const [brand, setBrand] = useState("");
  const [brandId, setBrandId] = useState<number | null>(null);
  const [availableBrands, setAvailableBrands] = useState<Array<{ id: number; brand_name: string }>>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [qty, setQty] = useState(SALES_PAGE_CONSTANTS.DEFAULT_QUANTITY);
  const [discount, setDiscount] = useState(SALES_PAGE_CONSTANTS.DEFAULT_DISCOUNT);
  const [discountAuthorizedBy, setDiscountAuthorizedBy] = useState<string>("");
  const [discountAuthorizedById, setDiscountAuthorizedById] = useState<number | undefined>(undefined);

  // Get doctor names with IDs from get-doctor-names endpoint
  const { data: doctorNames = [] } = useGetDoctorNamesQuery();
  const [findProduct, setFindProduct] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [productsData, setProductsData] = useState<Product[]>(products);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [batch, setBatch] = useState("");
  const [selectedTypeProductId, setSelectedTypeProductId] = useState<number | null>(null);
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
  const [getBrandsFromProductId, { isLoading: isBrandsLoading }] = useGetBrandsFromProductIdMutation();
  const [getTypesForBrandAndProduct, { isLoading: isTypesLoading }] = useGetTypesForBrandAndProductMutation();
  const [getBatchNumbersByProductId, { isLoading: isBatchesLoading }] = useGetBatchNumbersByProductIdMutation();

  // Effect to find doctor ID when doctor name changes
  useEffect(() => {
    if (discountAuthorizedBy && !discountAuthorizedById && doctorNames.length > 0) {
      // Try exact match first
      let foundDoctor = doctorNames.find(d =>
        d.name.toLowerCase().trim() === discountAuthorizedBy.toLowerCase().trim()
      );

      // If exact match not found, try partial match
      if (!foundDoctor) {
        foundDoctor = doctorNames.find(d =>
          d.name.toLowerCase().trim().includes(discountAuthorizedBy.toLowerCase().trim()) ||
          discountAuthorizedBy.toLowerCase().trim().includes(d.name.toLowerCase().trim())
        );
      }

      if (foundDoctor) {
        setDiscountAuthorizedById(parseInt(foundDoctor.id));
      }
    }
  }, [discountAuthorizedBy, discountAuthorizedById, doctorNames]);

  // Cart is managed by Redux - no need for session storage
  // Removed verbose logging for cleaner test output

  // Helper function to show toast messages
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    if (productsError) {
      showToast('Failed to load products. Please check the console for details.', 'error');
    }
    if (apiProducts.length === 0 && !isProductsLoading && !isProductsFetching && !productsError) {
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

  // Debounced validation parameters - increased delay to 800ms for better debouncing
  const debouncedQty = useDebounce(qty, 800);
  const debouncedProductType = useDebounce(productType, 800);
  const debouncedDiscount = useDebounce(discount, 800);

  // Use ref to track previous debounced values and prevent unnecessary API calls
  const prevDebouncedValuesRef = useRef({
    qty: debouncedQty,
    productType: debouncedProductType,
    discount: debouncedDiscount,
    productId: selectedTypeProductId || productId,
    batch: batch
  });

  // Validate sale with debouncing
  useEffect(() => {
    const validateProduct = async () => {
      // Use selectedTypeProductId if available, otherwise fall back to productId
      const productIdToUse = selectedTypeProductId ? String(selectedTypeProductId) : productId;

      // Check if any debounced value actually changed
      const currentValues = {
        qty: debouncedQty,
        productType: debouncedProductType,
        discount: debouncedDiscount,
        productId: productIdToUse,
        batch: batch
      };

      const hasChanged =
        prevDebouncedValuesRef.current.qty !== currentValues.qty ||
        prevDebouncedValuesRef.current.productType !== currentValues.productType ||
        prevDebouncedValuesRef.current.discount !== currentValues.discount ||
        prevDebouncedValuesRef.current.productId !== currentValues.productId ||
        prevDebouncedValuesRef.current.batch !== currentValues.batch;

      // If nothing changed, skip validation
      if (!hasChanged) {
        return;
      }

      // Update ref with current values
      prevDebouncedValuesRef.current = currentValues;

      if (!findProduct || !productIdToUse || debouncedQty <= 0 || !debouncedProductType || !batch) {
        setValidationError("");
        setValidatedData(null);
        return;
      }

      try {
        const requestPayload = {
          product_name: findProduct,
          product_id: productIdToUse,
          quantity: debouncedQty,
          type: debouncedProductType,
          disc: debouncedDiscount / 100,
          batch_number: batch || undefined, // Include batch number for stock validation
        };

        const response = await validateSale(requestPayload).unwrap();

        if (response.message && !response.mrp && !response.selling_price) {
          setValidatedData(null);
          // Make error message more user-friendly
          const userFriendlyMessage = formatStockErrorMessage(response.message);
          setValidationError(userFriendlyMessage);
        } else {
          setValidatedData(response);
          setValidationError("");
        }
      } catch (error: any) {
        setValidatedData(null);

        console.log('🔍 Validation error caught:', error);
        console.log('🔍 Error data:', error?.data);
        console.log('🔍 Error status:', error?.status);

        let errorMessage = "";
        // Check for error in different formats
        if (error?.data) {
          if (typeof error.data === 'string') {
            errorMessage = error.data;
          } else if (error.data.error) {
            errorMessage = error.data.error;
          } else if (error.data.message) {
            errorMessage = error.data.message;
          } else if (error.data.detail) {
            errorMessage = error.data.detail;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = "Unable to validate product availability";
        }

        console.log('🔍 Extracted error message:', errorMessage);

        // Make error message more user-friendly
        const userFriendlyMessage = formatStockErrorMessage(errorMessage);
        console.log('🔍 Formatted error message:', userFriendlyMessage);
        setValidationError(userFriendlyMessage);

        // Also show toast for immediate feedback
        if (userFriendlyMessage) {
          showToast(userFriendlyMessage, 'error');
        }
      }
    };

    validateProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findProduct, productId, selectedTypeProductId, debouncedQty, debouncedProductType, debouncedDiscount, batch]);
  // Removed validateSale from dependencies - it's a stable RTK Query mutation function

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

      // Reset all dependent fields
      setProductType("");
      setAvailableTypes([]);
      setShowTypeDropdown(false);
      setBrand("");
      setBrandId(null);
      setAvailableBrands([]);
      setShowBrandDropdown(false);
      setBatch("");
      setAvailableBatches([]);
      setShowBatchDropdown(false);
      setSelectedTypeProductId(null);
      setValidationError("");
      setValidatedData(null);

      const productID = extractProductId(apiProducts, value);

      if (productID) {
        setProductId(productID);

        const numericId = parseInt(productID);
        if (numericId > 0) {
          try {
            // Fetch brands for the selected product
            // Note: API returns a single brand object, not an array
            const brandsResult = await getBrandsFromProductId({ product_id: numericId }).unwrap();

            if (brandsResult && brandsResult.id && brandsResult.brand_name) {
              // Convert single brand object to array format for consistency
              setAvailableBrands([{ id: brandsResult.id, brand_name: brandsResult.brand_name }]);
              setShowBrandDropdown(true);

              // Auto-select the brand (since API returns single brand)
              setBrandId(brandsResult.id);
              setBrand(brandsResult.brand_name);

              // Automatically fetch types for the brand
              await handleBrandChange(brandsResult.id, brandsResult.brand_name, value);
            } else {
              setShowBrandDropdown(false);
            }
          } catch (error) {
            console.error('Error fetching brands:', error);
            setShowBrandDropdown(false);
          }
        }
      }
    } else {
      handleClearProduct();
    }
  };

  const handleBrandChange = async (newBrandId: number, newBrandName: string, productName?: string) => {
    setBrandId(newBrandId);
    setBrand(newBrandName);

    // Reset dependent fields
    setProductType("");
    setAvailableTypes([]);
    setShowTypeDropdown(false);
    setBatch("");
    setAvailableBatches([]);
    setShowBatchDropdown(false);
    setSelectedTypeProductId(null);
    setValidationError("");
    setValidatedData(null);

    const productNameToUse = productName || findProduct;

    if (productNameToUse) {
      try {
        // Fetch types for the selected brand and product
        const typesResult = await getTypesForBrandAndProduct({
          brand_id: newBrandId,
          product_name: productNameToUse
        }).unwrap();

        if (typesResult && Array.isArray(typesResult) && typesResult.length > 0) {
          setAvailableTypes(typesResult);
          setShowTypeDropdown(true);

          // Auto-select if only one type
          if (typesResult.length === 1) {
            await handleTypeChange(typesResult[0].type, typesResult[0].product_id);
          }
        } else {
          setShowTypeDropdown(false);
        }
      } catch (error) {
        console.error('Error fetching types:', error);
        setShowTypeDropdown(false);
      }
    }
  };

  const handleTypeChange = async (newType: string, typeProductId: number) => {
    setProductType(newType);
    setSelectedTypeProductId(typeProductId);

    // Reset batch field
    setBatch("");
    setAvailableBatches([]);
    setShowBatchDropdown(false);
    setValidationError("");
    setValidatedData(null);

    try {
      console.log('🔍 Fetching batches for product_id:', typeProductId);
      console.log('🔍 Product name:', findProduct);
      console.log('🔍 Product type:', newType);

      // Use sales API endpoint: sales/get-batch-numbers-by-product-id
      let batchNumbers: string[] = [];

      try {
        const batchesResult: any = await getBatchNumbersByProductId({ product_id: typeProductId }).unwrap();
        console.log('📦 Sales API batch numbers response (raw):', batchesResult);
        console.log('📦 Response type:', typeof batchesResult, 'Is array:', Array.isArray(batchesResult));

        // Process the response
        if (Array.isArray(batchesResult)) {
          // Direct array format: ["batch1", "batch2", ...]
          batchNumbers = batchesResult.filter((b: any) => b != null && b !== '');
          console.log('✅ Processed as array, got', batchNumbers.length, 'batches');
        } else if (batchesResult && typeof batchesResult === 'object') {
          // Object format: { batches: [...], batch_numbers: [...], etc. }
          if (Array.isArray(batchesResult.batches)) {
            batchNumbers = batchesResult.batches
              .map((b: any) => typeof b === 'string' ? b : (b.batch_number || b.batchNumber || String(b)))
              .filter((b: any) => b != null && b !== '');
            console.log('✅ Processed from batches array, got', batchNumbers.length, 'batches');
          } else if (Array.isArray(batchesResult.batch_numbers)) {
            batchNumbers = batchesResult.batch_numbers.filter((b: any) => b != null && b !== '');
            console.log('✅ Processed from batch_numbers array, got', batchNumbers.length, 'batches');
          } else if (Array.isArray(batchesResult.data)) {
            batchNumbers = batchesResult.data
              .map((b: any) => typeof b === 'string' ? b : (b.batch_number || b.batchNumber || String(b)))
              .filter((b: any) => b != null && b !== '');
            console.log('✅ Processed from data array, got', batchNumbers.length, 'batches');
          } else {
            console.warn('⚠️ Unexpected response format:', batchesResult);
          }
        }

        console.log('📦 Final processed batch numbers:', batchNumbers);

        if (batchNumbers.length > 0) {
          setAvailableBatches(batchNumbers);
          setShowBatchDropdown(true);
          console.log('✅ Batch dropdown shown with', batchNumbers.length, 'batches');

          // Auto-select if only one batch
          if (batchNumbers.length === 1) {
            setBatch(batchNumbers[0]);
            console.log('✅ Auto-selected batch:', batchNumbers[0]);
          }
        } else {
          console.warn('⚠️ No batches found in response for product_id:', typeProductId);
          console.warn('⚠️ Product name:', findProduct, 'Type:', newType);
          setShowBatchDropdown(false);
          showToast(`No batch numbers found for product "${findProduct}" (Type: ${newType}, Product ID: ${typeProductId}). Please ensure inventory batches exist in the InventoryBatch table for this product_id.`, 'warning');
        }
      } catch (salesError: any) {
        console.error('❌ Sales API error:', salesError);
        console.error('Error status:', salesError?.status);
        console.error('Error data:', salesError?.data);
        console.error('Error message:', salesError?.message);

        // Show detailed error message
        const errorMessage = salesError?.data?.error || salesError?.data?.message || salesError?.message || 'Failed to fetch batch numbers';
        setShowBatchDropdown(false);
        showToast(`Error loading batches for product ID ${typeProductId}: ${errorMessage}`, 'error');
      }
    } catch (error: any) {
      console.error('❌ Unexpected error fetching batches:', error);
      setShowBatchDropdown(false);
      const errorMessage = error?.data?.error || error?.data?.message || error?.message || 'Failed to fetch batch numbers';
      showToast(`Error loading batches: ${errorMessage}`, 'error');
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
    setDiscountAuthorizedBy("");
    setDiscountAuthorizedById(undefined);
    setProductType(initialState.productType);
    setAvailableTypes([]);
    setShowTypeDropdown(false);
    setBrand("");
    setBrandId(null);
    setAvailableBrands([]);
    setShowBrandDropdown(false);
    setBatch("");
    setAvailableBatches([]);
    setShowBatchDropdown(false);
    setSelectedTypeProductId(null);
    setIsProductSelected(initialState.isProductSelected);
    setProductId(initialState.productId);
    setValidationError(initialState.validationError);
    setValidatedData(initialState.validatedData);
  };

  // Add to Cart Handler
  const handleAddToCart = async () => {
    // Try to find doctor ID if name exists but ID is missing
    let finalDoctorId = discountAuthorizedById;
    if (!finalDoctorId && discountAuthorizedBy && doctorNames.length > 0) {
      // Try exact match first
      let foundDoctor = doctorNames.find(d =>
        d.name.toLowerCase().trim() === discountAuthorizedBy.toLowerCase().trim()
      );

      // If exact match not found, try partial match
      if (!foundDoctor) {
        foundDoctor = doctorNames.find(d =>
          d.name.toLowerCase().trim().includes(discountAuthorizedBy.toLowerCase().trim()) ||
          discountAuthorizedBy.toLowerCase().trim().includes(d.name.toLowerCase().trim())
        );
      }

      if (foundDoctor) {
        finalDoctorId = parseInt(foundDoctor.id);
        setDiscountAuthorizedById(parseInt(foundDoctor.id));
      }
    }

    const validation = canAddToCart(
      findProduct,
      qty,
      availableTypes,
      productType,
      validationError,
      validatedData,
      batch,
      discount,
      discountAuthorizedBy // Check for doctor name instead of ID
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
      SALES_PAGE_CONSTANTS.DEFAULT_PRODUCT_STRUCTURE.expiry,
      selectedTypeProductId || productId,
      discountAuthorizedBy,
      batch,
      finalDoctorId || discountAuthorizedById // Include ID if found, otherwise undefined
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
    apiProducts,
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
          showBrandDropdown={showBrandDropdown}
          availableBrands={availableBrands}
          brand={brand}
          brandId={brandId}
          onBrandChange={(brandId, brandName) => handleBrandChange(brandId, brandName)}
          isBrandsLoading={isBrandsLoading}
          showTypeDropdown={showTypeDropdown}
          availableTypes={availableTypes}
          productType={productType}
          selectedTypeProductId={selectedTypeProductId}
          onTypeChange={(type, productId) => handleTypeChange(type, productId)}
          isTypesLoading={isTypesLoading}
          showBatchDropdown={showBatchDropdown}
          availableBatches={availableBatches}
          batch={batch}
          onBatchChange={setBatch}
          isBatchesLoading={isBatchesLoading}
          qty={qty}
          onQtyChange={setQty}
          discount={discount}
          onDiscountChange={setDiscount}
          discountAuthorizedBy={discountAuthorizedBy}
          discountAuthorizedById={discountAuthorizedById}
          onDiscountAuthorizedByChange={(name, doctorId) => {
            setDiscountAuthorizedBy(name || '');
            setDiscountAuthorizedById(doctorId);
            // If ID not found but name exists, try to find it from doctorNames list
            if (!doctorId && name && doctorNames.length > 0) {
              const foundDoctor = doctorNames.find(d =>
                d.name.toLowerCase().trim() === name.toLowerCase().trim()
              );
              if (foundDoctor) {
                setDiscountAuthorizedById(parseInt(foundDoctor.id));
              }
            }
          }}
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
        onPageChange={() => { }}
        onSortRequest={handleSortRequest}
        sortConfig={sortConfig}
        searchAndFilterConfig={{ filterOptions: [] }}
        currentSearchTerm=""
        onSearchChange={() => { }}
        showFilters={false}
        onShowFiltersToggle={() => { }}
        currentFilterKey=""
        onFilterSelect={() => { }}
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
        message={(() => {
          if (itemsToDelete.length === 0) {
            return SALES_PAGE_LABELS.DELETE_CONFIRMATION_MESSAGE.replace('{count}', '0');
          }
          const itemsToShow = cartItems.filter(item => itemsToDelete.includes(item.id));
          if (itemsToShow.length === 1) {
            const productName = itemsToShow[0]?.name || 'this product';
            return `Are you sure you want to delete ${productName}? This action cannot be undone.`;
          } else if (itemsToShow.length > 1) {
            const productNames = itemsToShow.map(item => item.name || 'Product').filter(Boolean);
            return `Are you sure you want to delete ${itemsToShow.length} items (${productNames.join(', ')})? This action cannot be undone.`;
          }
          return SALES_PAGE_LABELS.DELETE_CONFIRMATION_MESSAGE.replace('{count}', itemsToDelete.length.toString());
        })()}
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
