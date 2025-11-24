// import React, { useState } from "react";
// import { Grid, Typography, Box, Skeleton } from "@mui/material";
// import SummaryCard from "./SummaryCard";
// import CommonModal from "../../../components/CommonModal/CommonModal";
// import {
//   useGetInvoiceStatsQuery,
//   useGetInventoryByDateQuery,
// } from "../../../redux/slices/dashboardApi";
// import { ReusableTable, TableColumn } from "../../PharmaTable/index";
// import { INVENTORY_METRICS_CONSTANTS } from "../../../config/constants/InventoryMetric.constants";
// import { INVENTORY_METRICS_LABELS } from "../../../config/label/InventoryMetric.label";

// const [selectedRows, setSelectedRows] = useState<number[]>([]);

// interface ModalItem {
//   product_id: string;
//   name: string;
//   batchNumber: string;
//   currentQuantity: number;
//   minQty: number;
//   maxQty: number;
//   expiryDate: string;
//   activityDate: string;
// }

// interface InventoryMetricsCardProps {
//   dateRange: {
//     startDate: string | null;
//     endDate: string | null;
//   };
// }

// const InventoryMetrics: React.FC<InventoryMetricsCardProps> = ({ dateRange }) => {
//   const {
//     data: invoiceStats,
//     isLoading: isInvoiceStatsLoading,
//     error: invoiceStatsError,
//   } = useGetInvoiceStatsQuery(dateRange);

//   const {
//     data: inventoryStats,
//     isLoading: isInventoryStatsLoading,
//     error: inventoryStatsError,
//   } = useGetInventoryByDateQuery(dateRange);

//   const isLoading = isInvoiceStatsLoading || isInventoryStatsLoading;
//   const error = invoiceStatsError || inventoryStatsError;

//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState("");
//   const [modalData, setModalData] = useState<any[]>([]);

//   const [sortConfig, setSortConfig] = useState<{
//     key: string;
//     direction: "asc" | "desc";
//   }>(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);

//   const handleOpenModal = (title: string, items: ModalItem[]) => {
//     setModalTitle(title);
//     setModalData(items || []);
//     setModalOpen(true);
//   };

//   const onSortRequest = (key: string) => {
//     let direction: "asc" | "desc" = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   const sortedModalData = [...modalData].sort((a, b) => {
//     if (sortConfig.key) {
//       const aValue = a[sortConfig.key as keyof ModalItem];
//       const bValue = b[sortConfig.key as keyof ModalItem];

//       if (typeof aValue === "string" && typeof bValue === "string") {
//         return sortConfig.direction === "asc"
//           ? aValue.localeCompare(bValue)
//           : bValue.localeCompare(aValue);
//       }
//       if (typeof aValue === "number" && typeof bValue === "number") {
//         return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
//       }
//     }
//     return 0;
//   });

//   if (isLoading) {
//     return (
//       <Grid container spacing={2}>
//         {[1, 2, 3].map((i) => (
//           <Grid item xs={12} sm={6} md={4} key={i}>
//             <Skeleton variant="rectangular" height={INVENTORY_METRICS_CONSTANTS.SKELETON_HEIGHT} />
//           </Grid>
//         ))}
//       </Grid>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ p: 2, textAlign: "center" }}>
//         <Typography color="error">{INVENTORY_METRICS_LABELS.ERROR_MESSAGE}</Typography>
//       </Box>
//     );
//   }

//   const cards = [
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
//       value: inventoryStats?.belowMinProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.belowMinProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
//           inventoryStats?.belowMinProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
//       value: inventoryStats?.aboveMaxProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.aboveMaxProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
//           inventoryStats?.aboveMaxProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
//       value: inventoryStats?.expiredProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.expiredProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
//           inventoryStats?.expiredProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.TITLE,
//       content: invoiceStats?.latestBatchReceivedOn
//         ? new Date(invoiceStats.latestBatchReceivedOn).toLocaleDateString()
//         : INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.DEFAULT,
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.RETURN_PERCENT.TITLE,
//       content: `${invoiceStats?.returns || 0}%`,
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.TITLE,
//       content: `${invoiceStats?.activeSalesDays || 0} ${INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.SUFFIX}`,
//     },
//   ];

