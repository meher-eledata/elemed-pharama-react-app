import React, { useState, ChangeEvent, useCallback, useEffect, useMemo } from 'react';
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
  useSearchCustomersMutation,
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
  const [searchCustomers] = useSearchCustomersMutation();
  const [getInvoiceDetails, { isLoading: isLoadingInvoiceDetails }] = useGetInvoiceDetailsMutation();
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
      let invoiceId: number | null = null;
      let invoiceNumber: string | null = null;

      // CRITICAL: Always use invoice_number if available - it's the source of truth
      if (editModeData.invoiceNumber) {
        // Strip "INV" prefix if present - backend expects only numeric part
        let fullInvoiceNumber = editModeData.invoiceNumber.toString().trim();
        invoiceNumber = fullInvoiceNumber.toUpperCase().startsWith('INV')
          ? fullInvoiceNumber.replace(/^INV/i, '').trim()
          : fullInvoiceNumber;
        console.log('📝 Prepared invoice number for API fetch. Original:', fullInvoiceNumber, '→ Sending:', invoiceNumber);
      }

      // Also get invoiceId if available (for fallback only if invoice_number fails)
      const rawStateId = editModeData.invoiceId || editModeData.invoice_id;
      if (rawStateId) {
        const parsedId = Number(rawStateId);
        if (!isNaN(parsedId) && parsedId > 0) {
          invoiceId = parsedId;
        }
      }

      console.log('📋 Diagnostic: Edit mode data resolved:', { invoiceId, invoiceNumber, rawStateId });

      // MUST have at least invoice_number to proceed
      if (!invoiceNumber && !invoiceId) {
        console.error('❌ No invoice_number or invoice_id available');
        alert('Cannot load invoice: No invoice number or ID provided');
        navigate('/sales');
        return;
      }

      if (invoiceNumber || invoiceId) {
        const fetchInvoiceDetails = async () => {
          try {
            // STRATEGY:
            // 1. Try fetching by unique 'invoice_id' (Database primary key) first.
            //    This is the only way to avoid mismatches when duplicate invoice numbers exist.
            // 2. If 'invoice_id' fails with 404, fallback to 'invoice_number' (Legacy support).
            let result;
            let firstAttemptError: any = null;

            if (invoiceId && invoiceId > 0) {
              console.log(`🔍 Attempting to fetch details for Invoice ID: ${invoiceId}`);
              try {
                result = await getInvoiceDetails({ invoice_id: Number(invoiceId) }).unwrap();
                console.log('✅ Found invoice by unique ID');
              } catch (err: any) {
                firstAttemptError = err;
                if (err.status === 404 && invoiceNumber) {
                  console.warn('⚠️ Invoice ID not found, trying fallback to Invoice Number...');
                } else {
                  throw err; // Rethrow if not a 404 or no numeric fallback available
                }
              }
            }

            // Fallback to invoice_number if first attempt failed or was skipped
            if (!result && invoiceNumber) {
              console.log(`📡 Attempting fallback: Fetching details for Invoice Number: ${invoiceNumber}`);
              result = await getInvoiceDetails({ invoice_number: invoiceNumber }).unwrap();
              console.log('✅ Found invoice by number (Fallback)');
            }

            if (!result) {
              console.error('❌ Data Retrieval Failed: No result returned from API');
              throw firstAttemptError || new Error('No unique invoice_id or invoice_number available');
            }

            if (result) {
              const invoice = result.invoice || {};
              const lines = result.lines || [];
              const payments = result.payments || [];

              // Map payments from API to splitPayments state
              if (Array.isArray(payments) && payments.length > 0) {
                const mappedPayments = payments.map((p: any) => ({
                  mode: p.payment_method || 'Cash',
                  amount: parseFloat(p.payment_amount || '0').toString()
                }));
                // Filter out return payments (OUT direction) if necessary, 
                // but usually we want to see what was paid.
                setSplitPayments(mappedPayments.filter((p: any) => parseFloat(p.amount) > 0));
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
                discountPercentValue = (discValue > 0 && discValue <= 1)
                  ? (discValue * 100).toString()
                  : discValue.toString();

                // ROBUST TAX PERCENTAGE DERIVATION:
                // Trust the stored value if it looks like a percentage (0-30)
                // Only fall back to math derivation for old invoices storing absolute amounts
                const deriveTaxPercent = (storedVal: any, base: number, defaultVal: string) => {
                  const val = parseFloat(storedVal || '0');

                  // Priority 1: If value is already a reasonable percentage (0.1% to 30%), USE IT DIRECTLY
                  // This ensures rates like 7%, 10%, 15% etc. are preserved and not snapped to 5 or 9
                  if (val > 0.1 && val <= 30) return val.toString();

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

                return {
                  id: line.invoice_line_id?.toString() || line.id?.toString() || '',
                  productName: line.name || line.product_name || line.productName || '', // API returns 'name' field
                  product_id: line.product_id || undefined, // Preserve product_id from API (important for batch validation)
                  manufacturer: line.brand_name || line.manufacturer || '', // API returns 'brand_name' field
                  batch: line.batch_number || line.batch || '',
                  expiryDate: line.expiry_date || line.expiryDate || '',
                  quantity: (line.quantity || line.qty || '1').toString(),
                  unitPrice: line.rate?.toString() || line.unit_price?.toString() || '0',
                  mrp: line.mrp?.toString() || '0',
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
                customerMobile: result.customer_mobile || result.invoice?.customer_mobile || editModeData.customerMobile || '',
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
                  // Fix: 0 is Out Patient, 1 is In Patient
                  if (raw === 1 || str === '1' || str.includes('INPATIENT') || (str.includes('IN') && !str.includes('OUT'))) {
                    return 'In Patient';
                  }
                  return 'Out Patient';
                })(),
                invoiceNumber: (invoice.invoice_number ? `INV${invoice.invoice_number}` : '') || (result.invoice_number ? `INV${result.invoice_number}` : '') || editModeData.invoiceNumber || '',
                invoiceDate: invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-GB').split('/').reverse().join('-') : (editModeData.invoiceDate || getTodayDate()),
                salesItems: mappedSalesItems,
                finalSalesItems: (editModeData.salesItems && editModeData.salesItems.length > 0)
                  ? editModeData.salesItems
                  : mappedSalesItems,
                totalValue: (editModeData.salesItems && editModeData.salesItems.length > 0)
                  ? (editModeData.totalValue || editModeData.totalAmount?.toString() || '0')
                  : (invoice.total_amount?.toString() || result.total_value?.toString() || result.totalValue?.toString() || '0'),
                totalDiscount: (editModeData.salesItems && editModeData.salesItems.length > 0)
                  ? (editModeData.totalDiscount || '0')
                  : (invoice.discount?.toString() || result.total_discount?.toString() || result.totalDiscount?.toString() || '0'),
                taxAmount: (editModeData.salesItems && editModeData.salesItems.length > 0)
                  ? (editModeData.taxAmount || '0')
                  : (result.tax_amount?.toString() || result.taxAmount?.toString() || '0'),
                totalPayableAmount: (editModeData.salesItems && editModeData.salesItems.length > 0)
                  ? (editModeData.totalPayableAmount || editModeData.totalAmount?.toString() || '0')
                  : (invoice.total_amount?.toString() || result.total_payable_amount?.toString() || result.totalPayableAmount?.toString() || '0'),
              };

              // Pre-populate form fields from API data
              if (invoiceData.customerName) setCustomerName(invoiceData.customerName);
              if (invoiceData.customerMobile) setCustomerMobile(invoiceData.customerMobile);
              if (invoiceData.customerCity) setCustomerCity(invoiceData.customerCity);
              if (invoiceData.doctorName) {
                setDoctorName(invoiceData.doctorName);
                setSelectedDoctor(invoiceData.doctorName);
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
              invoiceId,
              invoiceNumber: editModeData.invoiceNumber,
              errorStatus: (error as any)?.status,
              errorData: (error as any)?.data,
            });
            // Do NOT use fallback data from location state
            const errData = (error as any)?.data;
            const errStatus = (error as any)?.status;
            const errMessage = errData?.error || (error as any)?.message || 'Unknown error';

            if (errStatus === 404) {
              alert(
                `Invoice Not Found on Server (404)\n\n` +
                `The invoice "${editModeData.invoiceNumber}" exists in your local history, but the server couldn't find it.\n\n` +
                `Common Reason: If you recently restarted your backend server, it might have cleared its temporary database, ` +
                `but your browser still remembers the old record.\n\n` +
                `Solution: Create the sale again or ensure your backend database is permanent.`
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
  }, [location.state, getInvoiceDetails, navigate]);

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
    onPhoneClear: handlePhoneClear
  });

  const handleCustomerNameChange = async (newName: string) => {
    const normalizedNewName = newName.trim().toLowerCase();
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedNewName);

    if (isExactMatch && newName.trim()) {
      shouldFetchImmediatelyRef.current = true;

      // Fetch customer details to get the ID
      try {
        const results = await searchCustomers({ searchTerm: newName.trim() }).unwrap();
        // Find exact match
        const match = results.find(c => c.name.toLowerCase() === normalizedNewName);
        if (match) {
          console.log('✅ Found customer ID:', match.id);
          setSelectedCustomer(match);
        }
      } catch (err) {
        console.warn('Failed to resolve customer ID', err);
      }
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
  // This generates and reserves the invoice number immediately so it's visible to the user
  useEffect(() => {
    if (!isEditMode && !invoiceNumber) {
      const nextInvoiceNumber = generateNextInvoiceNumber();
      setInvoiceNumber(nextInvoiceNumber);
      console.log('📝 Generated and reserved invoice number on mount:', nextInvoiceNumber);
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
      },
      onClose: handleCloseCustomerModal,
    });
  }, [addCustomer, refetchCustomerNames, showToast]);

  const handleEditCart = useCallback(() => {
    const cartItemsWithGst = transformCartItemsForEdit(salesItems);
    dispatch(setCartItems(cartItemsWithGst));
    // Navigate to sales/new page to edit/add products to cart
    navigate('/sales/new');
  }, [salesItems, dispatch, navigate]);

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

    // We no longer rely on customersData matching since we handle it in real-time
    // during selection/search or via auto-creation in executeSave

    await executeSave({
      customerName,
      customerMobile,
      customerCity,
      patientType,
      doctorName,
      doctorId,
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
      selectedCustomer,
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
      invoiceId: isEditMode && editModeData?.invoiceId ? editModeData.invoiceId : undefined,
      isEditMode,
      editModeData,
      originalSalesItems: originalInvoiceData?.salesItems,
      skipNavigation,
      onSuccess,
      splitPayments, // Pass split payments to save handler
      upsertInvoicePayments, // Pass the mutation function
    });
  }, [customerName, customerMobile, customerCity, patientType, doctorName, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, salesItems, totalValue, totalDiscount, taxAmount, totalPayableAmount, selectedCustomer, apiProducts, isProductsLoading, isProductsError, productsError, user, submitSale, editSale, updateSales, showToast, navigate, dispatch, isEditMode, editModeData, originalInvoiceData, resetForm, doctorNamesData, splitPayments, upsertInvoicePayments]);

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
            invoiceDate={invoiceDate ? new Date(invoiceDate).toLocaleDateString('en-GB') : ''}
            onPaymentModeChange={setPaymentMode}
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
              onCancel={handleCancelPrint}
              onPrint={handlePrintFromModal}
              onSaveClick={handleSaveFromModal}
              hideActionButtons={true}
              brandIcon={bgWhiteIcon}
              pageSize={pageSize.toLowerCase() as 'a4' | 'a5'}
              splitPayments={splitPayments}
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
          onSave={(payments) => setSplitPayments(payments)}
          totalAmount={parseFloat(totalPayableAmount) || 0}
          existingPayments={splitPayments}
        />
      </SalesReceiptContainer>
    </>
  );
};
export default SalesReceipt;
