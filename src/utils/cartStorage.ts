const CART_STORAGE_KEY = 'pharma_sales_cart';
const CART_TIMESTAMP_KEY = 'pharma_sales_cart_timestamp';
const FORM_DATA_STORAGE_KEY = 'pharma_sales_form_data';
const SALES_HISTORY_STORAGE_KEY = 'pharma_sales_history';
// LEGACY (2026-08-11): the client-side invoice-number counter was removed when the
// backend took over numbering — no code writes this key anymore. Kept ONLY so
// clearAllSalesStorage can purge the stale value from existing browsers on logout.
const INVOICE_NUMBER_COUNTER_KEY = 'pharma_invoice_number_counter';
const EDIT_INVOICE_ID_KEY = 'pharma_edit_invoice_id';
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
  patientType: string;
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
    sessionStorage.removeItem(EDIT_INVOICE_ID_KEY);
  } catch (error) {
  }
};

export const setEditInvoiceId = (id: string | number): void => {
  sessionStorage.setItem(EDIT_INVOICE_ID_KEY, id.toString());
};

export const getEditInvoiceId = (): string | null => {
  return sessionStorage.getItem(EDIT_INVOICE_ID_KEY);
};

export const clearEditInvoiceId = (): void => {
  sessionStorage.removeItem(EDIT_INVOICE_ID_KEY);
};

/**
 * Clears EVERY sales artifact this module persists — the working cart, form
 * data and edit-invoice id (sessionStorage) plus the locally-saved sales
 * history and the legacy invoice-number counter (localStorage, browser-global
 * and account-agnostic). Called on logout so the next account can never see or
 * merge the previous account's locally-saved sales data.
 */
export const clearAllSalesStorage = (): void => {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CART_TIMESTAMP_KEY);
    sessionStorage.removeItem(FORM_DATA_STORAGE_KEY);
    sessionStorage.removeItem(EDIT_INVOICE_ID_KEY);
    localStorage.removeItem(SALES_HISTORY_STORAGE_KEY);
    localStorage.removeItem(INVOICE_NUMBER_COUNTER_KEY);
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

export const saveSalesHistoryToStorage = (historyItem: any, invoiceId?: number): void => {
  try {
    const existingHistory = getSalesHistoryFromStorage();

    // If invoiceId is provided (edit mode), update the existing entry
    if (invoiceId !== undefined && invoiceId !== null) {
      // First, find the entry by invoiceId
      const existingIndex = existingHistory.findIndex((item: any) =>
        item.id === invoiceId
      );

      if (existingIndex >= 0) {
        // Get the old invoice number before updating
        const oldInvoiceNumber = existingHistory[existingIndex].invoiceNumber;

        // Remove ALL entries with the same invoiceId OR same invoice number (old or new)
        // This ensures we only keep one entry - the updated one
        const filteredHistory = existingHistory.filter((item: any) => {
          // Remove if it matches the invoiceId (we'll add the updated one)
          if (item.id === invoiceId) return false;
          // Remove if it has the same old invoice number
          if (item.invoiceNumber === oldInvoiceNumber) return false;
          // Remove if it has the same new invoice number
          if (item.invoiceNumber === historyItem.invoiceNumber) return false;
          // Keep everything else
          return true;
        });

        // Add the updated entry with the original ID
        filteredHistory.push({
          ...historyItem,
          id: existingHistory[existingIndex].id, // Keep the original ID
          savedAt: existingHistory[existingIndex].savedAt, // Keep original savedAt
          updatedAt: new Date().toISOString()
        });

        localStorage.setItem(SALES_HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
      } else {
        // If not found by ID, try to find by invoice number and update
        const invoiceNumberIndex = existingHistory.findIndex((item: any) =>
          item.invoiceNumber === historyItem.invoiceNumber
        );

        if (invoiceNumberIndex >= 0) {
          // Remove any other entries with the same invoice number
          const filteredHistory = existingHistory.filter((item: any, index: number) => {
            if (index === invoiceNumberIndex) return true;
            return item.invoiceNumber !== historyItem.invoiceNumber;
          });

          filteredHistory[invoiceNumberIndex >= filteredHistory.length ? filteredHistory.length - 1 : invoiceNumberIndex] = {
            ...historyItem,
            id: existingHistory[invoiceNumberIndex].id,
            savedAt: existingHistory[invoiceNumberIndex].savedAt,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem(SALES_HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
        } else {
          // If not found at all, add as new with the provided invoiceId
          existingHistory.push({
            ...historyItem,
            id: invoiceId,
            savedAt: new Date().toISOString()
          });
          localStorage.setItem(SALES_HISTORY_STORAGE_KEY, JSON.stringify(existingHistory));
        }
      }
    } else {
      // For new invoices, check if invoice number already exists and update it
      const existingIndex = existingHistory.findIndex((item: any) =>
        item.invoiceNumber === historyItem.invoiceNumber
      );

      if (existingIndex >= 0) {
        // Remove any duplicates with the same invoice number
        const filteredHistory = existingHistory.filter((item: any, index: number) => {
          if (index === existingIndex) return true;
          return item.invoiceNumber !== historyItem.invoiceNumber;
        });

        // Update existing entry
        filteredHistory[existingIndex >= filteredHistory.length ? filteredHistory.length - 1 : existingIndex] = {
          ...historyItem,
          id: existingHistory[existingIndex].id, // Keep the original ID
          savedAt: existingHistory[existingIndex].savedAt, // Keep original savedAt
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(SALES_HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
      } else {
        // Add new entry
        // Use the invoiceId from historyItem if provided (should be database invoice ID)
        // Otherwise use a timestamp as fallback
        const newId = historyItem.id || invoiceId || Date.now();
        const newHistory = [...existingHistory, {
          ...historyItem,
          id: newId, // Use database invoice ID if available
          savedAt: new Date().toISOString()
        }];
        localStorage.setItem(SALES_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      }
    }
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

// Invoice-number counter helpers removed (2026-08-11): the backend assigns invoice
// numbers at submit-sale, so the client no longer generates or tracks them.

