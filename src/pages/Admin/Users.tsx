import React, { useState, useMemo, ChangeEvent } from 'react';
import { Box, Typography, Button, Avatar, Chip, IconButton, Select, MenuItem, SelectChangeEvent, TextField, InputAdornment, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { USERS_LABELS } from '../../config/label/Users.labels';
import { USERS_CONSTANTS } from '../../config/constants/Users.constants';
import AddUserModal from '../../components/Modal/AddUser/AddUserModal';
import { useGetAllUsersQuery, useUpdateUserRoleMutation } from '../../redux/slices/adminSlice';

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
  const [updateUserRole] = useUpdateUserRoleMutation();
  
  const [localRoleUpdates, setLocalRoleUpdates] = useState<Record<number, string>>({});

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
      
      let role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      
      if (localRoleUpdates[user.id]) {
        role = localRoleUpdates[user.id].charAt(0).toUpperCase() + localRoleUpdates[user.id].slice(1);
      }
      
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
  }, [data, localRoleUpdates]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(USERS_CONSTANTS.PAGINATION.ROWS_PER_PAGE);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: USERS_CONSTANTS.PAGINATION.DEFAULT_SORT_KEY,
    direction: USERS_CONSTANTS.PAGINATION.DEFAULT_SORT_DIRECTION
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editedRole, setEditedRole] = useState<string>('');

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
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof User];
      const bValue = b[sortConfig.key as keyof User];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
       
        const compareResult = aValue.localeCompare(bValue, undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        });
        return sortConfig.direction === 'asc' ? compareResult : -compareResult;
      }
      return 0;
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
      render: (user) => {
        const isEditing = editingUserId === user.id;
        
        if (isEditing) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: USERS_CONSTANTS.ROLE_EDIT.GAP }}>
              <Select
                value={editedRole}
                onChange={(e: SelectChangeEvent<string>) => setEditedRole(e.target.value)}
                size="small"
                sx={{
                  height: USERS_CONSTANTS.CHIP.ROLE.HEIGHT,
                  fontSize: USERS_CONSTANTS.CHIP.ROLE.FONT_SIZE,
                  minWidth: USERS_CONSTANTS.ROLE_EDIT.SELECT_MIN_WIDTH,
                }}
                autoFocus
              >
                <MenuItem value="admin">{USERS_LABELS.ROLES.ADMIN}</MenuItem>
                <MenuItem value="pharmacist">{USERS_LABELS.ROLES.PHARMACIST}</MenuItem>
              </Select>
              <IconButton 
                size="small" 
                onClick={() => {
                  // Update role in local state (frontend only, not persisted to backend)
                  setLocalRoleUpdates(prev => ({
                    ...prev,
                    [user.id]: editedRole
                  }));
                  
                  // Close edit mode
                  setEditingUserId(null);
                  setEditedRole('');
                }}
                sx={{ padding: USERS_CONSTANTS.ACTIONS.BUTTON_PADDING, color: USERS_CONSTANTS.ACTIONS.CONFIRM_COLOR }}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => {
                  setEditingUserId(null);
                  setEditedRole('');
                }}
                sx={{ padding: USERS_CONSTANTS.ACTIONS.BUTTON_PADDING, color: USERS_CONSTANTS.ACTIONS.CANCEL_COLOR }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }
        
        return (
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
        );
      },
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
      render: (user) => (
        <Box sx={{ display: 'flex', gap: USERS_CONSTANTS.ACTIONS.GAP }}>
          <IconButton 
            size="small" 
            onClick={() => {
              setEditingUserId(user.id);
              // Convert to lowercase to match dropdown values (admin/pharmacist)
              setEditedRole(user.role.toLowerCase());
            }}
            sx={{ 
              color: USERS_CONSTANTS.ACTIONS.EDIT_COLOR,
              padding: USERS_CONSTANTS.ACTIONS.ICON_PADDING,
              '& svg': { fontSize: USERS_CONSTANTS.ACTIONS.ICON_SIZE },
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            size="small" 
            sx={{ 
              color: USERS_CONSTANTS.ACTIONS.DELETE_COLOR,
              padding: USERS_CONSTANTS.ACTIONS.ICON_PADDING,
              '& svg': { fontSize: USERS_CONSTANTS.ACTIONS.ICON_SIZE },
            }}
          >
            <BlockIcon />
          </IconButton>
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
        border: USERS_CONSTANTS.TABLE.CONTAINER_BORDER,
        fontFamily: USERS_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
        padding: '1px',
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
          '&:last-child': {
            borderRight: 'none',
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
    </Box>
  );
};
export default Users;


