import React, { useMemo } from "react";
import { Grid, Typography, Box, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SummaryCard from "./SummaryCard";
import {
  useGetInvoiceStatsQuery,
  useGetInventoryByDateQuery,
} from "../../../redux/slices/dashboardApi";
import { useGetNearExpiryStockQuery } from "../../../redux/slices/inventoryApi";
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
    <Grid container spacing={2}>
      {cards.map((card, idx) => (
        <Grid item xs={12} sm={6} md={4} key={idx}>
          <SummaryCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};

export default InventoryMetrics;