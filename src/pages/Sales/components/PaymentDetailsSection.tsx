import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import { paymentMethods } from '../../../config/constants/OrderDetail.constants';
import {
  PaymentDetailsContainer,
  SectionRow,
  PaymentField,
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
      <Box sx={{ marginBottom: '8px' }}>
        <Typography sx={{ 
          fontFamily: "'Lexend', sans-serif", 
          fontWeight: 600, 
          fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_SECTION, 
          color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
          marginBottom: '8px'
        }}>
          {SALES_RECEIPT_LABELS.PAYMENT_DETAILS_TITLE}
        </Typography>
      </Box>

      <SectionRow>
        <Autocomplete
          options={paymentMethods}
          value={paymentMode || (paymentMethods.length > 0 ? paymentMethods[0] : '')}
          onChange={(_, newValue) => {
            if (newValue) {
              onPaymentModeChange(newValue);
            } else {
              onPaymentModeChange(paymentMethods.length > 0 ? paymentMethods[0] : '');
            }
          }}
          disableClearable
          forcePopupIcon
          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
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

      <SectionRow>
        <TextField
          label={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_PLACEHOLDER}
          value={insuranceCompany}
          onChange={(e) => onInsuranceCompanyChange(e.target.value)}
          sx={{
            width: '275px',
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

