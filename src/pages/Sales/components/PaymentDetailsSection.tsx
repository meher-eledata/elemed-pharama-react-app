import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import { paymentMethods } from '../../../config/constants/OrderDetail.constants';
import {
  PaymentDetailsContainer,
  SectionRow,
  PaymentField,
  InsuranceField,
} from '../SalesReceipt.styles';

interface PaymentDetailsSectionProps {
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  onPaymentModeChange: (value: string) => void;
  onInsuranceCompanyChange: (value: string) => void;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({
  paymentMode,
  insuranceCompany,
  invoiceNumber,
  invoiceDate,
  onPaymentModeChange,
  onInsuranceCompanyChange,
}) => {
  return (
    <PaymentDetailsContainer>
      <Typography sx={{ 
        fontFamily: "'Lexend', sans-serif", 
        fontWeight: 600, 
        fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_SECTION, 
        color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
        marginBottom: '8px'
      }}>
        {SALES_RECEIPT_LABELS.PAYMENT_DETAILS_TITLE}
      </Typography>

      <SectionRow>
        <Autocomplete
          options={paymentMethods}
          value={paymentMode}
          onChange={(_, newValue) => {
            if (newValue) {
              onPaymentModeChange(newValue);
            }
          }}
          disableClearable
          sx={{ width: '165px' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label=""
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.PAYMENT_MODE_PLACEHOLDER}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  width:'275px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  '& fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9AA8BC',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#1A212B',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: "'Lexend', sans-serif",
                    opacity: 1,
                    fontWeight: 400,
                  },
                },
              }}
            />
          )}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Typography sx={{ 
            fontFamily: "'Lexend', sans-serif", 
            fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_LABEL, 
            fontWeight: 500, 
            marginLeft:"110px",
            color: SALES_RECEIPT_CONSTANTS.TEXT_SECONDARY 
          }}>
            {SALES_RECEIPT_LABELS.INVOICE_NUMBER_LABEL}
          </Typography>
          <Typography sx={{ 
            fontFamily: "'Lexend', sans-serif", 
            fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_TEXT, 
            fontWeight: 400, 
            marginLeft:"110px",
            color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY 
          }}>
            {invoiceNumber}
          </Typography>
        </Box>
      </SectionRow>
      
      <SectionRow sx={{ marginTop: '9px' }}>
        <InsuranceField
          label={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_PLACEHOLDER}
          value={insuranceCompany}
          onChange={(e) => onInsuranceCompanyChange(e.target.value)}
          InputProps={{}}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Typography sx={{ 
            fontFamily: "'Lexend', sans-serif", 
            fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_LABEL, 
            fontWeight: 500, 
            color: SALES_RECEIPT_CONSTANTS.TEXT_SECONDARY 
          }}>
            {SALES_RECEIPT_LABELS.INVOICE_DATE_LABEL}
          </Typography>
          <Typography sx={{ 
            fontFamily: "'Lexend', sans-serif", 
            fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_TEXT, 
            fontWeight: 400, 
            color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY 
          }}>
            {invoiceDate}
          </Typography>
        </Box>
      </SectionRow>
    </PaymentDetailsContainer>
  );
};

export default PaymentDetailsSection;

