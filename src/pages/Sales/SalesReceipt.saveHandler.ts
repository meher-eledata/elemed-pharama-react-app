import { Customer } from '../../redux/slices/salesApi';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getProductIdFromName } from './SalesReceipt.handlers';
import { saveSalesHistoryToStorage } from '../../utils/cartStorage';
import { extractErrorMessage, logError } from '../../utils/errorUtils';

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
    if (!customerName || !customerName.trim()) {
      showToast('Please enter or select a customer name', 'warning');
      return;
    }
    
    if (!customerMobile || !customerMobile.trim()) {
      showToast('Please enter a customer mobile number', 'warning');
      return;
    }

    let customerId: number = 0;
    
    if (selectedCustomer && selectedCustomer.id && selectedCustomer.id > 0) {
      customerId = selectedCustomer.id;
    } else {
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
        logError(`Product ID not found for: ${item.productName}`, 'SalesReceipt');
        throw new Error(`Product ID not found for product: "${item.productName}". Please check if the product name matches exactly.`);
      }

      const lineItem = {
        product_id: productId,
        quantity: parseFloat(item.quantity || '0'),
        mrp: parseFloat(item.mrp || '0'),
        sp: parseFloat(item.unitPrice || '0'),
        discount: parseFloat(item.discountPercent || '0') / 100,
      };
      
      return lineItem;
    });

    const submitSalePayload = {
      quantity: totalQuantity,
      disc: totalDiscountPercent / 100,
      payment_method: paymentMode || 'Cash',
      payment_amount: parseFloat(totalPayableAmount || '0'),
      created_by: user?.username || 'Guest',
      customer_id: customerId,
      customer_name: customerName.trim(),
      customer_mobile: customerMobile.trim(),
      lines: lines,
    };
    
    let result;
    try {
      result = await submitSale(submitSalePayload).unwrap();
    } catch (submitError: any) {
      logError(submitError, 'SalesReceipt.submitSale');
      throw submitError;
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
  } catch (error: unknown) {
    logError(error, 'SalesReceipt.executeSave');
    
    const errorMessage = extractErrorMessage(error, 'Failed to save receipt. Please try again.');
    
    showToast(errorMessage, 'error');
  }
};

