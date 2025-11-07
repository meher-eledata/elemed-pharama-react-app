import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Doctor } from '../../../redux/slices/salesApi';
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
  selectedDoctor: Doctor | null;
  mockDoctors: Doctor[];
  onDoctorSelect: (doctor: Doctor | null) => void;
  onDoctorMobileChange: (value: string) => void;
  onDoctorEmailChange: (value: string) => void;
}

const DoctorDetailsSection: React.FC<DoctorDetailsSectionProps> = ({
  doctorName,
  doctorMobile,
  doctorEmail,
  selectedDoctor,
  mockDoctors,
  onDoctorSelect,
  onDoctorMobileChange,
  onDoctorEmailChange,
}) => {
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
          options={mockDoctors}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
          value={selectedDoctor || null}
          isOptionEqualToValue={(option, value) => {
            if (!value || !option) return false;
            if (typeof option === 'string' || typeof value === 'string') return false;
            return option.id === value.id;
          }}
          onChange={(_, newValue) => {
            onDoctorSelect(newValue);
          }}
          forcePopupIcon
          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
          sx={{ width: `${SALES_RECEIPT_CONSTANTS.DOCTOR_NAME_WIDTH}px` }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={SALES_RECEIPT_LABELS.DOCTOR_NAME_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.DOCTOR_NAME_PLACEHOLDER}
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
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <li key={key} {...otherProps}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#728197' }}>
                    {option.specialization} • {option.mobile}
                  </Typography>
                </Box>
              </li>
            );
          }}
        />
      </SectionRow>

      <SectionRow>
        <HospitalIdField
          label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
          value={doctorMobile}
          onChange={(e) => {
            onDoctorMobileChange(e.target.value);
            // If user manually edits, clear selected doctor
            if (selectedDoctor) onDoctorSelect(null);
          }}
        />
        <CityField
          label={SALES_RECEIPT_LABELS.EMAIL_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.EMAIL_PLACEHOLDER}
          value={doctorEmail}
          onChange={(e) => {
            onDoctorEmailChange(e.target.value);
            // If user manually edits, clear selected doctor
            if (selectedDoctor) onDoctorSelect(null);
          }}
        />
      </SectionRow>
    </DoctorInvoiceColumn>
  );
};

export default DoctorDetailsSection;

