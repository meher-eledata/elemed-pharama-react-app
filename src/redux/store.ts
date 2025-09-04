
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { authApi } from "./slices/authSlice";
import { inventoryApi } from "./slices/inventoryApi"; 
import { dashboardApi } from "./slices/dashboardApi";
import { receiveApi } from "./slices/receiveApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,  
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [receiveApi.reducerPath]: receiveApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(inventoryApi.middleware) 
      .concat(dashboardApi.middleware)
      .concat(receiveApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
