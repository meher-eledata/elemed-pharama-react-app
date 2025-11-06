import { Customer } from '../../redux/slices/salesApi';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getProductIdFromName } from './SalesReceipt.handlers';
import { saveSalesHistoryToStorage } from '../../utils/cartStorage';

interface ExecuteSaveParams {
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
  selectedCustomer: Customer | null;
  apiProducts: any[];
  isProductsLoading: boolean;
  isProductsError: boolean;
  productsError: any;
  user: any;
  searchCustomers: (params: { searchTerm: string }) => any;
  submitSale: (payload: any) => any;
  showToast: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  resetForm: () => void;
  clearCart: () => void;
  navigate: (path: string) => void;
}

export const executeSave = async ({
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
  clearCart,
  navigate,
}: ExecuteSaveParams): Promise<void> => {
  try {
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
          (c: Customer) => c.name.toLowerCase().trim() === customerName.toLowerCase().trim() &&
               c.mobile === customerMobile.trim()
        );
        
        if (matchingCustomer && matchingCustomer.id) {
          customerId = matchingCustomer.id;
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
      const errorMessage = productsError && typeof productsError === 'object' && 'data' in productsError
        ? (productsError.data as any)?.message || 'Failed to load products'
        : 'Failed to load products. The products API endpoint may not be available.';
      showToast(errorMessage + ' Please refresh the page and try again.', 'error');
      return;
    }

    if (!apiProducts || apiProducts.length === 0) {
      showToast('Products are not available. Please ensure products are loaded before saving.', 'error');
      return;
    }

    const totalQuantity = salesItems.reduce((sum, item) => sum + parseFloat(item.quantity || '0'), 0);
    const totalDiscountPercent = salesItems.length > 0 
      ? salesItems.reduce((sum, item) => sum + parseFloat(item.discountPercent || '0'), 0) / salesItems.length
      : 0;
    
    const lines = salesItems.map(item => {
      const productId = getProductIdFromName(item.productName, apiProducts);
      
      if (!productId) {
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
    
    const result = await submitSale(submitSalePayload).unwrap();
    
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
    
    showToast('Sale submitted successfully!', 'success');
    resetForm();
    clearCart();
    
    setTimeout(() => {
      navigate('/sales/sale-history');
    }, 1500);
  } catch (error: any) {
    console.error('❌ Error saving receipt:', error);
    const errorMessage = error?.data?.message || error?.message || 'Failed to save receipt. Please try again.';
    showToast(errorMessage, 'error');
  }
};

