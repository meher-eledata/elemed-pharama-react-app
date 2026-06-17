import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { BarChart } from '@mui/x-charts/BarChart';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import DateRangeFilter from '../../components/mainDashboard/DateRangeFilter/DateRangeFilter';
import { StandardButton } from '../../components/Common';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import {
  useGetSupplierOverviewQuery,
  toNum,
  SupplierOverviewRow,
} from '../../redux/slices/supplierReportsApi';
import { SUPPLIER_REPORTS_LABELS } from '../../config/label/SupplierReports.labels';
import {
  SUPPLIER_REPORTS_CONSTANTS as C,
  SUPPLIER_PAYMENT_STATUS_OPTIONS,
  SUPPLIER_PO_STATUS_OPTIONS,
} from '../../config/constants/SupplierReports.constants';

const L = SUPPLIER_REPORTS_LABELS.OVERVIEW;

const formatCurrency = (amount: number): string =>
  `${C.CURRENCY.SYMBOL}${amount.toLocaleString(C.CURRENCY.LOCALE, {
    minimumFractionDigits: C.CURRENCY.FRACTION_DIGITS,
    maximumFractionDigits: C.CURRENCY.FRACTION_DIGITS,
  })}`;

const formatDays = (value: number | null): string =>
  value === null ? SUPPLIER_REPORTS_LABELS.DETAIL.NOT_AVAILABLE : `${value.toFixed(1)}`;

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const parsed = dayjs(dateString);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : dateString;
};

// Reusable metric card matching the Daily Sales Report metric-card visual language.
interface MetricCardProps {
  title: string;
  value: string;
  accentColor?: string;
}
const MetricCard: React.FC<MetricCardProps> = ({ title, value, accentColor }) => (
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
        fontFamily: C.PAGE.FONT_FAMILY,
      }}
    >
      {title}
    </Typography>
    <Typography
      sx={{
        fontSize: C.CARD.VALUE.FONT_SIZE,
        fontWeight: C.CARD.VALUE.FONT_WEIGHT,
        color: accentColor || C.CARD.VALUE.COLOR,
        fontFamily: C.PAGE.FONT_FAMILY,
      }}
    >
      {value}
    </Typography>
  </Card>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontSize: C.SECTION_TITLE.FONT_SIZE,
      fontWeight: C.SECTION_TITLE.FONT_WEIGHT,
      color: C.SECTION_TITLE.COLOR,
      mb: 2,
      fontFamily: C.PAGE.FONT_FAMILY,
    }}
  >
    {children}
  </Typography>
);

const FilterDropdown: React.FC<{
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <Typography
      sx={{ fontFamily: C.PAGE.FONT_FAMILY, fontWeight: 500, color: '#728197', fontSize: '12px' }}
    >
      {label}
    </Typography>
    <Select
      value={value}
      onChange={(e: SelectChangeEvent) => onChange(e.target.value)}
      displayEmpty
      sx={{
        height: '40px',
        minWidth: 160,
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        fontFamily: C.PAGE.FONT_FAMILY,
        fontSize: '14px',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#9AA8BC' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#728197' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#728197' },
        '& .MuiSelect-icon': { color: C.COLORS.PURPLE },
      }}
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: C.PAGE.FONT_FAMILY, fontSize: '14px' }}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  </Box>
);

