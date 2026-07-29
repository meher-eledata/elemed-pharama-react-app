import { Product, ApiProduct } from './SalesPage.types';

/**
 * Process product options from API response
 * Handles both array format [name, id] and object format {name, id}
 */
export const processProductOptions = (apiProducts: any[]): { name: string, currentQuantity: number }[] => {
  if (!apiProducts || apiProducts.length === 0) {
    return [];
  }

  const firstProduct = apiProducts[0];
  let options: { name: string, currentQuantity: number }[] = [];

  // Handle array format [name, id]
  if (Array.isArray(firstProduct)) {
    options = apiProducts
      .filter((product: any) => {
        return product && Array.isArray(product) && product.length >= 2;
      })
      .map((product: any) => ({
        name: product[0], // First element is the product name
        currentQuantity: product[2] ?? product.currentQuantity ?? 0
      }))
      .filter((item) => {
        return item.name && item.name.trim() !== '';
      });
  }
  // Handle object format {name, currentQuantity}
  else if (typeof firstProduct === 'object' && firstProduct !== null) {
    options = apiProducts
      .filter((product: any) => {
        return product && product.name;
      })
      .map((product: any) => {
        return {
          name: product.name,
          currentQuantity: Number(product.currentQuantity) || 0
        };
      })
      .filter((item) => {
        return item.name && item.name.trim() !== '';
      });
  }

  // Remove duplicates to prevent React key warnings
  // Use Map to get unique product names, maintaining the first encountered quantity
  const uniqueOptionsMap = new Map<string, { name: string, currentQuantity: number }>();
  
  options.forEach(option => {
    if (!uniqueOptionsMap.has(option.name)) {
      uniqueOptionsMap.set(option.name, { ...option });
    } else {
      const existingOption = uniqueOptionsMap.get(option.name)!;
      existingOption.currentQuantity += option.currentQuantity;
    }
  });

  return Array.from(uniqueOptionsMap.values());
};

/**
 * Extract product ID from API product
 * Handles both array and object formats
 */
export const extractProductId = (apiProducts: any[], productName: string): string | null => {
  const selectedProduct = apiProducts.find((product: any) => {
    // Array format [name, id]
    if (Array.isArray(product)) {
      return product[0] === productName;
    }
    // Object format {name, id}
    else if (typeof product === 'object' && product !== null) {
      return product.name === productName;
    }
    return false;
  }) as any;

  if (selectedProduct) {
    if (Array.isArray(selectedProduct)) {
      return String(selectedProduct[1]); // [name, id] format
    } else if (selectedProduct.id) {
      return String(selectedProduct.id); // {name, id} format
    }
  }

  return null;
};

/**
 * Calculate total cart value (with discount applied)
 */
export const calculateCartTotal = (cartItems: Product[]): number => {
  return cartItems.reduce((acc, item) => {
    // The SP is now the total selling price for that item's quantity inclusive of discount
    // We handle the calculation in the slice/creation
    return acc + item.sp;
  }, 0);
};

/**
 * Validate if product can be added to cart
 */
export const canAddToCart = (
  findProduct: string,
  qty: number,
  availableTypes: Array<{ type: string; product_id: number }> | string[],
  productType: string,
  validationError: string,
  validatedData: any,
  batch?: string,
  discount?: number,
  discountAuthorizedBy?: string // Changed to check name instead of ID since get-doctors endpoint may not exist
): { canAdd: boolean; message?: string } => {
  if (!findProduct || qty <= 0) {
    return { canAdd: false, message: 'Please select a product and quantity' };
  }

  const typesArray = Array.isArray(availableTypes) && availableTypes.length > 0
    ? (typeof availableTypes[0] === 'string' ? availableTypes : availableTypes.map(t => (t as any).type))
    : [];

  if (typesArray.length > 1 && !productType) {
    return { canAdd: false, message: 'Please select a product type' };
  }

  if (!batch) {
    return { canAdd: false, message: 'Please select a batch number' };
  }

  // Mandatory discount authority when discount > 0 - check for doctor name
  // Note: Doctor ID is optional since get-doctors endpoint may return 404
  if (discount && discount > 0 && !discountAuthorizedBy) {
    return { canAdd: false, message: 'Please select a doctor to authorize the discount' };
  }

  if (validationError) {
    // Show the actual validation error message (e.g., stock errors)
    return { canAdd: false, message: validationError };
  }

  if (!validatedData) {
    return { canAdd: false, message: 'Please wait for validation to complete' };
  }

  return { canAdd: true };
};

/**
 * Create new cart item from form data
 */
export const createCartItem = (
  findProduct: string,
  qty: number,
  productType: string,
  availableTypes: Array<{ type: string; product_id: number }> | string[],
  discount: number,
  validatedData: any,
  defaultExpiry: string,
  productId?: string | number,
  discountAuthorizedBy?: string,
  batch?: string,
  discountAuthorizedById?: number,
  schedule?: string | null
): Product => {
  const typesArray = Array.isArray(availableTypes) && availableTypes.length > 0
    ? (typeof availableTypes[0] === 'string' ? availableTypes : availableTypes.map(t => (t as any).type))
    : [];
  const finalProductType = productType || (typesArray.length > 0 ? typesArray[0] : 'UNKNOWN');

  // Use validatedData.selling_price (per-unit) when backend provides it.
  // Otherwise fall back to the same formula the backend uses: mrp / pack_qty.
  // Final fallback to mrp only if pack_qty is missing/zero (treats item as already unit-priced).
  const packQtyForCalc = Number(validatedData?.pack_qty) || 0;
  let unitSellingPrice = validatedData.selling_price
    ?? (packQtyForCalc > 0 ? validatedData.mrp / packQtyForCalc : validatedData.mrp);

  // The client expects MRP to be the STRIP MRP, not the Total Base Price.
  // The 'validatedData.mrp' from the backend is the Strip MRP.
  const stripMrp = validatedData.mrp;
  
  // The client also expects SP to be the STRIP SP (Strip MRP - Discount) 
  // rather than the Total SP for the selected quantity.
  const discountMultiplier = 1 - ((discount || 0) / 100);
  const stripSp = stripMrp * discountMultiplier;

  return {
    id: Date.now().toString(),
    name: findProduct,
    batch: batch || `BATCH-${Date.now()}`,
    avlQty: qty.toString(),
    unit_selling_price: unitSellingPrice,
    mrp: stripMrp,
    sp: stripSp,
    expiry: validatedData?.batch?.expiry_date || defaultExpiry,
    quantity: qty,
    type: finalProductType,
    discount: discount,
    product_id: productId ? (typeof productId === 'string' ? parseInt(productId) : productId) : undefined,
    discountAuthorizedBy: discountAuthorizedBy || undefined,
    discountAuthorizedById: discountAuthorizedById,
    // Enforce default tax percentages (2.5%, 2.5%, 0%) unless specified by validation data
    cgstPercent: validatedData?.cgst_percent?.toString() || '2.5',
    sgstPercent: validatedData?.sgst_percent?.toString() || '2.5',
    igstPercent: validatedData?.igst_percent?.toString() || '0',
    pack_qty: validatedData?.pack_qty || 1,
    schedule: schedule ?? undefined,
  };
};

/**
 * Reset form to initial state
 */
export const getInitialFormState = (defaultQty: number, defaultDiscount: number) => ({
  findProduct: '',
  qty: defaultQty,
  discount: defaultDiscount,
  productType: '',
  availableTypes: [],
  showTypeDropdown: false,
  isProductSelected: false,
  productId: '',
  validationError: '',
  validatedData: null,
});

