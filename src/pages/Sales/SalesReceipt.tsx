import React, { useState, ChangeEvent, useEffect } from 'react';
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
  useSearchCustomersMutation,
  useGetDoctorsQuery,
  // TODO: Uncomment when API is ready
  // useCreateSalesMutation,
  Customer,
  Doctor
} from '../../redux/slices/salesApi';
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

// Import Components
import CustomerDetailsSection from './components/CustomerDetailsSection';
import DoctorDetailsSection from './components/DoctorDetailsSection';
import PaymentDetailsSection from './components/PaymentDetailsSection';
import FinancialSummary from './components/FinancialSummary';

// Import Types
import { SalesReceiptItem } from './SalesReceipt.types';

// Import Utilities
import { transformCartItems, calculateFinancialSummary, getTodayDate, generatePrintHTML } from './SalesReceipt.utils';

// Import Table Columns Configuration
import { getTableColumns } from './SalesReceipt.columns';

// Import Styled Components
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
  
  // Redux selectors
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const formData = useSelector(selectFormData);
  const user = useSelector((state: RootState) => state.auth.user);
  
  // RTK Query hooks
  const [searchCustomers, { data: customerSearchResults }] = useSearchCustomersMutation();
  // TODO: Uncomment when API is ready
  // const [createSales, { isLoading: isCreatingSales }] = useCreateSalesMutation();
  const { data: doctorsData = [] } = useGetDoctorsQuery();
  
  // Table State
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
  
  // Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'print' | null>(null);
  
  // Editing State
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [applyGstToAll, setApplyGstToAll] = useState(false);
  
  // Form Data State - Customer
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form Data State - Doctor
  const [doctorName, setDoctorName] = useState('');
  const [doctorMobile, setDoctorMobile] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Form Data State - Payment & Invoice
  const [paymentMode, setPaymentMode] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(SALES_RECEIPT_CONSTANTS.DEFAULT_INVOICE_NUMBER);
  const [invoiceDate, setInvoiceDate] = useState(() => getTodayDate());
  
  // Financial Summary State
  const [totalValue, setTotalValue] = useState('');
  const [totalDiscount, setTotalDiscount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [totalPayableAmount, setTotalPayableAmount] = useState('');

  // Sales Items State
  const [salesItems, setSalesItems] = useState<SalesReceiptItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Toast State
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  
  // Load cart items from Redux state
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      console.log('🛒 Loading cart items from Redux:', cartItems);
      
      // Transform and set sales items
      const transformedItems = transformCartItems(cartItems);
      setSalesItems(transformedItems);
      console.log('✅ Cart items loaded into receipt table:', transformedItems);
      
      // Calculate and set financial summary
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
  
  // Load form data from Redux state
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
      console.log('✅ Form data restored from Redux');
    }
    setIsDataLoaded(true);
  }, [formData]);
  
  // Save form data to Redux whenever it changes
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
  
  // Mock data
  const mockCustomers: Customer[] = SALES_RECEIPT_CONSTANTS.MOCK_CUSTOMERS;
  const mockDoctors: Doctor[] = SALES_RECEIPT_CONSTANTS.MOCK_DOCTORS;

  // Helper function to show toast messages
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Customer Handlers
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

  // Doctor Handlers
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

  // Edit Handlers
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

  // Delete Handlers
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

  // Table Handlers
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

  // Modal Handlers
  const handleOpenCustomerModal = () => {
    setIsCustomerModalOpen(true);
  };

  const handleCloseCustomerModal = () => {
    setIsCustomerModalOpen(false);
  };

  const handleCustomerSubmit = (customerData: any) => {
    console.log('Customer data submitted:', customerData);
    // TODO: Add actual API call to save customer
    showToast('Customer added successfully!', 'success');
  };

  const handleEditCart = () => {
    // Save the current salesItems (with GST modifications) back to Redux
    // Transform receipt items back to cart format before saving
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
      // Preserve GST data
      cgst: item.cgst,
      cgstPercent: item.cgstPercent,
      sgst: item.sgst,
      sgstPercent: item.sgstPercent,
      igst: item.igst,
      igstPercent: item.igstPercent,
      amount: item.amount,
    }));
    
    const totalAmount = salesItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Update Redux with modified cart (including GST changes)
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

  // Reset Form
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
    
    // Clear Redux state
    dispatch(clearCart());
    dispatch(clearFormData());
    console.log('✅ Form reset complete - all fields and Redux state cleared');
  };

  // Save Handler - Shows confirmation dialog
  const handleSave = () => {
    // Validate before showing confirmation
    if (salesItems.length === 0) {
      console.warn('⚠️ Cannot save: No items in the receipt');
      showToast('Cannot save: No items in the receipt', 'warning');
      return;
    }

    // Validate required fields
    if (!customerName || !customerMobile) {
      showToast('Please fill in customer name and mobile number', 'warning');
      return;
    }

    setPendingAction('save');
    setIsConfirmDialogOpen(true);
  };

  // Actual save execution after confirmation
  const executeSave = async () => {
    try {
      console.log('💾 Saving receipt data...');
      
      const salesData = {
        customerName,
        customerMobile,
        customerCity: customerCity || '',
        doctorName: doctorName || '',
        doctorMobile: doctorMobile || '',
        doctorEmail: doctorEmail || '',
        paymentMode: paymentMode || '',
        insuranceCompany: insuranceCompany || '',
        invoiceNumber,
        invoiceDate,
        items: salesItems,
        totalValue,
        totalDiscount,
        taxAmount,
        totalPayableAmount,
      };
      
      console.log('📤 Sending to API:', salesData);
      
      // TODO: Uncomment when API is ready
      // const result = await createSales(salesData).unwrap();
      // console.log('✅ API Response:', result);
      
      // For now, just simulate saving (API endpoint not ready yet)
      console.log('💾 Simulating save (API endpoint not ready yet)');
      
      // Save to localStorage for display in history
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
      
      showToast('Receipt saved successfully!', 'success');
      resetForm();
      
      // Clear cart from Redux after successful save
      dispatch(clearCart());
      console.log('🛒 Cart cleared from Redux after successful save');
      
      console.log('✅ Receipt saved successfully! Redirecting to Sales History...');
      
      // Navigate after a short delay to allow user to see the success message
      setTimeout(() => {
        navigate('/sales/sale-history');
      }, 1500);
    } catch (error: any) {
      console.error('❌ Error saving receipt:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to save receipt. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  // Cancel Handler
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
    
    // Clear cart from Redux when cancelling
    dispatch(clearCart());
    console.log('🛒 Cart cleared from Redux after cancellation');
    
    console.log('❌ Receipt cancelled - navigating back to Sales page');
    navigate(SALES_RECEIPT_CONSTANTS.ROUTE_SALES);
  };

  // Get Table Columns Configuration
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

  // Table configuration
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
        {/* Header */}
        <SalesReceiptHeader>
          <LeftSection>
            <SalesReceiptTitle variant="h1">
              {SALES_RECEIPT_LABELS.PAGE_TITLE}
            </SalesReceiptTitle>
          </LeftSection>
        </SalesReceiptHeader>

        {/* Divider */}
        <HorizontalDivider />

        {/* Customer, Doctor, and Payment Details Section */}
        <CustomerDoctorSection>
          <CustomerDetailsSection
            customerName={customerName}
            customerMobile={customerMobile}
            customerCity={customerCity}
            selectedCustomer={selectedCustomer}
            mockCustomers={mockCustomers}
            onCustomerNameChange={setCustomerName}
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

        {/* Sales Receipt Table */}
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
            {/* GST Apply to All Checkbox */}
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
            
            {/* Edit Cart Button */}
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

        {/* Financial Summary */}
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

        {/* Action Buttons */}
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

        {/* Customer Modal */}
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={handleCloseCustomerModal}
          onSubmit={handleCustomerSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          title={SALES_RECEIPT_LABELS.DELETE_ITEMS_TITLE}
          message={SALES_RECEIPT_LABELS.DELETE_ITEMS_MESSAGE.replace('{count}', String(itemsToDelete.length))}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />

        {/* Print Preview Modal */}
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

        {/* Toast Notifications */}
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

        {/* Confirmation Dialog */}
        <SaleConfirmationDialog
          open={isConfirmDialogOpen}
          onClose={handleConfirmDialogClose}
          onConfirm={handleConfirmDialogConfirm}
        />
      </SalesReceiptContainer>
    </>
  );
};
export default SalesReceipt;
