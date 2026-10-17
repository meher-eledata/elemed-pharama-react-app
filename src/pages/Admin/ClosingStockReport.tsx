import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Chip,
  FormControlLabel,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  TableCell,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CSVLink } from 'react-csv';
import dayjs, { Dayjs } from 'dayjs';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { PharmaDatePicker } from '../../components/Common';
import {
  ReportHeader,
  ReportLoading,
  ReportError,
  FilterLabel,
  FilterSelect,
  FilterSelectOption,
  CellText,
  ReportEmpty,
  TableShell,
  SummaryBar,
  BackLink,
} from '../../components/AdminReports/ReportShared';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { CLOSING_STOCK_REPORT_LABELS as L } from '../../config/label/ClosingStockReport.labels';
import {
  useGetClosingStockReportQuery,
  ClosingStockReportRow,
  ClosingStockBatch,
  ClosingStockCostBasis,
  Num,
} from '../../redux/slices/reportsApi';
import type { RootState } from '../../redux/store';
import { useGetAllBrandsQuery } from '../../redux/slices/inventoryApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import { useDebounce } from '../../hooks/useDebounce';
import {
  toNum,
  formatCurrency,
  formatNumber,
  formatCount,
  formatReportDate,
  csvString,
} from '../../utils/reportFormat';

const CS = C.CLOSING_STOCK;
const FONT = C.FONT_FAMILY;
const MIN_DATE = dayjs(CS.MIN_DATE);

/** Friendly copy for a date the server would reject; null when the date is usable. */
const dateErrorFor = (d: Dayjs | null, today: Dayjs): string | null => {
  if (!d || !d.isValid() || d.isBefore(MIN_DATE, 'day')) return L.DATE_ERRORS.INVALID;
  if (d.isAfter(today, 'day')) return L.DATE_ERRORS.FUTURE;
  return null;
};

// The v8 picker field ignores the shared picker's input styles (14px / near-black /
// 8px radius) — match the neighbouring filter inputs from the outside.
const dateFieldSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  '& .MuiPickersTextField-root .MuiPickersInputBase-root': {
    fontFamily: FONT,
    fontSize: `${CS.DATE_FIELD.FONT_SIZE} !important`,
    color: `${CS.DATE_FIELD.COLOR} !important`,
    borderRadius: `${CS.DATE_FIELD.BORDER_RADIUS} !important`,
  },
  '& .MuiPickersTextField-root fieldset': { borderRadius: `${CS.DATE_FIELD.BORDER_RADIUS} !important` },
} as const;

type View = 'product' | 'batch';

/** Fields both views share; the shared column builders below work on either row type. */
interface BaseRow {
  _id: number;
  brand_name: string | null;
  product_name: string;
  product_code: string | null;
  qtyN: number;
  costExN: number | null;
  costIncN: number | null;
  mrpN: number | null;
  cost_basis: ClosingStockCostBasis | null;
  has_unpriced_mrp: boolean;
  has_negative_batches?: boolean;
}

type StockRow = ClosingStockReportRow & BaseRow;

type BatchRow = ClosingStockBatch &
  BaseRow & {
    unitCostExN: number | null;
  };

/**
 * One definition per column drives the table cell, the CSV cell and the totals row.
 * `hide: true` marks a CSV-only column (kept here so the export can't drift from the table).
 */
interface StockColumn<T> extends TableColumn<T> {
  csvHeader: string;
  csv: (r: T) => string;
  total?: React.ReactNode;
  totalCsv?: string;
}

interface Totals {
  qty: number;
  costEx: number;
  costInc: number;
  mrp: number;
}

type SortConfig = { key: string; direction: 'asc' | 'desc' };
const DEFAULT_SORT: SortConfig = { key: 'product_name', direction: 'asc' };

const readStoredView = (key: string): View => {
  try {
    return localStorage.getItem(key) === 'batch' ? 'batch' : 'product';
  } catch {
    return 'product';
  }
};

const nullableNum = (v: Num | null): number | null => (v === null ? null : toNum(v));
const csvMoney = (v: number | null): string => (v === null ? '' : v.toFixed(2));

