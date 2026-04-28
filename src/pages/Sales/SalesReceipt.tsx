import React, { useState, ChangeEvent, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { StandardButton } from '../../components/Common';
import { useDispatch, useSelector } from 'react-redux';
import EditIcon from '@mui/icons-material/Edit';
import { ReusableTable, SearchAndFilterConfig } from '../../components/PharmaTable';
import CustomerModal from '../../components/Modal/NewCustomer/CustomerModal';
import CommonModal from '../../components/CommonModal/CommonModal';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import SaleConfirmationDialog from '../../components/Modal/SaleConfirmation/SaleConfirmationDialog';

import PrintPreviewModal from '../../components/Modal/PrintPreview/PrintPreviewModal';
import PaymentSplitModal from './components/Modal/PaymentSplit/PaymentSplitModal';
import {
  useGetDoctorNamesQuery,
  useSubmitSaleMutation,
  useUpdateSalesMutation,
  useAddCustomerMutation,
  // useGetCustomersQuery,
  useGetAllCustomerNamesQuery,
  useGetInvoiceDetailsMutation,
  useEditSaleMutation,
  useDeleteSalesMutation,
  useUpsertInvoicePaymentsMutation,


  useGetCustomerPhonesMutation,
  useLazyGetInvoicesQuery,
  Customer,
  DoctorPhoneEmailInfo
} from '../../redux/slices/salesApi';
import { useGetProductsQuery } from '../../redux/slices/receiveApi';
import {
  selectCartTotal,
  clearCart,
  clearFormData,
  setCartItems
} from '../../redux/slices/cartSlice';
import { RootState } from '../../redux/store';
import { SALES_RECEIPT_LABELS } from '../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../config/constants/SalesReceipt.constants';
import { clearCartFromStorage, clearFormDataFromStorage, generateNextInvoiceNumber } from '../../utils/cartStorage';

import CustomerDetailsSection from './components/CustomerDetailsSection';
import DoctorDetailsSection from './components/DoctorDetailsSection';
import PaymentDetailsSection from './components/PaymentDetailsSection';
import FinancialSummary from './components/FinancialSummary';
import { ApplyGstCheckbox } from './components/ApplyGstCheckbox';
import { ActionButtons } from './components/ActionButtons';
import { Toast } from './components/Toast';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getTodayDate, generatePrintHTML, calculateFinancialSummary } from './SalesReceipt.utils';
import { recalculateSalesItemAmount } from './SalesReceipt.utils.calculation';
import { transformCartItemsForEdit } from './SalesReceipt.handlers';
import { getTableColumns } from './SalesReceipt.columns';
import { useCartLoader } from './hooks/useCartLoader';
import { useFormPersistence } from './hooks/useFormPersistence';
import { useCustomerPhones } from './hooks/useCustomerPhones';
import { useDoctorPhonesAndEmails } from './hooks/useDoctorPhonesAndEmails';
import { handleCustomerSubmit } from './SalesReceipt.customerHandler';
import { executeSave } from './SalesReceipt.saveHandler';
import {
  SalesReceiptContainer,
  SalesReceiptHeader,
  LeftSection,
  SalesReceiptTitle,
  HorizontalDivider,
  CustomerDoctorSection,
} from './SalesReceipt.styles';

import { getPrintStyles, fieldStyles } from './SalesReceipt.printStyles';
import bgWhiteIcon from '../../assets/BG_White.svg';

