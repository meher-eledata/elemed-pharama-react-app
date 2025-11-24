import React, { ChangeEvent, useState, useRef, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    TextField,
    InputAdornment,
    Button,
    useMediaQuery,
    Select,
    MenuItem,
    IconButton,
    SelectChangeEvent,
    Checkbox,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

export type FilterOption = {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date';
};

export interface SearchAndFilterConfig {
    filterOptions: FilterOption[];
    customFilters?: React.ReactNode;
    defaultPlaceholder?: string;
}

export interface TableColumn<T> {
    key: keyof T | 'checkbox' | 'actions' | string;
    header: string;
    hide?: boolean;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    headerRender?: () => React.ReactNode;
    columnWidth?: string;
}

interface ReusableTableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    selectedRows: number[];
    setSelectedRows: React.Dispatch<React.SetStateAction<number[]>>;
    emptyMessage?: string;
    searchAndFilterConfig: SearchAndFilterConfig;
    currentSearchTerm: string;
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
    showFilters: boolean;
    onShowFiltersToggle: () => void;
    currentFilterKey?: string; // Made optional
    onFilterSelect: (key: string, value: string | null) => void; // Updated this line
    totalRows: number;
    rowsPerPage: number;
    currentPage: number;
    onPageChange: (newPage: number) => void;
    onSortRequest: (key: string) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    currentFilter?: { [key: string]: string | null }; // Added this prop for better state management
}

