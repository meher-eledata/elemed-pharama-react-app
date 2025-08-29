import React, { ChangeEvent } from 'react';
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
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import sortIcon from '../../assets/sort_icon.svg';

export type FilterOption = {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date';
};

export interface SearchAndFilterConfig {
    filterOptions: FilterOption[];
}

export interface TableColumn<T> {
    key: keyof T | 'checkbox' | 'actions' | string;
    header: string;
    hide?: boolean;
    render?: (item: T) => React.ReactNode;
    headerRender?: () => React.ReactNode;
    sortable?: boolean;
}

interface ReusableTableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    emptyMessage?: string;
    searchAndFilterConfig: SearchAndFilterConfig;
    currentSearchTerm: string;
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
    showFilters: boolean;
    onShowFiltersToggle: () => void;
    currentFilterKey: string;
    onFilterSelect: (key: string) => void;
    totalRows: number;
    rowsPerPage: number;
    currentPage: number;
    onPageChange: (newPage: number) => void;
    onSortRequest: (key: string) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
}

export const ReusableTable = <T,>({
    columns,
    data,
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
}: ReusableTableProps<T>) => {
    const theme = useTheme();
    const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('md'));

    const visibleColumns = columns.filter((col) => !col.hide);
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const getPlaceholder = () => {
        const activeFilter = searchAndFilterConfig.filterOptions.find((f: FilterOption) => f.key === currentFilterKey);
        return activeFilter ? `Search by ${activeFilter.label}...` : 'Search...';
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

    const hasSearchAndFilter = searchAndFilterConfig.filterOptions.length > 0;

    return (
        <>
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
                        placeholder={getPlaceholder()}
                        value={currentSearchTerm}
                        onChange={onSearchChange}
                        type={searchAndFilterConfig.filterOptions.find((f: FilterOption) => f.key === currentFilterKey)?.type || 'text'}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#728197', fontSize: '24px', backgroundColor: '#ffffff' }} />
                                </InputAdornment>
                            ),
                            sx: {
                                height: '40px',
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #9AA8bc',
                            },
                        }}
                        sx={{
                            width: isTabletOrMobile ? '100%' : '628.5px',
                            borderRadius: '12px',
                            border: '5px',
                            marginBottom: isTabletOrMobile ? '12px' : 0,
                        }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<FilterListIcon />}
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
                            variant={currentFilterKey === option.key ? 'contained' : 'outlined'}
                            onClick={() => onFilterSelect(option.key)}
                            sx={{ textTransform: 'none', width: isTabletOrMobile ? '100%' : 'auto' }}
                        >
                            {option.label}
                        </Button>
                    ))}
                </Box>
            )}

            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: '16px',
                    border: '1px solid #9AABB',
                    p: 0,
                    overflowX: 'auto',
                }}
            >
                <Table stickyHeader sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            {visibleColumns.map((column, index) => (
                                <TableCell
                                    key={index}
                                    onClick={() => column.sortable !== false && onSortRequest(column.key as string)}
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: isTabletOrMobile ? '12px' : '14px',
                                        padding: '12px',
                                        bgcolor: '#ffffff',
                                        whiteSpace: 'nowrap',
                                        width: getColumnWidth(column.key as string),
                                        cursor: column.sortable !== false ? 'pointer' : 'default',
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {column.headerRender ? column.headerRender() : column.header}
                                        {column.sortable !== false && (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {sortConfig.key === column.key ? (
                                                    <img
                                                        src={sortIcon}
                                                        alt="Sort"
                                                        style={{
                                                            width: 12,
                                                            height: 12,
                                                            transform: sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
                                                            transition: 'transform 0.2s',
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={sortIcon}
                                                        alt="Sort"
                                                        style={{
                                                            width: 12,
                                                            height: 12,
                                                            opacity: 0.5,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <TableRow
                                    key={rowIndex}
                                    sx={{
                                        '&:hover': { backgroundColor: '#fafafa' },
                                        backgroundColor: rowIndex % 2 === 0 ? '#ECEFF4' : '#FFFFFF',
                                    }}
                                >
                                    {visibleColumns.map((column, colIndex) => (
                                        <TableCell
                                            key={colIndex}
                                            sx={{
                                                fontSize: isTabletOrMobile ? '11px' : '13px',
                                                padding: '12px',
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                width: getColumnWidth(column.key as string),
                                            }}
                                        >
                                            {column.render ? column.render(row) : (row as any)[column.key]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
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
                {totalRows > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 2,
                            py: 1,
                            borderTop: '1px solid #E0E0E0',
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
                                gap: 1
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
                                    '& .MuiSelect-icon': { top: '50%', transform: 'translateY(-50%)' },
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    fontFamily: 'Lexend',
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
                                sx={{ border: '1px solid #E0E0E0', borderRadius: '4px', p: 0.5, height: 32, width: 32 }}
                            >
                                <KeyboardArrowLeftIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                sx={{ border: '1px solid #E0E0E0', borderRadius: '4px', p: 0.5, height: 32, width: 32 }}
                            >
                                <KeyboardArrowRightIcon />
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </TableContainer>
        </>
    );
};