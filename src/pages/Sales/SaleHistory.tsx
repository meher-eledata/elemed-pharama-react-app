import React, { useState, useMemo, ChangeEvent, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, TextField, InputAdornment, Badge, Tooltip, Chip, FormControl, Autocomplete } from '@mui/material';
import { StandardButton } from '../../components/Common';
import DateRangeFilter from '../../components/mainDashboard/DateRangeFilter/DateRangeFilter';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import CommonModal from '../../components/CommonModal/CommonModal';
import PrintPreviewModal from '../../components/Modal/PrintPreview/PrintPreviewModal';
import SaleConfirmationDialog from '../../components/Modal/SaleConfirmation/SaleConfirmationDialog';
import { SALES_RECEIPT_LABELS } from '../../config/label/SalesReceipt.labels';
import { SALES_HISTORY_LABELS } from '../../config/label/SalesHistory.labels';
import { SALES_HISTORY_CONSTANTS } from '../../config/constants/SalesHistory.constants';
import bgWhiteIcon from '../../assets/BG_White.svg';
import { SalesReceiptItem as SalesApiReceiptItem, useGetInvoicesQuery, useGetInvoiceDetailsMutation } from '../../redux/slices/salesApi';
import { generatePrintHTML } from './SalesReceipt.utils';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getSalesHistoryFromStorage, getEditInvoiceId, clearEditInvoiceId } from '../../utils/cartStorage';
import { clearCart, clearFormData } from '../../redux/slices/cartSlice';
import { recalculateSalesItemAmount } from './SalesReceipt.utils.calculation';

// Load the customParseFormat plugin once at module scope so strict format strings
// (e.g. 'DD/MM/YYYY') are honored. Without it dayjs silently ignores the format and
// falls back to the native parser, which can't read DD/MM/YYYY → Invalid Date.
dayjs.extend(customParseFormat);

// Robust multi-format invoice-date parser shared by the date FILTER and SORT.
// Handles DD/MM/YYYY, YYYY-MM-DD, and standard parses like "20 Mar 2026".
// Returns a timestamp (ms); 0 for unparseable/empty values so callers can guard.
const parseInvoiceDate = (val: unknown): number => {
  if (!val) return 0;
  const strVal = String(val).trim();

  // 1. Try explicit DD/MM/YYYY or YYYY-MM-DD FIRST to prevent US date format mixups.
  const parts = strVal.split(/[/-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      // If format is YYYY-MM-DD
      if (p0 > 1000) {
        return new Date(p0, p1 - 1, p2).getTime();
      }
      // Else assume DD/MM/YYYY
      return new Date(p2, p1 - 1, p0).getTime();
    }
  }

  // 2. Try standard Date parse (works for formats like "20 Mar 2026").
  const stdTime = Date.parse(strVal);
  if (!isNaN(stdTime)) return stdTime;

  // 3. Fallback to dayjs.
  const d = dayjs(strVal);
  return d.isValid() ? d.valueOf() : 0;
};

// Invoice table has no payment_mode column — derive it from the payments array.
// 1 active payment → that payment's method (mapped to dropdown casing).
// 2+ active payments → 'Multiple' (multi-payment UI handles the breakdown separately).
// 0 active payments → 'Cash' fallback.
const PAYMENT_METHOD_MAP: Record<string, string> = {
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
const derivePaymentMode = (paymentsArr: any[], fallback?: string): string => {
  const arr = Array.isArray(paymentsArr) ? paymentsArr : [];
  if (arr.length >= 2) return 'Multiple';
  if (arr.length === 1) {
    const raw = String(arr[0]?.payment_method || arr[0]?.paymentMethod || arr[0]?.payment_mode || '').trim();
    if (!raw) return fallback || 'Cash';
    return PAYMENT_METHOD_MAP[raw.toUpperCase()] || raw;
  }
  return fallback || 'Cash';
};

export interface SalesHistoryItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: number;
  customerName: string;
  customerMobile: string;
  customerCity: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  username: string;
  patientType?: string; // Patient type: "In Patient" or "Out Patient"
  totalAmount: number;
  totalReturnedAmount: number;
  paymentMode: string;
  splitPayments: any[];
  // Return information (populated directly from backend list)
  hasReturn: boolean;
  lastReturnStatus: string | null;
  createdAt?: string;
  databaseInvoiceId?: number;
  recordStatus?: string;
  deletionReason?: string;
  returnInfo?: {
    totalItems: number; // Total items in invoice
    returnedItems: number; // Total items returned
    isFullReturn: boolean; // Whether all items are returned
    returnDetails?: Array<{
      productName: string;
      originalQuantity: number;
      returnedQuantity: number;
      returnDate?: string;
    }>;
  };
}

export interface InvoiceDetails {
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
  salesItems: SalesReceiptItem[];
  totalValue: string;
  totalDiscount: string;
  taxAmount: string;
  totalPayableAmount: string;
  splitPayments: any[];
}

