/**
 * Shared presentational building blocks for the five admin reports.
 * Reuses the Daily Sales Report visual language (Reports.tsx /
 * DetailedSalesTable.tsx): #5C17E5 purple, Lexend font, 16px card radius, soft
 * shadows, the metric-card / section-header look, the tab/toggle switcher, and
 * the ReusableTable styling wrapper.
 */
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { Dayjs } from 'dayjs';
import DateRangeFilter from '../mainDashboard/DateRangeFilter/DateRangeFilter';
import { StandardButton } from '../Common';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';

const FONT = C.FONT_FAMILY;

// ---- Back link (to the reports landing page) -------------------------------

export const BackLink: React.FC<{ onClick: () => void; label?: string }> = ({
  onClick,
  label = 'Back to Reports',
}) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      cursor: 'pointer',
      color: C.COLORS.PURPLE,
      mb: 2,
      '&:hover': { opacity: 0.8 },
    }}
  >
    <KeyboardArrowLeftIcon sx={{ fontSize: 22 }} />
    <span style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 500 }}>{label}</span>
  </Box>
);

// ---- Page header (title + subtitle) ---------------------------------------

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  /** When omitted, the download button is not rendered (e.g. on overview tabs). */
  onDownloadCsv?: () => void;
  downloadLabel: string;
  downloadDisabled?: boolean;
  /** Optional extra controls rendered between the date filter and the CSV button. */
  children?: React.ReactNode;
  dateRange: [Dayjs | null, Dayjs | null];
  onDateRangeChange: (range: [Dayjs | null, Dayjs | null]) => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  subtitle,
  onDownloadCsv,
  downloadLabel,
  downloadDisabled,
  children,
  dateRange,
  onDateRangeChange,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      mb: 3,
      flexWrap: 'wrap',
      gap: 2,
    }}
  >
    <Box>
      <Typography
        variant={C.HEADER.TITLE_VARIANT}
        fontWeight={C.HEADER.TITLE_FONT_WEIGHT}
        sx={{ fontFamily: FONT, color: C.HEADER.TITLE_COLOR }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontFamily: FONT,
          color: C.HEADER.SUBTITLE_COLOR,
          fontSize: C.HEADER.SUBTITLE_FONT_SIZE,
          mt: 0.5,
          maxWidth: 640,
        }}
      >
        {subtitle}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
      {children}
      <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
      {onDownloadCsv && (
        <StandardButton
          variant="primary"
          size="medium"
          startIcon={<DownloadIcon />}
          onClick={onDownloadCsv}
          disabled={downloadDisabled}
          sx={{ whiteSpace: 'nowrap', mb: '1px' }}
        >
          {downloadLabel}
        </StandardButton>
      )}
    </Box>
  </Box>
);

// ---- Metric / KPI card -----------------------------------------------------

interface MetricCardProps {
  title: string;
  value: string | number;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, accentColor }) => {
  const display = String(value);
  return (
    <Card
      sx={{
        p: C.CARD.PADDING,
        borderRadius: C.CARD.BORDER_RADIUS,
        boxShadow: C.CARD.BOX_SHADOW,
        border: C.CARD.BORDER,
        backgroundColor: C.CARD.BACKGROUND,
        height: '100%',
      }}
    >
      <Typography
        sx={{
          fontSize: C.CARD.TITLE.FONT_SIZE,
          fontWeight: C.CARD.TITLE.FONT_WEIGHT,
          color: C.CARD.TITLE.COLOR,
          mb: 1,
          fontFamily: FONT,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          // Long values shrink a step and wrap instead of clipping at the tile edge.
          fontSize:
            display.length > C.CARD.VALUE.LONG_THRESHOLD
              ? C.CARD.VALUE.FONT_SIZE_LONG
              : C.CARD.VALUE.FONT_SIZE,
          overflowWrap: 'anywhere',
          fontWeight: C.CARD.VALUE.FONT_WEIGHT,
          color: accentColor || C.CARD.VALUE.COLOR,
          fontFamily: FONT,
        }}
      >
        {display}
      </Typography>
    </Card>
  );
};

// ---- Section title ---------------------------------------------------------

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontSize: C.SECTION_TITLE.FONT_SIZE,
      fontWeight: C.SECTION_TITLE.FONT_WEIGHT,
      color: C.SECTION_TITLE.COLOR,
      mb: 2,
      fontFamily: FONT,
    }}
  >
    {children}
  </Typography>
);

// ---- Tab / toggle switcher (Reports.tsx tab buttons) -----------------------

interface SwitcherOption<T extends string> {
  value: T;
  label: string;
}

interface SwitcherProps<T extends string> {
  options: SwitcherOption<T>[];
  active: T;
  onChange: (value: T) => void;
}

