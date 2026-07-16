import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../pages/Sales/SalesPage.types';

export interface CartItem {
  id: string;
  name: string;
  batch: string;
  avlQty: string;
  mrp: number;
  sp: number;
  unit_selling_price: number;
  expiry: string;
  quantity: number;
  type: string;
  discount: number;
  totalPrice: number;
  product_id?: number; // Product ID for fetching batches
  discountAuthorizedBy?: string; // Name of person authorizing the discount
  discountAuthorizedById?: number; // ID of doctor authorizing the discount
  cgst?: string;
  cgstPercent?: string;
  sgst?: string;
  sgstPercent?: string;
  igst?: string;
  igstPercent?: string;
  amount?: string;
  pack_qty?: number;
}

export interface SalesFormData {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  customerDetails?: string;
  patientType: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId?: number;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  formData: SalesFormData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  formData: null,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart
    addToCart: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += product.quantity;
        existingItem.avlQty = existingItem.quantity.toString(); // Sync avlQty
        const discountMultiplier = 1 - (existingItem.discount / 100);

        // Calculate total amount based on the unit_selling_price, independent of the Box MRP
        existingItem.totalPrice = existingItem.unit_selling_price * existingItem.quantity * discountMultiplier;
      } else {
        const discountMultiplier = 1 - (product.discount / 100);
        const newItem: CartItem = {
          ...product,
          quantity: product.quantity,
          totalPrice: product.unit_selling_price * product.quantity * discountMultiplier,
          // Set default tax percentages if not provided
          cgstPercent: product.cgstPercent || '9',
          sgstPercent: product.sgstPercent || '9',
          igstPercent: product.igstPercent || '0',
        };
        state.items.push(newItem);
      }

      // Recalculate total
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },

    // Remove item from cart
    removeFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);

      // Recalculate total
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },

    // Update item quantity
    updateItemQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);

      if (item) {
        item.quantity = Math.max(1, quantity); // Minimum quantity of 1
        item.avlQty = item.quantity.toString(); // Sync avlQty string
        const discountMultiplier = 1 - (item.discount / 100);

        // Update Total Price independent of Box MRP/SP
        item.totalPrice = item.unit_selling_price * item.quantity * discountMultiplier;

        // Recalculate total
        state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
      }
    },

    // Update item details (for editing)
    updateItemDetails: (state, action: PayloadAction<{ id: string; updates: Partial<CartItem> }>) => {
      const { id, updates } = action.payload;
      const item = state.items.find(item => item.id === id);

      if (item) {
        Object.assign(item, updates);

        // If avlQty is updated from the UI table, sync it to quantity
        if (updates.avlQty !== undefined) {
          // Parse string to int, ignore completely invalid strings
          const parsedQty = parseInt(updates.avlQty as string);
          if (!isNaN(parsedQty)) {
            item.quantity = Math.max(1, parsedQty);
          }
        }

        // Recalculate total price if quantity (or avlQty) or discount changed.
        if (updates.quantity !== undefined || updates.avlQty !== undefined || updates.discount !== undefined) {
          const discountMultiplier = 1 - ((item.discount || 0) / 100);

          item.totalPrice = item.unit_selling_price * item.quantity * discountMultiplier;
        }

        // Recalculate total
        state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
      }
    },

    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.formData = null;
    },

    // Set cart items (for loading from storage or API)
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload.map(item => {
        const discountMultiplier = 1 - ((item.discount || 0) / 100);
        // Fallback for backwards compatibility
        const unitSellingPrice = item.unit_selling_price || (item.mrp / item.quantity) || item.sp; 

        return {
          ...item,
          unit_selling_price: unitSellingPrice,
          totalPrice: unitSellingPrice * item.quantity * discountMultiplier,
        };
      });
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },

    // Save form data
    saveFormData: (state, action: PayloadAction<SalesFormData>) => {
      state.formData = action.payload;
    },

    // Clear form data
    clearFormData: (state) => {
      state.formData = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Bulk delete items
    bulkDeleteItems: (state, action: PayloadAction<string[]>) => {
      const idsToDelete = action.payload;
      state.items = state.items.filter(item => !idsToDelete.includes(item.id));

      // Recalculate total
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },

    // Reset cart state
    resetCart: () => initialState,
  },
});

// Export actions
export const {
  addToCart,
  removeFromCart,
  updateItemQuantity,
  updateItemDetails,
  clearCart,
  setCartItems,
  saveFormData,
  clearFormData,
  setLoading,
  setError,
  bulkDeleteItems,
  resetCart,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.totalAmount;
export const selectCartItemsCount = (state: { cart: CartState }) => state.cart.items.length;
export const selectFormData = (state: { cart: CartState }) => state.cart.formData;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.isLoading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;

// Selector for specific cart item
export const selectCartItemById = (state: { cart: CartState }, itemId: string) =>
  state.cart.items.find(item => item.id === itemId);

// Selector for cart summary
export const selectCartSummary = (state: { cart: CartState }) => ({
  itemsCount: state.cart.items.length,
  totalAmount: state.cart.totalAmount,
  items: state.cart.items,
});

export default cartSlice.reducer;
