import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs, { Dayjs } from 'dayjs';
import { StandardButton } from '../../../components/Common';
import DateRangeFilter from '../../../components/mainDashboard/DateRangeFilter/DateRangeFilter';
import { ReusableTable, TableColumn } from '../../../components/PharmaTable';
import CommonModal from '../../../components/CommonModal/CommonModal';
import { formatCurrency, formatWholeCurrency } from '../../../utils/reportFormat';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { decorateInvoiceNumber, invoiceLookupKey } from '../../../utils/invoiceNumberPreview';
import { selectOrganization } from '../../../redux/slices/orgSlice';
import { SALES_HISTORY_LABELS } from '../../../config/label/SalesHistory.labels';
import { SALES_RETURNS_LOG_LABELS as L } from '../../../config/label/SalesReturnsLog.labels';
import { SALES_RETURNS_LOG_CONSTANTS as C } from '../../../config/constants/SalesReturnsLog.constants';
import { SALES_PAGE_CONSTANTS } from '../../../config/constants/SalesPage.constants';
import {
  useListSalesReturnsQuery,
  useGetSalesReturnDetailsQuery,
  SalesReturnRow,
} from '../../../redux/slices/salesApi';

// Sales module dates render as "DD MMM YYYY" (see CLAUDE.md) so this tab matches the
// Invoices tab beside it. Parsed in LOCAL time — no UTC day shift.
const displayDate = (value: string | null | undefined): string => {
  if (!value) return L.EMPTY_VALUE;
  const d = dayjs(value);
  return d.isValid() ? d.format(C.DISPLAY_DATE_FORMAT) : L.EMPTY_VALUE;
};

// Counts and money read right-aligned here AND in the preview dialog, so the two never
// disagree (ReusableTable body cells are left-aligned unless the cell content says otherwise;
// the header follows via the column's headerAlign).
const numericSx = { fontSize: 14, textAlign: 'right' } as const;

const linkSx = {
  fontSize: 14,
  fontWeight: 600,
  color: '#5C17E5',
  cursor: 'pointer',
  '&:hover': { textDecoration: 'underline' },
} as const;