//   const columns: TableColumn<any>[] = [
//     { key: "product_id", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ID },
//     { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
//     { key: "batchNumber", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.BATCH_NO },
//     { key: "currentQuantity", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY },
//     { key: "minQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MIN_QTY },
//     { key: "maxQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MAX_QTY },
//     {
//       key: "expiryDate",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.EXPIRY,
//       render: (item) =>
//         item.expiryDate
//           ? new Date(item.expiryDate).toLocaleDateString()
//           : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
//     },
//     {
//       key: "activityDate",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ACTIVITY_DATE,
//       render: (item) =>
//         item.activityDate
//           ? new Date(item.activityDate).toLocaleString()
//           : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
//     },
//   ];

//   return (
//     <>
//       <Grid container spacing={2}>
//         {cards.map((card, idx) => (
//           <Grid item xs={12} sm={6} md={4} key={idx}>
//             <SummaryCard {...card} />
//           </Grid>
//         ))}
//       </Grid>
//       <CommonModal
//         open={modalOpen}
//         title={modalTitle}
//         onClose={() => setModalOpen(false)}
//         content={
//           <ReusableTable
//             columns={columns}
//             data={sortedModalData}
//             emptyMessage={INVENTORY_METRICS_LABELS.TABLE.EMPTY}
//             searchAndFilterConfig={{ filterOptions: [] }}
//             currentSearchTerm=""
//             onSearchChange={() => {}}
//             showFilters={false}
//             onShowFiltersToggle={() => {}}
//             currentFilterKey=""
//             onFilterSelect={() => {}}
//             totalRows={modalData.length}
//             rowsPerPage={INVENTORY_METRICS_CONSTANTS.TABLE.ROWS_PER_PAGE}
//             currentPage={INVENTORY_METRICS_CONSTANTS.TABLE.DEFAULT_PAGE}
//             onPageChange={() => {}}
//             onSortRequest={onSortRequest}
//             sortConfig={sortConfig}
//             selectedRows={selectedRows}        
//            setSelectedRows={setSelectedRows} 
//           />
//         }
//       />  
//     </>
//   );
// };

// export default InventoryMetrics;


// import React, { useState } from "react";
// import { Grid, Typography, Box, Skeleton } from "@mui/material";
// import SummaryCard from "./SummaryCard";
// import CommonModal from "../../../components/CommonModal/CommonModal";
// import {
//   useGetInvoiceStatsQuery,
//   useGetInventoryByDateQuery,
// } from "../../../redux/slices/dashboardApi";
// import { ReusableTable, TableColumn } from "../../PharmaTable/index";
// import { INVENTORY_METRICS_CONSTANTS } from "../../../config/constants/InventoryMetric.constants";
// import { INVENTORY_METRICS_LABELS } from "../../../config/label/InventoryMetric.label";

// interface ModalItem {
//   product_id: string;
//   name: string;
//   batchNumber: string;
//   currentQuantity: number;
//   minQty: number;
//   maxQty: number;
//   expiryDate: string;
//   activityDate: string;
// }

// interface InventoryMetricsCardProps {
//   dateRange: {
//     startDate: string | null;
//     endDate: string | null;
//   };
// }

// const InventoryMetrics: React.FC<InventoryMetricsCardProps> = ({ dateRange }) => {
//   // All state hooks must be declared inside the function component
//   const [selectedRows, setSelectedRows] = useState<number[]>([]);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState("");
//   const [modalData, setModalData] = useState<any[]>([]);
//   const [sortConfig, setSortConfig] = useState<{
//     key: string;
//     direction: "asc" | "desc";
//   }>(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);

//   const {
//     data: invoiceStats,
//     isLoading: isInvoiceStatsLoading,
//     error: invoiceStatsError,
//   } = useGetInvoiceStatsQuery(dateRange);

