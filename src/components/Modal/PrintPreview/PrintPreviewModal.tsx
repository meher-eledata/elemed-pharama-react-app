import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { StandardButton } from '../../Common';
import html2pdf from 'html2pdf.js';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SalesReceiptItem } from '../../../pages/Sales/SalesReceipt.types';

interface PrintPreviewModalProps {
  salesItems: SalesReceiptItem[];
  customerName: string;
  customerMobile: string;
  customerCity: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalValue: string;
  totalDiscount: string;
  taxAmount: string;
  totalPayableAmount: string;
  onCancel: () => void;
  onPrint: () => void;
  onSaveClick?: () => void; // Handler for Save button click
  onAfterSave?: () => void; // Optional callback after successful save
  hideActionButtons?: boolean; // Hide the action buttons (for view-only mode)
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  salesItems,
  customerName,
  customerMobile,
  customerCity,
  doctorName,
  doctorMobile,
  doctorEmail,
  paymentMode,
  insuranceCompany,
  invoiceNumber,
  invoiceDate,
  totalValue,
  totalDiscount,
  taxAmount,
  totalPayableAmount,
  onCancel,
  onPrint,
  onSaveClick,
  onAfterSave,
  hideActionButtons = false,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  const handleSaveAsPDF = async () => {
    if (!printContentRef.current) return;

    try {
      const filename = `sales-receipt-${invoiceNumber || Date.now()}.pdf`;

      const options = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const
        }
      };

