import {
  saveCartToStorage,
  loadCartFromStorage,
  clearCartFromStorage,
  hasCartInStorage,
  getCartItemsCount,
  setEditInvoiceId,
  getEditInvoiceId,
  clearEditInvoiceId,
  saveFormDataToStorage,
  loadFormDataFromStorage,
  clearFormDataFromStorage,
  saveSalesHistoryToStorage,
  getSalesHistoryFromStorage,
  clearSalesHistoryFromStorage,
  getCurrentInvoiceNumber,
  generateNextInvoiceNumber,
  saveInvoiceNumber,
  type SalesFormData,
} from '../cartStorage';

// Cart + form data + edit-invoice-id live in sessionStorage.
// Sales history + invoice counter live in localStorage.
const CART_STORAGE_KEY = 'pharma_sales_cart';
const FORM_DATA_STORAGE_KEY = 'pharma_sales_form_data';
const SALES_HISTORY_STORAGE_KEY = 'pharma_sales_history';
const INVOICE_NUMBER_COUNTER_KEY = 'pharma_invoice_number_counter';
const EDIT_INVOICE_ID_KEY = 'pharma_edit_invoice_id';

const FORM_DATA_BASE: Omit<SalesFormData, 'timestamp'> = {
  customerName: 'Jane',
  customerMobile: '555',
  customerCity: 'Metropolis',
  patientType: 'OPD',
  doctorName: 'Dr. Who',
  doctorMobile: '999',
  doctorEmail: 'who@example.com',
  paymentMode: 'cash',
  insuranceCompany: '',
  invoiceNumber: 'INV11',
  invoiceDate: '2026-06-16',
};

