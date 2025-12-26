import { Customer, AddCustomerRequest } from '../../redux/slices/salesApi';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getProductIdFromName } from './SalesReceipt.handlers';
import { saveSalesHistoryToStorage } from '../../utils/cartStorage';
import { extractErrorMessage, logError } from '../../utils/errorUtils';


// Helper function to format stock error messages in a user-friendly way
const formatStockErrorMessage = (errorMessage: string): string => {
  if (!errorMessage) return errorMessage;
  
  // Check for "No stock found" patterns
  const noStockPattern = /no stock found/i;
  const productIdPattern = /product_id\s*(\d+)/i;
  const batchPattern = /batch_number\s*([^\s,]+)/i;
  
  if (noStockPattern.test(errorMessage)) {
    const productIdMatch = errorMessage.match(productIdPattern);
    const batchMatch = errorMessage.match(batchPattern);
    
    if (productIdMatch && batchMatch) {
      return `⚠️ Insufficient stock: The selected batch "${batchMatch[1]}" for this product is not available. Please select a different batch or reduce the quantity.`;
    } else if (productIdMatch) {
      return `⚠️ Insufficient stock: This product is not available in the selected quantity. Please reduce the quantity or select a different batch.`;
    } else {
      return `⚠️ Insufficient stock: The selected product/batch is not available. Please select a different batch or reduce the quantity.`;
    }
  }
  
  // Check for other stock-related errors
  if (/insufficient|not available|out of stock|stock.*not found/i.test(errorMessage)) {
    return `⚠️ ${errorMessage}`;
  }
  
  return errorMessage;
};

interface ExecuteSaveParams {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  patientType: string;
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
  updateSales?: (payload: { id: number; data: any }) => any; // Update sales mutation for edit mode
  showToast: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  resetForm: () => void;
  clearCart: () => void;
  navigate: (path: string) => void;
  invoiceId?: number; // Invoice ID for edit mode
  isEditMode?: boolean; // Flag to indicate edit mode
}

