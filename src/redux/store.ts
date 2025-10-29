
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { authApi } from "./slices/authSlice";
import { inventoryApi } from "./slices/inventoryApi"; 
import { dashboardApi } from "./slices/dashboardApi";
import { receiveApi } from "./slices/receiveApi";
import { salesApi } from "./slices/salesApi";
import cartReducer from "./slices/cartSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    [authApi.reducerPath]: authApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,  
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [receiveApi.reducerPath]: receiveApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(inventoryApi.middleware) 
      .concat(dashboardApi.middleware)
      .concat(receiveApi.middleware)
      .concat(salesApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
