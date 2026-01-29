import React, { ChangeEvent, useState, useRef, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
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
import { PharmaDatePicker } from '../Common';
import dayjs, { Dayjs } from 'dayjs';

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
    customSearchBarContent?: React.ReactNode; // Custom content to render next to search bar
    hideDefaultSearch?: boolean; // If true, the default search bar is hidden
    footerContent?: React.ReactNode; // Custom footer content
    disableFooterWrapper?: boolean; // If true, footerContent is rendered directly inside TableFooter without wrapping in TableRow/TableCell
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
    customSearchBarContent, // Custom content next to search bar
    hideDefaultSearch = false, // Default to false
    footerContent, // Footer content
    disableFooterWrapper = false,
}: ReusableTableProps<T>) => {
    const theme = useTheme();
    const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('md'));

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const visibleColumns = columns.filter((col) => !col.hide);
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    // Calculate paginated data
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    // Get the active filter option
    const activeFilter = searchAndFilterConfig.filterOptions.find((f: FilterOption) => f.key === currentFilterKey);
    const isDateFilter = activeFilter?.type === 'date';

    const [datePickerValue, setDatePickerValue] = useState<Dayjs | null>(null);

    useEffect(() => {
        if (isDateFilter) {
            if (currentSearchTerm && currentSearchTerm.trim()) {
                const parsedDate = dayjs(currentSearchTerm, 'MM/DD/YYYY', true);
                if (parsedDate.isValid()) {
                    setDatePickerValue(parsedDate);
                } else {
                    setDatePickerValue(null);
                }
            } else {
                setDatePickerValue(null);
            }
        } else {
            // Reset date picker when switching away from date filter
            setDatePickerValue(null);
        }
    }, [currentSearchTerm, currentFilterKey]);

    const getPlaceholder = () => {
        if (activeFilter) {
            return `Search by ${activeFilter.label}...`;
        }
        return searchAndFilterConfig.defaultPlaceholder || 'Search...';
    };

    // Handle date picker change
    const handleDateChange = (newValue: Dayjs | null) => {
        setDatePickerValue(newValue);
        const dateString = newValue ? newValue.format('MM/DD/YYYY') : '';
        const syntheticEvent = {
            target: { value: dateString }
        } as ChangeEvent<HTMLInputElement>;
        onSearchChange(syntheticEvent);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            onPageChange(newPage);
        }
    };

    const handlePageSelectChange = (event: SelectChangeEvent<number>) => {
        onPageChange(event.target.value as number);
    };

    const getColumnWidth = (columnKey: string, index: number, totalColumns: number) => {
        const column = visibleColumns[index];
        // Check if column has a custom width first
        if (column?.columnWidth) {
            return column.columnWidth;
        }
        // Default widths for special columns if no custom width is specified
        if (columnKey === 'checkbox' || columnKey === 'actions') {
            return '60px';
        }
        const specialColumns = visibleColumns.filter(col => col.key === 'checkbox' || col.key === 'actions').length;
        const regularColumns = visibleColumns.length - specialColumns;

        if (regularColumns > 0) {
            // Distribute width evenly, ensuring exactly 100% total
            const percentage = 100 / regularColumns;
            return `${percentage}%`;
        }
        return 'auto';
    };

    const hasSearchAndFilter = (searchAndFilterConfig.filterOptions.length > 0 || searchAndFilterConfig.defaultPlaceholder || customSearchBarContent);

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
                        justifyContent: isTabletOrMobile ? 'flex-start' : 'space-between',
                        bgcolor: '#F6F8FB',
                        borderRadius: '16px',
                        p: '12px',
                        gap: '16px',
                        mb: 2,
                        height: 'auto',
                    }}
                >
                    {isDateFilter ? (
                        <Box sx={{ width: isTabletOrMobile ? '100%' : '628.5px' }}>
                            <PharmaDatePicker
                                value={datePickerValue}
                                onChange={handleDateChange}
                                placeholder={getPlaceholder()}
                                width="100%"
                                height={40}
                            />
                        </Box>
                    ) : (
                        !hideDefaultSearch && (
                            <Box sx={{ width: isTabletOrMobile ? '100%' : '628.5px', flexShrink: 0 }}>
                                <TextField
                                    className="pharma-table-search"
                                    placeholder={getPlaceholder()}
                                    value={currentSearchTerm}
                                    onChange={onSearchChange}
                                    type={activeFilter?.type || 'text'}
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
                                            paddingRight: '8px',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                        },
                                    }}
                                    sx={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        backgroundColor: '#ffffff',
                                        '& .MuiOutlinedInput-root': {
                                            height: '40px',
                                        }
                                    }}
                                />
                            </Box>
                        )
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: (isTabletOrMobile || hideDefaultSearch) ? 'flex-start' : 'flex-end' }}>
                        {customSearchBarContent && (
                            <Box sx={{ display: 'flex', alignItems: 'center', width: hideDefaultSearch ? '100%' : 'auto' }}>
                                {customSearchBarContent}
                            </Box>
                        )}
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
                                    width: isTabletOrMobile ? '100%' : 'auto',
                                    flexShrink: 0,
                                    '&:hover': { bgcolor: '#E0E5EA', },
                                }}
                            >
                                {showFilters ? 'Hide filters' : 'Show filters'}
                            </Button>
                        )}
                    </Box>
                </Box >
            )}

            {
                showFilters && (
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
                )
            }

            <Box sx={{
                borderRadius: totalRows > 0 ? '12px 12px 0 0' : '12px',
                border: '1px solid #E5E7EB',
                borderBottom: totalRows > 0 ? 'none' : '1px solid #E5E7EB',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box',
            }}>
                <TableContainer
                    component={Paper}
                    ref={tableContainerRef}
                    sx={{
                        borderRadius: 0,
                        border: 'none',
                        p: 0,
                        m: 0,
                        overflowY: 'visible',
                        overflowX: 'auto',
                        width: '100%',
                        position: 'relative',
                        boxSizing: 'border-box',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                            height: '6px',
                            display: 'block',
                        },
                        '&::-webkit-scrollbar:horizontal': {
                            display: 'block !important',
                            height: '6px !important',
                            width: 'auto !important',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: '#F3F4F6',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#D1D5DB',
                            borderRadius: '3px',
                            '&:hover': {
                                backgroundColor: '#9CA3AF',
                            },
                        },
                        '&::-webkit-scrollbar-corner': {
                            backgroundColor: '#F3F4F6',
                            display: 'block !important',
                        },
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#D1D5DB #F3F4F6',
                        '& table': {
                            width: '100%',
                            tableLayout: 'auto',
                        },
                        '& *': {
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                        },
                        // Allow date picker icon button to be visible (popup uses portal, so doesn't need overflow visible)
                        '& .MuiPickersTextField-root': {
                            width: '100%',
                            maxWidth: '100%',
                            '& .MuiInputAdornment-root': {
                                overflowX: 'visible !important',
                                '& .MuiIconButton-root': {
                                    overflowX: 'visible !important',
                                    '& svg': {
                                        width: '28px !important',
                                        height: '28px !important',
                                        fontSize: '28px !important',
                                    },
                                },
                            },
                            '& .MuiPickersInputAdornment-root': {
                                '& .MuiIconButton-root': {
                                    '& svg': {
                                        width: '28px !important',
                                        height: '28px !important',
                                        fontSize: '28px !important',
                                    },
                                },
                            },
                        },
                    }}
                >
                    <Table stickyHeader sx={{
                        width: '100%',
                        tableLayout: 'auto',
                        margin: 0,
                        padding: 0,
                    }}>
                        <TableHead>
                            <TableRow>
                                {visibleColumns.map((column, index) => (
                                    <TableCell
                                        key={index}
                                        sx={{
                                            fontFamily: "'Lexend', sans-serif",
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            lineHeight: '18px',
                                            color: '#374151',
                                            padding: column.key === 'actions' ? '3px' : '4px 12px',
                                            bgcolor: '#F9FAFB',
                                            whiteSpace: 'nowrap',
                                            width: column?.columnWidth || 'auto',
                                            minWidth: column?.columnWidth || 'auto',
                                            maxWidth: column?.columnWidth ? column.columnWidth : 'none',
                                            cursor: 'default',
                                            textAlign: column.key === 'actions' ? 'center' : 'left',
                                            borderBottom: '1px solid #E5E7EB',
                                            overflow: 'visible',
                                            textOverflow: 'clip',
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            {column.key === 'checkbox' && totalRows > 0 ? (
                                                <Checkbox
                                                    indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                                                    onChange={handleSelectAll}
                                                    sx={{ p: 0 }}
                                                />
                                            ) : column.key !== 'checkbox' ? (
                                                <Box
                                                    sx={{
                                                        pointerEvents: column.sortable !== false ? 'none' : 'auto'
                                                    }}
                                                >
                                                    {column.headerRender ? column.headerRender() : column.header}
                                                </Box>
                                            ) : null}

                                            {column.sortable !== false && totalRows > 0 && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 0,
                                                        marginLeft: '4px',
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                        width: '16px',
                                                        height: '20px',
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
                                                    backgroundColor: '#F9FAFB !important',
                                                },
                                                '&:focus': {
                                                    backgroundColor: '#F9FAFB !important',
                                                },
                                                '&:active': {
                                                    backgroundColor: '#F9FAFB !important',
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
                                                        color: '#374151',
                                                        padding: column.key === 'actions' ? '3px' : '12px 16px',
                                                        whiteSpace: 'normal',
                                                        wordBreak: 'break-word',
                                                        width: column?.columnWidth || 'auto',
                                                        minWidth: column?.columnWidth ? undefined : 'auto',
                                                        maxWidth: column?.columnWidth || 'none',
                                                        textAlign: column.key === 'actions' ? 'center' : 'left',
                                                        borderBottom: '1px solid #F3F4F6',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {column.key === 'checkbox' && totalRows > 0 ? (
                                                        <Checkbox
                                                            checked={selectedRows.includes(actualRowIndex)}
                                                            onChange={() => handleSelectRow(rowIndex)}
                                                            sx={{ p: 0 }}
                                                        />
                                                    ) : column.key !== 'checkbox' ? (
                                                        column.render ? column.render(row) : (row as any)[column.key]
                                                    ) : null}
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
                        {footerContent && (
                            <TableFooter>
                                {disableFooterWrapper ? (
                                    footerContent
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={visibleColumns.length}
                                            sx={{
                                                padding: 0,
                                                border: 'none',
                                            }}
                                        >
                                            {footerContent}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableFooter>
                        )}
                    </Table>
                </TableContainer>
            </Box>
            {
                totalRows > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            px: 2,
                            py: 1.5,
                            border: '1px solid #E5E7EB',
                            borderTop: '1px solid #E5E7EB',
                            gap: 2,
                            bgcolor: '#F9FAFB',
                            borderRadius: '0 0 12px 12px',
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
                )
            }
        </>
    );
};