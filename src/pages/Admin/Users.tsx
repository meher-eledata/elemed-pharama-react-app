import React, { useState, useMemo, ChangeEvent } from 'react';
import { Box, Typography, Button, Avatar, Chip, IconButton, TextField, InputAdornment, CircularProgress, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { USERS_LABELS } from '../../config/label/Users.labels';
import { USERS_CONSTANTS } from '../../config/constants/Users.constants';
import AddUserModal from '../../components/Modal/AddUser/AddUserModal';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import { useGetAllUsersQuery, useDisableUserMutation, useEnableUserMutation } from '../../redux/slices/adminSlice';
import { extractErrorMessage, logError } from '../../utils/errorUtils';

// Org-level role labels for read-only display. Role changes now live in Role Management.
const ORG_ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  member: 'Member',
};

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  avatar: string;
}

const Users: React.FC = () => {
  // Fetch users from API
  const { data, isLoading, error, refetch } = useGetAllUsersQuery();
  const [disableUser] = useDisableUserMutation();
  const [enableUser] = useEnableUserMutation();

  // Confirmation dialog for disable/enable. action is null when closed.
  const [statusDialog, setStatusDialog] = useState<{
    userId: number;
    action: 'disable' | 'enable';
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleConfirmStatusChange = async () => {
    if (!statusDialog) return;
    const { userId, action } = statusDialog;
    setStatusDialog(null);
    try {
      if (action === 'disable') {
        await disableUser(userId).unwrap();
        setSnackbar({ open: true, message: USERS_LABELS.ACCOUNT_STATUS.DISABLE_SUCCESS, severity: 'success' });
      } else {
        await enableUser(userId).unwrap();
        setSnackbar({ open: true, message: USERS_LABELS.ACCOUNT_STATUS.ENABLE_SUCCESS, severity: 'success' });
      }
    } catch (err: unknown) {
      logError(err, `Users.${action}User`);
      const fallback =
        action === 'disable'
          ? USERS_LABELS.ACCOUNT_STATUS.DISABLE_ERROR
          : USERS_LABELS.ACCOUNT_STATUS.ENABLE_ERROR;
      setSnackbar({ open: true, message: extractErrorMessage(err, fallback), severity: 'error' });
    }
  };

  const usersData: User[] = useMemo(() => {
    if (!data?.users) return [];
    
    return data.users.map((user) => {
      const avatar = user.name?.charAt(0).toUpperCase() || '?';
      
      let lastLogin: string = USERS_LABELS.LAST_LOGIN.NEVER;
      if (user.last_login) {
        const date = new Date(user.last_login);
        lastLogin = date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      
      const status = user.status.charAt(0).toUpperCase() + user.status.slice(1);

      // Display the org-level role (read-only). Editing moved to Role Management.
      const role = user.org_role
        ? (ORG_ROLE_LABELS[user.org_role] ?? user.org_role)
        : user.role.charAt(0).toUpperCase() + user.role.slice(1);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        status,
        lastLogin,
        avatar,
      };
    });
  }, [data]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(USERS_CONSTANTS.PAGINATION.ROWS_PER_PAGE);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: USERS_CONSTANTS.PAGINATION.DEFAULT_SORT_KEY,
    direction: USERS_CONSTANTS.PAGINATION.DEFAULT_SORT_DIRECTION
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    let filtered = [...usersData];

    if (currentSearchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [usersData, currentSearchTerm]);

  const sortedData = useMemo(() => {
    const activeSortKey = sortConfig.key || USERS_CONSTANTS.PAGINATION.DEFAULT_SORT_KEY;
    const activeSortDirection = sortConfig.direction || USERS_CONSTANTS.PAGINATION.DEFAULT_SORT_DIRECTION;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[activeSortKey as keyof User];
      const bValue = b[activeSortKey as keyof User];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
       
        const compareResult = aValue.localeCompare(bValue, undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        });
        return activeSortDirection === 'asc' ? compareResult : -compareResult;
      }
      // Fallback: convert to string and compare
      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, sortConfig]);

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: USERS_LABELS.TABLE.USER,
      sortable: true,
      render: (user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: USERS_CONSTANTS.AVATAR.GAP }}>
          <Avatar sx={{ 
            bgcolor: USERS_CONSTANTS.AVATAR.BACKGROUND_COLOR, 
            width: USERS_CONSTANTS.AVATAR.SIZE, 
            height: USERS_CONSTANTS.AVATAR.SIZE, 
            fontSize: USERS_CONSTANTS.AVATAR.FONT_SIZE 
          }}>
            {user.avatar}
          </Avatar>
          <Box>
            <Typography sx={{ 
              fontWeight: USERS_CONSTANTS.USER_INFO.NAME_FONT_WEIGHT, 
              fontSize: USERS_CONSTANTS.USER_INFO.NAME_FONT_SIZE, 
              lineHeight: USERS_CONSTANTS.USER_INFO.NAME_LINE_HEIGHT 
            }}>
              {user.name}
            </Typography>
            <Typography sx={{ 
              fontSize: USERS_CONSTANTS.USER_INFO.EMAIL_FONT_SIZE, 
              color: USERS_CONSTANTS.USER_INFO.EMAIL_COLOR, 
              lineHeight: USERS_CONSTANTS.USER_INFO.EMAIL_LINE_HEIGHT 
            }}>
              {user.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'role',
      header: USERS_LABELS.TABLE.ROLE,
      sortable: true,
      // Read-only org role. Role changes are managed on the Role Management page.
      render: (user) => (
        <Chip
          label={user.role}
          size="small"
          sx={{
            backgroundColor: USERS_CONSTANTS.CHIP.ROLE.BACKGROUND_COLOR,
            color: USERS_CONSTANTS.CHIP.ROLE.COLOR,
            fontWeight: USERS_CONSTANTS.CHIP.ROLE.FONT_WEIGHT,
            height: USERS_CONSTANTS.CHIP.ROLE.HEIGHT,
            fontSize: USERS_CONSTANTS.CHIP.ROLE.FONT_SIZE,
            '& .MuiChip-label': {
              padding: USERS_CONSTANTS.CHIP.ROLE.LABEL_PADDING,
            },
          }}
        />
      ),
    },
    {
      key: 'status',
      header: USERS_LABELS.TABLE.STATUS,
      sortable: true,
      render: (user) => {
        const statusConfig = 
          user.status === USERS_LABELS.STATUS.ACTIVE ? USERS_CONSTANTS.CHIP.STATUS.ACTIVE :
          user.status === USERS_LABELS.STATUS.PENDING ? USERS_CONSTANTS.CHIP.STATUS.PENDING :
          USERS_CONSTANTS.CHIP.STATUS.INACTIVE;

        return (
          <Chip
            label={user.status}
            size="small"
            sx={{
              backgroundColor: statusConfig.BACKGROUND,
              color: statusConfig.COLOR,
              fontWeight: USERS_CONSTANTS.CHIP.STATUS.FONT_WEIGHT,
              height: USERS_CONSTANTS.CHIP.STATUS.HEIGHT,
              fontSize: USERS_CONSTANTS.CHIP.STATUS.FONT_SIZE,
              '& .MuiChip-label': {
                padding: USERS_CONSTANTS.CHIP.STATUS.LABEL_PADDING,
              },
            }}
          />
        );
      },
    },
    {
      key: 'lastLogin',
      header: USERS_LABELS.TABLE.LAST_LOGIN,
      sortable: true,
      render: (user) => (
        <Typography sx={{ 
          fontSize: USERS_CONSTANTS.LAST_LOGIN.FONT_SIZE, 
          color: USERS_CONSTANTS.LAST_LOGIN.COLOR, 
          lineHeight: USERS_CONSTANTS.LAST_LOGIN.LINE_HEIGHT 
        }}>
          {user.lastLogin}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: USERS_LABELS.TABLE.ACTIONS,
      sortable: false,
      columnWidth: '140px',
      render: (user) => (
        <Box sx={{ display: 'flex', gap: USERS_CONSTANTS.ACTIONS.GAP, justifyContent: 'flex-start' }}>
          {user.status === USERS_LABELS.STATUS.INACTIVE ? (
            <IconButton
              size="small"
              aria-label={USERS_LABELS.ACCOUNT_STATUS.ENABLE_TOOLTIP}
              title={USERS_LABELS.ACCOUNT_STATUS.ENABLE_TOOLTIP}
              onClick={() => setStatusDialog({ userId: user.id, action: 'enable' })}
              sx={{
                color: '#16a34a',
                padding: USERS_CONSTANTS.ACTIONS.ICON_PADDING,
                '& svg': { fontSize: USERS_CONSTANTS.ACTIONS.ICON_SIZE },
              }}
            >
              <CheckCircleOutlineIcon />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              aria-label={USERS_LABELS.ACCOUNT_STATUS.DISABLE_TOOLTIP}
              title={USERS_LABELS.ACCOUNT_STATUS.DISABLE_TOOLTIP}
              onClick={() => setStatusDialog({ userId: user.id, action: 'disable' })}
              sx={{
                color: USERS_CONSTANTS.ACTIONS.DELETE_COLOR,
                padding: USERS_CONSTANTS.ACTIONS.ICON_PADDING,
                '& svg': { fontSize: USERS_CONSTANTS.ACTIONS.ICON_SIZE },
              }}
            >
              <BlockIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  // Handlers
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSortRequest = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleOpenAddUserModal=()=>{
    setIsAddUserModalOpen(true);
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const handleUserCreated = () => {
    // Refetch users list after creating a new user
    refetch();
    // Optional: Refresh users list or perform other actions when user is created
    // This callback is called after successful user creation
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: USERS_CONSTANTS.LAYOUT.PAGE_GAP, p: USERS_CONSTANTS.LAYOUT.PAGE_PADDING }}>
      {/* Page Title Section */}
      <Box>
        <Typography variant={USERS_CONSTANTS.TYPOGRAPHY.TITLE_VARIANT} fontWeight={USERS_CONSTANTS.TYPOGRAPHY.TITLE_FONT_WEIGHT} sx={{ mb: USERS_CONSTANTS.LAYOUT.TITLE_MARGIN_BOTTOM }}>
          {USERS_LABELS.PAGE_TITLE}
        </Typography>
        <Typography sx={{ color: USERS_CONSTANTS.TYPOGRAPHY.SUBTITLE_COLOR, fontSize: USERS_CONSTANTS.TYPOGRAPHY.SUBTITLE_FONT_SIZE }}>
          {USERS_LABELS.SUBTITLE}
        </Typography>
      </Box>
      
      {/* Loading State */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>{USERS_LABELS.MESSAGES.LOADING}</Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">{USERS_LABELS.MESSAGES.ERROR}</Typography>
        </Box>
      ) : (
        <>
      {/* Search Bar and Add Button Row */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2,
        mb: USERS_CONSTANTS.LAYOUT.ACTION_BAR_MARGIN_BOTTOM,
      }}>
        {/* Search Bar */}
        <TextField
          placeholder={USERS_LABELS.SEARCH_PLACEHOLDER}
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
              '& .MuiOutlinedInput-notchedOutline': { 
                border: 'none !important',
                display: 'none !important'
              },
              '&:hover': { 
                boxShadow: 'inset 0 0 0 1px #BFD1E6 !important',
                '& .MuiOutlinedInput-notchedOutline': { 
                  border: 'none !important',
                  display: 'none !important'
                },
              },
              '&.Mui-focused': { 
                boxShadow: 'inset 0 0 0 1px #BFD1E6 !important',
                '& .MuiOutlinedInput-notchedOutline': { 
                  border: 'none !important',
                  display: 'none !important'
                },
              },
            },
            '& .MuiInputBase-input': {
              padding: '10px 14px',
              paddingLeft: '6px',
            },
            '& .MuiOutlinedInput-input::placeholder': {
              textAlign: 'left',
              fontSize: '16px',
              opacity: 1,
              color: '#9CA3AF',
            },
          }}
        />
        
        {/* Add New User Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddUserModal}
          sx={{
            backgroundColor: USERS_CONSTANTS.BUTTON.BACKGROUND_COLOR,
            color: USERS_CONSTANTS.BUTTON.COLOR,
            textTransform: USERS_CONSTANTS.BUTTON.TEXT_TRANSFORM,
            px: USERS_CONSTANTS.BUTTON.PADDING_X,
            borderRadius: USERS_CONSTANTS.BUTTON.BORDER_RADIUS,
            '&:hover': { backgroundColor: USERS_CONSTANTS.BUTTON.HOVER_BACKGROUND },
            flexShrink: 0,
          }}
        >
          {USERS_LABELS.ADD_BUTTON}
        </Button>
      </Box>

      <Box sx={{ 
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
        '& .MuiTable-root': {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
        '& .MuiTableCell-root': {
          fontFamily: USERS_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          padding: `${USERS_CONSTANTS.TABLE.CELL_PADDING} !important`,
          border: USERS_CONSTANTS.TABLE.CELL_BORDER,
          borderBottom: USERS_CONSTANTS.TABLE.ROW_BORDER,
          textAlign: 'left !important',
        },
        '& .MuiTableHead .MuiTableCell-root, & .MuiTableHead .MuiTableCell-root[class*="MuiTableCell-root"]': {
          fontFamily: USERS_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontWeight: USERS_CONSTANTS.TABLE.HEADER_FONT_WEIGHT,
          fontSize: `${USERS_CONSTANTS.TABLE.HEADER_FONT_SIZE} !important`,
          lineHeight: `${USERS_CONSTANTS.TABLE.HEADER_LINE_HEIGHT} !important`,
          color: USERS_CONSTANTS.TABLE.HEADER_COLOR,
          backgroundColor: USERS_CONSTANTS.TABLE.HEADER_BACKGROUND,
          padding: `${USERS_CONSTANTS.TABLE.HEADER_PADDING} !important`,
          minHeight: 'auto !important',
          height: 'auto !important',
          borderRight: USERS_CONSTANTS.TABLE.HEADER_CELL_BORDER_RIGHT,
          borderBottom: USERS_CONSTANTS.TABLE.ROW_BORDER,
          textAlign: 'left !important',
          '&:first-of-type': {
            paddingLeft: '20px !important',
            '& > *': {
              marginLeft: '8px !important',
            },
            '& .MuiBox-root': {
              marginLeft: '8px !important',
            },
          },
          '&:last-child': {
            borderRight: 'none',
            minWidth: '140px !important',
            width: '140px !important',
            maxWidth: '140px !important',
            overflow: 'visible !important',
            textOverflow: 'clip !important',
            whiteSpace: 'nowrap !important',
            textAlign: 'left !important',
            paddingLeft: '20px !important',
            paddingRight: '20px !important',
          },
        },
        '& .MuiTableBody .MuiTableRow:nth-of-type(odd)': {
          backgroundColor: `${USERS_CONSTANTS.TABLE.ROW_BACKGROUND_ODD} !important`,
        },
        '& .MuiTableBody .MuiTableRow:nth-of-type(even)': {
          backgroundColor: `${USERS_CONSTANTS.TABLE.ROW_BACKGROUND_EVEN} !important`,
        },
        '& .MuiTableBody .MuiTableRow': {
          borderBottom: USERS_CONSTANTS.TABLE.ROW_BORDER,
          '&:last-child': {
            borderBottom: 'none',
          },
          '&:hover': {
            backgroundColor: `${USERS_CONSTANTS.TABLE.ROW_HOVER_BACKGROUND} !important`,
          },
          '&:focus': {
            backgroundColor: 'inherit !important',
          },
          '&:active': {
            backgroundColor: 'inherit !important',
          },
        },
        '& .MuiTableBody .MuiTableCell-root': {
          borderRight: 'none',
        },
        '& .MuiTableBody .MuiTableCell-root:first-of-type': {
          paddingLeft: '20px !important',
        },
        '& .MuiTableBody .MuiTableCell-root:last-child': {
          minWidth: '140px !important',
          width: '140px !important',
          maxWidth: '140px !important',
          textAlign: 'left !important',
          paddingLeft: '20px !important',
          paddingRight: '20px !important',
        },
        '&::-webkit-scrollbar': {
          height: USERS_CONSTANTS.SCROLLBAR.HEIGHT,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: USERS_CONSTANTS.SCROLLBAR.TRACK_COLOR,
          borderRadius: USERS_CONSTANTS.SCROLLBAR.TRACK_BORDER_RADIUS,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: USERS_CONSTANTS.SCROLLBAR.THUMB_COLOR,
          borderRadius: USERS_CONSTANTS.SCROLLBAR.THUMB_BORDER_RADIUS,
          '&:hover': {
            backgroundColor: USERS_CONSTANTS.SCROLLBAR.THUMB_HOVER_COLOR,
          },
        },
      }}>
        <ReusableTable
          columns={columns}
          data={sortedData}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          searchAndFilterConfig={{ 
            filterOptions: [],
          }}
          currentSearchTerm=""
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
          totalRows={sortedData.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      </Box>
        </>
      )}
      
      <AddUserModal
        open={isAddUserModalOpen}
        onClose={handleCloseAddUserModal}
        onSuccess={handleUserCreated}
      />

      <ConfirmationDialog
        open={statusDialog !== null}
        title={
          statusDialog?.action === 'enable'
            ? USERS_LABELS.ACCOUNT_STATUS.ENABLE_TITLE
            : USERS_LABELS.ACCOUNT_STATUS.DISABLE_TITLE
        }
        message={
          statusDialog?.action === 'enable'
            ? USERS_LABELS.ACCOUNT_STATUS.ENABLE_CONFIRM
            : USERS_LABELS.ACCOUNT_STATUS.DISABLE_CONFIRM
        }
        confirmLabel={USERS_LABELS.ACCOUNT_STATUS.YES}
        cancelLabel={USERS_LABELS.ACCOUNT_STATUS.NO}
        onClose={() => setStatusDialog(null)}
        onCancel={() => setStatusDialog(null)}
        onConfirm={handleConfirmStatusChange}
      />

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
export default Users;