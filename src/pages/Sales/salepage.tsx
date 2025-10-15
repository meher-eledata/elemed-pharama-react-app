import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  // 🆕 Import Divider and Paper if you want to apply the Figma styling
  // import { Divider, Paper, Stack } from "@mui/material"; 
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { ReusableTable, TableColumn } from "../../components/PharmaTable";
// 💡 NOTE: The previous conversation mentioned ProductSearchBar.
// If you want to use the previous Figma implementation, you need to import it here.
// For now, I'll stick to fixing the checkbox issue in the current code structure.

interface Product {
  id: string;
  name: string;
  batch: string;
  avlQty: string;
  mrp: number;
  sp: number;
  expiry: string;
}

const productTypes = ["CAPSULE", "TABLET", "SYRUP"];
const brands = ["Brand A", "Brand B", "Brand C"];

export default function SalePage() {
  const [productType, setProductType] = useState(productTypes[0]);
  const [brand, setBrand] = useState(brands[0]);
  const [qty, setQty] = useState(10);
  const [findProduct, setFindProduct] = useState("OTTOCAP CAPSULE");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 🆕 Dummy state for SP/MRP toggle (defaulting to SP for the "active" style)
  const [priceType, setPriceType] = useState<'SP' | 'MRP'>('SP');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });


  const products: Product[] = [
    {
      id: "1",
      name: "2-0 Mersilk Syringe",
      batch: "2897655790...",
      avlQty: "28 Capsule",
      mrp: 50,
      sp: 50,
      expiry: "21 May, 2025",
    },
    {
      id: "2",
      name: "3-0 Mersilk 90cm NW 5003 SUTURE",
      batch: "3289765764...",
      avlQty: "3 Capsule",
      mrp: 5,
      sp: 5,
      expiry: "2 Jun, 2025",
    },
  ];

  // Sorting handler
  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      // Revert to default sorting instead of clearing
      setSortConfig({ key: 'name', direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to products
  const sortedProducts = useMemo(() => {
    // Always apply sorting - if no specific sort, use default
    const currentSort = sortConfig.key || 'name';
    const currentDirection = sortConfig.key ? sortConfig.direction : 'asc';
    
    return [...products].sort((a, b) => {
      const aValue = a[currentSort as keyof Product];
      const bValue = b[currentSort as keyof Product];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return currentDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return currentDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      return 0;
    });
  }, [products, sortConfig]);

  // Note: Checkbox handling is now managed by the ReusableTable component
  // The table will automatically handle select all and individual row selection

  // 🚨 IMPORTANT FIX for Checkbox Header Icon:
  // The sorting icon (near the checkbox in the image) is likely rendered by PharmaTable
  // because it assumes any column can be sorted. By setting the `header` to null/undefined
  // and ONLY using `headerRender`, we hint to the table to just render the custom component.
  const columns: TableColumn<Product>[] = [
    {
      key: "checkbox",
      header: "", 
      sortable: false, // Disable sorting for checkbox column
    },
    { key: "name", header: "Product Name", render: (item) => item.name },
    { key: "batch", header: "Batch No", render: (item) => item.batch },
    { key: "avlQty", header: "Available Qty", render: (item) => item.avlQty },
    { key: "mrp", header: "MRP", render: (item) => item.mrp },
    { key: "sp", header: "SP", render: (item) => item.sp },
    { key: "expiry", header: "Expiry Date", render: (item) => item.expiry },
  ];

  const totalAmount = products.reduce((acc, item) => acc + item.sp, 0);

  // 🆕 Helper for the SP/MRP toggle styling (mimicking Figma)
  const renderPriceToggle = () => (
    <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden' }}>
      <Button
        variant={priceType === 'SP' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => setPriceType('SP')}
        sx={{
          // Custom styling to match Figma's look
          bgcolor: priceType === 'SP' ? 'white' : 'transparent',
          color: 'black', // Black text
          border: '1px solid',
          borderRadius:'10px',
          borderColor: priceType === 'SP' ? 'grey.400' : 'grey.400', // Default gray border
          '&:hover': {
            bgcolor: priceType === 'SP' ? 'white' : 'grey.100',
            color: 'black',
            borderColor: 'grey.400', // Keep gray on hover
          },
          '&:focus': {
            borderColor: '#5C17E5', // Purple border when focused
            color: 'black',
          }
        }}
      >
        SP
      </Button>
      <Button
        variant={priceType === 'MRP' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => setPriceType('MRP')}
        sx={{
          bgcolor: priceType === 'MRP' ? 'white' : 'transparent',
          color: 'black', // Black text
          border: '1px solid',
          borderRadius:'10px',
          borderColor: priceType === 'MRP' ? 'grey.400' : 'grey.400', // Default gray border
          // Offset the previous button's border
          marginLeft: '-1px', 
          '&:hover': {
            bgcolor: priceType === 'MRP' ? 'white' : 'grey.100',
            color: 'black',
            borderColor: 'grey.400', // Keep gray on hover
          },
          '&:focus': {
            borderColor: '#5C17E5', // Purple border when focused
            color: 'black',
          }
        }}
      >
        MRP
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Select Product
      </Typography>

      {/* Top Section - Styled to approximate the Figma bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 8, // Increased gap from 3 to 4 for more spacing
          mb: 4, // Increased margin bottom for table separation
          background: "#f7f9fc", // Light background from Figma
          p: 2,
          borderRadius: 2,
          
        }}
      >
        {/* Find Product */}
        <TextField
          label="Find Product"
          value={findProduct}
          onChange={(e) => setFindProduct(e.target.value)}
          size="medium" // Set to medium for better visual bulk
          sx={{ 
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&:hover fieldset': {
                borderColor: '#5C17E5',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#5C17E5',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#5C17E5',
            },
          }}
        />
        {/* Qty */}
        <TextField
          label="Qty"
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          size="medium"
          sx={{ 
            width: 80,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&:hover fieldset': {
                borderColor: '#5C17E5',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#5C17E5',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#5C17E5',
            },
          }}
        />
        {/* Product Type */}
        <FormControl size="medium" sx={{ minWidth: 120 }}>
          <InputLabel>Product Type</InputLabel>
          <Select
            value={productType}
            label="Product Type"
            onChange={(e) => setProductType(e.target.value)}
            sx={{
              borderRadius: '8px',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5C17E5',
                borderRadius:'8px',
              },
            }}
          >
            {productTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Brand */}
        <FormControl size="medium" sx={{ minWidth: 120 }}>
          <InputLabel>Brand</InputLabel>
          <Select
            value={brand}
            label="Brand"
            onChange={(e) => setBrand(e.target.value)}
            sx={{
              borderRadius: '8px',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5C17E5',
                
              },
            }}
          >
            {brands.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* SP/MRP Toggle */}
        {renderPriceToggle()}

        {/* Apply Button */}
        <Button 
            variant="outlined" 
            size="large"
            sx={{ 
                height: 56, // Match medium TextField height
                fontWeight: 600,
                color: 'black', // Black text color
                borderRadius:'15px',
                borderColor: 'grey.400', // Default gray border
                '&:hover': {
                    color: 'black',
                    borderColor: 'grey.400', // Keep gray on hover
                    backgroundColor: 'rgba(0, 0, 0, 0.04)', // Light background on hover
                },
                '&:focus': {
                    borderColor: '#5C17E5', // Purple border when focused
                    color: 'black',
                },
            }}
        >
            Apply
        </Button>
      </Box>

      {/* Table */}
      <ReusableTable
        data={sortedProducts}
        columns={columns}
        selectedRows={selectedItems.map(id => sortedProducts.findIndex(p => p.id === id))} // Convert string IDs to indices
        setSelectedRows={(newSelected: number[] | ((prevState: number[]) => number[])) => {
          // Convert indices back to string IDs
          const indices = typeof newSelected === 'function' ? newSelected(selectedItems.map(id => sortedProducts.findIndex(p => p.id === id))) : newSelected;
          const newSelectedIds = indices.map((index: number) => sortedProducts[index].id);
          setSelectedItems(newSelectedIds);
        }}
        totalRows={sortedProducts.length}
        rowsPerPage={5}
        currentPage={1}
        onPageChange={() => {}}
        onSortRequest={handleSortRequest}
        sortConfig={sortConfig}
        searchAndFilterConfig={{ filterOptions: [] }}
        currentSearchTerm=""
        onSearchChange={() => {}}
        showFilters={false}
        onShowFiltersToggle={() => {}}
        currentFilterKey=""
        onFilterSelect={() => {}}
      />

      {/* Total + Add to Cart */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 3 }}>
        <Typography sx={{ mr: 3 }} fontWeight={700}>
          Total: ₹ {totalAmount.toFixed(2)}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddShoppingCartIcon />}
          sx={{
            backgroundColor: '#5C17E5', // Custom purple color
            color: 'white',
            borderRadius: '8px', // Rounded corners
            padding: '12px 24px', // Adequate padding
            fontSize: '16px', // Proper font size
            fontWeight: 600, // Bold text
            textTransform: 'none', // Keep original text case
            boxShadow: 'none', // Remove default shadow
            '&:hover': {
              backgroundColor: '#4A12C7', // Darker purple on hover
              boxShadow: 'none', // No shadow on hover
            },
            '& .MuiButton-startIcon': {
              marginRight: '8px', // Space between icon and text
            },
          }}
        >
          Add To Cart
        </Button>
      </Box>
    </Box>
  );
}