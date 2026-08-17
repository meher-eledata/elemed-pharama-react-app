import type { NotificationItem } from '../../redux/slices/notificationsApi';

export const NOTIFICATION_CONSTANTS = {
  LIST_LIMIT: 50, // server default + "load more" step; must be an integer 1..200
  LIST_LIMIT_MAX: 200, // server bound — a larger `limit` is a 400
  MENU_WIDTH: 380,
  // +80 over the original 480: that is what the sticky filter chips cost, so the
  // panel still shows the same number of rows.
  // This is a CEILING ONLY — it must always be combined with the viewport-relative
  // cap below. MUI's Popover does NOT clamp an over-tall paper to the viewport: when
  // the paper's bottom overflows it SHIFTS the paper up (`top -= diff`) without
  // re-checking the top edge, so a fixed 560 pushed the header off-screen at
  // viewport heights under ~568px (top=-68 at 500px).
  MENU_MAX_HEIGHT: 560,
  // Vertical space the panel can never occupy: the bell anchor (~40px from the
  // viewport top), the paper's `mt: 1` (8px) and MUI's 16px viewport margin, plus
  // slack. Keeping the paper's own height within `100vh - this` means MUI never
  // needs to shift it, so it stays anchored and scrolls internally instead.
  MENU_VIEWPORT_RESERVE: 72,
  // The title carries the actionable part (product + what's wrong) and gets the
  // same two-line clamp as the body. It is a clamp only, NOT a reserved height:
  // reserving both lines left a blank line under every short title without ever
  // making rows equal height (the body/type lines vary too).
  TITLE_LINE_CLAMP: 2,
  BODY_LINE_CLAMP: 2,
  SKELETON_ROWS: 3,
  SKELETON_ROW_HEIGHT: 64,
} as const;

// Bounded by the viewport at every height: `min()` keeps 560 as the ceiling on
// tall screens and hands over to the viewport-relative value on short ones.
export const notificationMenuMaxHeight = `min(${NOTIFICATION_CONSTANTS.MENU_MAX_HEIGHT}px, calc(100vh - ${NOTIFICATION_CONSTANTS.MENU_VIEWPORT_RESERVE}px))`;

// Brand purple, duplicated here rather than read from the theme:
// src/components/Theme/Theme.tsx sets no `palette`, so MUI's `primary` is still
// the default blue everywhere. Adding the palette globally would recolour every
// default-styled MUI control app-wide, which is not something to bundle with a
// layout fix — so the panel matches the brand locally, like the other modules
// that hardcode #5C17E5 in their own constants files.
export const NOTIFICATION_ACCENT = {
  MAIN: '#5C17E5',
  HOVER: '#4A12B8',
} as const;

export const notificationChipSx = (selected: boolean) =>
  selected
    ? {
        bgcolor: NOTIFICATION_ACCENT.MAIN,
        color: '#fff',
        '&:hover': { bgcolor: NOTIFICATION_ACCENT.HOVER },
      }
    : undefined;

export interface NotificationTypeFilter {
  type: string;
  count: number; // unread, per the server summary
}

// Chip set for the panel's type filter. Derived ONLY from the server's
// zero-filled `byType` (a registry-driven map that gains a key whenever a new
// module/type ships, with no DDL) unioned with whatever types the loaded page
// actually contains — never a hardcoded list, so a fifth type is reachable the
// day the backend starts emitting it.
// Zero-count types are KEPT: `byType` counts unread only, so after "mark all
// read" every count is 0 while the rows are still listed, and dropping the chips
// would make those rows unreachable again.
export const notificationTypeFilters = (
  byType: Record<string, number> | undefined,
  notifications: NotificationItem[],
): NotificationTypeFilter[] => {
  const counts = new Map<string, number>(Object.entries(byType ?? {}));
  notifications.forEach((notification) => {
    if (!counts.has(notification.type)) counts.set(notification.type, 0);
  });
  return Array.from(counts, ([type, count]) => ({ type, count }));
};

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
