import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Chip,
  Skeleton,
  Tooltip,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { useLogoutMutation } from "../../redux/slices/activityApi";
import {
  useGetNotificationsQuery,
  useGetNotificationSummaryQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDismissNotificationMutation,
  type NotificationItem,
} from "../../redux/slices/notificationsApi";
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { getInitials } from "../../config/helpers/initials";
import {
  NOTIFICATION_LABELS,
  notificationSeverityColor,
  notificationTypeLabel,
} from "../../config/label/Notifications.labels";
import {
  NOTIFICATION_CONSTANTS,
  getNotificationRoute,
  notificationTypeFilters,
} from "../../config/constants/Notifications.constants";
import { extractErrorMessage } from "../../utils/errorUtils";

import "./TopBar.scss";

// Type -> glyph. Purely presentational (the backend stores no icons); an
// unknown type falls back to the generic bell.
const NOTIFICATION_ICONS: Record<string, typeof NotificationsNoneOutlinedIcon> = {
  EXPIRED: EventBusyOutlinedIcon,
  NEAR_EXPIRY: HourglassBottomOutlinedIcon,
  LOW_STOCK: TrendingDownOutlinedIcon,
  EXCESS_STOCK: TrendingUpOutlinedIcon,
};

interface TopBarProps {
  name?: string;
  initials?: string;
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ name: propName, initials, onToggleSidebar }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [alertsAnchorEl, setAlertsAnchorEl] = React.useState<null | HTMLElement>(null);
  const alertsOpen = Boolean(alertsAnchorEl);
  const [notificationsError, setNotificationsError] = React.useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutRequest] = useLogoutMutation();

  // Notification centre. BOTH GETs regenerate the org's notifications as a side
  // effect (skipped only while the last run is fresher than ~5 min), so neither
  // is polled: the summary loads once for the badge, the list is fetched the
  // first time the bell is opened, and both refresh on open + whenever a
  // read/dismiss mutation invalidates the 'Notification' tag.
  const { data: summary } = useGetNotificationSummaryQuery();
  const [listRequested, setListRequested] = React.useState(false);
  // The server sorts by severity rank, so a single unfiltered page of 50 is all
  // CRITICAL/HIGH and the lower-severity types are unreachable. The panel
  // therefore drives the list with a `type` filter (chips) and a growable
  // `limit` ("load more"), both server-side params — one request per user
  // action, never a fan-out (each GET regenerates the org's notifications).
  const [typeFilter, setTypeFilter] = React.useState<string | null>(null);
  const [limit, setLimit] = React.useState<number>(NOTIFICATION_CONSTANTS.LIST_LIMIT);
  const {
    data: notificationsData,
    isFetching: notificationsFetching,
    error: notificationsFetchError,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(
    { limit, type: typeFilter ?? undefined },
    { skip: !listRequested },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [dismissNotification] = useDismissNotificationMutation();

  // Badge comes from the server's unreadCount — it counts ACTIVE + unread +
  // not-dismissed rows and must never be re-derived from the returned page.
  const unreadCount = summary?.unreadCount ?? 0;
  const notifications = notificationsData?.notifications ?? [];
  // Chips come from the server's registry-driven byType, so a new type shows up
  // without a frontend change.
  const typeFilters = notificationTypeFilters(summary?.byType, notifications);
  // The header must describe what is on screen: with a chip active it counts
  // that type only, so "N unread" can never contradict the visible rows.
  const visibleUnread = typeFilter ? (summary?.byType?.[typeFilter] ?? 0) : unreadCount;
  // The page is full, so more rows exist behind the current limit.
  const canLoadMore =
    notifications.length >= limit && limit < NOTIFICATION_CONSTANTS.LIST_LIMIT_MAX;
  const listCapped =
    notifications.length >= NOTIFICATION_CONSTANTS.LIST_LIMIT_MAX;
  // First open only: no data yet, so reserve the row height instead of
  // collapsing the menu to the header.
  const notificationsLoading = notificationsFetching && !notificationsData;
  const errorMessage =
    notificationsError ??
    (notificationsFetchError
      ? extractErrorMessage(notificationsFetchError, NOTIFICATION_LABELS.ERROR_DEFAULT)
      : null);
  // The panel's three exclusive states. A failed list fetch must NEVER fall
  // through to the empty state: "You're all caught up" next to "6 unread" tells
  // the user the opposite of the truth. A failed *mutation* (with rows on
  // screen) keeps its compact inline strip instead.
  const listFailed = Boolean(notificationsFetchError) && !notificationsLoading;
  const showListError = listFailed && notifications.length === 0;
  const showEmpty = !notificationsLoading && !listFailed && notifications.length === 0;
  // Hide the chips only on a genuinely empty, unfiltered bell — with a filter on
  // they are the way back to "All".
  const showFilters = !showListError && (!showEmpty || typeFilter !== null);

  // Get user info from Redux store
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Use Redux user name if available, otherwise use prop
  const displayName = isAuthenticated && user
    ? `${user.first_name} ${user.last_name}`
    : (propName || 'Guest');

  // Determine whether the current user is an admin (matches loginHandlers / RoleGuard)
  const userRole = user?.role;
  const isAdmin =
    userRole === 0 ||
    userRole === '0' ||
    String(userRole).toLowerCase() === 'admin';

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAlertsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAlertsAnchorEl(event.currentTarget);
    setNotificationsError(null);
    // The very first open subscribes the list query (which fetches); later opens
    // pull a fresh page so read state — which the server can legitimately reset
    // — is never served stale from cache.
    if (listRequested) {
      refetchNotifications();
    } else {
      setListRequested(true);
    }
  };

  const handleAlertsClose = () => {
    setAlertsAnchorEl(null);
  };

  // Switching filter always restarts at one page — a filter is a new list, not a
  // continuation of the one that was loaded more of.
  const handleFilterSelect = (type: string | null) => {
    if (type === typeFilter) return;
    setNotificationsError(null);
    setTypeFilter(type);
    setLimit(NOTIFICATION_CONSTANTS.LIST_LIMIT);
  };

  // The API has no offset, so "more" is a bigger `limit` on the same query.
  const handleLoadMore = () => {
    setLimit((current) =>
      Math.min(
        current + NOTIFICATION_CONSTANTS.LIST_LIMIT,
        NOTIFICATION_CONSTANTS.LIST_LIMIT_MAX,
      ),
    );
  };

  // Clicking a row always marks it read; it navigates only for a type this
  // frontend knows how to route (an unknown type still renders, just inert).
  const handleNotificationClick = async (notification: NotificationItem) => {
    const route = getNotificationRoute(notification);
    if (route) {
      setAlertsAnchorEl(null);
      navigate(route.path, { state: route.state });
    }
    if (notification.read_at) return;
    setNotificationsError(null);
    try {
      await markRead(notification.id).unwrap();
    } catch (error) {
      setNotificationsError(extractErrorMessage(error, NOTIFICATION_LABELS.ERROR_DEFAULT));
    }
  };

  const handleDismiss = async (
    event: React.MouseEvent<HTMLElement>,
    id: number,
  ) => {
    // Keep the menu open — dismissing is a list edit, not a navigation.
    event.stopPropagation();
    setNotificationsError(null);
    try {
      await dismissNotification(id).unwrap();
    } catch (error) {
      setNotificationsError(extractErrorMessage(error, NOTIFICATION_LABELS.ERROR_DEFAULT));
    }
  };

  // Scoped to the active chip so the action matches the count next to it.
  const handleMarkAllRead = async () => {
    setNotificationsError(null);
    try {
      await markAllRead(typeFilter ? { type: typeFilter } : undefined).unwrap();
    } catch (error) {
      setNotificationsError(extractErrorMessage(error, NOTIFICATION_LABELS.ERROR_DEFAULT));
    }
  };

  const handleAdminAccess = () => {
    handleClose();
    // Return an admin to their admin dashboard
    navigate('/admin');
  };

  const handleLogout = async () => {
    handleClose();
    // Tell the server to log the Logout event while the token is still valid.
    // Never block logout on a failed/slow call — always clear the token + navigate.
    try {
      await logoutRequest().unwrap();
    } catch {
      // ignore — proceed to clear auth regardless of success/failure
    }
    // Clear auth state from Redux and localStorage
    dispatch(logout());
    // Redirect to login page
    navigate('/');
  };

  return (
    <Box className="topbar-container">
      <Box className="left-controls" sx={{ display: 'flex', alignItems: 'center' }}>
      </Box>
      <Box className="right-controls" sx={{ marginLeft: "auto" }}>
        <IconButton
          className="notification-icon-button"
          aria-label={NOTIFICATION_LABELS.ARIA_LABEL}
          aria-controls={alertsOpen ? "notifications-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={alertsOpen ? "true" : undefined}
          onClick={handleAlertsOpen}
        >
          {/* Capped at 9 (so never wider than "9+") and anchored to the icon's
              rectangular corner rather than a circular overlap — a "99+" badge
              overlapping circularly covered all but a sliver of the bell. */}
          <Badge badgeContent={unreadCount} color="error" max={9}>
            <NotificationsNoneOutlinedIcon className="notification-icon" />
          </Badge>
        </IconButton>
        <Menu
          id="notifications-menu"
          anchorEl={alertsAnchorEl}
          open={alertsOpen}
          onClose={handleAlertsClose}
          MenuListProps={{ "aria-labelledby": "notifications-menu", sx: { py: 0 } }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                width: NOTIFICATION_CONSTANTS.MENU_WIDTH,
                maxWidth: '100%',
                maxHeight: NOTIFICATION_CONSTANTS.MENU_MAX_HEIGHT,
                mt: 1,
              },
            },
          }}
        >
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              px: 2,
              py: 1.25,
              bgcolor: 'background.paper',
              // Border lives on the sticky header (not a separate Divider) so
              // rows scrolling underneath always stay visually separated.
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                  {NOTIFICATION_LABELS.TITLE}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>
                  {visibleUnread > 0
                    ? NOTIFICATION_LABELS.unread(visibleUnread)
                    : NOTIFICATION_LABELS.ALL_READ}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={handleMarkAllRead}
                disabled={visibleUnread === 0}
                sx={{ ml: 'auto', flexShrink: 0, textTransform: 'none', fontSize: 13 }}
              >
                {NOTIFICATION_LABELS.MARK_ALL_READ}
              </Button>
            </Box>
            {showFilters ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip
                  size="small"
                  label={NOTIFICATION_LABELS.filterChip(
                    NOTIFICATION_LABELS.FILTER_ALL,
                    unreadCount,
                  )}
                  aria-pressed={typeFilter === null}
                  color={typeFilter === null ? 'primary' : 'default'}
                  variant={typeFilter === null ? 'filled' : 'outlined'}
                  onClick={() => handleFilterSelect(null)}
                />
                {typeFilters.map(({ type, count }) => (
                  <Chip
                    key={type}
                    size="small"
                    label={NOTIFICATION_LABELS.filterChip(
                      notificationTypeLabel(type),
                      count,
                    )}
                    aria-pressed={typeFilter === type}
                    color={typeFilter === type ? 'primary' : 'default'}
                    variant={typeFilter === type ? 'filled' : 'outlined'}
                    onClick={() => handleFilterSelect(type)}
                  />
                ))}
              </Box>
            ) : null}
          </Box>
          {errorMessage && !showListError ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
              <Typography sx={{ fontSize: 12, color: 'error.main', flex: 1, minWidth: 0 }}>
                {errorMessage}
              </Typography>
              {listFailed ? (
                <Button
                  size="small"
                  onClick={() => refetchNotifications()}
                  sx={{ flexShrink: 0, textTransform: 'none', fontSize: 12 }}
                >
                  {NOTIFICATION_LABELS.RETRY}
                </Button>
              ) : null}
            </Box>
          ) : null}
          {notificationsLoading
            ? Array.from({ length: NOTIFICATION_CONSTANTS.SKELETON_ROWS }).map((_, index) => (
                <Box
                  key={`notification-skeleton-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.25,
                    px: 2,
                    py: 1.25,
                    height: NOTIFICATION_CONSTANTS.SKELETON_ROW_HEIGHT,
                    boxSizing: 'border-box',
                  }}
                >
                  <Skeleton variant="circular" width={20} height={20} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="35%" height={12} />
                    <Skeleton variant="text" width="80%" height={18} />
                  </Box>
                </Box>
              ))
            : null}
          {showListError || showEmpty ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                px: 3,
                py: 4,
                // Matches the loading block's footprint so the panel doesn't
                // resize when the fetch resolves.
                minHeight:
                  NOTIFICATION_CONSTANTS.SKELETON_ROWS *
                  NOTIFICATION_CONSTANTS.SKELETON_ROW_HEIGHT,
                textAlign: 'center',
              }}
            >
              {showListError ? (
                <>
                  <ErrorOutlineOutlinedIcon sx={{ fontSize: 28, color: 'error.main' }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'error.main' }}>
                    {errorMessage}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => refetchNotifications()}
                    sx={{ mt: 0.5, textTransform: 'none', fontSize: 13 }}
                  >
                    {NOTIFICATION_LABELS.RETRY}
                  </Button>
                </>
              ) : (
                <>
                  <NotificationsNoneOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {NOTIFICATION_LABELS.EMPTY}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {NOTIFICATION_LABELS.EMPTY_HINT}
                  </Typography>
                </>
              )}
            </Box>
          ) : null}
          {notifications.map((notification) => {
            // Unknown types keep rendering (the server registry grows without a
            // schema change) — generic glyph, neutral colour, no deep link.
            const TypeIcon =
              NOTIFICATION_ICONS[notification.type] ?? NotificationsNoneOutlinedIcon;
            const severityColor = notificationSeverityColor(notification.severity);
            const isUnread = !notification.read_at;
            return (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.25,
                  // 13px + the 3px severity rail = the header's 16px gutter, so
                  // icons and text stay aligned with the panel title.
                  pl: '13px',
                  pr: 2,
                  py: 1.25,
                  whiteSpace: 'normal',
                  borderLeft: '3px solid',
                  borderLeftColor: isUnread ? severityColor : 'transparent',
                  bgcolor: isUnread ? 'action.hover' : 'transparent',
                  // Unread rows already carry the hover tint, so give every row a
                  // stronger hover state that is actually visible on both.
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <TypeIcon
                  sx={{ fontSize: 20, mt: '2px', flexShrink: 0, color: severityColor }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      lineHeight: 1.4,
                      color: severityColor,
                      // A read row de-emphasises everything else (rail, tint,
                      // title), so keep the severity hue but fade it too.
                      opacity: isUnread ? 1 : 0.6,
                    }}
                  >
                    {notificationTypeLabel(notification.type)}
                  </Typography>
                  <Typography
                    title={notification.title}
                    sx={{
                      fontSize: 14,
                      fontWeight: isUnread ? 600 : 400,
                      lineHeight: 1.4,
                      color: isUnread ? 'text.primary' : 'text.secondary',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: NOTIFICATION_CONSTANTS.TITLE_LINE_CLAMP,
                      overflow: 'hidden',
                    }}
                  >
                    {notification.title}
                  </Typography>
                  {notification.body ? (
                    <Typography
                      sx={{
                        fontSize: 12,
                        lineHeight: 1.45,
                        color: 'text.secondary',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: NOTIFICATION_CONSTANTS.BODY_LINE_CLAMP,
                        overflow: 'hidden',
                      }}
                    >
                      {notification.body}
                    </Typography>
                  ) : null}
                </Box>
                <Tooltip title={NOTIFICATION_LABELS.DISMISS}>
                  <IconButton
                    size="small"
                    aria-label={`${NOTIFICATION_LABELS.DISMISS}: ${notification.title}`}
                    onClick={(event) => handleDismiss(event, notification.id)}
                    sx={{
                      mt: '-2px',
                      flexShrink: 0,
                      color: 'text.disabled',
                      '&:hover': { color: 'text.primary' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </MenuItem>
            );
          })}
          {canLoadMore || listCapped ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 1 }}>
              {canLoadMore ? (
                <Button
                  size="small"
                  onClick={handleLoadMore}
                  disabled={notificationsFetching}
                  sx={{ textTransform: 'none', fontSize: 13 }}
                >
                  {NOTIFICATION_LABELS.LOAD_MORE}
                </Button>
              ) : (
                // The server caps `limit` at 200; past that the type chips are
                // the only way through the rest, so say so rather than let the
                // header count silently outrun the rows.
                <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center' }}>
                  {NOTIFICATION_LABELS.listCapped(NOTIFICATION_CONSTANTS.LIST_LIMIT_MAX)}
                </Typography>
              )}
            </Box>
          ) : null}
        </Menu>

        <Box
          className="user-profile"
          id="user-button"
          role="button"
          aria-controls={open ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          sx={{ cursor: 'pointer' }}
        >
          <Avatar
            alt={displayName}
            className="user-avatar"
            sx={{
              backgroundColor: '#5C17E5',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              borderRadius: '50%', // Ensures perfect circle
              width: 40,
              height: 40
            }}
          >
            {initials || getInitials(displayName)}
          </Avatar>
          <Typography variant="body1" className="user-name">
            {displayName}
          </Typography>
          <IconButton
            size="small"
            className="dropdown-arrow-button"
            tabIndex={-1}
            disableRipple
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
        {/* Menu rendered as a sibling (not inside the clickable user-profile Box) so
            its portal click/backdrop events don't bubble back into handleClick and
            re-open the menu — this is what allows click-outside (and Escape) to close it. */}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "user-button",
          }}
        >
          {isAdmin && (
            <MenuItem onClick={handleAdminAccess}>Admin Access</MenuItem>
          )}
          <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
