import React, { useState, useMemo, ChangeEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Typography, Tooltip, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import dayjs from 'dayjs';
import { StandardButton } from '../../components/Common';
import { ReusableTable, TableColumn, SearchAndFilterConfig } from '../../components/PharmaTable';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import {
  useGetDraftsQuery,
  useLazyGetDraftQuery,
  useDeleteDraftMutation,
  DraftListItem,
} from '../../redux/slices/draftsApi';
import { setCartItems, saveFormData } from '../../redux/slices/cartSlice';
import { extractErrorMessage } from '../../utils/errorUtils';

const formatDate = (value: string | null): string => {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD MMM YYYY') : '-';
};

const SaleDrafts: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: drafts = [], isLoading, isError, error } = useGetDraftsQuery();
  const [triggerGetDraft] = useLazyGetDraftQuery();
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [deleteDraft, { isLoading: isDeleting }] = useDeleteDraftMutation();

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });

  const [pendingDiscardId, setPendingDiscardId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const filteredData = useMemo(() => {
    let rows = [...drafts];
    if (currentSearchTerm.trim()) {
      const term = currentSearchTerm.toLowerCase();
      rows = rows.filter(d =>
        (d.customer_name || '').toLowerCase().includes(term) ||
        (d.customer_phone || '').toLowerCase().includes(term) ||
        (d.invoice_number || '').toLowerCase().includes(term)
      );
    }
    return rows.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof DraftListItem];
      const bVal = b[sortConfig.key as keyof DraftListItem];
      if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at' || sortConfig.key === 'invoice_date') {
        const at = dayjs(String(aVal || '')).valueOf() || 0;
        const bt = dayjs(String(bVal || '')).valueOf() || 0;
        return sortConfig.direction === 'asc' ? at - bt : bt - at;
      }
      // total_amount arrives as a DECIMAL string from node-postgres — sort numerically, not lexically.
      if (sortConfig.key === 'total_amount') {
        const an = Number(aVal);
        const bn = Number(bVal);
        const av = Number.isFinite(an) ? an : 0;
        const bv = Number.isFinite(bn) ? bn : 0;
        return sortConfig.direction === 'asc' ? av - bv : bv - av;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc'
        ? String(aVal ?? '').localeCompare(String(bVal ?? ''))
        : String(bVal ?? '').localeCompare(String(aVal ?? ''));
    });
  }, [drafts, currentSearchTerm, sortConfig]);

  const handleOpenDraft = useCallback(async (id: number) => {
    setOpeningId(id);
    try {
      const draft = await triggerGetDraft(id).unwrap();
      const payload = draft.payload;
      dispatch(setCartItems(payload?.items || []));
      if (payload?.formData) {
        dispatch(saveFormData(payload.formData));
      }
      navigate('/sales/receipt', {
        state: { draftId: id, draftSplitPayments: payload?.splitPayments || [] },
      });
    } catch (err) {
      showSnackbar(extractErrorMessage(err, 'Failed to open draft. Please try again.'), 'error');
      setOpeningId(null);
    }
  }, [triggerGetDraft, dispatch, navigate]);

  const handleConfirmDiscard = async () => {
    if (pendingDiscardId == null) return;
    const id = pendingDiscardId;
    setPendingDiscardId(null);
    try {
      await deleteDraft(id).unwrap();
      showSnackbar('Draft discarded.', 'success');
    } catch (err) {
      showSnackbar(extractErrorMessage(err, 'Failed to discard draft. Please try again.'), 'error');
    }
  };

  const columns: TableColumn<DraftListItem>[] = [
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      columnWidth: '140px',
      render: (item) => formatDate(item.created_at),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (item) => item.customer_name || '-',
    },
    {
      key: 'customer_phone',
      header: 'Mobile',
      sortable: true,
      render: (item) => item.customer_phone || '-',
    },
    {
      key: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      columnWidth: '140px',
      render: (item) => item.invoice_number || '-',
    },
    {
      key: 'item_count',
      header: 'Items',
      sortable: true,
      columnWidth: '90px',
      render: (item) => (item.item_count ?? 0).toString(),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      sortable: true,
      columnWidth: '120px',
      render: (item) => {
        if (item.total_amount == null) return '-';
        const amount = Number(item.total_amount);
        return Number.isFinite(amount) ? Math.round(amount).toLocaleString() : '-';
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      columnWidth: '120px',
      render: (item) => {
        const isRowOpening = openingId === item.id;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Tooltip title="Open" arrow placement="top">
              <span>
                <IconButton
                  size="small"
                  aria-label="Open draft"
                  disabled={isRowOpening}
                  onClick={() => handleOpenDraft(item.id)}
                  sx={{ color: '#5C17E5', '&:hover': { color: '#4C14CC' } }}
                >
                  {isRowOpening ? (
                    <CircularProgress size="1.375rem" sx={{ color: '#9CA3AF' }} />
                  ) : (
                    <OpenInNewIcon sx={{ fontSize: '1.375rem' }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Discard" arrow placement="top">
              <IconButton
                size="small"
                aria-label="Discard draft"
                onClick={() => setPendingDiscardId(item.id)}
                sx={{ color: '#DC2626', '&:hover': { color: '#B91C1C' } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: '1.375rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const searchAndFilterConfig: SearchAndFilterConfig = { filterOptions: [] };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Saved drafts</Typography>
        <StandardButton
          onClick={() => navigate('/sales')}
          variant="secondary"
          size="large"
          startIcon={<ArrowBackIcon sx={{ fontSize: '1.125rem' }} />}
          sx={{
            minWidth: '10rem',
            borderRadius: '1.875rem',
            backgroundColor: '#F5F5F5',
            border: '1px solid #E0E0E0',
            color: '#616161',
            fontWeight: 700,
            fontSize: '0.875rem',
            textTransform: 'none',
            boxShadow: 'none',
          }}
        >
          Back to sales
        </StandardButton>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#5C17E5' }} />
        </Box>
      ) : isError ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography sx={{ color: '#DC2626' }}>
            {extractErrorMessage(error, 'Failed to load drafts. Please try again.')}
          </Typography>
        </Box>
      ) : (
        <ReusableTable<DraftListItem>
          columns={columns}
          data={filteredData}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          emptyMessage="No saved drafts yet. Save a sale as a draft to see it here."
          searchAndFilterConfig={searchAndFilterConfig}
          currentSearchTerm={currentSearchTerm}
          onSearchChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentSearchTerm(e.target.value)}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters(v => !v)}
          onFilterSelect={(key, value) => setCurrentFilter(prev => ({ ...prev, [key]: value }))}
          currentFilter={currentFilter}
          totalRows={filteredData.length}
          rowsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={(key) =>
            setSortConfig(prev => ({
              key,
              direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
            }))
          }
          sortConfig={sortConfig}
        />
      )}

      <ConfirmationDialog
        open={pendingDiscardId != null}
        title="Discard draft"
        message="Are you sure you want to discard this draft? This action cannot be undone."
        confirmLabel={isDeleting ? 'Discarding…' : 'Discard'}
        onClose={() => setPendingDiscardId(null)}
        onCancel={() => setPendingDiscardId(null)}
        onConfirm={handleConfirmDiscard}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SaleDrafts;