const Hint: React.FC<{ tip: string; children: React.ReactNode }> = ({ tip, children }) => (
  <Tooltip title={tip} arrow>
    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5, cursor: 'help' }}>{children}</Box>
  </Tooltip>
);

const EmptyValue: React.FC<{ tip: string }> = ({ tip }) => (
  <Hint tip={tip}>
    <CellText color={C.COLORS.TEXT_MUTED}>{L.TABLE.EMPTY_VALUE}</CellText>
  </Hint>
);

/** A ₹ value followed by a small amber qualifier (e.g. "est.", "partial") explained by a tooltip. */
const MarkedValue: React.FC<{ value: number; marker: string; tip: string }> = ({ value, marker, tip }) => (
  <Hint tip={tip}>
    <CellText>{formatCurrency(value)}</CellText>
    <Typography component="span" sx={{ fontFamily: FONT, fontSize: '11px', color: C.COLORS.AMBER }}>
      {marker}
    </Typography>
  </Hint>
);

const costCell = (value: number | null, basis: ClosingStockCostBasis | null) => {
  if (value === null) return <EmptyValue tip={L.TOOLTIP.COST_MISSING} />;
  if (basis === 'ESTIMATED') {
    return <MarkedValue value={value} marker={L.TABLE.ESTIMATED_MARKER} tip={L.TOOLTIP.COST_ESTIMATED} />;
  }
  return <CellText>{formatCurrency(value)}</CellText>;
};

const mrpCell = (r: BaseRow) => {
  if (r.mrpN === null) return <EmptyValue tip={L.TOOLTIP.MRP_MISSING} />;
  if (r.has_unpriced_mrp) {
    return <MarkedValue value={r.mrpN} marker={L.TABLE.PARTIAL_MARKER} tip={L.TOOLTIP.MRP_PARTIAL} />;
  }
  return <CellText>{formatCurrency(r.mrpN)}</CellText>;
};

const twoLineHeader = (first: string, second: string) => () => (
  <Box component="span" sx={{ display: 'block' }}>
    {first}
    <br />
    {second}
  </Box>
);

const qtyCell = (r: BaseRow) => {
  const text = formatNumber(r.qtyN);
  if (r.qtyN < 0) {
    return (
      <Hint tip={L.TOOLTIP.NEGATIVE_QTY}>
        <CellText color={C.COLORS.NEGATIVE}>{text}</CellText>
      </Hint>
    );
  }
  if (r.has_negative_batches) {
    return (
      <Hint tip={L.TOOLTIP.NEGATIVE_BATCHES}>
        <CellText color={C.COLORS.AMBER}>{text}</CellText>
      </Hint>
    );
  }
  return <CellText>{text}</CellText>;
};

const expiryCell = (r: BatchRow) => {
  if (!r.expiry_date) return <EmptyValue tip={L.TOOLTIP.EXPIRY_MISSING} />;
  // formatReportDate parses 'YYYY-MM-DD' as a LOCAL calendar date (no UTC day shift).
  const text = formatReportDate(r.expiry_date);
  if (!r.is_expired) return <CellText>{text}</CellText>;
  return (
    <Hint tip={L.TOOLTIP.EXPIRED}>
      <CellText color={C.COLORS.NEGATIVE}>{text}</CellText>
      <Chip
        label={L.TABLE.EXPIRED}
        size="small"
        sx={{
          alignSelf: 'center',
          height: CS.EXPIRED_CHIP.HEIGHT,
          fontFamily: FONT,
          fontSize: CS.EXPIRED_CHIP.FONT_SIZE,
          fontWeight: 600,
          borderRadius: CS.EXPIRED_CHIP.BORDER_RADIUS,
          backgroundColor: CS.EXPIRED_CHIP.BACKGROUND,
          color: CS.EXPIRED_CHIP.COLOR,
          '& .MuiChip-label': { px: 1 },
        }}
      />
    </Hint>
  );
};

const Total: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CellText weight={700}>{children}</CellText>
);

const textColumn = <T extends BaseRow>(
  key: 'brand_name' | 'product_name',
  header: string,
  minWidth: string
): StockColumn<T> => ({
  key,
  header,
  csvHeader: header,
  sortable: true,
  render: (r) => (
    <Box sx={{ minWidth }}>
      <CellText>{r[key] || '-'}</CellText>
    </Box>
  ),
  csv: (r) => csvString(r[key]),
});