export const executeSave = async ({
  customerName,
  customerMobile,
  customerCity,
  patientType,
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
  clearCart,
  navigate,
  invoiceId,
  isEditMode,
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

    // Get customer_id from selected customer
    // If customer was created via modal, it will have a valid ID
    // Otherwise, we'll send customer_id = 0 and let backend handle validation
    let customerId: number = 0;
    
    if (selectedCustomer && selectedCustomer.id && selectedCustomer.id > 0) {
      customerId = selectedCustomer.id;
      console.log('✅ Using customer ID from selected customer:', customerId);
    } else {
      // No customer ID available - send 0 and let backend validate
      // Backend will return error if customer_id is required and invalid
      console.log('⚠️ No customer ID available, sending customer_id = 0. Backend will validate.');
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
    
    const lines = salesItems.map((item, index) => {
      const productId = getProductIdFromName(item.productName, apiProducts);
      
      if (!productId) {
        logError(`Product ID not found for: ${item.productName}`, 'SalesReceipt');
        throw new Error(`Product ID not found for product: "${item.productName}". Please check if the product name matches exactly.`);
      }

      // Backend requires batch_number for each line item
      const batchNumber = (item.batch || '').toString().trim();
      if (!batchNumber) {
        throw new Error(`Batch number is required for product "${item.productName}" (item ${index + 1})`);
      }

      const quantity = parseFloat(item.quantity || '0');
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for product "${item.productName}" (item ${index + 1})`);
      }

      const lineItem = {
        product_id: productId,
        quantity: quantity,
        batch_number: batchNumber, // Required by backend
        mrp: parseFloat(item.mrp || '0'),
        sp: parseFloat(item.unitPrice || '0'),
        discount: parseFloat(item.discountPercent || '0') / 100,
        discount_authority: item.discountAuthorizedBy || undefined, // Send name instead of ID
      };
      
      return lineItem;
    });

    // Build payload according to backend expectations
    // Backend expects: disc, payment_method, payment_amount, created_by, customer_id, doctor_id (optional), lines
    // For return flow: invoice_number and invoice_date should be included when available (invoice already stored in DB)
    const submitSalePayload = {
      disc: totalDiscountPercent / 100,
      payment_method: paymentMode || 'Cash',
      payment_amount: parseFloat(totalPayableAmount || '0'),
      created_by: user?.username || 'Guest',
      customer_id: customerId, // Must be valid number > 0
      // doctor_id: undefined, // Optional - can be added later if needed
      // Include invoice_number and invoice_date for return flow (when invoice already exists in DB)
      ...(invoiceNumber && invoiceNumber.trim() ? { invoice_number: invoiceNumber.trim() } : {}),
      ...(invoiceDate && invoiceDate.trim() ? { invoice_date: invoiceDate.trim() } : {}),
      lines: lines, // Already in correct format from lines.map above
    };
    
    // In edit mode, skip API call and just update localStorage (no backend endpoint)
    if (isEditMode && invoiceId) {
      // Edit mode: Just update localStorage, skip all API calls
      // No submitSale or updateSales endpoint will be called
      console.log('Edit mode: Updating sale in localStorage only (no API call) with invoiceId:', invoiceId);
    } else {
      // New sale mode: Call the submitSale API endpoint
      // Debug: Log the payload to verify discount_authority is being sent
      console.log('New sale: Submitting sale with payload:', JSON.stringify(submitSalePayload, null, 2));
      
      let result;
      try {
        console.log('🔄 Calling backend API: POST /api/sales/submit-sale');
        console.log('📦 Payload:', JSON.stringify(submitSalePayload, null, 2));
        
        result = await submitSale(submitSalePayload).unwrap();
        
        console.log('✅ Backend API Response:', JSON.stringify(result, null, 2));
        console.log('📊 Response status: Success');
        
        // Validate that the API call was successful
        if (!result) {
          console.error('❌ No response received from server');
          throw new Error('No response received from server. Sale may not have been saved to database.');
        }
        
        // Check if response indicates success (has message or invoice_number)
        if (result.message || result.invoice_number !== undefined) {
          // Update invoice number from API response if provided
          if (result.invoice_number && !invoiceNumber) {
            invoiceNumber = result.invoice_number.toString();
            console.log('📝 Invoice number updated from API response:', invoiceNumber);
          }
          console.log('✅ Sale successfully saved to database. Invoice number:', result.invoice_number || invoiceNumber);
          console.log('📋 Response message:', result.message || 'Success');
        } else {
          console.warn('⚠️ API response does not indicate clear success:', result);
          console.warn('⚠️ Response missing expected fields (message or invoice_number)');
          // Still continue, but log a warning
        }
      } catch (submitError: any) {
        console.error('❌ Backend API Error:', submitError);
        console.error('❌ Error status:', submitError?.status);
        console.error('❌ Error data:', submitError?.data);
        console.error('❌ Full error object:', JSON.stringify(submitError, null, 2));
        logError(submitError, 'SalesReceipt.submitSale');
        
        let errorMessage = 'Failed to submit sale. Please try again.';
        
        if (submitError?.data) {
          if (typeof submitError.data === 'string') {
            errorMessage = submitError.data;
          } else if (submitError.data.error) {
            errorMessage = submitError.data.error;
          } else if (submitError.data.message) {
            errorMessage = submitError.data.message;
          } else if (submitError.data.detail) {
            errorMessage = submitError.data.detail;
          }
        } else if (submitError?.message) {
          errorMessage = submitError.message;
        }
        
        // Format stock error messages to be more user-friendly
        const formattedErrorMessage = formatStockErrorMessage(errorMessage);
        throw new Error(formattedErrorMessage);
      }
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
    // Pass invoiceId to update existing entry instead of creating duplicate
    saveSalesHistoryToStorage(historyItem, invoiceId);
    
    // Show success toast with a small delay to ensure dialog has closed and DOM is ready
    const successMessage = isEditMode 
      ? 'Sale updated successfully!' 
      : 'Sale submitted successfully!';
    
    // Use requestAnimationFrame to ensure toast is shown after dialog closes and DOM updates
    requestAnimationFrame(() => {
      setTimeout(() => {
        showToast(successMessage, 'success');
      }, 200);
    });
    
    // Wait to ensure toast is visible before resetting and navigating
    setTimeout(() => {
      resetForm();
      clearCart();
      
      // Navigate after form is reset, giving more time for toast to be seen
      setTimeout(() => {
        navigate('/sales');
      }, 1000);
    }, 3000);
  } catch (error: unknown) {
    logError(error, 'SalesReceipt.executeSave');
    
    const errorMessage = extractErrorMessage(error, 'Failed to save receipt. Please try again.');
    
    showToast(errorMessage, 'error');
  }
};

