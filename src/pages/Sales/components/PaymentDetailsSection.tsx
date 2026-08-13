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
} from '../SalesReceipt.styles';

// The peeked next invoice number for a NEW sale. Omitted entirely in edit/return mode, where
// the persisted number is authoritative. `number` is '' when the peek failed or was skipped.
export interface ProvisionalInvoiceNumber {
  number: string;
  loading: boolean;
}

interface PaymentDetailsSectionProps {
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  provisionalInvoiceNumber?: ProvisionalInvoiceNumber;
  invoiceDate: string;
  onPaymentModeChange: (value: string) => void;
  onInsuranceCompanyChange: (value: string) => void;
  onInvoiceDateChange: (value: string) => void;

  isReturnDetailsMode?: boolean;
  returnDate?: string;
  onOpenSplitPayment?: () => void;
  hasSplitPayments?: boolean;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({
  paymentMode,
  insuranceCompany,
  invoiceNumber,
  provisionalInvoiceNumber,
  invoiceDate,
  onPaymentModeChange,
  onInsuranceCompanyChange,
  onInvoiceDateChange,
  isReturnDetailsMode = false,
  returnDate,
  onOpenSplitPayment,
  hasSplitPayments = false,
}) => {
  // The invoiceDate STATE is canonical ISO `YYYY-MM-DD`. Build the picker value
  // from it (native ISO parse); the picker only *displays* DD/MM/YYYY.
  const parseInvoiceDate = (dateString: string): Dayjs | null => {
    if (!dateString) return dayjs();
    const strict = dayjs(dateString, 'YYYY-MM-DD', true);
    if (strict.isValid()) return strict;
    // Tolerate any dayjs-parseable legacy value so the field still populates.
    const loose = dayjs(dateString);
    return loose.isValid() ? loose : dayjs();
  };

  // On picker change, store the canonical ISO `YYYY-MM-DD` back into state.
  const formatInvoiceDate = (date: Dayjs | null): string => {
    if (!date || !date.isValid()) return '';
    return date.format('YYYY-MM-DD');
  };

  // Until the sale is saved the number is only a PEEK — a concurrent sale can take it — so
  // it is shown muted/italic inside a dashed field with a "Provisional" caption. Once the
  // server assigns the real number (or in edit mode, where it is already persisted),
  // `invoiceNumber` wins and the field renders as an ordinary saved value.
  const isProvisional = !!provisionalInvoiceNumber && !invoiceNumber;
  const provisionalText = provisionalInvoiceNumber?.loading
    ? SALES_RECEIPT_LABELS.INVOICE_NUMBER_PENDING
    : provisionalInvoiceNumber?.number || SALES_RECEIPT_LABELS.INVOICE_NUMBER_AUTO_FALLBACK;

  const handleDateChange = (newDate: Dayjs | null) => {
    const formattedDate = formatInvoiceDate(newDate);
    onInvoiceDateChange(formattedDate);
  };

  // Format return date for display (convert YYYY-MM-DD to MM/DD/YYYY)
  const formatReturnDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    // Try parsing different date formats
    let parsed = dayjs(dateString, 'YYYY-MM-DD'); // API returns YYYY-MM-DD format
    if (!parsed.isValid()) {
      parsed = dayjs(dateString, 'DD MMM YYYY');
    }
    if (!parsed.isValid()) {
      parsed = dayjs(dateString, 'MM/DD/YYYY');
    }
    if (!parsed.isValid()) {
      parsed = dayjs(dateString);
    }
    return parsed.isValid() ? parsed.format('MM/DD/YYYY') : dateString;
  };

