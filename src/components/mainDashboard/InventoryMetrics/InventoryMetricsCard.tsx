import React, { useState, useMemo } from "react";
import { Grid, Typography, Box, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SummaryCard from "./SummaryCard";
import CommonModal from "../../../components/CommonModal/CommonModal";
import {
  useGetInvoiceStatsQuery,
  useGetInventoryByDateQuery,
  InventoryProduct,
} from "../../../redux/slices/dashboardApi";
import { useGetNearExpiryStockQuery } from "../../../redux/slices/inventoryApi";
import { ReusableTable, TableColumn } from "../../PharmaTable/index";
import { INVENTORY_METRICS_CONSTANTS } from "../../../config/constants/InventoryMetric.constants";
import { INVENTORY_METRICS_LABELS } from "../../../config/label/InventoryMetric.label";

interface ModalItem {
  name: string;
  currentQuantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  daysPastExpiry?: number;
  daysToExpiry?: number;
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
  const navigate = useNavigate();

  const shouldFetchData = dateRange.startDate && dateRange.endDate;
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
      refetchOnMountOrArgChange: true,
    }
  );

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
      refetchOnMountOrArgChange: true,
    }
  );

  const {
    data: nearExpiryItems = [],
  } = useGetNearExpiryStockQuery({ months: 1 });

  const transformProduct = (product: any): ModalItem => {
    return {
      name: product.name,
      currentQuantity: product.currentQuantity ?? product.current_qty ?? 0,
      minQuantity: product.minQty ?? product.min_qty,
      maxQuantity: product.maxQty ?? product.max_qty,
      batchNumber: product.batchNumber ?? product.batch_number,
      expiryDate: product.expiryDate ?? product.expiry_date,
      daysPastExpiry: product.daysPastExpiry ?? product.days_past_expiry,
      daysToExpiry: product.daysToExpiry ?? product.days_to_expiry ?? product.daysUntilExpiry,
    };
  };

  const lowStockData = useMemo(() => {
    return (inventoryStats?.belowMinProducts || []).map((p: any) => transformProduct(p));
  }, [inventoryStats?.belowMinProducts]);

  const nearExpiryStockData = useMemo(() => {
    return nearExpiryItems.map(transformProduct);
  }, [nearExpiryItems]);

  const expiredStockData = useMemo(() => {
    return (inventoryStats?.expiredProducts || []).map((p: any) => transformProduct(p));
  }, [inventoryStats?.expiredProducts]);

  const isLoading = isInvoiceStatsLoading || isInventoryStatsLoading;
  const error = invoiceStatsError || inventoryStatsError;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalType, setModalType] = useState<"low" | "nearExpiry" | "expired" | null>(null);
  const [modalPage, setModalPage] = useState(1);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);

  const handleOpenModal = (title: string, items: ModalItem[], type: "low" | "nearExpiry" | "expired") => {
    const itemsArray = items || [];

    setModalPage(1);
    setSortConfig(INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT);
    setModalType(type);
    setModalTitle(title);

    setModalData(itemsArray);
    setModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(sortedModalData.length / MODAL_ROWS_PER_PAGE);
    const maxValidPage = Math.max(1, totalPages);
    const safePage = Math.min(Math.max(1, newPage), maxValidPage);
    setModalPage(safePage);
  };

  const onSortRequest = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig({ key: "name", direction: "asc" });
      setModalPage(1);
      return;
    }
    setSortConfig({ key, direction });
    setModalPage(1);
  };

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

      case "nearExpiry":
        return [
          { key: "name", header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.NAME },
          {
            key: "currentQuantity",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.QUANTITY,
          },
          {
            key: "expiryDate",
            header: INVENTORY_METRICS_LABELS.TABLE.HEADERS.EXPIRY,
            render: (item) =>
              item.expiryDate
                ? new Date(item.expiryDate).toLocaleDateString('en-GB')
                : INVENTORY_METRICS_LABELS.TABLE.DATE_DEFAULT,
          },
          {
            key: "daysToExpiry",
            header: "Days to Expiry",
          },
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
                ? new Date(item.expiryDate).toLocaleDateString('en-GB')
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

  const MODAL_ROWS_PER_PAGE = 10;

  const sortedModalData = React.useMemo(() => {
    if (!modalData || modalData.length === 0) {
      return [];
    }

    const activeSortKey = sortConfig.key || INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT.key;
    const activeSortDirection = sortConfig.direction || INVENTORY_METRICS_CONSTANTS.DEFAULT_SORT.direction;

    const sorted = [...modalData].sort((a, b) => {
      const aValue = a[activeSortKey as keyof ModalItem];
      const bValue = b[activeSortKey as keyof ModalItem];

      if (aValue === undefined || aValue === null) {
        return activeSortDirection === "asc" ? 1 : -1;
      }
      if (bValue === undefined || bValue === null) {
        return activeSortDirection === "asc" ? -1 : 1;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return activeSortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return activeSortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return activeSortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    return sorted;
  }, [modalData, sortConfig]);


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


  const cards = [
    {
      title: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.TITLE,
      value: lowStockData?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
      onActionClick: () => navigate('/inventory', { state: { tab: 'low' } }),
    },
    {
      title: "Near Expiry Stock",
      value: nearExpiryStockData?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
      onActionClick: () => navigate('/inventory', { state: { tab: 'nearExpiry' } }),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
      value: expiredStockData?.length ?? 0,
      actionText: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.ACTION_TEXT,
      onActionClick: () => navigate('/inventory', { state: { tab: 'expired' } }),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.TITLE,
      content: invoiceStats?.latestBatchReceivedOn
        ? new Date(invoiceStats.latestBatchReceivedOn).toLocaleDateString('en-GB')
        : INVENTORY_METRICS_LABELS.CARDS.LATEST_BATCH.DEFAULT,
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.RETURN_PERCENT.TITLE,
      content: `${invoiceStats?.returns || 0}`,
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.TITLE,
      content: `${invoiceStats?.activeSalesDays || 0} ${INVENTORY_METRICS_LABELS.CARDS.ACTIVE_SALES_DAYS.SUFFIX
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
            data={sortedModalData}
            selectedRows={[]}
            setSelectedRows={() => { }}
            emptyMessage={INVENTORY_METRICS_LABELS.TABLE.EMPTY}
            searchAndFilterConfig={{ filterOptions: [] }}
            currentSearchTerm=""
            onSearchChange={() => { }}
            showFilters={false}
            onShowFiltersToggle={() => { }}
            currentFilterKey=""
            onFilterSelect={() => { }}
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