import React, { useState, useMemo } from 'react';
import { Box, Typography, Autocomplete, TextField, InputAdornment, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';
import { StandardButton } from '../../../components/Common';
import { Customer } from '../../../redux/slices/salesApi';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import {
  CustomerDetailsColumn,
  SectionRow,
  CustomerNameField,
  PhoneNoField,
  CityField,
} from '../SalesReceipt.styles';

// City options for dropdown
const cityOptions = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi'
];
// import DropDown from '../../../assets/DropDown.svg'; // Removed for standardization

interface CustomerDetailsSectionProps {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  patientType: string;
  selectedCustomer: Customer | null;
  customerNames: string[]; // Customer names from /sales/get-all-customer-names endpoint
  availablePhones?: string[]; // Phone numbers from /sales/get-customer-phones/ endpoint
  onCustomerNameChange: (value: string) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerMobileChange: (value: string) => void;
  onCustomerCityChange: (value: string) => void;
  onPatientTypeChange: (value: string) => void;
  onAddNewCustomer: () => void;
}

const CustomerDetailsSection: React.FC<CustomerDetailsSectionProps> = ({
  customerName,
  customerMobile,
  customerCity,
  patientType,
  selectedCustomer,
  customerNames,
  availablePhones = [],
  onCustomerNameChange,
  onCustomerSelect,
  onCustomerMobileChange,
  onCustomerCityChange,
  onPatientTypeChange,
  onAddNewCustomer,
}) => {
  const [patientTypeOpen, setPatientTypeOpen] = useState(false);

  // The customer NAME picker must only suggest actual names. Guard against
  // malformed records whose `name` is really a phone number (all digits, no
  // letters) so bare mobile numbers never appear as name options. A genuine
  // person/business name always contains at least one letter.
  const nameOptions = useMemo(
    () => customerNames.filter((n) => /[A-Za-z]/.test(n || '')),
    [customerNames]
  );

  return (
    <CustomerDetailsColumn>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        gap: '12px'
      }}>
        <Typography sx={{
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 600,
          fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_SECTION,
          color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
          marginBottom: 0
        }}>
          {SALES_RECEIPT_LABELS.CUSTOMER_DETAILS_TITLE}
        </Typography>
        <StandardButton
          onClick={onAddNewCustomer}
          variant="primary"
          size="small"
          startIcon={<AddIcon sx={{ color: '#FFFFFF', fontSize: '19.5px' }} />}
          sx={{
            width: '180px',
            height: '35px',
            fontSize: '12px',
            padding: '6px 16px',
            flexShrink: 0,
            marginLeft: '20px',
          }}
        >
          {SALES_RECEIPT_LABELS.ADD_NEW_CUSTOMER_BUTTON}
        </StandardButton>
      </Box>

      <SectionRow>
        <Autocomplete<string, false, boolean, true>
          freeSolo
          options={nameOptions} // Customer names from /sales/get-all-customer-names endpoint (phone-only records filtered out)
          getOptionLabel={(option: string | { name: string } | null) => {
            // Handle both string and object formats
            if (typeof option === 'string') return option;
            if (option && typeof option === 'object' && 'name' in option) return (option as { name: string }).name;
            return String(option || '');
          }}
          value={customerName || null}
          isOptionEqualToValue={(option, value) => {
            const optionValue = typeof option === 'string' ? option : (option && typeof option === 'object' && 'name' in option ? (option as { name: string }).name : '');
            const valueStr = value || '';
            return optionValue === valueStr;
          }}
          onChange={(_, newValue) => {
            // Handle string (customer name) - this fires when selecting from dropdown
            const nameValue = typeof newValue === 'string' ? newValue : '';
            if (nameValue) {
              // Clear the selected customer first - let the hook fetch phone and set it properly
              onCustomerSelect(null);
              // Clear mobile to ensure auto-fill works when selecting from dropdown
              // The hook will fetch phones and auto-fill if there's exactly one phone
              onCustomerMobileChange('');
              // Update the name - this will trigger handleCustomerNameChange in SalesReceipt.tsx
              // which re-fetches the ID if needed.
              onCustomerNameChange(nameValue);
            } else {
              // User cleared the field
              onCustomerNameChange('');
              onCustomerSelect(null);
              onCustomerMobileChange('');
            }
          }}
          onInputChange={(_, newInputValue, reason) => {
            // Only update when user is typing (not when selecting from dropdown)
            // reason: 'input' = typing, 'reset' = cleared, 'clear' = clear button
            if (reason === 'input') {
              onCustomerNameChange(newInputValue);
              // If user types something different, clear selection
              if (selectedCustomer && newInputValue !== selectedCustomer.name) {
                onCustomerSelect(null);
                onCustomerMobileChange('');
              }
            }
          }}
          // Only show clear button when value is present
          disableClearable={!customerName}
          forcePopupIcon
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
              padding: "0px !important",
              maxHeight: "300px !important",
              minHeight: "unset !important",
              overflow: "auto",
            },
          }}
          sx={{ width: '220px' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={SALES_RECEIPT_LABELS.CUSTOMER_NAME_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.CUSTOMER_NAME_PLACEHOLDER}
              sx={{
                width: '220px',
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  '& fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: "'Lexend', sans-serif",
                    opacity: 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  transform: 'translate(14px, 12px) scale(1)',
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                  },
                },
              }}
            />
          )}
          renderOption={(props, option, index) => {
            const { key, ...otherProps } = props;
            // Get the label string using the same logic as getOptionLabel
            let optionLabel: string;
            if (typeof option === 'string') {
              optionLabel = option;
            } else if (option && typeof option === 'object' && 'name' in option) {
              optionLabel = (option as { name: string }).name;
            } else {
              optionLabel = String(option || '');
            }
            // Use a unique key: combine index with option label to ensure uniqueness
            // This prevents duplicate key warnings when options have the same name
            const uniqueKey = `customer-name-${index}-${optionLabel || 'empty'}`;
            return (
              <li key={uniqueKey} {...otherProps}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {optionLabel}
                  </Typography>
                </Box>
              </li>
            );
          }}
        />
        <Autocomplete
          options={['In Patient', 'Out Patient']}
          value={patientType || 'Out Patient'}
          open={patientTypeOpen}
          onOpen={() => setPatientTypeOpen(true)}
          onClose={() => setPatientTypeOpen(false)}
          onChange={(_, newValue) => {
            if (newValue) {
              onPatientTypeChange(newValue);
            } else {
              onPatientTypeChange('Out Patient');
            }
            setPatientTypeOpen(false);
          }}
          disableClearable
          forcePopupIcon
          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
          sx={{ width: '180px' }}
          slotProps={{
            popper: {
              sx: {
                zIndex: 1300,
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
              zIndex: 1300,
              padding: '0px !important',
              maxHeight: '300px !important',
              minHeight: 'unset !important',
              '& .MuiAutocomplete-option': {
                minHeight: '36px',
                padding: '6px 12px',
                fontSize: '14px',
                '&.Mui-focused': {
                  backgroundColor: '#F3F4F6',
                },
                '&[aria-selected="true"]': {
                  backgroundColor: '#F3F4F6',
                  '&.Mui-focused': {
                    backgroundColor: '#F3F4F6',
                  },
                },
              },
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Patient Type"
              variant="outlined"
              placeholder="Select patient type"
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  '& fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: "'Lexend', sans-serif",
                    opacity: 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  transform: 'translate(14px, 12px) scale(1)',
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                  },
                },
              }}
            />
          )}
        />
      </SectionRow>

      <SectionRow>
        <PhoneNoField
          className="phone-no-field"
          label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
          value={customerMobile}
          onChange={(e) => {
            const newMobile = e.target.value;
            onCustomerMobileChange(newMobile);
            if (selectedCustomer && newMobile !== selectedCustomer.mobile) {
              onCustomerSelect(null);
            }
          }}
          InputProps={{
            endAdornment: customerMobile && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    onCustomerMobileChange('');
                    if (selectedCustomer) onCustomerSelect(null);
                  }}
                  sx={{ padding: '2px', marginRight: '-8px' }}
                >
                  <ClearIcon sx={{ fontSize: '18px', color: '#6B7280' }} />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Autocomplete
          options={cityOptions}
          value={customerCity || undefined}
          defaultValue={undefined}
          isOptionEqualToValue={(option, value) => {
            const optionStr = option || '';
            const valueStr = (value || '');
            return optionStr === valueStr;
          }}
          onChange={(_, newValue) => {
            if (newValue) {
              onCustomerCityChange(newValue);
            } else {
              onCustomerCityChange('');
            }
          }}
          onInputChange={(_, newInputValue) => {
            onCustomerCityChange(newInputValue || '');
          }}
          {...(!customerCity ? { disableClearable: true } : {})}
          forcePopupIcon
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
              padding: "0px !important",
              maxHeight: "300px !important",
              minHeight: "unset !important",
              overflow: "auto",
            },
          }}
          sx={{ width: '165px' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={SALES_RECEIPT_LABELS.CITY_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.CITY_PLACEHOLDER}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  '& fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: "'Lexend', sans-serif",
                    opacity: 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  transform: 'translate(14px, 12px) scale(1)',
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                  },
                },
              }}
            />
          )}
        />
      </SectionRow>
    </CustomerDetailsColumn>
  );
};

export default CustomerDetailsSection;

