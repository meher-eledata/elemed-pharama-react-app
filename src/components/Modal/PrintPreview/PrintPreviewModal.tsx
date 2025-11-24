import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { StandardButton } from '../../Common';
import html2pdf from 'html2pdf.js';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';

interface SalesReceiptItem {
  id: string;
  productName: string;
  batch: string;
  quantity: string;
  type: string;
  unitPrice: string;
  discountPercent: string;
  cgstPercent: string;
  sgstPercent: string;
  igstPercent: string;
  amount: string;
}

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
        padding: '20px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        margin: '10px',
        fontFamily: "'Lexend', sans-serif"
      }}>
        {/* Receipt Header */}
        <Box sx={{ textAlign: 'left', marginBottom: '20px' }}>
          <Typography sx={{ 
            fontSize: '28px', 
            fontWeight: 600, 
            color: '#1A212B',
            marginBottom: '20px'
          }}>
            {SALES_RECEIPT_LABELS.CUSTOMER_RECEIPT_TITLE}
          </Typography>
        </Box>

        {/* Four Section Layout */}
        <Box sx={{ 
          display: 'flex', 
          gap: '0px', 
          marginBottom: '20px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'visible',
          flexWrap: 'nowrap'
        }}>
          {/* Customer Details */}
          <Box sx={{ 
            flex: 1, 
            minWidth: '180px',
            backgroundColor: '#F9FAFB', 
            padding: '12px 8px',
            borderRight: '2px solid #9CA3AF'
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
            borderRight: '2px solid #9CA3AF'
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

          {/* Payment Details */}
          <Box sx={{ 
            flex: 1, 
            minWidth: '180px',
            backgroundColor: '#F9FAFB', 
            padding: '12px 8px',
            borderRight: '2px solid #9CA3AF'
          }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', marginBottom: '12px' }}>
              {SALES_RECEIPT_LABELS.PAYMENT_DETAILS_TITLE}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
              {SALES_RECEIPT_LABELS.PAYMENT_MODE_PRINT.replace('{mode}', (paymentMode || '').trim())}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>
              {SALES_RECEIPT_LABELS.INSURANCE_PRINT.replace('{company}', (insuranceCompany || '').trim())}
            </Typography>
          </Box>

          {/* Invoice Details */}
          <Box sx={{ 
            flex: 1, 
            minWidth: '180px',
            backgroundColor: '#F9FAFB', 
            padding: '12px 8px'
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

        {/* Items Table with Scroll */}
        <Box sx={{ marginBottom: '20px' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', marginBottom: '12px' }}>
            {SALES_RECEIPT_LABELS.ITEMS_SECTION_TITLE}
          </Typography>
          <Box sx={{ 
            border: '2px solid #A5B4FC', 
            borderRadius: '8px', 
            overflow: 'hidden',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Fixed Header */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 0.8fr 0.8fr 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr',
              columnGap: '12px',
              backgroundColor: '#C7D2FE',
              padding: '14px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1A212B',
              flexShrink: 0
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
              maxHeight: '400px',
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
              {salesItems.map((item, index) => (
                <Box key={item.id} sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr',
                  columnGap: '12px',
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                  borderTop: index > 0 ? '1px solid #E5E7EB' : 'none'
                }}>
                  <Box>{item.productName}</Box>
                  <Box>{item.quantity}</Box>
                  <Box>{item.type}</Box>
                  <Box>{item.batch}</Box>
                  <Box>{item.unitPrice}</Box>
                  <Box>{item.discountPercent}%</Box>
                  <Box>{item.cgstPercent}%</Box>
                  <Box>{item.sgstPercent}%</Box>
                  <Box>{item.igstPercent}%</Box>
                  <Box>{item.amount}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Summary */}
        <Box sx={{ 
          backgroundColor: '#C7D2FE', 
          padding: '16px', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', gap: '60px', fontSize: '12px', color: '#1A212B' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Box sx={{ fontWeight: 500 }}>{SALES_RECEIPT_LABELS.TOTAL_VALUE_LABEL}</Box>
              <Box sx={{ fontWeight: 700 }}>{totalValue}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Box sx={{ fontWeight: 500 }}>{SALES_RECEIPT_LABELS.TOTAL_DISCOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700 }}>{totalDiscount}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Box sx={{ fontWeight: 500 }}>{SALES_RECEIPT_LABELS.TAX_AMOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700 }}>{taxAmount}</Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
            <Box sx={{ fontSize: '14px', fontWeight: 500, color: '#1A212B' }}>
              {SALES_RECEIPT_LABELS.TOTAL_PAYABLE_LABEL}
            </Box>
            <Box sx={{ fontSize: '18px', fontWeight: 700, color: '#1A212B' }}>
              {totalPayableAmount}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Action Buttons - Hidden when view-only mode */}
      {!hideActionButtons && (
        <Box sx={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end', 
          padding: '8px 24px' // Match DialogActions padding for alignment with Close button
        }}>
          <StandardButton
            onClick={onCancel}
            variant="secondary"
            size="medium"
          >
            {SALES_RECEIPT_LABELS.CANCEL_BUTTON}
          </StandardButton>
          <StandardButton
            onClick={onSaveClick || handleSaveAsPDF}
            variant="outline"
            size="medium"
          >
            {SALES_RECEIPT_LABELS.SAVE_BUTTON}
          </StandardButton>
          <StandardButton
            onClick={onPrint}
            variant="primary"
            size="medium"
          >
            {SALES_RECEIPT_LABELS.PRINT_BUTTON}
          </StandardButton>
        </Box>
      )}
    </Box>
  );
};

export default PrintPreviewModal;