const SalesReturnsLog: React.FC = () => {
  const navigate = useNavigate();
  const organization = useSelector(selectOrganization);
  // With the org's custom invoice-number scheme on, invoice_number is a free-form
  // string shown verbatim (never parsed as a number).
  const schemeEnabled = !!organization?.invoice_number_enabled;

  // ---- Filters (server-side search + date range, client-side pagination) ----
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      C.SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput]);

  // The Invoice column DISPLAYS a legacy bare number as "INV123" (decorateInvoiceNumber) while
  // the backend matches the STORED value, so the displayed label is mapped back before it is
  // sent. invoiceLookupKey is the exact inverse of the decoration and only touches that shape,
  // so the other two things this one box searches — return_number ("CRN-000042") and customer
  // name ("Invicta", "RB Pharma") — travel verbatim.
  const searchTerm = invoiceLookupKey(debouncedSearch, schemeEnabled);

  const [startDate, endDate] = dateRange;
  const listArgs = useMemo(
    () => ({
      limit: C.LOG_FETCH_LIMIT,
      offset: 0,
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(startDate ? { start_date: startDate.format(C.REQUEST_DATE_FORMAT) } : {}),
      ...(endDate ? { end_date: endDate.format(C.REQUEST_DATE_FORMAT) } : {}),
    }),
    [searchTerm, startDate, endDate],
  );

  const { data, isLoading, isFetching, error } = useListSalesReturnsQuery(listArgs);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  // Reset button reflects the IMMEDIATE input, so it appears the instant you type.
  const hasFilters = !!searchInput || !!startDate || !!endDate;
  // Empty-state copy must match what was actually QUERIED (debouncedSearch), or an empty
  // UNFILTERED list would briefly read "No returns match your filters" during the debounce.
  const hasActiveFilters = !!debouncedSearch || !!startDate || !!endDate;
  const clearFilters = () => {
    setSearchInput('');
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  // ---- Details modal ----
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const {
    data: details,
    isFetching: isDetailsLoading,
    error: detailsError,
  } = useGetSalesReturnDetailsQuery(
    { sales_return_id: detailsId as number },
    { skip: detailsId == null },
  );

  // There is no id-addressable invoice route — the receipt page opens from location state.
  const openOriginalInvoice = (row: Pick<SalesReturnRow, 'invoice_id' | 'invoice_number' | 'customer_name'>) => {
    navigate(SALES_PAGE_CONSTANTS.ROUTE_SALES_RECEIPT, {
      state: {
        isReturnDetailsMode: true,
        invoiceId: row.invoice_id,
        invoiceNumber: decorateInvoiceNumber(row.invoice_number, schemeEnabled),
        customerName: row.customer_name ?? '',
      },
    });
  };

  const invoiceLabel = (row: SalesReturnRow) =>
    decorateInvoiceNumber(row.invoice_number, schemeEnabled) || `#${row.invoice_id}`;

  const columns: TableColumn<SalesReturnRow>[] = [
    {
      key: 'return_number',
      header: L.TABLE.RETURN_ID,
      sortable: false,
      render: (r) => (
        <Typography onClick={() => setDetailsId(r.sales_return_id)} sx={linkSx}>
          {r.return_number ?? `#${r.sales_return_id}`}
        </Typography>
      ),
    },
    {
      key: 'return_date',
      header: L.TABLE.DATE,
      sortable: false,
      render: (r) => <Typography sx={{ fontSize: 14 }}>{displayDate(r.return_date)}</Typography>,
    },
    {
      key: 'invoice_number',
      header: L.TABLE.INVOICE,
      sortable: false,
      render: (r) => (
        <Typography onClick={() => openOriginalInvoice(r)} sx={linkSx}>
          {invoiceLabel(r)}
        </Typography>
      ),
    },
    {
      key: 'customer_name',
      header: L.TABLE.CUSTOMER,
      sortable: false,
      render: (r) => (
        <Typography sx={{ fontSize: 14 }}>{r.customer_name || L.EMPTY_VALUE}</Typography>
      ),
    },
    {
      key: 'line_count',
      header: L.TABLE.ITEMS,
      sortable: false,
      columnWidth: '80px',
      headerAlign: 'right',
      render: (r) => <Typography sx={numericSx}>{r.line_count}</Typography>,
    },
    {
      key: 'units_count',
      header: L.TABLE.UNITS,
      sortable: false,
      columnWidth: '80px',
      headerAlign: 'right',
      render: (r) => <Typography sx={numericSx}>{r.units_count}</Typography>,
    },
    {
      key: 'total_amount',
      header: L.TABLE.REFUND,
      sortable: false,
      columnWidth: '130px',
      headerAlign: 'right',
      render: (r) => (
        <Typography sx={{ ...numericSx, fontWeight: 600 }}>
          {r.total_amount != null ? formatWholeCurrency(r.total_amount) : L.EMPTY_VALUE}
        </Typography>
      ),
    },
    {
      key: 'created_by',
      header: L.TABLE.RETURNED_BY,
      sortable: false,
      render: (r) => <Typography sx={{ fontSize: 14 }}>{r.created_by}</Typography>,
    },
  ];

  const detailField = (label: string, value: React.ReactNode) => (
    <Box key={label}>
      <Typography sx={{ fontSize: '12px', color: '#728197' }}>{label}</Typography>
      <Typography sx={{ fontSize: '14px', fontWeight: 500 }} component="div">
        {value || L.EMPTY_VALUE}
      </Typography>
    </Box>
  );

  const lineHeaderSx = {
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 600,
    fontSize: '13px',
    bgcolor: '#F9FAFB',
  } as const;

  const detailsUnits = details?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  // Both refund figures in this dialog come from the SERVER header so they can never disagree:
  // editSale's recalcSalesReturnHeader rewrites total_amount, which a client-side line sum
  // would drift from. The line sum is only a fallback for a null header total.
  const detailsRefund =
    details?.total_amount ??
    details?.lines.reduce((sum, line) => sum + (line.refund_amount ?? 0), 0) ??
    0;

  return (
    <Box>
      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          flexWrap: 'wrap',
          mb: 3,
          bgcolor: '#F6F8FB',
          borderRadius: '1rem',
          border: '0.0625rem solid #E6ECF5',
          p: '0.75rem',
        }}
      >
        <TextField
          placeholder={L.SEARCH_PLACEHOLDER}
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setCurrentPage(1);
          }}
          InputProps={{
            startAdornment: !searchInput.trim() ? (
              <InputAdornment position="start" sx={{ marginRight: '0px' }}>
                <SearchIcon sx={{ color: '#8A99AF', fontSize: '1.5rem' }} />
              </InputAdornment>
            ) : null,
          }}
          sx={{
            width: '37.5rem', // 600px — matches the Invoices tab search
            '& .MuiOutlinedInput-root': {
              height: '2.5rem',
              borderRadius: '0.75rem',
              backgroundColor: '#fff',
              boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none', display: 'none' },
            },
            '& .MuiInputBase-input': { padding: '10px 14px', paddingLeft: '6px' },
            '& .MuiOutlinedInput-input::placeholder': {
              fontSize: '16px',
              color: '#9CA3AF',
              opacity: 1,
            },
          }}
        />
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange(range);
            setCurrentPage(1);
          }}
        />
        {hasFilters && (
          <StandardButton
            onClick={clearFilters}
            variant="secondary"
            size="medium"
            sx={{
              minWidth: 160,
              height: '40px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #D1D5DB',
              color: '#1A212B',
              fontWeight: 500,
              '&:hover': { backgroundColor: '#E0E0E0', border: '1px solid #D1D5DB' },
            }}
          >
            {SALES_HISTORY_LABELS.FILTER_RESET}
          </StandardButton>
        )}
      </Box>

      {/* Table — the full-block spinner is for the FIRST load only. A refetch (debounced
          search keystroke, date change) keeps the table mounted and just dims it behind a
          slim indeterminate bar, so the list never blanks out or jumps mid-typing. */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2, color: '#728197' }}>
            {L.LOADING}
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Typography variant="body2" sx={{ color: '#EF4444' }}>
            {extractErrorMessage(error, L.LOAD_FAILED)}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }} aria-busy={isFetching}>
          {isFetching && (
            <LinearProgress
              sx={{
                position: 'absolute', // absolute => zero layout shift between the two states
                top: 0,
                left: 0,
                right: 0,
                height: '0.1875rem',
                borderRadius: '0.1875rem',
                zIndex: 1,
                bgcolor: 'transparent',
                '& .MuiLinearProgress-bar': { bgcolor: '#5C17E5' },
              }}
            />
          )}
          <Box
            sx={{
              opacity: isFetching ? 0.55 : 1,
              pointerEvents: isFetching ? 'none' : 'auto',
              transition: 'opacity 150ms ease',
            }}
          >
            <ReusableTable<SalesReturnRow>
              columns={columns}
              data={rows}
              selectedRows={[]}
              setSelectedRows={() => { }}
              emptyMessage={hasActiveFilters ? L.EMPTY_FILTERED : L.EMPTY}
              searchAndFilterConfig={{ filterOptions: [] }}
              currentSearchTerm=""
              onSearchChange={() => { }}
              showFilters={false}
              onShowFiltersToggle={() => { }}
              currentFilterKey=""
              onFilterSelect={() => { }}
              currentFilter={{}}
              totalRows={rows.length}
              rowsPerPage={C.ROWS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onSortRequest={() => { }}
              sortConfig={{ key: '', direction: 'asc' }}
            />
          </Box>
        </Box>
      )}
      {/* Stays put during a refetch — hiding it would shift the layout back and forth. */}
      {!isLoading && !error && total > rows.length && (
        <Typography sx={{ fontSize: '12px', color: '#728197', mt: 1 }}>
          {L.TRUNCATED(rows.length, total)}
        </Typography>
      )}

      {/* Return preview */}
      <CommonModal
        open={detailsId != null}
        onClose={() => setDetailsId(null)}
        title={L.DETAILS_MODAL.TITLE}
        maxWidth="56.25rem"
        content={
          isDetailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                {L.DETAILS_MODAL.LOADING}
              </Typography>
            </Box>
          ) : detailsError ? (
            <Typography color="error" sx={{ p: 2 }}>
              {extractErrorMessage(detailsError, L.DETAILS_MODAL.FAILED)}
            </Typography>
          ) : details ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 2,
                }}
              >
                {detailField(
                  L.DETAILS_MODAL.RETURN_ID,
                  details.return_number ?? `#${details.sales_return_id}`,
                )}
                {detailField(L.DETAILS_MODAL.DATE, displayDate(details.return_date))}
                {detailField(
                  L.DETAILS_MODAL.INVOICE,
                  <Typography
                    component="span"
                    onClick={() => openOriginalInvoice(details)}
                    sx={linkSx}
                  >
                    {invoiceLabel(details)}
                  </Typography>,
                )}
                {detailField(L.DETAILS_MODAL.CUSTOMER, details.customer_name)}
                {detailField(L.DETAILS_MODAL.RETURNED_BY, details.created_by)}
                {detailField(L.DETAILS_MODAL.REFUND_METHOD, details.refund_method)}
                {detailField(L.DETAILS_MODAL.STATUS, details.return_status)}
                {detailField(
                  L.DETAILS_MODAL.TOTAL_REFUND,
                  details.total_amount != null ? formatCurrency(details.total_amount) : null,
                )}
                {detailField(L.DETAILS_MODAL.REASON, details.reason)}
                {detailField(L.DETAILS_MODAL.NOTES, details.notes)}
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={lineHeaderSx}>{L.DETAILS_MODAL.LINES.PRODUCT}</TableCell>
                    <TableCell sx={lineHeaderSx}>{L.DETAILS_MODAL.LINES.BATCH}</TableCell>
                    <TableCell align="right" sx={lineHeaderSx}>
                      {L.DETAILS_MODAL.LINES.QTY}
                    </TableCell>
                    <TableCell align="right" sx={lineHeaderSx}>
                      {L.DETAILS_MODAL.LINES.REFUND}
                    </TableCell>
                    <TableCell sx={lineHeaderSx}>{L.DETAILS_MODAL.LINES.RESTOCK}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell sx={{ fontSize: '13px' }}>
                        {line.product_name || L.EMPTY_VALUE}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>{line.batch_number}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '14px', fontWeight: 700 }}>
                        {line.quantity}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '13px' }}>
                        {line.refund_amount != null
                          ? formatCurrency(line.refund_amount)
                          : L.EMPTY_VALUE}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>{line.restock_action}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ fontSize: '13px', fontWeight: 600, borderBottom: 'none' }}>
                      {L.DETAILS_MODAL.TOTAL_ROW}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '14px', fontWeight: 700, borderBottom: 'none' }}>
                      {L.DETAILS_MODAL.TOTAL_UNITS(detailsUnits)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 700, borderBottom: 'none' }}>
                      {formatCurrency(detailsRefund)}
                    </TableCell>
                    <TableCell sx={{ borderBottom: 'none' }} />
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          ) : null
        }
        actionButtons={
          details ? (
            <StandardButton
              variant="secondary"
              size="medium"
              onClick={() => openOriginalInvoice(details)}
            >
              {L.DETAILS_MODAL.VIEW_INVOICE}
            </StandardButton>
          ) : undefined
        }
      />
    </Box>
  );
};

export default SalesReturnsLog;
