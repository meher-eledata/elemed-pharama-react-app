import { Customer } from '../../redux/slices/salesApi';
import { SalesReceiptItem } from './SalesReceipt.types';
import { extractErrorMessage as extractErrorFromUtils } from '../../utils/errorUtils';

/**
 * Validate customer data from modal
 */
export const validateCustomerData = (customerData: any): { isValid: boolean; error?: string } => {
  if (!customerData.customerName || !customerData.customerName.trim()) {
    return { isValid: false, error: 'Customer name is required' };
  }
  if (!customerData.mobileNumber || !customerData.mobileNumber.trim()) {
    return { isValid: false, error: 'Phone number is required' };
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
    billing_address: customerData.billingAddress.trim(),
    shipping_address: customerData.shippingAddressSameAsBilling 
      ? customerData.billingAddress.trim()
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
export const transformCartItemsForEdit = (salesItems: SalesReceiptItem[]) => {
  return salesItems.map(item => ({
    id: item.id,
    name: item.productName,
    batch: item.batch,
    avlQty: item.quantity,
    mrp: parseFloat(item.mrp),
    sp: parseFloat(item.unitPrice),
    expiry: item.expiryDate,
    quantity: parseInt(item.quantity),
    type: item.type,
    discount: parseFloat(item.discountPercent),
    totalPrice: parseFloat(item.amount),
    cgst: item.cgst,
    cgstPercent: item.cgstPercent,
    sgst: item.sgst,
    sgstPercent: item.sgstPercent,
    igst: item.igst,
    igstPercent: item.igstPercent,
    amount: item.amount,
  }));
};

