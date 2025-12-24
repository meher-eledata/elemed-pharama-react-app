import React, { useState, ChangeEvent, useCallback, useEffect } from 'react';
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
import { 
  useGetDoctorNamesQuery,
  useSubmitSaleMutation,
  useUpdateSalesMutation,
  useAddCustomerMutation,
  useGetAllCustomerNamesQuery,
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
import { clearCartFromStorage, clearFormDataFromStorage } from '../../utils/cartStorage';

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

import { printStyles, fieldStyles } from './SalesReceipt.printStyles';

const SalesReceipt: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [submitSale, { isLoading: isSubmittingSale }] = useSubmitSaleMutation();
  const [updateSales, { isLoading: isUpdatingSale }] = useUpdateSalesMutation();
  const [addCustomer] = useAddCustomerMutation();
  const { data: doctorNames = [], isLoading: isLoadingDoctorNames } = useGetDoctorNamesQuery();
  const { data: customerNames = [], refetch: refetchCustomerNames } = useGetAllCustomerNamesQuery();
  
  // Note: We only have these customer endpoints:
  // - GET /sales/get-all-customer-names (returns just names)
  // - POST /sales/get-customer-phones/ (returns phones by name)
  // Neither returns customer IDs, so we'll always send customer_id = 0
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
  
  const [totalValue, setTotalValue] = useState('');
  const [totalDiscount, setTotalDiscount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [totalPayableAmount, setTotalPayableAmount] = useState('');

  const [salesItems, setSalesItems] = useState<SalesReceiptItem[]>([]);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Check if we're in edit mode from location state
  const editModeData = (location.state as any) || null;
  const isEditMode = editModeData?.isEditMode || false;

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
    invoiceNumber: string;
    invoiceDate: string;
    salesItems: SalesReceiptItem[];
    totalValue: string;
    totalDiscount: string;
    taxAmount: string;
    totalPayableAmount: string;
  } | null>(null);

  // Load invoice data when in edit mode
  useEffect(() => {
    if (isEditMode && editModeData) {
      // Pre-populate form fields
      if (editModeData.customerName) setCustomerName(editModeData.customerName);
      if (editModeData.customerMobile) setCustomerMobile(editModeData.customerMobile);
      if (editModeData.customerCity) setCustomerCity(editModeData.customerCity);
      if (editModeData.doctorName) {
        setDoctorName(editModeData.doctorName);
        setSelectedDoctor(editModeData.doctorName);
        // Trigger doctor info fetch
        shouldFetchDoctorInfoRef.current = true;
      }
      if (editModeData.doctorMobile) setDoctorMobile(editModeData.doctorMobile);
      if (editModeData.doctorEmail) setDoctorEmail(editModeData.doctorEmail);
      if (editModeData.paymentMode) setPaymentMode(editModeData.paymentMode);
      if (editModeData.insuranceCompany) setInsuranceCompany(editModeData.insuranceCompany);
      if (editModeData.invoiceNumber) setInvoiceNumber(editModeData.invoiceNumber);
      if (editModeData.invoiceDate) setInvoiceDate(editModeData.invoiceDate);
      
      // Pre-populate sales items if available
      if (editModeData.salesItems && Array.isArray(editModeData.salesItems) && editModeData.salesItems.length > 0) {
        const recalculatedItems = editModeData.salesItems.map((item: SalesReceiptItem) => recalculateSalesItemAmount(item));
        setSalesItems(recalculatedItems);
        
        // Recalculate summary
        const correctedSummary = calculateFinancialSummary(recalculatedItems);
        setTotalValue(correctedSummary.totalValue);
        setTotalDiscount(correctedSummary.totalDiscount);
        setTaxAmount(correctedSummary.taxAmount);
        setTotalPayableAmount(correctedSummary.totalPayableAmount);
      } else if (editModeData.totalValue) {
        // If no items but have totals, set the totals
        setTotalValue(editModeData.totalValue || '0');
        setTotalDiscount(editModeData.totalDiscount || '0');
        setTaxAmount(editModeData.taxAmount || '0');
        setTotalPayableAmount(editModeData.totalPayableAmount || '0');
      }
      
      // Set customer if available
      if (editModeData.customerName && editModeData.customerMobile) {
        const customer: Customer = {
          id: 0,
          name: editModeData.customerName,
          mobile: editModeData.customerMobile,
          city: editModeData.customerCity || '',
        };
        setSelectedCustomer(customer);
      }

      // Store original data for comparison
      const originalItems = editModeData.salesItems && Array.isArray(editModeData.salesItems) && editModeData.salesItems.length > 0
        ? editModeData.salesItems.map((item: SalesReceiptItem) => recalculateSalesItemAmount(item))
        : [];
      
      setOriginalInvoiceData({
        customerName: editModeData.customerName || '',
        customerMobile: editModeData.customerMobile || '',
        customerCity: editModeData.customerCity || '',
        doctorName: editModeData.doctorName || '',
        doctorMobile: editModeData.doctorMobile || '',
        doctorEmail: editModeData.doctorEmail || '',
        paymentMode: editModeData.paymentMode || '',
        insuranceCompany: editModeData.insuranceCompany || '',
        invoiceNumber: editModeData.invoiceNumber || '',
        invoiceDate: editModeData.invoiceDate || '',
        salesItems: originalItems,
        totalValue: editModeData.totalValue || '0',
        totalDiscount: editModeData.totalDiscount || '0',
        taxAmount: editModeData.taxAmount || '0',
        totalPayableAmount: editModeData.totalPayableAmount || '0',
      });
    }
  }, [isEditMode, editModeData]);

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

  // Handle customer phone fetching
  const handleCustomerAutoFill = useCallback((customer: Customer) => {
    setCustomerMobile(customer.mobile);
    setSelectedCustomer(customer);
  }, []);

  const handlePhoneClear = useCallback(() => {
    setCustomerMobile('');
    setSelectedCustomer(null);
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

  const handleCustomerNameChange = (newName: string) => {
    const normalizedNewName = newName.trim().toLowerCase();
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedNewName);
    
    if (isExactMatch && newName.trim()) {
      shouldFetchImmediatelyRef.current = true;
    }
    
    setCustomerName(newName);
  };

  // Handle customer selection from dropdown
  // Since /sales/get-customers might not exist, we'll rely on get-customer-phones
  // which is already handled by useCustomerPhones hook
  // This function just ensures the name is set correctly
  const handleCustomerSelectFromDropdown = useCallback((customerName: string) => {
    if (!customerName || !customerName.trim()) {
      setSelectedCustomer(null);
      return;
    }

    // Set flag to fetch immediately when selecting from dropdown
    shouldFetchImmediatelyRef.current = true;
    // We don't have endpoints to get customer IDs
    // Just set the name - useCustomerPhones will fetch the phone number
    setCustomerName(customerName.trim());
    // Don't set selectedCustomer here - let useCustomerPhones handle it
    // selectedCustomer will only have an ID if customer was just added via add-customer
  }, [shouldFetchImmediatelyRef]);

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
    doctorName,
    doctorMobile,
    doctorEmail,
    paymentMode,
    insuranceCompany,
    invoiceNumber,
    invoiceDate,
    onFormDataLoaded: useCallback((formData) => {
      // Only load form data if not in edit mode
      if (!isEditMode) {
        setCustomerName(formData.customerName);
        setCustomerMobile(formData.customerMobile);
        setCustomerCity(formData.customerCity);
        setDoctorName(formData.doctorName);
        setDoctorMobile(formData.doctorMobile);
        setDoctorEmail(formData.doctorEmail);
        setPaymentMode(formData.paymentMode);
        setInsuranceCompany(formData.insuranceCompany);
        if (formData.invoiceNumber) setInvoiceNumber(formData.invoiceNumber);
        if (formData.invoiceDate) setInvoiceDate(formData.invoiceDate);
      }
    }, [isEditMode]),
    onCustomerRestored: useCallback((customer) => {
      // Only restore customer if not in edit mode
      if (!isEditMode) {
        setSelectedCustomer(customer);
      }
    }, [isEditMode])
  });

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
    navigate(SALES_RECEIPT_CONSTANTS.ROUTE_SALES);
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
        labels: SALES_RECEIPT_LABELS,
      });

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // Trigger browser print dialog
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
      showToast('Receipt printed successfully!', 'success');
    } else {
      showToast('Failed to open print window', 'error');
    }
    // Clear cart and form data after successful print
    clearCartFromStorage();
    clearFormDataFromStorage();
    
    setIsPrintModalOpen(false);
  };

  const handleAfterSave = () => {
    clearCartFromStorage();
    clearFormDataFromStorage();
    setIsPrintModalOpen(false);
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
   * The confirmation already happened in Step 2 (Sale Confirmation Dialog).
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
   * - If action is 'print': Open Print Preview Modal (shows customer receipt)
   */
  const handleConfirmDialogConfirm = async () => {
    if (pendingAction === 'save') {
      // Close dialog first
      setIsConfirmDialogOpen(false);
      // Execute save (this will show toast when complete)
      await executeSaveWrapper();
      // Reset pending action after save completes
      setPendingAction(null);
    } else if (pendingAction === 'print') {
      setIsConfirmDialogOpen(false);
      // Open Print Preview Modal which shows the customer receipt
      setIsPrintModalOpen(true);
      setPendingAction(null);
    }
  };

  const resetForm = useCallback(() => {
    setSalesItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerCity('');
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
  }, [customerName, customerMobile, doctorName, salesItems]);

  // Check if there are any changes from original data (for edit mode)
  const hasChanges = useCallback(() => {
    if (!isEditMode || !originalInvoiceData) {
      // If not in edit mode, always return true (normal save flow)
      return true;
    }

    // Compare form fields
    if (
      customerName.trim() !== originalInvoiceData.customerName.trim() ||
      customerMobile.trim() !== originalInvoiceData.customerMobile.trim() ||
      customerCity.trim() !== originalInvoiceData.customerCity.trim() ||
      doctorName.trim() !== originalInvoiceData.doctorName.trim() ||
      doctorMobile.trim() !== originalInvoiceData.doctorMobile.trim() ||
      doctorEmail.trim() !== originalInvoiceData.doctorEmail.trim() ||
      paymentMode.trim() !== originalInvoiceData.paymentMode.trim() ||
      insuranceCompany.trim() !== originalInvoiceData.insuranceCompany.trim() ||
      invoiceNumber.trim() !== originalInvoiceData.invoiceNumber.trim() ||
      invoiceDate.trim() !== originalInvoiceData.invoiceDate.trim()
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

  const executeSaveWrapper = useCallback(async () => {
    await executeSave({
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
      selectedCustomer,
      apiProducts,
      isProductsLoading,
      isProductsError,
      productsError,
      user,
      submitSale,
      updateSales,
      showToast,
      resetForm,
      clearCart: () => dispatch(clearCart()),
      navigate,
      invoiceId: isEditMode && editModeData?.invoiceId ? editModeData.invoiceId : undefined,
      isEditMode,
    });
  }, [customerName, customerMobile, customerCity, doctorName, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, salesItems, totalValue, totalDiscount, taxAmount, totalPayableAmount, selectedCustomer, apiProducts, isProductsLoading, isProductsError, productsError, user, submitSale, updateSales, showToast, navigate, dispatch, isEditMode, editModeData]);

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
      <style>{printStyles}</style>
      <style>{fieldStyles}</style>
      <SalesReceiptContainer id="sales-receipt-content">
        <SalesReceiptHeader>
          <LeftSection>
            <SalesReceiptTitle variant="h1">
              {SALES_RECEIPT_LABELS.PAGE_TITLE}
            </SalesReceiptTitle>
          </LeftSection>
        </SalesReceiptHeader>

        <HorizontalDivider />

        <CustomerDoctorSection>
          <CustomerDetailsSection
            customerName={customerName}
            customerMobile={customerMobile}
            customerCity={customerCity}
            selectedCustomer={selectedCustomer}
            customerNames={customerNames}
            availablePhones={availablePhones}
            onCustomerNameChange={(newName) => {
              // When name changes and it's an exact match from dropdown, set immediate fetch flag first
              const normalizedNewName = newName.trim().toLowerCase();
              const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedNewName);
              if (isExactMatch && newName.trim()) {
                // Set flag to fetch immediately when selecting from dropdown
                shouldFetchImmediatelyRef.current = true;
              }
              handleCustomerNameChange(newName);
            }}
            onCustomerSelect={handleCustomerSelect}
            onCustomerMobileChange={setCustomerMobile}
            onCustomerCityChange={setCustomerCity}
            onAddNewCustomer={handleOpenCustomerModal}
          />

          <DoctorDetailsSection
            doctorName={doctorName}
            doctorMobile={doctorMobile}
            doctorEmail={doctorEmail}
            selectedDoctor={selectedDoctor}
            doctorNames={doctorNames}
            isLoadingDoctorNames={isLoadingDoctorNames}
            availableDoctorInfo={availableDoctorInfo}
            onDoctorSelect={handleDoctorSelect}
            onDoctorNameChange={handleDoctorNameChange}
            onDoctorMobileChange={setDoctorMobile}
            onDoctorEmailChange={setDoctorEmail}
          />

          <PaymentDetailsSection
            paymentMode={paymentMode}
            insuranceCompany={insuranceCompany}
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
            onPaymentModeChange={setPaymentMode}
            onInsuranceCompanyChange={setInsuranceCompany}
            onInvoiceNumberChange={setInvoiceNumber}
            onInvoiceDateChange={setInvoiceDate}
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
          onTotalValueChange={setTotalValue}
          onTotalDiscountChange={setTotalDiscount}
          onTaxAmountChange={setTaxAmount}
          onTotalPayableAmountChange={setTotalPayableAmount}
        />

        <ActionButtons
          onCancel={handleCancel}
          onSave={handleSave}
          onPrint={handlePrint}
          isSaveDisabled={!validateRequiredFields().isValid || (isEditMode && !hasChanges())}
          hidePrintButton={isEditMode}
        />

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
              onCancel={handleCancelPrint}
              onPrint={handlePrintFromModal}
              onSaveClick={handleSaveFromModal}
              hideActionButtons={true}
            />
          }
          onClose={handleClosePrintModal}
          actionButtons={
            <>
              <StandardButton
                onClick={handleSaveFromModal}
                variant="outline"
                size="medium"
              >
                {SALES_RECEIPT_LABELS.SAVE_BUTTON}
              </StandardButton>
              <StandardButton
                onClick={handlePrintFromModal}
                variant="primary"
                size="medium"
              >
                {SALES_RECEIPT_LABELS.PRINT_BUTTON}
              </StandardButton>
            </>
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
        />
      </SalesReceiptContainer>
    </>
  );
};
export default SalesReceipt;
