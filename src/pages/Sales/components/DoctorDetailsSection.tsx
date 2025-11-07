import React from 'react';
import { Box, Typography, Autocomplete, TextField, CircularProgress } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { DoctorPhoneEmailInfo } from '../../../redux/slices/salesApi';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import {
  DoctorInvoiceColumn,
  SectionRow,
  HospitalIdField,
  CityField,
} from '../SalesReceipt.styles';
// import DropDown from '../../../assets/DropDown.svg'; // Removed for standardization

interface DoctorDetailsSectionProps {
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  selectedDoctor: string | null;
  doctorNames: string[];
  isLoadingDoctorNames?: boolean;
  availableDoctorInfo?: DoctorPhoneEmailInfo[];
  onDoctorSelect: (doctorName: string | null) => void;
  onDoctorNameChange?: (value: string) => void;
  onDoctorMobileChange: (value: string) => void;
  onDoctorEmailChange: (value: string) => void;
}

const DoctorDetailsSection: React.FC<DoctorDetailsSectionProps> = ({
  doctorName,
  doctorMobile,
  doctorEmail,
  selectedDoctor,
  doctorNames,
  isLoadingDoctorNames = false,
  availableDoctorInfo = [],
  onDoctorSelect,
  onDoctorNameChange,
  onDoctorMobileChange,
  onDoctorEmailChange,
}) => {
  // Extract unique phones and emails from availableDoctorInfo
  const availablePhones = Array.from(new Set(availableDoctorInfo.map(info => info.phone))).filter(Boolean);
  const availableEmails = Array.from(new Set(availableDoctorInfo.map(info => info.email))).filter(Boolean);

  // Find matching email when phone is selected
  const handlePhoneChange = (phone: string) => {
    onDoctorMobileChange(phone);
    // Auto-fill email if there's a matching info entry
    const matchingInfo = availableDoctorInfo.find(info => info.phone === phone);
    if (matchingInfo && matchingInfo.email) {
      onDoctorEmailChange(matchingInfo.email);
    }
  };

  // Find matching phone when email is selected
  const handleEmailChange = (email: string) => {
    onDoctorEmailChange(email);
    // Auto-fill phone if there's a matching info entry
    const matchingInfo = availableDoctorInfo.find(info => info.email === email);
    if (matchingInfo && matchingInfo.phone) {
      onDoctorMobileChange(matchingInfo.phone);
    }
  };
  return (
    <DoctorInvoiceColumn>
      <Box sx={{ marginBottom: '8px' }}>
        <Typography sx={{ 
          fontFamily: "'Lexend', sans-serif", 
          fontWeight: 600, 
          fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_SECTION, 
          color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
          marginBottom: '8px'
        }}>
          {SALES_RECEIPT_LABELS.DOCTOR_DETAILS_TITLE}
        </Typography>
      </Box>

      <SectionRow>
        <Autocomplete
          options={doctorNames}
          value={selectedDoctor || null}
          inputValue={doctorName}
          loading={isLoadingDoctorNames}
          onChange={(_, newValue) => {
            onDoctorSelect(newValue);
          }}
          onInputChange={(_, newInputValue) => {
            // Update doctor name when user types (for freeSolo)
            if (onDoctorNameChange) {
              onDoctorNameChange(newInputValue);
            } else {
              onDoctorSelect(newInputValue || null);
            }
          }}
          freeSolo
          forcePopupIcon
          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
          sx={{ width: `${SALES_RECEIPT_CONSTANTS.DOCTOR_NAME_WIDTH}px` }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={SALES_RECEIPT_LABELS.DOCTOR_NAME_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.DOCTOR_NAME_PLACEHOLDER}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isLoadingDoctorNames ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                width: `${SALES_RECEIPT_CONSTANTS.DOCTOR_NAME_WIDTH}px`,
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '12px',
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
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                },
              }}
            />
          )}
        />
      </SectionRow>

      <SectionRow>
        {availablePhones.length > 0 ? (
          <Autocomplete
            freeSolo
            options={availablePhones}
            value={doctorMobile || null}
            isOptionEqualToValue={(option, value) => option === value}
            onChange={(_, newValue) => {
              const phoneValue = typeof newValue === 'string' ? newValue : '';
              handlePhoneChange(phoneValue);
            }}
            onInputChange={(_, newInputValue) => {
              onDoctorMobileChange(newInputValue);
            }}
            disableClearable={!doctorMobile}
            forcePopupIcon
            popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
            sx={{ width: `${SALES_RECEIPT_CONSTANTS.PHONE_FIELD_WIDTH}px` }}
            renderInput={(params) => (
              <HospitalIdField
                {...params}
                label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
                variant="outlined"
                placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
              />
            )}
          />
        ) : (
          <HospitalIdField
            label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
            variant="outlined"
            placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
            value={doctorMobile}
            onChange={(e) => {
              onDoctorMobileChange(e.target.value);
            }}
          />
        )}
        {availableEmails.length > 0 ? (
          <Autocomplete
            freeSolo
            options={availableEmails}
            value={doctorEmail || null}
            isOptionEqualToValue={(option, value) => option === value}
            onChange={(_, newValue) => {
              const emailValue = typeof newValue === 'string' ? newValue : '';
              handleEmailChange(emailValue);
            }}
            onInputChange={(_, newInputValue) => {
              onDoctorEmailChange(newInputValue);
            }}
            disableClearable={!doctorEmail}
            forcePopupIcon
            popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
            sx={{ width: `${SALES_RECEIPT_CONSTANTS.CITY_FIELD_WIDTH}px` }}
            renderInput={(params) => (
              <CityField
                {...params}
                label={SALES_RECEIPT_LABELS.EMAIL_LABEL}
                variant="outlined"
                placeholder={SALES_RECEIPT_LABELS.EMAIL_PLACEHOLDER}
              />
            )}
          />
        ) : (
          <CityField
            label={SALES_RECEIPT_LABELS.EMAIL_LABEL}
            variant="outlined"
            placeholder={SALES_RECEIPT_LABELS.EMAIL_PLACEHOLDER}
            value={doctorEmail}
            onChange={(e) => {
              onDoctorEmailChange(e.target.value);
            }}
          />
        )}
      </SectionRow>
    </DoctorInvoiceColumn>
  );
};

export default DoctorDetailsSection;

