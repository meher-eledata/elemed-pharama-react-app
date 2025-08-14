import React, { useState, ChangeEvent, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  CircularProgress,
  Typography,
  Checkbox,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import {
  setStockType,
  fetchLowStock,
  fetchExcessStock,
  fetchExpiredStock,
  LowStockItem,
  ExcessStockItem,
  ExpiredStockItem
} from '../../redux/slices/inventorySlice';
import { ReusableTable, TableColumn, SearchAndFilterConfig } from '../../components/PharmaTable';
import vShapedArrow from '../../assets/v_shaped_arrow.svg';
import vShapedUp from '../../assets/v_shaped_up.svg';
import Cart from '../../assets/cart.svg';
import Chart1 from '../../assets/Chart1.svg';
import Chart2 from '../../assets/Chart2.svg';
import Chart3 from '../../assets/Chart3.svg';
import TrendDown from '../../assets/trend-down.svg';
import TrendUp from '../../assets/trend-up.svg';
import '../Inventory/Inventory.scss';
type StockType = 'low' | 'excess' | 'expired';
type InventoryItem = LowStockItem | ExcessStockItem | ExpiredStockItem;
type FilterKey = 'name' | 'batchNumber' | 'currentQuantity' | 'minQuantity' | 'maxQuantity' | 'expiryDate' | 'daysPastExpiry' | '';
const InventoryHeader = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedStockType } = useSelector((state: RootState) => state.inventory);
  const baseButtonStyle = {
    height: "2.25rem",
    width: "8rem",
    color: "#1A212B",
    fontSize: "1rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
    fontFamily: "lexend",
    padding: 0,
    textTransform: "none",
    border: "none",
  };
  const getButtonStyle = (tab: StockType) => ({
    ...baseButtonStyle,
    backgroundColor: selectedStockType === tab ? "#ffffff" : "transparent",
    borderRadius: selectedStockType === tab ? "0.5rem" : 0,
  });

  const handleTabClick = (tab: StockType) => {
    dispatch(setStockType(tab));
  };

  return (
    <Box className="inventory-container">
      <Typography
        variant="h4"
        sx={{
          marginBottom: '24px',
          fontWeight: 600,
          fontSize: '36px',
          fontFamily: 'Lexend',
          margintop: '20px'
        }}
      >
        Inventory
      </Typography>
      <Box className="inventory-tabs">
        <Button
          sx={getButtonStyle("low")}
          variant={selectedStockType === "low" ? "contained" : "outlined"}
          onClick={() => handleTabClick("low")}
        >
          Low Stock
        </Button>
        <Button
          sx={getButtonStyle("excess")}
          variant={selectedStockType === "excess" ? "contained" : "outlined"}
          onClick={() => handleTabClick("excess")}
        >
          Excess Stock
        </Button>
        <Button
          sx={getButtonStyle("expired")}
          variant={selectedStockType === "expired" ? "contained" : "outlined"}
          onClick={() => handleTabClick("expired")}
        >
          Expired Stock
        </Button>
      </Box>
      {/* Summary Cards */}
      <Box className="summary-cards">
        <Box className="summary-card1">
          <Box className="number">
            <img src={TrendUp} alt="icon" className="icon" />
            <Typography variant="caption" color="error" className="percentage">
              44.29%
            </Typography>
          </Box>
          <img src={Chart1} alt="icon" className="card-icon1" />
        </Box>
        <Box className="summary-card2">
          <Typography variant="subtitle2" className="text">
            Total Excess Stock
          </Typography>
          <Box className="number">
            <Typography variant="h3" className="big-number">
              818
            </Typography>
            <img src={TrendDown} alt="icon" className="icon" />
            <Typography
              variant="caption"
              color="success.main"
              className="percentage"
            >
              2.8%
            </Typography>
          </Box>
          <img src={Chart2} alt="icon" className="card-icon2" />
        </Box>
        <Box className="summary-card3">
          <Typography variant="subtitle2" className="text">
            Total Expired Stock
          </Typography>
          <Box className="number">
            <Typography variant="h3" className="big-number">
              1,587
            </Typography>
            <img src={TrendUp} alt="icon" className="icon" />
            <Typography
              variant="caption"
              color="success.main"
              className="percentage"
            >
              8%
            </Typography>
          </Box>
          <img src={Chart3} alt="icon" className="card-icon3" />
        </Box>
      </Box>
    </Box>
  );
};

