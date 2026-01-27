import React, { useState, ChangeEvent, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Checkbox,
  IconButton,
  Button,
  Autocomplete,
  TextField,
  Chip
} from '@mui/material';
import { StandardButton } from '../../components/Common';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PlusIcon from "../../assets/PlusIcon.svg";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import AddIcon from "@mui/icons-material/Add";
import WarningIcon from '@mui/icons-material/Warning';
import NewProductModal from "../../components/Modal/NewProduct/NewProductModal";

import {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetNearExpiryStockQuery,
  useGetInventorySummaryQuery,
} from '../../redux/slices/inventoryApi';
import { extractErrorMessage } from '../../utils/errorUtils';


import type { InventoryItem as RTKInventoryItem } from '../../redux/slices/inventoryApi';

import { ReusableTable, TableColumn, SearchAndFilterConfig } from '../../components/PharmaTable';

import { INVENTORY_LABELS, FILTER_OPTIONS } from '../../config/label/inventoryLabels';
import {
  baseButtonStyle,
  headerTitleStyle,
  checkboxStyle,
  checkboxBoxStyle,
  checkboxCheckedBoxStyle,
  productCellTextStyle,
  secondaryQuantityTextStyle,
  ASSET_PATHS,
  ROWS_PER_PAGE
} from '../../config/constants/inventoryConstants';

import '../Inventory/Inventory.scss';
import { display } from '@mui/system';

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error != null && "status" in error;
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error != null &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}
type StockType = 'low' | 'excess' | 'expired' | 'nearExpiry';
type InventoryItem = RTKInventoryItem;
type FilterKey =
  | 'name'
  | 'batchNumber'
  | 'currentQuantity'
  | 'minQuantity'
  | 'maxQuantity'
  | 'expiryDate'
  | 'daysPastExpiry'
  | 'daysToExpiry'
  | 'brand'
  | 'type'
  | '';

