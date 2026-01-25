const CART_STORAGE_KEY = 'pharma_sales_cart';
const CART_TIMESTAMP_KEY = 'pharma_sales_cart_timestamp';
const FORM_DATA_STORAGE_KEY = 'pharma_sales_form_data';
const SALES_HISTORY_STORAGE_KEY = 'pharma_sales_history';
const INVOICE_NUMBER_COUNTER_KEY = 'pharma_invoice_number_counter';
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

export const getCurrentInvoiceNumber = (): number => {
  try {
    const stored = localStorage.getItem(INVOICE_NUMBER_COUNTER_KEY);
    let nextNum = 11; // Start from 11 due to 10 default invoices

    if (stored) {
      nextNum = parseInt(stored, 10);
      if (isNaN(nextNum) || nextNum < 11) nextNum = 11;
    }

    // SELF-HEALING: Check sales history to ensure we never generate a duplicate
    // especially if the user cleared their browser storage but NOT their database.
    const history = getSalesHistoryFromStorage();
    if (history.length > 0) {
      const highestInHistory = history.reduce((max, item) => {
        // Extract numeric part (handles "6", "INV-6", "RB6", etc.)
        const num = parseInt(String(item.invoiceNumber || '').replace(/[^0-9]/g, ''), 10);
        return (!isNaN(num) && num > max) ? num : max;
      }, 0);

      // If history has a higher number than our counter, jump ahead!
      if (highestInHistory >= nextNum) {
        nextNum = highestInHistory + 1;
        localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, nextNum.toString());
      }
    }

    return nextNum;
  } catch (error) {
    return 1;
  }
};

/**
 * Generates the next invoice number and saves it
 * Format: Simple number (e.g., "6", "7", etc.) to match backend strict numeric expectation
 * @returns The next unique invoice number string
 */
export const generateNextInvoiceNumber = (): string => {
  try {
    const nextNumber = getCurrentInvoiceNumber();
    localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, (nextNumber + 1).toString());

    // Include the "INV" prefix for frontend representation
    return `INV${nextNumber}`;
  } catch (error) {
    // Fallback: if storage fails, return a random sequence to minimize collision risks
    return `INV${Math.floor(Date.now() / 1000)}`;
  }
};

/**
 * Gets the next invoice number without incrementing the counter
 * Useful for previewing what the next invoice number will be
 * @returns The formatted invoice number string
 */
export const getNextInvoiceNumber = (): string => {
  const currentNumber = getCurrentInvoiceNumber();
  return `INV${currentNumber}`;
};

/**
 * Saves an invoice number to ensure the counter is at least that number
 * This is useful when loading existing invoices to prevent duplicates
 * @param invoiceNumber - The invoice number string (e.g., "INV123")
 */
export const saveInvoiceNumber = (invoiceNumber: string): void => {
  try {
    // Extract numeric part from invoice number (e.g., "INV123" -> 123)
    const numericPart = invoiceNumber.replace(/^INV/i, '').trim();
    const number = parseInt(numericPart, 10);

    if (!isNaN(number) && number > 0) {
      const currentNumber = getCurrentInvoiceNumber();
      // Update counter to be at least this number
      if (number >= currentNumber) {
        localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, (number + 1).toString());
      }
    }
  } catch (error) {
    // Silently fail if there's an error
  }
};