      await html2pdf().set(options).from(printContentRef.current).save();
      if (onAfterSave) {
        setTimeout(() => {
          onAfterSave();
        }, 500);
      }
    } catch (error) {
    }
  };

  return (
    <Box sx={{ padding: '0', maxHeight: '100%', overflow: 'auto' }}>
      {/* Print Preview Content */}
      <Box ref={printContentRef} sx={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        fontFamily: "'Lexend', sans-serif",
        maxWidth: '481px',
        margin: '0 auto'
      }}>
        {/* Receipt Header */}
        <Box sx={{ textAlign: 'left', marginBottom: '24px' }}>
          <Typography sx={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#1A212B',
            marginBottom: '0'
          }}>
            {SALES_RECEIPT_LABELS.CUSTOMER_RECEIPT_TITLE}
          </Typography>
        </Box>

        {/* Four Section Layout - 2x2 Grid */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {/* First Row: Customer Details and Doctor Details */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
            width: '100%'
          }}>
            {/* Customer Details */}
            <Box sx={{
              flex: 1,
              minWidth: '180px',
              backgroundColor: '#F9FAFB',
              padding: '12px 8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', marginBottom: '12px' }}>
                {SALES_RECEIPT_LABELS.CUSTOMER_DETAILS_TITLE}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.CUSTOMER_NAME_PRINT.replace('{name}', (customerName || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.MOBILE_NUMBER_PRINT.replace('{mobile}', (customerMobile || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.CITY_PRINT.replace('{city}', (customerCity || '').trim())}
              </Typography>
            </Box>

            {/* Doctor Details */}
            <Box sx={{
              flex: 1,
              minWidth: '180px',
              backgroundColor: '#F9FAFB',
              padding: '12px 8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', marginBottom: '12px' }}>
                {SALES_RECEIPT_LABELS.DOCTOR_DETAILS_TITLE}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.DOCTOR_NAME_PRINT.replace('{name}', (doctorName || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.MOBILE_NUMBER_PRINT.replace('{mobile}', (doctorMobile || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: '10px', color: '#374151', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.EMAIL_PRINT.replace('{email}', (doctorEmail || '').trim())}
              </Typography>
            </Box>
          </Box>

          {/* Second Row: Payment Details and Invoice Details */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
            width: '100%'
          }}>
            {/* Payment Details */}
            <Box sx={{
              flex: 1,
              minWidth: '180px',
              backgroundColor: '#F9FAFB',
              padding: '12px 8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', marginBottom: '12px' }}>
                {SALES_RECEIPT_LABELS.PAYMENT_DETAILS_TITLE}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.PAYMENT_MODE_PRINT.replace('{mode}', paymentMode && paymentMode.trim() ? paymentMode.trim() : 'Not specified')}
              </Typography>
              {paymentMode === 'Insurance' && insuranceCompany && insuranceCompany.trim() ? (
                <Typography sx={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>
                  {SALES_RECEIPT_LABELS.INSURANCE_PRINT.replace('{company}', insuranceCompany.trim())}
                </Typography>
              ) : paymentMode !== 'Insurance' && insuranceCompany && insuranceCompany.trim() ? (
                <Typography sx={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>
                  {SALES_RECEIPT_LABELS.DETAILS_PRINT.replace('{details}', insuranceCompany.trim())}
                </Typography>
              ) : null}
            </Box>

            {/* Invoice Details */}
            <Box sx={{
              flex: 1,
              minWidth: '180px',
              backgroundColor: '#F9FAFB',
              padding: '12px 8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', marginBottom: '12px' }}>
                {SALES_RECEIPT_LABELS.INVOICE_DETAILS_TITLE}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.INVOICE_NUMBER_PRINT.replace('{number}', (invoiceNumber || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>
                {SALES_RECEIPT_LABELS.INVOICE_DATE_PRINT.replace('{date}', (invoiceDate || '').trim())}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Items Table with Scroll */}
        <Box sx={{ marginBottom: '24px' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1A212B', marginBottom: '16px' }}>
            {SALES_RECEIPT_LABELS.ITEMS_SECTION_TITLE}
          </Typography>
          <Box sx={{
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Fixed Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 0.7fr 0.7fr 0.9fr 0.9fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr',
              columnGap: '8px',
              backgroundColor: '#F9FAFB',
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1A212B',
              flexShrink: 0,
              borderBottom: '2px solid #E5E7EB',
              minHeight: '44px',
              alignItems: 'center'
            }}>
              <Box>Product</Box>
              <Box>Qty</Box>
              <Box>Type</Box>
              <Box>Batch</Box>
              <Box>Price</Box>
              <Box>Disc</Box>
              <Box>CGST</Box>
              <Box>SGST</Box>
              <Box>IGST</Box>
              <Box>Amt</Box>
            </Box>
            {/* Scrollable Products List */}
            <Box sx={{
              overflowY: 'auto',
              maxHeight: salesItems && salesItems.length > 0 ? '300px' : 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#5C17E5',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#4C14C7',
                },
              },
            }}>
              {salesItems && salesItems.length > 0 ? (
                salesItems.map((item, index) => (
                  <Box key={item.id} sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.7fr 0.7fr 0.9fr 0.9fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr',
                    columnGap: '8px',
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: '#374151',
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                    borderTop: '1px solid #E5E7EB',
                    minHeight: '44px',
                    alignItems: 'center',
                    wordBreak: 'break-word'
                  }}>
                    <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</Box>
                    <Box>{item.quantity}</Box>
                    <Box>{item.type}</Box>
                    <Box>{item.batch}</Box>
                    <Box>{item.unitPrice}</Box>
                    <Box>{item.discountPercent}%</Box>
                    <Box>{item.cgstPercent}%</Box>
                    <Box>{item.sgstPercent}%</Box>
                    <Box>{item.igstPercent}%</Box>
                    <Box sx={{ fontWeight: 600 }}>{item.amount}</Box>
                  </Box>
                ))
              ) : (
                <Box sx={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#9CA3AF',
                  fontSize: '13px'
                }}>
                  No items added
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Summary */}
        <Box sx={{
          backgroundColor: '#F9FAFB',
          padding: '20px 24px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ display: 'flex', gap: '60px', fontSize: '13px', color: '#1A212B' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: '12px', color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TOTAL_VALUE_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: '14px' }}>{totalValue}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: '12px', color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TOTAL_DISCOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: '14px' }}>{totalDiscount}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: '12px', color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TAX_AMOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: '14px' }}>{taxAmount}</Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <Box sx={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              {SALES_RECEIPT_LABELS.TOTAL_PAYABLE_LABEL}
            </Box>
            <Box sx={{ fontSize: '20px', fontWeight: 700, color: '#1A212B' }}>
              {totalPayableAmount}
            </Box>
          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default PrintPreviewModal;

