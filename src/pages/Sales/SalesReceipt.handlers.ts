import { Customer } from '../../redux/slices/salesApi';
import { CartItem } from '../../redux/slices/cartSlice';
import { SalesReceiptItem } from './SalesReceipt.types';
import { extractErrorMessage as extractErrorFromUtils } from '../../utils/errorUtils';

/**
 * Validate customer data from modal
 */
export const validateCustomerData = (customerData: any): { isValid: boolean; error?: string } => {
  if (!customerData.customerName || !customerData.customerName.trim()) {
    return { isValid: false, error: 'Customer name is required' };
  }
  // A name must contain at least one letter — rejects an all-digit / no-letter value,
  // which is how a phone number gets wrongly entered into the name field.
  if (!/[A-Za-z]/.test(customerData.customerName.trim())) {
    return { isValid: false, error: 'Enter a valid customer name' };
  }
  if (!customerData.mobileNumber || !customerData.mobileNumber.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  if (!/^\d{10}$/.test(customerData.mobileNumber.trim())) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits' };
  }
  if (!customerData.billingAddress || !customerData.billingAddress.trim()) {
    return { isValid: false, error: 'Billing address is required' };
  }

  if (customerData.emailId && customerData.emailId.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.emailId.trim())) {
      return { isValid: false, error: 'Invalid email format' };
    }
  }

  if (customerData.gstin && customerData.gstin.trim()) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    const gstinValue = customerData.gstin.trim().toUpperCase().replace(/\s/g, '');

    if (!gstinRegex.test(gstinValue)) {
      return { isValid: false, error: 'Invalid GSTIN format' };
    }

    customerData.gstin = gstinValue;
  }

  if (customerData.pancardNumber && customerData.pancardNumber.trim()) {
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
    const panValue = customerData.pancardNumber.trim().toUpperCase();

    if (!panRegex.test(panValue)) {
      return { isValid: false, error: 'Invalid PAN format (e.g., ABCDE1234F)' };
    }

    customerData.pancardNumber = panValue;
  }

  return { isValid: true };
};

/**
 * Transform customer modal data to API payload
 */
export const transformCustomerDataToApiPayload = (customerData: any) => {
  let genderValue = 3;
  if (customerData.gender.male) {
    genderValue = 1;
  } else if (customerData.gender.female) {
    genderValue = 2;
  } else if (customerData.gender.other) {
    genderValue = 3;
  }

  return {
    name: customerData.customerName.trim(),
    email: customerData.emailId && customerData.emailId.trim() ? customerData.emailId.trim() : null,
    phone: customerData.mobileNumber.trim(),
    billing_address: customerData.billingAddress && customerData.billingAddress.trim() ? customerData.billingAddress.trim() : "",
    shipping_address: customerData.shippingAddressSameAsBilling
      ? (customerData.billingAddress && customerData.billingAddress.trim() ? customerData.billingAddress.trim() : "")
      : (customerData.shippingAddress && customerData.shippingAddress.trim() ? customerData.shippingAddress.trim() : null),
    gstin: customerData.gstin || null,
    pancard_num: customerData.pancardNumber || null,
    drug_license: customerData.drugLicense && customerData.drugLicense.trim() ? customerData.drugLicense.trim().toUpperCase() : null,
    gender: genderValue,
  };
};

/**
 * Extract error message from API error
 * @deprecated Use extractErrorMessage from '../../utils/errorUtils' instead
 * This function is kept for backward compatibility but will be removed in future versions
 */
export const extractErrorMessage = (error: unknown): string => {
  // Re-export from centralized utility for backward compatibility
  return extractErrorFromUtils(error, 'Failed to add customer');
};

/**
 * Get product ID from product name
 */
export const getProductIdFromName = (productName: string, apiProducts: any[]): number | null => {
  if (!productName || !apiProducts || apiProducts.length === 0) {
    return null;
  }

  const normalize = (str: string) => str.trim().toLowerCase();
  const normalizedProductName = normalize(productName);

  let product = apiProducts.find(p => normalize(p.name) === normalizedProductName);

  if (!product) {
    product = apiProducts.find(p => normalize(p.name).includes(normalizedProductName) || normalizedProductName.includes(normalize(p.name)));
  }

  return product ? product.id : null;
};

