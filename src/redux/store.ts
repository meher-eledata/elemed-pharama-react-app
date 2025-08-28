// // src/redux/store.ts
// import { configureStore } from "@reduxjs/toolkit";
// import { authApi } from "../redux/slices/authSlice";
// import { inventoryApi } from "../redux/slices/inventorySlice";
// import { dashboardApi } from "../redux/slices/dashboardApi";
// export const store = configureStore({
//   reducer: {
//     [authApi.reducerPath]: authApi.reducer,
//     [inventoryApi.reducerPath]: inventoryApi.reducer,
//     [dashboardApi.reducerPath]: dashboardApi.reducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware().concat(
//       authApi.middleware,
//       inventoryApi.middleware,
//       dashboardApi.middleware
//     ),
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

import { configureStore } from "@reduxjs/toolkit";
import authReducer, { authApi } from "./slices/authSlice";
import { inventoryApi } from "./slices/inventoryApi"; 
import { dashboardApi } from "./slices/dashboardApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,  
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(inventoryApi.middleware) 
      .concat(dashboardApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
