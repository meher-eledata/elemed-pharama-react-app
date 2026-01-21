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
import { generatePrintHTML } from './SalesReceipt.utils';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getSalesHistoryFromStorage } from '../../utils/cartStorage';

export interface SalesHistoryItem {
  id: number;
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
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
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
    const savedItems: SalesHistoryItem[] = savedHistory.map((item: any, index: number) => ({
      id: item.id || `saved_${index}`,
      invoiceNumber: item.invoiceNumber || '',
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
      const invoiceDate = invoice.created_at 
        ? dayjs(invoice.created_at).format('DD/MM/YYYY')
        : '';
      
      // Convert patient_type from number to string (0 = "In Patient", 1 = "Out Patient")
      let patientType = 'Out Patient'; // Default
      if (invoice.patient_type !== undefined && invoice.patient_type !== null) {
        patientType = invoice.patient_type === 0 ? 'In Patient' : 'Out Patient';
      }
      
      const dbInvoiceId = invoice.id || parseInt(invoice.invoice_number) || index + 1000;
      
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
      } else if (invoice.id) {
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
        // Fallback if neither exists (shouldn't happen, but handle gracefully)
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
        hasReturn: invoice.has_return || false,
        lastReturnStatus: invoice.last_return_status || null,
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
            // If API has null names/mobile or fallback placeholders, use the ones from local storage
            customerName: isFallbackValue(item.customerName) ? (savedItem.customerName || item.customerName) : item.customerName,
            customerMobile: (item.customerMobile === 'N/A' || !item.customerMobile) ? (savedItem.customerMobile || item.customerMobile) : item.customerMobile,
            customerCity: (item.customerCity === 'N/A' || !item.customerCity) ? (savedItem.customerCity || item.customerCity) : item.customerCity,
            doctorName: isFallbackValue(item.doctorName) ? (savedItem.doctorName || item.doctorName) : item.doctorName,
            doctorMobile: (item.doctorMobile === 'N/A' || !item.doctorMobile) ? (savedItem.doctorMobile || item.doctorMobile) : item.doctorMobile,
            doctorEmail: (item.doctorEmail === 'N/A' || !item.doctorEmail) ? (savedItem.doctorEmail || item.doctorEmail) : item.doctorEmail,
            username: isFallbackValue(item.username) ? (savedItem.username || item.username) : item.username,
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
        totalValue: (mergedItem.totalAmount || 0).toString(),
        totalDiscount: (mergedItem as any).totalDiscount || '0',
        taxAmount: (mergedItem as any).taxAmount || '0',
        totalPayableAmount: (mergedItem.totalAmount || 0).toString(),
        items: (mergedItem as any).items || []
      };

      setInvoiceDetails(initialDetails);

      // 2. Fetch full details from API to get fields missing from the main list (like doctor mobile/email)
      try {
        console.log('🔍 Fetching full invoice details for preview:', selectedInvoiceId);
        const result = await getInvoiceDetails({ invoice_id: selectedInvoiceId }).unwrap();
        
        if (result) {
          console.log('✅ Full details received:', result);
          setInvoiceDetails((prev: any) => ({
            ...prev,
            customerName: result.customer_name || prev.customerName,
            customerMobile: result.customer_mobile || prev.customerMobile,
            customerCity: result.customer_city || prev.customerCity,
            doctorName: result.doctor_name || prev.doctorName,
            doctorMobile: result.doctor_mobile || prev.doctorMobile,
            doctorEmail: result.doctor_email || prev.doctorEmail,
            paymentMode: result.payment_mode || prev.paymentMode,
            insuranceCompany: result.insurance_company || prev.insuranceCompany,
            totalValue: result.invoice?.total_amount?.toString() || result.total_value?.toString() || prev.totalValue,
            totalDiscount: result.invoice?.discount?.toString() || result.total_discount?.toString() || prev.totalDiscount,
            taxAmount: result.tax_amount?.toString() || prev.taxAmount,
            totalPayableAmount: result.invoice?.total_amount?.toString() || result.total_payable_amount?.toString() || prev.totalPayableAmount,
            items: result.lines ? result.lines.map((line: any) => ({
              id: line.invoice_line_id?.toString() || line.id?.toString() || '',
              productName: line.name || line.product_name || '',
              quantity: line.quantity?.toString() || '0',
              unitPrice: line.rate?.toString() || '0',
              mrp: line.mrp?.toString() || '0',
              discountPercent: line.discount_percent?.toString() || '0',
              cgstPercent: line.cgst_percent?.toString() || '0',
              sgstPercent: line.sgst_percent?.toString() || '0',
              igstPercent: line.igst_percent?.toString() || '0',
              amount: line.selling_price?.toString() || '0',
              batch: line.batch_number || '',
              type: line.product_type || 'N/A'
            })) : prev.items
          }));
        }
      } catch (error) {
        console.error('❌ Error fetching full invoice details:', error);
      }
    };

    fetchFullDetails();
  }, [selectedInvoiceId, salesHistoryData, getInvoiceDetails]);

  const filteredData = useMemo(() => {
    let filtered = [...salesHistoryData];

    if (currentSearchTerm) {
      const searchLower = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.invoiceNumber.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.customerMobile.includes(searchLower)
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
  }, [salesHistoryData, currentSearchTerm, currentFilter, selectedDoctor, selectedUsername, dateRange]);

  const getUniqueDoctors = useMemo(() => {
    const doctors = [...new Set(salesHistoryData.map(item => item.doctorName))];
    return doctors.sort();
  }, [salesHistoryData]);

  const getUniqueCustomers = useMemo(() => {
    const customers = [...new Set(salesHistoryData.map(item => item.customerName))];
    return customers.sort();
  }, [salesHistoryData]);

  const getUniqueUsernames = useMemo(() => {
    const usernames = [...new Set(salesHistoryData.map(item => item.username))];
    return usernames.sort();
  }, [salesHistoryData]);

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
          {(() => {
            const returnStatus = getReturnStatus(item);
            if (returnStatus.status === 'none') {
              return null;
            }
            const tooltipContent = getReturnTooltipContent(item);
            return (
              <Tooltip 
                title={tooltipContent}
                arrow
                placement="top"
              >
                <Badge
                  badgeContent={returnStatus.status === 'partial' && returnStatus.total > 0 ? `${returnStatus.returned}/${returnStatus.total}` : '!'}
                  color={returnStatus.status === 'full' ? 'error' : 'warning'}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.625rem', // 10px = 0.625rem
                      minWidth: '1.25rem', // 20px = 1.25rem
                      height: '1.25rem', // 20px = 1.25rem
                      padding: '0 0.25rem', // 4px = 0.25rem
                    }
                  }}
                >
                  <WarningIcon
                    sx={{ 
                      fontSize: '1.5rem', // 24px = 1.5rem 
                      color: returnStatus.status === 'full' ? '#DC2626' : '#D97706', 
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: returnStatus.status === 'full' ? '#FEE2E2' : '#FEF3C7',
                        color: returnStatus.status === 'full' ? '#DC2626' : '#D97706'
                      }
                    }}
                    onClick={() => {
                      // TODO: Add alert/warning handler logic - maybe open a modal with return details
                      console.log('Alert clicked for invoice:', item.id, 'Return info:', item.returnInfo);
                    }}
                  />
                </Badge>
              </Tooltip>
            );
          })()}
        </Box>
      ),
    },
];

  // Event handlers
  const handleStartNewSale = () => {
    navigate('/sales/new');
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
      let databaseInvoiceId: number = 0;
      
      // Priority 1: Use the ID from saved item (this is the database invoice ID we stored)
      if (savedItem && savedItem.id && typeof savedItem.id === 'number' && savedItem.id < 1000000) {
        databaseInvoiceId = savedItem.id;
        console.log('✅ Using database invoice ID from saved item:', databaseInvoiceId);
      } 
      // Priority 2: Parse from invoice number (e.g., "INV8" -> 8)
      else if (invoice.invoiceNumber) {
        const cleanedNumber = invoice.invoiceNumber.replace(/^(INV-?|RB-?)/i, '').trim();
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
      
      console.log('🔍 Final database invoice ID to use:', databaseInvoiceId);
      
      if (savedItem) {
        // Use saved invoice details
        const invoiceData = {
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
            invoiceId: databaseInvoiceId || invoice.id, // Use parsed database ID, fallback to frontend ID
            invoice_id: databaseInvoiceId || invoice.id, // Also include as invoice_id for API compatibility
            ...invoiceData
          } 
        });
      } else {
        // Construct from basic invoice data
        const invoiceData = {
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
            invoiceId: databaseInvoiceId || invoice.id, // Use parsed database ID, fallback to frontend ID
            invoice_id: databaseInvoiceId || invoice.id, // Also include as invoice_id for API compatibility
            ...invoiceData
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
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
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