  return (
    <PaymentDetailsContainer>
      <Box sx={{ marginBottom: '8px', }}>
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

      <SectionRow sx={{ gap: '20px', marginBottom: '0px', marginLeft: '-10px' }}>
        <Autocomplete
          options={paymentMethods}
          // paymentMode is always seeded to the explicit default (paymentMethods[0]),
          // so the shown value is exactly what will be saved — no cosmetic fallback.
          value={paymentMode}
          onChange={(_, newValue) => {
            onPaymentModeChange(newValue || paymentMethods[0]);
          }}
          disableClearable
          forcePopupIcon
          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
          sx={{ width: '165px' }}
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
              label=""
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.PAYMENT_MODE_PLACEHOLDER}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  width: '165px',
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
        {/* Read-only: the backend assigns the invoice number inside the save transaction.
            A new sale shows the provisional peek; edit/return modes show the real number.
            NOTE: no `placeholder` here — MUI force-hides it while the label is un-shrunk,
            so the hint has to be the VALUE. */}
        <Box sx={{ width: '200px', marginLeft: '30px', position: 'relative' }}>
          <TextField
            label={SALES_RECEIPT_LABELS.INVOICE_NUMBER_LABEL}
            variant="outlined"
            value={isProvisional ? provisionalText : invoiceNumber}
            disabled
            fullWidth
            // The provisional text is a value, so the label must float off it explicitly
            // (a saved number shrinks the label by itself).
            InputLabelProps={isProvisional ? { shrink: true } : undefined}
            inputProps={{ 'aria-describedby': isProvisional ? 'invoice-number-provisional' : undefined }}
            sx={{
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
                '&.Mui-disabled': {
                  backgroundColor: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    // Dashed only while provisional — reads as "not final yet", and keeps the
                    // normal grey so it never looks like an error or a broken field.
                    border: isProvisional ? '1px dashed #9AA8BC' : '1px solid #9AA8BC',
                  },
                },
              },
              '& .MuiOutlinedInput-input': {
                padding: '12px 16px',
                fontFamily: "'Lexend', sans-serif",
                fontSize: '16px',
                color: isProvisional ? '#728197' : '#1A212B',
                fontStyle: isProvisional ? 'italic' : 'normal',
                '&.Mui-disabled': {
                  WebkitTextFillColor: isProvisional ? '#728197' : '#1A212B',
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
          {isProvisional && (
            <Typography
              id="invoice-number-provisional"
              // Absolutely placed in the 25px gap above the next row, so switching to the
              // saved number never reflows the section.
              sx={{
                position: 'absolute',
                top: '50px',
                // 14px = MUI's outlined helper-text inset, so it lines up with the label.
                left: '14px',
                // Capped to the field so the caption can never poke past its right edge
                // (nowrap text ellipsizes instead of overflowing).
                maxWidth: 'calc(100% - 14px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'Lexend', sans-serif",
                fontSize: '11px',
                lineHeight: '14px',
                color: '#728197',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {SALES_RECEIPT_LABELS.INVOICE_NUMBER_PROVISIONAL_HELPER}
            </Typography>
          )}
        </Box>
      </SectionRow>

      <SectionRow sx={{ gap: '16px', marginTop: '5px', marginLeft: "-10px", position: 'relative' }}>
        {paymentMode === 'Insurance' ? (
          <TextField
            label={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_LABEL}
            variant="outlined"
            placeholder={SALES_RECEIPT_LABELS.INSURANCE_COMPANY_PLACEHOLDER}
            value={insuranceCompany}
            onChange={(e) => onInsuranceCompanyChange(e.target.value)}
            required
            sx={{
              width: '200px',
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
        ) : (
          <TextField
            label={SALES_RECEIPT_LABELS.DETAILS_LABEL}
            variant="outlined"
            placeholder={SALES_RECEIPT_LABELS.DETAILS_PLACEHOLDER}
            value={insuranceCompany}
            onChange={(e) => onInsuranceCompanyChange(e.target.value)}
            sx={{
              width: '200px',
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


        {/* Helper text / Link for Split Payment */}
        {!isReturnDetailsMode && onOpenSplitPayment && (
          <Box
            sx={{
              position: 'absolute',
              top: '52px', // Adjust depending on field height
              left: '0',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Typography
              onClick={onOpenSplitPayment}
              sx={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: '12px',
                color: hasSplitPayments ? '#10B981' : '#5C17E5',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 500,
                '&:hover': {
                  color: hasSplitPayments ? '#059669' : '#4C14C7',
                }
              }}
            >
              {hasSplitPayments ? "Multiple Payments Active (Click to Edit)" : "Multiple Payment"}
            </Typography>
          </Box>
        )}

        <Box sx={{ width: '200px', marginLeft: '6px', marginBottom: '-8px' }}>
          <Box sx={{
            '& .MuiPickersInputBase-root, & .MuiOutlinedInput-root': {
              borderRadius: '12px !important',
              '& fieldset': {
                borderColor: '#9AA8BC !important',
                borderWidth: '1px !important',
                borderRadius: '20px !important',
              },
              '&:hover fieldset': {
                borderColor: '#9AA8BC !important',
                borderWidth: '1px !important',
                borderRadius: '20px !important',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#5C17E5 !important',
                borderWidth: '1px !important',
                borderRadius: '20px !important',
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
            },
          }}>
            <PharmaDatePicker
              value={parseInvoiceDate(invoiceDate)}
              onChange={handleDateChange}
              label={SALES_RECEIPT_LABELS.INVOICE_DATE_LABEL}
              placeholder="DD/MM/YYYY"
              width="200px"
              height="48px"
            />
          </Box>
        </Box>
      </SectionRow>

      {/* Return Date Field - Only shown in return details mode, under Details and Invoice date */}
      {isReturnDetailsMode && (
        <SectionRow sx={{ gap: '16px', marginTop: '5px', marginLeft: '-10px' }}>
          <TextField
            label="Return date"
            variant="outlined"
            value={formatReturnDate(returnDate)}
            disabled
            sx={{
              width: '200px',
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
                '&.Mui-disabled': {
                  backgroundColor: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #9AA8BC',
                  },
                },
              },
              '& .MuiOutlinedInput-input': {
                padding: '12px 16px',
                fontFamily: "'Lexend', sans-serif",
                fontSize: '16px',
                color: '#1A212B',
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
      )}
    </PaymentDetailsContainer>
  );
};

export default PaymentDetailsSection;

