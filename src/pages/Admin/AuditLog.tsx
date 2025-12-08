import React, { useState, useMemo, ChangeEvent } from 'react';
import { Box, Typography, Button, Avatar, Chip, TextField, Autocomplete, InputAdornment, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SearchIcon from '@mui/icons-material/Search';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { AUDIT_LOG_LABELS } from '../../config/label/AuditLog.labels';
import { AUDIT_LOG_CONSTANTS } from '../../config/constants/AuditLog.constants';
import { useNavigate } from 'react-router-dom';
import { StandardButton, PharmaDatePicker } from '../../components/Common';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useGetActivityLogQuery } from '../../redux/slices/adminSlice';
import { extractErrorMessage } from '../../utils/errorUtils';

interface AuditLogEntry {
  id: number;
  username: string;
  userAvatar: string;
  accessLevel: string;
  role: string;
  module: string;
  eventType: string;
  eventTime: string;
  eventDetails: string;
  quantityChanged: string | number;
  relatedId?: string | number;
}

const AuditLog: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: activityLogData, isLoading, error } = useGetActivityLogQuery();
  
  const sampleData: AuditLogEntry[] = useMemo(() => {
    const entries = Array.isArray(activityLogData)
      ? activityLogData
      : activityLogData?.activityLog ?? [];

    if (!entries.length) {
      return [];
    }

    return entries.map((entry, index) => {
      const username = entry.username || '';
      const safeUsername = username || 'NA';

      return {
        id: entry.id ?? index,
        username,
        userAvatar:
          entry.userAvatar ||
          safeUsername.substring(0, 2).toUpperCase(),
        accessLevel: entry.accessLevel || entry.role || '',
        role: entry.role || entry.accessLevel || '',
        module: entry.module || entry.module_name || 'N/A',
        eventType: entry.eventType || entry.event_type || 'N/A',
        eventTime: entry.eventTime || entry.event_time || '',
        eventDetails: entry.eventDetails || entry.event_details || '',
        quantityChanged: entry.quantityChanged ?? entry.quantity_changed ?? '',
        relatedId: entry.relatedId ?? entry.related_id ?? '',
      };
    });
  }, [activityLogData]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(AUDIT_LOG_CONSTANTS.PAGINATION.ROWS_PER_PAGE);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: AUDIT_LOG_CONSTANTS.PAGINATION.DEFAULT_SORT_KEY,
    direction: AUDIT_LOG_CONSTANTS.PAGINATION.DEFAULT_SORT_DIRECTION
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});
  
  // Filter states
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<Dayjs | null>(null);
  const [eventDetailsDialog, setEventDetailsDialog] = useState<{ open: boolean; details: string }>({ open: false, details: '' });

  // Get unique values for dropdowns
  const getUniqueUsernames = useMemo(() => {
    return Array.from(new Set(sampleData.map(entry => entry.username))).sort();
  }, [sampleData]);

  const getUniqueAccessLevels = useMemo(() => {
    return Array.from(new Set(sampleData.map(entry => entry.role || entry.accessLevel))).sort();
  }, [sampleData]);

  const getUniqueModules = useMemo(() => {
    return Array.from(new Set(sampleData.map(entry => entry.module))).sort();
  }, [sampleData]);

  const getUniqueEventTypes = useMemo(() => {
    return Array.from(new Set(sampleData.map(entry => entry.eventType))).sort();
  }, [sampleData]);

  const filteredData = useMemo(() => {
    let filtered = [...sampleData];

    // Username filter
    if (selectedUsername) {
      filtered = filtered.filter(entry => 
        entry.username.toLowerCase().includes(selectedUsername.toLowerCase())
      );
    }

    // Role filter
    if (selectedAccessLevel) {
      filtered = filtered.filter(entry => {
        const roleValue = (entry.role || entry.accessLevel || '').toLowerCase();
        return roleValue.includes(selectedAccessLevel.toLowerCase());
      });
    }

    // Module filter
    if (selectedModule) {
      filtered = filtered.filter(entry => 
        entry.module.toLowerCase().includes(selectedModule.toLowerCase())
      );
    }

    // Event Type filter
    if (selectedEventType) {
      filtered = filtered.filter(entry => 
        entry.eventType.toLowerCase().includes(selectedEventType.toLowerCase())
      );
    }

    if (eventTime) {
      filtered = filtered.filter(entry => {
        const eventDate = dayjs(entry.eventTime);
        return eventDate.isSame(eventTime, 'day');
      });
    }

    if (currentSearchTerm) {
      filtered = filtered.filter(entry =>
        entry.username.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        entry.module.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        entry.eventType.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        (entry.role || entry.accessLevel || '').toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [sampleData, selectedUsername, selectedAccessLevel, selectedModule, selectedEventType, eventTime, currentSearchTerm]);

  const clearAllFilters = () => {
    setSelectedUsername(null);
    setSelectedAccessLevel(null);
    setSelectedModule(null);
    setSelectedEventType(null);
    setEventTime(null);
    setCurrentSearchTerm('');
    setCurrentFilter({});
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    const activeSortKey = sortConfig.key || AUDIT_LOG_CONSTANTS.PAGINATION.DEFAULT_SORT_KEY;
    const activeSortDirection = sortConfig.direction || AUDIT_LOG_CONSTANTS.PAGINATION.DEFAULT_SORT_DIRECTION;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[activeSortKey as keyof AuditLogEntry];
      const bValue = b[activeSortKey as keyof AuditLogEntry];

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

  const columns: TableColumn<AuditLogEntry>[] = [
    {
      key: 'eventTime',
      header: AUDIT_LOG_LABELS.TABLE.TIME,
      sortable: true,
      render: (entry) => (
        <Typography sx={{ 
          fontSize: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_SIZE, 
          color: AUDIT_LOG_CONSTANTS.TABLE.TEXT_COLOR_PRIMARY
        }}>
          {entry.eventTime}
        </Typography>
      ),
    },
    {
      key: 'module',
      header: AUDIT_LOG_LABELS.TABLE.MODULE,
      sortable: true,
      render: (entry) => (
        <Typography sx={{ 
          fontSize: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_SIZE, 
          color: AUDIT_LOG_CONSTANTS.TABLE.TEXT_COLOR_PRIMARY
        }}>
          {entry.module}
        </Typography>
      ),
    },
    {
      key: 'eventType',
      header: AUDIT_LOG_LABELS.TABLE.EVENT_TYPE,
      sortable: true,
      render: (entry) => (
        <Typography sx={{ 
          fontSize: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_SIZE, 
          color: AUDIT_LOG_CONSTANTS.TABLE.TEXT_COLOR_PRIMARY
        }}>
          {entry.eventType}
        </Typography>
      ),
    },
    {
      key: 'relatedId',
      header: AUDIT_LOG_LABELS.TABLE.RELATED_ID,
      sortable: true,
      render: (entry) => (
        <Typography sx={{ 
          fontSize: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_SIZE, 
          color: AUDIT_LOG_CONSTANTS.TABLE.TEXT_COLOR_PRIMARY
        }}>
          {entry.relatedId || '-'}
        </Typography>
      ),
    },
    {
      key: 'quantityChanged',
      header: AUDIT_LOG_LABELS.TABLE.QUANTITY_CHANGED,
      sortable: true,
      render: (entry) => (
        <Typography sx={{ 
          fontSize: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_SIZE, 
          color: AUDIT_LOG_CONSTANTS.TABLE.TEXT_COLOR_PRIMARY
        }}>
          {entry.quantityChanged}
        </Typography>
      ),
    },
    {
      key: 'eventDetails',
      header: AUDIT_LOG_LABELS.TABLE.DETAILS,
      sortable: false,
      render: (entry) => {
        const maxLength = 25;
        const isLongText = entry.eventDetails.length > maxLength;
        const truncatedText = isLongText 
          ? `${entry.eventDetails.substring(0, maxLength)}...` 
          : entry.eventDetails;
        
        return (
          <Tooltip 
            title={entry.eventDetails} 
            arrow 
            placement="top"
            enterDelay={300}
            leaveDelay={100}
          >
            <Typography 
              onClick={() => isLongText && setEventDetailsDialog({ open: true, details: entry.eventDetails })}
              sx={{ 
                fontSize: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_SIZE, 
                color: AUDIT_LOG_CONSTANTS.TABLE.TEXT_COLOR_PRIMARY,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                maxWidth: '100%',
                cursor: isLongText ? 'pointer' : 'default',
              }}
            >
              {truncatedText}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      key: 'username',
      header: AUDIT_LOG_LABELS.TABLE.USERNAME,
      sortable: true,
      render: (entry) => (
        <Typography
          sx={{
            fontWeight: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_WEIGHT,
            fontSize: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_FONT_SIZE,
            lineHeight: AUDIT_LOG_CONSTANTS.USER_INFO.NAME_LINE_HEIGHT,
            color: AUDIT_LOG_CONSTANTS.TABLE.TEXT_COLOR_PRIMARY,
          }}
        >
          {entry.username || 'NA'}
        </Typography>
      ),
    },
    {
      key: 'role',
      header: AUDIT_LOG_LABELS.TABLE.ROLE,
      sortable: true,
      render: (entry) => (
        <Chip
          label={entry.role || entry.accessLevel}
          size="small"
          sx={{
            backgroundColor: AUDIT_LOG_CONSTANTS.CHIP.ACCESS_LEVEL.BACKGROUND_COLOR,
            color: AUDIT_LOG_CONSTANTS.CHIP.ACCESS_LEVEL.COLOR,
            fontWeight: AUDIT_LOG_CONSTANTS.CHIP.ACCESS_LEVEL.FONT_WEIGHT,
            height: AUDIT_LOG_CONSTANTS.CHIP.ACCESS_LEVEL.HEIGHT,
            fontSize: AUDIT_LOG_CONSTANTS.CHIP.ACCESS_LEVEL.FONT_SIZE,
            '& .MuiChip-label': {
              padding: AUDIT_LOG_CONSTANTS.CHIP.ACCESS_LEVEL.LABEL_PADDING,
            },
          }}
        />
      ),
    },
  ];

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

  const handleShowFiltersToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterSelect = (key: string, value: string | null) => {
    setCurrentFilter(prev => ({
      ...prev,
      [key]: prev[key] ? null : 'active' 
    }));
  };


  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <>
      <style>
        {`
          .css-q2rhsq {
            margin-top: -25px !important;
          }
        `}
      </style>
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: AUDIT_LOG_CONSTANTS.LAYOUT.PAGE_GAP, 
        p: AUDIT_LOG_CONSTANTS.LAYOUT.PAGE_PADDING,
        position: 'relative',
        minHeight: 'calc(100vh - 200px)',
        pb: 10,
      }}>
      {/* Page Title Section */}
      <Box sx={{ mt: -3 }}>
        <Typography 
          variant={AUDIT_LOG_CONSTANTS.TYPOGRAPHY.TITLE_VARIANT} 
          fontWeight={AUDIT_LOG_CONSTANTS.TYPOGRAPHY.TITLE_FONT_WEIGHT} 
          sx={{ mb: AUDIT_LOG_CONSTANTS.LAYOUT.TITLE_MARGIN_BOTTOM }}
        >
          {AUDIT_LOG_LABELS.PAGE_TITLE}
        </Typography>
        <Typography sx={{ 
          color: AUDIT_LOG_CONSTANTS.TYPOGRAPHY.SUBTITLE_COLOR, 
          fontSize: AUDIT_LOG_CONSTANTS.TYPOGRAPHY.SUBTITLE_FONT_SIZE 
        }}>
          {AUDIT_LOG_LABELS.SUBTITLE}
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        bgcolor: '#F6F8FB',
        borderRadius: '16px',
        border: '1px solid #E6ECF5',
        p: '12px',
      }}>
        <TextField
          placeholder={AUDIT_LOG_LABELS.SEARCH_PLACEHOLDER}
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
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#fff',
            width: '600px',
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
        <StandardButton
          startIcon={
            showFilters 
              ? <FilterListOffIcon sx={{ color: '#1A212B', fontSize: 18 }} />
              : <FilterAltIcon sx={{ color: '#1A212B', fontSize: 18 }} />
          }
          onClick={handleShowFiltersToggle}
          variant="secondary"
          size="medium"
          sx={{
            minWidth: 160,
            borderRadius: '12px',
            bgcolor: '#EEF2F7',
            color: '#1A212B',
            border: '1px solid #D7DFEA',
            boxShadow: '0 2px 8px rgba(2, 6, 23, 0.08)',
            fontSize: '14px',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {showFilters ? 'Hide filters' : 'Show filters'}
        </StandardButton>
      </Box>

      {/* Custom Filters Section */}
      {showFilters && (
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 3, 
          mt: -1,
          alignItems: 'flex-start', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap', flex: 1 }}>
            {/* Username Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#728197' }}>{AUDIT_LOG_LABELS.FILTERS.USERNAME}</Typography>
              <Autocomplete
                key={`username-${selectedUsername}`}
                value={selectedUsername}
                onChange={(event, newValue) => setSelectedUsername(newValue)}
                options={getUniqueUsernames}
                freeSolo
                forcePopupIcon
                clearOnEscape
                disableClearable={false}
                isOptionEqualToValue={(option, value) => option === value}
                popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search username..."
                    sx={{
                      width: 220,
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #D1D5DB',
                        },
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                        '&.Mui-focused': {
                          outline: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#1A212B',
                        fontWeight: 500,
                      },
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E6ECF5',
                    '& .MuiAutocomplete-option': {
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        color: '#ffffff',
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Access Level Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#728197' }}>{AUDIT_LOG_LABELS.FILTERS.ACCESS_LEVEL}</Typography>
              <Autocomplete
                key={`accessLevel-${selectedAccessLevel}`}
                value={selectedAccessLevel}
                onChange={(event, newValue) => setSelectedAccessLevel(newValue)}
                options={getUniqueAccessLevels}
                freeSolo
                forcePopupIcon
                clearOnEscape
                disableClearable={false}
                isOptionEqualToValue={(option, value) => option === value}
                popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search access level..."
                    sx={{
                      width: 220,
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #D1D5DB',
                        },
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                        '&.Mui-focused': {
                          outline: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#1A212B',
                        fontWeight: 500,
                      },
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E6ECF5',
                    '& .MuiAutocomplete-option': {
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        color: '#ffffff',
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Module Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#728197' }}>{AUDIT_LOG_LABELS.FILTERS.MODULE}</Typography>
              <Autocomplete
                key={`module-${selectedModule}`}
                value={selectedModule}
                onChange={(event, newValue) => setSelectedModule(newValue)}
                options={getUniqueModules}
                freeSolo
                forcePopupIcon
                clearOnEscape
                disableClearable={false}
                isOptionEqualToValue={(option, value) => option === value}
                popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search module..."
                    sx={{
                      width: 220,
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #D1D5DB',
                        },
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                        '&.Mui-focused': {
                          outline: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#1A212B',
                        fontWeight: 500,
                      },
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E6ECF5',
                    '& .MuiAutocomplete-option': {
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        color: '#ffffff',
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Event Type Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#728197' }}>{AUDIT_LOG_LABELS.FILTERS.EVENT_TYPE}</Typography>
              <Autocomplete
                key={`eventType-${selectedEventType}`}
                value={selectedEventType}
                onChange={(event, newValue) => setSelectedEventType(newValue)}
                options={getUniqueEventTypes}
                freeSolo
                forcePopupIcon
                clearOnEscape
                disableClearable={false}
                isOptionEqualToValue={(option, value) => option === value}
                popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search event type..."
                    sx={{
                      width: 220,
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #D1D5DB',
                        },
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                        '&.Mui-focused': {
                          outline: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#1A212B',
                        fontWeight: 500,
                      },
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E6ECF5',
                    '& .MuiAutocomplete-option': {
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        color: '#ffffff',
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Event Time Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#728197' }}>{AUDIT_LOG_LABELS.TABLE.TIME}</Typography>
              <PharmaDatePicker
                value={eventTime}
                onChange={(newValue) => setEventTime(newValue)}
                width={260}
                height={40}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            <StandardButton
              onClick={clearAllFilters}
              variant="secondary"
              size="medium"
              sx={{
                minWidth: 160,
                height: '40px',
                backgroundColor: '#F5F5F5',
                border: '1px solid #D1D5DB',
                color: '#1A212B',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#E0E0E0',
                  border: '1px solid #D1D5DB',
                }
              }}
            >
              {AUDIT_LOG_LABELS.FILTERS.RESET}
            </StandardButton>
          </Box>
        </Box>
      )}

      {/* Table with built-in search and filters */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>{AUDIT_LOG_LABELS.MESSAGES.LOADING}</Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">
            {extractErrorMessage(error, AUDIT_LOG_LABELS.MESSAGES.ERROR)}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
        marginTop: 1,
        overflowX: 'auto',
        backgroundColor: AUDIT_LOG_CONSTANTS.TABLE.CONTAINER_BACKGROUND,
        borderRadius: AUDIT_LOG_CONSTANTS.TABLE.CONTAINER_BORDER_RADIUS,
        border: AUDIT_LOG_CONSTANTS.TABLE.CONTAINER_BORDER,
        fontFamily: AUDIT_LOG_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
        padding: '1px',
        '& .MuiTableContainer-root': {
          boxShadow: 'none',
          borderRadius: AUDIT_LOG_CONSTANTS.TABLE.CONTAINER_BORDER_RADIUS,
          border: 'none',
        },
        '& .MuiTable-root': {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
        '& .MuiTableCell-root': {
          fontFamily: AUDIT_LOG_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          padding: `${AUDIT_LOG_CONSTANTS.TABLE.CELL_PADDING} !important`,
          border: AUDIT_LOG_CONSTANTS.TABLE.CELL_BORDER,
          borderBottom: AUDIT_LOG_CONSTANTS.TABLE.ROW_BORDER,
        },
        '& .MuiTableHead .MuiTableCell-root, & .MuiTableHead .MuiTableCell-root[class*="MuiTableCell-root"]': {
          fontFamily: AUDIT_LOG_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontWeight: AUDIT_LOG_CONSTANTS.TABLE.HEADER_FONT_WEIGHT,
          fontSize: `${AUDIT_LOG_CONSTANTS.TABLE.HEADER_FONT_SIZE} !important`,
          lineHeight: `${AUDIT_LOG_CONSTANTS.TABLE.HEADER_LINE_HEIGHT} !important`,
          color: AUDIT_LOG_CONSTANTS.TABLE.HEADER_COLOR,
          backgroundColor: AUDIT_LOG_CONSTANTS.TABLE.HEADER_BACKGROUND,
          padding: `${AUDIT_LOG_CONSTANTS.TABLE.HEADER_PADDING} !important`,
          minHeight: 'auto !important',
          height: 'auto !important',
          borderRight: AUDIT_LOG_CONSTANTS.TABLE.HEADER_CELL_BORDER_RIGHT,
          borderBottom: AUDIT_LOG_CONSTANTS.TABLE.ROW_BORDER,
          whiteSpace: 'nowrap',
          '&:last-child': {
            borderRight: 'none',
          },
        },
        '& .MuiTableBody .MuiTableRow:nth-of-type(odd)': {
          backgroundColor: `${AUDIT_LOG_CONSTANTS.TABLE.ROW_BACKGROUND_ODD} !important`,
        },
        '& .MuiTableBody .MuiTableRow:nth-of-type(even)': {
          backgroundColor: `${AUDIT_LOG_CONSTANTS.TABLE.ROW_BACKGROUND_EVEN} !important`,
        },
        '& .MuiTableBody .MuiTableRow': {
          borderBottom: AUDIT_LOG_CONSTANTS.TABLE.ROW_BORDER,
          '&:last-child': {
            borderBottom: 'none',
          },
          '&:hover': {
            backgroundColor: `${AUDIT_LOG_CONSTANTS.TABLE.ROW_HOVER_BACKGROUND} !important`,
          },
        },
        '& .MuiTableBody .MuiTableCell-root': {
          borderRight: 'none',
        },
      }}>
        <ReusableTable
          columns={columns}
          data={sortedData}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
          currentFilter={{}}
          totalRows={sortedData.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      </Box>
      )}

      {/* Back Button */}
      <Button
        variant="contained"
        onClick={handleBack}
        sx={{
          ...AUDIT_LOG_CONSTANTS.LAYOUT.BACK_BUTTON_POSITION,
          backgroundColor: AUDIT_LOG_CONSTANTS.BUTTON.BACK.BACKGROUND_COLOR,
          color: AUDIT_LOG_CONSTANTS.BUTTON.BACK.COLOR,
          textTransform: AUDIT_LOG_CONSTANTS.BUTTON.BACK.TEXT_TRANSFORM,
          px: AUDIT_LOG_CONSTANTS.BUTTON.BACK.PADDING_X,
          borderRadius: AUDIT_LOG_CONSTANTS.BUTTON.BACK.BORDER_RADIUS,
          height: AUDIT_LOG_CONSTANTS.BUTTON.BACK.HEIGHT,
          minWidth: AUDIT_LOG_CONSTANTS.BUTTON.BACK.MIN_WIDTH,
          '&:hover': { 
            backgroundColor: AUDIT_LOG_CONSTANTS.BUTTON.BACK.HOVER_BACKGROUND,
          },
        }}
      >
        {AUDIT_LOG_LABELS.BACK_BUTTON}
      </Button>

      {/* Event Details Dialog */}
      <Dialog
        open={eventDetailsDialog.open}
        onClose={() => setEventDetailsDialog({ open: false, details: '' })}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle sx={{ 
          fontSize: '18px', 
          fontWeight: 600, 
          color: '#1A212B',
          borderBottom: '1px solid #E0E0E0',
          pb: 2,
        }}>
          {AUDIT_LOG_LABELS.DIALOG.EVENT_DETAILS_TITLE}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography sx={{ 
            fontSize: '14px', 
            color: '#1A212B',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
          }}>
            {eventDetailsDialog.details}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <StandardButton
            onClick={() => setEventDetailsDialog({ open: false, details: '' })}
            variant="primary"
            size="medium"
          >
            {AUDIT_LOG_LABELS.DIALOG.CLOSE_BUTTON}
          </StandardButton>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
};

export default AuditLog;
