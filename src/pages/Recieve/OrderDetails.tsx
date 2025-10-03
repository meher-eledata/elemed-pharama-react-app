import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  InputAdornment,
  MenuItem,
  Autocomplete,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { receiveApi } from "../../redux/slices/receiveApi";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { orderLabels } from "../../config/label/OrderDetail.labels";
import {
  themeColors,
  buttonSizes,
  typography,
  paymentMethods,
  paymentVendors,
} from "../../config/constants/OrderDetail.constants";
import TickMarkSvg from "../../assets/Right.svg";
import PlusIcon from "../../assets/PlusIcon.svg";
import { ReusableTable, TableColumn } from "../../components/PharmaTable";
import NewProductModal from "../../components/Modal/NewProduct/NewProductModal";
import DropDownIcon from "../../assets/DropDown.svg"; // This is the image for the dropdown icon

// <-- Import masterProducts only
import { masterProducts, ProductMaster } from "../../data/masterData";

interface OrderDetailsProps {
  labels: typeof orderLabels;
}

export interface PharmaTableRow {
  id?: string;
  productId: string;
  qtyReceived: number;
  qtyFree: number;
  batch: string;
  pp: number;
  sp: number;
  mrp: number;
  cgst: number;
  sgst: number;
  igst: number;
  disc: number | string;
  margPercent: number | string;
  salesDiscPercent: number | string;
  isEditing?: boolean;
}