export const ReusableTable = <T,>({
    columns,
    data,
    selectedRows,
    setSelectedRows,
    emptyMessage = 'No data available',
    searchAndFilterConfig,
    currentSearchTerm,
    onSearchChange,
    showFilters,
    onShowFiltersToggle,
    currentFilterKey,
    onFilterSelect,
    totalRows,
    rowsPerPage,
    currentPage,
    onPageChange,
    onSortRequest,
    sortConfig,
    currentFilter, // Destructure the new prop
}: ReusableTableProps<T>) => {
    const theme = useTheme();
    const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const [showScrollbar, setShowScrollbar] = useState(false);

    const visibleColumns = columns.filter((col) => !col.hide);
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    // Calculate paginated data
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    
    // Sync scrollbar with table
    useEffect(() => {
        if (totalRows === 0) return;
        
        const tableContainer = tableContainerRef.current;
        const scrollbar = scrollbarRef.current;
        
        if (!tableContainer) return;
        
        // Calculate and set scrollbar content width
        const updateScrollbarWidth = () => {
            const table = tableContainer.querySelector('table');
            if (!table) return;
            
            const scrollWidth = table.scrollWidth;
            const clientWidth = tableContainer.clientWidth;
            
            // Show scrollbar only if content overflows
            const needsScrollbar = scrollWidth > clientWidth;
            setShowScrollbar(needsScrollbar);
            
            if (needsScrollbar && scrollbar) {
                const scrollbarContent = scrollbar.querySelector('.scrollbar-content') as HTMLElement;
                if (scrollbarContent) {
                    scrollbarContent.style.width = `${scrollWidth}px`;
                    scrollbarContent.style.minWidth = `${clientWidth}px`;
                }
            }
        };
        
        // Initial setup
        setTimeout(updateScrollbarWidth, 100);
        
        // Update on resize
        const resizeObserver = new ResizeObserver(updateScrollbarWidth);
        resizeObserver.observe(tableContainer);
        
        const handleTableScroll = () => {
            if (scrollbar && showScrollbar) {
                scrollbar.scrollLeft = tableContainer.scrollLeft;
            }
        };
        
        const handleScrollbarScroll = () => {
            if (tableContainer && scrollbar && showScrollbar) {
                tableContainer.scrollLeft = scrollbar.scrollLeft;
            }
        };
        
        tableContainer.addEventListener('scroll', handleTableScroll);
        if (scrollbar) {
            scrollbar.addEventListener('scroll', handleScrollbarScroll);
        }
        
        return () => {
            resizeObserver.disconnect();
            tableContainer.removeEventListener('scroll', handleTableScroll);
            if (scrollbar) {
                scrollbar.removeEventListener('scroll', handleScrollbarScroll);
            }
        };
    }, [paginatedData, totalRows, data, showScrollbar]);

    const getPlaceholder = () => {
        const activeFilter = searchAndFilterConfig.filterOptions.find((f: FilterOption) => f.key === currentFilterKey);
        if (activeFilter) {
            return `Search by ${activeFilter.label}...`;
        }
        return searchAndFilterConfig.defaultPlaceholder || 'Search...';
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            onPageChange(newPage);
        }
    };

    const handlePageSelectChange = (event: SelectChangeEvent<number>) => {
        onPageChange(event.target.value as number);
    };

    const getColumnWidth = (columnKey: string) => {
        if (columnKey === 'checkbox' || columnKey === 'actions') {
            return '50px';
        }
        return 'auto';
    };

    const hasSearchAndFilter = searchAndFilterConfig.filterOptions.length > 0 || searchAndFilterConfig.defaultPlaceholder;

    const getActualRowIndex = (localIndex: number) => startIndex + localIndex;

    const allSelected = paginatedData.length > 0 && paginatedData.every((_, idx) => selectedRows.includes(getActualRowIndex(idx)));

    const handleSelectAll = () => {
        if (allSelected) {
            const currentPageIndices = paginatedData.map((_, idx) => getActualRowIndex(idx));
            setSelectedRows(selectedRows.filter(idx => !currentPageIndices.includes(idx)));
        } else {
            const currentPageIndices = paginatedData.map((_, idx) => getActualRowIndex(idx));
            setSelectedRows([...selectedRows.filter(idx => !currentPageIndices.includes(idx)), ...currentPageIndices]);
        }
    };

    const handleSelectRow = (rowIndex: number) => {
        const actualIndex = getActualRowIndex(rowIndex);
        if (selectedRows.includes(actualIndex)) {
            setSelectedRows(selectedRows.filter((i) => i !== actualIndex));
        } else {
            setSelectedRows([...selectedRows, actualIndex]);
        }
    };

    return (
        <>
            <style>
                {`
                    .pharma-table-search input:focus,
                    .pharma-table-search input:focus-visible,
                    .pharma-table-search .MuiOutlinedInput-root:focus,
                    .pharma-table-search .MuiOutlinedInput-root:focus-visible,
                    .pharma-table-search .MuiOutlinedInput-notchedOutline,
                    .pharma-table-search .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline,
                    .pharma-table-search .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
                    .pharma-table-search .MuiInputBase-root:focus,
                    .pharma-table-search .MuiInputBase-root:focus-visible,
                    .pharma-table-search .MuiInputBase-root.Mui-focused {
                        outline: none !important;
                        box-shadow: none !important;
                    }
                    .pharma-table-search .MuiOutlinedInput-root.Mui-focused {
                        outline: none !important;
                        box-shadow: none !important;
                    }
                `}
            </style>
            {hasSearchAndFilter && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: isTabletOrMobile ? 'stretch' : 'center',
                        flexDirection: isTabletOrMobile ? 'column' : 'row',
                        bgcolor: '#F6F8FB',
                        borderRadius: '16px',
                        border: '1px solid #9AABB',
                        p: '12px',
                        gap: '16px',
                        mb: 2,
                        height: 'auto',
                    }}
                >
                    <TextField
                        className="pharma-table-search"
                        placeholder={getPlaceholder()}
                        value={currentSearchTerm}
                        onChange={onSearchChange}
                        type={searchAndFilterConfig.filterOptions.find((f: FilterOption) => f.key === currentFilterKey)?.type || 'text'}
                        InputProps={{
                            startAdornment: !currentSearchTerm.trim() ? (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#728197', fontSize: '20px', backgroundColor: '#ffffff' }} />
                                </InputAdornment>
                            ) : null,
                            endAdornment: currentSearchTerm ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const syntheticEvent = {
                                                target: { value: '' }
                                            } as ChangeEvent<HTMLInputElement>;
                                            onSearchChange(syntheticEvent);
                                        }}
                                        sx={{
                                            padding: '4px',
                                            color: '#728197',
                                            '&:hover': {
                                                backgroundColor: 'transparent',
                                                color: '#1A212B'
                                            }
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: '18px' }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                            sx: {
                                height: '40px',
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #9AA8bc',
                                outline: 'none !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none !important',
                                },
                                '&:hover': {
                                    border: '1px solid #9AA8bc !important',
                                    outline: 'none !important',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none !important',
                                    },
                                },
                                '&.Mui-focused': {
                                    border: '1px solid #9AA8bc !important',
                                    outline: 'none !important',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none !important',
                                    },
                                },
                                '&:focus': {
                                    outline: 'none !important',
                                },
                                '&:focus-visible': {
                                    outline: 'none !important',
                                },
                            },
                        }}
                        sx={{
                            width: isTabletOrMobile ? '100%' : '628.5px',
                            borderRadius: '12px',
                            border: '5px',
                            marginBottom: isTabletOrMobile ? '12px' : 0,
                            '& .MuiOutlinedInput-root': {
                                outline: 'none !important',
                                '&:focus': {
                                    outline: 'none !important',
                                },
                                '&:focus-visible': {
                                    outline: 'none !important',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none !important',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    border: 'none !important',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    border: 'none !important',
                                },
                            },
                            '& .MuiInputBase-root': {
                                outline: 'none !important',
                                '&:focus': {
                                    outline: 'none !important',
                                },
                                '&:focus-visible': {
                                    outline: 'none !important',
                                },
                            },
                        }}
                    />
                    {searchAndFilterConfig.filterOptions.length > 0 && (
                        <Button
                            variant="contained"
                            startIcon={
                                showFilters 
                                    ? <FilterListOffIcon />
                                    : <FilterAltIcon />
                            }
                            onClick={onShowFiltersToggle}
                            sx={{
                                minWidth: 151,
                                height: 38,
                                borderRadius: '12px',
                                bgcolor: '#ECEFF4',
                                color: '#1A212B',
                                textTransform: 'none',
                                padding: '12px 16px',
                                marginLeft: isTabletOrMobile ? 0 : '45%',
                                width: isTabletOrMobile ? '100%' : 'auto',
                                '&:hover': { bgcolor: '#E0E5EA', },
                            }}
                        >
                            {showFilters ? 'Hide filters' : 'Show filters'}
                        </Button>
                    )}
                </Box>
            )}

            {showFilters && (
                <Box
                    display="flex"
                    flexWrap="wrap"
                    gap={2}
                    mb={4}
                    sx={{
                        flexDirection: isTabletOrMobile ? 'column' : 'row',
                        boxSizing: 'border-box'
                    }}
                >
                    <Typography variant="body1" sx={{ alignSelf: 'center', fontWeight: 'bold' }}>
                        Filter by:
                    </Typography>
                    {searchAndFilterConfig.filterOptions.map((option: FilterOption) => (
                        <Button
                            key={option.key}
                            variant={currentFilter?.[option.key] ? 'contained' : 'outlined'} // Use currentFilter to determine button state
                            onClick={() => onFilterSelect(option.key, currentFilter?.[option.key] ? null : 'value-placeholder')} // Example logic for selecting/clearing
                            sx={{ textTransform: 'none', width: isTabletOrMobile ? '100%' : 'auto' }}
                        >
                            {option.label}
                        </Button>
                    ))}
                    {searchAndFilterConfig.customFilters}
                </Box>
            )}

            <Box sx={{ borderRadius: totalRows > 0 ? '16px 16px 0 0' : '16px', border: '1px solid #9AABB', borderBottom: totalRows > 0 ? 'none' : '1px solid #9AABB', overflow: 'hidden' }}>
                <TableContainer
                    component={Paper}
                    ref={tableContainerRef}
                    sx={{
                        borderRadius: 0,
                        border: 'none',
                        p: 0,
                        overflowX: 'auto',
                        maxWidth: '100%',
                        '&::-webkit-scrollbar': {
                            display: 'none', // Hide native scrollbar - will show custom one below if needed
                        },
                        scrollbarWidth: 'none',
                    }}
                >
                <Table stickyHeader sx={{ minWidth: 1200 }}>
                    <TableHead>
                        <TableRow>
                            {visibleColumns.map((column, index) => (
                                <TableCell
                                    key={index}
                                    sx={{
                                        fontFamily: "'Lexend', sans-serif",
                                        fontWeight: 500,
                                        fontSize: '16px',
                                        lineHeight: '24px',
                                        color: '#1A212B',
                                        padding: '12px',
                                        bgcolor: '#ffffff',
                                        whiteSpace: 'nowrap',
                                        width: getColumnWidth(column.key as string),
                                        cursor: 'default',
                                        textAlign: 'left',
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {column.key === 'checkbox' ? (
                                            <Checkbox
                                                indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                                                onChange={handleSelectAll}
                                                sx={{ p: 0 }}
                                            />
                                        ) : (
                                            <Box 
                                                sx={{ 
                                                    pointerEvents: column.sortable !== false ? 'none' : 'auto'
                                                }}
                                            >
                                                {column.headerRender ? column.headerRender() : column.header}
                                            </Box>
                                        )}

                                        {column.sortable !== false && (
                                            <Box 
                                                sx={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    alignItems: 'center', 
                                                    gap: 0, 
                                                    marginTop: '-2px', 
                                                    marginBottom: '-2px',
                                                    cursor: 'pointer',
                                                    userSelect: 'none'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    onSortRequest(column.key as string);
                                                }}
                                            >
                                                <KeyboardArrowUpIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        onSortRequest(column.key as string);
                                                    }}
                                                    sx={{
                                                        fontSize: 12,
                                                        color: sortConfig.key === column.key && sortConfig.direction === 'asc' ? '#5C17E5' : '#B0BEC5',
                                                        fontWeight: sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'bold' : 'normal',
                                                        backgroundColor: sortConfig.key === column.key && sortConfig.direction === 'asc' ? '#F3E8FF' : 'transparent',
                                                        borderRadius: '4px',
                                                        padding: '1px',
                                                        marginBottom: '-2px',
                                                        cursor: 'pointer',
                                                        pointerEvents: 'auto'
                                                    }}
                                                />
                                                <KeyboardArrowDownIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        onSortRequest(column.key as string);
                                                    }}
                                                    sx={{
                                                        fontSize: 12,
                                                        color: sortConfig.key === column.key && sortConfig.direction === 'desc' ? '#5C17E5' : '#B0BEC5',
                                                        fontWeight: sortConfig.key === column.key && sortConfig.direction === 'desc' ? 'bold' : 'normal',
                                                        backgroundColor: sortConfig.key === column.key && sortConfig.direction === 'desc' ? '#F3E8FF' : 'transparent',
                                                        borderRadius: '4px',
                                                        padding: '1px',
                                                        marginTop: '-2px',
                                                        cursor: 'pointer',
                                                        pointerEvents: 'auto'
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => {
                                const actualRowIndex = getActualRowIndex(rowIndex);
                                return (
                                    <TableRow
                                        key={actualRowIndex}
                                        sx={{
                                            backgroundColor: '#FFFFFF !important',
                                            borderBottom: 'none',
                                            '&:hover': {
                                                backgroundColor: '#FFFFFF !important',
                                            },
                                            '&:focus': {
                                                backgroundColor: '#FFFFFF !important',
                                            },
                                            '&:active': {
                                                backgroundColor: '#FFFFFF !important',
                                            },
                                        }}
                                    >
                                        {visibleColumns.map((column, colIndex) => (
                                            <TableCell
                                                key={colIndex}
                                                sx={{
                                                    fontFamily: "'Lexend', sans-serif",
                                                    fontWeight: 400,
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    color: '#1A212B',
                                                    padding: '12px',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word',
                                                    width: getColumnWidth(column.key as string),
                                                    textAlign: 'left',
                                                }}
                                            >
                                                {column.key === 'checkbox' ? (
                                                    <Checkbox
                                                        checked={selectedRows.includes(actualRowIndex)}
                                                        onChange={() => handleSelectRow(rowIndex)}
                                                        sx={{ p: 0 }}
                                                    />
                                                ) : column.render ? column.render(row) : (row as any)[column.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length}>
                                    <Typography align="center" sx={{ padding: 2 }}>
                                        {emptyMessage}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </TableContainer>
            </Box>
            {totalRows > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        px: 2,
                        py: 1.5,
                        border: '1px solid #9AABB',
                        borderTop: '1px solid #E0E0E0',
                        gap: 2,
                        bgcolor: '#ffffff',
                        borderRadius: 0,
                        marginTop: '-1px',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #E0E0E0',
                            borderRadius: '4px',
                            height: 32,
                            px: 1,
                            gap: 1,
                            bgcolor: '#ffffff',
                        }}
                    >
                        <Select
                            value={currentPage}
                            onChange={handlePageSelectChange}
                            variant="standard"
                            disableUnderline
                            IconComponent={KeyboardArrowDownIcon}
                            sx={{
                                height: '100%',
                                '& .MuiSelect-select': { py: 0, pr: 2, display: 'flex', alignItems: 'center', minWidth: 20 },
                                '& .MuiSelect-icon': { top: '50%', transform: 'translateY(-50%)', color: '#5C17E5', fontSize: '24px' },
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: "'Lexend', sans-serif",
                            }}
                        >
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                                <MenuItem key={pageNumber} value={pageNumber}>
                                    {pageNumber}
                                </MenuItem>
                            ))}
                        </Select>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', color: '#728197', fontSize: '14px' }}>
                            {`of ${totalPages} pages`}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            sx={{ 
                                border: '1px solid #E0E0E0', 
                                borderRadius: '4px', 
                                p: 0.5, 
                                height: 32, 
                                width: 32,
                                bgcolor: '#ffffff',
                                '&:hover:not(:disabled)': {
                                    bgcolor: '#F3E8FF',
                                    borderColor: '#5C17E5',
                                },
                                '&:disabled': {
                                    opacity: 0.4,
                                }
                            }}
                        >
                            <KeyboardArrowLeftIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            sx={{ 
                                border: '1px solid #E0E0E0', 
                                borderRadius: '4px', 
                                p: 0.5, 
                                height: 32, 
                                width: 32,
                                bgcolor: '#ffffff',
                                '&:hover:not(:disabled)': {
                                    bgcolor: '#F3E8FF',
                                    borderColor: '#5C17E5',
                                },
                                '&:disabled': {
                                    opacity: 0.4,
                                }
                            }}
                        >
                            <KeyboardArrowRightIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            )}
            {/* Scrollbar only shown when table content overflows */}
            {totalRows > 0 && showScrollbar && (
                <Box
                    ref={scrollbarRef}
                    component="div"
                    sx={{
                        width: '100%',
                        height: '12px',
                        bgcolor: '#ffffff',
                        border: '1px solid #9AABB',
                        borderTop: 'none',
                        borderRadius: '0 0 16px 16px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        '&::-webkit-scrollbar': {
                            height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#c1c1c1',
                            borderRadius: '4px',
                            '&:hover': {
                                backgroundColor: '#a8a8a8',
                            },
                        },
                    }}
                >
                    <Box 
                        className="scrollbar-content"
                        sx={{ 
                            width: '100%', 
                            height: '1px',
                        }} 
                    />
                </Box>
            )}
            {totalRows > 0 && !showScrollbar && (
                <Box
                    sx={{
                        width: '100%',
                        height: '1px',
                        bgcolor: '#ffffff',
                        border: '1px solid #9AABB',
                        borderTop: 'none',
                        borderRadius: '0 0 16px 16px',
                    }}
                />
            )}
        </>
    );
};