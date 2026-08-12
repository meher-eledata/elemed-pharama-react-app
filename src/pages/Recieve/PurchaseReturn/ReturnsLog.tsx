import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { StandardButton, PharmaDatePicker } from '../../../components/Common';
import { ReusableTable, TableColumn } from '../../../components/PharmaTable';
import CommonModal from '../../../components/CommonModal/CommonModal';
import { formatReportDate, formatCurrency } from '../../../utils/reportFormat';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { PURCHASE_RETURN_LABELS } from '../../../config/label/PurchaseReturn.labels';
import {
  PURCHASE_RETURN_ROUTES,
  PURCHASE_RETURN_CONSTANTS,
  RETURN_STATUS_META,
  RETURN_STATUS_FILTER_OPTIONS,
  SETTLEMENT_MODE_TEXT,
} from '../../../config/constants/PurchaseReturn.constants';
import {
  useListReturnsQuery,
  useGetReturnDetailsQuery,
  useRecordCreditReceivedMutation,
  useUploadCreditNoteFileMutation,
  useLazyGetCreditNoteFileLinkQuery,
  useLazyGetCreditNoteFileQuery,
  SupplierReturnRow,
  ReturnStatus,
} from '../../../redux/slices/supplierReturnsApi';
import CreditNoteUpload from './CreditNoteUpload';

const L = PURCHASE_RETURN_LABELS.LOG;

