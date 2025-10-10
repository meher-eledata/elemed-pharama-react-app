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

// Mock data for dashboard
const mockInvoiceStats = {
  latestBatchReceivedOn: "2025-01-15T10:30:00Z",
  returns: 3.2,
  activeSalesDays: 18,
};

const mockInventoryStats = {
  belowMinProducts: [
    {
      product_id: "101",
      name: "Paracetamol 500mg",
      batchNumber: "PCM001",
      currentQuantity: 15,
      minQty: 50,
      maxQty: 500,
      expiryDate: "2025-12-31",
      activityDate: "2025-01-15T10:30:00Z",
    },
    {
      product_id: "102",
      name: "Ibuprofen 400mg",
      batchNumber: "IBU002",
      currentQuantity: 8,
      minQty: 30,
      maxQty: 300,
      expiryDate: "2025-11-30",
      activityDate: "2025-01-15T10:30:00Z",
    },
  ],
  aboveMaxProducts: [
    {
      product_id: "103",
      name: "Amoxicillin 250mg",
      batchNumber: "AMX003",
      currentQuantity: 800,
      minQty: 20,
      maxQty: 200,
      expiryDate: "2025-10-15",
      activityDate: "2025-01-15T10:30:00Z",
    },
  ],
  expiredProducts: [
    {
      product_id: "104",
      name: "Aspirin 75mg",
      batchNumber: "ASP004",
      currentQuantity: 25,
      minQty: 10,
      maxQty: 100,
      expiryDate: "2024-12-31",
      activityDate: "2025-01-15T10:30:00Z",
    },
  ],
};


// Custom base query that returns mock data
const mockBaseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3000/api",
});

const generateMockKpisData = (dateRange: any) => {
  const startDate = new Date(dateRange.startDate || "2025-01-01");
  const endDate = new Date(dateRange.endDate || "2025-01-31");
  
  // Generate data for each day in the range
  const revenueByDay = [];
  const salesByDay = [];
  const uniquePatientsByDay = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Add some random data points to make charts interesting
    const isDataDay = Math.random() > 0.7; // 30% chance of having data on any given day
    
    revenueByDay.push({
      date: dateStr,
      amount: isDataDay ? Math.floor(Math.random() * 1000) : 0
    });
    
    salesByDay.push({
      date: dateStr,
      count: isDataDay ? Math.floor(Math.random() * 10) : 0
    });
    
    uniquePatientsByDay.push({
      date: dateStr,
      count: isDataDay ? Math.floor(Math.random() * 8) : 0
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculate totals
  const totalRevenue = revenueByDay.reduce((sum, day) => sum + day.amount, 0);
  const totalSales = salesByDay.reduce((sum, day) => sum + day.count, 0);
  const uniquePatients = Math.max(...uniquePatientsByDay.map(day => day.count), 0);
  
  return {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dateField: "created_at",
    totalRevenue,
    totalSales,
    uniquePatients,
    revenueByDay,
    salesByDay,
    uniquePatientsByDay,
  };
};

const customBaseQuery = async (args: any, api: any, extraOptions: any) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data based on the endpoint
  if (args.url === "/dashboard/invoice-stats") {
    return { data: mockInvoiceStats };
  }
  
  if (args.url === "/dashboard/inventory-by-date") {
    return { data: mockInventoryStats };
  }
  
  if (args.url === "/dashboard/invoice-kpis") {
    // Generate dynamic mock data based on the requested date range
    const dynamicKpisData = generateMockKpisData(args.body);
    return { data: dynamicKpisData };
  }
  
  // For any other endpoint, return an error
  return { error: { status: 404, data: "Endpoint not found" } };
};

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: customBaseQuery,
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