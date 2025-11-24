import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import dayjs, { Dayjs } from 'dayjs';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import { paymentMethods } from '../../../config/constants/OrderDetail.constants';
import PharmaDatePicker from '../../../components/Common/PharmaDatePicker';
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
  onInvoiceNumberChange: (value: string) => void;
  onInvoiceDateChange: (value: string) => void;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({
  paymentMode,
  insuranceCompany,
  invoiceNumber,
  invoiceDate,
  onPaymentModeChange,
  onInsuranceCompanyChange,
  onInvoiceNumberChange,
  onInvoiceDateChange,
}) => {
  // Convert invoice date string to Dayjs for the date picker
  // Try multiple formats: "24 Nov 2025", "11/24/2025", "MM/DD/YYYY"
  const parseInvoiceDate = (dateString: string): Dayjs | null => {
    if (!dateString) return dayjs();
    // Try parsing different date formats
    let parsed = dayjs(dateString, 'DD MMM YYYY');
    if (!parsed.isValid()) {
      parsed = dayjs(dateString, 'MM/DD/YYYY');
    }
    if (!parsed.isValid()) {
      parsed = dayjs(dateString);
    }
    return parsed.isValid() ? parsed : dayjs();
  };

  // Convert Dayjs to formatted string - use MM/DD/YYYY format
  const formatInvoiceDate = (date: Dayjs | null): string => {
    if (!date) return '';
    return date.format('MM/DD/YYYY');
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    const formattedDate = formatInvoiceDate(newDate);
    onInvoiceDateChange(formattedDate);
  };

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

      <SectionRow sx={{ gap: '20px', marginBottom: '0px' }}>
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
                  width:'165px',
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
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                },
              }}
            />
          )}
        />
        <TextField
          label={SALES_RECEIPT_LABELS.INVOICE_NUMBER_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.INVOICE_NUMBER_LABEL}
          value={invoiceNumber}
          onChange={(e) => onInvoiceNumberChange(e.target.value)}
          sx={{
            width: '200px',
            marginLeft: '30px',
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
      </SectionRow>

      <SectionRow sx={{ gap: '16px', marginTop: '-15px' }}>
        <TextField
          label={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_PLACEHOLDER}
          value={insuranceCompany}
          onChange={(e) => onInsuranceCompanyChange(e.target.value)}
          sx={{
            width: '165px',
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
              textAlign: 'center',
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
        <Box sx={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '30px' }}>
          <Typography sx={{ 
            fontFamily: "'Lexend', sans-serif", 
            fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_LABEL, 
            fontWeight: 500, 
            color: SALES_RECEIPT_CONSTANTS.TEXT_SECONDARY 
          }}>
            {SALES_RECEIPT_LABELS.INVOICE_DATE_LABEL}
          </Typography>
          <Box sx={{
            '& .MuiPickersInputBase-root, & .MuiOutlinedInput-root': {
              borderRadius: '8px !important',
              '& fieldset': {
                borderColor: '#9AA8BC !important',
                borderWidth: '1px !important',
                borderRadius: '8px !important',
              },
              '&:hover fieldset': {
                borderColor: '#9AA8BC !important',
                borderWidth: '1px !important',
                borderRadius: '8px !important',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#5C17E5 !important',
                borderWidth: '1px !important',
                borderRadius: '8px !important',
              },
            },
          }}>
            <PharmaDatePicker
              value={parseInvoiceDate(invoiceDate)}
              onChange={handleDateChange}
              placeholder="MM/DD/YYYY"
              width="200px"
              height="48px"
            />
          </Box>
        </Box>
      </SectionRow>
    </PaymentDetailsContainer>
  );
};

export default PaymentDetailsSection;

