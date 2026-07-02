import React, { useState, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
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
import { SUPPLIER_TAX_REPORT_LABELS as L } from '../../config/label/SupplierTaxReport.labels';
import {
  useGetSupplierTaxReportQuery,
  SupplierTaxLevel,
  SupplierTaxReceiptRow,
  SupplierTaxSupplierRow,
} from '../../redux/slices/reportsApi';
import { useGetSuppliersQuery } from '../../redux/slices/masterApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import {
  toNum,
  formatCurrency,
  formatNumber,
  formatCount,
  formatReportDate,
  defaultDateRange,
  csvString,
} from '../../utils/reportFormat';

// Parsed row shapes (numeric-strings parsed to numbers).
interface ReceiptViewRow extends SupplierTaxReceiptRow {
  _id: number;
  taxableN: number;
  discountN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  receiptTotalN: number;
}
interface SupplierViewRow extends SupplierTaxSupplierRow {
  _id: number;
  taxableN: number;
  discountN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  totalWithTaxN: number;
}

const SupplierTaxReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [logDownload] = useLogDownloadMutation();
  const [level, setLevel] = useState<SupplierTaxLevel>('receipt');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [supplierId, setSupplierId] = useState<string>('');

  const [start, end] = dateRange;
  const { data: suppliers } = useGetSuppliersQuery();

  const { data, isLoading, isError, refetch } = useGetSupplierTaxReportQuery(
    {
      start_date: start ? start.format('YYYY-MM-DD') : '',
      end_date: end ? end.format('YYYY-MM-DD') : '',
      level,
      ...(supplierId ? { supplier_id: Number(supplierId) } : {}),
    },
    { skip: !start || !end, refetchOnMountOrArgChange: true }
  );

  const supplierOptions: FilterSelectOption[] = useMemo(
    () => [
      { value: '', label: L.FILTER.SUPPLIER_ALL },
      ...(suppliers || []).map((s) => ({ value: String(s.id), label: s.supplier_name })),
    ],
    [suppliers]
  );

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: level === 'receipt' ? 'receipt_date' : 'totalWithTaxN',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  // Parse rows per level. `data.level` is the discriminant from the backend.
  const receiptRows: ReceiptViewRow[] = useMemo(() => {
    if (!data || data.level !== 'receipt') return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      taxableN: toNum(r.taxable_value),
      discountN: toNum(r.discount),
      cgstN: toNum(r.cgst),
      sgstN: toNum(r.sgst),
      igstN: toNum(r.igst),
      totalTaxN: toNum(r.total_tax),
      receiptTotalN: toNum(r.receipt_total),
    }));
  }, [data]);

  const supplierRows: SupplierViewRow[] = useMemo(() => {
    if (!data || data.level !== 'supplier') return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      taxableN: toNum(r.taxable_value),
      discountN: toNum(r.discount),
      cgstN: toNum(r.cgst),
      sgstN: toNum(r.sgst),
      igstN: toNum(r.igst),
      totalTaxN: toNum(r.total_tax),
      totalWithTaxN: toNum(r.total_with_tax),
    }));
  }, [data]);

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const sortRows = <T,>(arr: T[]) => {
    const { key, direction } = sortConfig;
    return [...arr].sort((a, b) => {
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
  };

  const sortedReceiptRows = useMemo(() => sortRows(receiptRows), [receiptRows, sortConfig]);
  const sortedSupplierRows = useMemo(() => sortRows(supplierRows), [supplierRows, sortConfig]);

  const receiptColumns: TableColumn<ReceiptViewRow>[] = [
    { key: 'receipt_id', header: L.TABLE_RECEIPT.RECEIPT_NUMBER, sortable: true, render: (r) => <CellText>{r.receipt_id}</CellText> },
    { key: 'receipt_date', header: L.TABLE_RECEIPT.RECEIPT_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.receipt_date)}</CellText> },
    { key: 'invoice_number', header: L.TABLE_RECEIPT.INVOICE_NUMBER, sortable: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'supplier_name', header: L.TABLE_RECEIPT.SUPPLIER, sortable: true, render: (r) => <CellText>{r.supplier_name || '-'}</CellText> },
    { key: 'supplier_gst', header: L.TABLE_RECEIPT.GST, sortable: true, render: (r) => <CellText>{r.supplier_gst || '-'}</CellText> },
    { key: 'taxableN', header: L.TABLE_RECEIPT.TAXABLE_VALUE, sortable: true, render: (r) => <CellText>{formatNumber(r.taxableN)}</CellText> },
    { key: 'discountN', header: L.TABLE_RECEIPT.DISCOUNT, sortable: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'cgstN', header: L.TABLE_RECEIPT.CGST, sortable: true, render: (r) => <CellText>{formatNumber(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE_RECEIPT.SGST, sortable: true, render: (r) => <CellText>{formatNumber(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE_RECEIPT.IGST, sortable: true, render: (r) => <CellText>{formatNumber(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE_RECEIPT.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatNumber(r.totalTaxN)}</CellText> },
    { key: 'receiptTotalN', header: L.TABLE_RECEIPT.RECEIPT_TOTAL, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.receiptTotalN)}</CellText> },
  ];

  const supplierColumns: TableColumn<SupplierViewRow>[] = [
    { key: 'supplier_name', header: L.TABLE_SUPPLIER.SUPPLIER, sortable: true, render: (r) => <CellText>{r.supplier_name || '-'}</CellText> },
    { key: 'supplier_gst', header: L.TABLE_SUPPLIER.GST, sortable: true, render: (r) => <CellText>{r.supplier_gst || '-'}</CellText> },
    { key: 'receipt_count', header: L.TABLE_SUPPLIER.RECEIPTS, sortable: true, render: (r) => <CellText>{formatCount(r.receipt_count)}</CellText> },
    { key: 'taxableN', header: L.TABLE_SUPPLIER.TAXABLE_VALUE, sortable: true, render: (r) => <CellText>{formatNumber(r.taxableN)}</CellText> },
    { key: 'discountN', header: L.TABLE_SUPPLIER.DISCOUNT, sortable: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'cgstN', header: L.TABLE_SUPPLIER.CGST, sortable: true, render: (r) => <CellText>{formatNumber(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE_SUPPLIER.SGST, sortable: true, render: (r) => <CellText>{formatNumber(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE_SUPPLIER.IGST, sortable: true, render: (r) => <CellText>{formatNumber(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE_SUPPLIER.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatNumber(r.totalTaxN)}</CellText> },
    { key: 'totalWithTaxN', header: L.TABLE_SUPPLIER.TOTAL_WITH_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalWithTaxN)}</CellText> },
  ];

  const summary = data?.summary;
  const summaryCards = useMemo(
    () => [
      { title: L.SUMMARY.RECEIPTS, value: formatCount(summary?.receipt_count ?? 0) },
      { title: L.SUMMARY.SUPPLIERS, value: formatCount(summary?.supplier_count ?? 0) },
      { title: L.SUMMARY.TOTAL_TAXABLE, value: formatCurrency(toNum(summary?.total_taxable)) },
      { title: L.SUMMARY.TOTAL_DISCOUNT, value: formatCurrency(toNum(summary?.total_discount)) },
      { title: L.SUMMARY.TOTAL_CGST, value: formatCurrency(toNum(summary?.total_cgst)) },
      { title: L.SUMMARY.TOTAL_SGST, value: formatCurrency(toNum(summary?.total_sgst)) },
      { title: L.SUMMARY.TOTAL_IGST, value: formatCurrency(toNum(summary?.total_igst)) },
      { title: L.SUMMARY.TOTAL_TAX, value: formatCurrency(toNum(summary?.total_tax)), accentColor: C.COLORS.PURPLE },
      { title: L.SUMMARY.TOTAL_WITH_TAX, value: formatCurrency(toNum(summary?.total_with_tax)) },
    ],
    [summary]
  );

  const hasRows = level === 'receipt' ? receiptRows.length > 0 : supplierRows.length > 0;
  const totalRows = level === 'receipt' ? sortedReceiptRows.length : sortedSupplierRows.length;

  const csvData = useMemo(() => {
    if (level === 'receipt') {
      return sortedReceiptRows.map((r) => ({
        [L.TABLE_RECEIPT.RECEIPT_NUMBER]: csvString(r.receipt_id),
        [L.TABLE_RECEIPT.RECEIPT_DATE]: formatReportDate(r.receipt_date),
        [L.TABLE_RECEIPT.INVOICE_NUMBER]: csvString(r.invoice_number),
        [L.TABLE_RECEIPT.SUPPLIER]: csvString(r.supplier_name),
        [L.TABLE_RECEIPT.GST]: csvString(r.supplier_gst),
        [`${L.TABLE_RECEIPT.TAXABLE_VALUE} (₹)`]: r.taxableN.toFixed(2),
        [`${L.TABLE_RECEIPT.DISCOUNT} (₹)`]: r.discountN.toFixed(2),
        ['CGST (₹)']: r.cgstN.toFixed(2),
        ['SGST (₹)']: r.sgstN.toFixed(2),
        ['IGST (₹)']: r.igstN.toFixed(2),
        [`${L.TABLE_RECEIPT.TOTAL_TAX} (₹)`]: r.totalTaxN.toFixed(2),
        [`${L.TABLE_RECEIPT.RECEIPT_TOTAL} (₹)`]: r.receiptTotalN.toFixed(2),
      }));
    }
    return sortedSupplierRows.map((r) => ({
      [L.TABLE_SUPPLIER.SUPPLIER]: csvString(r.supplier_name),
      [L.TABLE_SUPPLIER.GST]: csvString(r.supplier_gst),
      [L.TABLE_SUPPLIER.RECEIPTS]: csvString(r.receipt_count),
      [`${L.TABLE_SUPPLIER.TAXABLE_VALUE} (₹)`]: r.taxableN.toFixed(2),
      [`${L.TABLE_SUPPLIER.DISCOUNT} (₹)`]: r.discountN.toFixed(2),
      ['CGST (₹)']: r.cgstN.toFixed(2),
      ['SGST (₹)']: r.sgstN.toFixed(2),
      ['IGST (₹)']: r.igstN.toFixed(2),
      [`${L.TABLE_SUPPLIER.TOTAL_TAX} (₹)`]: r.totalTaxN.toFixed(2),
      [`${L.TABLE_SUPPLIER.TOTAL_WITH_TAX} (₹)`]: r.totalWithTaxN.toFixed(2),
    }));
  }, [level, sortedReceiptRows, sortedSupplierRows]);

  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${level}_${start ? start.format('YYYY-MM-DD') : ''}_${
    end ? end.format('YYYY-MM-DD') : ''
  }.csv`;
  const handleDownloadCsv = () => {
    csvLinkRef.current?.link?.click();
    logDownload({ category: 'report', name: 'Supplier Tax Report', format: 'csv', count: csvData.length }).catch(() => {});
  };

  const handleLevelChange = (newLevel: SupplierTaxLevel) => {
    setLevel(newLevel);
    setCurrentPage(1);
    setSortConfig({
      key: newLevel === 'receipt' ? 'receipt_date' : 'totalWithTaxN',
      direction: C.TABLE.DEFAULT_SORT_DIRECTION,
    });
  };

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={handleDownloadCsv}
        downloadDisabled={!hasRows}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          setCurrentPage(1);
        }}
      >
        <FilterSelect
          label={L.FILTER.SUPPLIER_LABEL}
          value={supplierId}
          options={supplierOptions}
          onChange={(v) => {
            setSupplierId(v);
            setCurrentPage(1);
          }}
          width={220}
        />
      </ReportHeader>

      <ReportSwitcher
        active={level}
        onChange={handleLevelChange}
        options={[
          { value: 'receipt', label: L.LEVEL_TOGGLE.RECEIPT },
          { value: 'supplier', label: L.LEVEL_TOGGLE.SUPPLIER },
        ]}
      />

      {isLoading ? (
        <ReportLoading />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : (
        <>
          {hasRows && <MetricCardGrid cards={summaryCards} />}
          <TableShell>
            {level === 'receipt' ? (
              <ReusableTable
                columns={receiptColumns}
                data={sortedReceiptRows}
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
                totalRows={totalRows}
                rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
              />
            ) : (
              <ReusableTable
                columns={supplierColumns}
                data={sortedSupplierRows}
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
                totalRows={totalRows}
                rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
              />
            )}
          </TableShell>
        </>
      )}

      <CSVLink data={csvData} filename={csvFilename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default SupplierTaxReport;
