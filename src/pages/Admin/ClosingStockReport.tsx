import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  FormControlLabel,
  InputAdornment,
  Switch,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
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
  Num,
} from '../../redux/slices/reportsApi';
import { useGetAllBrandsQuery } from '../../redux/slices/inventoryApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import { useDebounce } from '../../hooks/useDebounce';
import { toNum, formatCurrency, formatNumber, formatCount, csvString } from '../../utils/reportFormat';

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

interface StockRow extends ClosingStockReportRow {
  _id: number;
  qtyN: number;
  costExN: number | null;
  costIncN: number | null;
  mrpN: number | null;
}

/** One definition per column drives the table cell, the CSV cell and the totals row. */
interface StockColumn extends TableColumn<StockRow> {
  csvHeader: string;
  csv: (r: StockRow) => string;
  total?: React.ReactNode;
  totalCsv?: string;
}

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

const costCell = (value: number | null, basis: StockRow['cost_basis']) => {
  if (value === null) return <EmptyValue tip={L.TOOLTIP.COST_MISSING} />;
  if (basis === 'ESTIMATED') {
    return <MarkedValue value={value} marker={L.TABLE.ESTIMATED_MARKER} tip={L.TOOLTIP.COST_ESTIMATED} />;
  }
  return <CellText>{formatCurrency(value)}</CellText>;
};

