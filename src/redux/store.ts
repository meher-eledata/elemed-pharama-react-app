
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { authApi } from "./slices/authSlice";
import { inventoryApi } from "./slices/inventoryApi"; 
import { dashboardApi } from "./slices/dashboardApi";
import { receiveApi } from "./slices/receiveApi";
import { salesApi } from "./slices/salesApi";
import { adminApi } from "./slices/adminSlice";
import { masterApi } from "./slices/masterApi";
import { reportsApi } from "./slices/reportsApi";
import { historicalFilesApi } from "./slices/historicalFilesApi";
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
    [adminApi.reducerPath]: adminApi.reducer,
    [masterApi.reducerPath]: masterApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [historicalFilesApi.reducerPath]: historicalFilesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(inventoryApi.middleware) 
      .concat(dashboardApi.middleware)
      .concat(receiveApi.middleware)
      .concat(salesApi.middleware)
      .concat(adminApi.middleware)
      .concat(masterApi.middleware)
      .concat(reportsApi.middleware)
      .concat(historicalFilesApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