const ReturnsLog: React.FC = () => {
  const navigate = useNavigate();

  // ---- Filters (server-side search/status, client-side pagination) ----
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReturnStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      PURCHASE_RETURN_CONSTANTS.SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput]);

  const listArgs = useMemo(
    () => ({
      limit: PURCHASE_RETURN_CONSTANTS.LOG_FETCH_LIMIT,
      offset: 0,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    }),
    [debouncedSearch, statusFilter],
  );

  const { data, isLoading, isFetching, error } = useListReturnsQuery(listArgs);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  // ---- Snackbar ----
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // ---- Credit-note file view (presigned link, else authenticated blob fallback) ----
  const [triggerFileLink] = useLazyGetCreditNoteFileLinkQuery();
  const [triggerFileBlob] = useLazyGetCreditNoteFileQuery();
  const viewCreditNote = async (supplierReturnId: number) => {
    try {
      const link = await triggerFileLink(supplierReturnId).unwrap();
      if (link?.url) {
        window.open(link.url, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {
      // fall through to the blob fetch
    }
    try {
      const blob = await triggerFileBlob(supplierReturnId).unwrap();
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch {
      setSnackbar({ open: true, message: L.VIEW_FILE_FAILED, severity: 'error' });
    }
  };

  // ---- Record credit modal ----
  const [creditRow, setCreditRow] = useState<SupplierReturnRow | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDate, setCreditDate] = useState<Dayjs | null>(dayjs());
  const [creditReference, setCreditReference] = useState('');
  const [creditNoteFile, setCreditNoteFile] = useState<File | null>(null);
  const [creditError, setCreditError] = useState('');
  const [recordCredit, { isLoading: isRecording }] = useRecordCreditReceivedMutation();
  const [uploadCreditNoteFile, { isLoading: isUploading }] = useUploadCreditNoteFileMutation();

  const openCreditModal = (row: SupplierReturnRow) => {
    setCreditRow(row);
    setCreditAmount(row.total_amount != null ? String(row.total_amount) : '');
    setCreditDate(dayjs());
    setCreditReference('');
    setCreditNoteFile(null);
    setCreditError('');
  };

  const handleRecordCredit = async () => {
    if (!creditRow || isRecording || isUploading) return;
    const amountNum = Number(creditAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setCreditError(L.CREDIT_MODAL.AMOUNT_ERROR);
      return;
    }
    try {
      await recordCredit({
        supplier_return_id: creditRow.supplier_return_id,
        amount: amountNum,
        date: (creditDate ?? dayjs()).format('YYYY-MM-DD'),
        ...(creditReference.trim() ? { reference: creditReference.trim() } : {}),
      }).unwrap();
    } catch (err) {
      setCreditError(extractErrorMessage(err, L.CREDIT_MODAL.FAILED));
      return;
    }
    // Credit is recorded — an attachment failure past this point is NON-FATAL.
    let uploadFailed = false;
    if (creditNoteFile) {
      try {
        await uploadCreditNoteFile({
          supplierReturnId: creditRow.supplier_return_id,
          file: creditNoteFile,
        }).unwrap();
      } catch (uploadError) {
        uploadFailed = true;
      }
    }
    setCreditRow(null);
    setSnackbar(
      uploadFailed
        ? { open: true, message: L.CREDIT_MODAL.UPLOAD_FAILED_NONFATAL, severity: 'warning' }
        : { open: true, message: L.CREDIT_MODAL.SUCCESS, severity: 'success' },
    );
  };

  // ---- Details modal ----
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const {
    data: details,
    isFetching: isDetailsLoading,
    error: detailsError,
  } = useGetReturnDetailsQuery(
    { supplier_return_id: detailsId as number },
    { skip: detailsId == null },
  );

  const columns: TableColumn<SupplierReturnRow>[] = [
    {
      key: 'return_number',
      header: L.TABLE.RETURN_REF,
      sortable: false,
      render: (r) => (
        <Typography
          onClick={() => setDetailsId(r.supplier_return_id)}
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: '#5C17E5',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {r.return_number ?? `#${r.supplier_return_id}`}
        </Typography>
      ),
    },
    {
      key: 'return_date',
      header: L.TABLE.DATE,
      sortable: false,
      render: (r) => (
        <Typography sx={{ fontSize: 14 }}>{formatReportDate(r.return_date)}</Typography>
      ),
    },
    {
      key: 'supplier_name',
      header: L.TABLE.SUPPLIER,
      sortable: false,
      render: (r) => <Typography sx={{ fontSize: 14 }}>{r.supplier_name}</Typography>,
    },
    {
      key: 'lines_units',
      header: L.TABLE.LINES_UNITS,
      sortable: false,
      render: (r) => (
        <Typography sx={{ fontSize: 14 }}>
          {r.line_count} / {r.units_count}
        </Typography>
      ),
    },
    {
      key: 'total_amount',
      header: L.TABLE.AMOUNT,
      sortable: false,
      render: (r) => (
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {r.total_amount != null ? formatCurrency(r.total_amount) : '—'}
        </Typography>
      ),
    },
    {
      key: 'settlement_mode',
      header: L.TABLE.SETTLEMENT,
      sortable: false,
      render: (r) => (
        <Typography sx={{ fontSize: 14 }}>{SETTLEMENT_MODE_TEXT[r.settlement_mode]}</Typography>
      ),
    },
    {
      key: 'return_status',
      header: L.TABLE.STATUS,
      sortable: false,
      render: (r) => {
        const meta = RETURN_STATUS_META[r.return_status];
        return (
          <Chip
            label={meta.label}
            size="small"
            sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 600, fontSize: 12 }}
          />
        );
      },
    },
    {
      key: 'action',
      header: L.TABLE.ACTION,
      sortable: false,
      render: (r) => {
        if (r.return_status === 'AWAITING_CREDIT') {
          return (
            <StandardButton variant="outline" size="small" onClick={() => openCreditModal(r)}>
              {L.RECORD_CREDIT_BUTTON}
            </StandardButton>
          );
        }
        if (r.return_status === 'CREDIT_RECEIVED') {
          return (
            <Typography sx={{ fontSize: 13, color: '#728197' }}>
              {L.CREDIT_RECEIVED_TEXT(
                formatReportDate(r.credit_received_date),
                r.credit_received_reference ?? '',
              )}
            </Typography>
          );
        }
        return (
          <Typography sx={{ fontSize: 13, color: '#728197' }}>
            {L.SETTLED_TEXT(SETTLEMENT_MODE_TEXT[r.settlement_mode])}
          </Typography>
        );
      },
    },
  ];

  const detailField = (label: string, value: React.ReactNode) => (
    <Box key={label}>
      <Typography sx={{ fontSize: '12px', color: '#728197' }}>{label}</Typography>
      <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{value ?? '—'}</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Typography variant="h4" fontWeight={700}>
          {L.TITLE}
        </Typography>
        <StandardButton
          variant="secondary"
          size="medium"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(PURCHASE_RETURN_ROUTES.LANDING)}
        >
          {L.BACK_BUTTON}
        </StandardButton>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          alignItems: 'center',
          flexWrap: 'wrap',
          bgcolor: '#F6F8FB',
          borderRadius: '16px',
          border: '1px solid #E6ECF5',
          p: '12px',
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
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9CA3AF', fontSize: '20px' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: '20rem',
            '& .MuiOutlinedInput-root': {
              height: '2.5rem',
              borderRadius: '12px',
              backgroundColor: '#fff',
              '& fieldset': { border: '1px solid #D1D5DB' },
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#728197' }}>{L.STATUS_FILTER}</Typography>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ALL' | ReturnStatus);
              setCurrentPage(1);
            }}
            sx={{
              width: '13rem',
              height: '2.5rem',
              borderRadius: '12px',
              backgroundColor: '#fff',
              fontSize: '14px',
              '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #D1D5DB' },
            }}
          >
            <MenuItem value="ALL">{L.ALL_STATUSES}</MenuItem>
            {RETURN_STATUS_FILTER_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {RETURN_STATUS_META[s].label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {/* Table */}
      {isLoading || isFetching ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            {L.LOADING}
          </Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">{extractErrorMessage(error, L.LOAD_FAILED)}</Typography>
        </Box>
      ) : (
        <ReusableTable<SupplierReturnRow>
          columns={columns}
          data={rows}
          selectedRows={[]}
          setSelectedRows={() => { }}
          emptyMessage={L.EMPTY}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => { }}
          showFilters={false}
          onShowFiltersToggle={() => { }}
          currentFilterKey=""
          onFilterSelect={() => { }}
          currentFilter={{}}
          totalRows={rows.length}
          rowsPerPage={PURCHASE_RETURN_CONSTANTS.ROWS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={() => { }}
          sortConfig={{ key: '', direction: 'asc' }}
        />
      )}
      {!isLoading && !isFetching && !error && total > rows.length && (
        <Typography sx={{ fontSize: '12px', color: '#728197' }}>
          {L.TRUNCATED(rows.length, total)}
        </Typography>
      )}

      {/* Record credit modal */}
      <CommonModal
        open={creditRow != null}
        onClose={() => setCreditRow(null)}
        title={L.CREDIT_MODAL.TITLE}
        content={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '13px', color: '#728197' }}>
                {L.CREDIT_MODAL.AMOUNT}
              </Typography>
              <TextField
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '13px', color: '#728197' }}>
                {L.CREDIT_MODAL.DATE}
              </Typography>
              <PharmaDatePicker
                value={creditDate}
                onChange={(v) => setCreditDate(v)}
                width={200}
                height={40}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '13px', color: '#728197' }}>
                {L.CREDIT_MODAL.REFERENCE}
              </Typography>
              <TextField
                value={creditReference}
                onChange={(e) => setCreditReference(e.target.value)}
                placeholder={L.CREDIT_MODAL.REFERENCE_PLACEHOLDER}
              />
            </Box>
            {creditRow?.credit_note_file_name && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '13px', color: '#728197' }}>
                  {L.CREDIT_MODAL.EXISTING_FILE}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                    {creditRow.credit_note_file_name}
                  </Typography>
                  <Typography
                    onClick={() => viewCreditNote(creditRow.supplier_return_id)}
                    sx={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5C17E5',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {L.CREDIT_MODAL.VIEW}
                  </Typography>
                </Box>
              </Box>
            )}
            <CreditNoteUpload
              label={
                creditRow?.credit_note_file_name
                  ? L.CREDIT_MODAL.ATTACHMENT_REPLACE
                  : L.CREDIT_MODAL.ATTACHMENT
              }
              file={creditNoteFile}
              onFileSelect={setCreditNoteFile}
            />
            {creditError && (
              <Alert severity="error" sx={{ borderRadius: '8px' }}>
                {creditError}
              </Alert>
            )}
          </Box>
        }
        actionButtons={
          <StandardButton
            variant="primary"
            size="medium"
            onClick={handleRecordCredit}
            disabled={isRecording || isUploading}
          >
            {isRecording || isUploading ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              L.CREDIT_MODAL.SUBMIT
            )}
          </StandardButton>
        }
      />

      {/* Return details modal */}
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
                {detailField(L.TABLE.RETURN_REF, details.return_number ?? `#${details.id}`)}
                {detailField(L.DETAILS_MODAL.DATE, formatReportDate(details.return_date))}
                {detailField(L.TABLE.SUPPLIER, details.supplier_name)}
                {detailField(L.DETAILS_MODAL.RETURNED_BY, details.created_by)}
                {detailField(
                  L.DETAILS_MODAL.GST_TREATMENT,
                  details.gst_treatment === 'WITH_GST' ? 'With GST' : 'Without GST',
                )}
                {detailField(
                  L.DETAILS_MODAL.VALUE_BASIS,
                  details.value_basis === 'PURCHASE_PRICE' ? 'Purchase Price' : 'MRP',
                )}
                {detailField(
                  L.DETAILS_MODAL.SETTLEMENT,
                  SETTLEMENT_MODE_TEXT[details.settlement_mode],
                )}
                {detailField(L.DETAILS_MODAL.REFERENCE, details.settlement_reference)}
                {detailField(
                  L.DETAILS_MODAL.TAXABLE,
                  details.taxable_value != null ? formatCurrency(details.taxable_value) : '—',
                )}
                {detailField(
                  L.DETAILS_MODAL.CGST,
                  details.cgst_amount != null ? formatCurrency(details.cgst_amount) : '—',
                )}
                {detailField(
                  L.DETAILS_MODAL.SGST,
                  details.sgst_amount != null ? formatCurrency(details.sgst_amount) : '—',
                )}
                {detailField(
                  L.DETAILS_MODAL.TOTAL,
                  details.total_amount != null ? formatCurrency(details.total_amount) : '—',
                )}
                {details.reason && detailField(L.DETAILS_MODAL.REASON, details.reason)}
                {details.notes && detailField(L.DETAILS_MODAL.NOTES, details.notes)}
                {details.credit_received_date &&
                  detailField(
                    L.DETAILS_MODAL.CREDIT_RECEIVED,
                    L.CREDIT_RECEIVED_TEXT(
                      formatReportDate(details.credit_received_date),
                      details.credit_received_reference ?? '',
                    ),
                  )}
                {details.credit_note_file_name &&
                  detailField(
                    L.DETAILS_MODAL.CREDIT_NOTE_FILE,
                    <Typography
                      component="span"
                      onClick={() => viewCreditNote(details.supplier_return_id)}
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#5C17E5',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {details.credit_note_file_name}
                    </Typography>,
                  )}
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {[
                      L.DETAILS_MODAL.LINES.PRODUCT,
                      L.DETAILS_MODAL.LINES.BATCH,
                      L.DETAILS_MODAL.LINES.EXPIRY,
                      L.DETAILS_MODAL.LINES.QTY,
                      L.DETAILS_MODAL.LINES.UNIT_VALUE,
                      L.DETAILS_MODAL.LINES.GST_RATE,
                      L.DETAILS_MODAL.LINES.TOTAL,
                    ].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontFamily: "'Lexend', sans-serif",
                          fontWeight: 600,
                          fontSize: '13px',
                          bgcolor: '#F9FAFB',
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell sx={{ fontSize: '13px' }}>{line.product_name}</TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>{line.batch_number}</TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>
                        {formatReportDate(line.expiry_date)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>{line.quantity}</TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>
                        {line.unit_value != null ? line.unit_value.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>
                        {line.gst_rate != null ? `${line.gst_rate}%` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px', fontWeight: 600 }}>
                        {line.total_amount != null ? line.total_amount.toFixed(2) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null
        }
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={PURCHASE_RETURN_CONSTANTS.SNACKBAR.AUTOHIDE_MS}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={PURCHASE_RETURN_CONSTANTS.SNACKBAR.ANCHOR}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReturnsLog;
