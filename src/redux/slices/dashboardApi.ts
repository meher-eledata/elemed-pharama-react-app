// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// export const dashboardApi = createApi({
//   reducerPath: "dashboardApi",
//   baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api" }),
//   endpoints: (builder) => ({
//     getInvoiceStats: builder.query({
//       query: (body) => ({
//         url: "/dashboard/invoice-stats",
//         method: "POST",
//         body,
//       }),
//     }),
//     getInvoiceKpis: builder.query({
//       query: (body) => ({
//         url: "/dashboard/invoice-kpis",
//         method: "POST",
//         body,
//       }),
//     }),
//     getInventoryByDate: builder.query({
//       query: (body) => ({
//         url: "/dashboard/inventory-by-date",
//         method: "POST",
//         body,
//       }),
//     }),
//   }),
// });

// export const { useGetInvoiceStatsQuery, useGetInvoiceKpisQuery, useGetInventoryByDateQuery } = dashboardApi;


import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api" }),
  endpoints: (builder) => ({
    getInvoiceStats: builder.query({
      query: (body) => ({
        url: "/dashboard/invoice-stats",
        method: "POST",
        body,
      }),
    }),
    getInvoiceKpis: builder.query({
      query: (body) => ({
        url: "/dashboard/invoice-kpis",
        method: "POST",
        body,
      }),
    }),
    getInventoryByDate: builder.query({
      query: (body) => ({
        url: "/dashboard/inventory-by-date",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetInvoiceStatsQuery, useGetInvoiceKpisQuery, useGetInventoryByDateQuery } = dashboardApi;