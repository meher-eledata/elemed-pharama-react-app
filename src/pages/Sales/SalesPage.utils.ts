import { Product, ApiProduct } from './SalesPage.types';

/**
 * Process product options from API response
 * Handles both array format [name, id] and object format {name, id}
 */
export const processProductOptions = (apiProducts: any[]): string[] => {
  if (!apiProducts || apiProducts.length === 0) {
    return [];
  }
  
  const firstProduct = apiProducts[0];
  let options: string[] = [];
  
  // Handle array format [name, id]
  if (Array.isArray(firstProduct)) {
    options = apiProducts
      .filter((product: any) => {
        return product && Array.isArray(product) && product.length >= 2;
      })
      .map((product: any) => product[0]) // First element is the product name
      .filter((name: string) => {
        return name && name.trim() !== '';
      });
  } 
  // Handle object format {name: string, id: number}
  else if (typeof firstProduct === 'object' && firstProduct !== null) {
    options = apiProducts
      .filter((product: any) => {
        return product && product.name;
      })
      .map((product: any) => product.name)
      .filter((name: string) => {
        return name && name.trim() !== '';
      });
  } else {
  }
  
  if (options.length === 0 && apiProducts.length > 0) {
  }
  
  return options;
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
    const discountMultiplier = 1 - ((item.discount || 0) / 100);
    return acc + (item.sp * item.quantity * discountMultiplier);
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
  discountAuthorizedById?: number
): Product => {
  const typesArray = Array.isArray(availableTypes) && availableTypes.length > 0 
    ? (typeof availableTypes[0] === 'string' ? availableTypes : availableTypes.map(t => (t as any).type))
    : [];
  const finalProductType = productType || (typesArray.length > 0 ? typesArray[0] : 'UNKNOWN');

  return {
    id: Date.now().toString(),
    name: findProduct,
    batch: batch || `BATCH-${Date.now()}`,
    avlQty: qty.toString(),
    mrp: validatedData.mrp,
    sp: validatedData.selling_price,
    expiry: defaultExpiry,
    quantity: qty,
    type: finalProductType,
    discount: discount,
    product_id: productId ? (typeof productId === 'string' ? parseInt(productId) : productId) : undefined,
    discountAuthorizedBy: discountAuthorizedBy || undefined,
    discountAuthorizedById: discountAuthorizedById,
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