const brandProductColumns = <T extends BaseRow>(view: View): StockColumn<T>[] => [
  {
    ...textColumn<T>('brand_name', L.TABLE.BRAND, view === 'batch' ? CS.BATCH_VIEW_BRAND_MIN_WIDTH : CS.BRAND_MIN_WIDTH),
    total: <Total>{L.TABLE.TOTAL}</Total>,
    totalCsv: L.TABLE.TOTAL,
  },
  textColumn<T>('product_name', L.TABLE.PRODUCT, view === 'batch' ? CS.BATCH_VIEW_PRODUCT_MIN_WIDTH : CS.PRODUCT_MIN_WIDTH),
  {
    key: 'product_code',
    header: L.TABLE.PRODUCT_CODE,
    csvHeader: L.TABLE.PRODUCT_CODE,
    sortable: true,
    nowrap: true,
    render: (r) => <CellText>{r.product_code || '-'}</CellText>,
    csv: (r) => csvString(r.product_code),
  },
];

const qtyColumn = <T extends BaseRow>(totals: Totals): StockColumn<T> => ({
  key: 'qtyN',
  header: L.TABLE.QTY,
  csvHeader: L.TABLE.QTY,
  sortable: true,
  nowrap: true,
  render: qtyCell,
  csv: (r) => r.qtyN.toFixed(2),
  total: <Total>{formatNumber(totals.qty)}</Total>,
  totalCsv: totals.qty.toFixed(2),
});

const valueColumns = <T extends BaseRow>(totals: Totals): StockColumn<T>[] => [
  {
    key: 'costExN',
    header: L.TABLE.VALUE_COST_EX_GST,
    headerRender: twoLineHeader(L.TABLE.VALUE_COST_HEADER, L.TABLE.EX_GST_HEADER),
    csvHeader: L.TABLE.VALUE_COST_EX_GST + L.TABLE.CSV_CURRENCY_SUFFIX,
    sortable: true,
    nowrap: true,
    render: (r) => costCell(r.costExN, r.cost_basis),
    csv: (r) => csvMoney(r.costExN),
    total: <Total>{formatCurrency(totals.costEx)}</Total>,
    totalCsv: totals.costEx.toFixed(2),
  },
  {
    key: 'costIncN',
    header: L.TABLE.VALUE_COST_INC_GST,
    headerRender: twoLineHeader(L.TABLE.VALUE_COST_HEADER, L.TABLE.INC_GST_HEADER),
    csvHeader: L.TABLE.VALUE_COST_INC_GST + L.TABLE.CSV_CURRENCY_SUFFIX,
    sortable: true,
    nowrap: true,
    render: (r) => costCell(r.costIncN, r.cost_basis),
    csv: (r) => csvMoney(r.costIncN),
    total: <Total>{formatCurrency(totals.costInc)}</Total>,
    totalCsv: totals.costInc.toFixed(2),
  },
  {
    key: 'mrpN',
    header: L.TABLE.VALUE_MRP,
    csvHeader: L.TABLE.VALUE_MRP + L.TABLE.CSV_CURRENCY_SUFFIX,
    sortable: true,
    nowrap: true,
    render: mrpCell,
    csv: (r) => csvMoney(r.mrpN),
    total: <Total>{formatCurrency(totals.mrp)}</Total>,
    totalCsv: totals.mrp.toFixed(2),
  },
];

/** CSV-only column (not rendered on screen). */
const csvOnly = <T,>(key: string, csvHeader: string, csv: (r: T) => string): StockColumn<T> => ({
  key,
  header: csvHeader,
  csvHeader,
  hide: true,
  csv,
});

const productColumns = (totals: Totals): StockColumn<StockRow>[] => [
  ...brandProductColumns<StockRow>('product'),
  qtyColumn<StockRow>(totals),
  ...valueColumns<StockRow>(totals),
];

