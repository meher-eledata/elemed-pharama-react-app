import { Product, ApiProduct } from './SalesPage.types';

/**
 * Process product options from API response
 * Handles both array format [name, id] and object format {name, id}
 */
export const processProductOptions = (apiProducts: any[]): string[] => {
  console.log('Processing product options from:', apiProducts);
  
  if (!apiProducts || apiProducts.length === 0) {
    console.log('No products available');
    return [];
  }
  
  const firstProduct = apiProducts[0];
  console.log('First product structure:', firstProduct);
  
  let options: string[] = [];
  
  // Handle array format [name, id]
  if (Array.isArray(firstProduct)) {
    console.log('Detected array format: [name, id]');
    options = apiProducts
      .filter((product: any) => product && Array.isArray(product) && product.length >= 2)
      .map((product: any) => product[0]) // First element is the product name
      .filter((name: string) => name && name.trim() !== '');
  } 
  // Handle object format {name: string, id: number}
  else if (typeof firstProduct === 'object' && firstProduct !== null) {
    console.log('Detected object format: {name, id}');
    options = apiProducts
      .filter((product: any) => product && product.name)
      .map((product: any) => product.name)
      .filter((name: string) => name && name.trim() !== '');
  }
  
  console.log('Processed product options:', options);
  console.log('Total options count:', options.length);
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
 * Calculate total cart value
 */
export const calculateCartTotal = (cartItems: Product[]): number => {
  return cartItems.reduce((acc, item) => acc + item.sp * item.quantity, 0);
};

/**
 * Validate if product can be added to cart
 */
export const canAddToCart = (
  findProduct: string,
  qty: number,
  availableTypes: string[],
  productType: string,
  validationError: string,
  validatedData: any
): { canAdd: boolean; message?: string } => {
  if (!findProduct || qty <= 0) {
    return { canAdd: false, message: 'Please select a product and quantity' };
  }

  if (availableTypes.length > 1 && !productType) {
    return { canAdd: false, message: 'Please select a product type' };
  }

  if (validationError) {
    return { canAdd: false, message: 'Validation error exists' };
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
  availableTypes: string[],
  discount: number,
  validatedData: any,
  defaultExpiry: string
): Product => {
  const finalProductType = productType || (availableTypes.length > 0 ? availableTypes[0] : 'UNKNOWN');

  return {
    id: Date.now().toString(),
    name: findProduct,
    batch: `BATCH-${Date.now()}`,
    avlQty: qty.toString(),
    mrp: validatedData.mrp,
    sp: validatedData.selling_price,
    expiry: defaultExpiry,
    quantity: qty,
    type: finalProductType,
    discount: discount,
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