// Custom InputAdornment component for the dropdown icon
// Adjusted size to match the smaller arrow in the reference image.
const CustomDropdownIcon = (props: any) => (
  <svg
    {...(props as any)}
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    style={{
      pointerEvents: "none",
      color: "#6B7280",
    }}
  >
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const OrderDetails: React.FC<OrderDetailsProps> = ({ labels }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "", direction: "asc" });
  const [isNewProductModalOpen, setIsNewProductModalOpen] =
    useState<boolean>(false);

  const [findProductTerm, setFindProductTerm] = useState<string>("");
  
  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [isVendorFocused, setIsVendorFocused] = useState(false);
  const [isFindProductFocused, setIsFindProductFocused] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [paymentVendor, setPaymentVendor] = useState<string>("");
  const [supplierQuery, setSupplierQuery] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [transactionNumber, setTransactionNumber] = useState<string>("");

  const selectedSupplier = (location.state as any)?.selectedSupplier || "";
  const selectedPO = (location.state as any)?.selectedPO || "";
  const selectedOrder = (location.state as any)?.selectedOrder || null;
  const [supplierName, setSupplierName] = useState<string>(selectedSupplier);
  const [poNumber, setPoNumber] = useState<string>(selectedPO);

  // Save functionality states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Start with empty table - rows will be added when products are selected
  const [pharmaTableData, setPharmaTableData] = useState<PharmaTableRow[]>([]);

  // State for tracking editing rows
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<PharmaTableRow>>({});
  
  // State to track if a product was selected from dropdown
  const [isProductSelected, setIsProductSelected] = useState<boolean>(false);

  // Reusable input field styles
  const inputFieldStyles = {
    '& .MuiOutlinedInput-root': {
      height: '32px',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      '& fieldset': {
        borderColor: '#D1D5DB',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: '#9CA3AF',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3B82F6',
        borderWidth: '1px',
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '6px 8px',
      fontSize: '13px',
      color: '#374151',
    },
  };

  // Reusable number input field styles (includes spinner removal)
  const numberInputStyles = {
    ...inputFieldStyles,
    '& input[type=number]': {
      MozAppearance: 'textfield',
      WebkitAppearance: 'none',
      appearance: 'textfield'
    },
    '& input[type=number]::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    },
    '& input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    }
  };

  // Direct API state for supplier names
  const [supplierOptions, setSupplierOptions] = useState<{supplier_name: string, supplier_id: number}[]>([]);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState<boolean>(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  // Direct API call for supplier names
  const fetchSupplierNames = async () => {
    try {
      setIsSuppliersLoading(true);
      setSuppliersError(null);
      
      const response = await fetch('http://localhost:3000/api/receive/unique-supplier-names', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSupplierOptions(data);
    } catch (error) {
      console.error('Error fetching supplier names:', error);
      setSuppliersError(error instanceof Error ? error.message : 'Failed to fetch suppliers');
    } finally {
      setIsSuppliersLoading(false);
    }
  };

  // Retry function for failed API calls
  const retryFetchSuppliers = () => {
    fetchSupplierNames();
  };

  // Function to transform form data to API payload
  const transformFormDataToApiPayload = () => {
    // Find supplier ID from supplier options
    const selectedSupplierData = supplierOptions.find(s => s.supplier_name === supplierName);
    const supplierId = selectedSupplierData?.supplier_id || 0;

    // Transform table data to lines format
    const lines = pharmaTableData.map((row, index) => ({
      product: row.productId,
      product_id: 100 + index, // Generate product ID (you might want to get this from actual product data)
      received_qty: row.qtyReceived,
      free_qty: row.qtyFree,
      expiry_date: row.batch, // Using batch field for expiry date
      unit_price: row.pp,
      cgst: row.sp, // Using sp field for CGST
      sgst: row.mrp, // Using mrp field for SGST
      igst: row.cgst, // Using cgst field for IGST
      discount: typeof row.sgst === 'number' ? row.sgst : 0 // Using sgst field for discount
    }));

    const payload = {
      supplier_name: supplierName,
      supplier_id: supplierId,
      po_number: poNumber,
      payment_method: paymentMethod,
      payment_vendor: paymentVendor,
      transaction_number: transactionNumber,
      notes: "", // Add notes field if needed
      created_by: "meher", // You might want to get this from user context
      lines: lines
    };

    console.log('API Payload being sent:', payload);
    return payload;
  };

  // Function to submit receipt data
  const submitReceipt = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      // Validate required fields
      if (!supplierName || !poNumber || pharmaTableData.length === 0) {
        setSaveError('Please fill in all required fields and add at least one product');
        setIsSaving(false);
        return;
      }

      const payload = transformFormDataToApiPayload();

      const response = await fetch('http://localhost:3000/api/receive/submit-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Receipt submitted successfully:', result);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      setSaveSuccess(true);
      
      // Invalidate cache to refresh purchase order table
      dispatch(receiveApi.util.invalidateTags(['Receive']));
      
      // Reset form after successful save and navigate back to main page
      setTimeout(() => {
        setPharmaTableData([]);
        setFindProductTerm("");
        setEditingRowId(null);
        setEditingData({});
        setSupplierName("");
        setPoNumber("");
        setInvoiceDate("");
        setTransactionNumber("");
        setPaymentVendor("");
        setIsProductSelected(false);
        setSaveSuccess(false);
        
        // Navigate back to the main receive page to see updated data
        navigate('/receive/order-receive');
      }, 2000);

    } catch (error) {
      console.error('Error submitting receipt:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to submit receipt');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to add new product to table
  const addProductToTable = (productName: string) => {
    const newProduct: PharmaTableRow = {
      id: Date.now().toString(), // Simple ID generation
      productId: productName,
      qtyReceived: 0,
      qtyFree: 0,
      batch: "",
      pp: 0,
      sp: 0,
      mrp: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      disc: 0,
      margPercent: 0,
      salesDiscPercent: 0,
      isEditing: true, // Start in editing mode
    };

    setPharmaTableData(prev => [...prev, newProduct]);
    setEditingRowId(newProduct.id!);
    setEditingData(newProduct);
    // Don't clear the search term - keep it in the input field
    setIsProductSelected(true); // Mark that a product was selected
  };

  // Function to start editing a row
  const startEditing = (row: PharmaTableRow) => {
    setEditingRowId(row.id!);
    setEditingData({ ...row });
  };

  // Function to save edited row
  const saveRow = () => {
    if (editingRowId && editingData) {
      setPharmaTableData(prev => 
        prev.map(row => 
          row.id === editingRowId 
            ? { ...row, ...editingData, isEditing: false }
            : row
        )
      );
      setEditingRowId(null);
      setEditingData({});
    }
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  // Function to delete a row
  const deleteRow = (rowId: string) => {
    setPharmaTableData(prev => prev.filter(row => row.id !== rowId));
    if (editingRowId === rowId) {
      setEditingRowId(null);
      setEditingData({});
    }
  };

  // Function to update editing data
  const updateEditingData = (field: keyof PharmaTableRow, value: string | number) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch supplier names on component mount
  useEffect(() => {
    fetchSupplierNames();
  }, []);

  // Transform supplier options to extract supplier names
  const transformedSupplierOptions = useMemo(() => {
    if (!supplierOptions || supplierOptions.length === 0) return [];
    return supplierOptions.map((supplier) => supplier.supplier_name);
  }, [supplierOptions]);

  const pharmaTableColumns: TableColumn<PharmaTableRow>[] = [
    {
      key: "productId",
      header: orderLabels.productName,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            value={editingData.productId || ""}
            onChange={(e) => updateEditingData("productId", e.target.value)}
            variant="outlined"
            fullWidth
            sx={inputFieldStyles}
          />
        ) : (
          <span>{row.productId}</span>
        )
      ),
    },
    {
      key: "qtyReceived",
      header: orderLabels.receivedQty,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.qtyReceived || ""}
            onChange={(e) => updateEditingData("qtyReceived", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.qtyReceived}</span>
        )
      ),
    },
    {
      key: "qtyFree",
      header: orderLabels.freeQty,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.qtyFree || ""}
            onChange={(e) => updateEditingData("qtyFree", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.qtyFree}</span>
        )
      ),
    },
    {
      key: "batch",
      header: orderLabels.expiryDate,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            value={editingData.batch || ""}
            onChange={(e) => updateEditingData("batch", e.target.value)}
            variant="outlined"
            fullWidth
            placeholder="DD/MM/YYYY"
            sx={inputFieldStyles}
          />
        ) : (
          <span>{row.batch}</span>
        )
      ),
    },
    {
      key: "pp",
      header: orderLabels.unitPrice,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.pp || ""}
            onChange={(e) => updateEditingData("pp", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.pp}</span>
        )
      ),
    },
    {
      key: "sp",
      header: orderLabels.cgst,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.sp || ""}
            onChange={(e) => updateEditingData("sp", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.sp}%</span>
        )
      ),
    },
    {
      key: "mrp",
      header: orderLabels.sgst,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.mrp || ""}
            onChange={(e) => updateEditingData("mrp", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.mrp}%</span>
        )
      ),
    },
    {
      key: "cgst",
      header: orderLabels.igst,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.cgst || ""}
            onChange={(e) => updateEditingData("cgst", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.cgst}%</span>
        )
      ),
    },
    {
      key: "sgst",
      header: orderLabels.discount,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.sgst || ""}
            onChange={(e) => updateEditingData("sgst", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.sgst}</span>
        )
      ),
    },
    {
      key: "actions",
      header: orderLabels.actions,
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          {editingRowId === row.id ? (
            <>
              <IconButton
                size="small"
                onClick={saveRow}
                color="primary"
                sx={{ padding: '4px' }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={cancelEditing}
                color="secondary"
                sx={{ padding: '4px' }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={() => startEditing(row)}
                sx={{ 
                  padding: '4px',
                  color: '#6B7280',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#374151'
                  }
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => deleteRow(row.id!)}
                sx={{ 
                  padding: '4px',
                  color: '#EF4444',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#DC2626'
                  }
                }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      ),
    },
  ];

  const handleSortRequest = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...pharmaTableData];

    if (searchTerm.trim()) {
      sortableItems = sortableItems.filter(
        (item) =>
          item.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batch.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof PharmaTableRow];
        const bValue = b[sortConfig.key as keyof PharmaTableRow];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [pharmaTableData, sortConfig, searchTerm]);

  const rowsPerPage = 5;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: themeColors.textPrimary,
            fontSize: typography.headerSize,
          }}
        >
          {labels.orderDetails}
        </Typography>
      </Box>
      <Divider sx={{ marginTop: "16px", border: "0.5px solid #CBD4E1" }} />

      <Box sx={{ display: "flex", gap: "32px", marginTop: "10px" }}>
        {/* supplier field (UPDATED: Autocomplete to control clear icon visibility) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "275px",
            gap: "4px",
            height: "48px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#9AA8BC",
            }}
          >
            {orderLabels.supplierName}
          </Typography>
          <Autocomplete
            freeSolo
            options={isSuppliersLoading ? ["Loading suppliers..."] : transformedSupplierOptions}
            value={supplierName}
            onInputChange={(_, v) => setSupplierName(v)}
            onChange={(_, v) => {
              // Don't allow selection of loading option
              if (v !== "Loading suppliers...") {
                setSupplierName(v || "");
              }
            }}
            onFocus={() => setIsSupplierFocused(true)}
            onBlur={() => {
              // Add small delay to prevent dropdown from closing too quickly during loading
              setTimeout(() => {
                if (!isSuppliersLoading) {
                  setIsSupplierFocused(false);
                }
              }, 150);
            }}
            loading={isSuppliersLoading}
            disabled={isSuppliersLoading}
            isOptionEqualToValue={(option, value) => option === value}
            getOptionLabel={(option) => String(option)}
            disableClearable
            renderOption={(props, option) => {
              const isLoading = String(option) === "Loading suppliers...";
              return (
                <li 
                  {...props} 
                  key={String(option)}
                  style={{
                    ...props.style,
                    cursor: isLoading ? 'default' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    backgroundColor: isLoading ? '#f5f5f5' : 'transparent',
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    width: '100%',
                    padding: isLoading ? '8px 16px' : '0px',
                    fontStyle: isLoading ? 'italic' : 'normal'
                  }}>
                    {isLoading && <CircularProgress size={16} color="primary" />}
                    <span>{String(option)}</span>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  isSuppliersLoading 
                    ? "Loading suppliers..." 
                    : suppliersError 
                    ? "Error loading suppliers" 
                    : orderLabels.enterSupplierName
                }
                variant="outlined"
                fullWidth
                error={!!suppliersError}
                helperText={
                  suppliersError ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{suppliersError}</span>
                      <Button 
                        size="small" 
                        onClick={retryFetchSuppliers}
                        sx={{ 
                          minWidth: 'auto', 
                          padding: '2px 8px',
                          fontSize: '12px',
                          textTransform: 'none'
                        }}
                      >
                        Retry
                      </Button>
                    </Box>
                  ) : ""
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    height: "48px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#9AA8BC",
                    },
                    "&:hover fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#9AA8BC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: suppliersError ? "#d32f2f" : "#9AA8BC",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "Lexend",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {/* Loading spinner - show when loading */}
                      {isSuppliersLoading && (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      )}
                      
                      {/* Manually render the CloseIcon only if text is present and not loading */}
                      {supplierName && !isSuppliersLoading && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); setSupplierName(""); }}
                            sx={{ padding: 0, marginRight: '4px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}
                      
                      {/* Custom Dropdown Icon - show when not loading */}
                      {!isSuppliersLoading && (
                        <InputAdornment 
                          position="end" 
                          sx={{
                            marginRight: '8px', 
                            transform: 'translateY(0)' 
                          }}
                        >
                          <CustomDropdownIcon />
                        </InputAdornment>
                      )}
                      {/* Autocomplete's default toggle button (chevron) is rendered here if not handled by renderInput */}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* PO Number field (kept unchanged) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.poNumber}
          </Typography>

          <TextField 
            variant="outlined"
            fullWidth
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder={orderLabels.enterPoNumber}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                height: "48px",
                backgroundColor: "#FFFFFF",
                "& fieldset": {
                  borderColor: "#9AA8BC",
                },
                "&:hover fieldset": {
                  borderColor: "#9AA8BC",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#9AA8BC",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "Lexend",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
            }}
          />
        </Box>

        {/* Invoice Date field (kept unchanged) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.invoiceDate}
          </Typography>

          <TextField
            variant="outlined"
            fullWidth
            value={invoiceDate}
            onChange={(e) => {
              let value = e.target.value;
              
              // Remove all non-digit characters
              const digitsOnly = value.replace(/\D/g, "");
              
              // Format with slashes
              let formatted = "";
              if (digitsOnly.length > 0) {
                formatted = digitsOnly.substring(0, 2);
              }
              if (digitsOnly.length >= 3) {
                formatted += "/" + digitsOnly.substring(2, 4);
              }
              if (digitsOnly.length >= 5) {
                formatted += "/" + digitsOnly.substring(4, 8);
              }
              
              setInvoiceDate(formatted);
            }}
            inputProps={{ inputMode: "numeric", pattern: "[0-9/]*", maxLength: 10 }}
            onKeyDown={(e) => {
              // Allow backspace, delete, arrow keys, tab, escape
              if ([8, 9, 27, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                  (e.keyCode === 65 && e.ctrlKey === true) ||
                  (e.keyCode === 67 && e.ctrlKey === true) ||
                  (e.keyCode === 86 && e.ctrlKey === true) ||
                  (e.keyCode === 88 && e.ctrlKey === true)) {
                return;
              }
              // Allow only numbers
              if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
              }
            }}
            placeholder={orderLabels.dateFormat}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                height: "48px",
                backgroundColor: "#FFFFFF",
                "& fieldset": { borderColor: "#9AA8BC" },
                "&:hover fieldset": { borderColor: "#9AA8BC" },
                "&.Mui-focused fieldset": { 
                  borderColor: "#9AA8BC",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "Lexend",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
            }}
            InputProps={{
              endAdornment: invoiceDate ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setInvoiceDate("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
        </Box>
        
        {/* Payment method (UPDATED icon component is fine, no clear icon needed) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "6px", 
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.paymentMethod}
          </Typography>

          <TextField
            select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            variant="outlined"
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                height: "48px",
                backgroundColor: "#FFFFFF",
                "& fieldset": {
                  borderColor: "#9AA8BC",
                },
                "&:hover fieldset": {
                  borderColor: "#9AA8BC",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#9AA8BC",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "Lexend",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
              // Style for the default Select icon wrapper
              "& .MuiSelect-icon": {
                right: '16px', 
              }
            }}
            SelectProps={{
              // Use the updated CustomDropdownIcon
              IconComponent: CustomDropdownIcon, 
            }}
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Payment vendor field (UPDATED: Autocomplete to control clear icon visibility) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "274px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.paymentVendor}
          </Typography>

          <Autocomplete
            freeSolo
            options={paymentVendors.filter((b) => b.toLowerCase().startsWith(paymentVendor.toLowerCase()))}
            value={paymentVendor}
            onInputChange={(_, v) => setPaymentVendor(v)}
            onChange={(_, v) => setPaymentVendor(v || "")}
            onFocus={() => setIsVendorFocused(true)}
            onBlur={() => setIsVendorFocused(false)}
            // UPDATED: Disable the default clear button rendering (clearIcon)
            disableClearable
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={orderLabels.selectBankVendor}
                variant="outlined"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    height: "48px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#9AA8BC",
                    },
                    "&:hover fieldset": {
                      borderColor: "#9AA8BC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#9AA8BC",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "Lexend",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  // Manually placing the icons for better control of spacing
                  endAdornment: (
                    <>
                      {/* Manually render the CloseIcon only if text is present */}
                      {paymentVendor && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); setPaymentVendor(""); }}
                            sx={{ padding: 0, marginRight: '4px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}

                      {/* Custom Dropdown Icon positioned at the very end */}
                      <InputAdornment 
                        position="end" 
                        sx={{ 
                          marginRight: '8px', 
                          transform: 'translateY(0)' 
                        }}
                      >
                        <CustomDropdownIcon />
                      </InputAdornment>
                      {/* Autocomplete's default toggle button (chevron) is rendered here if not handled by renderInput */}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Transaction Number field (kept unchanged) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "275px",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525E6F",
            }}
          >
            {orderLabels.transactionNumber}
          </Typography>
          <TextField
            variant="outlined"
            fullWidth
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                height: "48px",
                backgroundColor: "#FFFFFF",
                "& fieldset": { borderColor: "#9AA8BC" },
                "&:hover fieldset": { borderColor: "#9AA8BC" },
                "&.Mui-focused fieldset": { 
                  borderColor: "#9AA8BC",
                  outline: "none",
                },
                "&.Mui-focused": {
                  outline: "none",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "Lexend",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
            }}
            InputProps={{
              endAdornment: transactionNumber ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setTransactionNumber("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
        </Box>
      </Box>
      <Divider sx={{ marginTop: "10px", border: "0.3px solid #CBD4E14D" }} />

      {/* Find Product row (UPDATED: Autocomplete to control clear icon visibility) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          marginTop: "24px",
          marginBottom: "24px",
          gap: "16px",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Lexend",
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: "18px",
              color: "#728197",
            }}
          >
            {orderLabels.findProduct}
          </Typography>
          <Autocomplete
            key={isProductSelected ? 'selected' : 'not-selected'}
            freeSolo
                options={[
                  ...masterProducts.map((p) => p.productName),
                  orderLabels.addProducts,
                ]}
            value={findProductTerm}
            onInputChange={(_, v) => {
              console.log('Input changed:', v);
              setFindProductTerm(v);
              // Reset selected state when user starts typing
              if (v !== findProductTerm) {
                setIsProductSelected(false);
              }
            }}
            onChange={(_, v) => {
              if (v === orderLabels.addProducts) {
                setIsNewProductModalOpen(true);
                return;
              }
              const value = (v as string) || "";
              if (value && value !== orderLabels.addProducts) {
                // Keep the product in the input field AND add to table
                setFindProductTerm(value);
                addProductToTable(value);
              } else {
                setFindProductTerm(value);
              }
            }}
            onKeyDown={(e) => {
              // Allow adding custom products by pressing Enter
              if (e.key === 'Enter' && findProductTerm && findProductTerm !== orderLabels.addProducts) {
                e.preventDefault();
                addProductToTable(findProductTerm);
              }
            }}
            onFocus={() => setIsFindProductFocused(true)}
            onBlur={() => setIsFindProductFocused(false)}
            // Disable the default clear button - we'll handle it manually
            disableClearable
            ListboxProps={{
              style: {
                maxHeight: '200px',
                overflowY: 'auto',
                paddingBottom: '0px',
              }
            }}
                renderOption={(props, option) => {
                  const isAddProduct = String(option) === orderLabels.addProducts;
              return (
                <li 
                  {...props} 
                  key={String(option)}
                  style={{
                    ...props.style,
                    backgroundColor: isAddProduct ? "#5C17E5" : "transparent",
                    color: isAddProduct ? "#ffffff" : "inherit",
                    fontWeight: isAddProduct ? "600" : "normal",
                    padding: isAddProduct ? "8px 12px" : "8px 16px",
                    borderRadius: isAddProduct ? "6px" : "0px",
                    margin: isAddProduct ? "2px 8px" : "0px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "14px",
                    minHeight: "auto",
                    lineHeight: "1.4",
                    position: isAddProduct ? "sticky" : "relative",
                    bottom: isAddProduct ? "0" : "auto",
                    zIndex: isAddProduct ? "10" : "1",
                  }}
                  onMouseEnter={(e) => {
                    if (isAddProduct) {
                      e.currentTarget.style.backgroundColor = "#4A14C7";
                    } else {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isAddProduct) {
                      e.currentTarget.style.backgroundColor = "#5C17E5";
                    } else {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {String(option)}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={orderLabels.search}
                variant="outlined"
                sx={{
                  width: "344px",
                  "& .MuiOutlinedInput-root": {
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    "& fieldset": { 
                      borderColor: "transparent",
                      display: "none",
                    },
                    "&:hover fieldset": { 
                      borderColor: "transparent",
                    },
                    "&.Mui-focused fieldset": { 
                      borderColor: "transparent",
                      outline: "none",
                    },
                    "&.Mui-focused": {
                      outline: "none",
                      border: "1px solid #D1D5DB",
                    },
                    "&:hover": {
                      border: "1px solid #D1D5DB",
                    },
                  },
                  "& .MuiInputBase-input": {
                    padding: "8px 12px",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "#6B7280",
                    "&::placeholder": {
                      color: "#9CA3AF",
                      opacity: 1,
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ marginLeft: "12px" }}>
                      <SearchIcon sx={{ color: "#9CA3AF", width: "16px", height: "16px" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {/* Manually render the CloseIcon only when a product was selected from dropdown */}
                      {isProductSelected && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setFindProductTerm(""); 
                              setIsProductSelected(false);
                            }}
                            sx={{ padding: 0, marginRight: '4px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}

                      {/* Custom Dropdown Icon positioned at the very end */}
                      <InputAdornment 
                        position="end" 
                        sx={{ 
                          marginRight: '8px', 
                          transform: 'translateY(0)' 
                        }}
                      >
                        <CustomDropdownIcon />
                      </InputAdornment>
                      {/* Autocomplete's default toggle button (chevron) is rendered here if not handled by renderInput */}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

      </Box>

      {/* Pharma Table */}
      <Box sx={{ 
        marginTop: "24px",
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          height: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#c1c1c1",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "#a8a8a8",
          },
        },
      }}>
        <ReusableTable
          columns={pharmaTableColumns}
          selectedRows={[]}
          setSelectedRows={() => {}}
          data={paginatedData}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey={""}
          onFilterSelect={() => {}}
          totalRows={sortedData.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      </Box>

      {/* Footer actions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "12px", mt: 3 }}>
        <Button
          variant="outlined"
          disableRipple
          onClick={() => {
            // Clear all form data and table
            setPharmaTableData([]);
            setFindProductTerm("");
            setEditingRowId(null);
            setEditingData({});
            setSupplierName("");
            setPoNumber("");
            setInvoiceDate("");
            setTransactionNumber("");
            setPaymentVendor("");
            setIsProductSelected(false);
          }}
          sx={{
            borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
            color: themeColors.cancelButtonBorder || "#27313F",
            backgroundColor: "transparent",
            "&:hover": { 
              backgroundColor: "transparent",
              borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
              color: themeColors.cancelButtonBorder || "#27313F",
              borderWidth: "2px",
            },
            "&:focus": {
              backgroundColor: "transparent",
              borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
              color: themeColors.cancelButtonBorder || "#27313F",
              borderWidth: "2px",
            },
            "&:active": {
              backgroundColor: "transparent",
              borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
              color: themeColors.cancelButtonBorder || "#27313F",
              borderWidth: "2px",
            },
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
                borderWidth: "2px",
              },
            },
            height: "48px",
            width: "86px",
            borderRadius: "12px",
            fontFamily: "Lexend",
            fontWeight: 500,
            fontSize: "12px",
            lineHeight: "24px",
            border: "2px solid",
            textTransform: "none",
            "& .MuiButton-outlined": {
              border: "2px solid",
              "&:hover": {
                border: "2px solid",
              },
            },
          }}
        >
          {orderLabels.cancelButton}
        </Button>
        <Button
          variant="contained"
          disableRipple
          disableElevation
          disabled={isSaving || pharmaTableData.length === 0}
          onClick={submitReceipt}
          sx={{
            backgroundColor: saveSuccess ? "#10B981" : isSaving ? "#6B7280" : "#5C17E5",
            "&:hover": {
              backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              boxShadow: "none",
            },
            "&:focus": {
              backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              boxShadow: "none",
            },
            "&:active": {
              backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              boxShadow: "none",
            },
            "&:focus-visible": {
              backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              boxShadow: "none",
            },
            "&.Mui-focusVisible": {
              backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              boxShadow: "none",
            },
            "& .MuiTouchRipple-root": {
              display: "none",
            },
            "& .MuiButtonBase-root": {
              "&:active": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              },
            },
            "& .MuiButton-contained": {
              "&:active": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              },
            },
            "& .MuiButton-root": {
              "&:active": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              },
            },
            "&::before": {
              display: "none",
            },
            "&::after": {
              display: "none",
            },
            borderRadius: "12px",
            width: "86px",
            height: "48px",
            fontFamily: "Lexend",
            textTransform: "none",
            boxShadow: "none",
            position: "relative",
            overflow: "hidden",
            "& *": {
              "&:active": {
                backgroundColor: saveSuccess ? "#059669" : isSaving ? "#6B7280" : "#4A14C7",
              },
            },
          }}
        >
          {isSaving ? (
            <CircularProgress size={16} color="inherit" />
          ) : saveSuccess ? (
            "Saved!"
          ) : (
            orderLabels.saveButton
          )}
        </Button>
      </Box>

      <NewProductModal
        open={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!saveError}
        autoHideDuration={6000}
        onClose={() => setSaveError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSaveError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {saveError}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSaveSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Receipt submitted successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default OrderDetails;