import React from 'react';
import { Box, Typography, Autocomplete } from '@mui/material';
import { Doctor } from '../../../redux/slices/salesApi';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import {
  DoctorInvoiceColumn,
  SectionRow,
  DoctorNameField,
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
      <Typography sx={{ 
        fontFamily: "'Lexend', sans-serif", 
        fontWeight: 600, 
        fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_SECTION, 
        color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
        marginBottom: '8px'
      }}>
        {SALES_RECEIPT_LABELS.DOCTOR_DETAILS_TITLE}
      </Typography>

      <SectionRow>
        <Autocomplete
          options={mockDoctors}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
          value={selectedDoctor}
          onChange={(_, newValue) => {
            onDoctorSelect(newValue);
          }}
          // Use standard Material-UI dropdown arrow (default behavior)
          sx={{ width: `${SALES_RECEIPT_CONSTANTS.DOCTOR_NAME_WIDTH}px` }}
          renderInput={(params) => (
            <DoctorNameField
              {...params}
              label={SALES_RECEIPT_LABELS.DOCTOR_NAME_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.DOCTOR_NAME_PLACEHOLDER}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#728197' }}>
                  {option.specialization} • {option.mobile}
                </Typography>
              </Box>
            </li>
          )}
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

