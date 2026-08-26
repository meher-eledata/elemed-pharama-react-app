import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Chip, CircularProgress, Typography } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { StandardButton } from '../../components/Common';
import {
  COMPLIANCE_CARD_SX,
  COMPLIANCE_CHIP_BASE_SX,
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_STATE_CHIP,
  complianceDocumentsRoute,
} from '../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../config/label/Compliance.labels';
import {
  useGetComplianceCalendarQuery,
  useGetComplianceDocumentTypesQuery,
  type ComplianceCalendarItem,
} from '../../redux/slices/complianceApi';
import ComplianceNav, { complianceBasePath } from './components/ComplianceNav';
import {
  calendarItemTitle,
  calendarStateChipKey,
  calendarStateLabel,
  formatApiDate,
  groupByValidTo,
} from './compliance.utils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

type DayProps = PickersDayProps & {
  eventsByDate?: Map<string, ComplianceCalendarItem[]>;
};

// Day cell with one severity dot per event (capped at three) on that date.
const ComplianceDay: React.FC<DayProps> = ({ eventsByDate, ...dayProps }) => {
  const day = dayProps.day as Dayjs;
  const events = dayProps.outsideCurrentMonth
    ? []
    : (eventsByDate?.get(day.format(C.API_DATE_FORMAT)) ?? []);
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <PickersDay {...dayProps} />
      {events.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '2px',
            left: 0,
            right: 0,
            display: 'flex',
            gap: '2px',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {events.slice(0, 3).map((event, index) => (
            <Box
              key={`${event.document_id ?? event.document_type_id}-${index}`}
              sx={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: COMPLIANCE_STATE_CHIP[calendarStateChipKey(event)].color,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

interface RowProps {
  item: ComplianceCalendarItem;
  onOpen: (item: ComplianceCalendarItem) => void;
}

const CalendarRow: React.FC<RowProps> = ({ item, onOpen }) => {
  const chip = COMPLIANCE_STATE_CHIP[calendarStateChipKey(item)];
  // Two shapes share the `missing` list: a type-only MISSING row (no document at
  // all) starts the CREATE flow, while a NO_VERSION row is a real document that
  // just has no file yet, so it goes straight to its UPLOAD action.
  const isTypeOnly = item.document_id === null;
  const actionLabel = isTypeOnly
    ? L.CALENDAR.FILE_IT
    : item.state === 'NO_VERSION'
      ? L.ACTIONS.FILE_FIRST_VERSION
      : L.CALENDAR.OPEN_DOCUMENT;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        py: 1.25,
        borderTop: '1px solid #F3F4F6',
      }}
    >
      <Box
        sx={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: chip.color,
          flexShrink: 0,
        }}
      />
      <Box sx={{ flex: 1, minWidth: '180px' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}>
          {calendarItemTitle(item)}
        </Typography>
        <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT }}>
          {[item.type_name, item.category, item.reference_number].filter(Boolean).join(' · ')}
        </Typography>
      </Box>
      {item.valid_to && (
        <Typography sx={{ fontSize: '13px', color: '#374151', fontFamily: C.FONT }}>
          {formatApiDate(item.valid_to)}
        </Typography>
      )}
      <Chip
        label={calendarStateLabel(item)}
        size="small"
        sx={{ ...COMPLIANCE_CHIP_BASE_SX, backgroundColor: chip.background, color: chip.color }}
      />
      <StandardButton variant="text" size="small" onClick={() => onOpen(item)}>
        {actionLabel}
      </StandardButton>
    </Box>
  );
};

interface SectionProps {
  title: string;
  emptyText: string;
  items: ComplianceCalendarItem[];
  onOpen: (item: ComplianceCalendarItem) => void;
  accent?: string;
}

const AgendaSection: React.FC<SectionProps> = ({
  title,
  emptyText,
  items,
  onOpen,
  accent = '#1A212B',
}) => (
  <Box sx={{ ...COMPLIANCE_CARD_SX, p: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ fontSize: '16px', fontWeight: 600, color: accent, fontFamily: C.FONT }}>
        {title}
      </Typography>
      <Chip
        label={items.length}
        size="small"
        sx={{ ...COMPLIANCE_CHIP_BASE_SX, backgroundColor: '#F3F4F6', color: '#4B5563' }}
      />
    </Box>
    {items.length === 0 ? (
      <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT, mt: 1.5 }}>
        {emptyText}
      </Typography>
    ) : (
      <Box sx={{ mt: 1 }}>
        {items.map((item, index) => (
          <CalendarRow
            key={`${item.document_id ?? `type-${item.document_type_id}`}-${index}`}
            item={item}
            onOpen={onOpen}
          />
        ))}
      </Box>
    )}
  </Box>
);

