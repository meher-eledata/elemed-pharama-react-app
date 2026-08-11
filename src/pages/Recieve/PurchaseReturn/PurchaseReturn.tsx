import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { StandardButton } from '../../../components/Common';
import { ReusableTable, TableColumn } from '../../../components/PharmaTable';
import { formatReportDate } from '../../../utils/reportFormat';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { PURCHASE_RETURN_LABELS } from '../../../config/label/PurchaseReturn.labels';
import {
  PURCHASE_RETURN_ROUTES,
  PURCHASE_RETURN_CONSTANTS,
  EXPIRY_FILTER_OPTIONS,
  DEFAULT_EXPIRY_FILTER,
  EXPIRY_STATUS_META,
  ExpiryFilterValue,
} from '../../../config/constants/PurchaseReturn.constants';
import {
  useGetReturnableBatchesQuery,
  ReturnableBatch,
} from '../../../redux/slices/supplierReturnsApi';

const L = PURCHASE_RETURN_LABELS.LANDING;

export interface PurchaseReturnSelectionState {
  supplier: { id: number; name: string };
  lines: Array<{ batch: ReturnableBatch; quantity: number }>;
}

const filterSelectSx = {
  width: '13rem',
  height: '2.5rem',
  borderRadius: '12px',
  backgroundColor: '#fff',
  fontSize: '14px',
  '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #D1D5DB' },
};

