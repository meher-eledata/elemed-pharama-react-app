import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { StandardButton } from '../../../components/Common';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddCartIcon from '../../../assets/AddCart.svg';
import { ProductSelectionContainer, FormFieldsContainer } from '../SalesPage.styles';
import { SALES_PAGE_LABELS } from '../../../config/label/SalesPage.labels';
import { SALES_PAGE_CONSTANTS } from '../../../config/constants/SalesPage.constants';
import { useGetDoctorNamesQuery } from '../../../redux/slices/salesApi';
import { CircularProgress } from '@mui/material';
import dayjs from 'dayjs';

interface ProductSelectionFormProps {
  // Product Search
  findProduct: string;
  isProductSelected: boolean;
  isProductsLoading: boolean;
  productOptions: Array<{ name: string; currentQuantity?: number }>;
  onProductInputChange: (value: string) => void;
  onProductChange: (value: string | null) => void;
  onClearProduct: () => void;

  // Brand
  showBrandDropdown: boolean;
  availableBrands: Array<{ id: number; brand_name: string; currentQuantity?: number }>;
  brand: string;
  brandId: number | null;
  onBrandChange: (brandId: number, brandName: string) => void;
  isBrandsLoading: boolean;

  // Type
  showTypeDropdown: boolean;
  availableTypes: Array<{ type: string; product_id: number; currentQuantity?: number }>;
  productType: string;
  selectedTypeProductId: number | null;
  onTypeChange: (type: string, productId: number) => void;
  isTypesLoading: boolean;

  // Batch
  showBatchDropdown: boolean;
  availableBatches: Array<{ batch_number: string; current_qty: number; expiry_date?: string }>;
  batch: string;
  onBatchChange: (value: string) => void;
  isBatchesLoading: boolean;

  // Quantity
  qty: number;
  onQtyChange: (value: number) => void;

  // Discount
  discount: number;
  onDiscountChange: (value: number) => void;

  // Discount Authorized By
  discountAuthorizedBy?: string;
  discountAuthorizedById?: number;
  onDiscountAuthorizedByChange: (value: string, doctorId?: number) => void;

  // Add to Cart
  onAddToCart: () => void;
  isValidating: boolean;
  validationError: string;
  validatedData: any;
}

