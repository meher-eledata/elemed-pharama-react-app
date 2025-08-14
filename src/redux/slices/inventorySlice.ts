
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface LowStockItem {
  id: string; 
  name: string; 
  currentQuantity: number; 
  minQuantity: number; 
}

export interface ExcessStockItem {
  id: string; 
  name: string; 
  currentQuantity: number; 
  maxQuantity: number; 
}

export interface ExpiredStockItem {
  id: string; 
  name: string; 
  batchNumber: string; 
  currentQuantity: number; 
  expiryDate: string;
  daysPastExpiry: number; 
}

type StockType = 'low' | 'excess' | 'expired';

interface InventoryState {
  selectedStockType: StockType;
  lowStockItems: LowStockItem[];
  excessStockItems: ExcessStockItem[];
  expiredStockItems: ExpiredStockItem[];
  isLoading: boolean;
  error: string | null;
}

// Initial State
const initialState: InventoryState = {
  selectedStockType: 'low',
  lowStockItems: [],
  excessStockItems: [],
  expiredStockItems: [],
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchLowStock = createAsyncThunk(
  'inventory/fetchLowStock',
  async (_, thunkAPI) => {
    try {
      const res = await axios.get('http://localhost:3000/api/alerts/min-quantity');
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchExcessStock = createAsyncThunk(
  'inventory/fetchExcessStock',
  async (_, thunkAPI) => {
    try {
      const res = await axios.get('http://localhost:3000/api/alerts/max-quantity');
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchExpiredStock = createAsyncThunk(
  'inventory/fetchExpiredStock',
  async (_, thunkAPI) => {
    try {
      const res = await axios.get('http://localhost:3000/api/alerts/expiry');
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Slice
const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setStockType: (state, action: PayloadAction<StockType>) => {
      state.selectedStockType = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Low Stock
    builder
      .addCase(fetchLowStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLowStock.fulfilled, (state, action: PayloadAction<LowStockItem[]>) => {
        state.lowStockItems = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchLowStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Excess Stock
    builder
      .addCase(fetchExcessStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExcessStock.fulfilled, (state, action: PayloadAction<ExcessStockItem[]>) => {
        state.excessStockItems = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchExcessStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Expired Stock
    builder
      .addCase(fetchExpiredStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExpiredStock.fulfilled, (state, action: PayloadAction<ExpiredStockItem[]>) => {
        state.expiredStockItems = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchExpiredStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setStockType } = inventorySlice.actions;
export default inventorySlice.reducer;