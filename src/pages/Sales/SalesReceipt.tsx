import React, { useState, ChangeEvent, useCallback, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import DeleteInvoiceDialog from '../../components/DeleteDialogue/DeleteInvoiceDialog';
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
  useDeleteInvoiceMutation,


  useGetCustomerPhonesMutation,
  useGetCustomerOptionsQuery,
  Customer,
  CustomerOption,
  DoctorPhoneEmailInfo
} from '../../redux/slices/salesApi';
import { useGetProductsQuery } from '../../redux/slices/receiveApi';
import {
  selectCartTotal,
  clearCart,
  clearFormData,
  setCartItems,
  SalesFormData
} from '../../redux/slices/cartSlice';
import { RootState } from '../../redux/store';
import { SALES_RECEIPT_LABELS } from '../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../config/constants/SalesReceipt.constants';
import { clearCartFromStorage, clearFormDataFromStorage, setEditInvoiceId } from '../../utils/cartStorage';

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
import { transformCartItemsForEdit, mergeCartWithApiItems } from './SalesReceipt.handlers';
import { getTableColumns } from './SalesReceipt.columns';
import { useCartLoader } from './hooks/useCartLoader';
import { useFormPersistence } from './hooks/useFormPersistence';
import { useCustomerPhones } from './hooks/useCustomerPhones';
import { useDoctorPhonesAndEmails } from './hooks/useDoctorPhonesAndEmails';
import { handleCustomerSubmit } from './SalesReceipt.customerHandler';
import { executeSave } from './SalesReceipt.saveHandler';
import { useIdempotencyKey } from '../../hooks/useIdempotencyKey';
import { executeSaveDraft } from './SalesReceipt.draftHandler';
import {
  useCreateDraftMutation,
  useUpdateDraftMutation,
  useDeleteDraftMutation,
} from '../../redux/slices/draftsApi';
import {
  SalesReceiptContainer,
  SalesReceiptHeader,
  LeftSection,
  SalesReceiptTitle,
  HorizontalDivider,
  CustomerDoctorSection,
} from './SalesReceipt.styles';

import { getPrintStyles, fieldStyles } from './SalesReceipt.printStyles';
import { paymentMethods } from '../../config/constants/OrderDetail.constants';
import bgWhiteIcon from '../../assets/BG_White.svg';

// Explicit default payment mode (Cash) so state === displayed === saved from the start,
// instead of relying on an empty '' that the UI cosmetically renders as the first option.
const DEFAULT_PAYMENT_MODE = paymentMethods[0];

