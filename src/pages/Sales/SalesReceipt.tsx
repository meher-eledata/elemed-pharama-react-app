import React, { useState, ChangeEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useGetDoctorsQuery,
  useSubmitSaleMutation,
  useAddCustomerMutation,
  useGetAllCustomerNamesQuery,
  useSearchCustomersMutation,
  Customer,
  Doctor
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
import { getTodayDate, generatePrintHTML } from './SalesReceipt.utils';
import { transformCartItemsForEdit } from './SalesReceipt.handlers';
import { getTableColumns } from './SalesReceipt.columns';
import { useCartLoader } from './hooks/useCartLoader';
import { useFormPersistence } from './hooks/useFormPersistence';
import { useCustomerPhones } from './hooks/useCustomerPhones';
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
  const dispatch = useDispatch();
  
  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [submitSale, { isLoading: isSubmittingSale }] = useSubmitSaleMutation();
  const [addCustomer] = useAddCustomerMutation();
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
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  
  const mockDoctors: Doctor[] = SALES_RECEIPT_CONSTANTS.MOCK_DOCTORS;

  // Load cart items
  useCartLoader({
    onCartLoaded: useCallback((items, summary) => {
      setSalesItems(items);
      setTotalValue(summary.totalValue);
      setTotalDiscount(summary.totalDiscount);
      setTaxAmount(summary.taxAmount);
      setTotalPayableAmount(summary.totalPayableAmount);
    }, [])
  });

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

  // Handle form persistence
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
    }, []),
    onCustomerRestored: setSelectedCustomer
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
    // Print directly from Print Preview modal without confirmation
    handlePrintToPDF();
  };

  const handleConfirmDialogClose = () => {
    setIsConfirmDialogOpen(false);
    setPendingAction(null);
  };

  const handleConfirmDialogConfirm = () => {
    setIsConfirmDialogOpen(false);
    
    if (pendingAction === 'save') {
      executeSaveWrapper();
    } else if (pendingAction === 'print') {
      setIsPrintModalOpen(true);
    }
    
    setPendingAction(null);
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
      searchCustomers,
      submitSale,
      showToast,
      resetForm,
      clearCart: () => dispatch(clearCart()),
      navigate,
    });
  }, [customerName, customerMobile, customerCity, doctorName, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, salesItems, totalValue, totalDiscount, taxAmount, totalPayableAmount, selectedCustomer, apiProducts, isProductsLoading, isProductsError, productsError, user, searchCustomers, submitSale, showToast, navigate, dispatch]);

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
        />

        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={handleCloseCustomerModal}
          onSubmit={handleCustomerSubmitWrapper}
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
          isLoading={isSubmittingSale}
        />
      </SalesReceiptContainer>
    </>
  );
};
export default SalesReceipt;
