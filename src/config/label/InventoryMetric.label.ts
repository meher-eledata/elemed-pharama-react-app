export const INVENTORY_METRICS_LABELS = {
  ERROR_MESSAGE: "Failed to load dashboard data.",

  CARDS: {
    LOW_STOCK: {
      TITLE: "Low Stock Items",
      ACTION_TEXT: "View Items",
    },
    EXCESS_STOCK: {
      TITLE: "Excess Stock",
      ACTION_TEXT: "View Items",
    },
    EXPIRED_STOCK: {
      TITLE: "Expired Stock",
      ACTION_TEXT: "View Items",
    },
    LATEST_BATCH: {
      TITLE: "Latest Batch Received",
      DEFAULT: "N/A",
    },
    RETURN_PERCENT: {
      TITLE: "Total Returns",
    },
    ACTIVE_SALES_DAYS: {
      TITLE: "Days With Active Sales (MTD)",
      SUFFIX: "Days",
    },
  },

  TABLE: {
    EMPTY: "No items found",
    HEADERS: {
      ID: "ID",
      NAME: "Name",
      BATCH_NO: "Batch No",
      QUANTITY: "Units",
      MIN_QTY: "Min units",
      MAX_QTY: "Max units",
      EXPIRY: "Expiry",
      ACTIVITY_DATE: "Activity Date",
      DAYS_PAST: "No Days Past",
    },
    DATE_DEFAULT: "N/A",
  },
};