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
  FilterSelect,
  FilterSelectOption,
  CellText,
  TableShell,
  SectionTitle,
  MetricCardGrid,
  BackLink,
} from '../../components/AdminReports/ReportShared';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { SALES_TAX_REPORT_LABELS as L } from '../../config/label/SalesTaxReport.labels';
import {
  useGetSalesTaxReportQuery,
  SalesTaxReportRow,
} from '../../redux/slices/reportsApi';
import { useGetProductsQuery } from '../../redux/slices/masterApi';
import {
  toNum,
  formatCurrency,
  formatNumber,
  formatCount,
  formatPercent,
  formatReportDate,
  defaultDateRange,
  csvString,
} from '../../utils/reportFormat';

interface TaxRow extends SalesTaxReportRow {
  _id: number;
  qtyN: number;
  mrpN: number;
  spN: number;
  taxableN: number;
  cgstRateN: number;
  sgstRateN: number;
  igstRateN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  lineTotalN: number;
}

const SalesTaxReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [productId, setProductId] = useState<string>('');
  const [patientType, setPatientType] = useState<string>('');

  const [start, end] = dateRange;
  const { data: products } = useGetProductsQuery();

  const { data, isLoading, isError, refetch } = useGetSalesTaxReportQuery(
    {
      start_date: start ? start.format('YYYY-MM-DD') : '',
      end_date: end ? end.format('YYYY-MM-DD') : '',
      ...(productId ? { product_id: Number(productId) } : {}),
      ...(patientType !== '' ? { patient_type: Number(patientType) as 0 | 1 } : {}),
    },
    { skip: !start || !end, refetchOnMountOrArgChange: true }
  );

  const productOptions: FilterSelectOption[] = useMemo(
    () => [
      { value: '', label: L.FILTER.PRODUCT_ALL },
      ...(products || []).map((p) => ({ value: String(p.product_id), label: p.name })),
    ],
    [products]
  );
  const patientOptions: FilterSelectOption[] = [
    { value: '', label: L.FILTER.PATIENT_TYPE_ALL },
    { value: '1', label: L.FILTER.PATIENT_TYPE_INPATIENT },
    { value: '0', label: L.FILTER.PATIENT_TYPE_OUTPATIENT },
  ];

  const rows: TaxRow[] = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      qtyN: toNum(r.quantity),
      mrpN: toNum(r.mrp),
      spN: toNum(r.selling_price),
      taxableN: toNum(r.taxable_value),
      cgstRateN: toNum(r.cgst_rate),
      sgstRateN: toNum(r.sgst_rate),
      igstRateN: toNum(r.igst_rate),
      cgstN: toNum(r.cgst_amount),
      sgstN: toNum(r.sgst_amount),
      igstN: toNum(r.igst_amount),
      totalTaxN: toNum(r.total_tax),
      lineTotalN: toNum(r.line_total),
    }));
  }, [data]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'sale_date',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  const sortedRows = useMemo(() => {
    const { key, direction } = sortConfig;
    return [...rows].sort((a, b) => {
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
  }, [rows, sortConfig]);

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const columns: TableColumn<TaxRow>[] = [
    { key: 'invoice_number', header: L.TABLE.INVOICE_NUMBER, sortable: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'sale_date', header: L.TABLE.SALE_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.sale_date)}</CellText> },
    { key: 'product_name', header: L.TABLE.PRODUCT, sortable: true, render: (r) => <CellText>{r.product_name || '-'}</CellText> },
    { key: 'product_code', header: L.TABLE.CODE, sortable: true, render: (r) => <CellText>{r.product_code || '-'}</CellText> },
    { key: 'hsn_code', header: L.TABLE.HSN, sortable: true, render: (r) => <CellText>{r.hsn_code || '-'}</CellText> },
    { key: 'batch_number', header: L.TABLE.BATCH_NUMBER, sortable: true, render: (r) => <CellText>{r.batch_number || '-'}</CellText> },
    { key: 'qtyN', header: L.TABLE.QTY, sortable: true, render: (r) => <CellText>{formatNumber(r.qtyN)}</CellText> },
    { key: 'mrpN', header: L.TABLE.MRP, sortable: true, render: (r) => <CellText>{formatNumber(r.mrpN)}</CellText> },
    { key: 'spN', header: L.TABLE.SP, sortable: true, render: (r) => <CellText>{formatNumber(r.spN)}</CellText> },
    { key: 'taxableN', header: L.TABLE.TAXABLE_VALUE, sortable: true, render: (r) => <CellText>{formatNumber(r.taxableN)}</CellText> },
    { key: 'cgstRateN', header: L.TABLE.CGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.cgstRateN)}</CellText> },
    { key: 'sgstRateN', header: L.TABLE.SGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.sgstRateN)}</CellText> },
    { key: 'igstRateN', header: L.TABLE.IGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.igstRateN)}</CellText> },
    { key: 'cgstN', header: L.TABLE.CGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE.SGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE.IGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatNumber(r.totalTaxN)}</CellText> },
    { key: 'lineTotalN', header: L.TABLE.LINE_TOTAL, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.lineTotalN)}</CellText> },
  ];

  const summary = data?.summary;
  const summaryCards = useMemo(
    () => [
      { title: L.SUMMARY.TOTAL_TAXABLE, value: formatCurrency(toNum(summary?.total_taxable)) },
      { title: L.SUMMARY.TOTAL_CGST, value: formatCurrency(toNum(summary?.total_cgst)) },
      { title: L.SUMMARY.TOTAL_SGST, value: formatCurrency(toNum(summary?.total_sgst)) },
      { title: L.SUMMARY.TOTAL_IGST, value: formatCurrency(toNum(summary?.total_igst)) },
      { title: L.SUMMARY.TOTAL_TAX, value: formatCurrency(toNum(summary?.total_tax)), accentColor: C.COLORS.PURPLE },
      { title: L.SUMMARY.TOTAL_SALES, value: formatCurrency(toNum(summary?.total_sales)) },
      { title: L.SUMMARY.TOTAL_MRP_VALUE, value: formatCurrency(toNum(summary?.total_mrp_value)) },
      { title: L.SUMMARY.LINES, value: formatCount(summary?.line_count ?? 0) },
      { title: L.SUMMARY.PRODUCTS, value: formatCount(summary?.product_count ?? 0) },
      { title: L.SUMMARY.INVOICES, value: formatCount(summary?.invoice_count ?? 0) },
    ],
    [summary]
  );

  const csvData = useMemo(
    () =>
      sortedRows.map((r) => ({
        [L.TABLE.INVOICE_NUMBER]: csvString(r.invoice_number),
        [L.TABLE.SALE_DATE]: formatReportDate(r.sale_date),
        [L.TABLE.PRODUCT]: csvString(r.product_name),
        [L.TABLE.CODE]: csvString(r.product_code),
        [L.TABLE.HSN]: csvString(r.hsn_code),
        [L.TABLE.BATCH_NUMBER]: csvString(r.batch_number),
        [L.TABLE.QTY]: r.qtyN.toFixed(2),
        [`${L.TABLE.MRP} (₹)`]: r.mrpN.toFixed(2),
        [`${L.TABLE.SP} (₹)`]: r.spN.toFixed(2),
        [`${L.TABLE.TAXABLE_VALUE} (₹)`]: r.taxableN.toFixed(2),
        [L.TABLE.CGST_RATE]: r.cgstRateN.toFixed(2),
        [L.TABLE.SGST_RATE]: r.sgstRateN.toFixed(2),
        [L.TABLE.IGST_RATE]: r.igstRateN.toFixed(2),
        ['CGST (₹)']: r.cgstN.toFixed(2),
        ['SGST (₹)']: r.sgstN.toFixed(2),
        ['IGST (₹)']: r.igstN.toFixed(2),
        [`${L.TABLE.TOTAL_TAX} (₹)`]: r.totalTaxN.toFixed(2),
        [`${L.TABLE.LINE_TOTAL} (₹)`]: r.lineTotalN.toFixed(2),
      })),
    [sortedRows]
  );
  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${start ? start.format('YYYY-MM-DD') : ''}_${
    end ? end.format('YYYY-MM-DD') : ''
  }.csv`;
  const handleDownloadCsv = () => csvLinkRef.current?.link?.click();

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={handleDownloadCsv}
        downloadDisabled={!rows.length}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          setCurrentPage(1);
        }}
      >
        <FilterSelect
          label={L.FILTER.PRODUCT_LABEL}
          value={productId}
          options={productOptions}
          onChange={(v) => {
            setProductId(v);
            setCurrentPage(1);
          }}
          width={220}
        />
        <FilterSelect
          label={L.FILTER.PATIENT_TYPE_LABEL}
          value={patientType}
          options={patientOptions}
          onChange={(v) => {
            setPatientType(v);
            setCurrentPage(1);
          }}
          width={180}
        />
      </ReportHeader>

      {isLoading ? (
        <ReportLoading />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : (
        <>
          {rows.length > 0 && (
            <>
              <SectionTitle>{L.SUMMARY.TITLE}</SectionTitle>
              <MetricCardGrid cards={summaryCards} />
            </>
          )}
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
            />
          </TableShell>
        </>
      )}

      <CSVLink data={csvData} filename={csvFilename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default SalesTaxReport;
