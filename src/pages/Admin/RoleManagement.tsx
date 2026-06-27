import React, { useState, useMemo, ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { StandardButton } from '../../components/Common';
import { USERS_CONSTANTS } from '../../config/constants/Users.constants';
import { ROLE_MANAGEMENT_LABELS as L } from '../../config/label/RoleManagement.labels';
import {
  useGetAllUsersQuery,
  useGetRoleOptionsQuery,
  useUpdateUserRolesMutation,
  useSetManageRolesMutation,
  AdminUser,
  OrgRole,
} from '../../redux/slices/adminSlice';
import { orgApi } from '../../redux/slices/orgApi';
import type { AppDispatch } from '../../redux/store';
import {
  selectOrgRole,
  selectCanManageRoles,
} from '../../redux/slices/orgSlice';
import { extractErrorMessage, logError } from '../../utils/errorUtils';

const NONE = '__none__';

const orgRoleLabel = (role: string) => L.ORG_ROLES[role] ?? role;

const RoleManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading, error } = useGetAllUsersQuery();
  const { data: roleOptions } = useGetRoleOptionsQuery();
  const [updateUserRoles, { isLoading: isSaving }] = useUpdateUserRolesMutation();
  const [setManageRoles] = useSetManageRolesMutation();

  // Viewer's RBAC context (seeded from /me into orgSlice by OrgBootstrap).
  const viewerOrgRole = useSelector(selectOrgRole);
  const viewerCanManageRoles = useSelector(selectCanManageRoles);
  const isSuperadmin = viewerOrgRole === 'superadmin';
  // Finer gate than the admin RoleGuard: only superadmins or manage-roles admins edit.
  const canEdit = isSuperadmin || (viewerOrgRole === 'admin' && viewerCanManageRoles);

  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const showToast = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  // Edit dialog state.
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editOrgRole, setEditOrgRole] = useState<OrgRole>('member');
  // module_key -> selected role value or NONE.
  const [editModuleRoles, setEditModuleRoles] = useState<Record<string, string>>({});
  const [editCanManageRoles, setEditCanManageRoles] = useState(false);

  const users: AdminUser[] = useMemo(() => data?.users ?? [], [data]);

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (currentSearchTerm) {
      const term = currentSearchTerm.toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
      );
    }
    return list.sort((a, b) => {
      const aVal = String(a[sortConfig.key as keyof AdminUser] ?? '');
      const bVal = String(b[sortConfig.key as keyof AdminUser] ?? '');
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [users, currentSearchTerm, sortConfig]);

  const openEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditOrgRole(user.org_role);
    const moduleKeys = roleOptions ? Object.keys(roleOptions.module_roles) : Object.keys(user.module_roles);
    const initial: Record<string, string> = {};
    moduleKeys.forEach((key) => {
      initial[key] = user.module_roles[key] ?? NONE;
    });
    setEditModuleRoles(initial);
    setEditCanManageRoles(user.can_manage_roles);
  };

  const closeEdit = () => setEditUser(null);

  const handleSave = async () => {
    if (!editUser) return;

    // Build the module_roles diff: only changed keys (null removes).
    const moduleDiff: Record<string, string | null> = {};
    Object.keys(editModuleRoles).forEach((key) => {
      const selected = editModuleRoles[key] === NONE ? null : editModuleRoles[key];
      const original = editUser.module_roles[key] ?? null;
      if (selected !== original) moduleDiff[key] = selected;
    });

    const orgRoleChanged = editOrgRole !== editUser.org_role;
    const manageRolesChanged =
      isSuperadmin && editUser.org_role === 'admin' && editCanManageRoles !== editUser.can_manage_roles;

    if (!orgRoleChanged && Object.keys(moduleDiff).length === 0 && !manageRolesChanged) {
      closeEdit();
      return;
    }

    try {
      if (orgRoleChanged || Object.keys(moduleDiff).length > 0) {
        await updateUserRoles({
          userId: editUser.id,
          ...(orgRoleChanged && { org_role: editOrgRole }),
          ...(Object.keys(moduleDiff).length > 0 && { module_roles: moduleDiff }),
        }).unwrap();
      }
      if (manageRolesChanged) {
        await setManageRoles({ userId: editUser.id, can_manage_roles: editCanManageRoles }).unwrap();
      }
      // Keep viewer's /me context fresh (e.g. self module-role change).
      dispatch(orgApi.util.invalidateTags(['Me']));
      showToast(L.MESSAGES.UPDATE_SUCCESS, 'success');
      closeEdit();
    } catch (err) {
      logError(err, 'RoleManagement.handleSave');
      showToast(extractErrorMessage(err, L.MESSAGES.UPDATE_ERROR), 'error');
    }
  };

  // Row-level manage-roles toggle (superadmin only, admin targets only).
  const handleRowManageRoles = async (user: AdminUser, value: boolean) => {
    try {
      await setManageRoles({ userId: user.id, can_manage_roles: value }).unwrap();
      showToast(L.MESSAGES.MANAGE_ROLES_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'RoleManagement.handleRowManageRoles');
      showToast(extractErrorMessage(err, L.MESSAGES.MANAGE_ROLES_ERROR), 'error');
    }
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSortRequest = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const columns: TableColumn<AdminUser>[] = [
    {
      key: 'name',
      header: L.TABLE.USER,
      sortable: true,
      render: (user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: USERS_CONSTANTS.AVATAR.GAP }}>
          <Avatar
            sx={{
              bgcolor: USERS_CONSTANTS.AVATAR.BACKGROUND_COLOR,
              width: USERS_CONSTANTS.AVATAR.SIZE,
              height: USERS_CONSTANTS.AVATAR.SIZE,
              fontSize: USERS_CONSTANTS.AVATAR.FONT_SIZE,
            }}
          >
            {user.name?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontWeight: USERS_CONSTANTS.USER_INFO.NAME_FONT_WEIGHT,
                fontSize: USERS_CONSTANTS.USER_INFO.NAME_FONT_SIZE,
                lineHeight: USERS_CONSTANTS.USER_INFO.NAME_LINE_HEIGHT,
              }}
            >
              {user.name}
            </Typography>
            <Typography
              sx={{
                fontSize: USERS_CONSTANTS.USER_INFO.EMAIL_FONT_SIZE,
                color: USERS_CONSTANTS.USER_INFO.EMAIL_COLOR,
                lineHeight: USERS_CONSTANTS.USER_INFO.EMAIL_LINE_HEIGHT,
              }}
            >
              {user.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'org_role',
      header: L.TABLE.ORG_ROLE,
      sortable: true,
      render: (user) => (
        <Chip
          label={orgRoleLabel(user.org_role)}
          size="small"
          sx={{
            backgroundColor: 'rgba(92, 23, 229, 0.1)',
            color: '#5C17E5',
            fontWeight: 600,
            height: USERS_CONSTANTS.CHIP.ROLE.HEIGHT,
            fontSize: USERS_CONSTANTS.CHIP.ROLE.FONT_SIZE,
            '& .MuiChip-label': { padding: USERS_CONSTANTS.CHIP.ROLE.LABEL_PADDING },
          }}
        />
      ),
    },
    {
      key: 'module_roles',
      header: L.TABLE.MODULE_ROLES,
      sortable: false,
      render: (user) => {
        const entries = Object.entries(user.module_roles);
        if (entries.length === 0) {
          return (
            <Typography sx={{ fontSize: '13px', color: USERS_CONSTANTS.USER_INFO.EMAIL_COLOR }}>
              {L.MODULE_ROLES_EMPTY}
            </Typography>
          );
        }
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {entries.map(([moduleKey, role]) => (
              <Chip
                key={moduleKey}
                label={`${moduleKey}: ${role}`}
                size="small"
                sx={{
                  backgroundColor: '#F3F4F6',
                  color: '#1A212B',
                  fontWeight: 500,
                  height: '22px',
                  fontSize: '12px',
                  '& .MuiChip-label': { padding: '0 8px' },
                }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      key: 'manage_roles',
      header: L.TABLE.MANAGE_ROLES,
      sortable: false,
      render: (user) => {
        if (user.org_role !== 'admin') {
          return (
            <Typography sx={{ fontSize: '13px', color: USERS_CONSTANTS.USER_INFO.EMAIL_COLOR }}>
              {L.MANAGE_ROLES.NOT_APPLICABLE}
            </Typography>
          );
        }
        // Superadmin viewers can toggle the capability inline; others see status only.
        if (isSuperadmin) {
          return (
            <Switch
              checked={user.can_manage_roles}
              onChange={(e) => handleRowManageRoles(user, e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#5C17E5' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#5C17E5' },
              }}
            />
          );
        }
        return (
          <Typography sx={{ fontSize: '13px', color: USERS_CONSTANTS.USER_INFO.EMAIL_COLOR }}>
            {user.can_manage_roles ? L.MANAGE_ROLES.GRANTED : L.MANAGE_ROLES.REVOKED}
          </Typography>
        );
      },
    },
  ];

  if (canEdit) {
    columns.push({
      key: 'actions',
      header: L.TABLE.ACTIONS,
      sortable: false,
      columnWidth: '120px',
      render: (user) => (
        <IconButton
          size="small"
          aria-label={L.EDIT_TOOLTIP}
          title={L.EDIT_TOOLTIP}
          onClick={() => openEdit(user)}
          sx={{
            color: USERS_CONSTANTS.ACTIONS.EDIT_COLOR,
            padding: USERS_CONSTANTS.ACTIONS.ICON_PADDING,
            '& svg': { fontSize: USERS_CONSTANTS.ACTIONS.ICON_SIZE },
          }}
        >
          <EditIcon />
        </IconButton>
      ),
    });
  }

  const moduleKeys = roleOptions ? Object.keys(roleOptions.module_roles) : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: USERS_CONSTANTS.LAYOUT.PAGE_GAP, p: USERS_CONSTANTS.LAYOUT.PAGE_PADDING }}>
      <Box>
        <Typography
          variant={USERS_CONSTANTS.TYPOGRAPHY.TITLE_VARIANT}
          fontWeight={USERS_CONSTANTS.TYPOGRAPHY.TITLE_FONT_WEIGHT}
          sx={{ mb: USERS_CONSTANTS.LAYOUT.TITLE_MARGIN_BOTTOM }}
        >
          {L.PAGE_TITLE}
        </Typography>
        <Typography sx={{ color: USERS_CONSTANTS.TYPOGRAPHY.SUBTITLE_COLOR, fontSize: USERS_CONSTANTS.TYPOGRAPHY.SUBTITLE_FONT_SIZE }}>
          {L.SUBTITLE}
        </Typography>
      </Box>

      {!canEdit && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '10px 14px',
            backgroundColor: 'rgba(92, 23, 229, 0.06)',
            border: '1px solid rgba(92, 23, 229, 0.2)',
            borderRadius: '8px',
            color: '#5C17E5',
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: '13px' }}>{L.READ_ONLY_NOTICE}</Typography>
        </Box>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>{L.MESSAGES.LOADING}</Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">{L.MESSAGES.ERROR}</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: USERS_CONSTANTS.LAYOUT.ACTION_BAR_MARGIN_BOTTOM }}>
            <TextField
              placeholder={L.SEARCH_PLACEHOLDER}
              value={currentSearchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: !currentSearchTerm.trim() ? (
                  <InputAdornment position="start" sx={{ marginRight: '0px' }}>
                    <SearchIcon sx={{ color: '#8A99AF', fontSize: '24px' }} />
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: '400px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#fff',
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  boxShadow: 'inset 0 0 0 1px #BFD1E6',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none !important', display: 'none !important' },
                  '&:hover': { boxShadow: 'inset 0 0 0 1px #BFD1E6 !important' },
                  '&.Mui-focused': { boxShadow: 'inset 0 0 0 1px #5C17E5 !important' },
                },
                '& .MuiInputBase-input': { padding: '10px 14px', paddingLeft: '6px' },
                '& .MuiOutlinedInput-input::placeholder': { fontSize: '16px', opacity: 1, color: '#9CA3AF' },
              }}
            />
          </Box>

          <Box
            sx={{
              marginTop: USERS_CONSTANTS.LAYOUT.TABLE_MARGIN_TOP,
              overflowX: 'auto',
              backgroundColor: USERS_CONSTANTS.TABLE.CONTAINER_BACKGROUND,
              borderRadius: USERS_CONSTANTS.TABLE.CONTAINER_BORDER_RADIUS,
              border: 'none',
              fontFamily: USERS_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
              padding: 0,
              width: '100%',
              '& .MuiTableContainer-root': {
                boxShadow: 'none',
                borderRadius: USERS_CONSTANTS.TABLE.CONTAINER_BORDER_RADIUS,
                border: 'none',
              },
              '& .MuiTable-root': { borderCollapse: 'separate', borderSpacing: 0 },
              '& .MuiTableCell-root': {
                fontFamily: USERS_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
                padding: `${USERS_CONSTANTS.TABLE.CELL_PADDING} !important`,
                border: USERS_CONSTANTS.TABLE.CELL_BORDER,
                borderBottom: USERS_CONSTANTS.TABLE.ROW_BORDER,
                textAlign: 'left !important',
              },
              '& .MuiTableHead .MuiTableCell-root': {
                fontFamily: USERS_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
                fontWeight: USERS_CONSTANTS.TABLE.HEADER_FONT_WEIGHT,
                fontSize: `${USERS_CONSTANTS.TABLE.HEADER_FONT_SIZE} !important`,
                lineHeight: `${USERS_CONSTANTS.TABLE.HEADER_LINE_HEIGHT} !important`,
                color: USERS_CONSTANTS.TABLE.HEADER_COLOR,
                backgroundColor: USERS_CONSTANTS.TABLE.HEADER_BACKGROUND,
                padding: `${USERS_CONSTANTS.TABLE.HEADER_PADDING} !important`,
                borderRight: USERS_CONSTANTS.TABLE.HEADER_CELL_BORDER_RIGHT,
                borderBottom: USERS_CONSTANTS.TABLE.ROW_BORDER,
                textAlign: 'left !important',
                '&:last-child': { borderRight: 'none' },
              },
              '& .MuiTableBody .MuiTableRow:nth-of-type(odd)': {
                backgroundColor: `${USERS_CONSTANTS.TABLE.ROW_BACKGROUND_ODD} !important`,
              },
              '& .MuiTableBody .MuiTableRow:nth-of-type(even)': {
                backgroundColor: `${USERS_CONSTANTS.TABLE.ROW_BACKGROUND_EVEN} !important`,
              },
              '& .MuiTableBody .MuiTableRow': {
                borderBottom: USERS_CONSTANTS.TABLE.ROW_BORDER,
                '&:last-child': { borderBottom: 'none' },
                '&:hover': { backgroundColor: `${USERS_CONSTANTS.TABLE.ROW_HOVER_BACKGROUND} !important` },
              },
              '& .MuiTableBody .MuiTableCell-root': { borderRight: 'none' },
              '& .MuiTableBody .MuiTableCell-root:first-of-type': { paddingLeft: '20px !important' },
            }}
          >
            <ReusableTable
              columns={columns}
              data={filteredUsers}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              searchAndFilterConfig={{ filterOptions: [] }}
              currentSearchTerm=""
              onSearchChange={() => {}}
              showFilters={false}
              onShowFiltersToggle={() => {}}
              currentFilterKey=""
              onFilterSelect={() => {}}
              totalRows={filteredUsers.length}
              rowsPerPage={USERS_CONSTANTS.PAGINATION.ROWS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onSortRequest={handleSortRequest}
              sortConfig={sortConfig}
            />
          </Box>
        </>
      )}

      {/* Edit roles dialog */}
      <Dialog
        open={editUser !== null}
        onClose={closeEdit}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            maxWidth: '480px',
            width: '90%',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '18px', color: '#1A212B', fontFamily: "'Lexend', sans-serif", px: 3, pt: 3, pb: 1 }}>
          {L.DIALOG.TITLE}
          {editUser && (
            <Typography sx={{ fontSize: '13px', color: '#6B7280', fontWeight: 400, mt: 0.5 }}>
              {editUser.name} · {editUser.email}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1A212B', mb: 0.75 }}>
                {L.DIALOG.ORG_ROLE_LABEL}
              </Typography>
              <Select
                fullWidth
                size="small"
                value={editOrgRole}
                onChange={(e: SelectChangeEvent<string>) => setEditOrgRole(e.target.value as OrgRole)}
              >
                {(roleOptions?.org_roles ?? (['superadmin', 'admin', 'member'] as OrgRole[])).map((role) => (
                  <MenuItem key={role} value={role}>
                    {orgRoleLabel(role)}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {moduleKeys.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1A212B', mb: 0.75 }}>
                  {L.DIALOG.MODULE_SECTION_TITLE}
                </Typography>
                <Stack spacing={1.5}>
                  {moduleKeys.map((moduleKey) => {
                    const allowed = roleOptions?.module_roles[moduleKey] ?? [];
                    return (
                      <Box key={moduleKey} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '13px', color: '#1A212B', minWidth: '110px', textTransform: 'capitalize' }}>
                          {moduleKey}
                        </Typography>
                        <Select
                          fullWidth
                          size="small"
                          value={editModuleRoles[moduleKey] ?? NONE}
                          onChange={(e: SelectChangeEvent<string>) =>
                            setEditModuleRoles((prev) => ({ ...prev, [moduleKey]: e.target.value }))
                          }
                        >
                          <MenuItem value={NONE}>{L.DIALOG.NONE_OPTION}</MenuItem>
                          {allowed.map((role) => (
                            <MenuItem key={role} value={role}>
                              {role}
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {isSuperadmin && editUser?.org_role === 'admin' && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editCanManageRoles}
                      onChange={(e) => setEditCanManageRoles(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#5C17E5' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#5C17E5' },
                      }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1A212B' }}>{L.DIALOG.MANAGE_ROLES_LABEL}</Typography>}
                />
                <Typography sx={{ fontSize: '12px', color: '#6B7280', ml: 6, mt: '-4px' }}>
                  {L.DIALOG.MANAGE_ROLES_HINT}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <StandardButton
            onClick={closeEdit}
            variant="secondary"
            size="medium"
            sx={{
              minWidth: '100px',
              borderRadius: '8px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #E0E0E0',
              color: '#616161',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#E0E0E0' },
            }}
          >
            {L.DIALOG.CANCEL}
          </StandardButton>
          <StandardButton
            onClick={handleSave}
            disabled={isSaving}
            variant="primary"
            size="medium"
            sx={{
              minWidth: '100px',
              borderRadius: '8px',
              backgroundColor: '#5C17E5',
              color: '#FFFFFF',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#4C14CC', boxShadow: 'none' },
            }}
          >
            {L.DIALOG.SAVE}
          </StandardButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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

export default RoleManagement;