const InventoryModule: React.FC = () => {
  const [selectedStockType, setSelectedStockType] = useState<StockType>('low');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<FilterKey>('name');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [nearExpiryMonths, setNearExpiryMonths] = useState<number>(3);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  const [isNewProductModalOpen, setIsNewProductModalOpen] =
    useState<boolean>(false);

  const { data: lowStockItems = [], isLoading: isLowStockLoading, error: lowStockError } =
    useGetLowStockQuery();

  const { data: excessStockItems = [], isLoading: isExcessStockLoading, error: excessStockError } =
    useGetExcessStockQuery();

  const { data: expiredStockItems = [], isLoading: isExpiredStockLoading, error: expiredStockError } =
    useGetExpiredStockQuery();

  const { data: nearExpiryStockItems = [], isLoading: isNearExpiryStockLoading, error: nearExpiryStockError } =
    useGetNearExpiryStockQuery({ months: nearExpiryMonths });

  const allSearchOptions = useMemo(() => {
    const options: { name: string; category: StockType; id?: string }[] = [];

    lowStockItems.forEach(item => options.push({ name: item.name, category: 'low', id: item.id }));
    excessStockItems.forEach(item => options.push({ name: item.name, category: 'excess', id: item.id }));
    nearExpiryStockItems.forEach(item => options.push({ name: item.name, category: 'nearExpiry', id: item.id }));
    expiredStockItems.forEach(item => options.push({ name: item.name, category: 'expired', id: item.id }));

    return options;
  }, [lowStockItems, excessStockItems, nearExpiryStockItems, expiredStockItems]);

  const getCategoryLabel = (category: StockType) => {
    switch (category) {
      case 'low': return 'Low Stock';
      case 'excess': return 'Excess Stock';
      case 'nearExpiry': return 'Near Expiry';
      case 'expired': return 'Expired';
      default: return '';
    }
  };

  const getCategoryColor = (category: StockType) => {
    switch (category) {
      case 'low': return '#F59E0B';
      case 'excess': return '#3B82F6';
      case 'nearExpiry': return '#8B5CF6';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const { data: inventorySummary, isLoading: isSummaryLoading, error: summaryError } =
    useGetInventorySummaryQuery();

  const currentTableData = useMemo(() => {
    switch (selectedStockType) {
      case 'low':
        return lowStockItems as InventoryItem[];
      case 'excess':
        return excessStockItems as InventoryItem[];
      case 'expired':
        return expiredStockItems as InventoryItem[];
      case 'nearExpiry':
        return nearExpiryStockItems as InventoryItem[];
      default:
        return [];
    }
  }, [selectedStockType, lowStockItems, excessStockItems, expiredStockItems, nearExpiryStockItems]);

  const isLoading = useMemo(() => {
    switch (selectedStockType) {
      case 'low':
        return isLowStockLoading;
      case 'excess':
        return isExcessStockLoading;
      case 'expired':
        return isExpiredStockLoading;
      case 'nearExpiry':
        return isNearExpiryStockLoading;
      default:
        return false;
    }
  }, [selectedStockType, isLowStockLoading, isExcessStockLoading, isExpiredStockLoading, isNearExpiryStockLoading]);

  const error = useMemo(() => {
    switch (selectedStockType) {
      case 'low':
        return lowStockError;
      case 'excess':
        return excessStockError;
      case 'expired':
        return expiredStockError;
      case 'nearExpiry':
        return nearExpiryStockError;
      default:
        return null;
    }
  }, [selectedStockType, lowStockError, excessStockError, expiredStockError, nearExpiryStockError]);

  useEffect(() => {
    setPage(1);
    setSelectedItems([]);
    setFilterType('name');
    setShowFilters(false);
    setSortConfig({ key: 'name', direction: 'asc' });
  }, [selectedStockType, nearExpiryMonths]);

  const handleTabClick = (tab: StockType) => {
    setSelectedStockType(tab);
    setSelectedRows([]); // Clear selected rows when tab changes
    setSearchQuery(''); // Clear search when manually switching tabs
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAutocompleteSelect = (event: any, value: any) => {
    if (value) {
      setSelectedStockType(value.category);
      setSearchQuery(value.name);
      setPage(1);
    } else {
      setSearchQuery('');
    }
  };

  const filteredData = useMemo(() => {
    let filtered = currentTableData;

    // Apply search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const isNumericFilter = !isNaN(parseFloat(searchQuery));

      filtered = filtered.filter((item) => {
        switch (filterType) {
          case 'name':
            return item.name.toLowerCase().includes(lowerCaseQuery);
          case 'batchNumber':
            return 'batchNumber' in item && item.batchNumber?.toLowerCase().includes(lowerCaseQuery);
          case 'currentQuantity': {
            if (!isNumericFilter) return false;
            const currentQty = item.currentQuantity;
            if (selectedStockType === 'low' || selectedStockType === 'expired') {
              return (currentQty ?? 0) <= parseFloat(searchQuery);
            }
            if (selectedStockType === 'excess') {
              return (currentQty ?? 0) >= parseFloat(searchQuery);
            }
            return false;
          }
          case 'minQuantity':
            return isNumericFilter
              ? 'minQuantity' in item && (item.minQuantity ?? 0) >= parseFloat(searchQuery)
              : false;
          case 'maxQuantity':
            return isNumericFilter
              ? 'maxQuantity' in item && (item.maxQuantity ?? 0) <= parseFloat(searchQuery)
              : false;
          case 'expiryDate': {
            const searchDate = new Date(searchQuery);
            return isNaN(searchDate.getTime())
              ? false
              : 'expiryDate' in item && new Date(item.expiryDate as string) <= searchDate;
          }
          case 'daysPastExpiry':
            return isNumericFilter
              ? 'daysPastExpiry' in item && (item.daysPastExpiry ?? 0) >= parseFloat(searchQuery)
              : false;
          case 'daysToExpiry':
            return isNumericFilter
              ? 'daysToExpiry' in item && (item.daysToExpiry ?? 0) >= parseFloat(searchQuery)
              : false;
          case 'brand':
            return 'brand' in item && item.brand?.toLowerCase().includes(lowerCaseQuery);
          case 'type':
            return 'type' in item && item.type?.toLowerCase().includes(lowerCaseQuery);
          default:
            return true;
        }
      });
    }

    const currentSortKey = sortConfig.key || 'name';
    const currentDirection = sortConfig.direction || 'asc';

    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (currentSortKey) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'currentQuantity':
          aValue = a.currentQuantity ?? 0;
          bValue = b.currentQuantity ?? 0;
          break;
        case 'minQuantity':
          aValue = a.minQuantity ?? 0;
          bValue = b.minQuantity ?? 0;
          break;
        case 'maxQuantity':
          aValue = a.maxQuantity ?? 0;
          bValue = b.maxQuantity ?? 0;
          break;
        case 'batchNumber':
          aValue = a.batchNumber ?? '';
          bValue = b.batchNumber ?? '';
          break;
        case 'expiryDate':
          aValue = new Date(a.expiryDate ?? '');
          bValue = new Date(b.expiryDate ?? '');
          break;
        case 'daysPastExpiry':
          aValue = a.daysPastExpiry ?? 0;
          bValue = b.daysPastExpiry ?? 0;
          break;
        case 'daysToExpiry':
          aValue = a.daysToExpiry ?? 0;
          bValue = b.daysToExpiry ?? 0;
          break;
        case 'brand':
          aValue = a.brand?.toLowerCase() ?? '';
          bValue = b.brand?.toLowerCase() ?? '';
          break;
        case 'type':
          aValue = a.type?.toLowerCase() ?? '';
          bValue = b.type?.toLowerCase() ?? '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) {
        return currentDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return currentDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [currentTableData, searchQuery, filterType, selectedStockType, sortConfig]);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      // Cycle back to ascending for the same column
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page]);

  const handleSelectAllClick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = paginatedData.map((item) => item.id || item.name);
      setSelectedItems(allIds);
      return;
    }
    setSelectedItems([]);
  };

  const handleRowClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selectedItems.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedItems, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedItems.slice(1));
    } else if (selectedIndex === selectedItems.length - 1) {
      newSelected = newSelected.concat(selectedItems.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedItems.slice(0, selectedIndex),
        selectedItems.slice(selectedIndex + 1)
      );
    }
    setSelectedItems(newSelected);
  };

  const renderHeaderCheckbox = () => (
    <Checkbox
      indeterminate={selectedItems.length > 0 && selectedItems.length < paginatedData.length}
      checked={paginatedData.length > 0 && selectedItems.length === paginatedData.length}
      onChange={handleSelectAllClick}
      icon={<Box sx={checkboxBoxStyle} />}
      checkedIcon={<Box sx={checkboxCheckedBoxStyle} />}
      sx={checkboxStyle}
    />
  );

  const renderRowCheckbox = (item: InventoryItem) => (
    <Checkbox
      checked={selectedItems.indexOf(item.id || item.name) !== -1}
      onClick={(event) => handleRowClick(event, item.id || item.name)}
      icon={<Box sx={checkboxBoxStyle} />}
      checkedIcon={<Box sx={checkboxCheckedBoxStyle} />}
      sx={checkboxStyle}
    />
  );

  const renderProductCell = (item: InventoryItem) => (
    <Box display="flex" alignItems="center" gap={'19px'}>
      <Typography variant="body1" sx={productCellTextStyle}>
        {item.name}
      </Typography>
    </Box>
  );

  const renderCurrentQtyCell = (item: InventoryItem) => {
    let icon = null;
    let secondQty: number | null = null;

    if (selectedStockType === 'low' && 'minQuantity' in item) {
      icon = <img src={ASSET_PATHS.vShapedArrow} alt="low stock arrow" style={{ width: 16, height: 16 }} />;
      secondQty = item.minQuantity ?? null;
    } else if (selectedStockType === 'excess' && 'maxQuantity' in item) {
      icon = <img src={ASSET_PATHS.vShapedUp} alt="excess stock arrow" style={{ width: 16, height: 16 }} />;
      secondQty = item.maxQuantity ?? null;
    }

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body1" sx={productCellTextStyle}>
          {item.currentQuantity}
        </Typography>
        {icon}
        {secondQty !== null && (
          <Typography variant="body1" sx={secondaryQuantityTextStyle}>
            {secondQty}
          </Typography>
        )}
      </Box>
    );
  };


  const getTableProps = () => {
    let columns: TableColumn<any>[] = [];
    let searchAndFilterConfig: SearchAndFilterConfig;

    switch (selectedStockType) {
      case 'low':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox, sortable: false },
          { key: 'name', header: INVENTORY_LABELS.productNameHeader, render: renderProductCell },
          { key: 'brand', header: INVENTORY_LABELS.brandHeader, render: (item) => (item as InventoryItem).brand || '-' },
          { key: 'type', header: INVENTORY_LABELS.typeHeader, render: (item) => (item as InventoryItem).type || '-' },
          { key: 'currentQuantity', header: INVENTORY_LABELS.currentQuantityHeader, render: renderCurrentQtyCell },
          { key: 'minQuantity', header: INVENTORY_LABELS.minimumQuantityHeader, render: (item) => (item as InventoryItem).minQuantity },
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: FILTER_OPTIONS.name, type: 'text' },
            { key: 'brand', label: FILTER_OPTIONS.brand, type: 'text' },
            { key: 'type', label: FILTER_OPTIONS.type, type: 'text' },
            { key: 'currentQuantity', label: FILTER_OPTIONS.currentQuantity, type: 'number' },
            { key: 'minQuantity', label: FILTER_OPTIONS.minQuantity, type: 'number' },
          ],
        };
        break;

      case 'excess':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox, sortable: false },
          { key: 'name', header: INVENTORY_LABELS.productNameHeader, render: renderProductCell },
          { key: 'brand', header: INVENTORY_LABELS.brandHeader, render: (item) => (item as InventoryItem).brand || '-' },
          { key: 'type', header: INVENTORY_LABELS.typeHeader, render: (item) => (item as InventoryItem).type || '-' },
          { key: 'currentQuantity', header: INVENTORY_LABELS.currentQuantityHeader, render: renderCurrentQtyCell },
          { key: 'maxQuantity', header: INVENTORY_LABELS.maximumQuantityHeader, render: (item) => (item as InventoryItem).maxQuantity },
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: FILTER_OPTIONS.name, type: 'text' },
            { key: 'brand', label: FILTER_OPTIONS.brand, type: 'text' },
            { key: 'type', label: FILTER_OPTIONS.type, type: 'text' },
            { key: 'currentQuantity', label: FILTER_OPTIONS.currentQuantity, type: 'number' },
            { key: 'maxQuantity', label: FILTER_OPTIONS.maxQuantity, type: 'number' },
          ],
        };
        break;

      case 'expired':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox, sortable: false },
          { key: 'name', header: INVENTORY_LABELS.productNameHeader, render: renderProductCell },
          { key: 'brand', header: INVENTORY_LABELS.brandHeader, render: (item) => (item as InventoryItem).brand || '-' },
          { key: 'type', header: INVENTORY_LABELS.typeHeader, render: (item) => (item as InventoryItem).type || '-' },
          { key: 'batchNumber', header: INVENTORY_LABELS.batchNoHeader, render: (item) => (item as InventoryItem).batchNumber },
          { key: 'currentQuantity', header: INVENTORY_LABELS.currentQuantityHeader, render: (item) => (item as InventoryItem).currentQuantity },
          { key: 'expiryDate', header: INVENTORY_LABELS.expiryDateHeader, render: (item) => (item as InventoryItem).expiryDate },
          { key: 'daysPastExpiry', header: INVENTORY_LABELS.daysPastExpiryHeader, render: (item) => (item as InventoryItem).daysPastExpiry },
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: FILTER_OPTIONS.name, type: 'text' },
            { key: 'brand', label: FILTER_OPTIONS.brand, type: 'text' },
            { key: 'type', label: FILTER_OPTIONS.type, type: 'text' },
            { key: 'batchNumber', label: FILTER_OPTIONS.batchNumber, type: 'text' },
            { key: 'currentQuantity', label: FILTER_OPTIONS.currentQuantity, type: 'number' },
            { key: 'expiryDate', label: FILTER_OPTIONS.expiryDate, type: 'date' },
            { key: 'daysPastExpiry', label: FILTER_OPTIONS.daysPastExpiry, type: 'number' },
          ],
        };
        break;

      case 'nearExpiry':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox, sortable: false },
          { key: 'name', header: INVENTORY_LABELS.productNameHeader, render: renderProductCell },
          { key: 'brand', header: INVENTORY_LABELS.brandHeader, render: (item) => (item as InventoryItem).brand || '-' },
          { key: 'type', header: INVENTORY_LABELS.typeHeader, render: (item) => (item as InventoryItem).type || '-' },
          { key: 'batchNumber', header: INVENTORY_LABELS.batchNoHeader, render: (item) => (item as InventoryItem).batchNumber },
          { key: 'currentQuantity', header: INVENTORY_LABELS.currentQuantityHeader, render: (item) => (item as InventoryItem).currentQuantity },
          { key: 'expiryDate', header: INVENTORY_LABELS.expiryDateHeader, render: (item) => (item as InventoryItem).expiryDate },
          { key: 'daysToExpiry', header: INVENTORY_LABELS.daysToExpiryHeader, render: (item) => (item as InventoryItem).daysToExpiry },
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: FILTER_OPTIONS.name, type: 'text' },
            { key: 'brand', label: FILTER_OPTIONS.brand, type: 'text' },
            { key: 'type', label: FILTER_OPTIONS.type, type: 'text' },
            { key: 'batchNumber', label: FILTER_OPTIONS.batchNumber, type: 'text' },
            { key: 'currentQuantity', label: FILTER_OPTIONS.currentQuantity, type: 'number' },
            { key: 'expiryDate', label: FILTER_OPTIONS.expiryDate, type: 'date' },
            { key: 'daysToExpiry', label: FILTER_OPTIONS.daysToExpiry, type: 'number' },
          ],
        };
        break;

      default:
        return { columns: [], searchAndFilterConfig: { filterOptions: [] } };
    }
    return { columns, searchAndFilterConfig };
  };

  const { columns, searchAndFilterConfig } = useMemo(() => getTableProps(), [selectedStockType, nearExpiryMonths]);

  return (
    <Container maxWidth="xl" disableGutters sx={{ mb: 0, px: { xs: 2, sm: 3, md: 1 } }}>
      <Box className="inventory-container">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
          <Typography variant="h4" sx={headerTitleStyle}>
            {INVENTORY_LABELS.pageTitle}
          </Typography>

          <Box sx={{ flex: 1, maxWidth: '500px', mx: 4 }}>
            <Autocomplete
              options={allSearchOptions}
              getOptionLabel={(option) => option.name}
              onChange={handleAutocompleteSelect}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search products across all tabs..."
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#F9FAFB',
                      '& fieldset': { border: '1px solid #D1D5DB' },
                      '&:hover fieldset': { borderColor: '#5C17E5' },
                      '&.Mui-focused fieldset': { borderColor: '#5C17E5' },
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="body2">{option.name}</Typography>
                  <Chip
                    label={getCategoryLabel(option.category)}
                    size="small"
                    sx={{
                      ml: 1,
                      fontSize: '0.65rem',
                      height: '18px',
                      backgroundColor: getCategoryColor(option.category),
                      color: '#fff',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              )}
            />
          </Box>

          <StandardButton
            startIcon={<AddIcon />}
            onClick={() => setIsNewProductModalOpen(true)}
            variant="primary"
            size="large"
          >
            Add Product
          </StandardButton>
        </Box>
        <NewProductModal
          open={isNewProductModalOpen}
          onClose={() => setIsNewProductModalOpen(false)}
          onProductAdded={() => {
          }}
        />

        <Box className="inventory-tabs">
          <Button
            onClick={() => handleTabClick('low')}
            sx={{
              backgroundColor: selectedStockType === 'low' ? '#5C17E5' : 'transparent',
              color: selectedStockType === 'low' ? '#FFFFFF' : '#1A212B',
              border: selectedStockType === 'low' ? 'none' : '1px solid #D1D5DB',
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem', // 14px = 0.875rem
              padding: '0.5rem 1rem', // 8px = 0.5rem, 16px = 1rem
              minWidth: '7.5rem', // 120px = 7.5rem
              '&:hover': {
                backgroundColor: selectedStockType === 'low' ? '#4C14C7' : 'transparent',
              },
            }}
          >
            {INVENTORY_LABELS.lowStockTab}
          </Button>
          <Button
            onClick={() => handleTabClick('excess')}
            sx={{
              backgroundColor: selectedStockType === 'excess' ? '#5C17E5' : 'transparent',
              color: selectedStockType === 'excess' ? '#FFFFFF' : '#1A212B',
              border: selectedStockType === 'excess' ? 'none' : '1px solid #D1D5DB',
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem', // 14px = 0.875rem
              padding: '0.5rem 1rem', // 8px = 0.5rem, 16px = 1rem
              minWidth: '7.5rem', // 120px = 7.5rem
              '&:hover': {
                backgroundColor: selectedStockType === 'excess' ? '#4C14C7' : 'transparent',
              },
            }}
          >
            {INVENTORY_LABELS.excessStockTab}
          </Button>
          <Button
            onClick={() => handleTabClick('nearExpiry')}
            sx={{
              backgroundColor: selectedStockType === 'nearExpiry' ? '#5C17E5' : 'transparent',
              color: selectedStockType === 'nearExpiry' ? '#FFFFFF' : '#1A212B',
              border: selectedStockType === 'nearExpiry' ? 'none' : '1px solid #D1D5DB',
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem', // 14px = 0.875rem
              padding: '0.5rem 1rem', // 8px = 0.5rem, 16px = 1rem
              minWidth: '7.5rem', // 120px = 7.5rem
              '&:hover': {
                backgroundColor: selectedStockType === 'nearExpiry' ? '#4C14C7' : 'transparent',
              },
            }}
          >
            {INVENTORY_LABELS.nearExpiryStockTab}
          </Button>
          <Button
            onClick={() => handleTabClick('expired')}
            sx={{
              backgroundColor: selectedStockType === 'expired' ? '#5C17E5' : 'transparent',
              color: selectedStockType === 'expired' ? '#FFFFFF' : '#1A212B',
              border: selectedStockType === 'expired' ? 'none' : '1px solid #D1D5DB',
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem', // 14px = 0.875rem
              padding: '0.5rem 1rem', // 8px = 0.5rem, 16px = 1rem
              minWidth: '7.5rem', // 120px = 7.5rem
              '&:hover': {
                backgroundColor: selectedStockType === 'expired' ? '#4C14C7' : 'transparent',
              },
            }}
          >
            {INVENTORY_LABELS.expiredStockTab}
          </Button>
        </Box>

        {/* Summary Cards */}
        <Box className="summary-cards">
          <Box
            className="summary-card1"
            sx={{
              position: 'relative',
              transition: 'all 0.3s ease-in-out',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: selectedStockType === 'low' ? 'rgba(92, 23, 229, 0.25)' : 'transparent',
                borderRadius: '1rem', // 16px = 1rem
                transition: 'background-color 0.3s ease-in-out',
                pointerEvents: 'none',
                zIndex: 1,
              },
              '& > *': {
                position: 'relative',
                zIndex: 2,
              }
            }}
          >
            <Typography variant="subtitle2" className="text">
              {INVENTORY_LABELS.totalLowStock}
            </Typography>
            <Box className="number">
              <Typography variant="h3" className="big-number">
                {isSummaryLoading ? <CircularProgress size={24} /> : inventorySummary?.belowMinCount ?? 0}
              </Typography>
              {/* <img src={ASSET_PATHS.TrendUp} alt="icon" className="icon" /> */}
              <Typography variant="caption" color="error" className="percentage">
                {/* 44.29% */}
              </Typography>
            </Box>
            <img src={ASSET_PATHS.Chart1} alt="icon" className="card-icon1" />
          </Box>

          <Box
            className="summary-card2"
            sx={{
              position: 'relative',
              transition: 'all 0.3s ease-in-out',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: selectedStockType === 'excess' ? 'rgba(92, 23, 229, 0.25)' : 'transparent',
                borderRadius: '1rem', // 16px = 1rem
                transition: 'background-color 0.3s ease-in-out',
                pointerEvents: 'none',
                zIndex: 1,
              },
              '& > *': {
                position: 'relative',
                zIndex: 2,
              }
            }}
          >
            <Typography variant="subtitle2" className="text">
              {INVENTORY_LABELS.totalExcessStock}
            </Typography>
            <Box className="number">
              <Typography variant="h3" className="big-number">
                {isSummaryLoading ? <CircularProgress size={24} /> : inventorySummary?.aboveMaxCount ?? 0}
              </Typography>
              {/* <img src={ASSET_PATHS.TrendDown} alt="icon" className="icon" /> */}
              <Typography variant="caption" color="success.main" className="percentage">
                {/* 2.8% */}
              </Typography>
            </Box>
            <img src={ASSET_PATHS.Chart2} alt="icon" className="card-icon2" />
          </Box>

          <Box
            className="summary-card3"
            sx={{
              position: 'relative',
              transition: 'all 0.3s ease-in-out',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: selectedStockType === 'nearExpiry' ? 'rgba(92, 23, 229, 0.25)' : 'transparent',
                borderRadius: '1rem', // 16px = 1rem
                transition: 'background-color 0.3s ease-in-out',
                pointerEvents: 'none',
                zIndex: 1,
              },
              '& > *': {
                position: 'relative',
                zIndex: 2,
              }
            }}
          >
            <Typography variant="subtitle2" className="text">
              {INVENTORY_LABELS.totalNearExpiryStock}
            </Typography>
            <Box className="number">
              <Typography variant="h3" className="big-number">
                {isSummaryLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  nearExpiryMonths === 3
                    ? inventorySummary?.withinThreeMonthsCount ?? 0
                    : inventorySummary?.withinOneMonthCount ?? 0
                )}
              </Typography>
              <Typography variant="caption" color="success.main" className="percentage">
                {/* 8% */}
              </Typography>
            </Box>
            <img src={ASSET_PATHS.Chart3} alt="icon" className="card-icon3" />
          </Box>

          <Box
            className="summary-card4"
            sx={{
              position: 'relative',
              transition: 'all 0.3s ease-in-out',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: selectedStockType === 'expired' ? 'rgba(92, 23, 229, 0.25)' : 'transparent',
                borderRadius: '1rem', // 16px = 1rem
                transition: 'background-color 0.3s ease-in-out',
                pointerEvents: 'none',
                zIndex: 1,
              },
              '& > *': {
                position: 'relative',
                zIndex: 2,
              }
            }}
          >
            <Typography variant="subtitle2" className="text">
              {INVENTORY_LABELS.totalExpiredStock}
            </Typography>
            <Box className="number">
              <Typography variant="h3" className="big-number">
                {isSummaryLoading ? <CircularProgress size={24} /> : inventorySummary?.pastExpiryCount ?? 0}
              </Typography>
              {/* <img src={ASSET_PATHS.TrendUp} alt="icon" className="icon" /> */}
              <Typography
                variant="caption"
                color="success.main"
                className="percentage"
              >
                {/* 8% */}
              </Typography>
            </Box>
            <WarningIcon sx={{ position: 'absolute', bottom: 16, right: 16, fontSize: 80, color: '#EF4444', opacity: 0.2 }} />
          </Box>
        </Box>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>{INVENTORY_LABELS.loadingData}</Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">
            {extractErrorMessage(error, 'Failed to load inventory data. Please try again.')}
          </Typography>
        </Box>
      ) : (
        <ReusableTable
          data={filteredData as InventoryItem[]}
          columns={columns}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          searchAndFilterConfig={searchAndFilterConfig}
          currentSearchTerm={searchQuery}
          onSearchChange={handleSearchChange}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters(!showFilters)}
          currentFilterKey={filterType}
          onFilterSelect={(key, value) => setFilterType(key as FilterKey)}
          totalRows={filteredData.length}
          rowsPerPage={ROWS_PER_PAGE}
          currentPage={page}
          onPageChange={handlePageChange}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
          customSearchBarContent={
            selectedStockType === 'nearExpiry' ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setNearExpiryMonths(3)}
                  sx={{
                    backgroundColor: nearExpiryMonths === 3 ? '#5C17E5' : 'transparent',
                    color: nearExpiryMonths === 3 ? '#FFFFFF' : '#1A212B',
                    border: nearExpiryMonths === 3 ? 'none' : '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem', // 14px = 0.875rem
                    padding: '0.5rem 1rem', // 8px = 0.5rem, 16px = 1rem
                    minWidth: '6.25rem', // 100px = 6.25rem
                    height: '2.375rem', // 38px = 2.375rem
                    '&:hover': {
                      backgroundColor: nearExpiryMonths === 3 ? '#4C14C7' : 'transparent',
                    },
                  }}
                >
                  {INVENTORY_LABELS.threeMonths}
                </Button>
                <Button
                  onClick={() => setNearExpiryMonths(1)}
                  sx={{
                    backgroundColor: nearExpiryMonths === 1 ? '#5C17E5' : 'transparent',
                    color: nearExpiryMonths === 1 ? '#FFFFFF' : '#1A212B',
                    border: nearExpiryMonths === 1 ? 'none' : '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem', // 14px = 0.875rem
                    padding: '0.5rem 1rem', // 8px = 0.5rem, 16px = 1rem
                    minWidth: '6.25rem', // 100px = 6.25rem
                    height: '2.375rem', // 38px = 2.375rem
                    '&:hover': {
                      backgroundColor: nearExpiryMonths === 1 ? '#4C14C7' : 'transparent',
                    },
                  }}
                >
                  {INVENTORY_LABELS.oneMonth}
                </Button>
              </Box>
            ) : undefined
          }
        />
      )}
    </Container>
  );
};

export default InventoryModule;