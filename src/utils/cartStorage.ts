const CART_STORAGE_KEY = 'pharma_sales_cart';
const CART_TIMESTAMP_KEY = 'pharma_sales_cart_timestamp';
const FORM_DATA_STORAGE_KEY = 'pharma_sales_form_data';
const SALES_HISTORY_STORAGE_KEY = 'pharma_sales_history';
const CART_EXPIRY_HOURS = 24;

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

export const saveCartToStorage = (cartItems: any[], totalAmount: number = 0): void => {
  try {
    const cartData: CartData = {
      cartItems,
      totalAmount,
      timestamp: Date.now(),
    };
    
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearCartFromStorage();
    }
  }
};

export const loadCartFromStorage = (): CartData | null => {
  try {
    const storedData = sessionStorage.getItem(CART_STORAGE_KEY);
    
    if (!storedData) {
      return null;
    }
    
    const cartData: CartData = JSON.parse(storedData);
    
    const hoursSinceCreation = (Date.now() - cartData.timestamp) / (1000 * 60 * 60);
    if (hoursSinceCreation > CART_EXPIRY_HOURS) {
      clearCartFromStorage();
      return null;
    }
    
    return cartData;
  } catch (error) {
    clearCartFromStorage();
    return null;
  }
};

export const clearCartFromStorage = (): void => {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CART_TIMESTAMP_KEY);
  } catch (error) {
  }
};

export const hasCartInStorage = (): boolean => {
  return sessionStorage.getItem(CART_STORAGE_KEY) !== null;
};

export const getCartItemsCount = (): number => {
  const cartData = loadCartFromStorage();
  return cartData?.cartItems?.length || 0;
};

export const saveFormDataToStorage = (formData: Omit<SalesFormData, 'timestamp'>): void => {
  try {
    const dataToSave: SalesFormData = {
      ...formData,
      timestamp: Date.now(),
    };
    
    sessionStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
  }
};

export const loadFormDataFromStorage = (): SalesFormData | null => {
  try {
    const storedData = sessionStorage.getItem(FORM_DATA_STORAGE_KEY);
    
    if (!storedData) {
      return null;
    }
    
    const formData: SalesFormData = JSON.parse(storedData);
    
    const hoursSinceCreation = (Date.now() - formData.timestamp) / (1000 * 60 * 60);
    if (hoursSinceCreation > CART_EXPIRY_HOURS) {
      clearFormDataFromStorage();
      return null;
    }
    
    return formData;
  } catch (error) {
    clearFormDataFromStorage();
    return null;
  }
};

export const clearFormDataFromStorage = (): void => {
  try {
    sessionStorage.removeItem(FORM_DATA_STORAGE_KEY);
  } catch (error) {
  }
};

export const saveSalesHistoryToStorage = (historyItem: any): void => {
  try {
    const existingHistory = getSalesHistoryFromStorage();
    const newHistory = [...existingHistory, {
      ...historyItem,
      id: Date.now(),
      savedAt: new Date().toISOString()
    }];
    
    localStorage.setItem(SALES_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
  } catch (error) {
  }
};

export const getSalesHistoryFromStorage = (): any[] => {
  try {
    const storedData = localStorage.getItem(SALES_HISTORY_STORAGE_KEY);
    if (!storedData) {
      return [];
    }
    return JSON.parse(storedData);
  } catch (error) {
    return [];
  }
};

export const clearSalesHistoryFromStorage = (): void => {
  try {
    localStorage.removeItem(SALES_HISTORY_STORAGE_KEY);
  } catch (error) {
  }
};

