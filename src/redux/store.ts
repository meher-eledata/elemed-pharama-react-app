
import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import { authApi } from './slices/authSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});


export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