const InventoryModule: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    selectedStockType,
    lowStockItems,
    excessStockItems,
    expiredStockItems,
    isLoading,
    error
  } = useSelector((state: RootState) => state.inventory);

  // State for search, filter, and pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<FilterKey>('name');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const rowsPerPage = 3;

  useEffect(() => {
    setPage(1);
    switch (selectedStockType) {
      case 'low': dispatch(fetchLowStock()); break;
      case 'excess': dispatch(fetchExcessStock()); break;
      case 'expired': dispatch(fetchExpiredStock()); break;
    }
  }, [selectedStockType, dispatch]);

  useEffect(() => {
    setSelectedItems([]);
    setFilterType('name');
    setSearchQuery('');
    setShowFilters(false);
  }, [selectedStockType]);

  const currentTableData = useMemo(() => {
    switch (selectedStockType) {
      case 'low': return lowStockItems;
      case 'excess': return excessStockItems;
      case 'expired': return expiredStockItems;
      default: return [];
    }
  }, [selectedStockType, lowStockItems, excessStockItems, expiredStockItems]);

  const filteredData = useMemo(() => {
    if (!searchQuery) {
      return currentTableData;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const isNumericFilter = !isNaN(parseFloat(searchQuery));

    return currentTableData.filter(item => {
      switch (filterType) {
        case 'name': return (item as InventoryItem).name.toLowerCase().includes(lowerCaseQuery);
        case 'batchNumber': return ('batchNumber' in item) && item.batchNumber.toLowerCase().includes(lowerCaseQuery);
        case 'currentQuantity':
          if (!isNumericFilter) return false;
          const currentQty = (item as LowStockItem | ExcessStockItem | ExpiredStockItem).currentQuantity;
          if (selectedStockType === 'low' || selectedStockType === 'expired') {
            return currentQty <= parseFloat(searchQuery);
          }
          if (selectedStockType === 'excess') {
            return currentQty >= parseFloat(searchQuery);
          }
          return false;
        case 'minQuantity':
          return isNumericFilter ? (('minQuantity' in item) && item.minQuantity >= parseFloat(searchQuery)) : false;
        case 'maxQuantity':
          return isNumericFilter ? (('maxQuantity' in item) && item.maxQuantity <= parseFloat(searchQuery)) : false;
        case 'expiryDate':
          const searchDate = new Date(searchQuery);
          return isNaN(searchDate.getTime()) ? false : ('expiryDate' in item) && (new Date(item.expiryDate) <= searchDate);
        case 'daysPastExpiry':
          return isNumericFilter ? (('daysPastExpiry' in item) && item.daysPastExpiry >= parseFloat(searchQuery)) : false;
        default: return true;
      }
    });
  }, [currentTableData, searchQuery, filterType, selectedStockType]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, rowsPerPage]);

  const handleSelectAllClick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = paginatedData.map(item => item.id);
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
      newSelected = newSelected.concat(selectedItems.slice(0, selectedIndex), selectedItems.slice(selectedIndex + 1));
    }
    setSelectedItems(newSelected);
  };
  const renderHeaderCheckbox = () => (
    <Checkbox
      indeterminate={
        selectedItems.length > 0 &&
        selectedItems.length < paginatedData.length
      }
      checked={
        paginatedData.length > 0 &&
        selectedItems.length === paginatedData.length
      }
      onChange={handleSelectAllClick}
      icon={
        <Box
          sx={{
            width: 18,
            height: 18,
            border: "1.5px solid #D0D5DD", // light gray border
            borderRadius: "6px",           // rounded corners (set 50% for circle)
            backgroundColor: "#fff",
          }}
        />
      }
      checkedIcon={
        <Box
          sx={{
            width: 18,
            height: 18,
            border: "1.5px solid #1976d2", // match theme color
            borderRadius: "6px",
            backgroundColor: "#1976d2",
          }}
        />
      }
      sx={{
        width: "24px",
        height: "24px",
        p: 0,
        "& .MuiSvgIcon-root": { display: "none" }, // hide default SVG
      }}
    />
  );

  const renderRowCheckbox = (item: InventoryItem) => (
    <Checkbox
      checked={selectedItems.indexOf(item.id) !== -1}
      onClick={(event) => handleRowClick(event, item.id)}
      icon={
        <Box
          sx={{
            width: 18,
            height: 18,
            border: "1.5px solid #D0D5DD",
            borderRadius: "6px",
            backgroundColor: "#fff",
          }}
        />
      }
      checkedIcon={
        <Box
          sx={{
            width: 18,
            height: 18,
            border: "1.5px solid #1976d2",
            borderRadius: "6px",
            backgroundColor: "#1976d2",
          }}
        />
      }
      sx={{
        width: "24px",
        height: "24px",
        p: 0,
        "& .MuiSvgIcon-root": { display: "none" },
      }}
    />
  )

  const renderProductCell = (item: InventoryItem) => (
    <Box display="flex" alignItems="center" gap={'19px'}>
      <Typography variant="body1" sx={{ color: '#1A212B', fontSize: '14px', fontFamily: 'Lexend' }}>
        {item.name}
      </Typography>
    </Box>
  );

  const renderCurrentQtyCell = (item: LowStockItem | ExcessStockItem) => {
    let icon = null;
    let secondQty = null;

    if (selectedStockType === 'low' && 'minQuantity' in item) {
      icon = <img src={vShapedArrow} alt="low stock arrow" style={{ width: '16px', height: '16px' }} />;
      secondQty = item.minQuantity;
    } else if (selectedStockType === 'excess' && 'maxQuantity' in item) {
      icon = <img src={vShapedUp} alt="excess stock arrow" style={{ width: '16px', height: '16px' }} />;
      secondQty = item.maxQuantity;
    }

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body1" sx={{ color: '#1A212B', fontSize: '14px', fontFamily: 'Lexend' }}>
          {item.currentQuantity}
        </Typography>
        {icon}
        {secondQty !== null && (
          <Typography variant="body1" sx={{ color: '#728197', fontSize: '14px', fontFamily: 'Lexend' }}>
            {secondQty}
          </Typography>
        )}
      </Box>
    );
  };

  const renderActionsCell = () => (
    <Box display="flex" gap={1} alignItems="center">
      <IconButton sx={{ color: '#5C17E5' }} size="small">
        <img src={Cart} alt="Add to cart" style={{ width: 20, height: 20 }} />
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
          { key: 'name', header: 'Product Name', render: renderProductCell },
          { key: 'currentQuantity', header: 'Current Qty', render: renderCurrentQtyCell },
          { key: 'minQuantity', header: 'Minimum Qty' },
          { key: 'actions', header: '', render: renderActionsCell }
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: 'Product Name', type: 'text' },
            { key: 'currentQuantity', label: 'Current Quantity', type: 'number' },
            { key: 'minQuantity', label: 'Minimum Quantity', type: 'number' },
          ],
        };
        break;
      case 'excess':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox },
          { key: 'name', header: 'Product Name', render: renderProductCell },
          { key: 'currentQuantity', header: 'Current Qty', render: renderCurrentQtyCell },
          { key: 'maxQuantity', header: 'Maximum Qty' },
          { key: 'actions', header: '', render: renderActionsCell }
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: 'Product Name', type: 'text' },
            { key: 'currentQuantity', label: 'Current Quantity', type: 'number' },
            { key: 'maxQuantity', label: 'Maximum Quantity', type: 'number' },
          ],
        };
        break;
      case 'expired':
        columns = [
          { key: 'checkbox', header: '', headerRender: renderHeaderCheckbox, render: renderRowCheckbox },
          { key: 'name', header: 'Product Name', render: renderProductCell },
          { key: 'batchNumber', header: 'Batch No' },
          { key: 'currentQuantity', header: 'Current Qty' },
          { key: 'expiryDate', header: 'Expiry Date' },
          { key: 'daysPastExpiry', header: 'No Days Past' },
          { key: 'actions', header: '', render: renderActionsCell }
        ];
        searchAndFilterConfig = {
          filterOptions: [
            { key: 'name', label: 'Product Name', type: 'text' },
            { key: 'batchNumber', label: 'Batch No', type: 'text' },
            { key: 'currentQuantity', label: 'Current Qty', type: 'number' },
            { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { key: 'daysPastExpiry', label: 'No Days Past', type: 'number' },
          ],
        };
        break;
      default:
        return { columns: [], searchAndFilterConfig: { filterOptions: [] } };
    }
    return { columns, searchAndFilterConfig };
  };

  const { columns, searchAndFilterConfig } = getTableProps();

  return (
    <Container maxWidth="xl" sx={{ mt: 0, px: { xs: 2, sm: 3, md: 4 } }}>
      <InventoryHeader />

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>Loading data...</Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">Error: {error}</Typography>
        </Box>
      ) : (
        <ReusableTable
          data={paginatedData as InventoryItem[]}
          columns={columns}
          searchAndFilterConfig={searchAndFilterConfig}
          currentSearchTerm={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters(!showFilters)}
          currentFilterKey={filterType}
          onFilterSelect={(key) => setFilterType(key as FilterKey)}
          totalRows={filteredData.length}
          rowsPerPage={rowsPerPage}
          currentPage={page}
          onPageChange={handlePageChange}
        />
      )}
    </Container>
  );
};

export default InventoryModule;