const batchColumns = (totals: Totals): StockColumn<BatchRow>[] => [
  ...brandProductColumns<BatchRow>('batch'),
  {
    key: 'batch_number',
    header: L.TABLE.BATCH,
    csvHeader: L.TABLE.BATCH,
    sortable: true,
    nowrap: true,
    render: (r) => <CellText>{r.batch_number || '-'}</CellText>,
    csv: (r) => csvString(r.batch_number),
  },
  {
    key: 'expiry_date',
    header: L.TABLE.EXPIRY,
    csvHeader: L.TABLE.EXPIRY,
    sortable: true,
    nowrap: true,
    render: expiryCell,
    csv: (r) => r.expiry_date ?? '',
  },
  csvOnly<BatchRow>('is_expired', L.TABLE.EXPIRED, (r) => (r.is_expired ? L.TABLE.YES : L.TABLE.NO)),
  qtyColumn<BatchRow>(totals),
  {
    key: 'unitCostExN',
    header: L.TABLE.UNIT_COST_EX_GST,
    headerRender: twoLineHeader(L.TABLE.UNIT_COST_HEADER, L.TABLE.EX_GST_HEADER),
    csvHeader: L.TABLE.UNIT_COST_EX_GST + L.TABLE.CSV_CURRENCY_SUFFIX,
    sortable: true,
    nowrap: true,
    render: (r) => costCell(r.unitCostExN, r.cost_basis),
    csv: (r) => csvMoney(r.unitCostExN),
  },
  csvOnly<BatchRow>('unit_cost_inc_gst', L.TABLE.UNIT_COST_INC_GST + L.TABLE.CSV_CURRENCY_SUFFIX, (r) =>
    csvMoney(nullableNum(r.unit_cost_inc_gst))
  ),
  csvOnly<BatchRow>('mrp_per_unit', L.TABLE.MRP_PER_UNIT + L.TABLE.CSV_CURRENCY_SUFFIX, (r) =>
    csvMoney(nullableNum(r.mrp_per_unit))
  ),
  ...valueColumns<BatchRow>(totals),
  csvOnly<BatchRow>('cost_basis', L.TABLE.COST_BASIS, (r) => r.cost_basis ?? ''),
];

const sortRows = <T,>(rows: T[], { key, direction }: SortConfig): T[] => {
  const sign = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = (a as any)[key];
    const bv = (b as any)[key];
    // Missing values always sort last, whichever the direction.
    if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
    if (typeof av === 'number' && typeof bv === 'number') return sign * (av - bv);
    return (
      sign *
      String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true, sensitivity: 'base' })
    );
  });
};

/** CSV records for every column (incl. CSV-only ones), plus a totals row when there is data. */
const buildCsv = <T,>(columns: StockColumn<T>[], rows: T[]) => {
  const record = (cell: (c: StockColumn<T>) => string) =>
    Object.fromEntries(columns.map((c) => [c.csvHeader, cell(c)]));
  const out = rows.map((r) => record((c) => c.csv(r)));
  if (out.length > 0) out.push(record((c) => c.totalCsv ?? ''));
  return out;
};

const ClosingStockReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const batchCsvLinkRef = useRef<any>(null);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const viewStorageKey = `${CS.VIEW_STORAGE_KEY}_${userId ?? 'anon'}`;
  const [view, setView] = useState<View>(() => readStoredView(viewStorageKey));
  const [downloadAnchor, setDownloadAnchor] = useState<HTMLElement | null>(null);
  const [logDownload] = useLogDownloadMutation();
  const today = useMemo(() => dayjs(), []);
  // dateInput follows the field (every keystroke); asOf is the settled date that drives the query.
  const [dateInput, setDateInput] = useState<Dayjs | null>(today);
  const [asOf, setAsOf] = useState<Dayjs | null>(today);
  const [brandId, setBrandId] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [includeZero, setIncludeZero] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);

  const search = useDebounce(searchInput.trim(), CS.SEARCH_DEBOUNCE_MS);
  const settledDateInput = useDebounce(dateInput, CS.DATE_DEBOUNCE_MS);
  useEffect(() => {
    setAsOf(settledDateInput);
    setCurrentPage(1);
  }, [settledDateInput]);

  const dateError = dateErrorFor(asOf, today);
  const { data: brands } = useGetAllBrandsQuery();

  // currentData (not data): table, totals and CSV must always belong to the CURRENT args,
  // never to the last successful response for some other date/filter.
  const { currentData: data, isFetching, isError, refetch } = useGetClosingStockReportQuery(
    dateError || !asOf
      ? skipToken
      : {
          as_of_date: asOf.format('YYYY-MM-DD'),
          ...(brandId ? { brand_id: Number(brandId) } : {}),
          ...(search ? { search } : {}),
          include_zero_stock: includeZero,
        },
    { refetchOnMountOrArgChange: true }
  );

  const brandOptions: FilterSelectOption[] = useMemo(
    () => [
      { value: '', label: L.FILTER.BRAND_ALL },
      ...(brands || []).map((b) => ({ value: String(b.id), label: b.brand_name })),
    ],
    [brands]
  );

  const rows: StockRow[] = useMemo(
    () =>
      (data?.rows || []).map((r, i) => ({
        ...r,
        _id: i,
        qtyN: toNum(r.quantity),
        costExN: nullableNum(r.value_cost_ex_gst),
        costIncN: nullableNum(r.value_cost_inc_gst),
        mrpN: nullableNum(r.value_mrp),
      })),
    [data]
  );

  // Batch-wise is derived from the same response: switching views never refetches.
  const batchRows: BatchRow[] = useMemo(
    () =>
      (data?.rows || [])
        .flatMap((r) =>
          (r.batches ?? []).map((b) => ({
            ...b,
            brand_name: r.brand_name,
            product_name: r.product_name,
            product_code: r.product_code,
          }))
        )
        .map((b, i) => ({
          ...b,
          _id: i,
          qtyN: toNum(b.quantity),
          unitCostExN: nullableNum(b.unit_cost_ex_gst),
          costExN: nullableNum(b.value_cost_ex_gst),
          costIncN: nullableNum(b.value_cost_inc_gst),
          mrpN: nullableNum(b.value_mrp),
        })),
    [data]
  );

  const summary = data?.summary;
  const totals: Totals = useMemo(
    () => ({
      qty: toNum(summary?.total_quantity),
      costEx: toNum(summary?.total_value_cost_ex_gst),
      costInc: toNum(summary?.total_value_cost_inc_gst),
      mrp: toNum(summary?.total_value_mrp),
    }),
    [summary]
  );

  const productCols = useMemo(() => productColumns(totals), [totals]);
  const batchCols = useMemo(() => batchColumns(totals), [totals]);

  // A batch-only sort key (e.g. Expiry) falls back to the default in product view and
  // comes back when the viewer returns to batch view.
  const isBatchView = view === 'batch';
  const activeSort =
    (isBatchView ? batchCols : productCols).some((c) => c.sortable && c.key === sortConfig.key)
      ? sortConfig
      : DEFAULT_SORT;

  const sortedRows = useMemo(() => sortRows(rows, activeSort), [rows, activeSort]);
  const sortedBatchRows = useMemo(() => sortRows(batchRows, activeSort), [batchRows, activeSort]);

  const handleSortRequest = (key: string) =>
    setSortConfig({
      key,
      direction: activeSort.key === key && activeSort.direction === 'asc' ? 'desc' : 'asc',
    });

  const viewRowCount = isBatchView ? sortedBatchRows.length : sortedRows.length;

  const summaryStats = [
    isBatchView
      ? { label: L.SUMMARY.BATCHES, value: formatCount(summary?.batch_count ?? 0) }
      : { label: L.SUMMARY.PRODUCTS, value: formatCount(summary?.product_count ?? 0) },
    { label: L.SUMMARY.TOTAL_QTY, value: formatNumber(totals.qty) },
    { label: L.SUMMARY.VALUE_COST_EX_GST, value: formatCurrency(totals.costEx) },
    { label: L.SUMMARY.VALUE_COST_INC_GST, value: formatCurrency(totals.costInc) },
    { label: L.SUMMARY.VALUE_MRP, value: formatCurrency(totals.mrp) },
  ];

  const warnings: string[] = summary
    ? [
        summary.uncosted_product_count > 0 &&
          L.WARNINGS.UNCOSTED(summary.uncosted_product_count, formatNumber(toNum(summary.uncosted_quantity))),
        summary.unpriced_mrp_product_count > 0 && L.WARNINGS.UNPRICED_MRP(summary.unpriced_mrp_product_count),
        summary.negative_batch_count > 0 && L.WARNINGS.NEGATIVE_BATCHES(summary.negative_batch_count),
        summary.ambiguous_movement_count > 0 && L.WARNINGS.AMBIGUOUS(summary.ambiguous_movement_count),
        summary.unattributed_movement_count > 0 && L.WARNINGS.UNATTRIBUTED(summary.unattributed_movement_count),
        summary.receipt_line_deletions_after_cutoff > 0 &&
          L.WARNINGS.RECEIPT_LINE_DELETIONS(summary.receipt_line_deletions_after_cutoff),
        summary.unknown_type_movement_count > 0 && L.WARNINGS.UNKNOWN_TYPE(summary.unknown_type_movement_count),
      ].filter((w): w is string => Boolean(w))
    : [];

  const csvData = useMemo(() => buildCsv(productCols, sortedRows), [productCols, sortedRows]);
  const batchCsvData = useMemo(() => buildCsv(batchCols, sortedBatchRows), [batchCols, sortedBatchRows]);

  const handleDownload = (kind: View) => {
    setDownloadAnchor(null);
    const batch = kind === 'batch';
    (batch ? batchCsvLinkRef : csvLinkRef).current?.link?.click();
    logDownload({
      category: 'report',
      name: batch ? L.LOG_NAME.BATCH : L.LOG_NAME.PRODUCT,
      format: 'csv',
      count: batch ? sortedBatchRows.length : sortedRows.length,
    }).catch(() => {});
  };

  const handleViewChange = (_e: React.MouseEvent<HTMLElement>, next: View | null) => {
    if (!next) return; // exclusive and never empty: re-clicking the active view is a no-op
    setView(next);
    setCurrentPage(1);
    try {
      localStorage.setItem(viewStorageKey, next);
    } catch {
      // Storage unavailable (private mode / quota): the choice just isn't remembered.
    }
  };

  const resetPage = () => setCurrentPage(1);

  // Horizontal-scroll affordance: when columns overflow (narrow viewports), fade the
  // right edge and show a hint so the hidden columns are discoverable.
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [fadeHeight, setFadeHeight] = useState(0);
  useEffect(() => {
    const el = tableWrapRef.current?.querySelector<HTMLElement>('.MuiTableContainer-root');
    if (!el) {
      setFadeHeight(0);
      return undefined;
    }
    const update = () => setFadeHeight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1 ? el.clientHeight : 0);
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [view, sortedRows, sortedBatchRows, currentPage]);

  const downloadDisabled = !rows.length || isFetching || isError || Boolean(dateError);

  const renderTable = <T extends BaseRow>(columns: StockColumn<T>[], tableRows: T[], emptyMessage: string) => (
    <ReusableTable<T>
      key={view}
      columns={columns}
      data={tableRows}
      selectedRows={selectedRows}
      setSelectedRows={setSelectedRows}
      emptyMessage={emptyMessage}
      searchAndFilterConfig={{ filterOptions: [] }}
      currentSearchTerm=""
      onSearchChange={() => {}}
      showFilters={false}
      onShowFiltersToggle={() => {}}
      currentFilterKey=""
      onFilterSelect={() => {}}
      totalRows={tableRows.length}
      rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onSortRequest={handleSortRequest}
      sortConfig={activeSort}
      footerContent={
        tableRows.length > 0 ? (
          <TableRow sx={{ bgcolor: C.COLORS.CARD_BG }}>
            {columns
              .filter((c) => !c.hide)
              .map((c) => (
                <TableCell
                  key={c.key as string}
                  sx={{ padding: '12px 16px', whiteSpace: 'nowrap', borderTop: `2px solid ${C.COLORS.BORDER}` }}
                >
                  {c.total ?? null}
                </TableCell>
              ))}
          </TableRow>
        ) : undefined
      }
      disableFooterWrapper
    />
  );

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={(e) => setDownloadAnchor(e.currentTarget)}
        downloadDisabled={downloadDisabled}
        downloadMenuOpen={Boolean(downloadAnchor)}
        downloadMenuId={CS.DOWNLOAD_MENU_ID}
        dateControl={
          <Box sx={dateFieldSx}>
            <FilterLabel>{L.FILTER.AS_OF_DATE_LABEL}</FilterLabel>
            <PharmaDatePicker
              value={dateInput}
              // Typing fires onChange per keystroke (partial / invalid parses), so the
              // committed date is debounced above and validated before any request.
              onChange={setDateInput}
              minDate={MIN_DATE}
              maxDate={today}
              error={Boolean(dateError)}
              width={CS.DATE_PICKER_WIDTH}
              height={CS.CONTROL_HEIGHT}
            />
          </Box>
        }
      >
        <FilterSelect
          label={L.FILTER.BRAND_LABEL}
          value={brandId}
          options={brandOptions}
          onChange={(v) => {
            setBrandId(v);
            resetPage();
          }}
          width={CS.BRAND_FILTER_WIDTH}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FilterLabel>{L.FILTER.SEARCH_LABEL}</FilterLabel>
          <TextField
            size="small"
            value={searchInput}
            placeholder={L.FILTER.SEARCH_PLACEHOLDER}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetPage();
            }}
            inputProps={{ maxLength: CS.SEARCH_MAX_LENGTH, 'aria-label': L.FILTER.SEARCH_LABEL }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: C.COLORS.TEXT_MUTED, fontSize: '20px' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: CS.SEARCH_WIDTH,
              '& .MuiOutlinedInput-root': {
                height: CS.CONTROL_HEIGHT,
                borderRadius: '8px',
                backgroundColor: C.COLORS.WHITE,
                fontFamily: FONT,
                fontSize: '14px',
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: C.COLORS.INPUT_BORDER },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.COLORS.TEXT_MUTED },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.COLORS.PURPLE },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FilterLabel>{L.FILTER.ZERO_STOCK_LABEL}</FilterLabel>
          <FormControlLabel
            sx={{ height: CS.CONTROL_HEIGHT, m: 0 }}
            control={
              <Switch
                checked={includeZero}
                inputProps={{ 'aria-label': L.FILTER.ZERO_STOCK_ARIA }}
                onChange={(e) => {
                  setIncludeZero(e.target.checked);
                  resetPage();
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: C.COLORS.PURPLE },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: C.COLORS.PURPLE },
                }}
              />
            }
            label={
              <Typography sx={{ fontFamily: FONT, fontSize: '14px', color: C.COLORS.TEXT_SECONDARY }}>
                {L.FILTER.ZERO_STOCK_SWITCH}
              </Typography>
            }
          />
        </Box>
      </ReportHeader>

      {/* The view switch is a mode for everything below (summary, table), so it sits on its
          own row under the filters: the filter row already fills 1280px. */}
      <ToggleButtonGroup
        exclusive
        value={view}
        onChange={handleViewChange}
        aria-label={L.VIEW.ARIA}
        sx={{
          mb: 3,
          height: CS.CONTROL_HEIGHT,
          backgroundColor: C.COLORS.WHITE,
          '& .MuiToggleButton-root': {
            px: CS.VIEW_TOGGLE.PADDING_X,
            fontFamily: FONT,
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            color: CS.VIEW_TOGGLE.COLOR,
            borderColor: CS.VIEW_TOGGLE.BORDER,
          },
          '& .MuiToggleButtonGroup-firstButton': { borderRadius: '8px 0 0 8px' },
          '& .MuiToggleButtonGroup-lastButton': { borderRadius: '0 8px 8px 0' },
          '& .MuiToggleButton-root.Mui-selected': {
            color: CS.VIEW_TOGGLE.SELECTED_COLOR,
            backgroundColor: CS.VIEW_TOGGLE.SELECTED_BG,
            '&:hover': { backgroundColor: CS.VIEW_TOGGLE.SELECTED_BG_HOVER },
          },
        }}
      >
        <ToggleButton value="product">{L.VIEW.PRODUCT}</ToggleButton>
        <ToggleButton value="batch">{L.VIEW.BATCH}</ToggleButton>
      </ToggleButtonGroup>

      {dateError ? (
        <ReportEmpty message={dateError} />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : !data ? (
        <ReportLoading />
      ) : (
        <>
          {warnings.length > 0 && (
            <Box
              role="status"
              sx={{
                display: 'flex',
                gap: 1.5,
                mb: 2,
                p: 2,
                backgroundColor: CS.NOTICE.BACKGROUND,
                border: CS.NOTICE.BORDER,
                borderRadius: CS.NOTICE.BORDER_RADIUS,
              }}
            >
              <WarningAmberIcon sx={{ color: CS.NOTICE.ICON_COLOR, fontSize: 20, mt: '1px' }} />
              <Box sx={{ fontFamily: FONT, fontSize: CS.NOTICE.FONT_SIZE, color: CS.NOTICE.TEXT_COLOR }}>
                <Typography sx={{ fontFamily: FONT, fontSize: CS.NOTICE.FONT_SIZE, fontWeight: 600, mb: 0.5 }}>
                  {L.WARNINGS.TITLE}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
          {viewRowCount > 0 && <SummaryBar stats={summaryStats} />}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <InfoOutlinedIcon sx={{ color: C.COLORS.TEXT_MUTED, fontSize: 16 }} />
              <Typography sx={{ fontFamily: FONT, fontSize: '12px', color: C.COLORS.TEXT_MUTED }}>
                {L.PAGE.MRP_NOTE}
              </Typography>
            </Box>
            {fadeHeight > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: C.COLORS.PURPLE, flexShrink: 0 }}>
                <Typography sx={{ fontFamily: FONT, fontSize: '12px', fontWeight: 500 }}>{L.SCROLL_HINT}</Typography>
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Box>
            )}
          </Box>
          <Box ref={tableWrapRef} sx={{ position: 'relative' }}>
            <TableShell>
              {isBatchView
                ? renderTable(batchCols, sortedBatchRows, rows.length > 0 ? L.EMPTY_BATCHES : L.EMPTY_TABLE)
                : renderTable(productCols, sortedRows, L.EMPTY_TABLE)}
            </TableShell>
            {fadeHeight > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8, // TableShell marginTop
                  right: 1,
                  height: fadeHeight,
                  width: CS.SCROLL_FADE_WIDTH,
                  pointerEvents: 'none',
                  borderTopRightRadius: '12px',
                  background: `linear-gradient(to right, rgba(255,255,255,0), ${C.COLORS.WHITE})`,
                }}
              />
            )}
          </Box>
        </>
      )}

      <Menu
        id={CS.DOWNLOAD_MENU_ID}
        MenuListProps={{ 'aria-labelledby': `${CS.DOWNLOAD_MENU_ID}-button` }}
        anchorEl={downloadAnchor}
        open={Boolean(downloadAnchor)}
        onClose={() => setDownloadAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: '12px', minWidth: 220 } } }}
      >
        {[
          { kind: 'product' as const, label: L.DOWNLOAD_MENU.PRODUCT, hint: L.DOWNLOAD_MENU.PRODUCT_HINT, empty: false },
          { kind: 'batch' as const, label: L.DOWNLOAD_MENU.BATCH, hint: L.DOWNLOAD_MENU.BATCH_HINT, empty: !batchRows.length },
        ].map((o) => (
          <MenuItem key={o.kind} disabled={downloadDisabled || o.empty} onClick={() => handleDownload(o.kind)}>
            <ListItemText
              primary={o.label}
              secondary={o.hint}
              primaryTypographyProps={{ fontFamily: FONT, fontSize: '14px', fontWeight: 500 }}
              secondaryTypographyProps={{ fontFamily: FONT, fontSize: '12px' }}
            />
          </MenuItem>
        ))}
      </Menu>
      <CSVLink
        data={csvData}
        filename={`${L.PAGE.CSV_FILENAME_PREFIX}_${data?.as_of_date ?? ''}.csv`}
        ref={csvLinkRef}
        style={{ display: 'none' }}
      />
      <CSVLink
        data={batchCsvData}
        filename={`${L.PAGE.CSV_FILENAME_BATCH_PREFIX}_${data?.as_of_date ?? ''}.csv`}
        ref={batchCsvLinkRef}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default ClosingStockReport;
