import type { NotificationItem } from '../../redux/slices/notificationsApi';

export const NOTIFICATION_CONSTANTS = {
  LIST_LIMIT: 50, // server default; must be an integer 1..200
  MENU_WIDTH: 380,
  MENU_MAX_HEIGHT: 480,
  // The title carries the actionable part (product + what's wrong) and always
  // overflows one line at MENU_WIDTH, so it gets the same two-line clamp as the
  // body; the row reserves both lines so every row keeps the same rhythm.
  TITLE_LINE_CLAMP: 2,
  BODY_LINE_CLAMP: 2,
  SKELETON_ROWS: 3,
  SKELETON_ROW_HEIGHT: 64,
} as const;

export interface NotificationRoute {
  path: string;
  state: { tab: string; nearExpiryMonths?: number };
}

// Frontend-owned `type` -> deep link: the backend deliberately stores no routes,
// so a routing refactor is never contract drift. These targets are kept
// byte-identical to the dashboard cards in
// src/components/mainDashboard/InventoryMetrics/InventoryMetricsCard.tsx, and the
// state keys are what src/pages/Inventory/InventoryModule.tsx reads
// (`location.state.tab` / `location.state.nearExpiryMonths`).
export const getNotificationRoute = (
  notification: NotificationItem,
): NotificationRoute | null => {
  switch (notification.type) {
    case 'LOW_STOCK':
      return { path: '/inventory', state: { tab: 'low' } };
    case 'EXCESS_STOCK':
      return { path: '/inventory', state: { tab: 'excess' } };
    case 'EXPIRED':
      return { path: '/inventory', state: { tab: 'expired' } };
    case 'NEAR_EXPIRY':
      return {
        path: '/inventory',
        state: {
          tab: 'nearExpiry',
          nearExpiryMonths: notification.payload?.window === '1month' ? 1 : 3,
        },
      };
    default:
      // Unknown type (the registry grows without DDL) — render the row, but
      // don't guess a destination.
      return null;
  }
};
