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
  submitSale,
  showToast,
  resetForm,
  clearCart,
  navigate,
}: ExecuteSaveParams): Promise<void> => {
  try {
    // Validate that we have customer name and mobile
    if (!customerName || !customerName.trim()) {
      showToast('Please enter or select a customer name', 'warning');
      return;
    }
    
    if (!customerMobile || !customerMobile.trim()) {
      showToast('Please enter a customer mobile number', 'warning');
      return;
    }

    // Backend requires customer_id to be a number
    // Since we don't have endpoints to get customer IDs, we always send 0
    // The backend should use customer_name and customer_mobile to identify/create the customer
    let customerId: number = 0;
    
    // Only use ID if we already have it from selectedCustomer (e.g., from add-customer response)
    if (selectedCustomer && selectedCustomer.id && selectedCustomer.id > 0) {
      customerId = selectedCustomer.id;
      console.log('👤 Using customer ID from selectedCustomer:', customerId);
    } else {
      console.log('👤 No customer ID available - will send customer_id = 0');
      console.log('👤 Backend should use customer_name and customer_mobile to identify customer');
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
        console.error('❌ Product ID not found for:', item.productName);
        console.error('❌ Available products:', apiProducts.map(p => 
          Array.isArray(p) ? p[0] : p.name
        ));
        throw new Error(`Product ID not found for product: "${item.productName}". Please check if the product name matches exactly.`);
      }

      const lineItem = {
        product_id: productId,
        quantity: parseFloat(item.quantity || '0'),
        mrp: parseFloat(item.mrp || '0'),
        sp: parseFloat(item.unitPrice || '0'),
        discount: parseFloat(item.discountPercent || '0') / 100,
      };
      
      console.log('📦 Line item:', lineItem);
      return lineItem;
    });
    
    console.log('📋 Total lines to submit:', lines.length);

    const submitSalePayload = {
      quantity: totalQuantity,
      disc: totalDiscountPercent / 100,
      payment_method: paymentMode || 'Cash',
      payment_amount: parseFloat(totalPayableAmount || '0'),
      created_by: user?.username || 'Guest',
      customer_id: customerId, // Always send customer_id (0 if not found)
      customer_name: customerName.trim(), // Always send name
      customer_mobile: customerMobile.trim(), // Always send mobile
      lines: lines,
    };
    
    console.log('🚀 Submitting sale to /sales/submit-sale');
    console.log('📦 Payload:', JSON.stringify(submitSalePayload, null, 2));
    
    let result;
    try {
      result = await submitSale(submitSalePayload).unwrap();
      
      console.log('✅ Sale submitted successfully!');
      console.log('📄 Invoice ID:', result.invoice_id);
      console.log('📋 Invoice Lines:', result.lines.length);
      console.log('💬 Message:', result.message);
    } catch (submitError: any) {
      console.error('❌ Submit sale error:', submitError);
      console.error('❌ Error status:', submitError?.status);
      console.error('❌ Error data:', submitError?.data);
      console.error('❌ Error message:', submitError?.message);
      throw submitError; // Re-throw to be caught by outer catch
    }
    
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
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error keys:', Object.keys(error || {}));
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    
    // Extract error message from various possible locations
    let errorMessage = 'Failed to save receipt. Please try again.';
    
    if (error?.data) {
      // RTK Query error format
      if (typeof error.data === 'string') {
        errorMessage = error.data;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Show detailed error in console for debugging
    console.error('📝 Final error message to show user:', errorMessage);
    
    showToast(errorMessage, 'error');
  }
};