//   const {
//     data: inventoryStats,
//     isLoading: isInventoryStatsLoading,
//     error: inventoryStatsError,
//   } = useGetInventoryByDateQuery(dateRange);

//   const isLoading = isInvoiceStatsLoading || isInventoryStatsLoading;
//   const error = invoiceStatsError || inventoryStatsError;

//   const handleOpenModal = (title: string, items: ModalItem[]) => {
//     setModalTitle(title);
//     setModalData(items || []);
//     setModalOpen(true);
//   };

//   const onSortRequest = (key: string) => {
//     let direction: "asc" | "desc" = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   const sortedModalData = [...modalData].sort((a, b) => {
//     if (sortConfig.key) {
//       const aValue = a[sortConfig.key as keyof ModalItem];
//       const bValue = b[sortConfig.key as keyof ModalItem];

//       if (typeof aValue === "string" && typeof bValue === "string") {
//         return sortConfig.direction === "asc"
//           ? aValue.localeCompare(bValue)
//           : bValue.localeCompare(aValue);
//       }
//       if (typeof aValue === "number" && typeof bValue === "number") {
//         return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
//       }
//     }
//     return 0;
//   });

//   if (isLoading) {
//     return (
//       <Grid container spacing={2}>
//         {[1, 2, 3].map((i) => (
//           <Grid item xs={12} sm={6} md={4} key={i}>
//             <Skeleton variant="rectangular" height={INVENTORY_METRICS_CONSTANTS.SKELETON_HEIGHT} />
//           </Grid>
//         ))}
//       </Grid>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ p: 2, textAlign: "center" }}>
//         <Typography color="error">{INVENTORY_METRICS_LABELS.ERROR_MESSAGE}</Typography>
//       </Box>
//     );
//   }

//   const cards = [
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
//       value: inventoryStats?.belowMinProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.belowMinProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
//           inventoryStats?.belowMinProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
//       value: inventoryStats?.aboveMaxProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.aboveMaxProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
//           inventoryStats?.aboveMaxProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
//       value: inventoryStats?.expiredProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.expiredProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
//           inventoryStats?.expiredProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.TITLE,
//       content: invoiceStats?.latestBatchReceivedOn
//         ? new Date(invoiceStats.latestBatchReceivedOn).toLocaleDateString()
//         : INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.DEFAULT,
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.RETURN_PERCENT.TITLE,
//       content: `${invoiceStats?.returns || 0}%`,
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.TITLE,
//       content: `${invoiceStats?.activeSalesDays || 0} ${INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.SUFFIX}`,
//     },
//   ];

//   const columns: TableColumn<any>[] = [
//     { key: "product_id", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ID },
//     { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
//     { key: "batchNumber", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.BATCH_NO },
//     { key: "currentQuantity", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY },
//     { key: "minQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MIN_QTY },
//     { key: "maxQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MAX_QTY },
//     {
//       key: "expiryDate",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.EXPIRY,
//       render: (item) =>
//         item.expiryDate
//           ? new Date(item.expiryDate).toLocaleDateString()
//           : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
//     },
//     {
//       key: "activityDate",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ACTIVITY_DATE,
//       render: (item) =>
//         item.activityDate
//           ? new Date(item.activityDate).toLocaleString()
//           : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
//     },
//   ];

