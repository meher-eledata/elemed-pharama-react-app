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

import React, { useState } from "react";
import { Grid, Typography, Box, Skeleton } from "@mui/material";
import SummaryCard from "./SummaryCard";
import CommonModal from "../../../components/CommonModal/CommonModal";
import {
  useGetInvoiceStatsQuery,
  useGetInventoryByDateQuery,
} from "../../../redux/slices/dashboardApi";
import { ReusableTable, TableColumn } from "../../PharmaTable/index";
import { INVENTORY_METRICS_CONSTANTS } from "../../../config/constants/InventoryMetric.constants";
import { INVENTORY_METRICS_LABELS } from "../../../config/label/InventoryMetric.label";

interface ModalItem {
  product_id: string;
  name: string;
  batchNumber: string;
  currentQuantity: number;
  minQty: number;
  maxQty: number;
  expiryDate: string;
  activityDate: string;
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
  const {
    data: invoiceStats,
    isLoading: isInvoiceStatsLoading,
    error: invoiceStatsError,
  } = useGetInvoiceStatsQuery(dateRange);

  const {
    data: inventoryStats,
    isLoading: isInventoryStatsLoading,
    error: inventoryStatsError,
  } = useGetInventoryByDateQuery(dateRange);

  const isLoading = isInvoiceStatsLoading || isInventoryStatsLoading;
  const error = invoiceStatsError || inventoryStatsError;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<any[]>([]);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);

  const handleOpenModal = (title: string, items: ModalItem[]) => {
    // When the modal opens, set the data and reset the sort configuration
    setModalTitle(title);
    setModalData(items || []);
    setSortConfig(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);
    setModalOpen(true);
  };

  const onSortRequest = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    // If the same header is clicked, toggle the direction
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    // Sort the data and update the state
    const sortedData = [...modalData].sort((a, b) => {
      const aValue = a[key as keyof ModalItem];
      const bValue = b[key as keyof ModalItem];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    setModalData(sortedData); // Update the state with the sorted data
    setSortConfig({ key, direction }); // Update the sort configuration
  };

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
      </Box>
    );
  }

  const cards = [
    {
      title: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
      value: inventoryStats?.belowMinProducts?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
      disabled: (inventoryStats?.belowMinProducts?.length ?? 0) === 0,
      onActionClick: () =>
        handleOpenModal(
          INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
          inventoryStats?.belowMinProducts || []
        ),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
      value: inventoryStats?.aboveMaxProducts?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.ACTION_TEXT,
      disabled: (inventoryStats?.aboveMaxProducts?.length ?? 0) === 0,
      onActionClick: () =>
        handleOpenModal(
          INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
          inventoryStats?.aboveMaxProducts || []
        ),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
      value: inventoryStats?.expiredProducts?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.ACTION_TEXT,
      disabled: (inventoryStats?.expiredProducts?.length ?? 0) === 0,
      onActionClick: () =>
        handleOpenModal(
          INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
          inventoryStats?.expiredProducts || []
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

  const columns: TableColumn<any>[] = [
    { key: "product_id", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ID },
    { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
    {
      key: "batchNumber",
      header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.BATCH_NO,
    },
    {
      key: "currentQuantity",
      header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY,
    },
    { key: "minQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MIN_QTY },
    { key: "maxQty", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.MAX_QTY },
    {
      key: "expiryDate",
      header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.EXPIRY,
      render: (item) =>
        item.expiryDate
          ? new Date(item.expiryDate).toLocaleDateString()
          : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
    },
    {
      key: "activityDate",
      header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.ACTIVITY_DATE,
      render: (item) =>
        item.activityDate
          ? new Date(item.activityDate).toLocaleString()
          : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
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
            data={modalData} // Use the directly sorted 'modalData' state
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
            totalRows={modalData.length}
            rowsPerPage={INVENTORY_METRICS_CONSTANTS.TABLE.ROWS_PER_PAGE}
            currentPage={INVENTORY_METRICS_CONSTANTS.TABLE.DEFAULT_PAGE}
            onPageChange={() => {}}
            onSortRequest={onSortRequest}
            sortConfig={sortConfig}
          />
        }
      />
    </>
  );
};

export default InventoryMetrics;