export default function SaleHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.user);

  const { data: invoicesData, isLoading: isLoadingInvoices, error: invoicesError, refetch: refetchInvoices } = useGetInvoicesQuery();
  const [getInvoiceDetails] = useGetInvoiceDetailsMutation();


  const [returnInfoMap, setReturnInfoMap] = useState<Map<number, { totalItems: number; returnedItems: number; isFullReturn: boolean }>>(new Map());

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilterKey, setCurrentFilterKey] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'invoiceDate',
    direction: 'desc'
  });

  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'print' | null>(null);
  const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A4');

  // Force refresh of saved history when location changes (e.g., after edit or return)
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Reload saved history when component mounts or when navigating back
    setRefreshKey(prev => prev + 1);
    // Also refetch invoices to get updated return information
    refetchInvoices();
  }, [location.pathname, refetchInvoices]);

  const savedHistory = useMemo(() => getSalesHistoryFromStorage(), [refreshKey]);

  const salesHistoryData: SalesHistoryItem[] = useMemo(() => {
    const formatToDDMMYYYY = (dateStr: string) => {
      if (!dateStr) return '';
      // Quick check if already roughly DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

      const stdTime = Date.parse(dateStr);
      if (!isNaN(stdTime)) {
        const d = new Date(stdTime);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
      }

      const d = dayjs(dateStr);
      if (d.isValid()) return d.format('DD/MM/YYYY');

      return dateStr;
    };

    const savedItems: SalesHistoryItem[] = savedHistory.map((item: any, index: number) => ({
      id: item.id || `saved_${index}`,
      invoiceNumber: item.invoiceNumber || '',
      invoiceDate: formatToDDMMYYYY(item.invoiceDate || ''),
      customerId: Number(item.customerId) || 0,
      customerName: item.customerName || '',
      customerMobile: item.customerMobile || '',
      customerCity: item.customerCity || '',
      doctorName: item.doctorName || '',
      doctorMobile: item.doctorMobile || '',
      doctorEmail: item.doctorEmail || '',
      username: item.username || 'Guest',
      patientType: item.patientType || 'Out Patient', // Default to "Out Patient" if not specified
      totalAmount: item.totalAmount || 0,
      totalReturnedAmount: 0,
      paymentMode: (item.splitPayments && item.splitPayments.length > 0)
        ? item.splitPayments.map((p: any) => p.paymentMethod || p.payment_method || 'Cash').join(' / ')
        : (item.paymentMode || 'Cash'),
      splitPayments: item.splitPayments || [],
      hasReturn: false,
      lastReturnStatus: null,
    }));
    const savedItemsMap = new Map<string, SalesHistoryItem>();
    savedItems.forEach(item => {
      if (item.invoiceNumber) {
        savedItemsMap.set(item.invoiceNumber, item);
      }
    });
    const uniqueSavedItems = Array.from(savedItemsMap.values());

    if (!invoicesData || !Array.isArray(invoicesData)) {
      return uniqueSavedItems;
    }

    const apiItems: SalesHistoryItem[] = invoicesData.map((invoice: any, index: number) => {
      const dateSource = invoice.invoice_date || invoice.created_at;
      const invoiceDate = dateSource ? dayjs(dateSource).format('DD MMM YYYY') : '';

      // Convert patient_type from number to string (0 = "In Patient", 1 = "Out Patient")
      let patientType = 'Out Patient'; // Default
      if (invoice.patient_type !== undefined && invoice.patient_type !== null) {
        patientType = (Number(invoice.patient_type) === 0) ? 'In Patient' : 'Out Patient';
      }

      // Handle invoice_number formatting - use invoice_number if available, otherwise use invoice.id
      let formattedInvoiceNumber: string;

      // Check if invoice_number is valid (not null, undefined, empty string, or string "null")
      const invoiceNum = invoice.invoice_number;
      const invoiceNumStr = String(invoiceNum || '').trim();

      // Check if invoice_number already has "INV" prefix (backend might store it with prefix)
      const hasInvPrefix = invoiceNumStr.toUpperCase().startsWith('INV');
      const numericPart = hasInvPrefix
        ? invoiceNumStr.replace(/^INV/i, '').trim()
        : invoiceNumStr;

      // CRITICAL: Identify the actual database primary key from ALL possible field names
      const databaseId = Number(invoice.id || invoice.invoice_id || invoice.InvoiceID || invoice.invoiceId || 0);

      // For the table's internal "id" (used for row selection and keys), 
      // we need something unique. If no database ID exists, we'll generate one.
      const tableRowId = databaseId || (invoice.invoice_number ? (parseInt(numericPart) || (index + 500000)) : (index + 500000));

      const numValue = Number(numericPart);
      const hasValidInvoiceNumber = invoiceNum !== null
        && invoiceNum !== undefined
        && invoiceNum !== ''
        && invoiceNumStr.toLowerCase() !== 'null'
        && !isNaN(numValue)
        && numValue > 0; // Must be a positive number

      if (hasValidInvoiceNumber) {
        formattedInvoiceNumber = hasInvPrefix ? invoiceNumStr : `INV${numericPart}`;
      } else if (invoice.id) {
        formattedInvoiceNumber = `INV${invoice.id}`;
      } else {
        formattedInvoiceNumber = `INV${index + 1000}`;
      }

      const rawReturnStatus = invoice.return_status || invoice.last_return_status || 'No Return';
      const hasReturn = invoice.has_return !== undefined ? invoice.has_return : (rawReturnStatus.toLowerCase() !== 'no return' && rawReturnStatus.toLowerCase() !== 'none');

      const splitPayments = invoice.split_payments || [];
      // Derive paymentMode from the active payments themselves (Invoice has no payment_mode column).
      const paymentMode = derivePaymentMode(splitPayments, invoice.payment_mode);

      return {
        id: tableRowId, // Internal frontend ID (must be unique)
        databaseInvoiceId: databaseId, // Actual database primary key
        rawInvoiceNumber: invoiceNumStr, // Original record number if any
        invoiceNumber: formattedInvoiceNumber, // Use "INV" format for display
        invoiceDate: invoiceDate,
        customerId: Number(invoice.customer_id) || 0,
        customerName: invoice.customer_name || (invoice.customer_id ? `Customer ${invoice.customer_id}` : 'N/A'),
        customerMobile: invoice.customer_phone || invoice.customer_mobile || 'N/A',
        customerCity: invoice.customer_city || 'N/A',
        doctorName: invoice.doctor_name || (invoice.doctor_id ? `Doctor ${invoice.doctor_id}` : 'N/A'),
        doctorMobile: invoice.doctor_mobile || 'N/A',
        doctorEmail: invoice.doctor_email || 'N/A',
        username: invoice.created_by ? (isNaN(Number(invoice.created_by)) ? invoice.created_by : `User ${invoice.created_by}`) : 'Guest',
        patientType: patientType,
        totalAmount: parseFloat(invoice.total_amount) || 0,
        totalReturnedAmount: parseFloat(invoice.total_returned_amount) || 0,
        hasReturn: hasReturn,
        lastReturnStatus: rawReturnStatus,
        paymentMode: paymentMode,
        splitPayments: splitPayments,
        createdAt: invoice.created_at,
        recordStatus: invoice.record_status || (invoice.deleted_at ? 'DELETED' : 'ACTIVE'),
        deletionReason: invoice.deletion_reason || undefined,
      };
    });

    // Combine and remove duplicates
    // STRATEGY: 
    // 1. Add API items first (these are the source of truth for return status)
    // 2. Add saved items ONLY if they don't exist in the API yet (e.g., new sales not yet synced)
    const resultMap = new Map<string, SalesHistoryItem>();

    // First add all API items (source of truth for return status)
    apiItems.forEach(item => {
      if (item.invoiceNumber) {
        // Look for this item in local storage to see if we have names the API might be missing
        const savedItem = uniqueSavedItems.find(s => s.invoiceNumber === item.invoiceNumber);

        if (savedItem) {
          // Helper to check if a value is a fallback placeholder (e.g., "Customer 123", "Doctor 456", "User 10")
          const isFallbackValue = (value: string) => {
            return !value || value === 'N/A' || /^Customer\s+\d+$/i.test(value) || /^Doctor\s+\d+$/i.test(value) || /^User\s+\d+$/i.test(value);
          };

          resultMap.set(item.invoiceNumber, {
            ...item,
            invoiceDate: savedItem.invoiceDate || item.invoiceDate || (item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY') : ''),
            // If API has null names/mobile or fallback placeholders, use the ones from local storage
            customerName: isFallbackValue(item.customerName) ? (savedItem.customerName || item.customerName) : item.customerName,
            customerMobile: (item.customerMobile === 'N/A' || !item.customerMobile) ? (savedItem.customerMobile || item.customerMobile) : item.customerMobile,
            customerCity: (item.customerCity === 'N/A' || !item.customerCity) ? (savedItem.customerCity || item.customerCity) : item.customerCity,
            doctorName: isFallbackValue(item.doctorName) ? (savedItem.doctorName || item.doctorName) : item.doctorName,
            doctorMobile: (item.doctorMobile === 'N/A' || !item.doctorMobile) ? (savedItem.doctorMobile || item.doctorMobile) : item.doctorMobile,
            doctorEmail: (item.doctorEmail === 'N/A' || !item.doctorEmail) ? (savedItem.doctorEmail || item.doctorEmail) : item.doctorEmail,
            username: isFallbackValue(item.username) ? (savedItem.username || item.username) : item.username,
            // If API list doesn't return split_payments, fall back to saved payment breakdown
            splitPayments: (item.splitPayments && item.splitPayments.length > 0)
              ? item.splitPayments
              : (savedItem.splitPayments && savedItem.splitPayments.length > 0 ? savedItem.splitPayments : []),
          });
        } else {
          resultMap.set(item.invoiceNumber, item);
        }
      }
    });

    // Then add saved items that aren't in the API yet
    uniqueSavedItems.forEach(item => {
      if (item.invoiceNumber && !resultMap.has(item.invoiceNumber)) {
        // Add default return info for local-only items
        resultMap.set(item.invoiceNumber, {
          ...item,
          hasReturn: false,
          lastReturnStatus: null
        });
      }
    });

    const finalItems = Array.from(resultMap.values());

    // Merge extra return info from returnInfoMap if available (from detailed fetch)
    return finalItems.map(item => {
      const returnInfo = returnInfoMap.get(item.id);
      if (returnInfo) {
        return {
          ...item,
          returnInfo: {
            totalItems: returnInfo.totalItems,
            returnedItems: returnInfo.returnedItems,
            isFullReturn: returnInfo.isFullReturn,
          }
        };
      }
      return item;
    });
  }, [savedHistory, invoicesData, returnInfoMap]);

  // Fetch return information for all invoices
  // TODO: Enable this when the API is ready
  const ENABLE_RETURN_STATUS_API = false; // Set to true when API is ready

  useEffect(() => {
    if (!ENABLE_RETURN_STATUS_API) {
      // API not ready yet - skip fetching return info
      console.log('⚠️ Return status API is disabled - showing default "No return" status');
      return;
    }

    if (!invoicesData || invoicesData.length === 0) return;

    const fetchReturnInfo = async () => {
      const newReturnInfoMap = new Map<number, { totalItems: number; returnedItems: number; isFullReturn: boolean }>();

      // Fetch return info for each invoice
      const promises = invoicesData.map(async (invoice: any) => {
        try {
          const invoiceId = invoice.id;
          const invoiceNumber = invoice.invoice_number;

          if (!invoiceId && !invoiceNumber) return;

          let result;
          if (invoiceId) {
            result = await getInvoiceDetails({ invoice_id: invoiceId }).unwrap();
          } else if (invoiceNumber) {
            const numericInvoiceNumber = String(invoiceNumber).replace(/^INV/i, '').trim();
            result = await getInvoiceDetails({ invoice_number: numericInvoiceNumber }).unwrap();
          }

          if (result && result.lines) {
            const lines = result.lines || [];
            let totalItems = 0;
            let returnedItems = 0;

            lines.forEach((line: any) => {
              const soldQty = parseFloat(line.quantity || '0');
              const returnedQty = parseFloat(line.returned_quantity || '0');
              totalItems += soldQty;
              returnedItems += returnedQty;
            });

            // Check if all items are returned: returnedItems should equal or exceed totalItems
            // Using >= to handle edge cases, but typically they should be equal
            const isFullReturn = totalItems > 0 && returnedItems > 0 && returnedItems >= totalItems;
            const mapKey = invoiceId || parseInt(String(invoiceNumber).replace(/^INV/i, '')) || 0;
            newReturnInfoMap.set(mapKey, {
              totalItems: Math.round(totalItems),
              returnedItems: Math.round(returnedItems),
              isFullReturn
            });

            // Debug log for fully returned items
            if (isFullReturn) {
              console.log('✅ Full return detected for invoice:', {
                invoiceId,
                invoiceNumber,
                totalItems,
                returnedItems,
                mapKey
              });
            }
          }
        } catch (error) {
          console.error('Error fetching return info for invoice:', invoice.id, error);
        }
      });

      await Promise.all(promises);
      setReturnInfoMap(newReturnInfoMap);
      console.log('📊 Return info map updated:', Array.from(newReturnInfoMap.entries()));
    };

    fetchReturnInfo();
  }, [invoicesData, getInvoiceDetails, refreshKey, ENABLE_RETURN_STATUS_API]);


  useEffect(() => {
    const fetchFullDetails = async () => {
      if (!selectedInvoiceId) return;

      // 1. Start with what we have in the merged list
      const mergedItem = salesHistoryData.find(item => item.id === selectedInvoiceId);
      if (!mergedItem) return;

      // Try to get items from saved history first (has full detail with items)
      const savedItem = savedHistory.find((item: any) => item.id === selectedInvoiceId || item.invoiceNumber === mergedItem.invoiceNumber);
      const itemsFromSaved = savedItem?.salesItems || savedItem?.items || [];

      const initialDetails = {
        customerName: mergedItem.customerName || 'N/A',
        customerMobile: mergedItem.customerMobile || 'N/A',
        customerCity: mergedItem.customerCity || '',
        doctorName: mergedItem.doctorName || 'N/A',
        doctorMobile: mergedItem.doctorMobile === 'N/A' ? '' : (mergedItem.doctorMobile || ''),
        doctorEmail: mergedItem.doctorEmail === 'N/A' ? '' : (mergedItem.doctorEmail || ''),
        paymentMode: mergedItem.paymentMode || 'Cash',
        insuranceCompany: (mergedItem as any).insuranceCompany || '',
        invoiceNumber: mergedItem.invoiceNumber || '',
        invoiceDate: mergedItem.invoiceDate || '',
        totalValue: (mergedItem.totalAmount || 0).toString(),
        totalDiscount: (mergedItem as any).totalDiscount || '0',
        taxAmount: (mergedItem as any).taxAmount || '0',
        totalPayableAmount: (mergedItem.totalAmount || 0).toString(),
        splitPayments: mergedItem.splitPayments || [],
        items: itemsFromSaved.length > 0 ? itemsFromSaved.map((item: any) => {
          // Handle both SalesReceiptItem format and any other format
          if (item.id && item.productName) {
            return item;
          }
          // Try to transform if it's in a different format
          return {
            id: item.id || '',
            productName: item.productName || item.name || '',
            quantity: item.quantity?.toString() || '0',
            unitPrice: item.unitPrice?.toString() || '0',
            mrp: item.mrp?.toString() || '0',
            discount: item.discount || '0',
            discountPercent: item.discountPercent?.toString() || '0',
            cgst: item.cgst || '0',
            cgstPercent: item.cgstPercent?.toString() || '0',
            sgst: item.sgst || '0',
            sgstPercent: item.sgstPercent?.toString() || '0',
            igst: item.igst || '0',
            igstPercent: item.igstPercent?.toString() || '0',
            amount: item.amount?.toString() || '0',
            batch: item.batch || '',
            type: item.type || 'N/A',
            manufacturer: item.manufacturer || 'N/A',
            expiryDate: item.expiryDate || '',
            hsn: item.hsn || '',
            pack: item.pack || '',
          };
        }) : []
      };

      console.log('📋 Invoice details loaded:', initialDetails);
      setInvoiceDetails(initialDetails);

      // 2. Fetch full details from API to get the source of truth from backend
      try {
        console.log('🔍 Fetching full invoice details for preview:', selectedInvoiceId);
        const result = await getInvoiceDetails({ invoice_id: selectedInvoiceId }).unwrap();

        if (result && (result.invoice || result.data?.invoice)) {
          const inv = result.invoice || result.data?.invoice;
          const cust = result.customer || result.data?.customer;
          const doc = result.doctor || result.data?.doctor;
          const lines = result.lines || result.data?.lines || [];
          // Detect deleted invoices — for those we keep ALL payments (including voided)
          // because the preview is an audit view of what was originally paid before deletion.
          const isDeletedInvoice = String(inv?.record_status || '').toUpperCase() === 'DELETED' || !!inv?.deleted_at;
          // For active invoices, backend currently returns voided payments alongside active ones;
          // skip them so the receipt doesn't show duplicate / stale entries (e.g., old UPI: 13 next to
          // new UPI: 36). Remove this filter once getInvoiceDetails returns only active payments.
          const rawPayments = result.payments || result.data?.payments || [];
          const payments = isDeletedInvoice
            ? rawPayments
            : rawPayments.filter((p: any) => {
              const status = String(p?.status || '').toUpperCase();
              const paymentStatus = String(p?.payment_status || '').toUpperCase();
              return status !== 'VOID' && paymentStatus !== 'VOIDED';
            });

          console.log('✅ Full details received from API:', result);

          let calculatedTotalValue = 0;
          let calculatedTotalTax = 0;
          let calculatedTotalDiscount = 0;

          const mappedItems = lines.map((line: any) => {
            const originalQty = Number(line.quantity) || 0;
            const returnedQty = Number(line.returned_quantity) || 0;
            const netQty = Math.max(0, originalQty - returnedQty);
            const sp = Number(line.selling_price ?? line.rate) || 0;
            const disc = Number(line.discount) || 0;
            const cgst = Number(line.cgst) || 0;
            const sgst = Number(line.sgst) || 0;
            const igst = Number(line.igst) || 0;

            calculatedTotalValue += (netQty * sp);

            // Backend mathematically treats SP as Tax-Inclusive:
            const gross = netQty * sp;
            const discountAmt = gross * (disc / 100);
            const finalAmount = gross - discountAmt; // The total is strictly Gross - Discount (Since SP relies on implicit tax!)

            calculatedTotalDiscount += discountAmt;

            // Extract the embedded tax backwards for the summary:
            const taxPct = (cgst + sgst + igst) / 100;
            const effectiveTaxableDenominator = 1 + taxPct;
            const taxableAmt = effectiveTaxableDenominator > 0 ? (finalAmount / effectiveTaxableDenominator) : finalAmount;
            const taxAmountForLine = taxableAmt * taxPct;

            calculatedTotalTax += taxAmountForLine;

            return {
              id: line.invoice_line_id,
              productName: line.name || '',
              quantity: netQty.toString(),
              unitPrice: sp.toString(),
              mrp: line.mrp?.toString() || '0',
              amount: finalAmount.toFixed(2), // Safely calculated to match the backend exactly
              batch: line.batch_number || '',
              type: line.product_type || 'N/A',
              brand_name: line.brand_name || '',
              manufacturer: line.brand_name || 'N/A',
              cgstPercent: cgst.toString(),
              sgstPercent: sgst.toString(),
              igstPercent: igst.toString(),
              discountPercent: disc.toString(),
              // Use exactly what backend sends, without treating '0' or '0000' as invalid
              hsn: line.hsn_code || (line.hsn_id ? line.hsn_id.toString() : '') || '',
              pack: line.pack_qty?.toString() || 'N/A',
              expiryDate: line.expiry_date || '',
            };
          });

          const totalReturned = parseFloat(inv.total_returned_amount || result.total_refunded || 0);
          const finalPayable = Math.max(0, (parseFloat(inv.total_amount) || 0) - totalReturned);

          const apiDetails = {
            customerName: cust?.name || initialDetails.customerName,
            customerMobile: cust?.customer_phone || cust?.phone || cust?.mobile_number || initialDetails.customerMobile,
            customerCity: cust?.city || initialDetails.customerCity,
            doctorName: doc?.name || initialDetails.doctorName,
            doctorMobile: doc?.mobile_number || initialDetails.doctorMobile,
            doctorEmail: doc?.email_id || initialDetails.doctorEmail,
            // payments here is already filtered to active rows; derive the mode from it.
            paymentMode: derivePaymentMode(payments, inv.payment_mode || initialDetails.paymentMode),
            insuranceCompany: inv.insurance_company || initialDetails.insuranceCompany,
            invoiceNumber: inv.invoice_number ? `INV${inv.invoice_number}` : initialDetails.invoiceNumber,
            invoiceDate: (inv.invoice_date || inv.created_at) ? dayjs(inv.invoice_date || inv.created_at).format('DD/MM/YYYY') : initialDetails.invoiceDate,
            totalValue: calculatedTotalValue.toFixed(2),
            totalDiscount: (calculatedTotalDiscount + Number(inv.discount || 0)).toFixed(2),
            taxAmount: calculatedTotalTax.toFixed(2),
            totalPayableAmount: Math.round(finalPayable).toFixed(2),
            splitPayments: (() => {
              const apiPayments = Array.from(new Map(payments.map((p: any) => [
                `${p.payment_method}_${p.payment_amount}_${p.transaction_number || ''}`, p
              ])).values()).map((p: any) => {
                const isRefund = p.direction === 'OUT' ||
                  (p.payment_type && p.payment_type.toUpperCase().includes('RETURN'));
                return {
                  ...p,
                  payment_amount: isRefund ? -Math.abs(p.payment_amount) : p.payment_amount,
                  is_refund: isRefund
                };
              });
              const isMultiplePlaceholder = apiPayments.length === 1 &&
                (apiPayments[0].payment_method || '').toUpperCase() === 'MULTIPLE';
              if (isMultiplePlaceholder && initialDetails.splitPayments && initialDetails.splitPayments.length > 0) {
                return initialDetails.splitPayments;
              }
              return apiPayments;
            })(),
            items: mappedItems
          };

          setInvoiceDetails(apiDetails);
        }
      } catch (error) {
        console.error('❌ Error fetching full invoice details:', error);
      }
    };

    fetchFullDetails();
  }, [selectedInvoiceId, salesHistoryData, savedHistory, getInvoiceDetails]);

  const filteredData = useMemo(() => {
    let filtered = [...salesHistoryData];

    if (currentSearchTerm) {
      const searchLower = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.invoiceNumber || '').toLowerCase().includes(searchLower) ||
        (item.customerName || '').toLowerCase().includes(searchLower) ||
        (item.customerMobile || '').toLowerCase().includes(searchLower)
      );
    }

    if (selectedDoctor) {
      filtered = filtered.filter(item =>
        (item.doctorName || '').toLowerCase().includes(selectedDoctor.toLowerCase())
      );
    }

    if (selectedCustomer) {
      filtered = filtered.filter(item =>
        (item.customerName || '').toLowerCase().includes(selectedCustomer.toLowerCase())
      );
    }

    if (selectedUsername) {
      filtered = filtered.filter(item =>
        (item.username || '').toLowerCase().includes(selectedUsername.toLowerCase())
      );
    }

    // Status filter — Return covers all return types (partial/full); Deleted covers soft-deleted invoices.
    if (selectedStatus && selectedStatus !== 'All') {
      const status = selectedStatus.toLowerCase();
      if (status === 'return') {
        filtered = filtered.filter(item => !!item.hasReturn);
      } else if (status === 'deleted') {
        filtered = filtered.filter(item => String(item.recordStatus || '').toUpperCase() === 'DELETED');
      }
    }

    if (dateRange[0] || dateRange[1]) {
      filtered = filtered.filter(item => {
        // Robust multi-format parse (DD/MM/YYYY, YYYY-MM-DD, "20 Mar 2026", …).
        const ts = parseInvoiceDate(item.invoiceDate);
        if (!ts) return false; // Unparseable rows are excluded from a date-bounded filter.
        const itemDate = dayjs(ts);
        const startDate = dateRange[0];
        const endDate = dateRange[1];

        if (startDate && endDate) {
          return itemDate.isSame(startDate, 'day') ||
            itemDate.isSame(endDate, 'day') ||
            (itemDate.isAfter(startDate, 'day') && itemDate.isBefore(endDate, 'day'));
        } else if (startDate) {
          return itemDate.isSame(startDate, 'day') || itemDate.isAfter(startDate, 'day');
        } else if (endDate) {
          return itemDate.isSame(endDate, 'day') || itemDate.isBefore(endDate, 'day');
        }
        return true;
      });
    }

    Object.entries(currentFilter).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          const itemValue = item[key as keyof SalesHistoryItem];
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    return filtered;
  }, [salesHistoryData, currentSearchTerm, currentFilter, selectedDoctor, selectedCustomer, selectedUsername, selectedStatus, dateRange]);

  const getUniqueDoctors = useMemo(() => {
    const doctors = [...new Set(salesHistoryData.map(item => item.doctorName || ''))].filter(Boolean);
    return doctors.sort((a, b) => a.localeCompare(b));
  }, [salesHistoryData]);

  const getUniqueCustomers = useMemo(() => {
    const customers = [...new Set(salesHistoryData.map(item => item.customerName || ''))].filter(Boolean);
    return customers.sort((a, b) => a.localeCompare(b));
  }, [salesHistoryData]);

  const getUniqueUsernames = useMemo(() => {
    const usernames = [...new Set(salesHistoryData.map(item => item.username || ''))].filter(Boolean);
    return usernames.sort((a, b) => a.localeCompare(b));
  }, [salesHistoryData]);

  const clearAllFilters = () => {
    setSelectedDoctor(null);
    setSelectedCustomer(null);
    setSelectedUsername(null);
    setSelectedStatus('All');
    setDateRange([null, null]);
    setCurrentSearchTerm('');
    setCurrentFilter({});
  };

  const sortedData = useMemo(() => {
    const activeSortKey = sortConfig.key || 'invoiceDate';
    const activeSortDirection = sortConfig.direction || 'desc';

    return [...filteredData].sort((a, b) => {
      let aValue = a[activeSortKey as keyof SalesHistoryItem];
      let bValue = b[activeSortKey as keyof SalesHistoryItem];

      // CRITICAL: Special handling for date sorting
      // Handle string comparison on various date formats (e.g. "20/03/2026", "2026-03-20", "20 Mar 2026")
      if (activeSortKey === 'invoiceDate') {
        // Shared robust parser (see parseInvoiceDate at module scope) — same
        // multi-format handling the date filter uses.
        const aDate = parseInvoiceDate(aValue);
        const bDate = parseInvoiceDate(bValue);

        if (!isNaN(aDate) && !isNaN(bDate) && aDate !== bDate) {
          return activeSortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // Tie-breaker: use ID if dates are the same day (or both invalid)
        const aId = Number(a.id) || 0;
        const bId = Number(b.id) || 0;
        return activeSortDirection === 'asc' ? aId - bId : bId - aId;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return activeSortDirection === 'asc'
          ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
          : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // Fallback
      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, sortConfig]);

  // Table columns configuration
  // Helper function to get return status
  const getReturnStatus = (item: SalesHistoryItem) => {
    // Priority 1: Use direct status from backend list if available
    if (item.hasReturn && item.lastReturnStatus) {
      let statusText = item.lastReturnStatus;
      const statusLower = statusText.toLowerCase();

      // If backend just says "Completed", let's try to be more specific
      if (statusLower === 'completed' || statusLower === 'paid') {
        // Use a small tolerance (0.01) for decimal comparison
        const isFullByAmount = Math.abs(item.totalReturnedAmount - item.totalAmount) < 0.01 && item.totalAmount > 0;

        if (isFullByAmount) {
          statusText = 'Fully Returned';
        } else if (item.returnInfo) {
          // Fallback to detailed returnInfo if available
          statusText = item.returnInfo.isFullReturn ? 'Fully Returned' : 'Partly Returned';
        } else {
          statusText = 'Partly Returned';
        }
      }

      const isFull = statusText.toLowerCase().includes('full');
      const returned = item.returnInfo?.returnedItems || 0;
      const total = item.returnInfo?.totalItems || 0;

      return {
        status: isFull ? 'full' as const : 'partial' as const,
        label: statusText,
        returned,
        total
      };
    }

    // Priority 2: Fallback to calculated returnInfo if API detail fetching is enabled
    if (!item.returnInfo || item.returnInfo.returnedItems === 0) {
      return { status: 'none' as const, label: 'No return', returned: 0, total: 0 };
    }

    const { returnedItems, totalItems, isFullReturn } = item.returnInfo;
    if (isFullReturn) {
      return { status: 'full' as const, label: 'All items returned', returned: returnedItems, total: totalItems };
    }
    return { status: 'partial' as const, label: 'Some items returned', returned: returnedItems, total: totalItems };
  };

  // Handler to navigate to return details
  const handleViewReturnDetails = useCallback((invoiceId: number) => {
    const invoice = salesHistoryData.find(item => item.id === invoiceId);
    if (invoice) {
      // Navigate to SalesReceipt in return details mode
      navigate('/sales/receipt', {
        state: {
          isReturnDetailsMode: true,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          doctorName: invoice.doctorName,
          username: invoice.username,
          totalAmount: invoice.totalAmount,
          patientType: invoice.patientType,
        }
      });
    }
  }, [navigate, salesHistoryData]);

  // Helper function to get return details for tooltip
  const getReturnTooltipContent = (item: SalesHistoryItem) => {
    if (!item.returnInfo || item.returnInfo.returnedItems === 0) {
      return 'No returns';
    }
    const { returnedItems, totalItems, returnDetails } = item.returnInfo;
    let content = `${returnedItems} of ${totalItems} items returned`;
    if (returnDetails && returnDetails.length > 0) {
      content += '\n\nReturned items:';
      returnDetails.forEach(detail => {
        content += `\n• ${detail.productName}: ${detail.returnedQuantity}/${detail.originalQuantity}`;
        if (detail.returnDate) {
          content += ` (${detail.returnDate})`;
        }
      });
    }
    return content;
  };

  const columns: TableColumn<SalesHistoryItem>[] = [
    {
      key: 'invoiceNumber',
      header: SALES_HISTORY_LABELS.TABLE.INVOICE,
      sortable: true,
      columnWidth: '140px',
      headerAlign: 'center',
      render: (item) => {
        const isDeleted = String(item.recordStatus || '').toUpperCase() === 'DELETED';
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '1.5rem', // 24px = 1.5rem
            width: '100%',
            position: 'relative',
          }}>
            <Box sx={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center' }}>
              <VisibilityIcon
                sx={{
                  fontSize: SALES_HISTORY_CONSTANTS.ICONS.VIEW_SIZE,
                  color: SALES_HISTORY_CONSTANTS.ICONS.VIEW_COLOR,
                  cursor: 'pointer',
                  padding: '0.125rem', // 2px = 0.125rem
                  borderRadius: '0.25rem', // 4px = 0.25rem
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#666'
                  }
                }}
                onClick={() => handleViewInvoice(item.id)}
              />
            </Box>

            <span style={{
              fontWeight: 500,
              fontSize: '0.8125rem', // 13px
              color: '#1A212B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              padding: '0 1.5rem' // space for left and right icons
            }}>
              {item.invoiceNumber}
            </span>

            <Box sx={{ position: 'absolute', right: 0, display: 'flex', alignItems: 'center' }}>
              {isDeleted && (
                <Tooltip title="Invoice is deleted" arrow placement="top">
                  <BlockIcon
                    sx={{
                      fontSize: '1rem', // 16px
                      color: '#DC2626',
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      key: 'invoiceDate',
      header: SALES_HISTORY_LABELS.TABLE.INVOICE_DATE,
      sortable: true,
    },
    {
      key: 'customerName',
      header: SALES_HISTORY_LABELS.TABLE.CUSTOMER_NAME,
      sortable: true,
      columnWidth: '180px',
    },
    {
      key: 'customerMobile',
      header: SALES_HISTORY_LABELS.TABLE.MOBILE_NUMBER,
      sortable: true,
    },
    {
      key: 'doctorName',
      header: SALES_HISTORY_LABELS.TABLE.DOCTOR,
      sortable: true,
    },
    {
      key: 'patientType',
      header: 'Patient Type',
      sortable: true,
      render: (item) => item.patientType || 'Out Patient',
    },
    {
      key: 'username',
      header: SALES_HISTORY_LABELS.TABLE.USERNAME,
      sortable: true,
      columnWidth: '115px',
    },
    {
      key: 'totalAmount',
      header: `${SALES_HISTORY_LABELS.TABLE.TOTAL_AMOUNT}`,
      sortable: true,
      columnWidth: '130px',
      render: (item) => {
        // Round to 2 decimal places to avoid floating point ghost paise values
        // e.g. 11.06 - 11.06 can give 0.0000000001 instead of 0 in JavaScript
        const rawNet = item.totalAmount - (item.totalReturnedAmount || 0);
        const netAmount = Math.max(0, Math.round(rawNet));
        const roundedTotal = Math.round(item.totalAmount);
        const roundedReturned = Math.round(item.totalReturnedAmount || 0);
        return (
          <Tooltip
            title={item.totalReturnedAmount > 0 ? `Original: ${roundedTotal.toLocaleString()} | Returned: ${roundedReturned.toLocaleString()}` : ""}
            arrow
          >
            <Typography variant="body2" sx={{ fontWeight: 500, color: item.totalReturnedAmount > 0 ? '#DC2626' : 'inherit' }}>
              {netAmount.toLocaleString()}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      key: 'returnStatus',
      header: 'Return Status',
      sortable: false,
      render: (item) => {
        const returnStatus = getReturnStatus(item);
        const statusText = returnStatus.label;
        const isDeleted = String(item.recordStatus || '').toUpperCase() === 'DELETED';

        if (returnStatus.status === 'none') {
          return (
            <Typography
              variant="body2"
              sx={{
                color: '#9CA3AF',
                cursor: isDeleted ? 'not-allowed' : 'pointer',
                opacity: isDeleted ? 0.5 : 1,
                pointerEvents: isDeleted ? 'none' : 'auto',
                '&:hover': isDeleted ? {} : {
                  color: '#6B7280',
                  textDecoration: 'underline'
                }
              }}
              onClick={isDeleted ? undefined : () => handleViewReturnDetails(item.id)}
            >
              {statusText}
            </Typography>
          );
        }
        return (
          <Chip
            label={statusText}
            size="small"
            disabled={isDeleted}
            onClick={isDeleted ? undefined : () => handleViewReturnDetails(item.id)}
            sx={{
              backgroundColor: returnStatus.status === 'full' ? '#FEE2E2' : '#FEF3C7',
              color: returnStatus.status === 'full' ? '#DC2626' : '#D97706',
              fontWeight: 500,
              fontSize: '0.75rem', // 12px = 0.75rem
              height: '1.5rem', // 24px = 1.5rem
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
          />
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (item) => {
        const returnStatus = getReturnStatus(item);
        const isFullyReturned = returnStatus.status === 'full';
        const isDeleted = String(item.recordStatus || '').toUpperCase() === 'DELETED';
        // Invoices with ANY return can no longer be edited (backend enforces this with a 409).
        const isEditDisabled = isDeleted || !!item.hasReturn;
        const editDisabledTooltip = isDeleted
          ? 'Invoice is deleted'
          : 'Invoices with a return cannot be edited';

        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '0.5rem' // 8px = 0.5rem
          }}>
            <Tooltip title={isEditDisabled ? editDisabledTooltip : 'Edit'} arrow placement="top">
              <EditIcon
                sx={{
                  fontSize: '1.5rem', // 24px = 1.5rem
                  color: isEditDisabled ? '#9CA3AF' : '#000000',
                  cursor: isEditDisabled ? 'not-allowed' : 'pointer',
                  padding: '0.25rem', // 4px = 0.25rem
                  borderRadius: '0.25rem', // 4px = 0.25rem
                  opacity: isEditDisabled ? 0.5 : 1,
                  '&:hover': isEditDisabled ? {} : {
                    backgroundColor: '#f5f5f5',
                    color: '#000000'
                  }
                }}
                onClick={isEditDisabled ? undefined : () => handleEditInvoice(item.id)}
              />
            </Tooltip>
            {!isFullyReturned && (
              <Tooltip title={isDeleted ? 'Invoice is deleted' : 'Return'} arrow placement="top">
                <UndoIcon
                  sx={{
                    fontSize: '1.5rem', // 24px = 1.5rem
                    color: isDeleted ? '#9CA3AF' : '#000000',
                    cursor: isDeleted ? 'not-allowed' : 'pointer',
                    padding: '0.25rem', // 4px = 0.25rem
                    borderRadius: '0.25rem', // 4px = 0.25rem
                    opacity: isDeleted ? 0.5 : 1,
                    '&:hover': isDeleted ? {} : {
                      backgroundColor: '#f5f5f5',
                      color: '#000000'
                    }
                  }}
                  onClick={isDeleted ? undefined : () => handleReturnInvoice(item.id)}
                />
              </Tooltip>
            )}
            {returnStatus.status === 'full' && (() => {
              const tooltipContent = getReturnTooltipContent(item);
              return (
                <Tooltip title={tooltipContent} arrow placement="top">
                  <Badge
                    badgeContent="!"
                    color="error"
                    sx={{
                      marginRight: '0.5rem',
                      '& .MuiBadge-badge': {
                        fontSize: '0.625rem',
                        minWidth: '1rem',
                        height: '1rem',
                        padding: '0 0.125rem',
                      }
                    }}
                  >
                    <WarningIcon
                      sx={{
                        fontSize: '1.25rem',
                        color: '#DC2626',
                        cursor: 'pointer',
                        padding: '0.125rem',
                        borderRadius: '0.25rem',
                        '&:hover': {
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626'
                        }
                      }}
                      onClick={() => {
                        console.log('Alert clicked for invoice:', item.id, 'Return info:', item.returnInfo);
                      }}
                    />
                  </Badge>
                </Tooltip>
              );
            })()}
          </Box>
        );
      },
    },
  ];

  // Event handlers
  const handleStartNewSale = () => {
    // Smart Reset: Only clear the cart if the user was actively editing an old invoice
    // If they were just building a normal new sale draft, preserve it!
    if (getEditInvoiceId()) {
      dispatch(clearCart());
      dispatch(clearFormData());
      clearEditInvoiceId();
    }
    navigate('/sales/new', { state: null }); // explicitly wipe location state
  };

  const handleViewInvoice = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setIsInvoiceModalOpen(true);
  };

  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setSelectedInvoiceId(null);
  };

  const handlePrintToPDF = () => {
    if (!invoiceDetails) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = generatePrintHTML({
        customerName: invoiceDetails.customerName || '',
        customerMobile: invoiceDetails.customerMobile || '',
        customerCity: invoiceDetails.customerCity || '',
        doctorName: invoiceDetails.doctorName || '',
        doctorMobile: invoiceDetails.doctorMobile || '',
        doctorEmail: invoiceDetails.doctorEmail || '',
        paymentMode: invoiceDetails.paymentMode || '',
        insuranceCompany: invoiceDetails.insuranceCompany || '',
        invoiceNumber: invoiceDetails.invoiceNumber || '',
        invoiceDate: invoiceDetails.invoiceDate || '',
        salesItems: invoiceDetails.items || [],
        totalValue: invoiceDetails.totalValue || '0',
        totalDiscount: invoiceDetails.totalDiscount || '0',
        taxAmount: invoiceDetails.taxAmount || '0',
        totalPayableAmount: invoiceDetails.totalPayableAmount || '0',
        splitPayments: invoiceDetails.splitPayments || [],
        labels: SALES_RECEIPT_LABELS,
        brandIcon: bgWhiteIcon,
        pageSize: pageSize,
      });

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Delay print slightly to allow images to load
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    }
  };

  const handleAfterSave = () => {
    // Optional callback after successful save
  };

  const handleCancelPrint = () => {
    setIsInvoiceModalOpen(false);
    setSelectedInvoiceId(null);
  };

  const handleSaveClick = () => {
    setPendingAction('save');
    setIsConfirmDialogOpen(true);
  };

  const handlePrintClick = () => {
    setPendingAction('print');
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setIsConfirmDialogOpen(false);
    setPendingAction(null);
  };

  const handleConfirmDialogConfirm = () => {
    setIsConfirmDialogOpen(false);

    if (pendingAction === 'save') {
      // Handle save logic here
      // You can call handleAfterSave() here or implement save logic
      handleAfterSave();
    } else if (pendingAction === 'print') {
      // Handle print logic here
      handlePrintToPDF();
    }

    setPendingAction(null);
    // Close the invoice modal after confirmation
    setIsInvoiceModalOpen(false);
    setSelectedInvoiceId(null);
  };

  const handleEditInvoice = (invoiceId: number) => {
    const invoice = salesHistoryData.find(item => item.id === invoiceId);
    if (invoice) {
      console.log('🔍 Edit invoice clicked:', {
        frontendInvoiceId: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalAmount: invoice.totalAmount
      });

      // Get invoice details from storage first (this has the correct database ID)
      const savedItem = savedHistory.find((item: any) => item.id === invoiceId);

      // Determine the database invoice ID to use for fetching
      let finalDatabaseId: number = (invoice as any).databaseInvoiceId || 0;

      // If we don't have it explicitly, try to derive it carefully
      if (finalDatabaseId === 0) {
        // Priority 1: Use the ID from saved item (this is the database invoice ID we stored)
        if (savedItem && savedItem.id && typeof savedItem.id === 'number' && savedItem.id < 1000000) {
          finalDatabaseId = savedItem.id;
          console.log('✅ Using database invoice ID from saved item:', finalDatabaseId);
        }
        // Priority 2: Parse from invoice number (e.g., "INV8" -> 8)
        else if (invoice.invoiceNumber) {
          const cleanedNumber = invoice.invoiceNumber.replace(/^(INV-?|RB-?)/i, '').trim();
          const parsed = parseInt(cleanedNumber, 10);
          if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
            finalDatabaseId = parsed;
            console.log('📋 Parsed database invoice ID from invoice number fallback:', finalDatabaseId);
          }
        }
      }

      console.log('🔍 Final database invoice ID resolved for edit:', finalDatabaseId);

      if (savedItem) {
        // Use saved invoice details
        const invoiceData = {
          customer_id: savedItem.customerId || invoice.customerId || 0,
          customerName: savedItem.customerName || invoice.customerName,
          customerMobile: savedItem.customerMobile || invoice.customerMobile,
          customerCity: savedItem.customerCity || '',
          doctorName: savedItem.doctorName || invoice.doctorName,
          doctorMobile: savedItem.doctorMobile || '',
          doctorEmail: savedItem.doctorEmail || '',
          paymentMode: savedItem.paymentMode || 'Cash',
          insuranceCompany: savedItem.insuranceCompany || '',
          invoiceNumber: savedItem.invoiceNumber || invoice.invoiceNumber,
          invoiceDate: savedItem.invoiceDate || invoice.invoiceDate,
          salesItems: savedItem.items || savedItem.salesItems || [],
          totalValue: savedItem.totalValue || savedItem.totalPayableAmount || invoice.totalAmount.toString(),
          totalDiscount: savedItem.totalDiscount || '0',
          taxAmount: savedItem.taxAmount || '0',
          totalPayableAmount: savedItem.totalPayableAmount || invoice.totalAmount.toString(),
        };

        navigate('/sales/receipt', {
          state: {
            isEditMode: true,
            invoiceId: finalDatabaseId,
            ...invoiceData,
            invoiceNumber: invoice.invoiceNumber,
            rawInvoiceNumber: (invoice as any).rawInvoiceNumber,
          }
        });
      } else {
        // Construct from basic invoice data
        const invoiceData = {
          customer_id: invoice.customerId || 0,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          customerCity: '',
          doctorName: invoice.doctorName,
          doctorMobile: '',
          doctorEmail: '',
          paymentMode: 'Cash',
          insuranceCompany: '',
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          salesItems: [],
          totalValue: invoice.totalAmount.toString(),
          totalDiscount: '0',
          taxAmount: '0',
          totalPayableAmount: invoice.totalAmount.toString(),
        };

        navigate('/sales/receipt', {
          state: {
            isEditMode: true,
            invoiceId: finalDatabaseId,
            ...invoiceData,
            invoiceNumber: invoice.invoiceNumber,
            rawInvoiceNumber: (invoice as any).rawInvoiceNumber,
          }
        });
      }
    }
  };

  const handleReturnInvoice = useCallback((invoiceId: number) => {
    const invoice = salesHistoryData.find(item => item.id === invoiceId);
    if (invoice) {
      // Get invoice details from storage - use memoized savedHistory instead of calling storage again
      const savedItem = savedHistory.find((item: any) => item.id === invoiceId);
      const invoiceItems = savedItem?.items || savedItem?.salesItems || [];

      // Determine the database invoice ID to use for fetching
      // Priority 1: Use the ID from saved item (this is the database invoice ID we stored when sale was submitted)
      let databaseInvoiceId: number = 0;

      if (savedItem && savedItem.id && typeof savedItem.id === 'number' && savedItem.id < 1000000) {
        databaseInvoiceId = savedItem.id;
        console.log('✅ Using database invoice ID from saved item:', databaseInvoiceId);
      }
      // Priority 2: Parse from invoice number (e.g., "INV56" -> 56)
      else if (invoice.invoiceNumber) {
        // Remove "INV" or "RB" prefix if present and parse
        const cleanedNumber = invoice.invoiceNumber.replace(/^(INV-?|RB)/i, '').trim();
        const parsed = parseInt(cleanedNumber, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
          databaseInvoiceId = parsed;
          console.log('📋 Parsed database invoice ID from invoice number:', databaseInvoiceId);
        }
      }
      // Priority 3: Use frontend ID if it's reasonable (not a timestamp)
      else if (invoiceId && invoiceId < 1000000) {
        databaseInvoiceId = invoiceId;
        console.log('⚠️ Using frontend invoice ID as fallback:', databaseInvoiceId);
      }

      console.log('🔍 Final database invoice ID to use for return:', databaseInvoiceId);

      // Navigate immediately without blocking
      navigate('/sales/sale-return', {
        state: {
          invoiceId: databaseInvoiceId || invoice.id, // Use database invoice ID, fallback to invoice.id
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          doctorName: invoice.doctorName,
          username: invoice.username,
          totalAmount: invoice.totalAmount,
          items: invoiceItems, // Pass the invoice items
          paymentMode: savedItem?.paymentMode || 'Cash'
        }
      });
    }
  }, [salesHistoryData, savedHistory, navigate]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
  };

  const handleShowFiltersToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterSelect = (key: string, value: string | null) => {
    setCurrentFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: 'invoiceDate', direction: 'desc' });
      return;
    }
    setSortConfig({ key, direction });
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Page Title and Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          {SALES_HISTORY_LABELS.PAGE_TITLE}
        </Typography>
        <StandardButton
          onClick={handleStartNewSale}
          variant="primary"
          size="large"
          startIcon={<AddIcon sx={{ fontSize: '1.125rem' }} />}
          sx={{
            minWidth: '10rem', // 160px = 10rem
            borderRadius: '1.875rem', // 30px = 1.875rem
            backgroundColor: '#5C17E5',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.875rem', // 14px = 0.875rem
            textTransform: 'none',
            boxShadow: 'none',
            '& .MuiButton-startIcon': {
              marginRight: '0.5rem', // 8px = 0.5rem
            },
          }}
        >
          Start new sale
        </StandardButton>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        bgcolor: '#F6F8FB',
        borderRadius: '1rem', // 16px = 1rem
        border: '0.0625rem solid #E6ECF5', // 1px = 0.0625rem
        p: '0.75rem', // 12px = 0.75rem
      }}>
        <TextField
          placeholder={SALES_HISTORY_LABELS.SEARCH_PLACEHOLDER}
          value={currentSearchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: !currentSearchTerm.trim() ? (
              <InputAdornment position="start" sx={{ marginRight: '0px' }}>
                <SearchIcon sx={{ color: '#8A99AF', fontSize: '1.5rem' }} /> {/* 24px = 1.5rem */}
              </InputAdornment>
            ) : null,
          }}
          sx={{
            height: '2.5rem', // 40px = 2.5rem
            borderRadius: '0.75rem', // 12px = 0.75rem
            backgroundColor: '#fff',
            width: '37.5rem', // 600px = 37.5rem
            '& .MuiOutlinedInput-root': {
              height: '2.5rem', // 40px = 2.5rem
              borderRadius: '0.75rem', // 12px = 0.75rem
              backgroundColor: '#fff',
              boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6', // 1px = 0.0625rem
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none !important',
                display: 'none !important'
              },
              '&:hover': {
                boxShadow: 'inset 0 0 0 1px #BFD1E6 !important',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none !important',
                  display: 'none !important'
                },
              },
              '&.Mui-focused': {
                boxShadow: 'inset 0 0 0 1px #BFD1E6 !important',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none !important',
                  display: 'none !important'
                },
              },
            },
            '& .MuiInputBase-input': {
              padding: '10px 14px',
              paddingLeft: '6px',
            },
            '& .MuiOutlinedInput-input::placeholder': {
              textAlign: 'left',
              fontSize: '16px',
              color: '#9CA3AF',
              opacity: 1,
            },
          }}
        />
        <StandardButton
          startIcon={
            showFilters
              ? <FilterListOffIcon sx={{ color: '#1A212B', fontSize: 18 }} />
              : <FilterAltIcon sx={{ color: '#1A212B', fontSize: 18 }} />
          }
          onClick={handleShowFiltersToggle}
          variant="secondary"
          size="medium"
          sx={{
            minWidth: 160,
            borderRadius: '12px',
            bgcolor: '#EEF2F7',
            color: '#1A212B',
            border: '1px solid #D7DFEA',
            boxShadow: '0 2px 8px rgba(2, 6, 23, 0.08)',
            fontSize: '14px',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {showFilters ? SALES_HISTORY_LABELS.HIDE_FILTERS : SALES_HISTORY_LABELS.SHOW_FILTERS}
        </StandardButton>
      </Box>

      {/* Custom Filters Section */}
      {showFilters && (
        <Box sx={{
          display: 'flex',
          gap: 3,
          mb: 3,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Doctor Name Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#728197' }}>{SALES_HISTORY_LABELS.FILTER_DOCTOR_NAME}</Typography>
              <Autocomplete
                options={getUniqueDoctors}
                value={selectedDoctor}
                onChange={(_, newValue) => setSelectedDoctor(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={SALES_HISTORY_LABELS.SEARCH_DOCTOR_PLACEHOLDER}
                    size="small"
                    sx={{
                      width: 220,
                      '& .MuiOutlinedInput-root': {
                        height: 'auto',
                        borderRadius: '30px',
                        backgroundColor: '#ffffff',
                        fontFamily: "'Lexend', sans-serif",
                        fontSize: '14px',
                        color: '#1A212B',
                        '& fieldset': { borderColor: '#D1D5DB' },
                        '&:hover fieldset': { borderColor: '#D1D5DB' },
                        '&.Mui-focused fieldset': { borderColor: '#D1D5DB' },
                      }
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    maxHeight: '300px',
                    '& .MuiAutocomplete-option': {
                      fontSize: '14px',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#5C17E5', color: '#ffffff' },
                      '&[aria-selected="true"]': { backgroundColor: '#F3F4F6' }
                    }
                  }
                }}
              />
            </Box>

            {/* Customer Name Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#728197' }}>{SALES_HISTORY_LABELS.FILTER_CUSTOMER_NAME}</Typography>
              <Autocomplete
                options={getUniqueCustomers}
                value={selectedCustomer}
                onChange={(_, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search customer..."
                    size="small"
                    sx={{
                      width: 220,
                      '& .MuiOutlinedInput-root': {
                        height: 'auto',
                        borderRadius: '30px',
                        backgroundColor: '#ffffff',
                        fontFamily: "'Lexend', sans-serif",
                        fontSize: '14px',
                        color: '#1A212B',
                        '& fieldset': { borderColor: '#D1D5DB' },
                        '&:hover fieldset': { borderColor: '#D1D5DB' },
                        '&.Mui-focused fieldset': { borderColor: '#D1D5DB' },
                      }
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    maxHeight: '300px',
                    '& .MuiAutocomplete-option': {
                      fontSize: '14px',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#5C17E5', color: '#ffffff' },
                      '&[aria-selected="true"]': { backgroundColor: '#F3F4F6' }
                    }
                  }
                }}
              />
            </Box>

            {/* Username Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#728197' }}>{SALES_HISTORY_LABELS.FILTER_USERNAME}</Typography>
              <Autocomplete
                options={getUniqueUsernames}
                value={selectedUsername}
                onChange={(_, newValue) => setSelectedUsername(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={SALES_HISTORY_LABELS.SEARCH_USERNAME_PLACEHOLDER}
                    size="small"
                    sx={{
                      width: 220,
                      '& .MuiOutlinedInput-root': {
                        height: 'auto',
                        borderRadius: '30px',
                        backgroundColor: '#ffffff',
                        fontFamily: "'Lexend', sans-serif",
                        fontSize: '14px',
                        color: '#1A212B',
                        '& fieldset': { borderColor: '#D1D5DB' },
                        '&:hover fieldset': { borderColor: '#D1D5DB' },
                        '&.Mui-focused fieldset': { borderColor: '#D1D5DB' },
                      }
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    maxHeight: '300px',
                    '& .MuiAutocomplete-option': {
                      fontSize: '14px',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#5C17E5', color: '#ffffff' },
                      '&[aria-selected="true"]': { backgroundColor: '#F3F4F6' }
                    }
                  }
                }}
              />
            </Box>

            {/* Status Filter (All / Return / Deleted) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#728197' }}>Status</Typography>
              <Autocomplete
                options={['All', 'Return', 'Deleted']}
                value={selectedStatus}
                onChange={(_, newValue) => setSelectedStatus(newValue || 'All')}
                disableClearable
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All"
                    size="small"
                    sx={{
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        height: 'auto',
                        borderRadius: '30px',
                        backgroundColor: '#ffffff',
                        fontFamily: "'Lexend', sans-serif",
                        fontSize: '14px',
                        color: '#1A212B',
                        '& fieldset': { borderColor: '#D1D5DB' },
                        '&:hover fieldset': { borderColor: '#D1D5DB' },
                        '&.Mui-focused fieldset': { borderColor: '#D1D5DB' },
                      }
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    maxHeight: '300px',
                    '& .MuiAutocomplete-option': {
                      fontSize: '14px',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#5C17E5', color: '#ffffff' },
                      '&[aria-selected="true"]': { backgroundColor: '#F3F4F6' }
                    }
                  }
                }}
              />
            </Box>

            {/* Date Range Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <DateRangeFilter
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </Box>
          </Box>

          {/* Clear Filters Button */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pt: '28px' }}>
            <StandardButton
              onClick={clearAllFilters}
              variant="secondary"
              size="medium"
              sx={{
                minWidth: 160,
                height: '40px',
                backgroundColor: '#F5F5F5',
                border: '1px solid #D1D5DB',
                color: '#1A212B',
                fontWeight: 500,
                marginRight: '10px',
                '&:hover': {
                  backgroundColor: '#E0E0E0',
                  border: '1px solid #D1D5DB',
                }
              }}
            >
              {SALES_HISTORY_LABELS.FILTER_RESET}
            </StandardButton>
          </Box>
        </Box>
      )}

      {/* Table */}
      {isLoadingInvoices ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Typography variant="body2" sx={{ color: '#728197' }}>Loading invoices...</Typography>
        </Box>
      ) : invoicesError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#EF4444' }}>
            Error loading invoices. Please try again.
          </Typography>
          {(invoicesError as any)?.data && (
            <Typography variant="body2" sx={{ color: '#728197', fontSize: '12px' }}>
              {(invoicesError as any).data?.message || (invoicesError as any).data?.error || 'Unknown error'}
            </Typography>
          )}
          <StandardButton
            onClick={() => refetchInvoices()}
            variant="secondary"
            size="medium"
            sx={{
              minWidth: 120,
              height: '36px',
              mt: 1
            }}
          >
            Retry
          </StandardButton>
        </Box>
      ) : (
        <ReusableTable
          data={sortedData}
          columns={columns}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          totalRows={sortedData.length}
          rowsPerPage={SALES_HISTORY_CONSTANTS.TABLE.ROWS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => { }}
          showFilters={false}
          onShowFiltersToggle={() => { }}
          currentFilterKey=""
          onFilterSelect={() => { }}
          currentFilter={{}}
          emptyMessage={SALES_HISTORY_LABELS.EMPTY_MESSAGE}
        />
      )}

      {/* Invoice Preview Modal */}
      {isInvoiceModalOpen && invoiceDetails && (
        <CommonModal
          open={isInvoiceModalOpen}
          title={SALES_HISTORY_LABELS.MODAL_TITLE}
          maxWidth="900px"
          content={
            <PrintPreviewModal
              salesItems={invoiceDetails.items || []}
              customerName={invoiceDetails.customerName || ''}
              customerMobile={invoiceDetails.customerMobile || ''}
              customerCity={invoiceDetails.customerCity || ''}
              doctorName={invoiceDetails.doctorName || ''}
              doctorMobile={invoiceDetails.doctorMobile || ''}
              doctorEmail={invoiceDetails.doctorEmail || ''}
              paymentMode={invoiceDetails.paymentMode || ''}
              insuranceCompany={invoiceDetails.insuranceCompany || ''}
              invoiceNumber={invoiceDetails.invoiceNumber || ''}
              invoiceDate={invoiceDetails.invoiceDate || ''}
              totalValue={invoiceDetails.totalValue || '0'}
              totalDiscount={invoiceDetails.totalDiscount || '0'}
              taxAmount={invoiceDetails.taxAmount || '0'}
              totalPayableAmount={invoiceDetails.totalPayableAmount || '0'}
              brandIcon={bgWhiteIcon}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              splitPayments={invoiceDetails.splitPayments || []}
            />
          }
          onClose={handleCloseInvoiceModal}
          actionButtons={
            <StandardButton
              onClick={handlePrintToPDF}
              variant="primary"
              size="medium"
            >
              {SALES_RECEIPT_LABELS.PRINT_ONLY_BUTTON}
            </StandardButton>
          }
        />
      )}

      {/* Confirmation Dialog */}
      <SaleConfirmationDialog
        open={isConfirmDialogOpen}
        onClose={handleConfirmDialogClose}
        onConfirm={handleConfirmDialogConfirm}
      />

    </Box>
  );
}