const ComplianceCalendar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = complianceBasePath(location.pathname);

  const settingsPath =
    base === C.ADMIN_ROUTE_BASE ? `${C.ADMIN_ROUTE_BASE}/${C.SETTINGS_PATH}` : null;

  const [month, setMonth] = useState<Dayjs>(dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  // The window follows the month on screen; already-expired rows come back
  // regardless of `from`, so a lapsed licence is never hidden by it.
  const { data, isFetching, isError } = useGetComplianceCalendarQuery({
    from: month.startOf('month').format(C.API_DATE_FORMAT),
    to: month.endOf('month').format(C.API_DATE_FORMAT),
  });

  // A pharmacy that has added no document types has nothing to track, which is a
  // setup step rather than the "all clear" the empty calendar would otherwise show.
  // Same cached query the Documents page uses.
  const { data: types } = useGetComplianceDocumentTypesQuery({ status: 'ACTIVE' });
  const hasNoTypes = Array.isArray(types) && types.length === 0;

  // Server order is meaningful (expired first, most overdue first, then valid_to)
  // — split by state without re-sorting.
  const overdue = useMemo(
    () => (data?.items ?? []).filter((item) => item.state === 'EXPIRED'),
    [data],
  );
  const upcoming = useMemo(
    () => (data?.items ?? []).filter((item) => item.state !== 'EXPIRED'),
    [data],
  );
  // `missing` carries BOTH shapes: type-only rows (document_id null) and documents
  // that exist but have no file yet (state NO_VERSION, document_id set). It no
  // longer has a section of its own, but it still counts towards the "next action"
  // banner — an unfiled required licence is the loudest thing this page can say.
  // (`no_expiry` is fetched but deliberately not rendered here.)
  const missing = data?.missing ?? [];
  const eventsByDate = useMemo(() => groupByValidTo(data?.items ?? []), [data]);

  // Window length for the section heading — inclusive of both endpoints, matching
  // the backend (a document expiring exactly on `to` is inside the window).
  const windowDays = useMemo(() => {
    const from = dayjs(data?.from);
    const to = dayjs(data?.to);
    if (!data?.from || !data?.to || !from.isValid() || !to.isValid()) return null;
    return to.diff(from, 'day') + 1;
  }, [data]);

  const selectedKey = selectedDate?.format(C.API_DATE_FORMAT) ?? null;
  const selectedItems = selectedKey ? (eventsByDate.get(selectedKey) ?? []) : [];

  const openItem = (item: ComplianceCalendarItem) => {
    if (item.document_id === null) {
      // Nothing filed for the type at all — open the create-document flow on it.
      navigate(complianceDocumentsRoute(base), {
        state: { complianceDocumentTypeId: item.document_type_id },
      });
      return;
    }
    navigate(complianceDocumentsRoute(base), {
      state:
        item.state === 'NO_VERSION'
          ? { complianceUploadDocumentId: item.document_id }
          : { complianceDocumentId: item.document_id },
    });
  };

  const actionCount = overdue.length + missing.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxWidth: '1100px' }}>
      <Box>
        <Typography sx={{ fontSize: '32px', color: '#1A212B', fontFamily: C.FONT, fontWeight: 600 }}>
          {L.CALENDAR.TITLE}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: '#6B7280', fontFamily: C.FONT }}>
          {L.CALENDAR.SUBTITLE}
        </Typography>
      </Box>

      <ComplianceNav />

      {isError && <Alert severity="error">{L.CALENDAR.LOAD_ERROR}</Alert>}

      {/* What needs doing next, before any scrolling or thinking. */}
      {!isError && hasNoTypes && (
        <Alert
          severity="info"
          sx={{ fontFamily: C.FONT }}
          action={
            settingsPath ? (
              <StandardButton
                variant="outline"
                size="small"
                onClick={() => navigate(settingsPath)}
              >
                {L.EMPTY.SET_UP_TYPES}
              </StandardButton>
            ) : undefined
          }
        >
          {L.CALENDAR.NO_TYPES}
        </Alert>
      )}
      {!isError && !hasNoTypes && (
        <Alert severity={actionCount > 0 ? 'warning' : 'success'} sx={{ fontFamily: C.FONT }}>
          {actionCount === 0
            ? L.CALENDAR.ALL_CLEAR
            : `${L.CALENDAR.NEXT_ACTION}: ${calendarItemTitle(
                overdue[0] ?? missing[0],
              )} — ${calendarStateLabel(overdue[0] ?? missing[0])}`}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box sx={{ ...COMPLIANCE_CARD_SX, p: 1, position: 'relative' }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DateCalendar
              value={selectedDate}
              referenceDate={month}
              onChange={(value: Dayjs | null) => setSelectedDate(value)}
              onMonthChange={(value: Dayjs) => {
                setMonth(value.startOf('month'));
                setSelectedDate(null);
              }}
              slots={{ day: ComplianceDay }}
              // The day slot's extra prop is not modelled by the picker's slotProps
              // typing, so it is passed through with an explicit cast.
              slotProps={{ day: { eventsByDate } as Partial<DayProps> }}
              sx={{
                '& .MuiPickersDay-root.Mui-selected': { backgroundColor: C.ACCENT },
                '& .MuiPickersDay-root.Mui-selected:hover': { backgroundColor: C.ACCENT },
                '& .MuiPickersCalendarHeader-label': { fontFamily: C.FONT, fontWeight: 600 },
              }}
            />
          </LocalizationProvider>
          {isFetching && (
            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
              <CircularProgress size={18} />
            </Box>
          )}
          {data && (
            <Typography
              sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT, px: 1.5, pb: 1 }}
            >
              {L.CALENDAR.windowLabel(formatApiDate(data.from), formatApiDate(data.to))}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: '340px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedDate && (
            <Box sx={{ ...COMPLIANCE_CARD_SX, p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  sx={{ fontSize: '16px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}
                >
                  {L.CALENDAR.ON_DATE(selectedDate.format(C.DISPLAY_DATE_FORMAT))}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <StandardButton variant="text" size="small" onClick={() => setSelectedDate(null)}>
                  {L.CALENDAR.CLEAR_DATE}
                </StandardButton>
              </Box>
              {selectedItems.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT, mt: 1 }}>
                  {L.CALENDAR.NOTHING_DUE}
                </Typography>
              ) : (
                <Box sx={{ mt: 1 }}>
                  {selectedItems.map((item, index) => (
                    <CalendarRow key={`${item.document_id}-${index}`} item={item} onOpen={openItem} />
                  ))}
                </Box>
              )}
            </Box>
          )}

          <AgendaSection
            title={L.CALENDAR.OVERDUE}
            emptyText={L.CALENDAR.NOTHING_OVERDUE}
            items={overdue}
            onOpen={openItem}
            accent={COMPLIANCE_STATE_CHIP.EXPIRED.color}
          />
          <AgendaSection
            title={L.CALENDAR.UPCOMING(windowDays)}
            emptyText={L.CALENDAR.NOTHING_DUE}
            items={upcoming}
            onOpen={openItem}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ComplianceCalendar;