export function ReportSwitcher<T extends string>({ options, active, onChange }: SwitcherProps<T>) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
      {options.map((opt) => {
        const isActive = opt.value === active;
        return (
          <Button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              backgroundColor: isActive ? C.TAB.ACTIVE_BG : 'transparent',
              color: isActive ? C.TAB.ACTIVE_COLOR : C.TAB.INACTIVE_COLOR,
              border: isActive ? 'none' : C.TAB.INACTIVE_BORDER,
              borderRadius: C.TAB.BORDER_RADIUS,
              textTransform: 'none',
              fontWeight: C.TAB.FONT_WEIGHT,
              fontSize: C.TAB.FONT_SIZE,
              fontFamily: FONT,
              padding: C.TAB.PADDING,
              minWidth: C.TAB.MIN_WIDTH,
              '&:hover': {
                backgroundColor: isActive ? C.TAB.ACTIVE_BG_HOVER : 'transparent',
              },
            }}
          >
            {opt.label}
          </Button>
        );
      })}
    </Box>
  );
}

// ---- Loading / error / empty states ---------------------------------------

export const ReportLoading: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
    <CircularProgress size={40} />
  </Box>
);

export const ReportError: React.FC<{ message: string; retryLabel: string; onRetry: () => void }> = ({
  message,
  retryLabel,
  onRetry,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <Typography color="error" sx={{ fontFamily: FONT }}>
      {message}
    </Typography>
    <StandardButton variant="primary" onClick={onRetry}>
      {retryLabel}
    </StandardButton>
  </Box>
);

export const ReportEmpty: React.FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      border: `1px dashed ${C.COLORS.BORDER}`,
      borderRadius: C.CARD.BORDER_RADIUS,
      backgroundColor: C.CARD.BACKGROUND,
    }}
  >
    <Typography sx={{ fontFamily: FONT, color: C.COLORS.TEXT_MUTED, fontSize: '14px' }}>
      {message}
    </Typography>
  </Box>
);

// ---- Labelled select filter (supplier / product / patient type) -----------

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  width?: number;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  options,
  onChange,
  width = 200,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <Typography sx={{ fontFamily: FONT, fontWeight: 500, color: C.COLORS.TEXT_MUTED, fontSize: '12px' }}>
      {label}
    </Typography>
    <FormControl size="small">
      <Select
        value={value}
        // The "all" sentinel is value='' — without displayEmpty MUI renders the
        // closed control BLANK instead of the empty-value option's label.
        displayEmpty
        onChange={(e: SelectChangeEvent) => onChange(e.target.value)}
        sx={{
          width,
          height: 40,
          borderRadius: '8px',
          backgroundColor: C.COLORS.WHITE,
          fontFamily: FONT,
          fontSize: '14px',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D7DFEA' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#728197' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.COLORS.PURPLE },
        }}
        MenuProps={{ PaperProps: { sx: { maxHeight: 320, fontFamily: FONT } } }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: FONT, fontSize: '14px' }}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
);

// ---- Pie legend (below-the-chart, shared by every report pie) --------------

export interface PieLegendItem {
  id: number;
  label: string;
  color: string;
  /** Pre-formatted display value (₹ amount or percentage). */
  value: string;
}

export const PieLegend: React.FC<{ items: PieLegendItem[] }> = ({ items }) => (
  <Box sx={{ width: '100%' }}>
    {items.map((m) => (
      <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: m.color }} />
          <Typography sx={{ fontFamily: FONT, fontSize: '14px', color: C.COLORS.TEXT_SECONDARY, fontWeight: 500 }}>
            {m.label}
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: FONT, fontSize: '14px', color: C.COLORS.TEXT_PRIMARY, fontWeight: 600 }}>
          {m.value}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ---- Grid of metric cards from a list of stats -----------------------------

export const MetricCardGrid: React.FC<{ cards: { title: string; value: string; accentColor?: string }[] }> = ({
  cards,
}) => (
  <Grid container spacing={2} sx={{ mb: 3 }}>
    {cards.map((c) => (
      <Grid item xs={6} sm={4} md={2.4} key={c.title}>
        <MetricCard title={c.title} value={c.value} accentColor={c.accentColor} />
      </Grid>
    ))}
  </Grid>
);

// ---- Cell text (table body, matches DetailedSalesTable) --------------------

export const CellText: React.FC<{ children: React.ReactNode; color?: string; weight?: number }> = ({
  children,
  color = C.TABLE.CELL_COLOR,
  weight,
}) => (
  <Typography sx={{ fontFamily: FONT, fontSize: C.TABLE.CELL_FONT_SIZE, color, fontWeight: weight }}>
    {children}
  </Typography>
);

// ---- ReusableTable styling wrapper (DetailedSalesTable look) ---------------

export const TableShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      marginTop: 1,
      overflowX: 'auto',
      backgroundColor: C.COLORS.WHITE,
      borderRadius: '12px',
      fontFamily: FONT,
      padding: 0,
      '& .MuiTableContainer-root': { boxShadow: 'none' },
    }}
  >
    {children}
  </Box>
);