//   return (
//     <>
//       <Grid container spacing={2}>
//         {cards.map((card, idx) => (
//           <Grid item xs={12} sm={6} md={4} key={idx}>
//             <SummaryCard {...card} />
//           </Grid>
//         ))}
//       </Grid>
//       <CommonModal
//         open={modalOpen}
//         title={modalTitle}
//         onClose={() => setModalOpen(false)}
//         content={
//           <ReusableTable
//             columns={columns}
//             data={sortedModalData}
//             emptyMessage={INVENTORY_METRICS_LABELS.TABLE.EMPTY}
//             searchAndFilterConfig={{ filterOptions: [] }}
//             currentSearchTerm=""
//             onSearchChange={() => {}}
//             showFilters={false}
//             onShowFiltersToggle={() => {}}
//             currentFilterKey=""
//             onFilterSelect={() => {}}
//             totalRows={modalData.length}
//             rowsPerPage={INVENTORY_METRICS_CONSTANTS.TABLE.ROWS_PER_PAGE}
//             currentPage={INVENTORY_METRICS_CONSTANTS.TABLE.DEFAULT_PAGE}
//             onPageChange={() => {}}
//             onSortRequest={onSortRequest}
//             sortConfig={sortConfig}
//             selectedRows={selectedRows}
//             setSelectedRows={setSelectedRows}
//           />
//         }
//       />
//     </>
//   );
// };

// export default InventoryMetrics;




// import React, { useState } from "react";
// import { Grid, Typography, Box, Skeleton } from "@mui/material";
// import SummaryCard from "./SummaryCard";
// import CommonModal from "../../../components/CommonModal/CommonModal";
// import {
//   useGetInvoiceStatsQuery,
//   useGetInventoryByDateQuery,
// } from "../../../redux/slices/dashboardApi";
// import { ReusableTable, TableColumn } from "../../PharmaTable/index";
// import { INVENTORY_METRICS_CONSTANTS } from "../../../config/constants/InventoryMetric.constants";
// import { INVENTORY_METRICS_LABELS } from "../../../config/label/InventoryMetric.label";

// interface ModalItem {
//   product_id: string;
//   name: string;
//   batchNumber: string;
//   currentQuantity: number;
//   minQty: number;
//   maxQty: number;
//   expiryDate: string;
//   activityDate: string;
// }

// interface InventoryMetricsCardProps {
//   dateRange: {
//     startDate: string | null;
//     endDate: string | null;
//   };
// }

// const InventoryMetrics: React.FC<InventoryMetricsCardProps> = ({
//   dateRange,
// }) => {
//   const {
//     data: invoiceStats,
//     isLoading: isInvoiceStatsLoading,
//     error: invoiceStatsError,
//   } = useGetInvoiceStatsQuery(dateRange);

//   const {
//     data: inventoryStats,
//     isLoading: isInventoryStatsLoading,
//     error: inventoryStatsError,
//   } = useGetInventoryByDateQuery(dateRange);

//   const isLoading = isInvoiceStatsLoading || isInventoryStatsLoading;
//   const error = invoiceStatsError || inventoryStatsError;

//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalTitle, setModalTitle] = useState("");
//   const [modalData, setModalData] = useState<any[]>([]);

//   const [sortConfig, setSortConfig] = useState<{
//     key: string;
//     direction: "asc" | "desc";
//   }>(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);

//   const handleOpenModal = (title: string, items: ModalItem[]) => {
//     setModalTitle(title);
//     setModalData(items || []);
//     setModalOpen(true);
//   };

//   const onSortRequest = (key: string) => {
//     let direction: "asc" | "desc" = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   const sortedModalData = [...modalData].sort((a, b) => {
//     if (sortConfig.key) {
//       const aValue = a[sortConfig.key as keyof ModalItem];
//       const bValue = b[sortConfig.key as keyof ModalItem];

//       if (typeof aValue === "string" && typeof bValue === "string") {
//         return sortConfig.direction === "asc"
//           ? aValue.localeCompare(bValue)
//           : bValue.localeCompare(aValue);
//       }
//       if (typeof aValue === "number" && typeof bValue === "number") {
//         return sortConfig.direction === "asc"
//           ? aValue - bValue
//           : bValue - aValue;
//       }
//     }
//     return 0;
//   });

//   if (isLoading) {
//     return (
//       <Grid container spacing={2}>
//         {[1, 2, 3].map((i) => (
//           <Grid item xs={12} sm={6} md={4} key={i}>
//             <Skeleton
//               variant="rectangular"
//               height={INVENTORY_METRICS_CONSTANTS.SKELETON_HEIGHT}
//             />
//           </Grid>
//         ))}
//       </Grid>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ p: 2, textAlign: "center" }}>
//         <Typography color="error">
//           {INVENTORY_METRICS_LABELS.ERROR_MESSAGE}
//         </Typography>
//       </Box>
//     );
//   }