describe('cartStorage', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('saveCartToStorage / loadCartFromStorage', () => {
    it('saves cart data to sessionStorage as JSON with a timestamp', () => {
      const now = 1_700_000_000_000;
      jest.spyOn(Date, 'now').mockReturnValue(now);
      const items = [{ id: 1, name: 'Aspirin' }];

      saveCartToStorage(items, 42);

      const raw = sessionStorage.getItem(CART_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string)).toEqual({
        cartItems: items,
        totalAmount: 42,
        timestamp: now,
      });
    });

    it('defaults totalAmount to 0 when not provided', () => {
      saveCartToStorage([{ id: 1 }]);
      const data = loadCartFromStorage();
      expect(data?.totalAmount).toBe(0);
    });

    it('loads previously saved (non-expired) cart data', () => {
      const items = [{ id: 1 }, { id: 2 }];
      saveCartToStorage(items, 100);

      const loaded = loadCartFromStorage();
      expect(loaded?.cartItems).toEqual(items);
      expect(loaded?.totalAmount).toBe(100);
    });

    it('returns null when no cart is stored', () => {
      expect(loadCartFromStorage()).toBeNull();
    });

    it('clears storage and returns null when stored cart is older than 24h', () => {
      const stale = {
        cartItems: [{ id: 1 }],
        totalAmount: 5,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25h ago
      };
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stale));

      expect(loadCartFromStorage()).toBeNull();
      expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBeNull();
    });

    it('clears storage and returns null when stored JSON is corrupt', () => {
      sessionStorage.setItem(CART_STORAGE_KEY, '{not valid json');
      expect(loadCartFromStorage()).toBeNull();
      expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBeNull();
    });
  });

  describe('clearCartFromStorage', () => {
    it('removes cart key and edit-invoice-id key', () => {
      saveCartToStorage([{ id: 1 }], 10);
      setEditInvoiceId(7);

      clearCartFromStorage();

      expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(EDIT_INVOICE_ID_KEY)).toBeNull();
    });
  });

  describe('hasCartInStorage', () => {
    it('returns false when no cart is stored', () => {
      expect(hasCartInStorage()).toBe(false);
    });

    it('returns true once a cart is stored', () => {
      saveCartToStorage([{ id: 1 }], 1);
      expect(hasCartInStorage()).toBe(true);
    });
  });

  describe('getCartItemsCount', () => {
    it('returns 0 when there is no cart', () => {
      expect(getCartItemsCount()).toBe(0);
    });

    it('returns the number of items in a stored cart', () => {
      saveCartToStorage([{ id: 1 }, { id: 2 }, { id: 3 }], 0);
      expect(getCartItemsCount()).toBe(3);
    });
  });

  describe('edit invoice id helpers', () => {
    it('sets and gets the edit invoice id as a string', () => {
      setEditInvoiceId(123);
      expect(getEditInvoiceId()).toBe('123');
    });

    it('returns null when no edit invoice id is set', () => {
      expect(getEditInvoiceId()).toBeNull();
    });

    it('clears the edit invoice id', () => {
      setEditInvoiceId('abc');
      clearEditInvoiceId();
      expect(getEditInvoiceId()).toBeNull();
    });
  });

  describe('saveFormDataToStorage / loadFormDataFromStorage', () => {
    it('saves form data with a timestamp and loads it back', () => {
      const now = 1_700_000_000_000;
      jest.spyOn(Date, 'now').mockReturnValue(now);

      saveFormDataToStorage(FORM_DATA_BASE);

      const raw = sessionStorage.getItem(FORM_DATA_STORAGE_KEY);
      expect(JSON.parse(raw as string)).toEqual({ ...FORM_DATA_BASE, timestamp: now });

      const loaded = loadFormDataFromStorage();
      expect(loaded?.customerName).toBe('Jane');
      expect(loaded?.timestamp).toBe(now);
    });

    it('returns null when no form data is stored', () => {
      expect(loadFormDataFromStorage()).toBeNull();
    });

    it('clears and returns null when stored form data is older than 24h', () => {
      const stale = { ...FORM_DATA_BASE, timestamp: Date.now() - 25 * 60 * 60 * 1000 };
      sessionStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(stale));

      expect(loadFormDataFromStorage()).toBeNull();
      expect(sessionStorage.getItem(FORM_DATA_STORAGE_KEY)).toBeNull();
    });

    it('clears and returns null when stored form JSON is corrupt', () => {
      sessionStorage.setItem(FORM_DATA_STORAGE_KEY, 'broken');
      expect(loadFormDataFromStorage()).toBeNull();
      expect(sessionStorage.getItem(FORM_DATA_STORAGE_KEY)).toBeNull();
    });

    it('clearFormDataFromStorage removes the form data key', () => {
      saveFormDataToStorage(FORM_DATA_BASE);
      clearFormDataFromStorage();
      expect(sessionStorage.getItem(FORM_DATA_STORAGE_KEY)).toBeNull();
    });
  });

  describe('sales history (localStorage)', () => {
    it('returns an empty array when no history is stored', () => {
      expect(getSalesHistoryFromStorage()).toEqual([]);
    });

    it('returns an empty array when stored history JSON is corrupt', () => {
      localStorage.setItem(SALES_HISTORY_STORAGE_KEY, '{bad');
      expect(getSalesHistoryFromStorage()).toEqual([]);
    });

    it('adds a new history entry with an id and savedAt timestamp', () => {
      saveSalesHistoryToStorage({ invoiceNumber: 'INV11', total: 50 });

      const history = getSalesHistoryFromStorage();
      expect(history).toHaveLength(1);
      expect(history[0].invoiceNumber).toBe('INV11');
      expect(history[0].id).toBeDefined();
      expect(history[0].savedAt).toBeDefined();
    });

    it('uses the provided historyItem.id when present', () => {
      saveSalesHistoryToStorage({ id: 999, invoiceNumber: 'INV20' });
      const history = getSalesHistoryFromStorage();
      expect(history[0].id).toBe(999);
    });

    it('updates an existing entry (same invoiceNumber) instead of duplicating', () => {
      saveSalesHistoryToStorage({ id: 5, invoiceNumber: 'INV11', total: 10 });
      saveSalesHistoryToStorage({ invoiceNumber: 'INV11', total: 99 });

      const history = getSalesHistoryFromStorage();
      expect(history).toHaveLength(1);
      expect(history[0].total).toBe(99);
      expect(history[0].id).toBe(5); // original id preserved
      expect(history[0].updatedAt).toBeDefined();
    });

    it('clearSalesHistoryFromStorage removes the history key', () => {
      saveSalesHistoryToStorage({ invoiceNumber: 'INV11' });
      clearSalesHistoryFromStorage();
      expect(localStorage.getItem(SALES_HISTORY_STORAGE_KEY)).toBeNull();
    });
  });

  describe('invoice number counter', () => {
    it('defaults to 11 when no counter is stored', () => {
      expect(getCurrentInvoiceNumber()).toBe(11);
    });

    it('reads the stored counter value', () => {
      localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, '20');
      expect(getCurrentInvoiceNumber()).toBe(20);
    });

    it('floors the counter to 11 when stored value is below 11', () => {
      localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, '3');
      expect(getCurrentInvoiceNumber()).toBe(11);
    });

    it('self-heals ahead of the highest invoice number found in history', () => {
      localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, '11');
      saveSalesHistoryToStorage({ invoiceNumber: 'INV50' });

      expect(getCurrentInvoiceNumber()).toBe(51);
      expect(localStorage.getItem(INVOICE_NUMBER_COUNTER_KEY)).toBe('51');
    });

    it('generateNextInvoiceNumber returns INV-prefixed number and increments the counter', () => {
      localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, '11');
      expect(generateNextInvoiceNumber()).toBe('INV11');
      expect(localStorage.getItem(INVOICE_NUMBER_COUNTER_KEY)).toBe('12');
    });

    it('saveInvoiceNumber bumps the counter to one past the given number', () => {
      localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, '11');
      saveInvoiceNumber('INV30');
      expect(localStorage.getItem(INVOICE_NUMBER_COUNTER_KEY)).toBe('31');
    });

    it('saveInvoiceNumber does not lower the counter for a smaller number', () => {
      localStorage.setItem(INVOICE_NUMBER_COUNTER_KEY, '40');
      saveInvoiceNumber('INV5');
      expect(localStorage.getItem(INVOICE_NUMBER_COUNTER_KEY)).toBe('40');
    });
  });
});