const SupplierReports: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(C.DEFAULTS.RANGE_DAYS - 1, 'day'),
    dayjs(),
  ]);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [poStatus, setPoStatus] = useState<string>('');

  const [startDate, endDate] = dateRange;
  const hasRange = Boolean(startDate && endDate);

  const queryArgs = useMemo(
    () => ({
      start_date: startDate ? startDate.format('YYYY-MM-DD') : '',
      end_date: endDate ? endDate.format('YYYY-MM-DD') : '',
      ...(paymentStatus ? { payment_status: paymentStatus } : {}),
      ...(poStatus ? { po_status: poStatus } : {}),
    }),
    [startDate, endDate, paymentStatus, poStatus]
  );

  const { data, isLoading, isError } = useGetSupplierOverviewQuery(queryArgs, {
    skip: !hasRange,
    refetchOnMountOrArgChange: true,
  });

  // Parse all numeric-string fields up front (see toNum / api-contract caveat).
  const kpis = useMemo(() => {
    if (!data) return null;
    return {
      totalSpend: toNum(data.kpis.total_spend),
      totalOutstanding: toNum(data.kpis.total_outstanding),
      poCount: data.kpis.po_count,
      activeSuppliers: data.kpis.active_supplier_count,
      avgLeadTime: data.kpis.avg_lead_time_days === null ? null : toNum(data.kpis.avg_lead_time_days),
    };
  }, [data]);

  const suppliers = useMemo<SupplierOverviewRow[]>(() => data?.suppliers ?? [], [data]);

  const spendTrend = useMemo(() => {
    if (!data) return { months: [] as string[], values: [] as number[] };
    return {
      months: data.spend_trend.map((p) => dayjs(`${p.month}-01`).format('MMM YYYY')),
      values: data.spend_trend.map((p) => toNum(p.spend)),
    };
  }, [data]);

  const maxSpend = useMemo(() => {
    if (!spendTrend.values.length) return 100;
    const max = Math.max(...spendTrend.values);
    if (max <= 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil((max * 1.1) / magnitude) * magnitude;
  }, [spendTrend]);

  // ------- Table state -------
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'spend',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  const sortedSuppliers = useMemo(() => {
    const numericKeys = new Set(['spend', 'order_count', 'amount_due', 'avg_lead_time_days']);
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    return [...suppliers].sort((a, b) => {
      const key = sortConfig.key as keyof SupplierOverviewRow;
      if (numericKeys.has(sortConfig.key)) {
        return (toNum(a[key] as any) - toNum(b[key] as any)) * dir;
      }
      if (sortConfig.key === 'last_order_date') {
        return (dayjs(a.last_order_date).valueOf() - dayjs(b.last_order_date).valueOf()) * dir;
      }
      return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir;
    });
  }, [suppliers, sortConfig]);

  const handleSortRequest = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const cellSx = {
    fontFamily: C.TABLE.HEADER_FONT_FAMILY,
    fontSize: C.TABLE.CELL_FONT_SIZE,
    color: C.TABLE.CELL_COLOR,
  };

  const handleRowClick = (row: SupplierOverviewRow) =>
    navigate(`${C.ROUTES.DETAIL_BASE}/${row.supplier_id}`);

  const columns: TableColumn<SupplierOverviewRow>[] = [
    {
      key: 'supplier_name',
      header: L.TABLE.SUPPLIER_NAME,
      sortable: true,
      render: (row) => (
        <Typography
          onClick={() => handleRowClick(row)}
          sx={{
            ...cellSx,
            color: C.TABLE.LINK_COLOR,
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {row.supplier_name}
        </Typography>
      ),
    },
    {
      key: 'spend',
      header: L.TABLE.SPEND,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{formatCurrency(toNum(row.spend))}</Typography>,
    },
    {
      key: 'order_count',
      header: L.TABLE.ORDER_COUNT,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{row.order_count}</Typography>,
    },
    {
      key: 'amount_due',
      header: L.TABLE.AMOUNT_DUE,
      sortable: true,
      render: (row) => (
        <Typography sx={{ ...cellSx, color: toNum(row.amount_due) > 0 ? C.COLORS.NEGATIVE : C.TABLE.CELL_COLOR }}>
          {formatCurrency(toNum(row.amount_due))}
        </Typography>
      ),
    },
    {
      key: 'avg_lead_time_days',
      header: L.TABLE.AVG_LEAD_TIME,
      sortable: true,
      render: (row) => (
        <Typography sx={cellSx}>
          {formatDays(row.avg_lead_time_days === null ? null : toNum(row.avg_lead_time_days))}
        </Typography>
      ),
    },
    {
      key: 'last_order_date',
      header: L.TABLE.LAST_ORDER_DATE,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{formatDate(row.last_order_date)}</Typography>,
    },
  ];

  // ------- CSV -------
  const csvData = useMemo(
    () =>
      sortedSuppliers.map((row) => ({
        Supplier: row.supplier_name,
        'Spend (₹)': toNum(row.spend).toFixed(2),
        Orders: row.order_count,
        'Amount Due (₹)': toNum(row.amount_due).toFixed(2),
        'Avg Lead Time (days)': formatDays(
          row.avg_lead_time_days === null ? null : toNum(row.avg_lead_time_days)
        ),
        'Last Order': formatDate(row.last_order_date),
      })),
    [sortedSuppliers]
  );

  const csvFilename = useMemo(() => {
    const s = startDate ? startDate.format('YYYY-MM-DD') : '';
    const e = endDate ? endDate.format('YYYY-MM-DD') : '';
    return `supplier_reports_${s}_to_${e}.csv`;
  }, [startDate, endDate]);

  const handleDownloadCSV = () => csvLinkRef.current?.link?.click();

  return (
    <Box sx={{ p: C.PAGE.PADDING, paddingBottom: C.PAGE.PADDING_BOTTOM }}>
      {/* Header */}
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
            sx={{ fontFamily: C.PAGE.FONT_FAMILY, color: C.HEADER.TITLE_COLOR }}
          >
            {L.TITLE}
          </Typography>
          <Typography
            sx={{
              fontFamily: C.PAGE.FONT_FAMILY,
              color: C.HEADER.SUBTITLE_COLOR,
              fontSize: C.HEADER.SUBTITLE_FONT_SIZE,
              mt: 0.5,
              maxWidth: 640,
            }}
          >
            {L.SUBTITLE}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <FilterDropdown
            label={L.FILTERS.PAYMENT_STATUS}
            value={paymentStatus}
            options={SUPPLIER_PAYMENT_STATUS_OPTIONS}
            onChange={(v) => {
              setPaymentStatus(v);
              setCurrentPage(1);
            }}
          />
          <FilterDropdown
            label={L.FILTERS.PO_STATUS}
            value={poStatus}
            options={SUPPLIER_PO_STATUS_OPTIONS}
            onChange={(v) => {
              setPoStatus(v);
              setCurrentPage(1);
            }}
          />
          <StandardButton
            variant="primary"
            size="medium"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCSV}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {L.DOWNLOAD_CSV}
          </StandardButton>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={40} />
        </Box>
      ) : isError || !kpis ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="error" sx={{ fontFamily: C.PAGE.FONT_FAMILY }}>
            {SUPPLIER_REPORTS_LABELS.STATES.ERROR}
          </Typography>
        </Box>
      ) : (
        <>
          {/* KPI cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.TOTAL_SPEND} value={formatCurrency(kpis.totalSpend)} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard
                title={L.KPIS.TOTAL_OUTSTANDING}
                value={formatCurrency(kpis.totalOutstanding)}
                accentColor={kpis.totalOutstanding > 0 ? C.COLORS.NEGATIVE : undefined}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.PURCHASE_ORDERS} value={String(kpis.poCount)} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.ACTIVE_SUPPLIERS} value={String(kpis.activeSuppliers)} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard
                title={L.KPIS.AVG_LEAD_TIME}
                value={formatDays(kpis.avgLeadTime)}
              />
            </Grid>
          </Grid>

          {/* Spend trend */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>{L.SECTIONS.SPEND_TREND}</SectionTitle>
            <Card
              sx={{
                p: 3,
                width: '100%',
                borderRadius: C.CARD.BORDER_RADIUS,
                boxShadow: C.CARD.BOX_SHADOW,
                border: C.CARD.BORDER,
              }}
            >
              {spendTrend.values.length > 0 ? (
                <Box sx={{ width: '100%', height: C.CHART.CONTAINER_HEIGHT }}>
                  <BarChart
                    xAxis={[
                      {
                        data: spendTrend.months,
                        scaleType: 'band',
                        tickLabelStyle: {
                          fontSize: C.CHART.TICK_LABEL_FONT_SIZE,
                          fill: C.CHART.TICK_LABEL_COLOR,
                          fontFamily: C.PAGE.FONT_FAMILY,
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        min: 0,
                        max: maxSpend,
                        tickLabelStyle: {
                          fontSize: C.CHART.TICK_LABEL_FONT_SIZE,
                          fill: C.CHART.TICK_LABEL_COLOR,
                          fontFamily: C.PAGE.FONT_FAMILY,
                        },
                      },
                    ]}
                    series={[
                      {
                        data: spendTrend.values,
                        label: L.SECTIONS.SPEND_TREND,
                        color: C.CHART.COLOR,
                        valueFormatter: (v) => (v === null ? '' : formatCurrency(v)),
                      },
                    ]}
                    height={C.CHART.HEIGHT}
                    margin={C.CHART.MARGIN}
                    grid={{ vertical: false, horizontal: true }}
                    hideLegend
                    sx={{
                      '& .MuiChartsAxis-line': { stroke: C.CHART.AXIS_STROKE, strokeWidth: 1 },
                      '& .MuiChartsAxis-tick': { stroke: C.CHART.AXIS_STROKE, strokeWidth: 1 },
                      '& .MuiChartsGrid-root': { stroke: C.CHART.GRID_STROKE, strokeDasharray: 'none' },
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: C.CHART.CONTAINER_HEIGHT,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ color: '#9CA3AF', fontFamily: C.PAGE.FONT_FAMILY, fontSize: '14px' }}>
                    {L.EMPTY_TREND}
                  </Typography>
                </Box>
              )}
            </Card>
          </Box>

          {/* Ranked suppliers table */}
          <Box>
            <SectionTitle>{L.SECTIONS.RANKED_SUPPLIERS}</SectionTitle>
            <ReusableTable
              columns={columns}
              data={sortedSuppliers}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              emptyMessage={L.EMPTY_SUPPLIERS}
              searchAndFilterConfig={{ filterOptions: [] }}
              currentSearchTerm=""
              onSearchChange={() => {}}
              showFilters={false}
              onShowFiltersToggle={() => {}}
              currentFilterKey=""
              onFilterSelect={() => {}}
              totalRows={sortedSuppliers.length}
              rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onSortRequest={handleSortRequest}
              sortConfig={sortConfig}
            />
          </Box>
        </>
      )}

      <CSVLink data={csvData} filename={csvFilename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default SupplierReports;
