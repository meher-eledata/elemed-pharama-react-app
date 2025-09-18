import React, { useState, ChangeEvent, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  CircularProgress,
  Typography,
  Checkbox,
  IconButton
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PlusIcon from "../../assets/PlusIcon.svg";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import AddIcon from "@mui/icons-material/Add";
import NewProductModal from "../../components/Modal/NewProduct/NewProductModal"; 

import {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetInventorySummaryQuery,
} from '../../redux/slices/inventoryApi';


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
type StockType = 'low' | 'excess' | 'expired';
type InventoryItem = RTKInventoryItem & {
  batchNumber?: string;
  minQuantity?: number;
  maxQuantity?: number;
  currentQuantity?: number;
  daysPastExpiry?: number;
};
type FilterKey =
  | 'name'
  | 'batchNumber'
  | 'currentQuantity'
  | 'minQuantity'
  | 'maxQuantity'
  | 'expiryDate'
  | 'daysPastExpiry'
  | '';

const InventoryModule: React.FC = () => {
  const [selectedStockType, setSelectedStockType] = useState<StockType>('low');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<FilterKey>('name');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const [isNewProductModalOpen, setIsNewProductModalOpen] =
      useState<boolean>(false);

  const { data: lowStockItems = [], isLoading: isLowStockLoading, error: lowStockError } =
    useGetLowStockQuery(undefined, { skip: selectedStockType !== 'low' });

  const { data: excessStockItems = [], isLoading: isExcessStockLoading, error: excessStockError } =
    useGetExcessStockQuery(undefined, { skip: selectedStockType !== 'excess' });

  const { data: expiredStockItems = [], isLoading: isExpiredStockLoading, error: expiredStockError } =
    useGetExpiredStockQuery(undefined, { skip: selectedStockType !== 'expired' });

  const { data: inventorySummary, isLoading: isSummaryLoading /*, error: summaryError */ } =
    useGetInventorySummaryQuery();

  const currentTableData = useMemo(() => {
    switch (selectedStockType) {
      case 'low':
        return lowStockItems as InventoryItem[];
      case 'excess':
        return excessStockItems as InventoryItem[];
      case 'expired':
        return expiredStockItems as InventoryItem[];
      default:
        return [];
    }
  }, [selectedStockType, lowStockItems, excessStockItems, expiredStockItems]);

  const isLoading = useMemo(() => {
    switch (selectedStockType) {
      case 'low':
        return isLowStockLoading;
      case 'excess':
        return isExcessStockLoading;
      case 'expired':
        return isExpiredStockLoading;
      default:
        return false;
    }
  }, [selectedStockType, isLowStockLoading, isExcessStockLoading, isExpiredStockLoading]);

  const error = useMemo(() => {
    switch (selectedStockType) {
      case 'low':
        return lowStockError;
      case 'excess':
        return excessStockError;
      case 'expired':
        return expiredStockError;
      default:
        return null;
    }
  }, [selectedStockType, lowStockError, excessStockError, expiredStockError]);

  useEffect(() => {
    setPage(1);
    setSelectedItems([]);
    setFilterType('name');
    setSearchQuery('');
    setShowFilters(false);
  }, [selectedStockType]);

  const getButtonStyle = (tab: StockType) => ({
    ...baseButtonStyle,
    backgroundColor: selectedStockType === tab ? '#ffffff' : 'transparent',
    borderRadius: selectedStockType === tab ? '0.5rem' : 0,
  });
  const handleTabClick = (tab: StockType) => {
    setSelectedStockType(tab); 
    setSelectedRows([]); // Clear selected rows when tab changes
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return currentTableData;

    const lowerCaseQuery = searchQuery.toLowerCase();
    const isNumericFilter = !isNaN(parseFloat(searchQuery));

    return currentTableData.filter((item) => {
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
        default:
          return true;
      }
    });
  }, [currentTableData, searchQuery, filterType, selectedStockType]);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page]);

  const handleSelectAllClick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = paginatedData.map((item) => item.id);
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
      checked={selectedItems.indexOf(item.id) !== -1}
      onClick={(event) => handleRowClick(event, item.id)}
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

  const renderActionsCell = () => (
    <Box display="flex" gap={1} alignItems="center">
      <IconButton sx={{ color: '#728197' }} size="small">
        <img src={ASSET_PATHS.Cart} alt={INVENTORY_LABELS.addToCartAltText} style={{ width: 20, height: 20 }} />
      </IconButton>
      <IconButton sx={{ color: '#728197' }} size="small">
        <MoreHorizIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  const getTableProps = () => {
    let columns: TableColumn<any>[] = [];
    let searchAndFilterConfig: SearchAndFilterConfig;

    switch (selectedStockType) {
      case 'low':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox },
          { key: 'name', header: INVENTORY_LABELS.productNameHeader, render: renderProductCell },
          { key: 'currentQuantity', header: INVENTORY_LABELS.currentQuantityHeader, render: renderCurrentQtyCell },
          { key: 'minQuantity', header: INVENTORY_LABELS.minimumQuantityHeader, render: (item) => (item as InventoryItem).minQuantity },
          { key: 'actions', header: '', render: renderActionsCell },
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: FILTER_OPTIONS.name, type: 'text' },
            { key: 'currentQuantity', label: FILTER_OPTIONS.currentQuantity, type: 'number' },
            { key: 'minQuantity', label: FILTER_OPTIONS.minQuantity, type: 'number' },
          ],
        };
        break;

      case 'excess':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox },
          { key: 'name', header: INVENTORY_LABELS.productNameHeader, render: renderProductCell },
          { key: 'currentQuantity', header: INVENTORY_LABELS.currentQuantityHeader, render: renderCurrentQtyCell },
          { key: 'maxQuantity', header: INVENTORY_LABELS.maximumQuantityHeader, render: (item) => (item as InventoryItem).maxQuantity },
          { key: 'actions', header: '', render: renderActionsCell },
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: FILTER_OPTIONS.name, type: 'text' },
            { key: 'currentQuantity', label: FILTER_OPTIONS.currentQuantity, type: 'number' },
            { key: 'maxQuantity', label: FILTER_OPTIONS.maxQuantity, type: 'number' },
          ],
        };
        break;

      case 'expired':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox },
          { key: 'name', header: INVENTORY_LABELS.productNameHeader, render: renderProductCell },
          { key: 'batchNumber', header: INVENTORY_LABELS.batchNoHeader, render: (item) => (item as InventoryItem).batchNumber },
          { key: 'currentQuantity', header: INVENTORY_LABELS.currentQuantityHeader, render: (item) => (item as InventoryItem).currentQuantity },
          { key: 'expiryDate', header: INVENTORY_LABELS.expiryDateHeader, render: (item) => (item as InventoryItem).expiryDate },
          { key: 'daysPastExpiry', header: INVENTORY_LABELS.daysPastExpiryHeader, render: (item) => (item as InventoryItem).daysPastExpiry },
          { key: 'actions', header: '', render: renderActionsCell },
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: FILTER_OPTIONS.name, type: 'text' },
            { key: 'batchNumber', label: FILTER_OPTIONS.batchNumber, type: 'text' },
            { key: 'currentQuantity', label: FILTER_OPTIONS.currentQuantity, type: 'number' },
            { key: 'expiryDate', label: FILTER_OPTIONS.expiryDate, type: 'date' },
            { key: 'daysPastExpiry', label: FILTER_OPTIONS.daysPastExpiry, type: 'number' },
          ],
        };
        break;

      default:
        return { columns: [], searchAndFilterConfig: { filterOptions: [] } };
    }
    return { columns, searchAndFilterConfig };
  };

  const { columns, searchAndFilterConfig } = useMemo(() => getTableProps(), [selectedStockType]);

  return (
    <Container maxWidth="xl" disableGutters sx={{mb: 0, px: { xs: 2, sm: 3, md: 1 } }}>
      <Box className="inventory-container">
        <Box 
        sx={{
          display:"flex",
          justifyContent:"space-between",
       
        }}> 
        <Typography variant="h4" sx={headerTitleStyle}>


          {INVENTORY_LABELS.pageTitle}
        </Typography>
         <Button
          sx={{
            height: "40px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#5C17E5",
            padding: "12px 16px",
            gap: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textTransform: "none",
            fontFamily: "Lexend",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "24px",
            color: "#f9fbfcff",
            whiteSpace: "nowrap",
            minWidth: "fit-content",
            "&:hover": { backgroundColor: "#5C17E5", boxShadow: "none" },
          }}
          onClick={() => setIsNewProductModalOpen(true)}
          
          startIcon={<AddIcon />}
          disableRipple
          disableElevation
        >
          Add Product
        </Button>
      </Box>
        <NewProductModal
              open={isNewProductModalOpen}
              onClose={() => setIsNewProductModalOpen(false)}
            />

        <Box className="inventory-tabs">
          <Button
            sx={getButtonStyle('low')}
            variant={selectedStockType === 'low' ? 'contained' : 'outlined'}
            onClick={() => handleTabClick('low')}
          >
            {INVENTORY_LABELS.lowStockTab}
          </Button>
          <Button
            sx={getButtonStyle('excess')}
            variant={selectedStockType === 'excess' ? 'contained' : 'outlined'}
            onClick={() => handleTabClick('excess')}
          >
            {INVENTORY_LABELS.excessStockTab}
          </Button>
          <Button
            sx={getButtonStyle('expired')}
            variant={selectedStockType === 'expired' ? 'contained' : 'outlined'}
            onClick={() => handleTabClick('expired')}
          >
            {INVENTORY_LABELS.expiredStockTab}
          </Button>
        </Box>

        {/* Summary Cards */}
        <Box className="summary-cards">
          <Box className="summary-card1">
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

          <Box className="summary-card2">
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

          <Box className="summary-card3">
            <Typography variant="subtitle2" className="text">
              {INVENTORY_LABELS.totalExpiredStock}
            </Typography>
            <Box className="number">
              <Typography variant="h3" className="big-number">
                {isSummaryLoading ? <CircularProgress size={24} /> : (inventorySummary?.pastExpiryCount ?? 0)}
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
            <img src={ASSET_PATHS.Chart3} alt="icon" className="card-icon3" />
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
            {INVENTORY_LABELS.error}{' '}
            {isFetchBaseQueryError(error)
              ? `Status: ${error.status} - ${JSON.stringify(error.data)}`
              : isErrorWithMessage(error)
                ? error.message
                : 'An unknown error occurred'}
          </Typography>
        </Box>
      ) : (
        <ReusableTable
          data={paginatedData as InventoryItem[]}
          columns={columns}
          selectedRows={selectedRows}
  setSelectedRows={setSelectedRows}
          searchAndFilterConfig={searchAndFilterConfig}
          currentSearchTerm={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters(!showFilters)}
          currentFilterKey={filterType}
          onFilterSelect={(key) => setFilterType(key as FilterKey)}
          totalRows={filteredData.length}
          rowsPerPage={ROWS_PER_PAGE}
          currentPage={page}
          onPageChange={handlePageChange}
          onSortRequest={() => {}}
          sortConfig={{
            key: "",
            direction: "asc",
          }}
        />
      )}
    </Container>
  );
};

export default InventoryModule;