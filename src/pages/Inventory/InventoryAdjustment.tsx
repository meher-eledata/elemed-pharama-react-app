import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import './InventoryAdjustment.scss';
import dayjs from 'dayjs';
import { StandardButton, PharmaDatePicker } from '../../components/Common';
import { ReusableTable, TableColumn, SearchAndFilterConfig } from '../../components/PharmaTable';

type BatchRow = {
  id: string;
  quantity: number;
  expiryDate: string;
};

type SearchMode = 'product' | 'id' | 'code';

const PRODUCT_OPTIONS = [
  {
    label: 'Paracetamol 500 mg',
    id: 'PCM500',
    hsn: '300450',
    type: 'Tablet',
    brand: 'Dolo',
    batches: [
      { id: '1', quantity: 55, expiryDate: '2028-12-30' },
      { id: '2', quantity: 120, expiryDate: '2027-11-15' },
      { id: '3', quantity: 80, expiryDate: '2029-03-01' }
    ]
  },
  {
    label: 'Azithromycin 250 mg',
    id: 'AZM250',
    hsn: '300420',
    type: 'Tablet',
    brand: 'Zithro',
    batches: [
      { id: '1', quantity: 200, expiryDate: '2027-09-12' },
      { id: '2', quantity: 140, expiryDate: '2028-03-22' }
    ]
  },
  {
    label: 'Ibuprofen 200 mg',
    id: 'IBU200',
    hsn: '300490',
    type: 'Tablet',
    brand: 'Advil',
    batches: [
      { id: '1', quantity: 95, expiryDate: '2028-05-10' },
      { id: '2', quantity: 70, expiryDate: '2029-01-05' },
      { id: '3', quantity: 50, expiryDate: '2028-11-18' },
      { id: '4', quantity: 30, expiryDate: '2030-02-01' }
    ]
  }
];

const inputFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    height: 36,
    '& input': {
      padding: '6px 12px',
    },
  },
};

