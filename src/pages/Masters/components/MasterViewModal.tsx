import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import { StandardButton } from '../../../components/Common';
import {
  MASTER_VIEW_CONFIG,
  MASTER_GENDER_OPTIONS,
  isEmptyMasterValue,
  type MasterCategory,
  type MasterCategoryConfig,
} from '../../../config/constants/MasterView.constants';
import { MASTER_VIEW_LABELS } from '../../../config/label/MasterView.labels';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { useLogDownloadMutation } from '../../../redux/slices/activityApi';
import MasterEditModal from './MasterEditModal';

type Row = Record<string, unknown>;

interface MasterViewModalProps {
  open: boolean;
  category: MasterCategory;
  rows: Row[];
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  // Calls the category's update mutation. Resolves on success, rejects on error.
  onUpdate: (body: Record<string, unknown>) => Promise<unknown>;
  // Admin-only: shows a button to export the current rows as an .xlsx file.
  // The prop IS the admin gate — set only by the admin route.
  showDownload?: boolean;
  // Role-appropriate column/field config. Defaults to the full config for the
  // category; the caller passes a PII-filtered config for pharmacists.
  config?: MasterCategoryConfig;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: '90%', lg: '1100px' },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: '12px',
  border: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: "'Lexend', sans-serif",
};

const renderCell = (key: string, value: unknown): React.ReactNode => {
  if (isEmptyMasterValue(value)) return MASTER_VIEW_LABELS.EMPTY_PLACEHOLDER;
  if (key === 'gender') {
    const match = MASTER_GENDER_OPTIONS.find((o) => o.value === Number(value));
    return match ? match.label : MASTER_VIEW_LABELS.EMPTY_PLACEHOLDER;
  }
  return String(value);
};

const MasterViewModal: React.FC<MasterViewModalProps> = ({
  open,
  category,
  rows,
  isLoading,
  isError,
  onClose,
  onUpdate,
  showDownload = false,
  config = MASTER_VIEW_CONFIG[category],
}) => {

  const [editRow, setEditRow] = useState<Row | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string>('');

  const [logDownload] = useLogDownloadMutation();

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  // Client-side "search by name" filter over the already-fetched rows.
  const [search, setSearch] = useState('');

  // Reset the query when the modal opens or the category changes, so reopening a
  // different category never carries a stale filter.
  useEffect(() => {
    setSearch('');
  }, [open, category]);

  const query = search.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (query === '') return rows;
    return rows.filter((row) =>
      String(row[config.searchKey] ?? '').toLowerCase().includes(query),
    );
  }, [rows, query, config.searchKey]);

  // Export the current rows to an .xlsx file using the same columns shown in the
  // table (header labels + display formatting), then download it named by category.
  const handleDownload = () => {
    const data = rows.map((row) =>
      config.columns.reduce<Record<string, string>>((acc, col) => {
        acc[col.header] = String(renderCell(col.key, row[col.key]));
        return acc;
      }, {}),
    );
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, MASTER_VIEW_LABELS.VIEW_TITLES[category]);
    XLSX.writeFile(workbook, MASTER_VIEW_LABELS.DOWNLOAD_FILENAMES[category]);
    logDownload({ category: 'master', name: String(category), format: 'xlsx', count: data.length }).catch(() => {});
  };

  const handleEditClick = (row: Row) => {
    setEditRow(row);
    setEditError('');
    setEditOpen(true);
  };

  const handleSave = async (body: Record<string, unknown>) => {
    setSaving(true);
    setEditError('');
    try {
      await onUpdate(body);
      setEditOpen(false);
      setEditRow(null);
      setSnackMessage(MASTER_VIEW_LABELS.SUCCESS[category]);
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (error) {
      setEditError(extractErrorMessage(error, MASTER_VIEW_LABELS.UPDATE_ERROR));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box sx={modalStyle}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 3,
              pb: 2,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '20px', color: '#1A212B' }}>
              {MASTER_VIEW_LABELS.VIEW_TITLES[category]}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showDownload && rows.length > 0 && (
                <StandardButton
                  variant="secondary"
                  size="medium"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={handleDownload}
                >
                  {MASTER_VIEW_LABELS.DOWNLOAD_BUTTON}
                </StandardButton>
              )}
              <IconButton onClick={onClose} size="small" aria-label="close">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ px: 3, pb: 3, overflowY: 'auto' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : isError ? (
              <Alert severity="error">{MASTER_VIEW_LABELS.LOAD_ERROR}</Alert>
            ) : rows.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 6, color: '#6B7280' }}>
                {MASTER_VIEW_LABELS.EMPTY}
              </Typography>
            ) : (
              <>
                <TextField
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder={MASTER_VIEW_LABELS.SEARCH_PLACEHOLDER}
                  aria-label={MASTER_VIEW_LABELS.SEARCH_PLACEHOLDER}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                {filteredRows.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', py: 6, color: '#6B7280' }}>
                    {MASTER_VIEW_LABELS.NO_MATCHES}
                  </Typography>
                ) : (
                  <TableContainer component={Paper} sx={{ border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {config.columns.map((col) => (
                        <TableCell
                          key={col.key}
                          sx={{ fontWeight: 600, bgcolor: '#F9FAFB', whiteSpace: 'nowrap' }}
                        >
                          {col.header}
                        </TableCell>
                      ))}
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: '#F9FAFB',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {MASTER_VIEW_LABELS.ACTIONS_HEADER}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((row, idx) => (
                      <TableRow key={String(row[config.pkKey] ?? idx)} hover>
                        {config.columns.map((col) => (
                          <TableCell key={col.key}>
                            {renderCell(col.key, row[col.key])}
                          </TableCell>
                        ))}
                        <TableCell sx={{ textAlign: 'center' }}>
                          <IconButton
                            size="small"
                            aria-label={MASTER_VIEW_LABELS.EDIT_BUTTON}
                            onClick={() => handleEditClick(row)}
                            sx={{ color: '#5C17E5' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              p: 3,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <StandardButton variant="secondary" size="medium" onClick={onClose}>
              {MASTER_VIEW_LABELS.CLOSE_BUTTON}
            </StandardButton>
          </Box>
        </Box>
      </Modal>

      <MasterEditModal
        open={editOpen}
        category={category}
        config={config}
        row={editRow}
        saving={saving}
        errorMessage={editError}
        onClose={() => {
          setEditOpen(false);
          setEditRow(null);
        }}
        onSave={handleSave}
      />

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          sx={{ width: '100%' }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MasterViewModal;
