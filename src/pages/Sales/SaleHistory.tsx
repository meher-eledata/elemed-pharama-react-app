import React, { useState, useMemo, ChangeEvent, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, TextField, InputAdornment, Badge, Tooltip, Chip, FormControl, Autocomplete } from '@mui/material';
import { StandardButton } from '../../components/Common';
import DateRangeFilter from '../../components/mainDashboard/DateRangeFilter/DateRangeFilter';
import dayjs, { Dayjs } from 'dayjs';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import WarningIcon from '@mui/icons-material/Warning';
import CommonModal from '../../components/CommonModal/CommonModal';
import PrintPreviewModal from '../../components/Modal/PrintPreview/PrintPreviewModal';
import SaleConfirmationDialog from '../../components/Modal/SaleConfirmation/SaleConfirmationDialog';
import { SALES_RECEIPT_LABELS } from '../../config/label/SalesReceipt.labels';
import { SALES_HISTORY_LABELS } from '../../config/label/SalesHistory.labels';
import { SALES_HISTORY_CONSTANTS } from '../../config/constants/SalesHistory.constants';
import { SalesReceiptItem as SalesApiReceiptItem, useGetInvoicesQuery, useGetInvoiceDetailsMutation } from '../../redux/slices/salesApi';
import { generatePrintHTML, calculateFinancialSummary } from './SalesReceipt.utils';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getSalesHistoryFromStorage } from '../../utils/cartStorage';
import { recalculateSalesItemAmount } from './SalesReceipt.utils.calculation';

export interface SalesHistoryItem {
  id: number | string; // Changed from number to allow synthetic IDs like 'saved_0'
  invoiceNumber: string;
  invoiceDate: string;
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
  soldQty?: number;
  returnedQty?: number;
  returnStatus?: string;
  // Return information (populated directly from backend list)
  hasReturn: boolean;
  lastReturnStatus: string | null;
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
  // Extra fields for Edit/View/Print details
  paymentMode?: string;
  insuranceCompany?: string;
  totalDiscount?: number | string;
  taxAmount?: number | string;
  totalPayableAmount?: number | string;
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
}