/**
 * Transform cart items for editing
 */
export const transformCartItemsForEdit = (salesItems: SalesReceiptItem[]): CartItem[] => {
  return salesItems.map(item => ({
    id: item.id,
    product_id: item.product_id,
    name: item.productName,
    batch: item.batch,
    avlQty: item.quantity,
    mrp: parseFloat(item.mrp || '0'),
    sp: parseFloat(item.unitPrice || '0'),
    unit_selling_price: parseFloat(item.unitPrice || '0'),
    expiry: item.expiryDate || '',
    quantity: parseInt(item.quantity),
    type: item.type,
    discount: parseFloat(item.discountPercent || '0'),
    discountAuthorizedBy: item.discountAuthorizedBy,
    discountAuthorizedById: item.discountAuthorizedById,
    totalPrice: parseFloat(item.amount || '0'),
    cgst: item.cgst,
    cgstPercent: item.cgstPercent,
    sgst: item.sgst,
    sgstPercent: item.sgstPercent,
    igst: item.igst,
    igstPercent: item.igstPercent,
    pack_qty: item.pack_qty,
    amount: item.amount,
    schedule: item.schedule,
  }));
};

const cartToSalesItem = (c: CartItem): SalesReceiptItem => {
  // Receipt's unitPrice is per-unit. Cart's `sp` is strip-level (stripMrp * discountMultiplier),
  // while `unit_selling_price` is the per-unit price. Prefer the per-unit value; only fall back
  // to deriving from `sp / quantity` (or `sp` itself for qty=1) when unit_selling_price is missing.
  const qty = Number(c.quantity) || 1;
  const perUnit = (c.unit_selling_price && c.unit_selling_price > 0)
    ? c.unit_selling_price
    : (qty > 0 ? c.sp / qty : c.sp);

  return {
  id: c.id,
  product_id: c.product_id,
  productName: c.name,
  batch: c.batch,
  expiryDate: c.expiry,
  quantity: String(c.quantity),
  type: c.type,
  unitPrice: String(perUnit),
  mrp: String(c.mrp),
  pack_qty: c.pack_qty,
  discount: '0',
  discountPercent: String(c.discount ?? 0),
  discountAuthorizedBy: c.discountAuthorizedBy,
  discountAuthorizedById: c.discountAuthorizedById,
  cgst: c.cgst || '0',
  cgstPercent: c.cgstPercent || '0',
  sgst: c.sgst || '0',
  sgstPercent: c.sgstPercent || '0',
  igst: c.igst || '0',
  igstPercent: c.igstPercent || '0',
  amount: c.amount || String(c.totalPrice ?? 0),
  schedule: c.schedule,
  };
};

// Merge cart items (user's intended state, including any newly-added rows) with
// API items (original DB rows that carry the real invoice_line_id). For each
// cart item we look up a matching API item by product_id+batch and copy its id
// (which is the invoice_line_id) so the save logic categorises it as "Edited"
// rather than "Added". Cart items without a match keep their synthetic id so
// the save logic treats them as new lines.
export const mergeCartWithApiItems = (
  cartItems: CartItem[],
  apiItems: SalesReceiptItem[]
): SalesReceiptItem[] => {
  const apiKey = (item: { product_id?: number; batch?: string }) =>
    `${item.product_id ?? ''}|${item.batch ?? ''}`;
  const apiByKey = new Map<string, SalesReceiptItem>();
  apiItems.forEach(item => apiByKey.set(apiKey(item), item));

  return cartItems.map(c => {
    const base = cartToSalesItem(c);
    const match = apiByKey.get(apiKey({ product_id: c.product_id, batch: c.batch }));
    if (match) {
      // Preserve original DB invoice_line_id and any fields the cart can't carry
      return {
        ...base,
        id: match.id,
        manufacturer: match.manufacturer,
        hsn: match.hsn,
        pack: match.pack,
        // Cart value wins; fall back to the DB line's schedule for edited sales.
        schedule: base.schedule ?? match.schedule,
        returned_quantity: match.returned_quantity,
        original_quantity: match.original_quantity,
      };
    }
    return base;
  });
};