const PurchaseReturn: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetReturnableBatchesQuery();
  const batches = data?.batches ?? [];

  // ---- Filters ----
  const [productSearch, setProductSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilterValue>(DEFAULT_EXPIRY_FILTER);
  const [currentPage, setCurrentPage] = useState(1);

  const types = useMemo(
    () => Array.from(new Set(batches.map((b) => b.type).filter(Boolean))).sort(),
    [batches],
  );
  const brands = useMemo(
    () => Array.from(new Set(batches.map((b) => b.brand_name).filter((b): b is string => !!b))).sort(),
    [batches],
  );

  // ---- Selection: batch_id -> qty input text; supplier lock derives from it ----
  const [selection, setSelection] = useState<Record<number, string>>({});

  const batchById = useMemo(() => {
    const map = new Map<number, ReturnableBatch>();
    batches.forEach((b) => map.set(b.batch_id, b));
    return map;
  }, [batches]);

  const lockedSupplier = useMemo(() => {
    for (const key of Object.keys(selection)) {
      const batch = batchById.get(Number(key));
      if (batch && batch.supplier_id != null) {
        return { id: batch.supplier_id, name: batch.supplier_name ?? '' };
      }
    }
    return null;
  }, [selection, batchById]);

  const isRowDisabled = (b: ReturnableBatch): boolean =>
    b.supplier_id == null || (lockedSupplier != null && b.supplier_id !== lockedSupplier.id);

  const qtyOf = (b: ReturnableBatch): number => {
    const raw = selection[b.batch_id];
    const n = Number(raw);
    return Number.isInteger(n) ? n : NaN;
  };
  const isQtyValid = (b: ReturnableBatch): boolean => {
    const n = qtyOf(b);
    return Number.isInteger(n) && n >= 1 && n <= b.quantity;
  };

  const selectedBatches = useMemo(
    () =>
      Object.keys(selection)
        .map((id) => batchById.get(Number(id)))
        .filter((b): b is ReturnableBatch => !!b),
    [selection, batchById],
  );
  const validLines = selectedBatches.filter(isQtyValid);
  const totalUnits = validLines.reduce((sum, b) => sum + qtyOf(b), 0);
  const canProceed =
    validLines.length > 0 &&
    validLines.length === selectedBatches.length &&
    lockedSupplier != null;

  const toggleRow = (b: ReturnableBatch) => {
    setSelection((prev) => {
      if (prev[b.batch_id] !== undefined) {
        const next = { ...prev };
        delete next[b.batch_id];
        return next;
      }
      return { ...prev, [b.batch_id]: '1' };
    });
  };

  const handleQtyChange = (b: ReturnableBatch, value: string) => {
    setSelection((prev) => ({ ...prev, [b.batch_id]: value }));
  };

  const clearSelection = () => setSelection({});

  // ---- Filtering (server order — expiry ascending — is preserved) ----
  const filteredBatches = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return batches.filter((b) => {
      if (search && !b.product_name.toLowerCase().includes(search)) return false;
      if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;
      if (brandFilter !== 'ALL' && b.brand_name !== brandFilter) return false;
      if (expiryFilter === 'ATTENTION') {
        return b.expiry_status === 'EXPIRED' || b.expiry_status === 'NEAR_EXPIRY';
      }
      if (expiryFilter !== 'ALL') return b.expiry_status === expiryFilter;
      return true;
    });
  }, [batches, productSearch, typeFilter, brandFilter, expiryFilter]);

  // Wraps cell content so locked/unattributable rows render visually muted.
  const mute = (b: ReturnableBatch, node: React.ReactNode) => (
    <Box sx={{ opacity: isRowDisabled(b) ? 0.45 : 1 }}>{node}</Box>
  );

  const columns: TableColumn<ReturnableBatch>[] = [
    {
      key: 'select',
      header: L.TABLE.SELECT,
      sortable: false,
      columnWidth: '60px',
      render: (b) => {
        const disabled = isRowDisabled(b);
        const checkbox = (
          <Checkbox
            checked={selection[b.batch_id] !== undefined}
            disabled={disabled}
            onChange={() => toggleRow(b)}
            sx={{ p: 0 }}
          />
        );
        return b.supplier_id == null ? (
          <Tooltip title={L.UNATTRIBUTABLE_TOOLTIP}>
            <span>{checkbox}</span>
          </Tooltip>
        ) : (
          checkbox
        );
      },
    },
    {
      key: 'product_name',
      header: L.TABLE.PRODUCT,
      sortable: false,
      render: (b) =>
        mute(
          b,
          <>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{b.product_name}</Typography>
            <Typography sx={{ fontSize: 12, color: '#728197' }}>
              {[b.type, b.brand_name].filter(Boolean).join(' · ')}
            </Typography>
          </>,
        ),
    },
    {
      key: 'batch_number',
      header: L.TABLE.BATCH,
      sortable: false,
      render: (b) => mute(b, <Typography sx={{ fontSize: 14 }}>{b.batch_number}</Typography>),
    },
    {
      key: 'expiry_date',
      header: L.TABLE.EXPIRY,
      sortable: false,
      render: (b) =>
        mute(b, <Typography sx={{ fontSize: 14 }}>{formatReportDate(b.expiry_date)}</Typography>),
    },
    {
      key: 'expiry_status',
      header: L.TABLE.STATUS,
      sortable: false,
      render: (b) => {
        const meta = EXPIRY_STATUS_META[b.expiry_status];
        const label =
          b.expiry_status === 'NEAR_EXPIRY' && b.days_until_expiry != null
            ? `${meta.label} · ${b.days_until_expiry}d`
            : meta.label;
        return mute(
          b,
          <Chip
            label={label}
            size="small"
            sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 600, fontSize: 12 }}
          />,
        );
      },
    },
    {
      key: 'supplier_name',
      header: L.TABLE.SUPPLIER,
      sortable: false,
      render: (b) =>
        mute(
          b,
          <Typography sx={{ fontSize: 14, color: b.supplier_name ? '#374151' : '#9CA3AF' }}>
            {b.supplier_name ?? L.UNATTRIBUTED}
          </Typography>,
        ),
    },
    {
      key: 'quantity',
      header: L.TABLE.STOCK,
      sortable: false,
      render: (b) => mute(b, <Typography sx={{ fontSize: 14 }}>{b.quantity}</Typography>),
    },
    {
      key: 'purchase_price_per_unit',
      header: L.TABLE.PURCHASE_PRICE,
      sortable: false,
      render: (b) =>
        mute(
          b,
          <Typography sx={{ fontSize: 14 }}>
            {b.purchase_price_per_unit != null ? b.purchase_price_per_unit.toFixed(2) : '—'}
          </Typography>,
        ),
    },
    {
      key: 'mrp',
      header: L.TABLE.MRP,
      sortable: false,
      render: (b) => mute(b, <Typography sx={{ fontSize: 14 }}>{b.mrp.toFixed(2)}</Typography>),
    },
    {
      key: 'receipt',
      header: L.TABLE.RECEIPT,
      sortable: false,
      render: (b) =>
        mute(
          b,
          <>
            <Typography sx={{ fontSize: 14 }}>{b.supplier_invoice_number ?? '—'}</Typography>
            {b.po_number && (
              <Typography sx={{ fontSize: 12, color: '#728197' }}>{b.po_number}</Typography>
            )}
          </>,
        ),
    },
    {
      key: 'return_qty',
      header: L.TABLE.RETURN_QTY,
      sortable: false,
      columnWidth: '110px',
      render: (b) => {
        const selected = selection[b.batch_id] !== undefined;
        const invalid = selected && !isQtyValid(b);
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <TextField
              type="number"
              value={selected ? selection[b.batch_id] : ''}
              onChange={(e) => handleQtyChange(b, e.target.value)}
              disabled={!selected || isRowDisabled(b)}
              error={invalid}
              inputProps={{ min: 1, max: b.quantity, style: { textAlign: 'center', padding: '4px 8px' } }}
              sx={{
                width: '80px',
                '& .MuiOutlinedInput-root': {
                  height: '32px',
                  '&.Mui-disabled': { backgroundColor: '#F3F4F6' },
                },
              }}
            />
            {invalid && (
              <Typography variant="caption" sx={{ color: '#DC2626', fontSize: '11px', fontWeight: 500 }}>
                {L.QTY_ERROR}
              </Typography>
            )}
          </Box>
        );
      },
    },
  ];

  const handleReturn = () => {
    if (!canProceed || !lockedSupplier) return;
    const state: PurchaseReturnSelectionState = {
      supplier: lockedSupplier,
      lines: validLines.map((b) => ({ batch: b, quantity: qtyOf(b) })),
    };
    navigate(PURCHASE_RETURN_ROUTES.DETAILS, { state });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {L.TITLE}
          </Typography>
          <Typography sx={{ color: '#728197', fontSize: '14px' }}>{L.SUBTITLE}</Typography>
        </Box>
        <StandardButton
          variant="secondary"
          size="large"
          onClick={() => navigate(PURCHASE_RETURN_ROUTES.LOG)}
        >
          {L.RETURNS_LOG_BUTTON}
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
          p: '12px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#728197' }}>{L.FILTERS.PRODUCT}</Typography>
          <TextField
            placeholder={L.FILTERS.PRODUCT_PLACEHOLDER}
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
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
              width: '16rem',
              '& .MuiOutlinedInput-root': {
                height: '2.5rem',
                borderRadius: '12px',
                backgroundColor: '#fff',
                '& fieldset': { border: '1px solid #D1D5DB' },
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#728197' }}>{L.FILTERS.TYPE}</Typography>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            sx={filterSelectSx}
          >
            <MenuItem value="ALL">{L.FILTERS.ALL}</MenuItem>
            {types.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#728197' }}>{L.FILTERS.BRAND}</Typography>
          <Select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setCurrentPage(1);
            }}
            sx={filterSelectSx}
          >
            <MenuItem value="ALL">{L.FILTERS.ALL}</MenuItem>
            {brands.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#728197' }}>{L.FILTERS.EXPIRY_STATUS}</Typography>
          <Select
            value={expiryFilter}
            onChange={(e) => {
              setExpiryFilter(e.target.value as ExpiryFilterValue);
              setCurrentPage(1);
            }}
            sx={filterSelectSx}
          >
            {EXPIRY_FILTER_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {/* Supplier lock info bar */}
      {lockedSupplier && (
        <Alert
          severity="info"
          sx={{ borderRadius: '12px' }}
          action={
            <StandardButton variant="text" size="small" onClick={clearSelection}>
              {L.CLEAR_SELECTION}
            </StandardButton>
          }
        >
          {L.SUPPLIER_LOCK_PREFIX}
          <strong>{lockedSupplier.name}</strong>
          {L.SUPPLIER_LOCK_SUFFIX}
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            {L.LOADING}
          </Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center">
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {extractErrorMessage(error, L.LOAD_FAILED)}
          </Typography>
          <StandardButton size="small" onClick={() => refetch()} variant="outline">
            {L.RETRY}
          </StandardButton>
        </Box>
      ) : (
        <ReusableTable<ReturnableBatch>
          columns={columns}
          data={filteredBatches}
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
          totalRows={filteredBatches.length}
          rowsPerPage={PURCHASE_RETURN_CONSTANTS.ROWS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={() => { }}
          sortConfig={{ key: '', direction: 'asc' }}
        />
      )}

      {/* Bottom bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#E0EDFF',
          borderRadius: '12px',
          p: '12px 16px',
        }}
      >
        <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>
          {L.SELECTION_SUMMARY(validLines.length, totalUnits)}
        </Typography>
        <StandardButton variant="primary" size="large" disabled={!canProceed} onClick={handleReturn}>
          {L.RETURN_BUTTON}
        </StandardButton>
      </Box>
    </Box>
  );
};

export default PurchaseReturn;
