import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { StandardButton } from '../../Common';
import html2pdf from 'html2pdf.js';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';

interface SalesReceiptItem {
  id: string;
  productName: string;
  manufacturer?: string;
  batch: string;
  quantity: string;
  type: string;
  unitPrice: string;
  mrp?: string;
  hsn?: string;
  pack?: string;
  expiryDate?: string;
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
  onAfterSave?: () => void; // Optional callback after successful save
  brandIcon?: string;
  pageSize?: 'A4' | 'A5';
  onPageSizeChange?: (size: 'A4' | 'A5') => void;
  orientation?: 'landscape' | 'portrait';
  onOrientationChange?: (orientation: 'landscape' | 'portrait') => void;
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
  onAfterSave,
  pageSize = 'A4',
  onPageSizeChange,
  orientation = 'landscape',
  onOrientationChange,
  brandIcon,
  splitPayments = [],
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);
  const isA5 = pageSize.toUpperCase() === 'A5';

  // Adaptive styles based on page size
  const containerMaxWidth = '794px'; // A5 Landscape width is same as A4 Portrait width (210mm)
  const containerPadding = isA5 ? '16px' : '28px';
  const headerFontSize = isA5 ? '20px' : '24px';
  const sectionGap = isA5 ? '8px' : '14px';
  const sectionTitleSize = isA5 ? '12px' : '16px';
  const sectionTextSize = isA5 ? '10px' : '13px';
  const tableHeaderSize = isA5 ? '10px' : '14px';
  const tableRowSize = isA5 ? '10px' : '13px';
  const summaryLabelSize = isA5 ? '11px' : '13px';
  const summaryValueSize = isA5 ? '12px' : '16px';
  const summaryBigValueSize = isA5 ? '16px' : '22px';

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
          format: pageSize.toLowerCase(),
          orientation: orientation
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
      {/* Page Size Selector - Inside Modal */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        mb: 3,
        mt: 1,
        pb: 2,
        borderBottom: '1px solid #E5E7EB'
      }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#616161' }}>Page Size:</Typography>
        <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
          {['A4', 'A5'].map((size) => (
            <Box
              key={size}
              onClick={() => onPageSizeChange?.(size as 'A4' | 'A5')}
              sx={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: pageSize.toUpperCase() === size ? '#FFFFFF' : 'transparent',
                color: pageSize.toUpperCase() === size ? '#5C17E5' : '#6B7280',
                boxShadow: pageSize.toUpperCase() === size ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: pageSize.toUpperCase() === size ? '#FFFFFF' : '#E5E7EB',
                }
              }}
            >
              {size}
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#616161', ml: '12px' }}>{SALES_RECEIPT_LABELS.ORIENTATION_LABEL}</Typography>
        <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
          {([
            { value: 'landscape', label: SALES_RECEIPT_LABELS.ORIENTATION_LANDSCAPE },
            { value: 'portrait', label: SALES_RECEIPT_LABELS.ORIENTATION_PORTRAIT },
          ] as const).map((option) => (
            <Box
              key={option.value}
              onClick={() => onOrientationChange?.(option.value)}
              sx={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: orientation === option.value ? '#FFFFFF' : 'transparent',
                color: orientation === option.value ? '#5C17E5' : '#6B7280',
                boxShadow: orientation === option.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: orientation === option.value ? '#FFFFFF' : '#E5E7EB',
                }
              }}
            >
              {option.label}
            </Box>
          ))}
        </Box>
      </Box>

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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isA5 ? '8px' : '12px',
          paddingBottom: '6px',
          borderBottom: '2px solid #1A212B',
          gap: 0
        }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
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
          <Box sx={{ flex: 3, textAlign: 'center' }}>
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
          </Box>
          <Box sx={{ flex: 1, textAlign: 'right' }}></Box>
        </Box>

        {/* Centered in-document receipt title (matches the printed output) */}
        <Typography sx={{
          textAlign: 'center',
          fontSize: isA5 ? '11px' : '15px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: '#1A212B',
          marginBottom: isA5 ? '6px' : '10px',
        }}>
          {SALES_RECEIPT_LABELS.CUSTOMER_RECEIPT_TITLE}
        </Typography>

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
                  const details = p.details || p.notes || '';
                  return (
                    <Typography key={idx} sx={{ fontSize: sectionTextSize, color: '#374151', marginBottom: '2px', lineHeight: 1.2 }}>
                      {method.toUpperCase()}: {amount} {details ? `(Details: ${details})` : ''}
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
              gridTemplateColumns: '0.5fr 2fr 0.7fr 0.7fr 1.2fr 0.7fr 0.9fr 0.6fr 0.9fr 0.8fr 1fr',
              columnGap: '8px',
              backgroundColor: '#F9FAFB',
              padding: isA5 ? '4px 8px' : '10px 12px',
              fontSize: tableHeaderSize,
              fontWeight: 600,
              color: '#1A212B',
              flexShrink: 0,
              borderBottom: '2px solid #E5E7EB',
              minHeight: isA5 ? '24px' : '38px',
              alignItems: 'center'
            }}>
              <Box>S.No</Box>
              <Box>Product Name</Box>
              <Box>MFG</Box>
              <Box>HSN</Box>
              <Box>Batch</Box>
              <Box>Pack</Box>
              <Box>Exp</Box>
              <Box>Qty</Box>
              <Box>MRP</Box>
              <Box>GST</Box>
              <Box>Amount</Box>
            </Box>
            {/* Scrollable Products List */}
            <Box sx={{
              overflowY: 'auto',
              maxHeight: salesItems && salesItems.length > 0 ? '420px' : 'auto',
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
                salesItems.map((item, index) => {
                  const mfg = item.manufacturer ? item.manufacturer.substring(0, 3).toUpperCase() : 'N/A';
                  const gstTotal = (parseFloat(item.cgstPercent || '0') + parseFloat(item.sgstPercent || '0') + parseFloat(item.igstPercent || '0')).toFixed(0) + '%';

                  // Format expiry from YYYY-MM-DD to MM/YYYY
                  let formattedExp = 'N/A';
                  if (item.expiryDate) {
                    const dateParts = item.expiryDate.split('-');
                    if (dateParts.length >= 2) {
                      // Handle both YYYY-MM-DD and YYYY-MM
                      formattedExp = `${dateParts[1]}/${dateParts[0]}`;
                    } else {
                      formattedExp = item.expiryDate;
                    }
                  }

                  return (
                    <Box key={item.id} sx={{
                      display: 'grid',
                      gridTemplateColumns: '0.5fr 2fr 0.7fr 0.7fr 1.2fr 0.7fr 0.9fr 0.6fr 0.9fr 0.8fr 1fr',
                      columnGap: '8px',
                      padding: isA5 ? '4px 8px' : '10px 12px',
                      fontSize: tableRowSize,
                      color: '#374151',
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      borderTop: index === 0 ? 'none' : '1px solid #E5E7EB',
                      minHeight: isA5 ? '24px' : '38px',
                      alignItems: 'center',
                      wordBreak: 'break-word'
                    }}>
                      <Box>{index + 1}</Box>
                      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</Box>
                      <Box>{mfg}</Box>
                      <Box>{item.hsn || 'N/A'}</Box>
                      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.batch}</Box>
                      <Box>{item.pack || 'N/A'}</Box>
                      <Box>{formattedExp}</Box>
                      <Box>{item.quantity}</Box>
                      <Box>{item.mrp || 'N/A'}</Box>
                      <Box>{gstTotal}</Box>
                      <Box sx={{ fontWeight: 600 }}>{item.amount}</Box>
                    </Box>
                  );
                })
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

