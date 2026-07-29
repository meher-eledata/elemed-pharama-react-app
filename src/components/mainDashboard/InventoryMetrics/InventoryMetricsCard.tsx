import React from "react";
import { Grid, Typography, Box, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SummaryCard from "./SummaryCard";
import { useGetInvoiceStatsQuery } from "../../../redux/slices/dashboardApi";
import {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetNearExpiryStockQuery,
} from "../../../redux/slices/inventoryApi";
import { INVENTORY_METRICS_CONSTANTS } from "../../../config/constants/InventoryMetric.constants";
import { INVENTORY_METRICS_LABELS } from "../../../config/label/InventoryMetric.label";

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

  // Stock cards consume the SAME live inventory endpoints the inventory page uses
  // (inventory_balance + per-batch expiry), so the numbers match the /inventory tabs
  // by construction. These are live-state queries — intentionally NOT wired to the
  // dashboard date picker (stock state has no date range). The legacy
  // dashboard/inventory-by-date endpoint (dead product.current_qty column) is no
  // longer consumed here.
  const {
    data: lowStockItems = [],
    isLoading: isLowStockLoading,
    error: lowStockError,
  } = useGetLowStockQuery();

  const {
    data: excessStockItems = [],
    isLoading: isExcessStockLoading,
    error: excessStockError,
  } = useGetExcessStockQuery();

  const {
    data: expiredStockItems = [],
    isLoading: isExpiredStockLoading,
    error: expiredStockError,
  } = useGetExpiredStockQuery();

  const {
    data: nearExpiryItems = [],
  } = useGetNearExpiryStockQuery({ months: 1 });

  const isLoading =
    isInvoiceStatsLoading || isLowStockLoading || isExcessStockLoading || isExpiredStockLoading;
  const error = invoiceStatsError || lowStockError || excessStockError || expiredStockError;

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
      value: lowStockItems.length,
      actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
      onActionClick: () => navigate('/inventory', { state: { tab: 'low' } }),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.TITLE,
      value: excessStockItems.length,
      actionText: INVENTORY_METRICS_LABELS.CARDS.EXCESS_STOCK.ACTION_TEXT,
      onActionClick: () => navigate('/inventory', { state: { tab: 'excess' } }),
    },
    {
      title: "Near Expiry Stock",
      value: nearExpiryItems.length,
      actionText: INVENTORY_METRICS_LABELS.CARDS.LOW_STOCK.ACTION_TEXT,
      onActionClick: () => navigate('/inventory', { state: { tab: 'nearExpiry' } }),
    },
    {
      title: INVENTORY_METRICS_LABELS.CARDS.EXPIRED_STOCK.TITLE,
      value: expiredStockItems.length,
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