//   const cards = [
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
//       value: inventoryStats?.belowMinProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.belowMinProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
//           inventoryStats?.belowMinProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
//       value: inventoryStats?.aboveMaxProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.aboveMaxProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
//           inventoryStats?.aboveMaxProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
//       value: inventoryStats?.expiredProducts?.length ?? 0,
//       actionText: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.ACTION_TEXT,
//       disabled: (inventoryStats?.expiredProducts?.length ?? 0) === 0,
//       onActionClick: () =>
//         handleOpenModal(
//           INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
//           inventoryStats?.expiredProducts || []
//         ),
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.TITLE,
//       content: invoiceStats?.latestBatchReceivedOn
//         ? new Date(invoiceStats.latestBatchReceivedOn).toLocaleDateString()
//         : INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.DEFAULT,
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.RETURN_PERCENT.TITLE,
//       content: `${invoiceStats?.returns || 0}%`,
//     },
//     {
//       title: INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.TITLE,
//       content: `${invoiceStats?.activeSalesDays || 0} ${
//         INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.SUFFIX
//       }`,
//     },
//   ];

//   const columns: TableColumn<any>[] = [
//     { key: "product_id", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ID },
//     { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
//     {
//       key: "batchNumber",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.BATCH_NO,
//     },
//     {
//       key: "currentQuantity",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY,
//     },
//     { key: "minQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MIN_QTY },
//     { key: "maxQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MAX_QTY },
//     {
//       key: "expiryDate",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.EXPIRY,
//       render: (item) =>
//         item.expiryDate
//           ? new Date(item.expiryDate).toLocaleDateString()
//           : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
//     },
//     {
//       key: "activityDate",
//       header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ACTIVITY_DATE,
//       render: (item) =>
//         item.activityDate
//           ? new Date(item.activityDate).toLocaleString()
//           : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
//     },
//   ];

//   return (
//     <>
//       <Grid container spacing={2}>
//         {cards.map((card, idx) => (
//           <Grid item xs={12} sm={6} md={4} key={idx}>
//             <SummaryCard {...card} />
//           </Grid>
//         ))}
//       </Grid>
//       <CommonModal
//         open={modalOpen}
//         title={modalTitle}
//         onClose={() => setModalOpen(false)}
//         content={
//           <ReusableTable
//             columns={columns}
//             data={sortedModalData}
//             selectedRows={[]} // empty array
//             setSelectedRows={() => {}}
//             emptyMessage={INVENTORY_METRICS_LABELS.TABLE.EMPTY}
//             searchAndFilterConfig={{ filterOptions: [] }}
//             currentSearchTerm=""
//             onSearchChange={() => {}}
//             showFilters={false}
//             onShowFiltersToggle={() => {}}
//             currentFilterKey=""
//             onFilterSelect={() => {}}
//             totalRows={modalData.length}
//             rowsPerPage={INVENTORY_METRICS_CONSTANTS.TABLE.ROWS_PER_PAGE}
//             currentPage={INVENTORY_METRICS_CONSTANTS.TABLE.DEFAULT_PAGE}
//             onPageChange={() => {}}
//             onSortRequest={onSortRequest}
//             sortConfig={sortConfig}
//           />
//         }
//       />
//     </>
//   );
// };

// export default InventoryMetrics;

import React, { useState, useMemo } from "react";
import { Grid, Typography, Box, Skeleton } from "@mui/material";
import SummaryCard from "./SummaryCard";
import CommonModal from "../../../components/CommonModal/CommonModal";
import {
  useGetInvoiceStatsQuery,
  useGetInventoryByDateQuery,
  InventoryProduct,
} from "../../../redux/slices/dashboardApi";
import { ReusableTable, TableColumn } from "../../PharmaTable/index";
import { INVENTORY_METRICS_CONSTANTS } from "../../../config/constants/InventoryMetric.constants";
import { INVENTORY_METRICS_LABELS } from "../../../config/label/InventoryMetric.label";

