import React, { useState, useMemo, ChangeEvent, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, Autocomplete, TextField, InputAdornment } from '@mui/material';
import { StandardButton, PharmaDatePicker } from '../../components/Common';
import dayjs, { Dayjs } from 'dayjs';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CommonModal from '../../components/CommonModal/CommonModal';
import PrintPreviewModal from '../../components/Modal/PrintPreview/PrintPreviewModal';
import SaleConfirmationDialog from '../../components/Modal/SaleConfirmation/SaleConfirmationDialog';
import { SALES_RECEIPT_LABELS } from '../../config/label/SalesReceipt.labels';
import { SALES_HISTORY_LABELS } from '../../config/label/SalesHistory.labels';
import { SALES_HISTORY_CONSTANTS } from '../../config/constants/SalesHistory.constants';
import { SalesReceiptItem as SalesApiReceiptItem, useGetInvoicesQuery } from '../../redux/slices/salesApi';
import { generatePrintHTML } from './SalesReceipt.utils';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getSalesHistoryFromStorage } from '../../utils/cartStorage';

export interface SalesHistoryItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerMobile: string;
  doctorName: string;
  username: string;
  totalAmount: number;
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
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'print' | null>(null);
  
  // Force refresh of saved history when location changes (e.g., after edit)
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    // Reload saved history when component mounts or when navigating back
    setRefreshKey(prev => prev + 1);
  }, [location.pathname]);

  const savedHistory = useMemo(() => getSalesHistoryFromStorage(), [refreshKey]);
  
  const salesHistoryData: SalesHistoryItem[] = useMemo(() => {
    const savedItems: SalesHistoryItem[] = savedHistory.map((item: any, index: number) => ({
      id: item.id || `saved_${index}`,
      invoiceNumber: item.invoiceNumber || '',
      invoiceDate: item.invoiceDate || '',
      customerName: item.customerName || '',
      customerMobile: item.customerMobile || '',
      doctorName: item.doctorName || '',
      username: item.username || 'Guest',
      totalAmount: item.totalAmount || 0,
    }));

    // Remove duplicates from savedItems based on invoice number (keep the most recent one)
    // Use Map for O(1) lookup instead of findIndex which is O(n)
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
      
      return {
        id: parseInt(invoice.invoice_number) || index + 1000,
        invoiceNumber: `RB${invoice.invoice_number}`,
        invoiceDate: invoiceDate,
        customerName: invoice.customer_name || (invoice.customer_id ? `Customer ${invoice.customer_id}` : 'N/A'),
        customerMobile: 'N/A',
        doctorName: invoice.doctor_name || (invoice.doctor_id ? `Doctor ${invoice.doctor_id}` : 'N/A'),
        username: `User ${invoice.created_by}`,
        totalAmount: parseFloat(invoice.total_amount) || 0,
      };
    });
    
    // Combine and remove duplicates (prefer savedItems over apiItems for same invoice number)
    // Use Map for efficient O(1) lookup instead of Set + array iteration
    const resultMap = new Map<string, SalesHistoryItem>();
    
    // First add all saved items (these take priority)
    uniqueSavedItems.forEach(item => {
      if (item.invoiceNumber) {
        resultMap.set(item.invoiceNumber, item);
      }
    });
    
    // Then add api items that don't have duplicates in saved items
    apiItems.forEach(item => {
      if (item.invoiceNumber && !resultMap.has(item.invoiceNumber)) {
        resultMap.set(item.invoiceNumber, item);
      }
    });
    
    return Array.from(resultMap.values());
  }, [savedHistory, invoicesData]);
  

  useEffect(() => {
    if (selectedInvoiceId) {
      const savedItem = savedHistory.find((item: any) => item.id === selectedInvoiceId);
      
      if (savedItem) {
        setInvoiceDetails(savedItem);
      } else {
        const currentInvoice = salesHistoryData.find(item => item.id === selectedInvoiceId);
        const mockInvoice = {
          customerName: currentInvoice?.customerName || 'N/A',
          customerMobile: currentInvoice?.customerMobile || 'N/A',
          customerCity: '',
          doctorName: currentInvoice?.doctorName || 'N/A',
          doctorMobile: '',
          doctorEmail: '',
          paymentMode: 'Cash',
          insuranceCompany: '',
          invoiceNumber: currentInvoice?.invoiceNumber || '',
          invoiceDate: currentInvoice?.invoiceDate || '',
          totalValue: (currentInvoice?.totalAmount || 0).toString(),
          totalDiscount: '0',
          taxAmount: '0',
          totalPayableAmount: (currentInvoice?.totalAmount || 0).toString(),
          items: []
        };
        setInvoiceDetails(mockInvoice);
      }
    }
  }, [selectedInvoiceId, savedHistory, salesHistoryData]);

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

    if (selectedUsername) {
      filtered = filtered.filter(item => 
        item.username.toLowerCase().includes(selectedUsername.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.invoiceDate, 'DD/MM/YYYY');
        return itemDate.isSame(startDate, 'day');
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
  }, [salesHistoryData, currentSearchTerm, currentFilter, selectedDoctor, selectedUsername, startDate]);

  const getUniqueDoctors = useMemo(() => {
    const doctors = [...new Set(salesHistoryData.map(item => item.doctorName))];
    return doctors.sort();
  }, [salesHistoryData]);

  const getUniqueUsernames = useMemo(() => {
    const usernames = [...new Set(salesHistoryData.map(item => item.username))];
    return usernames.sort();
  }, [salesHistoryData]);

  const clearAllFilters = () => {
    setSelectedDoctor(null);
    setSelectedUsername(null);
    setStartDate(null);
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
          gap: '2px', 
          minHeight: '24px',
          width: '100%',
          position: 'relative'
        }}>
          <VisibilityIcon
            sx={{ 
              fontSize: SALES_HISTORY_CONSTANTS.ICONS.VIEW_SIZE, 
              color: SALES_HISTORY_CONSTANTS.ICONS.VIEW_COLOR, 
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
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
            marginLeft: '4px',
            fontWeight: 500,
            fontSize: '14px',
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
        key: 'actions',
        header: '',
        sortable: false,
      render: (item) => (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <EditIcon
            sx={{ 
              fontSize: '20px', 
              color: '#5C17E5', 
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: '#4a12c4'
              }
            }}
            onClick={() => handleEditInvoice(item.id)}
          />
          <StandardButton
            onClick={() => handleReturnInvoice(item.id)}
            variant="primary"
            size="small"
            sx={{
              minWidth: '100px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#5c17e5',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              boxShadow: 'none',
      
            }}
          >
            Return
          </StandardButton>
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
      // Parse the actual database invoice ID from invoiceNumber (e.g., "RB1" -> 1)
      let databaseInvoiceId: number = 0;
      if (invoice.invoiceNumber) {
        const cleanedNumber = invoice.invoiceNumber.replace(/^RB/i, '').trim();
        const parsed = parseInt(cleanedNumber, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
          databaseInvoiceId = parsed;
        }
      }
      
      // Get invoice details from storage
      const savedItem = savedHistory.find((item: any) => item.id === invoiceId);
      
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
      
      // Parse invoice number to get the database invoice ID
      // Invoice numbers are like "RB1" or "1", we need to extract the numeric part
      let databaseInvoiceId: number = 0;
      if (invoice.invoiceNumber) {
        // Remove "RB" prefix if present and parse
        const cleanedNumber = invoice.invoiceNumber.replace(/^RB/i, '').trim();
        const parsed = parseInt(cleanedNumber, 10);
        if (!isNaN(parsed) && parsed > 0) {
          databaseInvoiceId = parsed;
        }
      }
      
      // Navigate immediately without blocking
      navigate('/sales/sale-return', { 
        state: { 
          invoiceId: databaseInvoiceId || invoice.id, // Use parsed invoice number as database ID, fallback to invoice.id
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
          startIcon={<AddIcon sx={{ fontSize: '18px' }} />}
          sx={{
            minWidth: '160px',
            borderRadius: '30px',
            backgroundColor: '#5C17E5',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'none',
            boxShadow: 'none',
            '& .MuiButton-startIcon': {
              marginRight: '8px',
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
        borderRadius: '16px',
        border: '1px solid #E6ECF5',
        p: '12px',
      }}>
        <TextField
          placeholder={SALES_HISTORY_LABELS.SEARCH_PLACEHOLDER}
          value={currentSearchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: !currentSearchTerm.trim() ? (
              <InputAdornment position="start" sx={{ marginRight: '0px' }}>
                <SearchIcon sx={{ color: '#8A99AF', fontSize: '24px' }} />
              </InputAdornment>
            ) : null,
          }}
          sx={{
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#fff',
            width: '600px',
            '& .MuiOutlinedInput-root': {
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#fff',
              boxShadow: 'inset 0 0 0 1px #BFD1E6',
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
            <Typography sx={{ fontSize: '12px', color: '#728197' }}>{SALES_HISTORY_LABELS.FILTER_DOCTOR_NAME}</Typography>
              <Autocomplete
                value={selectedDoctor}
                onChange={(event, newValue) => setSelectedDoctor(newValue)}
                options={getUniqueDoctors}
                freeSolo
                forcePopupIcon
                clearOnEscape
                disableClearable={false}
                isOptionEqualToValue={(option, value) => option === value}
                popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={SALES_HISTORY_LABELS.SEARCH_DOCTOR_PLACEHOLDER}
                    sx={{
                      width: 220,
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #D1D5DB',
                        },
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                        '&.Mui-focused': {
                          outline: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#1A212B',
                        fontWeight: 500,
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E6ECF5',
                    '& .MuiAutocomplete-option': {
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        color: '#ffffff',
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Username Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#728197' }}>{SALES_HISTORY_LABELS.FILTER_USERNAME}</Typography>
              <Autocomplete
                value={selectedUsername}
                onChange={(event, newValue) => setSelectedUsername(newValue)}
                options={getUniqueUsernames}
                freeSolo
                forcePopupIcon
                clearOnEscape
                disableClearable={false}
                isOptionEqualToValue={(option, value) => option === value}
                popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={SALES_HISTORY_LABELS.SEARCH_USERNAME_PLACEHOLDER}
                    sx={{
                      width: 220,
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: '1px solid #D1D5DB',
                        },
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                        '&.Mui-focused': {
                          outline: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '1px solid #D1D5DB',
                          },
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: '#1A212B',
                        fontWeight: 500,
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E6ECF5',
                    '& .MuiAutocomplete-option': {
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        color: '#ffffff',
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Date Range Filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#728197' }}>{SALES_HISTORY_LABELS.FILTER_DATE_RANGE}</Typography>
              <PharmaDatePicker
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                width={260}
                height={40}
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
