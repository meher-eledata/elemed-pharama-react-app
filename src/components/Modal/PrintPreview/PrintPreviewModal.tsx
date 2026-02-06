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
  patientType: string;
  onCancel: () => void;
  onPrint: () => void;
  onSaveClick?: () => void; // Handler for Save button click
  onAfterSave?: () => void; // Optional callback after successful save
  hideActionButtons?: boolean; // Hide the action buttons (for view-only mode)
  brandIcon?: string;
  showHospitalDetails?: boolean;
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
  brandIcon,
  showHospitalDetails = true,
  pageSize = 'a4',
  splitPayments = [],
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
          format: pageSize,
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
        {/* Branded Receipt Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: pageSize === 'a4' ? 'space-between' : 'center',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #1A212B',
          gap: pageSize === 'a4' ? 0 : '20px'
        }}>
          <Box sx={{ flex: pageSize === 'a4' ? 1 : 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            {brandIcon && showHospitalDetails && (
              <Box
                component="img"
                src={brandIcon}
                sx={{
                  width: pageSize === 'a4' ? '90px' : '70px',
                  height: 'auto',
                  marginTop: pageSize === 'a4' ? '-15px' : 0,
                  marginLeft: pageSize === 'a4' ? '-10px' : 0
                }}
                alt="Logo"
              />
            )}
          </Box>
          <Box sx={{ flex: pageSize === 'a4' ? 3 : 'none', textAlign: pageSize === 'a4' ? 'center' : 'left' }}>
            {showHospitalDetails && (
              <>
                <Typography sx={{ fontSize: pageSize === 'a4' ? '20px' : '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.1 }}>
                  ELITE PHARMACY
                </Typography>
                <Typography sx={{ fontSize: pageSize === 'a4' ? '9px' : '8px', fontWeight: 500, margin: '2px 0', color: '#374151' }}>
                  (SKE SUSRUTA INSTITUTE OF MEDICAL SCIENCES PVT LTD)
                </Typography>
                <Typography sx={{ fontSize: pageSize === 'a4' ? '8px' : '7px', margin: '4px 0', lineHeight: 1.2, color: '#4B5563' }}>
                  PLOT NO:14A, HEALTH CITY, CHINAGADHILI, 530040<br />
                  DL No: FORM 20:AP/03/01/2015-124907, FORM 21:AP/03/01/2015-124908<br />
                  GSTIN No: 37AAQCS3213C2ZH<br />
                  (M): 0891-2554040, 8096655050
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ flex: 1, textAlign: 'right' }}>
          </Box>
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
              {splitPayments && splitPayments.length > 0 ? (
                splitPayments.map((payment, idx) => (
                  <Typography key={idx} sx={{ fontSize: '11px', color: '#374151', marginBottom: '4px', lineHeight: 1.4 }}>
                    <strong>{payment.mode || payment.paymentMethod}:</strong> ₹{parseFloat(payment.amount || '0').toFixed(0)}
                  </Typography>
                ))
              ) : (
                <>
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
                </>
              )}
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
              <Typography sx={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>
                <strong>Patient Type:</strong> {patientType || ''}
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
                    <Box sx={{ fontWeight: 600 }}>{parseFloat(item.amount || '0').toFixed(0)}</Box>
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
              <Box sx={{ fontWeight: 700, fontSize: '14px' }}>{parseFloat(totalValue || '0').toFixed(0)}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: '12px', color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TOTAL_DISCOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: '14px' }}>{parseFloat(totalDiscount || '0').toFixed(0)}</Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ fontWeight: 500, fontSize: '12px', color: '#6B7280' }}>{SALES_RECEIPT_LABELS.TAX_AMOUNT_LABEL}</Box>
              <Box sx={{ fontWeight: 700, fontSize: '14px' }}>{parseFloat(taxAmount || '0').toFixed(0)}</Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <Box sx={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              {SALES_RECEIPT_LABELS.TOTAL_PAYABLE_LABEL}
            </Box>
            <Box sx={{ fontSize: '20px', fontWeight: 700, color: '#1A212B' }}>
              {parseFloat(totalPayableAmount || '0').toFixed(0)}
            </Box>
          </Box>
        </Box>

        {/* Pharmacist Signature */}
        <Box sx={{ marginTop: '60px', display: 'flex', justifyContent: 'flex-start' }}>
          <Box sx={{
            borderTop: '1px solid #000',
            width: '150px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 600,
            paddingTop: '5px',
            color: '#1A212B'
          }}>
            Pharmacist Signature
          </Box>
        </Box>

        <Typography sx={{ marginTop: '10px', textAlign: 'right', fontSize: '8px', fontWeight: 600, color: '#1A212B' }}>
          Powered by Elemed
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintPreviewModal;

