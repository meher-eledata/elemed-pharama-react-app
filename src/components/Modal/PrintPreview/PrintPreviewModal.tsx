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
  patientType?: string;
  onCancel: () => void;
  onPrint: () => void;
  onSaveClick?: () => void; // Handler for Save button click
  onAfterSave?: () => void; // Optional callback after successful save
  hideActionButtons?: boolean; // Hide the action buttons (for view-only mode)
  brandIcon?: string;
  pageSize?: 'a4' | 'a5';
  splitPayments?: any[];
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
  patientType,
  onCancel,
  onPrint,
  onSaveClick,
  onAfterSave,
  hideActionButtons = false,
  pageSize = 'a4',
  brandIcon,
  splitPayments = [],
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);
  const isA5 = pageSize === 'a5';

  // Adaptive styles based on page size
  const containerMaxWidth = isA5 ? '481px' : '794px'; // A5 vs A4 width (approx at 96dpi)
  const containerPadding = isA5 ? '16px' : '24px';
  const headerFontSize = isA5 ? '20px' : '24px';
  const sectionGap = isA5 ? '8px' : '12px';
  const sectionTitleSize = isA5 ? '12px' : '14px';
  const sectionTextSize = isA5 ? '10px' : '11px';
  const tableHeaderSize = isA5 ? '10px' : '12px';
  const tableRowSize = isA5 ? '10px' : '12px';
  const summaryLabelSize = isA5 ? '11px' : '12px';
  const summaryValueSize = isA5 ? '12px' : '14px';
  const summaryBigValueSize = isA5 ? '16px' : '20px';

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
        padding: containerPadding,
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        fontFamily: "'Lexend', sans-serif",
        maxWidth: containerMaxWidth,
        margin: '0 auto'
      }}>
        {/* Branded Receipt Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: isA5 ? 'center' : 'space-between',
          alignItems: 'center',
          marginBottom: isA5 ? '8px' : '12px',
          paddingBottom: '6px',
          borderBottom: '2px solid #1A212B',
          gap: isA5 ? '20px' : 0
        }}>
          <Box sx={{ flex: isA5 ? 'none' : 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            {brandIcon && (
              <Box
                component="img"
                src={brandIcon}
                sx={{
                  width: isA5 ? '70px' : '90px',
                  height: 'auto',
                  marginTop: isA5 ? 0 : '-15px',
                  marginLeft: isA5 ? 0 : '-10px'
                }}
                alt="Logo"
              />
            )}
          </Box>
          <Box sx={{ flex: isA5 ? 'none' : 3, textAlign: isA5 ? 'left' : 'center' }}>
            <Typography sx={{ fontSize: isA5 ? '16px' : '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.1 }}>
              ELITE PHARMACY
            </Typography>
            <Typography sx={{ fontSize: isA5 ? '8px' : '9px', fontWeight: 500, margin: '2px 0', color: '#374151' }}>
              (SKE SUSRUTA INSTITUTE OF MEDICAL SCIENCES PVT LTD)
            </Typography>
            <Typography sx={{ fontSize: isA5 ? '7px' : '8px', margin: '4px 0', lineHeight: 1.2, color: '#4B5563' }}>
              PLOT NO:14A, HEALTH CITY, CHINAGADHILI, 530040<br />
              DL No: FORM 20:AP/03/01/2015-124907, FORM 21:AP/03/01/2015-124908<br />
              GSTIN No: 37AAQCS3213C2ZH<br />
              (M): 0891-2554040, 8096655050
            </Typography>
            {/* <Typography sx={{ fontSize: isA5 ? '8px' : '10px', fontWeight: 600, color: '#666', marginTop: '2px' }}>
              {SALES_RECEIPT_LABELS.CUSTOMER_RECEIPT_TITLE}
            </Typography> */}
          </Box>
          {!isA5 && <Box sx={{ flex: 1, textAlign: 'right' }}></Box>}
        </Box>

        {/* Four Section Layout - 1 Row */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: sectionGap,
          marginBottom: isA5 ? '8px' : '12px',
          width: '100%'
        }}>
            {/* Customer Details */}
            <Box sx={{
              flex: 1,
              backgroundColor: '#F9FAFB',
              padding: isA5 ? '6px' : '8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}>
              <Typography sx={{ fontSize: sectionTitleSize, fontWeight: 600, color: '#1A212B', marginBottom: '4px' }}>
                {SALES_RECEIPT_LABELS.CUSTOMER_DETAILS_TITLE}
              </Typography>
              <Typography sx={{ fontSize: sectionTextSize, color: '#374151', marginBottom: '2px', lineHeight: 1.2 }}>
                {SALES_RECEIPT_LABELS.CUSTOMER_NAME_PRINT.replace('{name}', (customerName || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: sectionTextSize, color: '#374151', lineHeight: 1.2 }}>
                {SALES_RECEIPT_LABELS.MOBILE_NUMBER_PRINT.replace('{mobile}', (customerMobile || '').trim())}
              </Typography>
            </Box>

            {/* Doctor Details */}
            <Box sx={{
              flex: 1,
              backgroundColor: '#F9FAFB',
              padding: isA5 ? '6px' : '8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}>
              <Typography sx={{ fontSize: sectionTitleSize, fontWeight: 600, color: '#1A212B', marginBottom: '4px' }}>
                {SALES_RECEIPT_LABELS.DOCTOR_DETAILS_TITLE}
              </Typography>
              <Typography sx={{ fontSize: sectionTextSize, color: '#374151', marginBottom: '2px', lineHeight: 1.2 }}>
                {SALES_RECEIPT_LABELS.DOCTOR_NAME_PRINT.replace('{name}', (doctorName || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: sectionTextSize, color: '#374151', lineHeight: 1.2 }}>
                {SALES_RECEIPT_LABELS.MOBILE_NUMBER_PRINT.replace('{mobile}', (doctorMobile || '').trim())}
              </Typography>
            </Box>

            {/* Payment Details */}
            <Box sx={{
              flex: 1,
              backgroundColor: '#F9FAFB',
              padding: isA5 ? '6px' : '8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}>
              <Typography sx={{ fontSize: sectionTitleSize, fontWeight: 600, color: '#1A212B', marginBottom: '4px' }}>
                {SALES_RECEIPT_LABELS.PAYMENT_DETAILS_TITLE}
              </Typography>
              
              {splitPayments && splitPayments.length > 0 ? (
                <Box>
                  {splitPayments.map((p: any, idx: number) => {
                    const method = p.payment_method || p.paymentMethod || p.mode || p.payment_type || 'Payment';
                    const amount = p.payment_amount || p.amount || '0';
                    return (
                      <Typography key={idx} sx={{ fontSize: sectionTextSize, color: '#374151', marginBottom: '2px', lineHeight: 1.2 }}>
                        {method.toUpperCase()}: {amount}
                      </Typography>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ fontSize: sectionTextSize, color: '#374151', marginBottom: '2px', lineHeight: 1.2 }}>
                  {SALES_RECEIPT_LABELS.PAYMENT_MODE_PRINT.replace('{mode}', paymentMode && paymentMode.trim() ? paymentMode.trim() : 'Not specified')}
                </Typography>
              )}

              {paymentMode === 'Insurance' && insuranceCompany && insuranceCompany.trim() ? (
                <Typography sx={{ fontSize: sectionTextSize, color: '#374151', lineHeight: 1.2 }}>
                  {SALES_RECEIPT_LABELS.INSURANCE_PRINT.replace('{company}', insuranceCompany.trim())}
                </Typography>
              ) : paymentMode !== 'Insurance' && insuranceCompany && insuranceCompany.trim() ? (
                <Typography sx={{ fontSize: sectionTextSize, color: '#374151', lineHeight: 1.2 }}>
                  {SALES_RECEIPT_LABELS.DETAILS_PRINT.replace('{details}', insuranceCompany.trim())}
                </Typography>
              ) : null}
            </Box>

            {/* Invoice Details */}
            <Box sx={{
              flex: 1,
              backgroundColor: '#F9FAFB',
              padding: isA5 ? '6px' : '8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}>
              <Typography sx={{ fontSize: sectionTitleSize, fontWeight: 600, color: '#1A212B', marginBottom: '4px' }}>
                {SALES_RECEIPT_LABELS.INVOICE_DETAILS_TITLE}
              </Typography>
              <Typography sx={{ fontSize: sectionTextSize, color: '#374151', marginBottom: '2px', lineHeight: 1.2 }}>
                {SALES_RECEIPT_LABELS.INVOICE_NUMBER_PRINT.replace('{number}', (invoiceNumber || '').trim())}
              </Typography>
              <Typography sx={{ fontSize: sectionTextSize, color: '#374151', lineHeight: 1.2 }}>
                {SALES_RECEIPT_LABELS.INVOICE_DATE_PRINT.replace('{date}', (invoiceDate || '').trim())}
              </Typography>
            </Box>
        </Box>

        {/* Items Table with Scroll */}
        <Box sx={{ marginBottom: 0 }}>
          <Typography sx={{ fontSize: isA5 ? '12px' : '14px', fontWeight: 600, color: '#1A212B', marginBottom: isA5 ? '4px' : '8px' }}>
            {SALES_RECEIPT_LABELS.ITEMS_SECTION_TITLE}
          </Typography>
          <Box sx={{
            border: '1px solid #E5E7EB',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Fixed Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 0.7fr 0.7fr 0.9fr 0.9fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr',
              columnGap: '8px',
              backgroundColor: '#F9FAFB',
              padding: isA5 ? '4px 8px' : '6px 12px',
              fontSize: tableHeaderSize,
              fontWeight: 600,
              color: '#1A212B',
              flexShrink: 0,
              borderBottom: '2px solid #E5E7EB',
              minHeight: isA5 ? '24px' : '30px',
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
                    padding: isA5 ? '4px 8px' : '6px 12px',
                    fontSize: tableRowSize,
                    color: '#374151',
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                    borderTop: index === 0 ? 'none' : '1px solid #E5E7EB',
                    minHeight: isA5 ? '24px' : '30px',
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
          padding: isA5 ? '8px 16px' : '12px 20px',
          borderRadius: '0 0 8px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #E5E7EB',
        }}>
          <Box sx={{ display: 'flex', gap: isA5 ? '40px' : '60px', fontSize: '13px', color: '#1A212B' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: summaryLabelSize, color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TOTAL_VALUE_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: summaryValueSize }}>{totalValue}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: summaryLabelSize, color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TOTAL_DISCOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: summaryValueSize }}>{totalDiscount}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: summaryLabelSize, color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TAX_AMOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: summaryValueSize }}>{taxAmount}</Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <Box sx={{ fontSize: summaryValueSize, fontWeight: 500, color: '#6B7280' }}>
              {SALES_RECEIPT_LABELS.TOTAL_PAYABLE_LABEL}
            </Box>
            <Box sx={{ fontSize: summaryBigValueSize, fontWeight: 700, color: '#1A212B' }}>
              {totalPayableAmount}
            </Box>
          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default PrintPreviewModal;