export default function SaleHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state: RootState) => state.auth.user);

  const { data: invoicesData, isLoading: isLoadingInvoices, error: invoicesError, refetch: refetchInvoices } = useGetInvoicesQuery();
  const [getInvoiceDetails] = useGetInvoiceDetailsMutation();

  const [returnInfoMap, setReturnInfoMap] = useState<Map<number | string, { totalItems: number; returnedItems: number; isFullReturn: boolean }>>(new Map());

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
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | string | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'print' | null>(null);

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
    const savedItems: SalesHistoryItem[] = savedHistory.map((item: any, index: number) => {
      // Robust check for invalid invoice numbers (null, undefined, NaN, INVNaN)
      const invNum = String(item.invoiceNumber || '').trim();
      const isInvalid = !invNum ||
        invNum.toLowerCase() === 'null' ||
        invNum.toLowerCase() === 'nan' ||
        invNum.toLowerCase() === 'invnan' ||
        invNum.toUpperCase().endsWith('NAN');

      let sanitizedInvoiceNumber = item.invoiceNumber || '';
      if (isInvalid) {
        // Fix bad data from previous buggy versions
        sanitizedInvoiceNumber = item.id && !isNaN(Number(item.id)) && String(item.id).toLowerCase() !== 'nan'
          ? `INV${item.id}`
          : `INV-S${index + 1000}`; // S prefix for Saved items fallback
      }

      return {
        id: item.id || `saved_${index}`,
        invoiceNumber: sanitizedInvoiceNumber,
        invoiceDate: item.invoiceDate || '',
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
        hasReturn: false,
        lastReturnStatus: null,
      };
    });
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
      const invoiceDate = invoice.created_at
        ? dayjs(invoice.created_at).format('DD/MM/YYYY')
        : '';

      // Convert patient_type from number to string (0 = "In Patient", 1 = "Out Patient")
      let patientType = 'Out Patient'; // Default
      if (invoice.patient_type !== undefined && invoice.patient_type !== null) {
        patientType = invoice.patient_type === 0 ? 'In Patient' : 'Out Patient';
      }

      const safeInvoiceId = (invoice.id && !isNaN(Number(invoice.id))) ? Number(invoice.id) : null;
      const numericInvoiceNumber = invoice.invoice_number ? parseInt(String(invoice.invoice_number).replace(/^INV/i, '')) : null;
      const dbInvoiceId = safeInvoiceId || numericInvoiceNumber || index + 1000;

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

      const numValue = Number(numericPart);
      const hasValidInvoiceNumber = invoiceNum !== null
        && invoiceNum !== undefined
        && invoiceNum !== ''
        && invoiceNumStr.toLowerCase() !== 'null'
        && !isNaN(numValue)
        && numValue > 0; // Must be a positive number

      if (hasValidInvoiceNumber) {

        formattedInvoiceNumber = hasInvPrefix ? invoiceNumStr : `INV${numericPart}`;
      } else if (invoice.id && !isNaN(Number(invoice.id)) && String(invoice.id).toLowerCase() !== 'nan') {
        // invoice_number is null/undefined/invalid, use invoice.id as fallback
        // This handles old invoices where invoice_number wasn't set
        formattedInvoiceNumber = `INV${invoice.id}`;
        // Debug: Log when we use fallback
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Invoice number is null/undefined, using invoice.id as fallback:', {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            formatted: formattedInvoiceNumber
          });
        }
      } else {
        // Fallback if neither exists or is invalid (e.g., invoice.id is NaN)
        formattedInvoiceNumber = `INV${index + 1000}`;
      }

      return {
        id: dbInvoiceId, // Use database invoice ID for proper matching
        invoiceNumber: formattedInvoiceNumber, // Use "INV" format, not "RB"
        invoiceDate: invoiceDate,
        customerName: invoice.customer_name || (invoice.customer_id ? `Customer ${invoice.customer_id}` : 'N/A'),
        customerMobile: invoice.customer_mobile || 'N/A',
        customerCity: invoice.customer_city || 'N/A',
        doctorName: invoice.doctor_name || (invoice.doctor_id ? `Doctor ${invoice.doctor_id}` : 'N/A'),
        doctorMobile: invoice.doctor_mobile || 'N/A',
        doctorEmail: invoice.doctor_email || 'N/A',
        username: invoice.created_by ? (isNaN(Number(invoice.created_by)) ? invoice.created_by : `User ${invoice.created_by}`) : 'Guest',
        patientType: patientType,
        totalAmount: parseFloat(invoice.total_amount) || 0,
        totalReturnedAmount: parseFloat(invoice.total_returned_amount) || 0,
        soldQty: parseFloat(invoice.sold_qty || invoice.quantity || invoice.qty) || 0,
        returnedQty: parseFloat(invoice.returned_qty || invoice.returned_quantity || invoice.return_qty) || 0,
        returnStatus: invoice.return_status || null,
        hasReturn: invoice.has_return || (invoice.returned_qty && parseFloat(invoice.returned_qty) > 0) || (invoice.returned_quantity && parseFloat(invoice.returned_quantity) > 0) || false,
        lastReturnStatus: invoice.last_return_status || invoice.return_status || null,
        paymentMode: invoice.payment_mode || 'Cash',
        insuranceCompany: invoice.insurance_company || '',
        totalDiscount: invoice.discount || invoice.total_discount || 0,
        taxAmount: invoice.tax_amount || 0,
        totalPayableAmount: invoice.total_payable_amount || invoice.total_amount || 0,
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
        // Normalize invoice number for matching (remove spaces, uppercase)
        const normalize = (str: string) => str ? str.replace(/\s+/g, '').toUpperCase() : '';
        const itemInv = normalize(item.invoiceNumber);

        // Look for this item in local storage to see if we have names the API might be missing
        const savedItem = uniqueSavedItems.find(s => {
          if (!s.invoiceNumber) return false;
          const sInv = normalize(s.invoiceNumber);

          // Match by normalized invoice number
          if (sInv === itemInv) return true;

          // Also try matching just the numeric parts
          const sNum = sInv.replace(/\D/g, '');
          const itemNum = itemInv.replace(/\D/g, '');
          if (sNum && itemNum && sNum === itemNum) return true;

          return false;
        });

        if (savedItem) {
          // Helper to check if a value is a fallback placeholder or empty
          // Now strictly checking for 'null' string which API might return
          const isFallbackValue = (value: string | null | undefined) => {
            if (!value) return true;
            const strVal = String(value).trim();
            return strVal === '' ||
              strVal === 'N/A' ||
              strVal.toLowerCase() === 'null' ||
              /^Customer\s+\d+$/i.test(strVal) ||
              /^Doctor\s+\d+$/i.test(strVal) ||
              /^User\s+\d+$/i.test(strVal);
          };

          // Prioritize saved data if available - this is the source of truth for the user's submission
          const mergedItem = {
            ...item,
            customerName: savedItem.customerName || item.customerName,
            customerMobile: savedItem.customerMobile || item.customerMobile,
            customerCity: savedItem.customerCity || item.customerCity,
            doctorName: savedItem.doctorName || item.doctorName,
            doctorMobile: savedItem.doctorMobile || item.doctorMobile,
            doctorEmail: savedItem.doctorEmail || item.doctorEmail,
            username: savedItem.username || item.username,
            totalAmount: (savedItem.totalAmount !== undefined && savedItem.totalAmount !== null) ? savedItem.totalAmount : item.totalAmount,
            paymentMode: savedItem.paymentMode || item.paymentMode,
            insuranceCompany: savedItem.insuranceCompany || item.insuranceCompany,
            totalDiscount: savedItem.totalDiscount || item.totalDiscount,
            taxAmount: savedItem.taxAmount || item.taxAmount,
            totalPayableAmount: savedItem.totalPayableAmount || item.totalPayableAmount,
          };

          resultMap.set(item.invoiceNumber, mergedItem);
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
  const ENABLE_RETURN_STATUS_API = true; // Set to true when API is ready

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
              const soldQty = parseFloat(line.quantity || line.sold_qty || line.qty || '0');
              const returnedQty = parseFloat(line.returned_quantity || line.returned_qty || line.return_qty || '0');
              totalItems += soldQty;
              returnedItems += returnedQty;
            });

            // Check if all items are returned: returnedItems should equal or exceed totalItems
            // Using >= to handle edge cases, but typically they should be equal
            const isFullReturn = totalItems > 0 && returnedItems > 0 && returnedItems >= totalItems;
            if (isFullReturn) {
              const mapKey = invoiceId || parseInt(String(invoiceNumber).replace(/^INV/i, '')) || 0;
              newReturnInfoMap.set(mapKey, {
                totalItems: Math.round(totalItems),
                returnedItems: Math.round(returnedItems),
                isFullReturn
              });
            }
          }
        } catch (error) {
          console.error('Error fetching return info for invoice:', invoice.id, error);
        }
      });

      await Promise.all(promises);
      setReturnInfoMap(newReturnInfoMap);
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
      let savedItem = null;
      if (typeof selectedInvoiceId === 'string' && selectedInvoiceId.startsWith('saved_')) {
        const index = parseInt(selectedInvoiceId.split('_')[1], 10);
        if (!isNaN(index) && index >= 0 && index < savedHistory.length) {
          savedItem = savedHistory[index];
        }
      } else {
        // Robust lookup by ID (loose type check) or Invoice Number
        savedItem = savedHistory.find((item: any) =>
          String(item.id) === String(selectedInvoiceId) ||
          (item.invoiceNumber && item.invoiceNumber === mergedItem.invoiceNumber)
        );
      }
      const itemsFromSaved = savedItem?.salesItems || savedItem?.items || [];

      // Calculate financial summary from items
      let totalValue = (mergedItem.totalAmount || 0).toString();
      let totalDiscount = (mergedItem as any).totalDiscount || '0';
      let taxAmount = (mergedItem as any).taxAmount || '0';
      let totalPayableAmount = (mergedItem.totalAmount || 0).toString();

      const items = itemsFromSaved.length > 0 ? itemsFromSaved.map((item: any) => {
        // Construct base item from raw data
        const baseItem = {
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
        };

        // Recalculate to ensure all derived fields (discount amount, tax amount) are correct
        // This handles cases where only percentages might be stored
        return recalculateSalesItemAmount(baseItem);
      }) : [];

      // If we have items, calculate the summary fields from them
      if (items.length > 0) {
        const summary = calculateFinancialSummary(items);
        totalValue = summary.totalValue;
        totalDiscount = summary.totalDiscount;
        taxAmount = summary.taxAmount;
        totalPayableAmount = summary.totalPayableAmount;
      }

      const initialDetails = {
        customerName: mergedItem.customerName || 'N/A',
        customerMobile: mergedItem.customerMobile || 'N/A',
        customerCity: mergedItem.customerCity || '',
        doctorName: mergedItem.doctorName || 'N/A',
        doctorMobile: mergedItem.doctorMobile === 'N/A' ? '' : (mergedItem.doctorMobile || ''),
        doctorEmail: mergedItem.doctorEmail === 'N/A' ? '' : (mergedItem.doctorEmail || ''),
        paymentMode: (mergedItem as any).paymentMode || 'Cash',
        insuranceCompany: (mergedItem as any).insuranceCompany || '',
        invoiceNumber: mergedItem.invoiceNumber || '',
        invoiceDate: mergedItem.invoiceDate || '',
        totalValue: totalValue,
        totalDiscount: totalDiscount,
        taxAmount: taxAmount,
        totalPayableAmount: totalPayableAmount,
        items: items
      };

      console.log('📋 Invoice details loaded:', initialDetails);
      setInvoiceDetails(initialDetails);

      // 2. Fetch full details from API to get fields missing from the main list (like doctor mobile/email)
      // Note: API endpoint not yet implemented on backend, so skip for now
      // try {
      //   console.log('🔍 Fetching full invoice details for preview:', selectedInvoiceId);
      //   const result = await getInvoiceDetails({ invoice_id: selectedInvoiceId }).unwrap();
      //   
      //   if (result) {
      //     console.log('✅ Full details received:', result);
      //     // ... update logic here
      //   }
      // } catch (error) {
      //   console.error('❌ Error fetching full invoice details:', error);
      // }

      // For now, just use the initial details that were already set above
      console.log('📋 Using initial invoice details (API endpoint not yet implemented)');
    };

    fetchFullDetails();
  }, [selectedInvoiceId, salesHistoryData, savedHistory, getInvoiceDetails]);

  const filteredData = useMemo(() => {
    let filtered = [...salesHistoryData];

    if (currentSearchTerm) {
      const searchLower = currentSearchTerm.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.invoiceNumber.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.customerMobile.toLowerCase().includes(searchLower) ||
        item.doctorName.toLowerCase().includes(searchLower) ||
        item.username.toLowerCase().includes(searchLower)
      );
    }

    if (selectedDoctor) {
      filtered = filtered.filter(item =>
        item.doctorName.toLowerCase().includes(selectedDoctor.toLowerCase())
      );
    }

    if (selectedCustomer) {
      filtered = filtered.filter(item =>
        item.customerName.toLowerCase().includes(selectedCustomer.toLowerCase())
      );
    }

    if (selectedUsername) {
      filtered = filtered.filter(item =>
        item.username.toLowerCase().includes(selectedUsername.toLowerCase())
      );
    }

    if (dateRange[0] || dateRange[1]) {
      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.invoiceDate, 'DD/MM/YYYY');
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
  }, [salesHistoryData, currentSearchTerm, currentFilter, selectedDoctor, selectedCustomer, selectedUsername, dateRange]);

  const getUniqueDoctors = useMemo(() => {
    const doctors = [...new Set(salesHistoryData.map(item => (item.doctorName || '').trim()))];
    return doctors.filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [salesHistoryData]);

  const getUniqueCustomers = useMemo(() => {
    const customers = [...new Set(salesHistoryData.map(item => (item.customerName || '').trim()))];
    return customers.filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [salesHistoryData]);

  const getUniqueUsernames = useMemo(() => {
    const usernames = [...new Set(salesHistoryData.map(item => (item.username || '').trim()))];
    return usernames.filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [salesHistoryData]);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentSearchTerm, selectedDoctor, selectedCustomer, selectedUsername, dateRange, currentFilter]);

  const clearAllFilters = () => {
    setSelectedDoctor(null);
    setSelectedCustomer(null);
    setSelectedUsername(null);
    setDateRange([null, null]);
    setCurrentSearchTerm('');
    setCurrentFilter({});
  };

  const sortedData = useMemo(() => {
    const activeSortKey = sortConfig.key || 'invoiceDate';
    const activeSortDirection = sortConfig.direction || 'desc';

    return [...filteredData].sort((a, b) => {
      const aValue = a[activeSortKey as keyof SalesHistoryItem];
      const bValue = b[activeSortKey as keyof SalesHistoryItem];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return activeSortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
      // Fallback: convert to string and compare
      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, sortConfig]);

  // Table columns configuration
  // Helper function to get return status
  const getReturnStatus = (item: SalesHistoryItem) => {
    const soldQty = item.soldQty || item.returnInfo?.totalItems || 0;
    const returnedQty = item.returnedQty || item.returnInfo?.returnedItems || 0;
    const totalAmount = item.totalAmount || 0;
    const returnedAmount = item.totalReturnedAmount || 0;

    // 1. Check for "Full" indicators
    const isFullByQty = soldQty > 0 && returnedQty >= soldQty;
    const isFullByAmount = totalAmount > 0 && Math.abs(returnedAmount - totalAmount) < 0.01;
    const isFullByInfo = item.returnInfo?.isFullReturn || false;
    const isFullByStatus = (item.returnStatus || item.lastReturnStatus || '').toLowerCase().includes('full');

    const isFull = isFullByQty || isFullByAmount || isFullByInfo || isFullByStatus;

    // 2. Handle "No Return" case
    const hasAnyReturn = item.hasReturn || returnedQty > 0 || returnedAmount > 0 || !!item.returnStatus || !!item.lastReturnStatus;

    if (!hasAnyReturn && !isFullByInfo) {
      return { status: 'none' as const, label: 'No Return', returned: 0, total: 0 };
    }

    // 3. Determine Label
    let label = item.returnStatus || item.lastReturnStatus;

    // If no label but there is a return, use defaults
    if (!label) {
      label = isFull ? 'Full Return' : 'Partly Returned';
    }

    // If it's a full return but the label is vague (like "Completed" or just "Returned"), improve it
    const vagueLabels = ['completed', 'paid', 'returned', 'completed_return'];
    if (isFull && (vagueLabels.includes(label.toLowerCase()) || !label.toLowerCase().includes('full'))) {
      label = 'Full Return';
    }

    return {
      status: isFull ? 'full' as const : 'partial' as const,
      label: label,
      returned: returnedQty,
      total: soldQty
    };
  };

  // Handler to navigate to return details
  const handleViewReturnDetails = useCallback((invoiceId: number | string) => {
    const invoice = salesHistoryData.find(item => String(item.id) === String(invoiceId));
    if (invoice) {
      // Get invoice details from storage - use robust lookup
      const savedItem = savedHistory.find((item: any) =>
        String(item.id) === String(invoiceId) ||
        (item.invoiceNumber && item.invoiceNumber === invoice.invoiceNumber)
      );
      const invoiceItems = savedItem?.items || savedItem?.salesItems || [];

      // Validate that we have invoice items with invoice_line_id
      if (invoiceItems.length === 0) {
        console.error('❌ Cannot process return: No invoice items found');
        alert(
          `Cannot return Invoice ${invoice.invoiceNumber}\n\n` +
          `Reason: Invoice line items are not available.\n\n` +
          `This happens when:\n` +
          `• The invoice was created in a previous session\n` +
          `• Local storage was cleared\n` +
          `• The invoice wasn't properly saved\n\n` +
          `Solution: Contact support or re-create the sale.`
        );
        return;
      }

      // Validate that items have invoice_line_id (required for returns)
      const hasInvoiceLineIds = invoiceItems.every((item: any) => item.invoice_line_id);
      if (!hasInvoiceLineIds) {
        console.error('❌ Cannot process return: Some items missing invoice_line_id');
        console.warn('Items:', invoiceItems);
        alert(
          `Cannot return Invoice ${invoice.invoiceNumber}\n\n` +
          `Reason: Invoice line items are missing required IDs.\n\n` +
          `This is a data integrity issue. The invoice may not have been\n` +
          `properly saved to the database.\n\n` +
          `Solution: Contact support to investigate this invoice.`
        );
        return;
      }


      // Navigate to SalesReceipt in return details mode
      navigate('/sales/receipt', {
        state: {
          isReturnDetailsMode: true,
          invoiceId: invoice.id,
          invoice_id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          doctorName: invoice.doctorName,
          username: invoice.username,
          totalAmount: invoice.totalAmount,
          patientType: invoice.patientType,
          salesItems: invoiceItems, // Pass items for fallback
        }
      });
    }
  }, [navigate, salesHistoryData, savedHistory]);

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
      render: (item) => (
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.125rem', // 2px = 0.125rem
          minHeight: '1.5rem', // 24px = 1.5rem
          width: '100%',
          position: 'relative'
        }}>
          <VisibilityIcon
            sx={{
              fontSize: SALES_HISTORY_CONSTANTS.ICONS.VIEW_SIZE,
              color: SALES_HISTORY_CONSTANTS.ICONS.VIEW_COLOR,
              cursor: 'pointer',
              padding: '0.125rem', // 2px = 0.125rem
              borderRadius: '0.25rem', // 4px = 0.25rem
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: '#666'
              }
            }}
            onClick={() => handleViewInvoice(item.id)}
          />
          <span style={{
            flex: 1,
            marginLeft: '0.25rem', // 4px = 0.25rem
            fontWeight: 500,
            fontSize: '0.875rem', // 14px = 0.875rem
            color: '#1A212B'
          }}>
            {item.invoiceNumber}
          </span>
        </Box>
      ),
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
    },
    {
      key: 'totalAmount',
      header: SALES_HISTORY_LABELS.TABLE.TOTAL_AMOUNT,
      sortable: true,
      render: (item) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {item.totalAmount.toLocaleString()}
        </Typography>
      ),
    },
    {
      key: 'returnStatus',
      header: 'Return Status',
      sortable: false,
      render: (item) => {
        const returnStatus = getReturnStatus(item);
        const statusText = returnStatus.label;

        if (returnStatus.status === 'none') {
          return (
            <Typography
              variant="body2"
              sx={{
                color: '#9CA3AF',
                cursor: 'pointer',
                '&:hover': {
                  color: '#6B7280',
                  textDecoration: 'underline'
                }
              }}
              onClick={() => handleViewReturnDetails(item.id)}
            >
              {statusText}
            </Typography>
          );
        }
        return (
          <Chip
            label={statusText}
            size="small"
            onClick={() => handleViewReturnDetails(item.id)}
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
      render: (item) => (
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.5rem' // 8px = 0.5rem 
        }}>
          <Tooltip title="Edit" arrow placement="top">
            <EditIcon
              sx={{
                fontSize: '1.5rem', // 24px = 1.5rem 
                color: '#000000',
                cursor: 'pointer',
                padding: '0.25rem', // 4px = 0.25rem
                borderRadius: '0.25rem', // 4px = 0.25rem
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  color: '#000000'
                }
              }}
              onClick={() => handleEditInvoice(item.id)}
            />
          </Tooltip>
          <Tooltip title="Return" arrow placement="top">
            <UndoIcon
              sx={{
                fontSize: '1.5rem', // 24px = 1.5rem 
                color: '#000000',
                cursor: 'pointer',
                padding: '0.25rem', // 4px = 0.25rem
                borderRadius: '0.25rem', // 4px = 0.25rem
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  color: '#000000'
                }
              }}
              onClick={() => handleReturnInvoice(item.id)}
            />
          </Tooltip>

        </Box>
      ),
    },
  ];

  // Event handlers
  const handleStartNewSale = () => {
    navigate('/sales/new');
  };

  const handleViewInvoice = (invoiceId: number | string) => {
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
        labels: SALES_RECEIPT_LABELS,
      });

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
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

  const handleEditInvoice = (invoiceId: number | string) => {
    const invoice = salesHistoryData.find(item => String(item.id) === String(invoiceId));
    if (invoice) {
      console.log('🔍 Edit invoice clicked:', {
        frontendInvoiceId: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
      });

      // Simple navigation - let the target page handle fetching
      navigate('/sales/receipt', {
        state: {
          isEditMode: true,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          customerCity: invoice.customerCity,
          doctorName: invoice.doctorName,
          doctorMobile: invoice.doctorMobile,
          doctorEmail: invoice.doctorEmail,
          paymentMode: invoice.paymentMode,
          insuranceCompany: invoice.insuranceCompany,
          totalAmount: invoice.totalAmount,
          totalDiscount: invoice.totalDiscount,
          taxAmount: invoice.taxAmount,
          totalPayableAmount: invoice.totalPayableAmount
        }
      });
    }
  };

  const handleReturnInvoice = (invoiceId: number | string) => {
    const invoice = salesHistoryData.find(item => String(item.id) === String(invoiceId));
    if (invoice) {
      console.log('🔍 Return invoice clicked:', {
        frontendInvoiceId: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
      });

      // Simple navigation - let the target page handle fetching
      navigate('/sales/sale-return', {
        state: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          customerCity: invoice.customerCity,
          doctorName: invoice.doctorName,
          doctorMobile: invoice.doctorMobile,
          doctorEmail: invoice.doctorEmail,
          paymentMode: invoice.paymentMode,
          insuranceCompany: invoice.insuranceCompany,
          username: invoice.username,
          totalAmount: invoice.totalAmount,
          totalDiscount: invoice.totalDiscount,
          taxAmount: invoice.taxAmount,
          totalPayableAmount: invoice.totalPayableAmount,
          // Do NOT pass items - let the return page fetch them
        }
      });
    }
  };

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
              onCancel={handleCancelPrint}
              onPrint={handlePrintClick}
              onSaveClick={handleSaveClick}
              hideActionButtons={true}
            />
          }
          onClose={handleCloseInvoiceModal}
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