// Transform API product to component format
interface ModalItem {
  name: string;
  currentQuantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  daysPastExpiry?: number;
}

interface InventoryMetricsCardProps {
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

const InventoryMetrics: React.FC<InventoryMetricsCardProps> = ({
  dateRange,
}) => {
  // Skip query if dateRange values are null
  const shouldFetchData = dateRange.startDate && dateRange.endDate;

  // Invoice stats query
  const {
    data: invoiceStats,
    isLoading: isInvoiceStatsLoading,
    error: invoiceStatsError,
  } = useGetInvoiceStatsQuery(
    {
      startDate: dateRange.startDate || '',
      endDate: dateRange.endDate || '',
    },
    {
      skip: !shouldFetchData,
    }
  );

  // Inventory stats by date query - using dashboard endpoint
  const {
    data: inventoryStats,
    isLoading: isInventoryStatsLoading,
    error: inventoryStatsError,
  } = useGetInventoryByDateQuery(
    {
      startDate: dateRange.startDate || '',
      endDate: dateRange.endDate || '',
    },
    {
      skip: !shouldFetchData,
    }
  );

  // Transform API products to component format
  const transformProduct = (product: InventoryProduct): ModalItem => {
    return {
      name: product.name,
      currentQuantity: product.currentQuantity,
      minQuantity: product.minQty,
      maxQuantity: product.maxQty,
      batchNumber: product.batchNumber,
      expiryDate: product.expiryDate,
      // Calculate days past expiry if needed
      daysPastExpiry: product.expiryDate
        ? Math.floor((new Date().getTime() - new Date(product.expiryDate).getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    };
  };

  // Transform API data to component format
  const lowStockData = useMemo(() => {
    return (inventoryStats?.belowMinProducts || []).map(transformProduct);
  }, [inventoryStats?.belowMinProducts]);

  const excessStockData = useMemo(() => {
    return (inventoryStats?.aboveMaxProducts || []).map(transformProduct);
  }, [inventoryStats?.aboveMaxProducts]);

  const expiredStockData = useMemo(() => {
    return (inventoryStats?.expiredProducts || []).map(transformProduct);
  }, [inventoryStats?.expiredProducts]);

  // Include invoice stats in loading/error checks
  const isLoading = isInvoiceStatsLoading || isInventoryStatsLoading;
  const error = invoiceStatsError || inventoryStatsError;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalType, setModalType] = useState<"low" | "excess" | "expired" | null>(null);
  const [modalPage, setModalPage] = useState(1);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);

  const handleOpenModal = (title: string, items: ModalItem[], type: "low" | "excess" | "expired") => {
    // When the modal opens, set the data and reset the sort configuration and page
    const itemsArray = items || [];
    
    // Reset everything first
    setModalPage(1);
    setSortConfig(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);
    setModalType(type);
    setModalTitle(title);
    // Set modalData last to ensure all state is ready
    setModalData(itemsArray);
    setModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(sortedModalData.length / MODAL_ROWS_PER_PAGE);
    // Ensure the new page is within valid bounds
    const maxValidPage = Math.max(1, totalPages);
    const safePage = Math.min(Math.max(1, newPage), maxValidPage);
    setModalPage(safePage);
  };

  const onSortRequest = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      // Revert to default sorting instead of clearing
      setSortConfig({ key: "name", direction: "asc" });
      setModalPage(1); // Reset to first page when sorting changes
      return;
    }
    setSortConfig({ key, direction });
    setModalPage(1); // Reset to first page when sorting changes
  };

  // Dynamic columns based on modal type (matching Inventory module)
  const getColumns = (): TableColumn<any>[] => {
    switch (modalType) {
      case "low":
        return [
          { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
          {
            key: "currentQuantity",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY,
          },
          { key: "minQuantity", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MIN_QTY },
        ];
      
      case "excess":
        return [
          { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
          {
            key: "currentQuantity",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY,
          },
          { key: "maxQuantity", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MAX_QTY },
        ];
      
      case "expired":
        return [
          { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
          {
            key: "batchNumber",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.BATCH_NO,
          },
          {
            key: "currentQuantity",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY,
          },
          {
            key: "expiryDate",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.EXPIRY,
            render: (item) =>
              item.expiryDate
                ? new Date(item.expiryDate).toLocaleDateString()
                : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
          },
          {
            key: "daysPastExpiry",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.DAYS_PAST,
          },
        ];
      
      default:
        return [
          { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
        ];
    }
  };

  const columns = getColumns();

  // Modal rows per page - smaller than main table for better modal size
  const MODAL_ROWS_PER_PAGE = 3;

  // Sort the modal data first
  const sortedModalData = React.useMemo(() => {
    if (!modalData || modalData.length === 0) {
      return [];
    }
    const sorted = [...modalData].sort((a, b) => {
      if (sortConfig.key) {
        const aValue = a[sortConfig.key as keyof ModalItem];
        const bValue = b[sortConfig.key as keyof ModalItem];

        // Handle undefined/null values
        if (aValue === undefined || aValue === null) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        if (bValue === undefined || bValue === null) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
      }
      return 0;
    });
    return sorted;
  }, [modalData, sortConfig]);

  // Note: ReusableTable handles pagination internally, so we pass the full sorted data

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton
              variant="rectangular"
              height={INVENTORY_METRICS_CONSTANTS.SKELETON_HEIGHT}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography color="error">
          {INVENTORY_METRICS_LABELS.ERROR_MESSAGE}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {JSON.stringify(error)}
        </Typography>
      </Box>
    );
  }

  // Debug: Log the data

  const cards = [
    {
      title: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
      value: lowStockData?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
      disabled: (lowStockData?.length ?? 0) === 0,
      onActionClick: () =>
        handleOpenModal(
          INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
          lowStockData || [],
          "low"
        ),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
      value: excessStockData?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.ACTION_TEXT,
      disabled: (excessStockData?.length ?? 0) === 0,
      onActionClick: () =>
        handleOpenModal(
          INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
          excessStockData || [],
          "excess"
        ),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
      value: expiredStockData?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.ACTION_TEXT,
      disabled: (expiredStockData?.length ?? 0) === 0,
      onActionClick: () =>
        handleOpenModal(
          INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
          expiredStockData || [],
          "expired"
        ),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.TITLE,
      content: invoiceStats?.latestBatchReceivedOn
        ? new Date(invoiceStats.latestBatchReceivedOn).toLocaleDateString()
        : INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.DEFAULT,
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.RETURN_PERCENT.TITLE,
      content: `${invoiceStats?.returns || 0}%`,
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.TITLE,
      content: `${invoiceStats?.activeSalesDays || 0} ${
        INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.SUFFIX
      }`,
    },
  ];

  return (
    <>
      <Grid container spacing={2}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>
      <CommonModal
        open={modalOpen}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
        content={
          <ReusableTable
            columns={columns}
            data={sortedModalData} // Pass full sorted data - ReusableTable handles pagination
            selectedRows={[]} // empty array
            setSelectedRows={() => {}}
            emptyMessage={INVENTORY_METRICS_LABELS.TABLE.EMPTY}
            searchAndFilterConfig={{ filterOptions: [] }}
            currentSearchTerm=""
            onSearchChange={() => {}}
            showFilters={false}
            onShowFiltersToggle={() => {}}
            currentFilterKey=""
            onFilterSelect={() => {}}
            totalRows={sortedModalData.length}
            rowsPerPage={MODAL_ROWS_PER_PAGE}
            currentPage={modalPage}
            onPageChange={handlePageChange}
            onSortRequest={onSortRequest}
            sortConfig={sortConfig}
          />
        }
      />
    </>
  );
};

export default InventoryMetrics;