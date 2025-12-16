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

interface ProductSelectionFormProps {
  // Product Search
  findProduct: string;
  isProductSelected: boolean;
  isProductsLoading: boolean;
  productOptions: string[];
  onProductInputChange: (value: string) => void;
  onProductChange: (value: string | null) => void;
  onClearProduct: () => void;
  
  // Quantity
  qty: number;
  onQtyChange: (value: number) => void;
  
  // Type
  showTypeDropdown: boolean;
  availableTypes: string[];
  productType: string;
  onTypeChange: (value: string) => void;
  
  // Discount
  discount: number;
  onDiscountChange: (value: number) => void;
  
  // Discount Authorized By
  discountAuthorizedBy?: string;
  onDiscountAuthorizedByChange: (value: string) => void;
  
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
  qty,
  onQtyChange,
  showTypeDropdown,
  availableTypes,
  productType,
  onTypeChange,
  discount,
  onDiscountChange,
  discountAuthorizedBy,
  onDiscountAuthorizedByChange,
  onAddToCart,
  isValidating,
  validationError,
  validatedData,
}) => {
  const { data: doctorNames = [], isLoading: isLoadingDoctors } = useGetDoctorNamesQuery();
  return (
    <ProductSelectionContainer>
      <FormFieldsContainer>
        {/* Find Product */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            {SALES_PAGE_LABELS.FIND_PRODUCT_LABEL}
          </Typography>
          <Autocomplete
            key={isProductSelected ? 'selected' : 'not-selected'}
            freeSolo
            forcePopupIcon
            openOnFocus
            options={
              isProductsLoading 
                ? ["Loading products..."] 
                : productOptions.length > 0 
                  ? productOptions.filter(option => option && typeof option === 'string')
                  : ["No products found"]
            }
            value={findProduct || ''}
            noOptionsText="No products found"
            onInputChange={(_, v) => {
              onProductInputChange(v);
            }}
            onChange={(_, v) => {
              const value = (v as string) || "";
              if (value && value !== "Loading products..." && value !== "No products found") {
                onProductChange(value);
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
            ListboxProps={{
              style: {
                maxHeight: '200px',
                overflowY: 'auto',
                paddingBottom: '0px',
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
                  width: "344px",
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
                    paddingLeft: "0px",
                    fontFamily: "'Lexend', sans-serif",
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
                  startAdornment: !isProductSelected ? (
                    <InputAdornment position="start" sx={{ marginLeft: "12px", marginRight: "8px" }}>
                      <SearchIcon sx={{ color: "#9CA3AF", width: "16px", height: "16px" }} />
                    </InputAdornment>
                  ) : null,
                  endAdornment: (
                    <>
                      {isProductSelected && (
                        <InputAdornment position="end">
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

        {/* Type Dropdown */}
        {showTypeDropdown && availableTypes.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{SALES_PAGE_LABELS.TYPE_LABEL}</Typography>
            <FormControl size="small" sx={{ minWidth: SALES_PAGE_CONSTANTS.TYPE_DROPDOWN_MIN_WIDTH, height: '40px' }}>
              <Select
                value={productType}
                onChange={(e) => onTypeChange(e.target.value)}
                displayEmpty
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
                {availableTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Discount */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{SALES_PAGE_LABELS.DISCOUNT_LABEL}</Typography>
          <TextField
            value={discount}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Allow empty string or valid number
              if (inputValue === '') {
                onDiscountChange(0);
                onDiscountAuthorizedByChange(''); // Clear authorization when discount is 0
              } else {
                const numValue = parseInt(inputValue);
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
              width: SALES_PAGE_CONSTANTS.DISCOUNT_FIELD_WIDTH,
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
            }}
            inputProps={{ style: { textAlign: 'center' } }}
          />
        </Box>

        {/* Discount Authorized By - appears when discount > 0 */}
        {discount > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Discount Authorized by</Typography>
            <Autocomplete
              freeSolo
              forcePopupIcon
              openOnFocus
              options={isLoadingDoctors ? ["Loading doctors..."] : doctorNames}
              value={discountAuthorizedBy || ''}
              onChange={(_, newValue) => {
                onDiscountAuthorizedByChange(newValue || '');
              }}
              onInputChange={(_, newInputValue) => {
                onDiscountAuthorizedByChange(newInputValue);
              }}
              disabled={!isProductSelected}
              loading={isLoadingDoctors}
              noOptionsText="No doctors found"
              popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
              ListboxProps={{
                style: {
                  maxHeight: '200px',
                  overflowY: 'auto',
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search doctor name..."
                  variant="outlined"
                  sx={{
                    width: "280px",
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
                    startAdornment: (
                      <InputAdornment position="start" sx={{ marginLeft: "12px", marginRight: "8px" }}>
                        <SearchIcon sx={{ color: "#9CA3AF", width: "16px", height: "16px" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}
      </FormFieldsContainer>

      {/* Add to Cart Button */}
      <StandardButton
        startIcon={<img src={AddCartIcon} alt="Add to Cart" style={{ width: '16px', height: '16px' }} />}
        onClick={onAddToCart}
        disabled={!!validationError || isValidating || !validatedData}
        variant="primary"
        size="medium"
        sx={{
          marginTop: '20px',
          borderRadius: '12px',
        }}
      >
        {isValidating ? 'Validating...' : SALES_PAGE_LABELS.ADD_TO_CART_BUTTON}
      </StandardButton>
    </ProductSelectionContainer>
  );
};

export default ProductSelectionForm;

