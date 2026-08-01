import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { StandardButton, PharmaDatePicker } from '../../components/Common';
import { SUPPLIER_CREDIT_LABELS as L } from '../../config/label/SupplierCredit.labels';
import { extractErrorMessage } from '../../utils/errorUtils';
import { toNum, formatCurrency } from '../../utils/reportFormat';
import { useGetSuppliersQuery, Supplier } from '../../redux/slices/masterApi';
import {
  useListCreditTransactionsQuery,
  useGetSupplierCreditBalanceQuery,
  useAdjustSupplierCreditMutation,
  CreditTransaction,
  CreditDirection,
} from '../../redux/slices/adminCreditApi';

dayjs.extend(utc);
dayjs.extend(timezone);

const IST_TIMEZONE = 'Asia/Kolkata';
const formatIstTime = (value: string): string => {
  if (!value) return '-';
  const d = dayjs.utc(value);
  return d.isValid() ? d.tz(IST_TIMEZONE).format('DD MMM YYYY, hh:mm A') : String(value);
};

// Client-side pagination over one fetched page (cap 500 per the contract).
const ROWS_PER_PAGE = 25;
const FETCH_LIMIT = 500;

const SupplierCredit: React.FC = () => {
  const navigate = useNavigate();

  // ---- Filters ----
  const [filterSupplier, setFilterSupplier] = useState<Supplier | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const { data: suppliers = [] } = useGetSuppliersQuery();

  const listArgs = useMemo(
    () => ({
      persona_type: 'SUPPLIER',
      limit: FETCH_LIMIT,
      offset: 0,
      ...(filterSupplier ? { supplier_id: filterSupplier.id } : {}),
      ...(startDate ? { start_date: startDate.format('YYYY-MM-DD') } : {}),
      ...(endDate ? { end_date: endDate.format('YYYY-MM-DD') } : {}),
    }),
    [filterSupplier, startDate, endDate],
  );

  const { data, isLoading, isFetching, error } = useListCreditTransactionsQuery(listArgs);

  const rows: CreditTransaction[] = data?.rows ?? [];
  const total = data?.total ?? 0;

  // ---- Table ----
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });

  const handleSortRequest = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const relatedRef = (t: CreditTransaction): string => {
    if (t.related_payment_id != null) return `Payment #${t.related_payment_id}`;
    if (t.related_po_id != null) return `PO #${t.related_po_id}`;
    return '-';
  };

  const columns: TableColumn<CreditTransaction>[] = [
    {
      key: 'created_at',
      header: L.TABLE.DATE,
      sortable: true,
      render: (t) => <Typography sx={{ fontSize: 14 }}>{formatIstTime(t.created_at)}</Typography>,
    },
    {
      key: 'supplier_name',
      header: L.TABLE.SUPPLIER,
      sortable: true,
      render: (t) => <Typography sx={{ fontSize: 14 }}>{t.supplier_name || '-'}</Typography>,
    },
    {
      key: 'credit_type',
      header: L.TABLE.TYPE,
      sortable: true,
      render: (t) => <Typography sx={{ fontSize: 14 }}>{t.credit_type || '-'}</Typography>,
    },
    {
      key: 'direction',
      header: L.TABLE.DIRECTION,
      sortable: true,
      render: (t) => {
        const isIn = t.direction === 'IN';
        return (
          <Chip
            label={isIn ? L.DIRECTION.IN : L.DIRECTION.OUT}
            size="small"
            sx={{
              backgroundColor: isIn ? '#E7F6EC' : '#FDECEC',
              color: isIn ? '#137333' : '#C5221F',
              fontWeight: 600,
              fontSize: 12,
            }}
          />
        );
      },
    },
    {
      key: 'amount',
      header: L.TABLE.AMOUNT,
      sortable: true,
      render: (t) => (
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {t.direction === 'IN' ? '+' : '-'}
          {formatCurrency(toNum(t.amount))}
        </Typography>
      ),
    },
    {
      key: 'notes',
      header: L.TABLE.REASON,
      sortable: false,
      render: (t) => <Typography sx={{ fontSize: 14 }}>{t.notes || '-'}</Typography>,
    },
    {
      key: 'created_by',
      header: L.TABLE.BY,
      sortable: true,
      render: (t) => <Typography sx={{ fontSize: 14 }}>{t.created_by || '-'}</Typography>,
    },
    {
      key: 'related',
      header: L.TABLE.RELATED,
      sortable: false,
      render: (t) => <Typography sx={{ fontSize: 14 }}>{relatedRef(t)}</Typography>,
    },
  ];

  const sortedData = useMemo(() => {
    const key = sortConfig.key;
    const dir = sortConfig.direction;
    return [...rows].sort((a, b) => {
      let cmp: number;
      if (key === 'amount') {
        cmp = toNum(a.amount) - toNum(b.amount);
      } else {
        const av = String(a[key as keyof CreditTransaction] ?? '');
        const bv = String(b[key as keyof CreditTransaction] ?? '');
        cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
      }
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortConfig]);

  const clearFilters = () => {
    setFilterSupplier(null);
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  // ---- Snackbar ----
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ---- Adjust dialog ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dlgSupplier, setDlgSupplier] = useState<Supplier | null>(null);
  const [dlgDirection, setDlgDirection] = useState<CreditDirection>('IN');
  const [dlgAmount, setDlgAmount] = useState('');
  const [dlgReason, setDlgReason] = useState('');
  const [formError, setFormError] = useState('');

  const [adjustCredit, { isLoading: isAdjusting }] = useAdjustSupplierCreditMutation();

  const { data: balanceData, isFetching: isBalanceLoading } = useGetSupplierCreditBalanceQuery(
    { supplier_id: dlgSupplier?.id as number },
    { skip: !dlgSupplier },
  );

  const openDialog = () => {
    setDlgSupplier(filterSupplier);
    setDlgDirection('IN');
    setDlgAmount('');
    setDlgReason('');
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isAdjusting) return;
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    const amountNum = Number(dlgAmount);
    if (!dlgSupplier) {
      setFormError(L.DIALOG.VALIDATION.SUPPLIER_REQUIRED);
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setFormError(L.DIALOG.VALIDATION.AMOUNT_REQUIRED);
      return;
    }
    if (!dlgReason.trim()) {
      setFormError(L.DIALOG.VALIDATION.REASON_REQUIRED);
      return;
    }
    setFormError('');
    try {
      await adjustCredit({
        supplier_id: dlgSupplier.id,
        direction: dlgDirection,
        amount: amountNum,
        notes: dlgReason.trim(),
      }).unwrap();
      // Tag invalidation refreshes the table and the dialog balance automatically.
      setDialogOpen(false);
      setSnackbar({ open: true, message: L.DIALOG.SUCCESS, severity: 'success' });
    } catch (err) {
      // Surface backend 400 ('insufficient credit') / 404 messages inline.
      setFormError(extractErrorMessage(err, L.MESSAGES.ERROR));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, minHeight: 'calc(100vh - 200px)', pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {L.PAGE_TITLE}
          </Typography>
          <Typography sx={{ color: '#728197', fontSize: '14px' }}>{L.SUBTITLE}</Typography>
        </Box>
        <StandardButton variant="primary" size="medium" onClick={openDialog} sx={{ minWidth: 160 }}>
          {L.ADJUST_BUTTON}
        </StandardButton>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          bgcolor: '#F6F8FB',
          borderRadius: '16px',
          border: '1px solid #E6ECF5',
          p: '16px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#728197' }}>{L.FILTERS.SUPPLIER}</Typography>
          <Autocomplete<Supplier>
            value={filterSupplier}
            onChange={(_e, v) => {
              setFilterSupplier(v);
              setCurrentPage(1);
            }}
            options={suppliers}
            getOptionLabel={(o) => o.supplier_name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            sx={{ width: 240, '& .MuiOutlinedInput-root': { height: 40, borderRadius: '12px', backgroundColor: '#fff' } }}
            renderInput={(params) => <TextField {...params} placeholder={L.FILTERS.ALL_SUPPLIERS} />}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#728197' }}>{L.FILTERS.START_DATE}</Typography>
          <PharmaDatePicker
            value={startDate}
            onChange={(v) => {
              setStartDate(v);
              setCurrentPage(1);
            }}
            width={200}
            height={40}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#728197' }}>{L.FILTERS.END_DATE}</Typography>
          <PharmaDatePicker
            value={endDate}
            onChange={(v) => {
              setEndDate(v);
              setCurrentPage(1);
            }}
            width={200}
            height={40}
          />
        </Box>
        <StandardButton
          onClick={clearFilters}
          variant="secondary"
          size="medium"
          sx={{ height: 40, minWidth: 140 }}
        >
          {L.FILTERS.RESET}
        </StandardButton>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: '13px', color: '#728197', alignSelf: 'center' }}>
          {L.MESSAGES.TOTAL}: {total}
        </Typography>
      </Box>

      {/* Table */}
      {isLoading || isFetching ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            {L.MESSAGES.LOADING}
          </Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">{extractErrorMessage(error, L.MESSAGES.ERROR)}</Typography>
        </Box>
      ) : (
        <ReusableTable
          columns={columns}
          data={sortedData}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          emptyMessage={L.MESSAGES.EMPTY}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
          currentFilter={{}}
          totalRows={sortedData.length}
          rowsPerPage={ROWS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      )}

      {/* Back */}
      <Button
        variant="contained"
        onClick={() => navigate('/admin')}
        sx={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          backgroundColor: '#5C17E5',
          textTransform: 'none',
          borderRadius: '12px',
          '&:hover': { backgroundColor: '#4a12b8' },
        }}
      >
        {L.BACK_BUTTON}
      </Button>

      {/* Adjust Credit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid #E0E0E0' }}>
          {L.DIALOG.TITLE}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            <Typography sx={{ fontSize: '13px', color: '#728197' }}>{L.DIALOG.SUPPLIER}</Typography>
            <Autocomplete<Supplier>
              value={dlgSupplier}
              onChange={(_e, v) => setDlgSupplier(v)}
              options={suppliers}
              getOptionLabel={(o) => o.supplier_name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} placeholder={L.DIALOG.SUPPLIER_PLACEHOLDER} />}
            />
            {dlgSupplier && (
              <Typography sx={{ fontSize: '13px', color: '#137333', fontWeight: 600 }}>
                {L.DIALOG.AVAILABLE_CREDIT}:{' '}
                {isBalanceLoading
                  ? '...'
                  : formatCurrency(toNum(balanceData?.available_credit ?? 0))}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '13px', color: '#728197' }}>{L.DIALOG.ACTION}</Typography>
            <ToggleButtonGroup
              exclusive
              value={dlgDirection}
              onChange={(_e, v) => v && setDlgDirection(v)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 3 } }}
            >
              <ToggleButton value="IN">{L.DIALOG.ADD_CREDIT}</ToggleButton>
              <ToggleButton value="OUT">{L.DIALOG.SUBTRACT_CREDIT}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '13px', color: '#728197' }}>{L.DIALOG.AMOUNT}</Typography>
            <TextField
              type="number"
              value={dlgAmount}
              onChange={(e) => setDlgAmount(e.target.value)}
              placeholder={L.DIALOG.AMOUNT_PLACEHOLDER}
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '13px', color: '#728197' }}>{L.DIALOG.REASON}</Typography>
            <TextField
              value={dlgReason}
              onChange={(e) => setDlgReason(e.target.value)}
              placeholder={L.DIALOG.REASON_PLACEHOLDER}
              multiline
              minRows={2}
            />
          </Box>

          {formError && (
            <Alert severity="error" sx={{ borderRadius: '8px' }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <StandardButton onClick={closeDialog} variant="secondary" size="medium" disabled={isAdjusting}>
            {L.DIALOG.CANCEL}
          </StandardButton>
          <StandardButton onClick={handleSubmit} variant="primary" size="medium" disabled={isAdjusting}>
            {isAdjusting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : L.DIALOG.SUBMIT}
          </StandardButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default SupplierCredit;