const ProductSelectionForm: React.FC<ProductSelectionFormProps> = ({
  findProduct,
  isProductSelected,
  isProductsLoading,
  productOptions,
  onProductInputChange,
  onProductChange,
  onClearProduct,
  showBrandDropdown,
  availableBrands,
  brand,
  brandId,
  onBrandChange,
  isBrandsLoading,
  showTypeDropdown,
  availableTypes,
  productType,
  selectedTypeProductId,
  onTypeChange,
  isTypesLoading,
  showBatchDropdown,
  availableBatches,
  batch,
  onBatchChange,
  isBatchesLoading,
  qty,
  onQtyChange,
  discount,
  onDiscountChange,
  discountAuthorizedBy,
  discountAuthorizedById,
  onDiscountAuthorizedByChange,
  onAddToCart,
  isValidating,
  validationError,
  validatedData,
}) => {
  const { data: doctorNames = [], isLoading: isLoadingDoctorNames } = useGetDoctorNamesQuery();
  const [productSearchOpen, setProductSearchOpen] = React.useState(false);

  // Reset dropdown state when product selection changes or products load
  React.useEffect(() => {
    if (isProductSelected) {
      setProductSearchOpen(false);
    }
  }, [isProductSelected]);

  // Close dropdown when products are loading to prevent stale state
  React.useEffect(() => {
    if (isProductsLoading) {
      setProductSearchOpen(false);
    }
  }, [isProductsLoading]);

  const handleOpen = () => {
    // Only open if not loading - show no options text if empty
    if (!isProductsLoading) {
      setProductSearchOpen(true);
    }
  };

  return (
    <ProductSelectionContainer>
      <FormFieldsContainer>
        {/* Find Product */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            {SALES_PAGE_LABELS.FIND_PRODUCT_LABEL}
          </Typography>
          <Autocomplete
            key={`${isProductSelected ? 'selected' : 'not-selected'}-${productOptions.length}`}
            freeSolo
            forcePopupIcon
            open={productSearchOpen && !isProductsLoading}
            onOpen={handleOpen}
            onClose={() => setProductSearchOpen(false)}
            options={
              isProductsLoading
                ? []
                : productOptions.length > 0
                  ? productOptions
                  : []
            }
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
            renderOption={(props, option) => (
              <li {...props} key={typeof option === 'string' ? option : option.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '14px' }}>{typeof option === 'string' ? option : option.name}</Typography>
                  <Typography sx={{ fontSize: '14px', color: '#9CA3AF', whiteSpace: 'nowrap', ml: 2, fontWeight: 400 }}>
                    {typeof option === 'string' ? 0 : (option.currentQuantity || 0)}
                  </Typography>
                </Box>
              </li>
            )}
            value={findProduct || ''}
            noOptionsText={isProductsLoading ? "Loading products..." : "No products found"}
            loading={isProductsLoading}
            onInputChange={(_, v) => {
              onProductInputChange(v);
            }}
            onChange={(_, v) => {
              const value = typeof v === 'string' ? v : v?.name || "";
              if (value && value !== "Loading products..." && value !== "No products found") {
                onProductChange(value);
                setProductSearchOpen(false);
              } else {
                onProductChange("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && findProduct) {
                e.preventDefault();
              }
            }}
            disableClearable
            popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
            slotProps={{
              popper: {
                sx: {
                  "& .MuiPaper-root": {
                    borderRadius: "12px",
                    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                    marginTop: "8px",
                    border: "1px solid #E5E7EB",
                    height: "auto !important",
                    minHeight: "unset !important",
                    padding: "0px !important",
                    overflow: "hidden",
                    "& .MuiAutocomplete-listbox": {
                      padding: "0px !important",
                      maxHeight: "300px !important",
                      minHeight: "unset !important",
                      overflow: "auto",
                      "& .MuiAutocomplete-option": {
                        borderRadius: "8px",
                        margin: "2px 0",
                        "&[aria-selected='true']": {
                          backgroundColor: "#F3F4F6",
                        },
                        "&:hover": {
                          backgroundColor: "#F9FAFB",
                        },
                      },
                    },
                  },
                },
              },
            }}
            ListboxProps={{
              sx: {
                padding: '0px !important',
                maxHeight: '300px !important',
                minHeight: 'unset !important',
                overflow: 'auto',
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  isProductsLoading
                    ? "Loading products..."
                    : "Search for a product..."
                }
                variant="outlined"
                sx={{
                  width: "200px",
                  "& .MuiOutlinedInput-root": {
                    height: "40px",
                    borderRadius: "18px",
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
                    "& .MuiInputAdornment-root": {
                      opacity: 1,
                    },
                    "& .MuiInputBase-input": {
                      padding: "8px 12px",
                      paddingLeft: "0px",
                      fontFamily: "'Lexend', sans-serif",
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "20px",
                      color: "#6B7280",
                      "&::placeholder": {
                        color: "#9CA3AF",
                        opacity: 1,
                        fontSize: "12px",
                      },
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: !isProductSelected ? (
                    <InputAdornment position="start" sx={{ marginLeft: "12px", marginRight: "8px" }}>
                      <SearchIcon sx={{ color: "#9CA3AF", width: "16px", height: "16px" }} />
                    </InputAdornment>
                  ) : null,
                  endAdornment: (
                    <>
                      {isProductSelected && (
                        <InputAdornment
                          position="end"
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              opacity: 1,
                            },
                            '.MuiOutlinedInput-root:hover &': {
                              opacity: 1,
                            },
                            '.MuiOutlinedInput-root.Mui-focused &': {
                              opacity: 1,
                            },
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearProduct();
                            }}
                            sx={{ padding: 0, marginRight: '4px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Quantity */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{SALES_PAGE_LABELS.QUANTITY_LABEL}</Typography>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: SALES_PAGE_CONSTANTS.BORDER_RADIUS,
            border: '1px solid #D1D5DB',
            overflow: 'hidden',
            backgroundColor: 'white',
            height: '40px',
            outline: 'none',
          }}>
            <IconButton
              size="small"
              onClick={() => onQtyChange(Math.max(SALES_PAGE_CONSTANTS.MIN_QUANTITY, qty - 1))}
              disabled={!isProductSelected}
              sx={{
                bgcolor: 'grey.200',
                color: 'black',
                borderRadius: 0,
                borderRight: '1px solid #D1D5DB',
                height: '40px',
                width: '40px',
                '&:hover': { bgcolor: 'grey.300' },
                '&.Mui-disabled': { bgcolor: 'grey.100', color: 'grey.400' }
              }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <TextField
              value={qty}
              onChange={(e) => onQtyChange(parseInt(e.target.value) || SALES_PAGE_CONSTANTS.MIN_QUANTITY)}
              disabled={!isProductSelected}
              size="small"
              variant="standard"
              sx={{
                width: SALES_PAGE_CONSTANTS.QUANTITY_FIELD_WIDTH,
                height: '40px',
                '& .MuiInput-root': {
                  '&:before': { borderBottom: 'none !important' },
                  '&:after': { borderBottom: 'none !important' },
                  '&:hover:not(.Mui-disabled):before': { borderBottom: 'none !important' },
                  '&:hover:not(.Mui-disabled):after': { borderBottom: 'none !important' },
                  height: '40px',
                  '&:focus': {
                    outline: 'none',
                  },
                },
                '& .MuiInput-input': {
                  textAlign: 'center',
                  padding: '4px 4px',
                  fontSize: '14px',
                  height: '40px',
                  '&:focus': {
                    outline: 'none',
                  },
                }
              }}
            />
            <IconButton
              size="small"
              onClick={() => onQtyChange(qty + 1)}
              disabled={!isProductSelected}
              sx={{
                bgcolor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
                color: 'white',
                borderRadius: 0,
                borderLeft: '1px solid #D1D5DB',
                height: '40px',
                width: '40px',
                '&:hover': { bgcolor: SALES_PAGE_CONSTANTS.PRIMARY_HOVER_COLOR },
                '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' }
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Brand Dropdown */}
        {showBrandDropdown && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Brand</Typography>
            <FormControl size="small" sx={{ minWidth: '140px', width: '140px', height: '40px' }}>
              <Select
                value={brandId || ""}
                onChange={(e) => {
                  const selectedBrand = availableBrands.find(b => b.id === Number(e.target.value));
                  if (selectedBrand) {
                    onBrandChange(selectedBrand.id, selectedBrand.brand_name);
                  }
                }}
                displayEmpty
                disabled={isBrandsLoading}
                renderValue={(selected) => {
                  if (!selected) return <em>Select Brand</em>;
                  const selectedBrand = availableBrands.find(b => b.id === selected);
                  return selectedBrand ? selectedBrand.brand_name : '';
                }}
                sx={{
                  borderRadius: SALES_PAGE_CONSTANTS.BORDER_RADIUS,
                  height: '40px',
                  outline: 'none',
                  '& .MuiSelect-icon': {
                    fontSize: '24px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&.Mui-focused': {
                    outline: 'none',
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select Brand</em>
                </MenuItem>
                {isBrandsLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading brands...
                  </MenuItem>
                ) : (
                  availableBrands.map((brandItem) => (
                    <MenuItem key={brandItem.id} value={brandItem.id}>
                      <Typography sx={{ fontSize: '14px' }}>{brandItem.brand_name}</Typography>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Type Dropdown */}
        {showTypeDropdown && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{SALES_PAGE_LABELS.TYPE_LABEL}</Typography>
            <FormControl size="small" sx={{ minWidth: '140px', width: '140px', height: '40px' }}>
              <Select
                value={productType || ""}
                onChange={(e) => {
                  const selectedType = availableTypes.find(t => t.type === e.target.value);
                  if (selectedType) {
                    onTypeChange(selectedType.type, selectedType.product_id);
                  }
                }}
                displayEmpty
                disabled={isTypesLoading}
                renderValue={(selected) => {
                  if (!selected) return <em>{SALES_PAGE_LABELS.TYPE_PLACEHOLDER}</em>;
                  const selectedType = availableTypes.find(t => t.type === selected);
                  return selectedType ? selectedType.type : '';
                }}
                sx={{
                  borderRadius: SALES_PAGE_CONSTANTS.BORDER_RADIUS,
                  height: '40px',
                  outline: 'none',
                  '& .MuiSelect-icon': {
                    fontSize: '24px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&.Mui-focused': {
                    outline: 'none',
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>{SALES_PAGE_LABELS.TYPE_PLACEHOLDER}</em>
                </MenuItem>
                {isTypesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading types...
                  </MenuItem>
                ) : (
                  availableTypes.map((typeItem) => (
                    <MenuItem key={`${typeItem.type}-${typeItem.product_id}`} value={typeItem.type}>
                      <Typography sx={{ fontSize: '14px' }}>{typeItem.type}</Typography>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Batch Dropdown */}
        {showBatchDropdown && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Batch Number</Typography>
            <FormControl size="small" sx={{ minWidth: '160px', width: '160px', height: '40px' }}>
              <Select
                value={batch || ""}
                onChange={(e) => onBatchChange(e.target.value)}
                displayEmpty
                disabled={isBatchesLoading}
                renderValue={(selected) => {
                  if (!selected) return <em>Select Batch</em>;
                  // Find matching batch to show number only in the select box
                  return selected as string;
                }}
                sx={{
                  borderRadius: SALES_PAGE_CONSTANTS.BORDER_RADIUS,
                  height: '40px',
                  outline: 'none',
                  '& .MuiSelect-icon': {
                    fontSize: '24px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&.Mui-focused': {
                    outline: 'none',
                  },
                  '& .MuiSelect-select': {
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    paddingRight: '32px !important',
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select Batch</em>
                </MenuItem>
                {isBatchesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading batches...
                  </MenuItem>
                ) : (
                  availableBatches.map((batchItem) => {
                    const expiry = batchItem.expiry_date ? dayjs(batchItem.expiry_date) : null;
                    const expiryLabel = expiry && expiry.isValid() ? expiry.format('MMM YYYY') : '';
                    return (
                      <MenuItem key={batchItem.batch_number} value={batchItem.batch_number} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{batchItem.batch_number}</Typography>
                        <Typography sx={{ fontSize: '14px', color: '#9CA3AF', whiteSpace: 'nowrap', ml: 2, fontWeight: 400 }}>
                          {`Qty: ${batchItem.current_qty ?? 0}`}{expiryLabel ? ` · Exp: ${expiryLabel}` : ''}
                        </Typography>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Discount */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{SALES_PAGE_LABELS.DISCOUNT_LABEL}</Typography>
          <TextField
            value={discount}
            onChange={(e) => {
              let inputValue = e.target.value;
              // Prevent leading zero (e.g., "05" -> "5")
              if (inputValue.length > 1 && inputValue.startsWith('0')) {
                inputValue = inputValue.substring(1);
                e.target.value = inputValue; // Force browser to sync immediately
              }
              // Allow empty string or valid number
              if (inputValue === '') {
                onDiscountChange(0);
                onDiscountAuthorizedByChange(''); // Clear authorization when discount is 0
              } else {
                const numValue = parseFloat(inputValue);
                if (!isNaN(numValue)) {
                  onDiscountChange(Math.max(SALES_PAGE_CONSTANTS.MIN_DISCOUNT, Math.min(SALES_PAGE_CONSTANTS.MAX_DISCOUNT, numValue)));
                  if (numValue === 0) {
                    onDiscountAuthorizedByChange(''); // Clear authorization when discount is 0
                  }
                }
              }
            }}
            onFocus={(e) => {
              // Select all text when focused so typing replaces the value
              e.target.select();
            }}
            disabled={!isProductSelected}
            size="small"
            sx={{
              width: '80px',
              height: '40px',
              outline: 'none',
              '& .MuiOutlinedInput-root': {
                borderRadius: SALES_PAGE_CONSTANTS.BORDER_RADIUS,
                height: '40px',
                outline: 'none',
                '& fieldset': {
                  borderColor: '#D1D5DB',
                },
                '&:hover fieldset': {
                  borderColor: '#D1D5DB',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#D1D5DB',
                },
                '&.Mui-focused': {
                  outline: 'none',
                },
              },
              '& .MuiInputBase-input': {
                textAlign: 'center',
                fontFamily: "'Lexend', sans-serif",
                fontSize: "14px",
              }
            }}
            type="number"
            inputProps={{
              step: "1",
              min: 0,
              max: 100
            }}
          />
        </Box>

        {/* Discount Authorized By - appears when discount > 0 (mandatory) */}
        {discount > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Discount Authorized by <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Autocomplete
              freeSolo
              forcePopupIcon
              openOnFocus
              options={isLoadingDoctorNames ? [] : doctorNames}
              value={doctorNames.find(d => d.name === discountAuthorizedBy) || null}
              getOptionLabel={(option: { id: string; name: string } | string | null) => {
                if (typeof option === 'string') return option;
                if (option && typeof option === 'object' && option !== null && 'name' in option) {
                  return option.name;
                }
                return '';
              }}
              onChange={(_, newValue: { id: string; name: string } | string | null) => {
                if (!newValue) {
                  onDiscountAuthorizedByChange('', undefined);
                  return;
                }

                // Handle both object and string formats
                if (typeof newValue === 'string') {
                  // If it's a string, try to find matching doctor
                  const matchingDoctor = doctorNames.find(d =>
                    d.name.toLowerCase().trim() === newValue.toLowerCase().trim()
                  );
                  if (matchingDoctor) {
                    onDiscountAuthorizedByChange(matchingDoctor.name, parseInt(matchingDoctor.id));
                  } else {
                    onDiscountAuthorizedByChange(newValue, undefined);
                  }
                } else if (newValue && typeof newValue === 'object' && 'name' in newValue) {
                  // If it's an object, extract name and ID
                  onDiscountAuthorizedByChange(newValue.name, parseInt(newValue.id));
                }
              }}
              onInputChange={(_, newInputValue) => {
                // When typing, try to find matching doctor (case-insensitive)
                if (!newInputValue) {
                  onDiscountAuthorizedByChange('', undefined);
                  return;
                }

                // Try exact match first
                let matchingDoctor = doctorNames.find(d =>
                  d.name.toLowerCase().trim() === newInputValue.toLowerCase().trim()
                );

                // If exact match not found, try partial match
                if (!matchingDoctor && newInputValue.length > 2) {
                  matchingDoctor = doctorNames.find(d =>
                    d.name.toLowerCase().trim().startsWith(newInputValue.toLowerCase().trim()) ||
                    newInputValue.toLowerCase().trim().startsWith(d.name.toLowerCase().trim())
                  );
                }

                if (matchingDoctor) {
                  onDiscountAuthorizedByChange(matchingDoctor.name, parseInt(matchingDoctor.id));
                } else {
                  onDiscountAuthorizedByChange(newInputValue, undefined);
                }
              }}
              disabled={!isProductSelected}
              loading={isLoadingDoctorNames}
              noOptionsText="No doctors found"
              popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiPaper-root": {
                      borderRadius: "12px",
                      marginTop: "4px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      border: "1px solid #E6ECF5",
                      height: "auto !important",
                      minHeight: "unset !important",
                      padding: "0px !important",
                      overflow: "hidden",
                      "& .MuiAutocomplete-listbox": {
                        padding: "0px !important",
                        maxHeight: "300px !important",
                        minHeight: "unset !important",
                        overflow: "auto",
                      },
                    },
                  },
                },
              }}
              ListboxProps={{
                sx: {
                  padding: '0px !important',
                  maxHeight: '300px !important',
                  minHeight: 'unset !important',
                  overflow: 'auto',
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search doctor name..."
                  variant="outlined"
                  sx={{
                    width: "200px",
                    "& .MuiOutlinedInput-root": {
                      height: "40px",
                      borderRadius: "18px",
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
                      paddingLeft: "6px",
                      fontFamily: "'Lexend', sans-serif",
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "20px",
                      color: "#6B7280",
                      "&::placeholder": {
                        color: "#9CA3AF",
                        opacity: 1,
                        fontSize: "14px",
                      },
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: !discountAuthorizedBy ? (
                      <InputAdornment position="start" sx={{ marginLeft: "12px", marginRight: "8px" }}>
                        <SearchIcon sx={{ color: "#9CA3AF", width: "16px", height: "16px" }} />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              )}
            />
          </Box>
        )}
      </FormFieldsContainer>

      {/* Add to Cart Button */}
      <StandardButton
        startIcon={<img src={AddCartIcon} alt="Add to Cart" style={{ width: '16px', height: '16px', flexShrink: 0 }} />}
        onClick={onAddToCart}
        disabled={isValidating} // Only disable when actively validating, allow clicks to show warnings
        variant="primary"
        size="medium"
        sx={{
          borderRadius: '12px',
          opacity: (!!validationError || !validatedData) ? 0.6 : 1, // Visual indicator when disabled
          minWidth: '140px', // Fixed width to prevent layout shift across systems
          flexShrink: 0, // Prevent button from shrinking
        }}
      >
        {isValidating ? 'Validating...' : SALES_PAGE_LABELS.ADD_TO_CART_BUTTON}
      </StandardButton>
    </ProductSelectionContainer>
  );
};

export default ProductSelectionForm;

