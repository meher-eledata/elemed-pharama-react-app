import React, { useState, useMemo, useRef } from 'react';
import { Alert, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { Dayjs } from 'dayjs';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import {
  ReportHeader,
  ReportLoading,
  ReportError,
  ReportSwitcher,
  FilterSelect,
  FilterSelectOption,
  CellText,
  TableShell,
  MetricCardGrid,
  BackLink,
} from '../../components/AdminReports/ReportShared';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { SCHEDULED_DRUGS_REPORT_LABELS as L } from '../../config/label/ScheduledDrugsReport.labels';
import { PRODUCT_SCHEDULE_OPTIONS, formatSchedule } from '../../config/constants/product.constants';
import {
  useGetScheduledDrugsReportQuery,
  ScheduledDrugCode,
  ScheduledDrugsDispensingRow,
  ScheduledDrugsReceiptRow,
  ScheduledDrugsBalanceRow,
} from '../../redux/slices/reportsApi';
import { useGetProductsQuery } from '../../redux/slices/masterApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import {
  toNum,
  formatQty,
  formatCount,
  formatReportDate,
  defaultDateRange,
  csvString,
} from '../../utils/reportFormat';

type Tab = 'dispensing' | 'receipts' | 'balances';

interface DispensingRow extends ScheduledDrugsDispensingRow {
  _id: number;
  qtyN: number;
  typeDisplay: string;
}
interface ReceiptRow extends ScheduledDrugsReceiptRow {
  _id: number;
  qtyN: number;
  typeDisplay: string;
}
interface BalanceRow extends ScheduledDrugsBalanceRow {
  _id: number;
  openingN: number;
  inN: number;
  outN: number;
  closingN: number;
}

// Backend rejects 'NONE' — filter options are the 7 real codes only.
const SCHEDULE_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: '', label: L.FILTER.SCHEDULE_ALL },
  ...PRODUCT_SCHEDULE_OPTIONS.filter((o) => o.value !== 'NONE'),
];

const sortRows = <T,>(rows: T[], key: string, direction: 'asc' | 'desc'): T[] =>
  [...rows].sort((a, b) => {
    const av = (a as any)[key];
    const bv = (b as any)[key];
    if (typeof av === 'number' && typeof bv === 'number') {
      return direction === 'asc' ? av - bv : bv - av;
    }
    const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    return direction === 'asc' ? cmp : -cmp;
  });

const ScheduledDrugsReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [logDownload] = useLogDownloadMutation();
  const [tab, setTab] = useState<Tab>('dispensing');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [schedule, setSchedule] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'entry_date',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  const [start, end] = dateRange;
  const { data: products } = useGetProductsQuery();
  const { data, isLoading, isError, refetch } = useGetScheduledDrugsReportQuery(
    {
      start_date: start ? start.format('YYYY-MM-DD') : '',
      end_date: end ? end.format('YYYY-MM-DD') : '',
      ...(schedule ? { schedule: schedule as ScheduledDrugCode } : {}),
      ...(productId ? { product_id: Number(productId) } : {}),
    },
    { skip: !start || !end, refetchOnMountOrArgChange: true }
  );

  const productOptions: FilterSelectOption[] = useMemo(
    () => [
      { value: '', label: L.FILTER.PRODUCT_ALL },
      ...(products || [])
        .filter((p) => p.schedule && p.schedule !== 'NONE')
        .map((p) => ({ value: String(p.product_id), label: p.name })),
    ],
    [products]
  );

  const dispensingRows: DispensingRow[] = useMemo(
    () =>
      (data?.dispensing || []).map((r, i) => ({
        ...r,
        _id: i,
        qtyN: toNum(r.quantity),
        typeDisplay:
          r.entry_type === 'SALES_RETURN' && r.restock_action
            ? `${L.ENTRY_TYPE.SALES_RETURN} (${L.RESTOCK_ACTION[r.restock_action]})`
            : L.ENTRY_TYPE[r.entry_type],
      })),
    [data]
  );
  const receiptRows: ReceiptRow[] = useMemo(
    () =>
      (data?.receipts || []).map((r, i) => ({
        ...r,
        _id: i,
        qtyN: toNum(r.quantity),
        typeDisplay: L.ENTRY_TYPE[r.entry_type],
      })),
    [data]
  );
  const balanceRows: BalanceRow[] = useMemo(
    () =>
      (data?.balances || []).map((r, i) => ({
        ...r,
        _id: i,
        openingN: toNum(r.opening_qty),
        inN: toNum(r.qty_in),
        outN: toNum(r.qty_out),
        closingN: toNum(r.closing_qty),
      })),
    [data]
  );

  const sortedDispensing = useMemo(
    () => sortRows(dispensingRows, sortConfig.key, sortConfig.direction),
    [dispensingRows, sortConfig]
  );
  const sortedReceipts = useMemo(
    () => sortRows(receiptRows, sortConfig.key, sortConfig.direction),
    [receiptRows, sortConfig]
  );
  const sortedBalances = useMemo(
    () => sortRows(balanceRows, sortConfig.key, sortConfig.direction),
    [balanceRows, sortConfig]
  );

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const directionColor = (direction: 'IN' | 'OUT') =>
    direction === 'OUT' ? C.COLORS.NEGATIVE : C.COLORS.POSITIVE;
  const qtyCell = (qtyN: number, direction: 'IN' | 'OUT') => (
    <CellText color={directionColor(direction)} weight={600}>
      {formatQty(qtyN)}
    </CellText>
  );
  const directionCell = (direction: 'IN' | 'OUT') => (
    <CellText color={directionColor(direction)} weight={600}>
      {direction}
    </CellText>
  );

  const dispensingColumns: TableColumn<DispensingRow>[] = [
    { key: 'entry_date', header: L.TABLE.DATE, sortable: true, nowrap: true, render: (r) => <CellText>{formatReportDate(r.entry_date)}</CellText> },
    { key: 'typeDisplay', header: L.TABLE.TYPE, sortable: true, nowrap: true, render: (r) => <CellText>{r.typeDisplay}</CellText> },
    { key: 'document_number', header: L.TABLE.DOC_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.document_number || '-'}</CellText> },
    { key: 'party_name', header: L.TABLE.PATIENT, sortable: true, render: (r) => <CellText>{r.party_name || '-'}</CellText> },
    { key: 'party_address', header: L.TABLE.ADDRESS, sortable: true, render: (r) => <CellText>{r.party_address || '-'}</CellText> },
    { key: 'doctor_name', header: L.TABLE.DOCTOR, sortable: true, render: (r) => <CellText>{r.doctor_name || '-'}</CellText> },
    { key: 'product_name', header: L.TABLE.DRUG, sortable: true, render: (r) => <CellText>{r.product_name || '-'}</CellText> },
    { key: 'schedule', header: L.TABLE.SCHEDULE, sortable: true, nowrap: true, render: (r) => <CellText>{formatSchedule(r.schedule) || '-'}</CellText> },
    { key: 'batch_number', header: L.TABLE.BATCH, sortable: true, nowrap: true, render: (r) => <CellText>{r.batch_number || '-'}</CellText> },
    { key: 'qtyN', header: L.TABLE.QTY, sortable: true, nowrap: true, render: (r) => qtyCell(r.qtyN, r.direction) },
    { key: 'direction', header: L.TABLE.DIRECTION, sortable: true, nowrap: true, render: (r) => directionCell(r.direction) },
  ];
  const receiptColumns: TableColumn<ReceiptRow>[] = [
    { key: 'entry_date', header: L.TABLE.DATE, sortable: true, nowrap: true, render: (r) => <CellText>{formatReportDate(r.entry_date)}</CellText> },
    { key: 'typeDisplay', header: L.TABLE.TYPE, sortable: true, nowrap: true, render: (r) => <CellText>{r.typeDisplay}</CellText> },
    { key: 'document_number', header: L.TABLE.RECEIPT_DOC_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.document_number || '-'}</CellText> },
    { key: 'supplier_name', header: L.TABLE.SUPPLIER, sortable: true, render: (r) => <CellText>{r.supplier_name || '-'}</CellText> },
    { key: 'product_name', header: L.TABLE.DRUG, sortable: true, render: (r) => <CellText>{r.product_name || '-'}</CellText> },
    { key: 'schedule', header: L.TABLE.SCHEDULE, sortable: true, nowrap: true, render: (r) => <CellText>{formatSchedule(r.schedule) || '-'}</CellText> },
    { key: 'batch_number', header: L.TABLE.BATCH, sortable: true, nowrap: true, render: (r) => <CellText>{r.batch_number || '-'}</CellText> },
    { key: 'qtyN', header: L.TABLE.QTY, sortable: true, nowrap: true, render: (r) => qtyCell(r.qtyN, r.direction) },
    { key: 'direction', header: L.TABLE.DIRECTION, sortable: true, nowrap: true, render: (r) => directionCell(r.direction) },
  ];
  const balanceColumns: TableColumn<BalanceRow>[] = [
    { key: 'product_name', header: L.TABLE.DRUG, sortable: true, render: (r) => <CellText>{r.product_name || '-'}</CellText> },
    { key: 'product_code', header: L.TABLE.CODE, sortable: true, nowrap: true, render: (r) => <CellText>{r.product_code || '-'}</CellText> },
    { key: 'schedule', header: L.TABLE.SCHEDULE, sortable: true, nowrap: true, render: (r) => <CellText>{formatSchedule(r.schedule) || '-'}</CellText> },
    { key: 'openingN', header: L.TABLE.OPENING, sortable: true, render: (r) => <CellText>{formatQty(r.openingN)}</CellText> },
    { key: 'inN', header: L.TABLE.IN, sortable: true, render: (r) => <CellText color={C.COLORS.POSITIVE}>{formatQty(r.inN)}</CellText> },
    { key: 'outN', header: L.TABLE.OUT, sortable: true, render: (r) => <CellText color={C.COLORS.NEGATIVE}>{formatQty(r.outN)}</CellText> },
    { key: 'closingN', header: L.TABLE.CLOSING, sortable: true, render: (r) => <CellText weight={700}>{formatQty(r.closingN)}</CellText> },
  ];

  const summary = data?.summary;
  const summaryCards = useMemo(
    () => [
      { title: L.SUMMARY.TOTAL_DISPENSED, value: formatQty(toNum(summary?.total_dispensed_qty)), accentColor: C.COLORS.PURPLE },
      { title: L.SUMMARY.TOTAL_SALES_RETURNED, value: formatQty(toNum(summary?.total_sales_returned_qty)) },
      { title: L.SUMMARY.TOTAL_RECEIVED, value: formatQty(toNum(summary?.total_received_qty)), accentColor: C.COLORS.POSITIVE },
      { title: L.SUMMARY.TOTAL_SUPPLIER_RETURNED, value: formatQty(toNum(summary?.total_supplier_returned_qty)) },
      { title: L.SUMMARY.SCHEDULED_PRODUCTS, value: formatCount(summary?.scheduled_product_count ?? 0) },
    ],
    [summary]
  );
  const unattributedCount = summary?.unattributed_product_count ?? 0;

  // CSV column sets mirror the rendered columns of each tab exactly.
  const csvData = useMemo(() => {
    if (tab === 'dispensing') {
      return sortedDispensing.map((r) => ({
        [L.TABLE.DATE]: formatReportDate(r.entry_date),
        [L.TABLE.TYPE]: r.typeDisplay,
        [L.TABLE.DOC_NUMBER]: csvString(r.document_number),
        [L.TABLE.PATIENT]: csvString(r.party_name),
        [L.TABLE.ADDRESS]: csvString(r.party_address),
        [L.TABLE.DOCTOR]: csvString(r.doctor_name),
        [L.TABLE.DRUG]: csvString(r.product_name),
        [L.TABLE.SCHEDULE]: formatSchedule(r.schedule),
        [L.TABLE.BATCH]: csvString(r.batch_number),
        [L.TABLE.QTY]: r.qtyN.toFixed(2),
        [L.TABLE.DIRECTION]: r.direction,
      }));
    }
    if (tab === 'receipts') {
      return sortedReceipts.map((r) => ({
        [L.TABLE.DATE]: formatReportDate(r.entry_date),
        [L.TABLE.TYPE]: r.typeDisplay,
        [L.TABLE.RECEIPT_DOC_NUMBER]: csvString(r.document_number),
        [L.TABLE.SUPPLIER]: csvString(r.supplier_name),
        [L.TABLE.DRUG]: csvString(r.product_name),
        [L.TABLE.SCHEDULE]: formatSchedule(r.schedule),
        [L.TABLE.BATCH]: csvString(r.batch_number),
        [L.TABLE.QTY]: r.qtyN.toFixed(2),
        [L.TABLE.DIRECTION]: r.direction,
      }));
    }
    return sortedBalances.map((r) => ({
      [L.TABLE.DRUG]: csvString(r.product_name),
      [L.TABLE.CODE]: csvString(r.product_code),
      [L.TABLE.SCHEDULE]: formatSchedule(r.schedule),
      [L.TABLE.OPENING]: r.openingN.toFixed(2),
      [L.TABLE.IN]: r.inN.toFixed(2),
      [L.TABLE.OUT]: r.outN.toFixed(2),
      [L.TABLE.CLOSING]: r.closingN.toFixed(2),
    }));
  }, [tab, sortedDispensing, sortedReceipts, sortedBalances]);

  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${tab}_${start ? start.format('YYYY-MM-DD') : ''}_${
    end ? end.format('YYYY-MM-DD') : ''
  }.csv`;
  const handleDownloadCsv = () => {
    csvLinkRef.current?.link?.click();
    logDownload({
      category: 'report',
      name: `${L.PAGE.DOWNLOAD_LOG_NAME} - ${L.TABS[tab.toUpperCase() as Uppercase<Tab>]}`,
      format: 'csv',
      count: csvData.length,
    }).catch(() => {});
  };

  const tableProps = {
    selectedRows,
    setSelectedRows,
    searchAndFilterConfig: { filterOptions: [] },
    currentSearchTerm: '',
    onSearchChange: () => {},
    showFilters: false,
    onShowFiltersToggle: () => {},
    currentFilterKey: '',
    onFilterSelect: () => {},
    rowsPerPage: C.DEFAULTS.ROWS_PER_PAGE,
    currentPage,
    onPageChange: setCurrentPage,
    onSortRequest: handleSortRequest,
    sortConfig,
  };

  const resetPage = () => setCurrentPage(1);

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={handleDownloadCsv}
        downloadDisabled={!csvData.length}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          resetPage();
        }}
      >
        <FilterSelect
          label={L.FILTER.SCHEDULE_LABEL}
          value={schedule}
          options={SCHEDULE_FILTER_OPTIONS}
          onChange={(v) => {
            setSchedule(v);
            resetPage();
          }}
          width={160}
        />
        <FilterSelect
          label={L.FILTER.PRODUCT_LABEL}
          value={productId}
          options={productOptions}
          onChange={(v) => {
            setProductId(v);
            resetPage();
          }}
          width={220}
        />
      </ReportHeader>

      <ReportSwitcher
        active={tab}
        onChange={(newTab) => {
          setTab(newTab);
          setSortConfig({
            key: newTab === 'balances' ? 'product_name' : 'entry_date',
            direction: C.TABLE.DEFAULT_SORT_DIRECTION,
          });
          resetPage();
        }}
        options={[
          { value: 'dispensing', label: L.TABS.DISPENSING },
          { value: 'receipts', label: L.TABS.RECEIPTS },
          { value: 'balances', label: L.TABS.BALANCES },
        ]}
      />

      {isLoading ? (
        <ReportLoading />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : (
        <>
          {unattributedCount > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {L.UNATTRIBUTED_WARNING.replace('{count}', formatCount(unattributedCount))}
            </Alert>
          )}
          <MetricCardGrid cards={summaryCards} />
          <TableShell>
            {tab === 'dispensing' ? (
              <ReusableTable
                {...tableProps}
                columns={dispensingColumns}
                data={sortedDispensing}
                totalRows={sortedDispensing.length}
                emptyMessage={L.EMPTY.DISPENSING}
              />
            ) : tab === 'receipts' ? (
              <ReusableTable
                {...tableProps}
                columns={receiptColumns}
                data={sortedReceipts}
                totalRows={sortedReceipts.length}
                emptyMessage={L.EMPTY.RECEIPTS}
              />
            ) : (
              <ReusableTable
                {...tableProps}
                columns={balanceColumns}
                data={sortedBalances}
                totalRows={sortedBalances.length}
                emptyMessage={L.EMPTY.BALANCES}
              />
            )}
          </TableShell>
        </>
      )}

      <CSVLink data={csvData} filename={csvFilename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default ScheduledDrugsReport;