const mrpCell = (r: StockRow) => {
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

const qtyCell = (r: StockRow) => {
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

const Total: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CellText weight={700}>{children}</CellText>
);

const ClosingStockReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'product_name',
    direction: 'asc',
  });

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

  const sortedRows = useMemo(() => {
    const { key, direction } = sortConfig;
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
  }, [rows, sortConfig]);

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const summary = data?.summary;
  const totalQty = toNum(summary?.total_quantity);
  const totalCostEx = toNum(summary?.total_value_cost_ex_gst);
  const totalCostInc = toNum(summary?.total_value_cost_inc_gst);
  const totalMrp = toNum(summary?.total_value_mrp);

  const columns: StockColumn[] = useMemo(() => [
    {
      key: 'brand_name',
      header: L.TABLE.BRAND,
      csvHeader: L.TABLE.BRAND,
      sortable: true,
      render: (r) => (
        <Box sx={{ minWidth: CS.BRAND_MIN_WIDTH }}>
          <CellText>{r.brand_name || '-'}</CellText>
        </Box>
      ),
      csv: (r) => csvString(r.brand_name),
      total: <Total>{L.TABLE.TOTAL}</Total>,
      totalCsv: L.TABLE.TOTAL,
    },
    {
      key: 'product_name',
      header: L.TABLE.PRODUCT,
      csvHeader: L.TABLE.PRODUCT,
      sortable: true,
      render: (r) => (
        <Box sx={{ minWidth: CS.PRODUCT_MIN_WIDTH }}>
          <CellText>{r.product_name}</CellText>
        </Box>
      ),
      csv: (r) => csvString(r.product_name),
    },
    {
      key: 'product_code',
      header: L.TABLE.PRODUCT_CODE,
      csvHeader: L.TABLE.PRODUCT_CODE,
      sortable: true,
      nowrap: true,
      render: (r) => <CellText>{r.product_code || '-'}</CellText>,
      csv: (r) => csvString(r.product_code),
    },
    {
      key: 'qtyN',
      header: L.TABLE.QTY,
      csvHeader: L.TABLE.QTY,
      sortable: true,
      nowrap: true,
      render: qtyCell,
      csv: (r) => r.qtyN.toFixed(2),
      total: <Total>{formatNumber(totalQty)}</Total>,
      totalCsv: totalQty.toFixed(2),
    },
    {
      key: 'costExN',
      header: L.TABLE.VALUE_COST_EX_GST,
      headerRender: twoLineHeader(L.TABLE.VALUE_COST_HEADER, L.TABLE.EX_GST_HEADER),
      csvHeader: L.TABLE.VALUE_COST_EX_GST + L.TABLE.CSV_CURRENCY_SUFFIX,
      sortable: true,
      nowrap: true,
      render: (r) => costCell(r.costExN, r.cost_basis),
      csv: (r) => csvMoney(r.costExN),
      total: <Total>{formatCurrency(totalCostEx)}</Total>,
      totalCsv: totalCostEx.toFixed(2),
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
      total: <Total>{formatCurrency(totalCostInc)}</Total>,
      totalCsv: totalCostInc.toFixed(2),
    },
    {
      key: 'mrpN',
      header: L.TABLE.VALUE_MRP,
      csvHeader: L.TABLE.VALUE_MRP + L.TABLE.CSV_CURRENCY_SUFFIX,
      sortable: true,
      nowrap: true,
      render: mrpCell,
      csv: (r) => csvMoney(r.mrpN),
      total: <Total>{formatCurrency(totalMrp)}</Total>,
      totalCsv: totalMrp.toFixed(2),
    },
  ], [totalQty, totalCostEx, totalCostInc, totalMrp]);

  const totalsFooter = (
    <TableRow sx={{ bgcolor: C.COLORS.CARD_BG }}>
      {columns.map((c) => (
        <TableCell
          key={c.key as string}
          sx={{ padding: '12px 16px', whiteSpace: 'nowrap', borderTop: `2px solid ${C.COLORS.BORDER}` }}
        >
          {c.total ?? null}
        </TableCell>
      ))}
    </TableRow>
  );

  const summaryStats = [
    { label: L.SUMMARY.PRODUCTS, value: formatCount(summary?.product_count ?? 0) },
    { label: L.SUMMARY.TOTAL_QTY, value: formatNumber(totalQty) },
    { label: L.SUMMARY.VALUE_COST_EX_GST, value: formatCurrency(totalCostEx) },
    { label: L.SUMMARY.VALUE_COST_INC_GST, value: formatCurrency(totalCostInc) },
    { label: L.SUMMARY.VALUE_MRP, value: formatCurrency(totalMrp) },
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

  const csvData = useMemo(() => {
    const record = (cell: (c: StockColumn) => string) =>
      Object.fromEntries(columns.map((c) => [c.csvHeader, cell(c)]));
    const out = sortedRows.map((r) => record((c) => c.csv(r)));
    if (out.length > 0) out.push(record((c) => c.totalCsv ?? ''));
    return out;
  }, [sortedRows, columns]);

  const handleDownloadCsv = () => {
    csvLinkRef.current?.link?.click();
    logDownload({ category: 'report', name: 'Closing Stock Report', format: 'csv', count: sortedRows.length }).catch(
      () => {}
    );
  };

  const resetPage = () => setCurrentPage(1);

  // Horizontal-scroll affordance: when columns overflow (narrow viewports), fade the
  // right edge and show a hint so the hidden columns are discoverable.
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [fadeHeight, setFadeHeight] = useState(0);
  useEffect(() => {
    const el = tableWrapRef.current?.querySelector<HTMLElement>('.MuiTableContainer-root');
    if (!el) return undefined;
    const update = () => setFadeHeight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1 ? el.clientHeight : 0);
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [sortedRows, currentPage]);

  const downloadDisabled = !rows.length || isFetching || isError || Boolean(dateError);

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={handleDownloadCsv}
        downloadDisabled={downloadDisabled}
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
          {rows.length > 0 && <SummaryBar stats={summaryStats} />}
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
              <ReusableTable
                columns={columns}
                data={sortedRows}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                emptyMessage={L.EMPTY_TABLE}
                searchAndFilterConfig={{ filterOptions: [] }}
                currentSearchTerm=""
                onSearchChange={() => {}}
                showFilters={false}
                onShowFiltersToggle={() => {}}
                currentFilterKey=""
                onFilterSelect={() => {}}
                totalRows={sortedRows.length}
                rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
                footerContent={sortedRows.length > 0 ? totalsFooter : undefined}
                disableFooterWrapper
              />
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

      <CSVLink
        data={csvData}
        filename={`${L.PAGE.CSV_FILENAME_PREFIX}_${data?.as_of_date ?? ''}.csv`}
        ref={csvLinkRef}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default ClosingStockReport;