// Convert an arbitrary date value to the canonical ISO YYYY-MM-DD state format.
// Returns '' for blank/invalid input so callers can fall back to their default.
const normalizeIso = (v: string | undefined | null): string => {
  const s = (v || '').trim();
  if (!s) return '';
  const parsed = dayjs(s);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

const SalesReceipt: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector((state: RootState) => state.auth.user);

  const [submitSale, { isLoading: isSubmittingSale }] = useSubmitSaleMutation();
  const [editSale, { isLoading: isEditingSale }] = useEditSaleMutation();
  // One idempotency key per pending logical submission (submit-sale / edit-sale):
  // reused on retry of the same failed payload, cleared after success.
  const idempotency = useIdempotencyKey();
  const [deleteInvoice, { isLoading: isDeletingInvoice }] = useDeleteInvoiceMutation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [upsertInvoicePayments] = useUpsertInvoicePaymentsMutation();
  const [updateSales, { isLoading: isUpdatingSale }] = useUpdateSalesMutation();
  const [deleteSales] = useDeleteSalesMutation();
  const [addCustomer] = useAddCustomerMutation();

  const [createDraft, { isLoading: isSavingDraft }] = useCreateDraftMutation();
  const [updateDraft, { isLoading: isUpdatingDraft }] = useUpdateDraftMutation();
  const [deleteDraft] = useDeleteDraftMutation();


  const [getInvoiceDetails, { isLoading: isLoadingInvoiceDetails }] = useGetInvoiceDetailsMutation();

  const [getCustomerPhones] = useGetCustomerPhonesMutation();
  const { data: doctorNamesData = [], isLoading: isLoadingDoctorNames } = useGetDoctorNamesQuery();

  // Extract names from doctor objects array to string array for compatibility
  const doctorNames: string[] = useMemo(() => {
    return doctorNamesData.map((doctor: { id: string; name: string } | string) =>
      typeof doctor === 'string' ? doctor : doctor.name
    );
  }, [doctorNamesData]);
  const { data: customerNames = [], refetch: refetchCustomerNames } = useGetAllCustomerNamesQuery();
  // id + name + raw phone for the customer autocomplete (search by name OR mobile).
  const { data: customerOptions = [] } = useGetCustomerOptionsQuery();
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
  const [customerDetails, setCustomerDetails] = useState('');
  const [patientType, setPatientType] = useState<string>('Out Patient'); // Default to 'Out Patient'
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [availablePhones, setAvailablePhones] = useState<string[]>([]);
  // 🔒 Pause flag: prevents phone-lookup hook from overwriting the real ID while addCustomer is in flight
  const isAddingCustomerRef = useRef(false);

  // 🔒 Synchronous guard for the sale-confirmation dialog: blocks a sub-frame
  // double click from starting the submit flow twice.
  const isConfirmingRef = useRef(false);

  // Tracks the sanctioned receipt -> salepage hop ("Edit Cart"), which must keep
  // the cart. Any other unmount clears the working cart/form data.
  const goingToSalepageRef = useRef(false);

  // Clear the working cart when leaving the sale-creation flow. "Edit Cart" is
  // the only exit that keeps the cart (guarded by goingToSalepageRef); finalize/
  // draft/abandon should all leave an empty cart. clearCart/clearFormData are
  // idempotent, so a completed sale (already cleared) and StrictMode's double
  // cleanup in dev are both harmless.
  useEffect(() => {
    return () => {
      if (!goingToSalepageRef.current) {
        dispatch(clearCart());
        dispatch(clearFormData());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [doctorName, setDoctorName] = useState('');
  const [doctorMobile, setDoctorMobile] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [availableDoctorInfo, setAvailableDoctorInfo] = useState<DoctorPhoneEmailInfo[]>([]);

  const [paymentMode, setPaymentMode] = useState(DEFAULT_PAYMENT_MODE);
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
  // Per-medicine "not enough stock" list surfaced when submit-sale returns HTTP 409.
  const [stockShortageLines, setStockShortageLines] = useState<string[]>([]);
  const [stockShortageOpen, setStockShortageOpen] = useState(false);
  const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Check if we're in edit mode or return details mode from location state
  const editModeData = (location.state as any) || null;
  const isEditMode = editModeData?.isEditMode || false;
  const isReturnDetailsMode = editModeData?.isReturnDetailsMode || false;

  // Server draft id — set when resuming a saved draft (via navigation state) or after
  // the first "Save draft" of a fresh sale, so subsequent saves update in place.
  const [activeDraftId, setActiveDraftId] = useState<number | undefined>(
    editModeData?.draftId && !isNaN(Number(editModeData.draftId))
      ? Number(editModeData.draftId)
      : undefined
  );

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
    customerDetails: string;
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
              // Backend currently returns voided payments alongside active ones; skip them so
              // the editor doesn't load stale rows (e.g., old UPI: 13 next to new UPI: 36).
              // Remove this filter once getInvoiceDetails returns only active payments.
              const payments = (result.payments || []).filter((p: any) => {
                const status = String(p?.status || '').toUpperCase();
                const paymentStatus = String(p?.payment_status || '').toUpperCase();
                return status !== 'VOID' && paymentStatus !== 'VOIDED';
              });

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
                  schedule: line.schedule ?? null,
                  // Latent gap (surfaced when result.lines became typed): SalesReceiptItem
                  // requires `type`; the API line carries it as product_type.
                  type: line.product_type || line.type || 'N/A',
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
                // Per the API contract the free-text detail lives on invoice.customer_details (string | null)
                customerDetails: result.invoice?.customer_details || '',
                doctorName: result.doctor_name || result.invoice?.doctor_name || editModeData.doctorName || '',
                doctorMobile: result.doctor_mobile || result.invoice?.doctor_mobile || editModeData.doctorMobile || '',
                doctorEmail: result.doctor_email || result.invoice?.doctor_email || editModeData.doctorEmail || '',
                // Invoice table has no payment_mode column — derive it from the payments array.
                // 1 payment → that payment's method (mapped to dropdown casing).
                // 2+ payments → 'Multiple' (multi-payment UI handles the breakdown separately).
                // 0 payments → fall back to 'Cash'.
                paymentMode: (() => {
                  // Reuse the already-filtered active payments (voided rows excluded above).
                  const paymentsArr = payments;
                  if (paymentsArr.length >= 2) return 'Multiple';
                  if (paymentsArr.length === 1) {
                    const raw = String(paymentsArr[0].payment_method || paymentsArr[0].payment_mode || '').trim();
                    const upper = raw.toUpperCase();
                    const map: Record<string, string> = {
                      'CASH': 'Cash',
                      'UPI': 'UPI',
                      'CREDIT CARD': 'Credit Card',
                      'CREDITCARD': 'Credit Card',
                      'CARD': 'Credit Card',
                      'BANK TRANSFER': 'Bank Transfer',
                      'BANK': 'Bank Transfer',
                      'CHEQUE': 'Cheque',
                      'INSURANCE': 'Insurance',
                      'GOVERNMENT SCHEMES': 'Government Schemes',
                      'GOVT': 'Government Schemes',
                      'CREDIT': 'Credit',
                      'MULTIPLE': 'Multiple',
                    };
                    return map[upper] || raw || DEFAULT_PAYMENT_MODE;
                  }
                  return result.payment_mode || result.invoice?.payment_mode || editModeData.paymentMode || DEFAULT_PAYMENT_MODE;
                })(),
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
                  // Canonical state format is ISO YYYY-MM-DD. The backend already
                  // returns YYYY-MM-DD; normalize any fallback to ISO too (normalizeIso
                  // is hoisted to module scope so restore paths reuse it).
                  const raw = invoice.invoice_date;
                  if (!raw) {
                    return normalizeIso(editModeData.invoiceDate) || getTodayDate();
                  }
                  return normalizeIso(raw) || normalizeIso(editModeData.invoiceDate) || getTodayDate();
                })(),
                salesItems: mappedSalesItems,
                // In Edit Mode, prefer the user's current cart (which may include newly-added
                // products from the "Add Products to Cart" round trip) but merge it with the
                // API items so existing rows keep their real invoice_line_id. New rows stay
                // unmatched and the save handler will correctly send them in the "Added" bucket.
                // If the user opened the invoice fresh (no cartItems passed), fall back to API.
                finalSalesItems: isEditMode
                  ? (Array.isArray(editModeData.cartItems) && editModeData.cartItems.length > 0
                      ? mergeCartWithApiItems(editModeData.cartItems, mappedSalesItems)
                      : mappedSalesItems)
                  : (editModeData.salesItems && editModeData.salesItems.length > 0
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
              setCustomerDetails(invoiceData.customerDetails ?? '');
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
                customerDetails: invoiceData.customerDetails || '',
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

  // Restore the split-payment breakdown once when resuming a saved draft (loss-free);
  // the cart items + form fields are rehydrated via redux before navigation.
  useEffect(() => {
    const draftSplits = editModeData?.draftSplitPayments;
    if (Array.isArray(draftSplits) && draftSplits.length > 0) {
      setSplitPayments(draftSplits);
    }
    // Mount-only: navigation state is fixed for the life of this page instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCustomerAutoFill = useCallback((customer: Customer) => {
    setCustomerMobile(customer.mobile);
    // Protect newly added customer with ID from being overwritten by id: 0 auto-fill during refetch
    setSelectedCustomer(prev => {
      if (prev && prev.id > 0 && (prev.name || '').toLowerCase() === (customer.name || '').toLowerCase()) {
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
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => (name || '').toLowerCase() === normalizedNewName);

    if (isExactMatch && newName.trim()) {
      shouldFetchImmediatelyRef.current = true;
    } else {
      // FIX: Only clear if the name actually changed from what we have and we don't have a valid ID for current name
      setSelectedCustomer(prev => (prev && prev.id > 0 && (prev.name || '').toLowerCase() === normalizedNewName) ? prev : null);
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
    const isExactMatch = doctorNames.length > 0 && doctorNames.some(name => (name || '').toLowerCase() === normalizedNewName);

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
    customerDetails,
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
      setCustomerDetails(formData.customerDetails || '');
      setPatientType(formData.patientType || 'Out Patient');
      setDoctorName(formData.doctorName);
      setDoctorMobile(formData.doctorMobile);
      setDoctorEmail(formData.doctorEmail);
      // Set paymentMode from form data, or the explicit default if empty
      setPaymentMode(formData.paymentMode || DEFAULT_PAYMENT_MODE);
      setInsuranceCompany(formData.insuranceCompany);
      // invoiceNumber is deliberately NOT restored: the backend assigns it at submit,
      // so a persisted/draft value is stale — the field stays "Auto-generated".
      // Normalize the restored value: a cart persisted before the ISO migration holds a
      // legacy "DD MMM YYYY" string, which the strict save-validation would now reject.
      // Empty/invalid → leave the ISO default already in state.
      const restoredIso = normalizeIso(formData.invoiceDate);
      if (restoredIso) setInvoiceDate(restoredIso);
    }, []),
    onCustomerRestored: useCallback((customer) => {
      if (!customer) return;
      setSelectedCustomer(prev => {
        // Protect from restoring a stale ID:0 object if we already have a valid one
        if (prev && prev.id > 0 && (prev.name || '').toLowerCase() === (customer.name || '').toLowerCase()) return prev;
        // Keep identity stable for an equivalent restore — a fresh object here re-runs
        // the persistence save effect and loops until React aborts (page crash).
        if (prev && prev.id === customer.id && prev.name === customer.name && prev.mobile === customer.mobile) return prev;
        return customer;
      });
    }, [])
  });

  // NOTE: no client-side invoice-number generation. The backend assigns the number at
  // submit and returns it in the response (executeSave → onInvoiceNumberAssigned).

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
      // Only drop the selection. The fields the user is typing into must survive —
      // clearing them here used to wipe keystrokes (the child clears the selection
      // whenever the typed text diverges from it). Explicit field clearing is done
      // by the callers that actually mean it (e.g. the name field's clear button).
      setSelectedCustomer(null);
    }
  };

  // A concrete customer picked from the autocomplete (by name or by mobile number):
  // auto-fill name + mobile + id. City intentionally untouched (the options endpoint
  // carries no city; matches the existing get-customer-phones auto-fill semantics).
  const handleCustomerOptionSelect = (option: CustomerOption) => {
    const numericId = Number(option.id);
    setSelectedCustomer({
      id: Number.isFinite(numericId) ? numericId : 0,
      name: option.name,
      mobile: option.phone ?? '',
      city: customerCity || '',
    });
    setCustomerName(option.name);
    setCustomerMobile(option.phone ?? '');
    // Preserve the existing duplicate-name flow: fetch this name's phones so the
    // mobile field still offers them as a picker.
    shouldFetchImmediatelyRef.current = true;
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

  // Permanently delete the invoice currently being edited.
  // Backend restores stock and recalculates totals; cache invalidation refreshes the
  // Sale History list, so we just navigate back after success.
  const handleConfirmDeleteInvoice = async (reason: string) => {
    if (!resolvedInvoiceId || resolvedInvoiceId <= 0) {
      showToast('Invoice ID could not be resolved. Please refresh and try again.', 'error');
      return;
    }
    try {
      await deleteInvoice({
        invoice_id: resolvedInvoiceId,
        deleted_by: user?.username || 'Guest',
        deletion_reason: reason,
      }).unwrap();
      showToast(`Invoice ${invoiceNumber || ''} deleted successfully`, 'success');
      setIsDeleteDialogOpen(false);
      setTimeout(() => navigate('/sales'), 800);
    } catch (err) {
      const errorMessage = (err as any)?.data?.error || (err as any)?.data?.message || (err as any)?.message || 'Failed to delete invoice. Please try again.';
      showToast(String(errorMessage), 'error');
    }
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
    // Mark this cart as belonging to an edit session
    setEditInvoiceId(resolvedInvoiceId || invoiceNumber);
    // When resuming an existing draft, snapshot the receipt-owned values (the same
    // ones executeSaveDraft persists) so salepage's abandon-UPDATE can preserve them
    // instead of nulling them via the backend's full-replace PUT.
    let draftPreserve: {
      customer_id?: number;
      invoice_number?: string;
      invoice_date?: string;
      financials: { totalValue: string; totalDiscount: string; taxAmount: string; totalPayableAmount: string };
      splitPayments: any[];
      doctorId?: number;
      patientType: string;
    } | undefined;
    if (activeDraftId != null) {
      const matchedDoctor = doctorNamesData.find((d: any) =>
        (typeof d === 'string' ? d : d.name) === doctorName
      );
      const doctorId = matchedDoctor && typeof matchedDoctor === 'object' ? Number(matchedDoctor.id) : undefined;
      const customerId = (selectedCustomer?.id && selectedCustomer.id > 0) ? selectedCustomer.id : undefined;
      const invoice_date = /^\d{4}-\d{2}-\d{2}$/.test((invoiceDate || '').trim())
        ? invoiceDate.trim()
        : undefined;
      draftPreserve = {
        customer_id: customerId,
        invoice_number: invoiceNumber || undefined,
        invoice_date,
        financials: { totalValue, totalDiscount, taxAmount, totalPayableAmount },
        splitPayments,
        doctorId,
        patientType,
      };
    }
    // Navigate to sales/new page to edit/add products to cart
    // Pass edit mode state so we can return to edit mode correctly
    // Sanctioned receipt -> salepage hop: keep the cart populated.
    goingToSalepageRef.current = true;
    navigate('/sales/new', {
      state: {
        isEditMode,
        invoiceId: resolvedInvoiceId,
        invoiceNumber,
        originalInvoiceData,
        draftId: activeDraftId,
        draftPreserve
      }
    });
  }, [salesItems, dispatch, navigate, isEditMode, resolvedInvoiceId, invoiceNumber, originalInvoiceData, activeDraftId, doctorNamesData, doctorName, selectedCustomer, invoiceDate, totalValue, totalDiscount, taxAmount, totalPayableAmount, splitPayments, patientType]);

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
        orientation: orientation,
        splitPayments: splitPayments,
      });

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // The generated document self-paginates once fonts are ready, then calls
      // window.print() and closes itself on afterprint — do NOT print from here
      // (doing so would fire before pagination and print an unpaginated page).

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
    // Synchronous re-entry guard: a sub-frame double click must not start the
    // submit flow twice (state updates like setIsConfirmDialogOpen are async).
    if (isConfirmingRef.current) {
      return;
    }
    isConfirmingRef.current = true;
    try {
      await runConfirmedAction();
    } finally {
      isConfirmingRef.current = false;
    }
  };

  const runConfirmedAction = async () => {
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
    setCustomerDetails('');
    setPatientType('Out Patient');
    setSelectedCustomer(null);
    setDoctorName('');
    setDoctorMobile('');
    setDoctorEmail('');
    setSelectedDoctor(null);
    setAvailableDoctorInfo([]);
    setPaymentMode(DEFAULT_PAYMENT_MODE);
    setInsuranceCompany('');
    setTotalValue('');
    setTotalDiscount('');
    setTaxAmount('');
    setTotalPayableAmount('');
    setSelectedRows([]);
    setEditingRowId(null);
    setSplitPayments([]); // Reset split payments
    // Drop the server-assigned number from the finished sale so the next sale (and any
    // draft saved from this mount — draftHandler / draftPreserve) starts Auto-generated.
    setInvoiceNumber('');
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
      safeTrim(customerDetails) !== safeTrim(originalInvoiceData.customerDetails) ||
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
    customerDetails,
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
      customerDetails,
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
      // Show the server-assigned number in the UI (print preview / printed receipt).
      onInvoiceNumberAssigned: setInvoiceNumber,
      onStockShortage: (lines: string[]) => {
        setStockShortageLines(lines);
        setStockShortageOpen(true);
      },
      onSaleSaved: activeDraftId
        ? async () => {
            try {
              await deleteDraft(activeDraftId).unwrap();
            } catch {
              // idempotent DELETE — ignore (draft may already be gone)
            }
            setActiveDraftId(undefined);
          }
        : undefined,
      splitPayments: effectiveSplitPayments,
      upsertInvoicePayments,
      idempotency,
    });
  }, [customerName, customerMobile, customerCity, customerDetails, patientType, doctorName, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, salesItems, totalValue, totalDiscount, taxAmount, totalPayableAmount, selectedCustomer, apiProducts, isProductsLoading, isProductsError, productsError, user, submitSale, editSale, updateSales, showToast, navigate, dispatch, isEditMode, editModeData, originalInvoiceData, resetForm, doctorNamesData, splitPayments, upsertInvoicePayments, getCustomerPhones, activeDraftId, deleteDraft, idempotency]);

  const handleSaveDraft = useCallback(async () => {
    const matchedDoctor = doctorNamesData.find((d: any) =>
      (typeof d === 'string' ? d : d.name) === doctorName
    );
    const doctorId = matchedDoctor && typeof matchedDoctor === 'object' ? Number(matchedDoctor.id) : undefined;
    const customerId = (selectedCustomer?.id && selectedCustomer.id > 0) ? selectedCustomer.id : undefined;

    const formData: SalesFormData = {
      customerName,
      customerMobile,
      customerCity,
      customerDetails,
      patientType,
      doctorName,
      doctorMobile,
      doctorEmail,
      paymentMode,
      insuranceCompany,
      invoiceNumber,
      invoiceDate,
      customerId,
    };

    const saved = await executeSaveDraft({
      draftId: activeDraftId,
      formData,
      salesItems,
      financials: { totalValue, totalDiscount, taxAmount, totalPayableAmount },
      splitPayments,
      doctorId,
      patientType,
      customerName,
      customerMobile,
      customerId,
      invoiceNumber,
      invoiceDate,
      createDraft,
      updateDraft,
      showToast,
      onCreated: setActiveDraftId,
    });

    // On a successful save (create or update), leave the creation flow and return
    // to the sales homepage. The receipt's unmount-guard clears the working cart /
    // formData automatically (draft is persisted server-side; drafts list refetches
    // via the invalidated 'Drafts' tag). Empty-cart and error paths keep the user here.
    if (saved) {
      navigate(SALES_RECEIPT_CONSTANTS.ROUTE_SALES);
    }
  }, [doctorNamesData, doctorName, selectedCustomer, customerName, customerMobile, customerCity, customerDetails, patientType, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, activeDraftId, salesItems, totalValue, totalDiscount, taxAmount, totalPayableAmount, splitPayments, createDraft, updateDraft, navigate]);

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
      <style>{getPrintStyles(pageSize, orientation)}</style>
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
            customerDetails={customerDetails}
            patientType={patientType}
            selectedCustomer={selectedCustomer}
            customerOptions={customerOptions}
            availablePhones={availablePhones}
            onCustomerNameChange={isReturnDetailsMode ? () => { } : handleCustomerNameChange}
            onCustomerSelect={isReturnDetailsMode ? () => { } : handleCustomerSelect}
            onCustomerOptionSelect={isReturnDetailsMode ? () => { } : handleCustomerOptionSelect}
            onCustomerMobileChange={isReturnDetailsMode ? () => { } : setCustomerMobile}
            onCustomerCityChange={isReturnDetailsMode ? () => { } : setCustomerCity}
            onCustomerDetailsChange={isReturnDetailsMode ? () => { } : setCustomerDetails}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mt: '24px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#616161' }}>Page Size:</Typography>
                <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
                  {(['A4', 'A5'] as const).map((size) => (
                    <Box
                      key={size}
                      onClick={() => setPageSize(size)}
                      sx={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: pageSize === size ? '#FFFFFF' : 'transparent',
                        color: pageSize === size ? '#5C17E5' : '#6B7280',
                        boxShadow: pageSize === size ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: pageSize === size ? '#FFFFFF' : '#E5E7EB',
                        },
                      }}
                    >
                      {size}
                    </Box>
                  ))}
                </Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#616161', ml: '8px' }}>{SALES_RECEIPT_LABELS.ORIENTATION_LABEL}</Typography>
                <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
                  {([
                    { value: 'landscape', label: SALES_RECEIPT_LABELS.ORIENTATION_LANDSCAPE },
                    { value: 'portrait', label: SALES_RECEIPT_LABELS.ORIENTATION_PORTRAIT },
                  ] as const).map((option) => (
                    <Box
                      key={option.value}
                      onClick={() => setOrientation(option.value)}
                      sx={{
                        padding: '6px 12px',
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
                        },
                      }}
                    >
                      {option.label}
                    </Box>
                  ))}
                </Box>
              </Box>
              {isEditMode && resolvedInvoiceId > 0 && (
                <Typography
                  onClick={() => setIsDeleteDialogOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsDeleteDialogOpen(true);
                    }
                  }}
                  sx={{
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    fontFamily: "'Lexend', sans-serif",
                    userSelect: 'none',
                    '&:hover': {
                      color: '#B91C1C',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Delete Invoice
                </Typography>
              )}
            </Box>
            <ActionButtons
              onCancel={handleCancel}
              onSave={handleSave}
              onSaveDraft={isEditMode ? undefined : handleSaveDraft}
              onPrint={handlePrint}
              isSaveDisabled={!validateRequiredFields().isValid || (isEditMode && !hasChanges())}
              isSaveDraftDisabled={salesItems.length === 0 || isSavingDraft || isUpdatingDraft}
              hidePrintButton={isEditMode}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              orientation={orientation}
              onOrientationChange={setOrientation}
              hidePageSize
            />
          </Box>
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

        <ConfirmationDialog
          open={stockShortageOpen}
          title="Not enough stock"
          message={
            <Box sx={{ textAlign: 'left' }}>
              <Typography sx={{ mb: 1.5, fontSize: '15px', color: '#374151' }}>
                These items don't have enough stock. Please reduce the quantities (or pick another
                batch) and try again:
              </Typography>
              {stockShortageLines.map((line, idx) => (
                <Typography key={idx} sx={{ fontSize: '14px', mb: 0.5, color: '#B91C1C', fontWeight: 500 }}>
                  {line}
                </Typography>
              ))}
            </Box>
          }
          confirmLabel="OK"
          cancelLabel="Close"
          onClose={() => setStockShortageOpen(false)}
          onConfirm={() => setStockShortageOpen(false)}
          onCancel={() => setStockShortageOpen(false)}
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
              brandIcon={bgWhiteIcon}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              orientation={orientation}
              onOrientationChange={setOrientation}
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
          onSave={(payments) => { setSplitPayments(payments); setPaymentMode(DEFAULT_PAYMENT_MODE); }}
          totalAmount={parseFloat(totalPayableAmount) || 0}
          existingPayments={splitPayments}
        />

        <DeleteInvoiceDialog
          open={isDeleteDialogOpen}
          invoiceNumber={invoiceNumber || ''}
          isDeleting={isDeletingInvoice}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDeleteInvoice}
        />
      </SalesReceiptContainer>
    </>
  );
};
export default SalesReceipt;
