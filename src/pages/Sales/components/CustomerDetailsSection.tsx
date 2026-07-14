import React, { useState, useMemo } from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { StandardButton } from '../../../components/Common';
import { Customer, CustomerOption } from '../../../redux/slices/salesApi';
import { filterRanked, isPhoneQuery } from '../utils/customerSearch';
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
  customerOptions: CustomerOption[]; // { id, name, phone } from /sales/get-customer-options
  availablePhones?: string[]; // Phone numbers from /sales/get-customer-phones/ endpoint
  onCustomerNameChange: (value: string) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerOptionSelect: (option: CustomerOption) => void;
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
  customerOptions,
  availablePhones = [],
  onCustomerNameChange,
  onCustomerSelect,
  onCustomerOptionSelect,
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
    () => customerOptions.filter((o) => /[A-Za-z]/.test(o.name || '')),
    [customerOptions]
  );

  // The concrete option backing the current selection (or null while typing free
  // text) — kept separate from the typed inputValue so MUI filtering stays active.
  const selectedNameOption = useMemo(() => {
    if (!selectedCustomer || selectedCustomer.id <= 0) return null;
    return nameOptions.find((o) => o.id === String(selectedCustomer.id)) ?? null;
  }, [nameOptions, selectedCustomer]);

  // Mobile-field options. Default: the name-scoped phone picker (existing
  // get-customer-phones flow, enriched with ids from the global list). When the
  // user types digits, widen to every customer so the number can be searched
  // globally; one number shared by several customers yields one option each.
  const mobileOptions = useMemo(() => {
    const nameLower = (customerName || '').trim().toLowerCase();
    const scoped: CustomerOption[] = availablePhones.map(
      (phone) =>
        customerOptions.find(
          (o) => (o.name || '').toLowerCase() === nameLower && o.phone === phone
        ) ?? { id: `phone-${phone}`, name: customerName, phone }
    );
    if (isPhoneQuery(customerMobile)) {
      const seen = new Set(scoped.map((o) => o.id));
      return [...scoped, ...customerOptions.filter((o) => o.phone && !seen.has(o.id))];
    }
    return scoped;
  }, [availablePhones, customerOptions, customerName, customerMobile]);

  const selectedMobileOption = useMemo(() => {
    if (!selectedCustomer || selectedCustomer.id <= 0) return null;
    return (
      mobileOptions.find(
        (o) => o.id === String(selectedCustomer.id) && (o.phone ?? '') === customerMobile
      ) ?? null
    );
  }, [mobileOptions, selectedCustomer, customerMobile]);

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
        <Autocomplete<CustomerOption, false, boolean, true>
          freeSolo
          options={nameOptions} // phone-only records filtered out
          // Ranked, case-insensitive filtering: prefix > word-start > substring.
          // A digit query searches by phone instead (mobile-number search).
          filterOptions={(options, state) =>
            filterRanked(options, state.inputValue, {
              getName: (o) => o.name,
              getPhone: (o) => o.phone,
            })
          }
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
          value={selectedNameOption}
          inputValue={customerName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, newValue) => {
            if (newValue && typeof newValue === 'object') {
              // A concrete customer picked from the dropdown — auto-fill name + mobile + id
              onCustomerOptionSelect(newValue);
            } else if (typeof newValue === 'string' && newValue) {
              // freeSolo: Enter pressed on free text — keep it as a new-customer name
              onCustomerNameChange(newValue);
            } else {
              // User cleared the field
              onCustomerNameChange('');
              onCustomerSelect(null);
              onCustomerMobileChange('');
              onCustomerCityChange('');
            }
          }}
          onInputChange={(_, newInputValue, reason) => {
            // Only update when user is typing (not when selecting from dropdown)
            // reason: 'input' = typing, 'reset' = cleared, 'clear' = clear button
            if (reason === 'input') {
              onCustomerNameChange(newInputValue);
              // If user types something different, drop the stale selection and its
              // mobile so the phones hook can auto-fill for the new name
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
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            // Key on the customer id so duplicate names (different customers)
            // render as distinct options
            return (
              <li key={`customer-${option.id}`} {...otherProps}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.name}
                  </Typography>
                  {option.phone && (
                    <Typography variant="caption" sx={{ color: '#728197', display: 'block' }}>
                      {option.phone}
                    </Typography>
                  )}
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
        <Autocomplete<CustomerOption, false, boolean, true>
          freeSolo
          options={mobileOptions}
          value={selectedMobileOption}
          inputValue={customerMobile}
          // Digit queries search phones (prefix > substring) across all customers;
          // an empty query keeps the name-scoped phone picker.
          filterOptions={(options, state) =>
            filterRanked(options, state.inputValue, {
              getName: (o) => o.name,
              getPhone: (o) => o.phone,
            })
          }
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.phone ?? '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, newValue) => {
            if (newValue && typeof newValue === 'object') {
              if (/^\d+$/.test(newValue.id)) {
                // A concrete customer picked by phone — auto-fill name + mobile + id
                onCustomerOptionSelect(newValue);
              } else {
                // Name-scoped phone without a resolved id: set the phone and drop the
                // stale selection so the id is re-resolved from the phone at save.
                onCustomerMobileChange(newValue.phone ?? '');
                if (selectedCustomer && (newValue.phone ?? '') !== selectedCustomer.mobile) {
                  onCustomerSelect(null);
                }
              }
            } else {
              const v = typeof newValue === 'string' ? newValue : '';
              onCustomerMobileChange(v);
              if (selectedCustomer && v !== selectedCustomer.mobile) {
                onCustomerSelect(null);
              }
            }
          }}
          onInputChange={(_, newInputValue, reason) => {
            if (reason === 'input') {
              onCustomerMobileChange(newInputValue);
              if (selectedCustomer && newInputValue !== selectedCustomer.mobile) {
                onCustomerSelect(null);
              }
            }
          }}
          disableClearable={!customerMobile}
          forcePopupIcon={availablePhones.length > 1}
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
            <PhoneNoField
              {...params}
              className="phone-no-field"
              label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            // Key on the option id — several customers can share one phone number
            return (
              <li key={`customer-phone-${option.id}`} {...otherProps}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.phone}
                  </Typography>
                  {option.name && (
                    <Typography variant="caption" sx={{ color: '#728197', display: 'block' }}>
                      {option.name}
                    </Typography>
                  )}
                </Box>
              </li>
            );
          }}
        />
        <Autocomplete<string, false, boolean, false>
          options={cityOptions}
          value={customerCity || null}
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
          disableClearable={!customerCity}
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