const SalesReceipt: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector((state: RootState) => state.auth.user);

  const [submitSale, { isLoading: isSubmittingSale }] = useSubmitSaleMutation();
  const [editSale, { isLoading: isEditingSale }] = useEditSaleMutation();
  const [upsertInvoicePayments] = useUpsertInvoicePaymentsMutation();
  const [updateSales, { isLoading: isUpdatingSale }] = useUpdateSalesMutation();
  const [deleteSales] = useDeleteSalesMutation();
  const [addCustomer] = useAddCustomerMutation();


  const [getInvoiceDetails, { isLoading: isLoadingInvoiceDetails }] = useGetInvoiceDetailsMutation();

  const [fetchInvoicesList] = useLazyGetInvoicesQuery();
  const [getCustomerPhones] = useGetCustomerPhonesMutation();
  const { data: doctorNamesData = [], isLoading: isLoadingDoctorNames } = useGetDoctorNamesQuery();

  // Extract names from doctor objects array to string array for compatibility
  const doctorNames: string[] = useMemo(() => {
    return doctorNamesData.map((doctor: { id: string; name: string } | string) =>
      typeof doctor === 'string' ? doctor : doctor.name
    );
  }, [doctorNamesData]);
  const { data: customerNames = [], refetch: refetchCustomerNames } = useGetAllCustomerNamesQuery();
  // const { data: customersData = [] } = useGetCustomersQuery(); // Endpoint 404s

  const {
    data: apiProducts = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError
  } = useGetProductsQuery();

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: SALES_RECEIPT_CONSTANTS.DEFAULT_SORT_KEY,
    direction: SALES_RECEIPT_CONSTANTS.SORT_DIRECTION_ASC
  });
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilterKey, setCurrentFilterKey] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});
  const [currentPage, setCurrentPage] = useState(SALES_RECEIPT_CONSTANTS.DEFAULT_CURRENT_PAGE);
  const [rowsPerPage] = useState(SALES_RECEIPT_CONSTANTS.DEFAULT_ROWS_PER_PAGE);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'print' | null>(null);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [applyGstToAll, setApplyGstToAll] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [patientType, setPatientType] = useState<string>('Out Patient'); // Default to 'Out Patient'
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [availablePhones, setAvailablePhones] = useState<string[]>([]);
  // 🔒 Pause flag: prevents phone-lookup hook from overwriting the real ID while addCustomer is in flight
  const isAddingCustomerRef = useRef(false);

  const [doctorName, setDoctorName] = useState('');
  const [doctorMobile, setDoctorMobile] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [availableDoctorInfo, setAvailableDoctorInfo] = useState<DoctorPhoneEmailInfo[]>([]);

  const [paymentMode, setPaymentMode] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => getTodayDate());
  const [returnDate, setReturnDate] = useState<string>('');

  const [totalValue, setTotalValue] = useState('');
  const [totalDiscount, setTotalDiscount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [totalPayableAmount, setTotalPayableAmount] = useState('');

  // Multiple Payment State
  const [isPaymentSplitModalOpen, setIsPaymentSplitModalOpen] = useState(false);
  const [splitPayments, setSplitPayments] = useState<any[]>([]);

  const [salesItems, setSalesItems] = useState<SalesReceiptItem[]>([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A4');

  // Check if we're in edit mode or return details mode from location state
  const editModeData = (location.state as any) || null;
  const isEditMode = editModeData?.isEditMode || false;
  const isReturnDetailsMode = editModeData?.isReturnDetailsMode || false;

  // CRITICAL: Resolve database invoice ID from navigation state
  const rawInvoiceId = editModeData?.invoiceId || editModeData?.invoice_id || editModeData?.id;
  const resolvedInvoiceId = (rawInvoiceId && !isNaN(Number(rawInvoiceId)))
    ? Number(rawInvoiceId)
    : 0;

  // Store original invoice data for comparison
  const [originalInvoiceData, setOriginalInvoiceData] = useState<{
    customerName: string;
    customerMobile: string;
    customerCity: string;
    doctorName: string;
    doctorMobile: string;
    doctorEmail: string;
    paymentMode: string;
    insuranceCompany: string;
    patientType: string;
    invoiceNumber: string;
    invoiceDate: string;
    salesItems: SalesReceiptItem[];
    totalValue: string;
    totalDiscount: string;
    taxAmount: string;
    totalPayableAmount: string;
  } | null>(null);

  // Clear form data from Redux when entering edit mode to prevent interference
  useEffect(() => {
    if (isEditMode || isReturnDetailsMode) {
      dispatch(clearFormData());
    }
  }, [isEditMode, isReturnDetailsMode, dispatch]);

  const safeTrim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');


  useEffect(() => {
    if ((isEditMode || isReturnDetailsMode) && editModeData) {
      let fetchInvoiceNumber: string | null = null;

      // CRITICAL: Always use invoice_number if available - it's the source of truth
      if (editModeData.invoiceNumber) {
        // Strip "INV" or "RB" prefix if present - backend expects only numeric part
        let fullInvoiceNumber = editModeData.invoiceNumber.toString().trim();
        fetchInvoiceNumber = fullInvoiceNumber.replace(/^(INV-?|RB-?)/i, '').trim() || fullInvoiceNumber;
        console.log('📝 Prepared invoice number for API fetch. Original:', fullInvoiceNumber, '→ Sending:', fetchInvoiceNumber);
      }

      console.log('📋 Diagnostic: Edit mode data resolved:', { resolvedInvoiceId, fetchInvoiceNumber, rawInvoiceId });

      // MUST have at least invoice_number or ID to proceed
      if (!fetchInvoiceNumber && !resolvedInvoiceId) {
        console.error('❌ No invoice_number or invoice_id available');
        alert('Cannot load invoice: No invoice number or ID provided');
        navigate('/sales');
        return;
      }

      if (fetchInvoiceNumber || resolvedInvoiceId > 0) {
        const fetchInvoiceDetails = async () => {
          try {
            console.log('📡 Starting fetchInvoiceDetails process...', {
              resolvedInvoiceId,
              fetchInvoiceNumber,
              rawStateId: editModeData.invoiceId || editModeData.invoice_id
            });

            let result;
            let firstAttemptError: any = null;

            // Attempt 1: Fetch by database invoice ID (primary key)
            if (resolvedInvoiceId > 0) {
              console.log('🔍 Attempt 1: Fetching by invoice_id (ID):', resolvedInvoiceId);
              try {
                result = await getInvoiceDetails({ invoice_id: resolvedInvoiceId }).unwrap();
                console.log('✅ Invoice found by invoice_id');
              } catch (err: any) {
                firstAttemptError = err;
                console.log('❌ Invoice not found by invoice_id (ID):', resolvedInvoiceId, 'Error:', err);
                console.log('🔄 Proceeding to Attempt 2...');
              }
            }

            // Attempt 2: Fetch by numeric invoice number (e.g. "8")
            if (!result && fetchInvoiceNumber) {
              console.log('🔍 Attempt 2: Fetching by numeric invoice_number:', fetchInvoiceNumber);
              try {
                result = await getInvoiceDetails({ invoice_number: fetchInvoiceNumber }).unwrap();
                console.log('✅ Invoice found by numeric invoice_number');
              } catch (err: any) {
                console.log('❌ Numeric invoice_number failed');
                firstAttemptError = firstAttemptError || err;
              }
            }

            // Attempt 3: Fetch by full display invoice number (e.g. "INV8")
            if (!result && editModeData.invoiceNumber) {
              console.log('🔍 Attempt 3: Fetching by display invoiceNumber:', editModeData.invoiceNumber);
              try {
                result = await getInvoiceDetails({ invoice_number: editModeData.invoiceNumber }).unwrap();
                console.log('✅ Invoice found by display invoice_number');
              } catch (err: any) {
                console.log('❌ Display invoice_number failed');
                firstAttemptError = firstAttemptError || err;
              }
            }

            // Attempt 4: Final attempt with RAW invoice number from server (unmodified)
            if (!result && editModeData.rawInvoiceNumber) {
              console.log('🔍 Attempt 4: ULTIMATE FALLBACK - Fetching by rawInvoiceNumber:', editModeData.rawInvoiceNumber);
              try {
                result = await getInvoiceDetails({ invoice_number: editModeData.rawInvoiceNumber }).unwrap();
                console.log('✅ Invoice found by raw invoice_number');
              } catch (err: any) {
                console.log('❌ All 4 fetch attempts failed');
                throw firstAttemptError || err;
              }
            }

            if (!result) {
              console.error('❌ Data Retrieval Failed: No result returned from API');
              throw firstAttemptError || new Error('No unique invoice_id or invoice_number available');
            }

            if (result) {
              const invoice = result.invoice || {};
              const lines = result.lines || [];
              const payments = result.payments || [];

              // Map payments from API to splitPayments state.
              // For MULTIPLE-mode invoices load all available payment records (even just 1),
              // UNLESS it is only the initial MULTIPLE placeholder (upsert-invoice-payments
              // failed on backend) — in that case treat it as no split payments available.
              // For single-mode invoices, only load if there are 2+ records (avoids overwriting
              // the user's newly selected payment mode with the old backend record).
              const isMultiplePaymentMode = (invoice.payment_mode || '').toUpperCase() === 'MULTIPLE';
              const isMultiplePlaceholder = payments.length === 1 &&
                (payments[0].payment_method || '').toUpperCase() === 'MULTIPLE';
               if (Array.isArray(payments) && (payments.length > 1 || (isMultiplePaymentMode && payments.length > 0 && !isMultiplePlaceholder))) {
                const totalReturned = parseFloat(invoice.total_returned_amount || result.total_refunded || 0);
                // Deduplicate refund payments to prevent showing the same refund multiple times
                const uniquePayments = Array.from(new Map(payments.map(p => [
                  `${p.payment_method}_${p.payment_amount}_${p.transaction_number || ''}`, p
                ])).values());

                const mappedPayments = uniquePayments.map((p: any, idx: number) => {
                  // Use direction='OUT' or payment_type includes 'RETURN' to reliably detect refunds
                  // The old approach (matching amount to totalReturned) breaks for multiple partial returns
                  const isRefund = p.direction === 'OUT' ||
                    (p.payment_type && p.payment_type.toUpperCase().includes('RETURN'));
                  return {
                    id: p.id?.toString() || `existing-payment-${idx}-${Date.now()}`,
                    paymentMethod: isRefund ? `REFUND (${p.payment_method || 'Cash'})` : (p.payment_method || 'Cash'),
                    amount: isRefund ? (-Math.abs(parseFloat(p.payment_amount || '0'))).toString() : parseFloat(p.payment_amount || '0').toString(),
                    details: p.details || '',
                    transaction_number: p.transaction_number || '',
                    is_refund: isRefund
                  };
                });
                setSplitPayments(mappedPayments.filter((p: any) => Math.abs(parseFloat(p.amount)) > 0));
              } else {
                // Single payment or no payment — don't populate splitPayments
                setSplitPayments([]);
              }

              const mappedSalesItems = lines.length > 0 ? lines.map((line: any) => {
                const unitPrice = parseFloat(line.rate || line.unit_price || '0');
                const quantity = parseFloat(line.quantity || '1');
                const baseAmount = unitPrice * quantity;

                // Calculate discount percentage
                let discountPercentValue = '0';
                const rawDisc = line.discount_percent ?? line.discountPercent ?? line.discount ?? 0;
                const discValue = parseFloat(rawDisc.toString());

                // Detection: if it looks like a fraction (e.g. 0.05 or 0.5), convert to percentage (5 or 50)
                // Otherwise use as is (already 0-100)
                discountPercentValue = discValue.toString();

                // ROBUST TAX PERCENTAGE DERIVATION:
                // Trust the stored value if it looks like a percentage (0-30)
                // Only fall back to math derivation for old invoices storing absolute amounts
                const deriveTaxPercent = (storedVal: any, base: number, defaultVal: string) => {
                  const val = parseFloat(storedVal || '0');

                  // Priority 1: If value is already a reasonable percentage (>30%), or looks like a fraction (0-1), 
                  if (val > 0) return val.toString();

                  // Priority 2: If value is 0, check if we should use the mandatory default
                  if (val === 0) return defaultVal;

                  if (base === 0) return defaultVal;

                  // Priority 3: Fallback for OLD invoices storing absolute amounts
                  const calcPercent = (val / base) * 100;
                  const commonPercents = [2.5, 5, 6, 9, 12, 14, 18, 28];
                  const foundCommon = commonPercents.find(p => Math.abs(calcPercent - p) < 0.1);

                  if (foundCommon) {
                    return foundCommon.toString();
                  }

                  // If it's a small amount that looks like a percentage when calculated
                  if (calcPercent > 0.1 && calcPercent <= 30) return calcPercent.toFixed(1);

                  return defaultVal;
                };

                const discountedAmountPerUnit = baseAmount / quantity - (parseFloat(line.discount || '0') / quantity);
                const lineBaseForTax = baseAmount - parseFloat(line.discount || '0');

                // Apply defaults: CGST=9, SGST=9, IGST=0
                let cgstPercent = deriveTaxPercent(line.cgst || line.cgst_percent, lineBaseForTax, '9');
                let sgstPercent = deriveTaxPercent(line.sgst || line.sgst_percent, lineBaseForTax, '9');
                let igstPercent = deriveTaxPercent(line.igst || line.igst_percent, lineBaseForTax, '0');

                const originalQty = parseFloat(line.quantity || '0');
                const returnedQty = parseFloat(line.returned_quantity || '0');
                const netQty = Math.max(0, originalQty - returnedQty); // Prevent negative quantity if backend returned multiple times

                return {
                  id: line.invoice_line_id?.toString() || line.id?.toString() || '',
                  productName: line.name || line.product_name || line.productName || '', // API returns 'name' field
                  product_id: line.product_id || undefined, // Preserve product_id from API (important for batch validation)
                  manufacturer: line.brand_name || line.manufacturer || '', // API returns 'brand_name' field
                  batch: line.batch_number || line.batch || '',
                  expiryDate: line.expiry_date || line.expiryDate || '',
                  pack: line.pack_info || line.pack || '',
                  pack_qty: line.pack_qty || 1,
                  // Use exactly what backend sends, without treating '0' or '0000' as invalid
                  hsn: line.hsn_code || (line.hsn_id ? line.hsn_id.toString() : '') || '',
                  quantity: netQty.toString(),
                  unitPrice: line.amount ? (parseFloat(line.amount) / parseFloat(line.quantity || '1')).toFixed(8) : (line.rate?.toString() || line.unit_price?.toString() || '0'), // Base unit price with high precision
                  mrp: line.mrp ? Number(parseFloat(line.mrp) * parseFloat(line.quantity || '1')).toFixed(2).replace(/\.00$/, '') : '0', // Calculate aggregate MRP for historic invoices
                  discount: line.discount?.toString() || '0',
                  discountPercent: discountPercentValue,
                  cgst: line.cgst?.toString() || '0',
                  cgstPercent: cgstPercent,
                  sgst: line.sgst?.toString() || '0',
                  sgstPercent: sgstPercent,
                  igst: line.igst?.toString() || '0',
                  igstPercent: igstPercent,
                  amount: line.selling_price?.toString() || line.amount?.toString() || '0',
                  discountAuthorizedBy: line.discount_authority || undefined,
                  // Store return information for return details view
                  returned_quantity: returnedQty,
                  original_quantity: originalQty,
                };
              }) : [];

              const invoiceData = {
                customerName: result.customer_name || result.invoice?.customer_name || editModeData.customerName || '',
                customerMobile: result.customer_phone || result.invoice?.customer_phone || result.customer_mobile || result.invoice?.customer_mobile || editModeData.customerMobile || '',
                customerCity: result.customer_city || result.invoice?.customer_city || editModeData.customerCity || '',
                doctorName: result.doctor_name || result.invoice?.doctor_name || editModeData.doctorName || '',
                doctorMobile: result.doctor_mobile || result.invoice?.doctor_mobile || editModeData.doctorMobile || '',
                doctorEmail: result.doctor_email || result.invoice?.doctor_email || editModeData.doctorEmail || '',
                paymentMode: result.payment_mode || result.invoice?.payment_mode || editModeData.paymentMode || 'Cash',
                insuranceCompany: result.insurance_company || result.invoice?.insurance_company || editModeData.insuranceCompany || '',
                patientType: (() => {
                  const raw = invoice.patient_type !== undefined ? invoice.patient_type : (invoice as any).patientType;
                  if (raw === null || raw === undefined) return 'Out Patient';
                  const str = String(raw).trim().toUpperCase();

                  // Standard: 0 is In Patient, 1 is Out Patient (Aligned with backend team)
                  if (raw === 0 || str === '0' || str.includes('INPATIENT') || (str.includes('IN') && !str.includes('OUT'))) {
                    return 'In Patient';
                  }
                  return 'Out Patient';
                })(),
                invoiceNumber: (invoice.invoice_number ? `INV${invoice.invoice_number}` : '') || (result.invoice_number ? `INV${result.invoice_number}` : '') || editModeData.invoiceNumber || '',
                invoiceDate: (() => {
                  const raw = invoice.invoice_date;
                  if (!raw) {
                    const localDate = editModeData.invoiceDate;
                    if (localDate) return localDate;
                    return getTodayDate();
                  }

                  // Handle YYYY-MM-DD from backend without timezone shift
                  const dateParts = raw.split(/[-/]/);
                  let d: Date;

                  if (dateParts.length === 3) {
                    if (dateParts[0].length === 4) {
                      // YYYY-MM-DD
                      d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    } else {
                      d = new Date(raw);
                    }
                  } else {
                    d = new Date(raw);
                  }

                  if (isNaN(d.getTime())) return editModeData.invoiceDate || getTodayDate();

                  // Revert to the original "DD MMM YYYY" format for consistency
                  return d.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                })(),
                salesItems: mappedSalesItems,
                // CRITICAL: In Edit Mode, we MUST prioritize mappedSalesItems from the API 
                // because they contain the real database invoice_line_id. 
                // Using editModeData (from LocalStorage) often uses synthetic IDs, 
                // which causes the backend to treat edits as "New" items and fail stock checks.
                finalSalesItems: isEditMode ? mappedSalesItems : (editModeData.salesItems && editModeData.salesItems.length > 0
                  ? editModeData.salesItems
                  : mappedSalesItems),
                totalValue: (isEditMode)
                  ? (invoice.total_amount?.toString() || result.total_value?.toString() || result.totalValue?.toString() || '0')
                  : (editModeData.salesItems && editModeData.salesItems.length > 0
                    ? (editModeData.totalValue || editModeData.totalAmount?.toString() || '0')
                    : (invoice.total_amount?.toString() || result.total_value?.toString() || result.totalValue?.toString() || '0')),
                totalDiscount: (isEditMode)
                  ? (invoice.discount?.toString() || result.total_discount?.toString() || result.totalDiscount?.toString() || '0')
                  : (editModeData.salesItems && editModeData.salesItems.length > 0
                    ? (editModeData.totalDiscount || '0')
                    : (invoice.discount?.toString() || result.total_discount?.toString() || result.totalDiscount?.toString() || '0')),
                taxAmount: (isEditMode)
                  ? (result.tax_amount?.toString() || result.taxAmount?.toString() || '0')
                  : (editModeData.salesItems && editModeData.salesItems.length > 0
                    ? (editModeData.taxAmount || '0')
                    : (result.tax_amount?.toString() || result.taxAmount?.toString() || '0')),
                totalPayableAmount: (isEditMode)
                  ? (Math.max(0, (parseFloat(invoice.total_amount) || 0) - (parseFloat(invoice.total_returned_amount || result.total_refunded || 0)))).toString()
                  : (editModeData.salesItems && editModeData.salesItems.length > 0
                    ? (editModeData.totalPayableAmount || editModeData.totalAmount?.toString() || '0')
                    : (Math.max(0, (parseFloat(invoice.total_amount) || 0) - (parseFloat(invoice.total_returned_amount || result.total_refunded || 0)))).toString()),
              };

              // Pre-populate form fields from API data
              // CRITICAL: Prioritize names passed from the navigation state (Table View) 
              // to prevent mismatches caused by backend data inconsistency.
              const finalCustomerName = editModeData.customerName || editModeData.originalInvoiceData?.customerName || result.customer_name || result.invoice?.customer_name || '';
              const finalDoctorName = editModeData.doctorName || editModeData.originalInvoiceData?.doctorName || result.doctor_name || result.invoice?.doctor_name || '';

              if (finalCustomerName) setCustomerName(finalCustomerName);
              if (invoiceData.customerMobile) setCustomerMobile(invoiceData.customerMobile);
              if (invoiceData.customerCity) setCustomerCity(invoiceData.customerCity);
              if (finalDoctorName) {
                setDoctorName(finalDoctorName);
                setSelectedDoctor(finalDoctorName);
                shouldFetchDoctorInfoRef.current = true;
              }
              setDoctorMobile(invoiceData.doctorMobile ?? '');
              setDoctorEmail(invoiceData.doctorEmail ?? '');
              if (invoiceData.paymentMode) setPaymentMode(invoiceData.paymentMode);
              if (invoiceData.insuranceCompany) setInsuranceCompany(invoiceData.insuranceCompany);
              if (invoiceData.patientType) setPatientType(invoiceData.patientType);
              if (invoiceData.invoiceNumber) setInvoiceNumber(invoiceData.invoiceNumber);
              if (invoiceData.invoiceDate) setInvoiceDate(invoiceData.invoiceDate);

              // TODO: Extract return date from API when ready
              // When API is ready, extract return_date from result and set it:
              // if (isReturnDetailsMode && result.return_date) {
              //   setReturnDate(result.return_date);
              // }

              // Pre-populate sales items - prioritize local ones
              if (invoiceData.finalSalesItems && Array.isArray(invoiceData.finalSalesItems) && invoiceData.finalSalesItems.length > 0) {
                const recalculatedItems = invoiceData.finalSalesItems.map((item: SalesReceiptItem) => recalculateSalesItemAmount(item));
                setSalesItems(recalculatedItems);

                // Recalculate summary from these items to ensure consistency
                const correctedSummary = calculateFinancialSummary(recalculatedItems);

                setTotalValue(correctedSummary.totalValue);
                setTotalDiscount(correctedSummary.totalDiscount);
                setTaxAmount(correctedSummary.taxAmount);
                setTotalPayableAmount(correctedSummary.totalPayableAmount);

                // IMPORTANT: Save original data for diff tracking when saving edits to backend
                setOriginalInvoiceData(invoiceData);
              } else if (invoiceData.totalValue) {
                setOriginalInvoiceData(invoiceData);
              } else if (invoiceData.totalValue) {
                setTotalValue(invoiceData.totalValue || '0');
                setTotalDiscount(invoiceData.totalDiscount || '0');
                setTaxAmount(invoiceData.taxAmount || '0');
                setTotalPayableAmount(invoiceData.totalPayableAmount || '0');
              }

              // Set customer if available
              if (invoiceData.customerName && invoiceData.customerMobile) {
                const customer: Customer = {
                  id: 0,
                  name: invoiceData.customerName,
                  mobile: invoiceData.customerMobile,
                  city: invoiceData.customerCity || '',
                };
                setSelectedCustomer(customer);
              }

              // Store original data for comparison
              const originalItems = invoiceData.salesItems && Array.isArray(invoiceData.salesItems) && invoiceData.salesItems.length > 0
                ? invoiceData.salesItems.map((item: SalesReceiptItem) => recalculateSalesItemAmount(item))
                : [];

              setOriginalInvoiceData({
                customerName: invoiceData.customerName || '',
                customerMobile: invoiceData.customerMobile || '',
                customerCity: invoiceData.customerCity || '',
                doctorName: invoiceData.doctorName || '',
                doctorMobile: invoiceData.doctorMobile || '',
                doctorEmail: invoiceData.doctorEmail || '',
                paymentMode: invoiceData.paymentMode || '',
                insuranceCompany: invoiceData.insuranceCompany || '',
                patientType: invoiceData.patientType || 'Out Patient',
                invoiceNumber: invoiceData.invoiceNumber || '',
                invoiceDate: invoiceData.invoiceDate || '',
                salesItems: originalItems,
                totalValue: invoiceData.totalValue || '0',
                totalDiscount: invoiceData.totalDiscount || '0',
                taxAmount: invoiceData.taxAmount || '0',
                totalPayableAmount: invoiceData.totalPayableAmount || '0',
              });

              return; // Exit early if API call succeeded
            }
          } catch (error) {
            console.error('Error fetching invoice details from API:', error);
            console.error('Error details:', {
              resolvedInvoiceId,
              fetchInvoiceNumber,
              errorStatus: (error as any)?.status,
              errorData: (error as any)?.data,
            });
            // Do NOT use fallback data from location state
            const errData = (error as any)?.data;
            const errStatus = (error as any)?.status;
            const errMessage = errData?.error || (error as any)?.message || 'Unknown error';

            if (errStatus === 404) {
              const idsTried = [
                resolvedInvoiceId ? `Database ID: ${resolvedInvoiceId}` : null,
                fetchInvoiceNumber ? `Numeric Number: ${fetchInvoiceNumber}` : null,
                editModeData.invoiceNumber ? `Display Number: ${editModeData.invoiceNumber}` : null,
                editModeData.rawInvoiceNumber ? `Raw Number: ${editModeData.rawInvoiceNumber}` : null
              ].filter(Boolean).join(', ');

              alert(
                `Invoice Not Found on Server (404)\n\n` +
                `Attempted to find invoice using: ${idsTried}\n\n` +
                `The record exists in your local history, but the server couldn't find it.\n\n` +
                `Common Reason: If you recently restarted your backend server, it might have cleared its temporary database.\n\n` +
                `Solution: Create the sale again.`
              );
            } else {
              alert(`Failed to load invoice details from server: ${errMessage}`);
            }

            navigate('/sales');
            return;
          }
        };

        fetchInvoiceDetails();
      }
    }
  }, [isEditMode, isReturnDetailsMode, editModeData, getInvoiceDetails, navigate, resolvedInvoiceId]);

  // Load cart items (only if not in edit mode)
  useCartLoader({
    onCartLoaded: useCallback((items, summary) => {
      // Only load cart items if we're not in edit mode
      if (!isEditMode) {
        // Recalculate all items to ensure discount amounts are correct
        const recalculatedItems = items.map(item => recalculateSalesItemAmount(item));
        setSalesItems(recalculatedItems);

        // Recalculate summary with corrected items
        const correctedSummary = calculateFinancialSummary(recalculatedItems);
        setTotalValue(correctedSummary.totalValue);
        setTotalDiscount(correctedSummary.totalDiscount);
        setTaxAmount(correctedSummary.taxAmount);
        setTotalPayableAmount(correctedSummary.totalPayableAmount);
      }
    }, [isEditMode])
  });

  // Recalculate totals whenever salesItems change (e.g., when discount or taxes are updated)
  useEffect(() => {
    if (salesItems.length > 0) {
      const summary = calculateFinancialSummary(salesItems);
      setTotalValue(summary.totalValue);
      setTotalDiscount(summary.totalDiscount);
      setTaxAmount(summary.taxAmount);
      setTotalPayableAmount(summary.totalPayableAmount);
    }
  }, [salesItems]);

  const handleCustomerAutoFill = useCallback((customer: Customer) => {
    setCustomerMobile(customer.mobile);
    // Protect newly added customer with ID from being overwritten by id: 0 auto-fill during refetch
    setSelectedCustomer(prev => {
      if (prev && prev.id > 0 && prev.name.toLowerCase() === customer.name.toLowerCase()) {
        console.log('🛡️ State Protection: Preserving valid customer ID:', prev.id);
        return prev;
      }
      return customer;
    });
  }, []);

  const handlePhoneClear = useCallback(() => {
    setCustomerMobile('');
    // Protect valid customer ID from being cleared just because search is refetching
    setSelectedCustomer(prev => (prev && prev.id > 0) ? prev : null);
  }, []);

  const { shouldFetchImmediatelyRef } = useCustomerPhones({
    customerName,
    customerMobile,
    customerCity,
    customerNames,
    onPhoneFetched: setAvailablePhones,
    onCustomerAutoFill: handleCustomerAutoFill,
    onPhoneClear: handlePhoneClear,
    isAddingCustomerRef, // ← pause hook while new customer is being created
  });

  const handleCustomerNameChange = async (newName: string) => {
    const normalizedNewName = newName.trim().toLowerCase();
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedNewName);

    if (isExactMatch && newName.trim()) {
      shouldFetchImmediatelyRef.current = true;
    } else {
      // FIX: Only clear if the name actually changed from what we have and we don't have a valid ID for current name
      setSelectedCustomer(prev => (prev && prev.id > 0 && prev.name.toLowerCase() === normalizedNewName) ? prev : null);
    }


    setCustomerName(newName);
  };

  // Handle doctor phone and email fetching
  const handleDoctorAutoFill = useCallback((phone: string, email: string) => {
    setDoctorMobile(phone);
    setDoctorEmail(email);
  }, []);

  const handleDoctorInfoClear = useCallback(() => {
    setDoctorMobile('');
    setDoctorEmail('');
  }, []);

  const { shouldFetchImmediatelyRef: shouldFetchDoctorInfoRef } = useDoctorPhonesAndEmails({
    doctorName,
    doctorMobile,
    doctorEmail,
    doctorNames,
    onInfoFetched: setAvailableDoctorInfo,
    onDoctorAutoFill: handleDoctorAutoFill,
    onInfoClear: handleDoctorInfoClear
  });

  const handleDoctorNameChange = (value: string) => {
    const normalizedNewName = value.trim().toLowerCase();
    const isExactMatch = doctorNames.length > 0 && doctorNames.some(name => name.toLowerCase() === normalizedNewName);

    if (isExactMatch && value.trim()) {
      shouldFetchDoctorInfoRef.current = true;
    }

    setDoctorName(value);
    // If typing a new name that's not in the list, clear selectedDoctor
    if (!doctorNames.includes(value)) {
      setSelectedDoctor(null);
    }
  };

  // Handle form persistence (skip if in edit mode)
  useFormPersistence({
    customerName,
    customerMobile,
    customerCity,
    patientType,
    doctorName,
    doctorMobile,
    doctorEmail,
    paymentMode,
    insuranceCompany,
    invoiceNumber,
    invoiceDate,
    selectedCustomer,
    isEditMode, // Pass isEditMode to skip persistence in edit mode
    onFormDataLoaded: useCallback((formData) => {
      setCustomerName(formData.customerName);
      setCustomerMobile(formData.customerMobile);
      setCustomerCity(formData.customerCity);
      setPatientType(formData.patientType || 'Out Patient');
      setDoctorName(formData.doctorName);
      setDoctorMobile(formData.doctorMobile);
      setDoctorEmail(formData.doctorEmail);
      // Set paymentMode from form data, or default to 'Cash' if empty
      setPaymentMode(formData.paymentMode || 'Cash');
      setInsuranceCompany(formData.insuranceCompany);
      if (formData.invoiceNumber) setInvoiceNumber(formData.invoiceNumber);
      if (formData.invoiceDate) setInvoiceDate(formData.invoiceDate);
    }, []),
    onCustomerRestored: useCallback((customer) => {
      if (!customer) return;
      // Protect from restoring a stale ID:0 object if we already have a valid one
      setSelectedCustomer(prev => (prev && prev.id > 0 && prev.name.toLowerCase() === customer.name.toLowerCase()) ? prev : customer);
    }, [])
  });

  // Set default payment mode to 'Cash' if empty and not in edit mode
  useEffect(() => {
    if (!isEditMode && !paymentMode) {
      setPaymentMode('Cash');
    }
  }, [isEditMode, paymentMode]);

  // Generate invoice number on mount (if not in edit mode and not already set)
  // PRIORITY ORDER:
  //   1. Derive from the existing invoices list (max invoice_number + 1)
  //   2. localStorage counter (fallback if list fetch fails)
  useEffect(() => {
    if (!isEditMode && !invoiceNumber) {
      (async () => {
        // Priority 1: Derive from the existing invoices list (max invoice_number + 1)
        try {
          const invoices = await fetchInvoicesList().unwrap();
          if (invoices && invoices.length > 0) {
            const maxInvoiceNum = invoices.reduce((max: number, inv: any) => {
              const raw = String(inv.invoice_number ?? inv.invoiceNumber ?? '0').replace(/[^0-9]/g, '');
              const num = parseInt(raw, 10);
              return (!isNaN(num) && num > max) ? num : max;
            }, 0);
            if (maxInvoiceNum > 0) {
              const nextInvoiceNumber = `INV${maxInvoiceNum + 1}`;
              setInvoiceNumber(nextInvoiceNumber);
              console.log('📝 Invoice number derived from invoices list (max + 1):', nextInvoiceNumber);
              return;
            }
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch invoices list, falling back to localStorage counter...', err);
        }

        // Priority 2: localStorage counter (last resort — only reliable on single-device)
        const nextInvoiceNumber = generateNextInvoiceNumber();
        setInvoiceNumber(nextInvoiceNumber);
        console.log('📝 Invoice number generated from localStorage (fallback):', nextInvoiceNumber);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerName(customer.name);
      setCustomerMobile(customer.mobile);
      setCustomerCity(customer.city || '');
    } else {
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerMobile('');
      setCustomerCity('');
    }
  };

  const handleDoctorSelect = (doctorName: string | null) => {
    if (doctorName) {
      setSelectedDoctor(doctorName);
      setDoctorName(doctorName);
      // Trigger fetch for phones and emails
      shouldFetchDoctorInfoRef.current = true;
    } else {
      setSelectedDoctor(null);
      setDoctorName('');
      setDoctorMobile('');
      setDoctorEmail('');
      setAvailableDoctorInfo([]);
    }
  };

  const handleEditClick = (itemId: string) => {
    // Don't allow editing in return details mode
    if (isReturnDetailsMode) return;
    setEditingRowId(itemId);
    setApplyGstToAll(false);
  };

  const handleSaveClick = () => {
    setEditingRowId(null);
    setApplyGstToAll(false);
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setApplyGstToAll(false);
  };

  const handleDeleteClick = (itemId?: string) => {
    if (itemId) {
      setItemsToDelete([itemId]);
    } else {
      const selectedIds = selectedRows.map(index => salesItems[index].id);
      setItemsToDelete(selectedIds);
    }
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    const itemCount = itemsToDelete.length;
    setSalesItems(prev => prev.filter(item => !itemsToDelete.includes(item.id)));
    setSelectedRows(prev => prev.filter(index => {
      const item = salesItems[index];
      return item && !itemsToDelete.includes(item.id);
    }));
    setDeleteDialogOpen(false);
    setItemsToDelete([]);
    showToast(`${itemCount} item${itemCount > 1 ? 's' : ''} deleted successfully`, 'success');
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemsToDelete([]);
  };

  const handleSort = (column: string) => {
    setSortConfig(prevConfig => ({
      key: column,
      direction: prevConfig.key === column && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
  };

  const handleShowFiltersToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterSelect = (key: string, value: string | null) => {
    setCurrentFilterKey(key);
    setCurrentFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenCustomerModal = () => {
    setIsCustomerModalOpen(true);
  };

  const handleCloseCustomerModal = () => {
    setIsCustomerModalOpen(false);
  };

  const handleCustomerSubmitWrapper = useCallback(async (customerData: any) => {
    isAddingCustomerRef.current = true; // 🔒 Pause phone hook before API call
    await handleCustomerSubmit({
      customerData,
      addCustomer,
      refetchCustomerNames,
      showToast,
      onCustomerAdded: (customer: Customer) => {
        console.log('🎯 Setting selected customer from modal (success):', customer);
        setCustomerName(customer.name);
        setCustomerMobile(customer.mobile);
        setSelectedCustomer(customer);
        // ✅ ID is now locked — safe to re-enable the phone hook
        isAddingCustomerRef.current = false;
      },
      onClose: handleCloseCustomerModal,
    });
    // Safety: always release the lock even if onCustomerAdded wasn't called (e.g. on error)
    isAddingCustomerRef.current = false;
  }, [addCustomer, refetchCustomerNames, showToast]);

  const handleEditCart = useCallback(() => {
    const cartItemsWithGst = transformCartItemsForEdit(salesItems);
    dispatch(setCartItems(cartItemsWithGst));
    // Navigate to sales/new page to edit/add products to cart
    // Pass edit mode state so we can return to edit mode correctly
    navigate('/sales/new', {
      state: {
        isEditMode,
        invoiceId: resolvedInvoiceId,
        invoiceNumber,
        originalInvoiceData
      }
    });
  }, [salesItems, dispatch, navigate, isEditMode, resolvedInvoiceId, invoiceNumber, originalInvoiceData]);

  /**
   * Handle Print Button Click
   * Flow: Print Button → Sale Confirmation Dialog → Print Preview Modal → Direct Print
   * 
   * Step 1: User clicks "Print" button
   * Step 2: Opens Sale Confirmation Dialog to confirm the action
   * Step 3: After confirmation, opens Print Preview Modal (shows customer receipt preview)
   * Step 4: User clicks "Print" in preview modal → Directly prints the customer receipt
   */
  const handlePrint = () => {
    setPendingAction('print');
    setIsConfirmDialogOpen(true);
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
  };

  /**
   * Handle Print to PDF - Customer Receipt
   * This function generates and prints the customer receipt.
   * It opens a new window, writes the receipt HTML content, and triggers the browser's print dialog.
   * After printing, it clears the cart and form data from storage.
   */
  const handlePrintToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Generate customer receipt HTML content
      const htmlContent = generatePrintHTML({
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
        salesItems,
        totalValue,
        totalDiscount,
        taxAmount,
        totalPayableAmount,
        patientType,
        labels: SALES_RECEIPT_LABELS,
        brandIcon: bgWhiteIcon,
        pageSize: pageSize,
        splitPayments: splitPayments,
      });

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Handle cleanup for the print window
      printWindow.onafterprint = () => {
        printWindow.close();
      };

      // Trigger browser print dialog in the next tick to make it non-blocking
      // for the main window's navigation logic
      setTimeout(() => {
        printWindow.print();
      }, 500);

      // IMMEDIATELY finalize the workflow on the main screen for a snappy experience
      // This fulfills the user's request to navigate to history table right after clicking print
      setIsPrintModalOpen(false);
      resetForm();
      if (dispatch) dispatch(clearCart());
      clearCartFromStorage();
      clearFormDataFromStorage();

      // Navigate to sales history page (/sales)
      navigate('/sales');
    } else {
      showToast('Failed to open print window', 'error');
    }
  };

  const handleAfterSave = () => {
    clearCartFromStorage();
    clearFormDataFromStorage();
    setIsPrintModalOpen(false);
    navigate('/sales');
  };

  const handleCancelPrint = () => {
    setIsPrintModalOpen(false);
  };

  const handleSaveFromModal = () => {
    setPendingAction('save');
    setIsConfirmDialogOpen(true);
  };

  /**
   * Handle Print from Print Preview Modal
   * This is called when user clicks "Print" button inside the Print Preview Modal.
   * It directly prints the customer receipt without any additional confirmation.
   */
  const handlePrintFromModal = () => {
    // Print directly from Print Preview modal without confirmation
    handlePrintToPDF();
  };

  const handleConfirmDialogClose = () => {
    setIsConfirmDialogOpen(false);
    setPendingAction(null);
  };

  /**
   * Handle Confirmation Dialog Confirm
   * After user confirms in Sale Confirmation Dialog:
   * - If action is 'save': Execute save operation
   * - If action is 'print': Open Print Preview Modal (shows customer receipt for review before printing)
   */
  const handleConfirmDialogConfirm = async () => {
    if (pendingAction === 'save') {
      // Close dialog first
      setIsConfirmDialogOpen(false);
      try {
        // Execute save (this will show toast when complete)
        await executeSaveWrapper();
        // Reset pending action after save completes
        setPendingAction(null);
      } catch (error) {
        // Error is already handled and displayed in executeSave
        // Just reset pending action
        setPendingAction(null);
      }
    } else if (pendingAction === 'print') {
      // Close dialog first
      setIsConfirmDialogOpen(false);
      try {
        // Execute save first, but skip normal navigation
        await executeSaveWrapper(true, () => {
          // After successful save, open the print preview
          // Add a small delay to ensure the confirmation dialog is fully closed and focus is returned
          setTimeout(() => {
            setIsPrintModalOpen(true);
          }, 300);
        });
        // Reset pending action
        setPendingAction(null);
      } catch (error) {
        // Error is handled in executeSave
        setPendingAction(null);
      }
    }
  };

  const resetForm = useCallback(() => {
    setSalesItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerCity('');
    setPatientType('Out Patient');
    setSelectedCustomer(null);
    setDoctorName('');
    setDoctorMobile('');
    setDoctorEmail('');
    setSelectedDoctor(null);
    setAvailableDoctorInfo([]);
    setPaymentMode('');
    setInsuranceCompany('');
    setTotalValue('');
    setTotalDiscount('');
    setTaxAmount('');
    setTotalPayableAmount('');
    setSelectedRows([]);
    setEditingRowId(null);
    setSplitPayments([]); // Reset split payments
    setInvoiceDate(getTodayDate()); // Always default new sales to today's date

    dispatch(clearCart());
    dispatch(clearFormData());
  }, [dispatch]);

  const validateRequiredFields = useCallback(() => {
    const missingFields: string[] = [];

    if (!customerName || !customerName.trim()) {
      missingFields.push('Customer Name');
    }
    if (!customerMobile || !customerMobile.trim()) {
      missingFields.push('Customer Mobile Number');
    }

    if (!doctorName || !doctorName.trim()) {
      missingFields.push('Doctor Name');
    }
    if (salesItems.length === 0) {
      missingFields.push('At least one product item');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }, [customerName, customerMobile, doctorName, patientType, salesItems]);

  // Check if there are any changes from original data (for edit mode)
  const hasChanges = useCallback(() => {
    if (!isEditMode || !originalInvoiceData) {
      // If not in edit mode, always return true (normal save flow)
      return true;
    }

    // Compare form fields
    if (
      safeTrim(customerName) !== safeTrim(originalInvoiceData.customerName) ||
      safeTrim(customerMobile) !== safeTrim(originalInvoiceData.customerMobile) ||
      safeTrim(customerCity) !== safeTrim(originalInvoiceData.customerCity) ||
      safeTrim(doctorName) !== safeTrim(originalInvoiceData.doctorName) ||
      safeTrim(doctorMobile) !== safeTrim(originalInvoiceData.doctorMobile) ||
      safeTrim(doctorEmail) !== safeTrim(originalInvoiceData.doctorEmail) ||
      safeTrim(paymentMode) !== safeTrim(originalInvoiceData.paymentMode) ||
      safeTrim(patientType) !== safeTrim(originalInvoiceData.patientType) ||
      safeTrim(insuranceCompany) !== safeTrim(originalInvoiceData.insuranceCompany) ||
      safeTrim(invoiceNumber) !== safeTrim(originalInvoiceData.invoiceNumber) ||
      safeTrim(invoiceDate) !== safeTrim(originalInvoiceData.invoiceDate)
    ) {
      return true;
    }

    // Compare sales items
    if (salesItems.length !== originalInvoiceData.salesItems.length) {
      return true;
    }

    // Deep compare sales items
    for (let i = 0; i < salesItems.length; i++) {
      const current = salesItems[i];
      const original = originalInvoiceData.salesItems[i];

      if (!original) {
        return true;
      }

      // Compare all relevant fields
      if (
        current.productName !== original.productName ||
        current.quantity !== original.quantity ||
        current.unitPrice !== original.unitPrice ||
        current.mrp !== original.mrp ||
        current.discountPercent !== original.discountPercent ||
        current.discount !== original.discount ||
        current.batch !== original.batch ||
        current.type !== original.type ||
        current.cgstPercent !== original.cgstPercent ||
        current.sgstPercent !== original.sgstPercent ||
        current.igstPercent !== original.igstPercent ||
        current.amount !== original.amount
      ) {
        return true;
      }
    }

    // Compare financial summary
    if (
      totalValue !== originalInvoiceData.totalValue ||
      totalDiscount !== originalInvoiceData.totalDiscount ||
      taxAmount !== originalInvoiceData.taxAmount ||
      totalPayableAmount !== originalInvoiceData.totalPayableAmount
    ) {
      return true;
    }

    return false;
  }, [
    isEditMode,
    originalInvoiceData,
    customerName,
    customerMobile,
    customerCity,
    doctorName,
    doctorMobile,
    doctorEmail,
    paymentMode,
    patientType,
    insuranceCompany,
    invoiceNumber,
    invoiceDate,
    salesItems,
    totalValue,
    totalDiscount,
    taxAmount,
    totalPayableAmount,
  ]);

  const handleSave = () => {
    const validation = validateRequiredFields();

    if (!validation.isValid) {
      const fieldsList = validation.missingFields.join(', ');
      showToast(`Please fill in the required details: ${fieldsList}`, 'warning');
      return;
    }

    setPendingAction('save');
    setIsConfirmDialogOpen(true);
  };

  const executeSaveWrapper = useCallback(async (skipNavigation = false, onSuccess?: () => void) => {
    // Find doctor_id from doctorNamesData matching selected doctorName
    const matchedDoctor = doctorNamesData.find((d: any) =>
      (typeof d === 'string' ? d : d.name) === doctorName
    );
    const doctorId = matchedDoctor && typeof matchedDoctor === 'object' ? Number(matchedDoctor.id) : undefined;

    // RESOLVE CUSTOMER ID:
    // If we have name/mobile but no valid ID, try one last lookup to find the ID.
    // This handles the case where the user picked an existing name but the ID wasn't linked.
    let resolvedCustomer = { ...selectedCustomer } as Customer;
    if ((!resolvedCustomer || !resolvedCustomer.id || resolvedCustomer.id <= 0) && customerName && customerMobile) {
      try {
        console.log('🔍 Final ID Lookup: Attempting to find ID for:', customerName, customerMobile);
        const result = await getCustomerPhones({ name: customerName.trim() }).unwrap();
        const phones = result.phones || [];
        const ids = result.ids || [];

        // Match the phone to an ID
        const phoneIdx = phones.indexOf(customerMobile.trim());
        if (phoneIdx !== -1 && ids[phoneIdx]) {
          console.log('✅ Found matching ID:', ids[phoneIdx]);
          resolvedCustomer = {
            id: ids[phoneIdx],
            name: customerName,
            mobile: customerMobile,
            city: customerCity
          };
        }
      } catch (err) {
        console.warn('⚠️ Final ID lookup failed', err);
      }
    }

    // Block save if customer ID is still 0 after lookup (new sale only)
    // Edit mode uses null fallback in the payload to preserve existing backend data
    if (!isEditMode && (!resolvedCustomer.id || resolvedCustomer.id <= 0)) {
      showToast('Customer not found in system. Please select an existing customer or create a new one.', 'warning');
      return;
    }

    // If user selected a single payment mode, discard any leftover split payments
    // from a previous multiple-payment session to prevent stale data being saved.
    // Use split payments if they exist, otherwise use single payment mode
    const effectiveSplitPayments = (splitPayments && splitPayments.length > 0) ? splitPayments : [];
    const effectivePaymentMode = (splitPayments && splitPayments.length > 0) ? '' : paymentMode;

    // Block save if payment mode is MULTIPLE but no split payment breakdown is configured
    if (effectivePaymentMode && effectivePaymentMode.toUpperCase() === 'MULTIPLE' && effectiveSplitPayments.length === 0) {
      showToast('This invoice has multiple payment methods but no payment breakdown is entered. Please open "Multiple Payment" and enter the payment details before saving.', 'warning');
      return;
    }

    // Validate that split payment total matches the invoice total.
    // Use a 1-rupee tolerance because totalPayableAmount is Math.round(exactTotal),
    // which can differ from stored payment decimals by up to 0.50.
    if (effectiveSplitPayments.length > 0) {
      const splitTotal = effectiveSplitPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);
      const invoiceTotal = parseFloat(totalPayableAmount || '0');
      if (Math.abs(splitTotal - invoiceTotal) > 1) {
        showToast(
          `Payment amount (₹${Math.round(splitTotal)}) does not match the bill total (₹${Math.round(invoiceTotal)}). Please update the payment details before saving.`,
          'warning'
        );
        return;
      }
    }

    await executeSave({
      customerName,
      customerMobile,
      customerCity,
      patientType,
      doctorName,
      doctorId,
      doctorMobile,
      doctorEmail,
      paymentMode: effectivePaymentMode,
      insuranceCompany,
      invoiceNumber,
      invoiceDate,
      salesItems,
      totalValue,
      totalDiscount,
      taxAmount,
      totalPayableAmount,
      selectedCustomer: resolvedCustomer,
      apiProducts,
      isProductsLoading,
      isProductsError,
      productsError,
      user,
      submitSale,
      editSale,
      updateSales,
      showToast,
      resetForm,
      clearCart: () => dispatch(clearCart()),
      navigate,
      invoiceId: isEditMode ? resolvedInvoiceId : undefined,
      isEditMode,
      editModeData,
      originalSalesItems: originalInvoiceData?.salesItems,
      skipNavigation,
      onSuccess,
      splitPayments: effectiveSplitPayments,
      upsertInvoicePayments,
    });
  }, [customerName, customerMobile, customerCity, patientType, doctorName, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, salesItems, totalValue, totalDiscount, taxAmount, totalPayableAmount, selectedCustomer, apiProducts, isProductsLoading, isProductsError, productsError, user, submitSale, editSale, updateSales, showToast, navigate, dispatch, isEditMode, editModeData, originalInvoiceData, resetForm, doctorNamesData, splitPayments, upsertInvoicePayments, getCustomerPhones]);

  const handleCancel = () => {
    if (salesItems.length > 0) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel and go back?'
      );
      if (!confirmDiscard) {
        return;
      }
    }

    resetForm();

    dispatch(clearCart());

    navigate(SALES_RECEIPT_CONSTANTS.ROUTE_SALES);
  };

  const columns = getTableColumns({
    editingRowId,
    applyGstToAll,
    setSalesItems,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
    isReturnDetailsMode,
  });

  const searchAndFilterConfig: SearchAndFilterConfig = {
    filterOptions: []
  };

  const tableConfig = {
    columns,
    data: salesItems,
    selectedRows,
    setSelectedRows,
    emptyMessage: SALES_RECEIPT_LABELS.NO_SALES_ITEMS,
    searchAndFilterConfig,
    currentSearchTerm,
    onSearchChange: handleSearchChange,
    showFilters,
    onShowFiltersToggle: handleShowFiltersToggle,
    currentFilterKey,
    onFilterSelect: handleFilterSelect,
    totalRows: salesItems.length,
    rowsPerPage,
    currentPage,
    onPageChange: setCurrentPage,
    onSortRequest: handleSort,
    sortConfig,
    currentFilter,
  };

  return (
    <>
      <style>{getPrintStyles(pageSize)}</style>
      <style>{fieldStyles}</style>
      <SalesReceiptContainer id="sales-receipt-content">
        <SalesReceiptHeader>
          <LeftSection>
            <SalesReceiptTitle variant="h1">
              {isReturnDetailsMode ? 'Return details' : SALES_RECEIPT_LABELS.PAGE_TITLE}
            </SalesReceiptTitle>
          </LeftSection>
        </SalesReceiptHeader>

        <HorizontalDivider />

        <CustomerDoctorSection>
          <CustomerDetailsSection
            customerName={customerName}
            customerMobile={customerMobile}
            customerCity={customerCity}
            patientType={patientType}
            selectedCustomer={selectedCustomer}
            customerNames={customerNames}
            availablePhones={availablePhones}
            onCustomerNameChange={isReturnDetailsMode ? () => { } : handleCustomerNameChange}
            onCustomerSelect={isReturnDetailsMode ? () => { } : handleCustomerSelect}
            onCustomerMobileChange={isReturnDetailsMode ? () => { } : setCustomerMobile}
            onCustomerCityChange={isReturnDetailsMode ? () => { } : setCustomerCity}
            onPatientTypeChange={isReturnDetailsMode ? () => { } : setPatientType}
            onAddNewCustomer={isReturnDetailsMode ? () => { } : handleOpenCustomerModal}
          />

          <DoctorDetailsSection
            doctorName={doctorName}
            doctorMobile={doctorMobile}
            doctorEmail={doctorEmail}
            selectedDoctor={selectedDoctor}
            doctorNames={doctorNames}
            isLoadingDoctorNames={isLoadingDoctorNames}
            availableDoctorInfo={availableDoctorInfo}
            onDoctorSelect={isReturnDetailsMode ? () => { } : handleDoctorSelect}
            onDoctorNameChange={isReturnDetailsMode ? () => { } : handleDoctorNameChange}
            onDoctorMobileChange={isReturnDetailsMode ? () => { } : setDoctorMobile}
            onDoctorEmailChange={isReturnDetailsMode ? () => { } : setDoctorEmail}
          />

          <PaymentDetailsSection
            paymentMode={paymentMode}
            insuranceCompany={insuranceCompany}
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
            onPaymentModeChange={(mode: string) => { setPaymentMode(mode); setSplitPayments([]); }}
            onInsuranceCompanyChange={setInsuranceCompany}
            onInvoiceNumberChange={setInvoiceNumber}
            onInvoiceDateChange={setInvoiceDate}
            isReturnDetailsMode={isReturnDetailsMode}
            returnDate={returnDate}
            onOpenSplitPayment={() => setIsPaymentSplitModalOpen(true)}
            hasSplitPayments={splitPayments.length > 0}
          />
        </CustomerDoctorSection>

        <Box sx={{
          marginTop: '8px',
          width: '100%'
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            {!isReturnDetailsMode && (
              <>
                <ApplyGstCheckbox
                  editingRowId={editingRowId}
                  applyGstToAll={applyGstToAll}
                  salesItems={salesItems}
                  onApplyGstToAllChange={useCallback((checked: boolean) => {
                    setApplyGstToAll(checked);
                    if (checked && salesItems.length > 0) {
                      const firstRowItem = salesItems[0];
                      setSalesItems(prev => prev.map(product => ({
                        ...product,
                        cgstPercent: firstRowItem.cgstPercent,
                        sgstPercent: firstRowItem.sgstPercent,
                        igstPercent: firstRowItem.igstPercent,
                        cgst: (parseFloat(product.amount) * parseFloat(firstRowItem.cgstPercent || '0') / 100).toFixed(2),
                        sgst: (parseFloat(product.amount) * parseFloat(firstRowItem.sgstPercent || '0') / 100).toFixed(2),
                        igst: (parseFloat(product.amount) * parseFloat(firstRowItem.igstPercent || '0') / 100).toFixed(2),
                      })));
                    }
                  }, [salesItems])}
                />

                <StandardButton
                  onClick={handleEditCart}
                  variant="text"
                  size="small"
                  startIcon={<EditIcon sx={{ fontSize: '16px' }} />}
                  sx={{
                    color: '#5C17E5',
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  {SALES_RECEIPT_LABELS.EDIT_CART_BUTTON}
                </StandardButton>
              </>
            )}
          </Box>

          <Box sx={{
            width: '100%',
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: '#a8a8a8',
              },
            },
          }} className="print-table-container print-receipt-table">
            <ReusableTable {...tableConfig} />
          </Box>
        </Box>

        <FinancialSummary
          totalValue={totalValue}
          totalDiscount={totalDiscount}
          taxAmount={taxAmount}
          totalPayableAmount={totalPayableAmount}
          onTotalValueChange={isReturnDetailsMode ? () => { } : setTotalValue}
          onTotalDiscountChange={isReturnDetailsMode ? () => { } : setTotalDiscount}
          onTaxAmountChange={isReturnDetailsMode ? () => { } : setTaxAmount}
          onTotalPayableAmountChange={isReturnDetailsMode ? () => { } : setTotalPayableAmount}
        />

        {!isReturnDetailsMode && (
          <ActionButtons
            onCancel={handleCancel}
            onSave={handleSave}
            onPrint={handlePrint}
            isSaveDisabled={!validateRequiredFields().isValid || (isEditMode && !hasChanges())}
            hidePrintButton={isEditMode}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        )}

        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={handleCloseCustomerModal}
          onSubmit={handleCustomerSubmitWrapper}
        />

        <ConfirmationDialog
          open={deleteDialogOpen}
          title={SALES_RECEIPT_LABELS.DELETE_ITEMS_TITLE}
          message={(() => {
            if (itemsToDelete.length === 0) {
              return SALES_RECEIPT_LABELS.DELETE_ITEMS_MESSAGE.replace('{count}', '0');
            }
            const itemsToShow = salesItems.filter(item => itemsToDelete.includes(item.id));
            if (itemsToShow.length === 1) {
              const productName = itemsToShow[0]?.productName || 'this product';
              return `Are you sure you want to delete ${productName}? This action cannot be undone.`;
            } else if (itemsToShow.length > 1) {
              const productNames = itemsToShow.map(item => item.productName || 'Product').filter(Boolean);
              return `Are you sure you want to delete ${itemsToShow.length} items (${productNames.join(', ')})? This action cannot be undone.`;
            }
            return SALES_RECEIPT_LABELS.DELETE_ITEMS_MESSAGE.replace('{count}', String(itemsToDelete.length));
          })()}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />

        <CommonModal
          open={isPrintModalOpen}
          title={SALES_RECEIPT_LABELS.PRINT_PREVIEW_TITLE}
          content={
            <PrintPreviewModal
              salesItems={salesItems}
              customerName={customerName}
              customerMobile={customerMobile}
              customerCity={customerCity}
              doctorName={doctorName}
              doctorMobile={doctorMobile}
              doctorEmail={doctorEmail}
              paymentMode={paymentMode}
              insuranceCompany={insuranceCompany}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              totalValue={totalValue}
              totalDiscount={totalDiscount}
              taxAmount={taxAmount}
              totalPayableAmount={totalPayableAmount}
              patientType={patientType}
              splitPayments={splitPayments}
              onCancel={handleCancelPrint}
              onPrint={handlePrintFromModal}
              onSaveClick={handleSaveFromModal}
              hideActionButtons={true}
              brandIcon={bgWhiteIcon}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          }
          onClose={handleClosePrintModal}
          actionButtons={
            <StandardButton
              onClick={handlePrintFromModal}
              variant="primary"
              size="medium"
            >
              {SALES_RECEIPT_LABELS.PRINT_BUTTON}
            </StandardButton>
          }
        />

        <Toast
          open={snackbarOpen}
          message={snackbarMessage}
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
        />

        <SaleConfirmationDialog
          open={isConfirmDialogOpen}
          onClose={handleConfirmDialogClose}
          onConfirm={handleConfirmDialogConfirm}
          isLoading={isSubmittingSale || isUpdatingSale}
          actionType={pendingAction || 'save'}
        />

        <PaymentSplitModal
          open={isPaymentSplitModalOpen}
          onClose={() => setIsPaymentSplitModalOpen(false)}
          onSave={(payments) => { setSplitPayments(payments); setPaymentMode(''); }}
          totalAmount={parseFloat(totalPayableAmount) || 0}
          existingPayments={splitPayments}
        />
      </SalesReceiptContainer>
    </>
  );
};
export default SalesReceipt;
