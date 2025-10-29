/**
 * Cart Storage Utility
 * Manages cart data persistence using sessionStorage
 */

const CART_STORAGE_KEY = 'pharma_sales_cart';
const CART_TIMESTAMP_KEY = 'pharma_sales_cart_timestamp';
const FORM_DATA_STORAGE_KEY = 'pharma_sales_form_data';
const SALES_HISTORY_STORAGE_KEY = 'pharma_sales_history';
const CART_EXPIRY_HOURS = 24; // Cart data expires after 24 hours

export interface CartData {
  cartItems: any[];
  totalAmount: number;
  timestamp: number;
}

export interface SalesFormData {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  timestamp: number;
}

/**
 * Save cart data to sessionStorage
 */
export const saveCartToStorage = (cartItems: any[], totalAmount: number = 0): void => {
  try {
    const cartData: CartData = {
      cartItems,
      totalAmount,
      timestamp: Date.now(),
    };
    
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    console.log('💾 Cart saved to storage:', cartData);
  } catch (error) {
    console.error('❌ Error saving cart to storage:', error);
    // Handle quota exceeded or other errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('⚠️ Storage quota exceeded, clearing old data...');
      clearCartFromStorage();
    }
  }
};

/**
 * Load cart data from sessionStorage
 */
export const loadCartFromStorage = (): CartData | null => {
  try {
    const storedData = sessionStorage.getItem(CART_STORAGE_KEY);
    
    if (!storedData) {
      console.log('ℹ️ No cart data found in storage');
      return null;
    }
    
    const cartData: CartData = JSON.parse(storedData);
    
    // Check if cart data is expired
    const hoursSinceCreation = (Date.now() - cartData.timestamp) / (1000 * 60 * 60);
    if (hoursSinceCreation > CART_EXPIRY_HOURS) {
      console.warn('⚠️ Cart data expired, clearing...');
      clearCartFromStorage();
      return null;
    }
    
    console.log('📂 Cart loaded from storage:', cartData);
    return cartData;
  } catch (error) {
    console.error('❌ Error loading cart from storage:', error);
    // If data is corrupted, clear it
    clearCartFromStorage();
    return null;
  }
};

/**
 * Clear cart data from sessionStorage
 */
export const clearCartFromStorage = (): void => {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CART_TIMESTAMP_KEY);
    console.log('🗑️ Cart cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing cart from storage:', error);
  }
};

/**
 * Check if cart exists in storage
 */
export const hasCartInStorage = (): boolean => {
  return sessionStorage.getItem(CART_STORAGE_KEY) !== null;
};

/**
 * Get cart items count from storage
 */
export const getCartItemsCount = (): number => {
  const cartData = loadCartFromStorage();
  return cartData?.cartItems?.length || 0;
};

/**
 * Save sales form data to sessionStorage
 */
export const saveFormDataToStorage = (formData: Omit<SalesFormData, 'timestamp'>): void => {
  try {
    const dataToSave: SalesFormData = {
      ...formData,
      timestamp: Date.now(),
    };
    
    sessionStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('💾 Form data saved to storage:', dataToSave);
  } catch (error) {
    console.error('❌ Error saving form data to storage:', error);
  }
};

/**
 * Load sales form data from sessionStorage
 */
export const loadFormDataFromStorage = (): SalesFormData | null => {
  try {
    const storedData = sessionStorage.getItem(FORM_DATA_STORAGE_KEY);
    
    if (!storedData) {
      console.log('ℹ️ No form data found in storage');
      return null;
    }
    
    const formData: SalesFormData = JSON.parse(storedData);
    
    // Check if form data is expired
    const hoursSinceCreation = (Date.now() - formData.timestamp) / (1000 * 60 * 60);
    if (hoursSinceCreation > CART_EXPIRY_HOURS) {
      console.warn('⚠️ Form data expired, clearing...');
      clearFormDataFromStorage();
      return null;
    }
    
    console.log('📂 Form data loaded from storage:', formData);
    return formData;
  } catch (error) {
    console.error('❌ Error loading form data from storage:', error);
    clearFormDataFromStorage();
    return null;
  }
};

/**
 * Clear form data from sessionStorage
 */
export const clearFormDataFromStorage = (): void => {
  try {
    sessionStorage.removeItem(FORM_DATA_STORAGE_KEY);
    console.log('🗑️ Form data cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing form data from storage:', error);
  }
};

/**
 * Save sales history to localStorage (persists across sessions)
 */
export const saveSalesHistoryToStorage = (historyItem: any): void => {
  try {
    const existingHistory = getSalesHistoryFromStorage();
    const newHistory = [...existingHistory, {
      ...historyItem,
      id: Date.now(), // Generate unique ID
      savedAt: new Date().toISOString()
    }];
    
    localStorage.setItem(SALES_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    console.log('💾 Sales history saved to storage:', historyItem);
  } catch (error) {
    console.error('❌ Error saving sales history to storage:', error);
  }
};

/**
 * Get sales history from localStorage
 */
export const getSalesHistoryFromStorage = (): any[] => {
  try {
    const storedData = localStorage.getItem(SALES_HISTORY_STORAGE_KEY);
    if (!storedData) {
      return [];
    }
    return JSON.parse(storedData);
  } catch (error) {
    console.error('❌ Error loading sales history from storage:', error);
    return [];
  }
};

/**
 * Clear sales history from localStorage
 */
export const clearSalesHistoryFromStorage = (): void => {
  try {
    localStorage.removeItem(SALES_HISTORY_STORAGE_KEY);
    console.log('🗑️ Sales history cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing sales history from storage:', error);
  }
};