const InventoryAdjustment: React.FC = () => {
  const [selectedProductCode, setSelectedProductCode] = useState(PRODUCT_OPTIONS[0].id);
  const [batchRows, setBatchRows] = useState<BatchRow[]>(PRODUCT_OPTIONS[0].batches);
  const [productBrand, setProductBrand] = useState(PRODUCT_OPTIONS[0].brand);
  const [productType, setProductType] = useState(PRODUCT_OPTIONS[0].type);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'asc'
  });
  const [searchMode, setSearchMode] = useState<SearchMode>('product');
  const [productSearchValue, setProductSearchValue] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const searchAndFilterConfig: SearchAndFilterConfig = useMemo(
    () => ({
      filterOptions: []
    }),
    []
  );

  const selectedProduct = useMemo(
    () => PRODUCT_OPTIONS.find((option) => option.id === selectedProductCode) ?? PRODUCT_OPTIONS[0],
    [selectedProductCode]
  );

  const totalQuantity = useMemo(
    () => batchRows.reduce((acc, batch) => acc + (Number.isNaN(batch.quantity) ? 0 : batch.quantity), 0),
    [batchRows]
  );

  const sortedRows = useMemo(() => {
    const rowsCopy = [...batchRows];
    return rowsCopy.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortConfig.key) {
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'expiryDate':
          aValue = a.expiryDate;
          bValue = b.expiryDate;
          break;
        case 'id':
        default:
          aValue = a.id;
          bValue = b.id;
          break;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [batchRows, sortConfig]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedRows;
    }
    const query = searchTerm.toLowerCase();
    return sortedRows.filter((row) => row.id.toLowerCase().includes(query));
  }, [sortedRows, searchTerm]);

  const filteredProductOptions = useMemo(() => {
    if (!productSearchValue.trim()) {
      return PRODUCT_OPTIONS;
    }

    const query = productSearchValue.toLowerCase();

    return PRODUCT_OPTIONS.filter((option) => {
      switch (searchMode) {
        case 'product':
          return (
            option.label.toLowerCase().includes(query) ||
            option.type.toLowerCase().includes(query) ||
            option.brand.toLowerCase().includes(query)
          );
        case 'id':
          return option.id.toLowerCase().includes(query);
        case 'code':
          return option.id.toLowerCase().includes(query); // Using id as both Product ID and Code for demo data
        default:
          return false;
      }
    });
  }, [productSearchValue, searchMode]);

  const getResultPrimaryValue = (option: typeof PRODUCT_OPTIONS[number]) => {
    switch (searchMode) {
      case 'product':
        return option.label;
      case 'id':
        return option.id;
      case 'code':
        return option.id;
      default:
        return '';
    }
  };

  const handleQuantityChange = (batchId: string, value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ''));
    setBatchRows((prev) =>
      prev.map((batch) => (batch.id === batchId ? { ...batch, quantity: Number.isNaN(parsed) ? 0 : parsed } : batch))
    );
  };

  const handleBrandChange = (value: string) => setProductBrand(value);
  const handleProductType = (value: string) => setProductType(value);

  const handleProductChange = (value: string) => {
    setSelectedProductCode(value);
    const matched = PRODUCT_OPTIONS.find((option) => option.id === value);
    if (matched) {
      setProductBrand(matched.brand);
      setProductType(matched.type);
      setBatchRows(matched.batches);
    }
  };

  const handleRemoveRow = (batchId: string) => {
    setBatchRows((prev) => prev.filter((batch) => batch.id !== batchId));
  };

  const handleReset = () => {
    setBatchRows(PRODUCT_OPTIONS[0].batches);
    setSelectedProductCode(PRODUCT_OPTIONS[0].id);
    setProductBrand(PRODUCT_OPTIONS[0].brand);
    setProductType(PRODUCT_OPTIONS[0].type);
    setSelectedRows([]);
    setSearchTerm('');
    setSortConfig({ key: 'id', direction: 'asc' });
    setProductSearchValue('');
    setSearchMode('product');
  };

  const handleSave = () => {
    
    console.log('Saving inventory adjustment', {
      product: selectedProduct,
      batches: batchRows,
      total: totalQuantity
    });
  };

  const handleSortRequest = (key: string) => {
    setSortConfig((prev) => {
      const isSameKey = prev.key === key;
      const nextDirection = isSameKey && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction: nextDirection };
    });
  };

  const batchColumns: TableColumn<BatchRow>[] = [
    {
      key: 'id',
      header: 'Batch ID',
      sortable: true,
      render: (batch) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {batch.id}
        </Typography>
      )
    },
    {
      key: 'quantity',
      header: 'Current Qty',
      sortable: true,
      render: (batch) => (
        <TextField
          value={batch.quantity}
          size="small"
          type="number"
          onChange={(event) => handleQuantityChange(batch.id, event.target.value)}
          InputProps={{ inputProps: { min: 0 } }}
          sx={{ ...inputFieldStyles, width: 120 }}
        />
      )
    },
    {
      key: 'expiryDate',
      header: 'Expiry date',
      sortable: true,
      render: (batch) => (
        <PharmaDatePicker
          value={batch.expiryDate ? dayjs(batch.expiryDate) : null}
          onChange={(newValue) =>
            setBatchRows((prev) =>
              prev.map((row) =>
                row.id === batch.id ? { ...row, expiryDate: newValue ? newValue.format('YYYY-MM-DD') : '' } : row
              )
            )
          }
          width={220}
          height={36}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (batch) => (
        <Box display="flex" justifyContent="center" gap={1}>
          <IconButton size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleRemoveRow(batch.id)}>
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box className="inventory-adjustment-page">
      <Container maxWidth="xl" disableGutters>
        <Typography variant="h3" className="page-heading">
          Inventory Adjustment
        </Typography>

        <Paper elevation={0} className="adjustment-card">
          <Box className="search-trigger-row">
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Product search
            </Typography>
            <StandardButton variant="primary" size="large" onClick={() => setIsSearchModalOpen(true)}>
              Search inventory
            </StandardButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Product Name"
                    value={selectedProductCode}
                    onChange={(event) => handleProductChange(event.target.value)}
                    sx={inputFieldStyles}
                  >
                    {PRODUCT_OPTIONS.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Type"
                    value={productType}
                    onChange={(event) => handleProductType(event.target.value)}
                    sx={inputFieldStyles}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Brand"
                    value={productBrand}
                    onChange={(event) => handleBrandChange(event.target.value)}
                    sx={inputFieldStyles}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" className="product-details-card">
                <CardContent>
                  <Typography variant="subtitle1" className="product-details-title">
                    Product details
                  </Typography>
                  <Box className="product-details-grid">
                    <Typography variant="body2" color="text.secondary">
                      Product ID :
                    </Typography>
                    <Typography variant="body2">{selectedProduct.id}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      Product Code :
                    </Typography>
                    <Typography variant="body2">{selectedProduct.id}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      HSN ID :
                    </Typography>
                    <Typography variant="body2">{selectedProduct.hsn}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      Total Quantity :
                    </Typography>
                    <Typography variant="body2">{totalQuantity}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box className="inventory-table-wrapper">
            <Typography variant="subtitle1" className="section-title">
              Inventory Details
            </Typography>
      <ReusableTable
        data={filteredRows}
        columns={batchColumns}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        searchAndFilterConfig={searchAndFilterConfig}
        currentSearchTerm={searchTerm}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        showFilters={false}
        onShowFiltersToggle={() => undefined}
        currentFilterKey=""
        onFilterSelect={() => undefined}
        totalRows={filteredRows.length}
        rowsPerPage={Math.max(filteredRows.length, 1)}
        currentPage={1}
        onPageChange={() => undefined}
        onSortRequest={handleSortRequest}
        sortConfig={sortConfig}
        emptyMessage="No batches for this product"
      />
          </Box>

          <Box className="actions-row">
            <StandardButton variant="outline" size="large" onClick={handleReset}>
              Cancel
            </StandardButton>
            <StandardButton variant="primary" size="large" onClick={handleSave}>
              Save
            </StandardButton>
          </Box>
        </Paper>
      </Container>

      <Modal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        aria-labelledby="product-search-modal-title"
        aria-describedby="product-search-modal-description"
        className="product-search-modal"
      >
        <Box className="product-search-modal__content">
          <IconButton className="product-search-modal__close" onClick={() => setIsSearchModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
          <Typography id="product-search-modal-title" variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Search products
          </Typography>
          <Box className="product-search-modal__body">
            <Box className="modal-search-left">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Search filters
              </Typography>
              <Box className="search-mode-toggle modal-toggle">
                {[
                  { key: 'product', label: 'Product (Name/Type/Brand)' },
                  { key: 'id', label: 'Product ID' },
                  { key: 'code', label: 'Product Code' },
                ].map((mode) => (
                  <StandardButton
                    key={mode.key}
                    variant={searchMode === mode.key ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSearchMode(mode.key as SearchMode)}
                  >
                    {mode.label}
                  </StandardButton>
                ))}
              </Box>
              <TextField
                fullWidth
                size="small"
                value={productSearchValue}
                onChange={(event) => setProductSearchValue(event.target.value)}
                placeholder={
                  searchMode === 'product'
                    ? 'Search by product name, type, or brand'
                    : searchMode === 'id'
                    ? 'Search by product ID'
                    : 'Search by product code'
                }
                sx={{ ...inputFieldStyles, mt: 2 }}
              />
            </Box>
            <Box className="modal-search-right">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Results ({filteredProductOptions.length})
              </Typography>
              <Box className="search-results">
                {filteredProductOptions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No matches found
                  </Typography>
                ) : (
                  filteredProductOptions.map((option) => (
                    <Box
                      key={option.id}
                      className={`search-result ${selectedProductCode === option.id ? 'active' : ''}`}
                      onClick={() => {
                        handleProductChange(option.id);
                        setIsSearchModalOpen(false);
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getResultPrimaryValue(option)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default InventoryAdjustment;