import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Tooltip, Checkbox, FormControlLabel, Typography, Snackbar, Alert } from '@mui/material';
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
  useGetDoctorsQuery,
  useSubmitSaleMutation,
  useAddCustomerMutation,
  useGetAllCustomerNamesQuery,
  useGetCustomerPhonesMutation,
  useSearchCustomersMutation,
  Customer,
  Doctor
} from '../../redux/slices/salesApi';
import { useGetProductsQuery } from '../../redux/slices/receiveApi';
import { 
  selectCartItems,
  selectCartTotal,
  selectFormData,
  clearCart,
  saveFormData,
  clearFormData,
  setCartItems
} from '../../redux/slices/cartSlice';
import { RootState } from '../../redux/store';
import { SALES_RECEIPT_LABELS } from '../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../config/constants/SalesReceipt.constants';
import { clearCartFromStorage, clearFormDataFromStorage, saveSalesHistoryToStorage } from '../../utils/cartStorage';

import CustomerDetailsSection from './components/CustomerDetailsSection';
import DoctorDetailsSection from './components/DoctorDetailsSection';
import PaymentDetailsSection from './components/PaymentDetailsSection';
import FinancialSummary from './components/FinancialSummary';
import { SalesReceiptItem } from './SalesReceipt.types';
import { transformCartItems, calculateFinancialSummary, getTodayDate, generatePrintHTML } from './SalesReceipt.utils';
import { getTableColumns } from './SalesReceipt.columns';
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
  
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const formData = useSelector(selectFormData);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [submitSale, { isLoading: isSubmittingSale }] = useSubmitSaleMutation();
  const [addCustomer, { isLoading: isAddingCustomer }] = useAddCustomerMutation();
  const [getCustomerPhones] = useGetCustomerPhonesMutation();
  const [searchCustomers] = useSearchCustomersMutation();
  const { data: doctorsData = [] } = useGetDoctorsQuery();
  const { data: customerNames = [], refetch: refetchCustomerNames } = useGetAllCustomerNamesQuery();
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
  const shouldFetchImmediatelyRef = useRef(false);
  
  const [doctorName, setDoctorName] = useState('');
  const [doctorMobile, setDoctorMobile] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const [paymentMode, setPaymentMode] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(SALES_RECEIPT_CONSTANTS.DEFAULT_INVOICE_NUMBER);
  const [invoiceDate, setInvoiceDate] = useState(() => getTodayDate());
  
  const [totalValue, setTotalValue] = useState('');
  const [totalDiscount, setTotalDiscount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [totalPayableAmount, setTotalPayableAmount] = useState('');

  const [salesItems, setSalesItems] = useState<SalesReceiptItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      console.log('🛒 Loading cart items from Redux:', cartItems);
      
      const transformedItems = transformCartItems(cartItems);
      setSalesItems(transformedItems);
      console.log('✅ Cart items loaded into receipt table:', transformedItems);
      
      const summary = calculateFinancialSummary(transformedItems);
      setTotalValue(summary.totalValue);
      setTotalDiscount(summary.totalDiscount);
      setTaxAmount(summary.taxAmount);
      setTotalPayableAmount(summary.totalPayableAmount);
      
      console.log('💰 Financial summary calculated:', summary);
    } else {
      console.log('⚠️ No cart items found in Redux state');
    }
  }, [cartItems]);
  
  const mockDoctors: Doctor[] = SALES_RECEIPT_CONSTANTS.MOCK_DOCTORS;
  
  useEffect(() => {
    const fetchPhonesForCustomer = async () => {
      if (customerName && customerName.trim()) {
        try {
          const result = await getCustomerPhones({ name: customerName.trim() }).unwrap();
          const phones = result.phones || [];
          setAvailablePhones(phones);
          console.log('📱 Fetched phones for customer:', { 
            customerName: customerName.trim(), 
            phones, 
            phonesCount: phones.length 
          });
          
          
          const normalizedCustomerName = customerName.trim().toLowerCase();
          const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedCustomerName);
          
          console.log('🔍 Auto-fill check:', {
            phonesLength: phones.length,
            isExactMatch,
            customerNamesLength: customerNames.length,
            normalizedCustomerName,
            currentCustomerMobile: customerMobile
          });
          
          if (phones.length === 1) {
            const singlePhone = phones[0];
            
            if (isExactMatch || !customerMobile || customerMobile.trim() === '') {
              console.log('✅ Auto-filling phone number:', singlePhone, 'isExactMatch:', isExactMatch, 'currentMobile:', customerMobile);
              setCustomerMobile(singlePhone);
              
              const autoFilledCustomer: Customer = {
                id: 0,
                name: customerName.trim(),
                mobile: singlePhone,
                city: customerCity || '',
              };
              setSelectedCustomer(autoFilledCustomer);
              console.log('✅ Auto-filled customer:', autoFilledCustomer);
            } else {
              console.log('⚠️ Skipping auto-fill - not exact match and phone already set to:', customerMobile);
            }
          } else if (phones.length === 0) {
            if (isExactMatch && customerMobile) {
              console.log('🧹 Clearing phone - no phones found for exact match');
              setCustomerMobile('');
              setSelectedCustomer(null);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching customer phones:', error);
          setAvailablePhones([]);
        }
      } else {
        setAvailablePhones([]);
      }
    };

    const normalizedCustomerName = customerName.trim().toLowerCase();
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedCustomerName);
    const shouldFetchImmediately = shouldFetchImmediatelyRef.current || isExactMatch;

    shouldFetchImmediatelyRef.current = false;

    if (shouldFetchImmediately && customerName && customerName.trim()) {
      fetchPhonesForCustomer();
    } else {
      const timeoutId = setTimeout(() => {
        fetchPhonesForCustomer();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [customerName, getCustomerPhones, customerNames, customerMobile, customerCity]);
  
  useEffect(() => {
    if (formData) {
      console.log('📋 Loading form data from Redux:', formData);
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
      
      if (formData.customerName && formData.customerMobile) {
        const restoredCustomer: Customer = {
          id: 0,
          name: formData.customerName,
          mobile: formData.customerMobile,
          city: formData.customerCity || '',
        };
        setSelectedCustomer(restoredCustomer);
        console.log('✅ Restored customer from form data:', restoredCustomer);
      } else {
        setSelectedCustomer(null);
      }
      
      console.log('✅ Form data restored from Redux');
    }
    setIsDataLoaded(true);
  }, [formData]);
  
  useEffect(() => {
    if (isDataLoaded) {
      const formDataToSave = {
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
      };
      
      dispatch(saveFormData(formDataToSave));
      console.log('💾 Form data saved to Redux:', formDataToSave);
    }
  }, [isDataLoaded, customerName, customerMobile, customerCity, doctorName, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, dispatch]);

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      console.log('✅ Customer selected:', customer);
      setSelectedCustomer(customer);
      setCustomerName(customer.name);
      setCustomerMobile(customer.mobile);
      setCustomerCity(customer.city || '');
    } else {
      console.log('❌ Customer selection cleared');
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerMobile('');
      setCustomerCity('');
    }
  };

  const handleCustomerNameChange = (newName: string) => {
    const normalizedNewName = newName.trim().toLowerCase();
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedNewName);
    
    if (isExactMatch && newName.trim()) {
      shouldFetchImmediatelyRef.current = true;
    }
    
    setCustomerName(newName);
  };

  const handleDoctorSelect = (doctor: Doctor | null) => {
    if (doctor) {
      setSelectedDoctor(doctor);
      setDoctorName(doctor.name);
      setDoctorMobile(doctor.mobile);
      setDoctorEmail(doctor.email || '');
    } else {
      setSelectedDoctor(null);
      setDoctorName('');
      setDoctorMobile('');
      setDoctorEmail('');
    }
  };

  const handleEditClick = (itemId: string) => {
    setEditingRowId(itemId);
    setApplyGstToAll(false);
  };

  const handleSaveClick = () => {
    console.log('Saving changes for item:', editingRowId);
    setEditingRowId(null);
    setApplyGstToAll(false);
  };

  const handleCancelClick = () => {
    console.log('Cancelling edit for item:', editingRowId);
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

  const handleCustomerSubmit = async (customerData: any) => {
    try {
      console.log('📝 Customer data received from modal:', customerData);
      
      if (!customerData.customerName || !customerData.customerName.trim()) {
        showToast('Customer name is required', 'error');
        return;
      }
      if (!customerData.mobileNumber || !customerData.mobileNumber.trim()) {
        showToast('Phone number is required', 'error');
        return;
      }
      if (!customerData.billingAddress || !customerData.billingAddress.trim()) {
        showToast('Billing address is required', 'error');
        return;
      }
      
      if (customerData.emailId && customerData.emailId.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.emailId.trim())) {
          showToast('Invalid email format', 'error');
          return;
        }
      }
      
      if (customerData.gstin && customerData.gstin.trim()) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
        const gstinValue = customerData.gstin.trim().toUpperCase().replace(/\s/g, '');
        
        if (!gstinRegex.test(gstinValue)) {
          showToast('Invalid GSTIN format', 'error');
          return;
        }
        
        customerData.gstin = gstinValue;
      }
      
      if (customerData.pancardNumber && customerData.pancardNumber.trim()) {
        const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
        const panValue = customerData.pancardNumber.trim().toUpperCase();
        
        if (!panRegex.test(panValue)) {
          showToast('Invalid PAN format (e.g., ABCDE1234F)', 'error');
          return;
        }
        
        customerData.pancardNumber = panValue;
      }
      
      let genderValue = 3;
      if (customerData.gender.male) {
        genderValue = 1;
      } else if (customerData.gender.female) {
        genderValue = 2;
      } else if (customerData.gender.other) {
        genderValue = 3;
      }
      
      const apiPayload = {
        name: customerData.customerName.trim(),
        email: customerData.emailId && customerData.emailId.trim() ? customerData.emailId.trim() : null,
        phone: customerData.mobileNumber.trim(),
        billing_address: customerData.billingAddress.trim(),
        shipping_address: customerData.shippingAddressSameAsBilling 
          ? customerData.billingAddress.trim()
          : (customerData.shippingAddress && customerData.shippingAddress.trim() ? customerData.shippingAddress.trim() : null),
        gstin: customerData.gstin || null,
        pancard_num: customerData.pancardNumber || null,
        drug_license: customerData.drugLicense && customerData.drugLicense.trim() ? customerData.drugLicense.trim().toUpperCase() : null,
        gender: genderValue,
      };
      
      console.log('📤 Sending customer data to API:', apiPayload);
      
      const response = await addCustomer(apiPayload).unwrap();
      
      console.log('✅ Customer created successfully:', response);
      
      const newCustomer: Customer = {
        id: parseInt(response.id),
        name: response.name,
        mobile: customerData.mobileNumber,
        email: customerData.emailId,
        city: '',
        address: customerData.billingAddress,
      };
      
      setCustomerName(newCustomer.name);
      setCustomerMobile(newCustomer.mobile);
      
      setSelectedCustomer(newCustomer);
      
      const refetchResult = await refetchCustomerNames();
      console.log('✅ Refetched customer names list:', {
        customerNames: refetchResult.data,
        newCustomerName: newCustomer.name,
        isInList: refetchResult.data?.includes(newCustomer.name)
      });
      
      showToast(`Customer "${newCustomer.name}" added successfully!`, 'success');
      
      handleCloseCustomerModal();
      
    } catch (error: any) {
      console.error('❌ Error adding customer:', error);
      
      
      let errorMessage = 'Failed to add customer';
      let errorDetails = '';
      
      if (error?.data) {
        if (error.data.error) {
          errorMessage = error.data.error;
          
          if (error.data.fields && Array.isArray(error.data.fields)) {
            errorDetails = ` Fields: ${error.data.fields.join(', ')}`;
          }
          
          if (error.data.details && Array.isArray(error.data.details)) {
            const detailMessages = error.data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
            errorDetails = ` Details: ${detailMessages}`;
          }
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (typeof error.data === 'string') {
          errorMessage = error.data;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showToast(errorMessage + errorDetails, 'error');
    }
  };

  const handleEditCart = () => {
   
    const cartItemsWithGst = salesItems.map(item => ({
      id: item.id,
      name: item.productName,
      batch: item.batch,
      avlQty: item.quantity,
      mrp: parseFloat(item.mrp),
      sp: parseFloat(item.unitPrice),
      expiry: item.expiryDate,
      quantity: parseInt(item.quantity),
      type: item.type,
      discount: parseFloat(item.discountPercent),
      totalPrice: parseFloat(item.amount),
      cgst: item.cgst,
      cgstPercent: item.cgstPercent,
      sgst: item.sgst,
      sgstPercent: item.sgstPercent,
      igst: item.igst,
      igstPercent: item.igstPercent,
      amount: item.amount,
    }));
    
    const totalAmount = salesItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    dispatch(setCartItems(cartItemsWithGst));
    console.log('🛒 Updated cart saved to Redux with GST modifications:', cartItemsWithGst);
    
    navigate(SALES_RECEIPT_CONSTANTS.ROUTE_SALES);
  };

  const handlePrint = () => {
    setPendingAction('print');
    setIsConfirmDialogOpen(true);
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
  };

  const handlePrintToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
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
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
      showToast('Receipt printed successfully!', 'success');
    } else {
      showToast('Failed to open print window', 'error');
    }
    clearCartFromStorage();
    clearFormDataFromStorage();
    console.log('🗑️ Cart and form data cleared from storage after printing receipt');
    
    setIsPrintModalOpen(false);
  };

  const handleAfterSave = () => {
    clearCartFromStorage();
    clearFormDataFromStorage();
    console.log('🗑️ Cart and form data cleared from storage after saving receipt');
    setIsPrintModalOpen(false);
  };

  const handleCancelPrint = () => {
    setIsPrintModalOpen(false);
  };

  const handleSaveFromModal = () => {
    setPendingAction('save');
    setIsConfirmDialogOpen(true);
  };

  const handlePrintFromModal = () => {
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
      console.log('Saving invoice...');
      executeSave();
    } else if (pendingAction === 'print') {
      console.log('Opening print preview...');
      setIsPrintModalOpen(true);
    }
    
    setPendingAction(null);
  };

  const resetForm = () => {
    setSalesItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerCity('');
    setSelectedCustomer(null);
    setDoctorName('');
    setDoctorMobile('');
    setDoctorEmail('');
    setSelectedDoctor(null);
    setPaymentMode('');
    setInsuranceCompany('');
    setTotalValue('');
    setTotalDiscount('');
    setTaxAmount('');
    setTotalPayableAmount('');
    setSelectedRows([]);
    setEditingRowId(null);
    setIsDataLoaded(true);
    
    dispatch(clearCart());
    dispatch(clearFormData());
    console.log('✅ Form reset complete - all fields and Redux state cleared');
  };

  const handleSave = () => {
    if (salesItems.length === 0) {
      console.warn('⚠️ Cannot save: No items in the receipt');
      showToast('Cannot save: No items in the receipt', 'warning');
      return;
    }

    if (!customerName || !customerMobile) {
      showToast('Please fill in customer name and mobile number', 'warning');
      return;
    }

    setPendingAction('save');
    setIsConfirmDialogOpen(true);
  };

  const getProductIdFromName = (productName: string): number | null => {
    if (!productName || !apiProducts || apiProducts.length === 0) {
      console.warn('⚠️ Cannot find product ID:', { productName, apiProductsCount: apiProducts?.length || 0 });
      return null;
    }

    const normalize = (str: string) => str.trim().toLowerCase();
    const normalizedProductName = normalize(productName);

    let product = apiProducts.find(p => normalize(p.name) === normalizedProductName);
    
    if (!product) {
      product = apiProducts.find(p => normalize(p.name).includes(normalizedProductName) || normalizedProductName.includes(normalize(p.name)));
    }

    if (product) {
      console.log('✅ Found product:', { 
        searched: productName, 
        found: product.name, 
        id: product.id 
      });
      return product.id;
    }

    console.error('❌ Product not found:', {
      searched: productName,
      availableProducts: apiProducts.slice(0, 5).map(p => p.name),
      totalProducts: apiProducts.length
    });

    return null;
  };

  const executeSave = async () => {
    try {
      console.log('💾 Saving receipt data...');
      console.log('📦 Products state:', {
        isProductsLoading,
        isProductsError,
        apiProductsCount: apiProducts?.length || 0,
        apiProducts: apiProducts?.slice(0, 3)
      });
      
      console.log('🔍 Validating customer selection:', {
        selectedCustomer,
        customerName,
        customerMobile,
        hasSelectedCustomer: !!selectedCustomer,
        hasCustomerId: !!(selectedCustomer && selectedCustomer.id),
        hasCustomerName: !!customerName?.trim()
      });
      
      if (!customerName || !customerName.trim()) {
        showToast('Please enter or select a customer name', 'warning');
        return;
      }

      let customerId: number;
      
      if (selectedCustomer && selectedCustomer.id && selectedCustomer.id > 0) {
        customerId = selectedCustomer.id;
      } else if (customerName && customerMobile) {
        try {
          const searchResults = await searchCustomers({ 
            searchTerm: customerName.trim() 
          }).unwrap();
          
          const matchingCustomer = searchResults.find(
            c => c.name.toLowerCase().trim() === customerName.toLowerCase().trim() &&
                 c.mobile === customerMobile.trim()
          );
          
          if (matchingCustomer && matchingCustomer.id) {
          customerId = matchingCustomer.id;
            console.log('✅ Found customer ID from search:', matchingCustomer);
        } else {
          showToast(
              `Customer "${customerName}" with phone "${customerMobile}" not found. Please select a customer from the dropdown or click "Add New Customer" to create this customer.`,
            'warning'
          );
          return;
        }
        } catch (error) {
          console.error('❌ Error searching for customer:', error);
          showToast(
            `Could not find customer "${customerName}". Please select a customer from the dropdown or click "Add New Customer" to create this customer.`,
            'warning'
          );
          return;
        }
      } else {
        showToast(
          'Please select or enter a customer name and mobile number',
          'warning'
        );
        return;
      }

      if (salesItems.length === 0) {
        showToast('Cannot save: No items in the receipt', 'warning');
        return;
      }

      if (isProductsLoading) {
        showToast('Please wait, products are still loading...', 'warning');
        return;
      }

      if (isProductsError) {
        console.error('❌ Products API error:', productsError);
        const errorMessage = productsError && typeof productsError === 'object' && 'data' in productsError
          ? (productsError.data as any)?.message || 'Failed to load products'
          : 'Failed to load products. The products API endpoint may not be available.';
        showToast(errorMessage + ' Please refresh the page and try again.', 'error');
        return;
      }

      if (!apiProducts || apiProducts.length === 0) {
        console.error('❌ Products not available:', { 
          apiProductsCount: apiProducts?.length || 0,
          apiProducts 
        });
        showToast('Products are not available. Please ensure products are loaded before saving.', 'error');
        return;
      }

      const totalQuantity = salesItems.reduce((sum, item) => sum + parseFloat(item.quantity || '0'), 0);
      const totalDiscountPercent = salesItems.length > 0 
        ? salesItems.reduce((sum, item) => sum + parseFloat(item.discountPercent || '0'), 0) / salesItems.length
        : 0;
      
      const lines = salesItems.map(item => {
        console.log('🔍 Looking up product ID for:', item.productName);
        const productId = getProductIdFromName(item.productName);
        
        if (!productId) {
          console.error('❌ Failed to find product ID for:', item.productName);
          console.error('Available products:', apiProducts.map(p => p.name).slice(0, 10));
          throw new Error(`Product ID not found for product: "${item.productName}". Please check if the product name matches exactly.`);
        }

        return {
          product_id: productId,
          quantity: parseFloat(item.quantity || '0'),
          mrp: parseFloat(item.mrp || '0'),
          sp: parseFloat(item.unitPrice || '0'),
          discount: parseFloat(item.discountPercent || '0') / 100,
        };
      });

      const submitSalePayload = {
        quantity: totalQuantity,
        disc: totalDiscountPercent / 100,
        payment_method: paymentMode || 'Cash',
        payment_amount: parseFloat(totalPayableAmount || '0'),
        created_by: user?.username || 'Guest',
        customer_id: customerId,
        lines: lines,
      };
      
      console.log('📤 Submitting sale to API:', submitSalePayload);
      
      const result = await submitSale(submitSalePayload).unwrap();
      console.log('✅ Sale submitted successfully:', result);
      
      const historyItem = {
        invoiceNumber,
        invoiceDate,
        customerName,
        customerMobile,
        customerCity: customerCity || '',
        doctorName: doctorName || '',
        doctorMobile: doctorMobile || '',
        doctorEmail: doctorEmail || '',
        username: user?.username || 'Guest',
        totalAmount: parseFloat(totalPayableAmount) || 0,
        items: salesItems,
        paymentMode,
        insuranceCompany,
        totalValue,
        totalDiscount,
        taxAmount,
        totalPayableAmount,
      };
      saveSalesHistoryToStorage(historyItem);
      console.log('💾 Saved to sales history:', historyItem);
      
      showToast('Sale submitted successfully!', 'success');
      resetForm();
      
      dispatch(clearCart());
      console.log('🛒 Cart cleared from Redux after successful save');
      
      console.log('✅ Receipt saved successfully! Redirecting to Sales History...');
      
      setTimeout(() => {
        navigate('/sales/sale-history');
      }, 1500);
    } catch (error: any) {
      console.error('❌ Error saving receipt:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to save receipt. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

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
    console.log('🛒 Cart cleared from Redux after cancellation');
    
    console.log('❌ Receipt cancelled - navigating back to Sales page');
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
            mockCustomers={customerNames.map(name => ({ id: 0, name, mobile: '', city: '' }))}
            availablePhones={availablePhones}
            onCustomerNameChange={handleCustomerNameChange}
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
            mockDoctors={mockDoctors}
            onDoctorSelect={handleDoctorSelect}
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
          />
        </CustomerDoctorSection>

        <Box sx={{ 
          marginTop: '8px',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px' 
          }}>
            {editingRowId && (
              <Tooltip title={SALES_RECEIPT_LABELS.APPLY_GST_TO_ALL_TOOLTIP} placement="top">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applyGstToAll}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setApplyGstToAll(isChecked);
                        
                        if (isChecked && salesItems.length > 0) {
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
                          console.log('✅ Applied GST from FIRST row to all products');
                        }
                      }}
                      sx={{
                        color: '#5C17E5',
                        '&.Mui-checked': {
                          color: '#5C17E5',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ 
                      fontFamily: "'Lexend', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1A212B',
                    }}>
                      {SALES_RECEIPT_LABELS.APPLY_GST_TO_ALL_LABEL}
                    </Typography>
                  }
                  sx={{ marginLeft: 0 }}
                />
              </Tooltip>
            )}
            {!editingRowId && <Box />}
            
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <StandardButton 
            variant="secondary" 
            onClick={handleCancel} 
            size="large"
            sx={{
              minWidth: '130px',
              borderRadius: '10px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #E0E0E0',
              color: '#616161',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
            }}
          >
            {SALES_RECEIPT_LABELS.CANCEL_BUTTON}
          </StandardButton>
          <StandardButton 
            variant="primary" 
            onClick={handleSave} 
            size="large"
            sx={{
              minWidth: '130px',
              borderRadius: '10px',
              backgroundColor: '#5C17E5',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            {SALES_RECEIPT_LABELS.SAVE_BUTTON}
          </StandardButton>
          <StandardButton 
            variant="primary" 
            onClick={handlePrint} 
            size="large"
            sx={{
              minWidth: '130px',
              borderRadius: '10px',
              backgroundColor: '#5C17E5',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            {SALES_RECEIPT_LABELS.PRINT_BUTTON}
          </StandardButton>
        </Box>

        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={handleCloseCustomerModal}
          onSubmit={handleCustomerSubmit}
        />

        <ConfirmationDialog
          open={deleteDialogOpen}
          title={SALES_RECEIPT_LABELS.DELETE_ITEMS_TITLE}
          message={SALES_RECEIPT_LABELS.DELETE_ITEMS_MESSAGE.replace('{count}', String(itemsToDelete.length))}
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
              hideActionButtons={false}
            />
          }
          onClose={handleClosePrintModal}
        />

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity} 
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <SaleConfirmationDialog
          open={isConfirmDialogOpen}
          onClose={handleConfirmDialogClose}
          onConfirm={handleConfirmDialogConfirm}
          isLoading={isSubmittingSale}
        />
      </SalesReceiptContainer>
    </>
  );
};
export default SalesReceipt;
