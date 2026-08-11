import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Alert,
  Chip,
  Snackbar,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { StandardButton } from '../../../components/Common';
import { ReusableTable, TableColumn } from '../../../components/PharmaTable';
import ConfirmationDialog from '../../../components/DeleteDialogue/ConfirmationDialog';
import { formatReportDate, formatCurrency } from '../../../utils/reportFormat';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { PURCHASE_RETURN_LABELS } from '../../../config/label/PurchaseReturn.labels';
import {
  PURCHASE_RETURN_ROUTES,
  PURCHASE_RETURN_CONSTANTS,
  GST_TREATMENT_OPTIONS,
  VALUE_BASIS_OPTIONS,
  SETTLEMENT_MODE_OPTIONS,
  SETTLEMENT_MODE_TEXT,
  RETURN_STATUS_META,
} from '../../../config/constants/PurchaseReturn.constants';
import {
  useSubmitReturnMutation,
  GstTreatment,
  ValueBasis,
  SettlementMode,
  SubmitReturnResponse,
} from '../../../redux/slices/supplierReturnsApi';
import { PurchaseReturnSelectionState } from './PurchaseReturn';

const L = PURCHASE_RETURN_LABELS.DETAILS;

type SelectedLine = PurchaseReturnSelectionState['lines'][number];

const optionGroupSx = {
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    px: 3,
    height: 40,
    fontFamily: "'Lexend', sans-serif",
    '&.Mui-selected': { backgroundColor: '#EDE4FD', color: '#5C17E5', fontWeight: 600 },
  },
} as const;

const PurchaseReturnDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectionState = location.state as PurchaseReturnSelectionState | null;
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!selectionState || !selectionState.lines?.length) {
      navigate(PURCHASE_RETURN_ROUTES.LANDING, { replace: true });
    }
  }, [selectionState, navigate]);

  const [gstTreatment, setGstTreatment] = useState<GstTreatment>('WITH_GST');
  const [valueBasis, setValueBasis] = useState<ValueBasis>('PURCHASE_PRICE');
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('CREDIT_NOTE');
  const [settlementReference, setSettlementReference] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<SubmitReturnResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const [submitReturn, { isLoading: isSubmitting }] = useSubmitReturnMutation();

  // One idempotency key per details-page entry: a retried/duplicated submit with
  // the same key is answered by the backend with the original result (200) instead
  // of creating a second return. "Start new return" remounts this page → new key.
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const lines: SelectedLine[] = selectionState?.lines ?? [];
  const supplier = selectionState?.supplier;

  const receiptRefs = useMemo(
    () =>
      Array.from(
        new Set(
          lines
            .map((l) => l.batch.supplier_invoice_number || l.batch.po_number)
            .filter((r): r is string => !!r),
        ),
      ),
    [lines],
  );

  // Client-side ESTIMATES only — the server recomputes all money at finalize.
  // The batch listing exposes no GST rate, so GST is shown as "computed at finalize".
  const unitValue = (line: SelectedLine): number | null =>
    valueBasis === 'PURCHASE_PRICE' ? line.batch.purchase_price_per_unit : line.batch.mrp;
  const lineTaxable = (line: SelectedLine): number | null => {
    const unit = unitValue(line);
    return unit == null ? null : Math.round(unit * line.quantity * 100) / 100;
  };

  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);
  const estimatedTaxable = lines.reduce((sum, l) => sum + (lineTaxable(l) ?? 0), 0);
  const hasMissingPurchasePrice =
    valueBasis === 'PURCHASE_PRICE' && lines.some((l) => l.batch.purchase_price_per_unit == null);
  const withGst = gstTreatment === 'WITH_GST';

  const canFinalize =
    !isSubmitting &&
    !hasMissingPurchasePrice &&
    (settlementMode !== 'UPI' || settlementReference.trim().length > 0);

  const columns: TableColumn<SelectedLine>[] = [
    {
      key: 'product',
      header: L.TABLE.PRODUCT,
      sortable: false,
      render: (l) => (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{l.batch.product_name}</Typography>
          <Typography sx={{ fontSize: 12, color: '#728197' }}>
            {[l.batch.type, l.batch.brand_name].filter(Boolean).join(' · ')}
          </Typography>
        </>
      ),
    },
    {
      key: 'batch',
      header: L.TABLE.BATCH,
      sortable: false,
      render: (l) => <Typography sx={{ fontSize: 14 }}>{l.batch.batch_number}</Typography>,
    },
    {
      key: 'expiry',
      header: L.TABLE.EXPIRY,
      sortable: false,
      render: (l) => (
        <Typography sx={{ fontSize: 14 }}>{formatReportDate(l.batch.expiry_date)}</Typography>
      ),
    },
    {
      key: 'quantity',
      header: L.TABLE.RETURN_QTY,
      sortable: false,
      render: (l) => <Typography sx={{ fontSize: 14 }}>{l.quantity}</Typography>,
    },
    {
      key: 'unit_value',
      header: L.TABLE.UNIT_VALUE,
      sortable: false,
      render: (l) => {
        const unit = unitValue(l);
        return <Typography sx={{ fontSize: 14 }}>{unit != null ? unit.toFixed(2) : '—'}</Typography>;
      },
    },
    {
      key: 'taxable',
      header: L.TABLE.TAXABLE,
      sortable: false,
      render: (l) => {
        const taxable = lineTaxable(l);
        return (
          <Typography sx={{ fontSize: 14 }}>{taxable != null ? taxable.toFixed(2) : '—'}</Typography>
        );
      },
    },
    {
      key: 'gst',
      header: L.TABLE.GST,
      sortable: false,
      render: () =>
        withGst ? (
          <Typography sx={{ fontSize: 13, color: '#728197', fontStyle: 'italic' }}>
            {L.GST_AT_FINALIZE}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: 14 }}>0.00</Typography>
        ),
    },
    {
      key: 'line_total',
      header: L.TABLE.LINE_TOTAL,
      sortable: false,
      render: (l) => {
        const taxable = lineTaxable(l);
        return (
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {taxable != null ? `${taxable.toFixed(2)}${withGst ? '*' : ''}` : '—'}
          </Typography>
        );
      },
    },
  ];

  const handleFinalize = async () => {
    if (isSubmitting) return; // double-submit guard
    if (!supplier) return;
    try {
      const response = await submitReturn({
        supplier_id: supplier.id,
        idempotency_key: idempotencyKeyRef.current,
        gst_treatment: gstTreatment,
        value_basis: valueBasis,
        settlement_mode: settlementMode,
        ...(settlementMode !== 'CREDIT_NOTE' && settlementReference.trim()
          ? { settlement_reference: settlementReference.trim() }
          : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        lines: lines.map((l) => ({ batch_id: l.batch.batch_id, quantity: l.quantity })),
      }).unwrap();
      setIsConfirmOpen(false);
      setResult(response);
    } catch (err) {
      // 409s (insufficient stock / supplier mismatch / no purchase price) surface here.
      setIsConfirmOpen(false);
      setSnackbar({ open: true, message: extractErrorMessage(err, L.SUBMIT_FAILED) });
    }
  };

  if (!selectionState || !supplier) {
    return null;
  }

  // ---- Success view ----
  if (result) {
    const statusMeta = RETURN_STATUS_META[result.return_status];
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3, maxWidth: '720px' }}>
        <Alert severity="success" sx={{ borderRadius: '12px', fontSize: '15px', fontWeight: 600 }}>
          {L.SUCCESS.TITLE}
        </Alert>
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {[
            [L.SUCCESS.RETURN_NUMBER, result.return_number],
            [L.SUCCESS.SUPPLIER, supplier.name],
            [L.SUCCESS.LINES_UNITS, `${lines.length} / ${totalUnits}`],
            [L.SUCCESS.TAXABLE, formatCurrency(result.totals.taxable_value)],
            ...(result.totals.cgst_amount || result.totals.sgst_amount
              ? [
                  [L.SUCCESS.CGST, formatCurrency(result.totals.cgst_amount)],
                  [L.SUCCESS.SGST, formatCurrency(result.totals.sgst_amount)],
                ]
              : []),
            [L.SUCCESS.TOTAL, formatCurrency(result.totals.total_amount)],
            [L.SUCCESS.SETTLEMENT, SETTLEMENT_MODE_TEXT[settlementMode]],
          ].map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 14, color: '#728197' }}>{label}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{value}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 14, color: '#728197' }}>{L.SUCCESS.STATUS}</Typography>
            <Chip
              label={statusMeta.label}
              size="small"
              sx={{ backgroundColor: statusMeta.bg, color: statusMeta.color, fontWeight: 600, fontSize: 12 }}
            />
          </Box>
        </Box>
        {result.credit && (
          <Alert severity="info" sx={{ borderRadius: '12px' }}>
            {result.credit.new_balance != null
              ? L.SUCCESS.CREDIT_BANNER(formatCurrency(result.credit.new_balance))
              : L.SUCCESS.CREDIT_BANNER_NO_BALANCE}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <StandardButton
            variant="secondary"
            size="large"
            onClick={() => navigate(PURCHASE_RETURN_ROUTES.LOG)}
          >
            {L.SUCCESS.VIEW_LOG}
          </StandardButton>
          <StandardButton
            variant="primary"
            size="large"
            onClick={() => navigate(PURCHASE_RETURN_ROUTES.LANDING)}
          >
            {L.SUCCESS.START_NEW}
          </StandardButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
      <Typography variant="h4" fontWeight={700}>
        {L.TITLE}
      </Typography>

      {/* Read-only summary */}
      <Box
        sx={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          backgroundColor: '#F6F8FB',
          border: '1px solid #E6ECF5',
          borderRadius: '16px',
          p: '16px',
        }}
      >
        {[
          [L.SUMMARY.SUPPLIER, supplier.name],
          [L.SUMMARY.RECEIPTS, receiptRefs.length ? receiptRefs.join(', ') : '—'],
          [L.SUMMARY.RETURNED_BY, user?.username ?? '—'],
        ].map(([label, value]) => (
          <Box key={label}>
            <Typography sx={{ fontSize: '12px', color: '#728197', mb: 0.5 }}>{label}</Typography>
            <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>{value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Lines */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #E5E7EB',
        }}
      >
        <ReusableTable<SelectedLine>
          columns={columns}
          data={lines}
          selectedRows={[]}
          setSelectedRows={() => { }}
          emptyMessage=""
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => { }}
          showFilters={false}
          onShowFiltersToggle={() => { }}
          currentFilterKey=""
          onFilterSelect={() => { }}
          currentFilter={{}}
          totalRows={lines.length}
          rowsPerPage={PURCHASE_RETURN_CONSTANTS.ROWS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={() => { }}
          sortConfig={{ key: '', direction: 'asc' }}
        />
        {withGst && (
          <Typography sx={{ fontSize: '12px', color: '#728197', mt: 1, fontStyle: 'italic' }}>
            * {L.ESTIMATED_NOTE} {L.GST_AT_FINALIZE}.
          </Typography>
        )}
      </Box>

      {/* Options */}
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#728197' }}>
            {L.OPTIONS.GST_TREATMENT}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={gstTreatment}
            onChange={(_e, v) => v && setGstTreatment(v)}
            sx={optionGroupSx}
          >
            {GST_TREATMENT_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#728197' }}>{L.OPTIONS.VALUE_BASIS}</Typography>
          <ToggleButtonGroup
            exclusive
            value={valueBasis}
            onChange={(_e, v) => v && setValueBasis(v)}
            sx={optionGroupSx}
          >
            {VALUE_BASIS_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#728197' }}>
            {L.OPTIONS.SETTLEMENT_MODE}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={settlementMode}
            onChange={(_e, v) => v && setSettlementMode(v)}
            sx={optionGroupSx}
          >
            {SETTLEMENT_MODE_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>

      {hasMissingPurchasePrice && (
        <Alert severity="warning" sx={{ borderRadius: '12px' }}>
          {L.NO_PURCHASE_PRICE_WARNING}
        </Alert>
      )}

      {/* Settlement tracking fields */}
      {settlementMode === 'UPI' && (
        <TextField
          label={L.UPI_REFERENCE}
          placeholder={L.UPI_REFERENCE_PLACEHOLDER}
          value={settlementReference}
          onChange={(e) => setSettlementReference(e.target.value)}
          required
          sx={{ maxWidth: '480px' }}
        />
      )}
      {settlementMode === 'CASH' && (
        <TextField
          label={L.CASH_REFERENCE}
          placeholder={L.CASH_REFERENCE_PLACEHOLDER}
          value={settlementReference}
          onChange={(e) => setSettlementReference(e.target.value)}
          sx={{ maxWidth: '480px' }}
        />
      )}
      {settlementMode === 'CREDIT_NOTE' && (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          {L.CREDIT_NOTE_INFO}
        </Alert>
      )}

      {/* Reason / notes */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label={L.REASON}
          placeholder={L.REASON_PLACEHOLDER}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: PURCHASE_RETURN_CONSTANTS.REASON_MAX_LENGTH }}
          sx={{ flex: 1, minWidth: '280px' }}
        />
        <TextField
          label={L.NOTES}
          placeholder={L.NOTES_PLACEHOLDER}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={1}
          sx={{ flex: 1, minWidth: '280px' }}
        />
      </Box>

      {/* Totals card */}
      <Box sx={{ backgroundColor: '#E0EDFF', borderRadius: '12px', padding: '16px' }}>
        <Typography sx={{ fontSize: '15px', fontWeight: 600, mb: 1.5 }}>
          {L.TOTALS.TITLE}
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
            {L.TOTALS.TAXABLE}
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {hasMissingPurchasePrice ? '—' : formatCurrency(estimatedTaxable)}
          </Typography>
        </Box>
        {withGst && (
          <>
            <Box>
              <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
                {L.TOTALS.CGST}
              </Typography>
              <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>—</Typography>
              <Typography sx={{ fontSize: '11px', color: '#728197' }}>{L.GST_AT_FINALIZE}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
                {L.TOTALS.SGST}
              </Typography>
              <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>—</Typography>
              <Typography sx={{ fontSize: '11px', color: '#728197' }}>{L.GST_AT_FINALIZE}</Typography>
            </Box>
          </>
        )}
        <Box>
          <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
            {L.TOTALS.AMOUNT_OWED}
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {hasMissingPurchasePrice ? '—' : formatCurrency(estimatedTaxable)}
          </Typography>
          {withGst && (
            <Typography sx={{ fontSize: '11px', color: '#728197' }}>
              {L.TOTALS.EXCLUDES_GST}
            </Typography>
          )}
        </Box>
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <StandardButton
          variant="secondary"
          size="large"
          onClick={() => navigate(PURCHASE_RETURN_ROUTES.LANDING)}
        >
          {L.CANCEL}
        </StandardButton>
        <StandardButton
          variant="primary"
          size="large"
          disabled={!canFinalize}
          onClick={() => setIsConfirmOpen(true)}
        >
          {isSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : L.FINALIZE}
        </StandardButton>
      </Box>

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalize}
        title={L.CONFIRM.TITLE}
        message={L.CONFIRM.MESSAGE(lines.length, totalUnits, supplier.name)}
        confirmLabel={L.CONFIRM.CONFIRM_LABEL}
        cancelLabel={L.CONFIRM.CANCEL_LABEL}
        confirmDisabled={isSubmitting}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={PURCHASE_RETURN_CONSTANTS.SNACKBAR.AUTOHIDE_MS}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={PURCHASE_RETURN_CONSTANTS.SNACKBAR.ANCHOR}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity="error"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseReturnDetails;
