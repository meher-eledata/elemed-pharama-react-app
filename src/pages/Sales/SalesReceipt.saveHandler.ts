import { Customer, AddCustomerRequest } from '../../redux/slices/salesApi';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getProductIdFromName } from './SalesReceipt.handlers';
import { saveSalesHistoryToStorage, generateNextInvoiceNumber, saveInvoiceNumber } from '../../utils/cartStorage';
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
      // Use product_id from cart item if available (more reliable than looking up by name)
      // Fallback to lookup by name if product_id is not available
      let productId: number | null = null;

      if (item.product_id && item.product_id > 0) {
        productId = item.product_id;
        console.log(`✅ Using product_id from cart item: ${productId} for "${item.productName}"`);
      } else {
        // Fallback: lookup by name (may return wrong product_id if multiple products have same name)
        productId = getProductIdFromName(item.productName, apiProducts);
        console.log(`⚠️ Product ID not in cart item, looking up by name: ${productId} for "${item.productName}"`);
      }

      if (!productId || productId <= 0) {
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

      // Send tax percentages (not amounts) - backend will calculate amounts from percentages
      const cgstPercent = parseFloat(item.cgstPercent || '0');
      const sgstPercent = parseFloat(item.sgstPercent || '0');
      const igstPercent = parseFloat(item.igstPercent || '0');

      const lineItem = {
        product_id: productId,
        quantity: quantity,
        batch_number: batchNumber, // Required by backend
        mrp: parseFloat(item.mrp || '0'),
        sp: parseFloat(item.unitPrice || '0'),
        discount: parseFloat(item.discountPercent || '0'),
        discount_authority: item.discountAuthorizedBy || undefined, // Send name instead of ID
        cgst: cgstPercent, // Tax percentage (e.g., 1 for 1%)
        sgst: sgstPercent, // Tax percentage (e.g., 1 for 1%)
        igst: igstPercent, // Tax percentage (e.g., 2 for 2%)
      };

      return lineItem;
    });

    // Use the invoice number from state (should already be generated on mount)
    // If for some reason it's not set, generate it now
    let finalInvoiceNumber = invoiceNumber;
    if (!isEditMode && (!finalInvoiceNumber || !finalInvoiceNumber.trim())) {
      finalInvoiceNumber = generateNextInvoiceNumber();
      console.log('📝 Generated invoice number during save (should not happen normally):', finalInvoiceNumber);
    }

    // Send invoice number as-is to backend (format: "INV1", "INV2", etc.)
    // Backend expects the full formatted string with "INV" prefix
    let invoiceNumberForBackend = finalInvoiceNumber.trim();

    // Build payload according to backend expectations
    // Backend expects: disc, payment_method, payment_amount, created_by, customer_id, doctor_id (optional), lines
    // For return flow: invoice_number and invoice_date should be included when available (invoice already stored in DB)
    // Convert patient type: "In Patient" -> 0, "Out Patient" -> 1
    const patientTypeNumber = patientType === 'In Patient' ? 0 : 1;

    const submitSalePayload = {
      disc: totalDiscountPercent,
      payment_method: paymentMode || 'Cash',
      payment_amount: parseFloat(totalPayableAmount || '0'),
      created_by: user?.username || 'Guest',
      customer_id: customerId, // Must be valid number > 0
      customer_name: customerName,
      customer_mobile: customerMobile,
      customer_city: customerCity,
      doctor_name: doctorName,
      doctor_mobile: doctorMobile,
      doctor_email: doctorEmail,
      patient_type: patientTypeNumber, // 0 for "In Patient", 1 for "Out Patient"
      invoice_number: invoiceNumberForBackend, // Send numeric part only (e.g., "12" instead of "INV12")
      // doctor_id: undefined, // Optional - can be added later if needed
      // Include invoice_date for return flow (when invoice already exists in DB)
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

        // Check if response indicates success (has message or invoice/invoice_number)
        // Backend response structure: { invoice: { id, invoice_number, ... }, lines: [...], ... }
        const hasInvoice = result.invoice && (result.invoice.id !== undefined || result.invoice.invoice_number !== undefined);
        const hasMessage = result.message;
        const hasTopLevelInvoiceNumber = result.invoice_number !== undefined;

        if (hasMessage || hasInvoice || hasTopLevelInvoiceNumber) {
          // PRIORITY 1: Get database invoice ID from response (this is the actual database ID)
          // Backend response structure: { invoice: { id: 1, invoice_number: "1", ... }, ... }
          let dbInvoiceId: number | undefined = undefined;

          // Check nested invoice.id first (most common structure)
          if (result.invoice && result.invoice.id !== undefined && result.invoice.id !== null) {
            dbInvoiceId = typeof result.invoice.id === 'number'
              ? result.invoice.id
              : parseInt(String(result.invoice.id), 10);
            console.log('✅ Found invoice.id in response:', dbInvoiceId);
          }
          // Check for top-level invoice_id
          else if (result.invoice_id !== undefined && result.invoice_id !== null) {
            dbInvoiceId = typeof result.invoice_id === 'number'
              ? result.invoice_id
              : parseInt(String(result.invoice_id), 10);
            console.log('✅ Found invoice_id in response:', dbInvoiceId);
          }
          // Check for top-level id as fallback
          else if (result.id !== undefined && result.id !== null) {
            dbInvoiceId = typeof result.id === 'number'
              ? result.id
              : parseInt(String(result.id), 10);
            console.log('✅ Found id in response:', dbInvoiceId);
          }

          // Use invoice number from response if provided, otherwise use the one we generated
          let savedInvoiceNumber: string;
          let numericInvoiceNumber: number = 0;

          // Check nested invoice.invoice_number first
          if (result.invoice && result.invoice.invoice_number !== undefined && result.invoice.invoice_number !== null) {
            // Backend returns invoice_number as string (e.g., "1"), format it as "INV1"
            const parsed = typeof result.invoice.invoice_number === 'number'
              ? result.invoice.invoice_number
              : parseInt(String(result.invoice.invoice_number), 10);

            if (!isNaN(parsed) && parsed > 0) {
              numericInvoiceNumber = parsed;
              savedInvoiceNumber = `INV${numericInvoiceNumber}`;
              console.log('✅ Found valid invoice.invoice_number in response:', savedInvoiceNumber);
            } else {
              savedInvoiceNumber = finalInvoiceNumber;
              console.warn('⚠️ Invalid invoice.invoice_number in response, using generated:', savedInvoiceNumber);
            }
          }
          // Check top-level invoice_number
          else if (result.invoice_number !== undefined && result.invoice_number !== null) {
            const parsed = typeof result.invoice_number === 'number'
              ? result.invoice_number
              : parseInt(String(result.invoice_number), 10);

            if (!isNaN(parsed) && parsed > 0) {
              numericInvoiceNumber = parsed;
              savedInvoiceNumber = `INV${numericInvoiceNumber}`;
              console.log('✅ Found valid invoice_number in response:', savedInvoiceNumber);
            } else {
              savedInvoiceNumber = finalInvoiceNumber;
              console.warn('⚠️ Invalid invoice_number in response, using generated:', savedInvoiceNumber);
            }
          }
          // Fallback to generated invoice number
          else {
            savedInvoiceNumber = finalInvoiceNumber;
            // Extract numeric part from finalInvoiceNumber for fallback
            const cleaned = finalInvoiceNumber.replace(/^INV/i, '').trim();
            numericInvoiceNumber = parseInt(cleaned, 10) || 0;
            console.log('⚠️ Using generated invoice number:', savedInvoiceNumber);
          }

          // Save the invoice number to ensure counter is at least this number
          // (This is a safety check - the counter should already be incremented from mount)
          saveInvoiceNumber(savedInvoiceNumber);
          console.log('💾 Verified invoice number in storage:', savedInvoiceNumber);
          console.log('💾 Database invoice ID from response:', dbInvoiceId);
          console.log('💾 Numeric invoice number:', numericInvoiceNumber);

          // Update finalInvoiceNumber for use in history
          finalInvoiceNumber = savedInvoiceNumber;

          // CRITICAL: Always use database invoice_id for history storage if available
          // This ensures the saved history has the correct database invoice ID
          // DO NOT use the invoice number as the ID - they are different!
          if (dbInvoiceId !== undefined && dbInvoiceId > 0) {
            invoiceId = dbInvoiceId;
            console.log('✅ Using database invoice ID for history storage:', dbInvoiceId);
          } else {
            console.error('❌ CRITICAL: No database invoice_id found in response!');
            console.error('❌ Response structure:', JSON.stringify(result, null, 2));
            console.warn('⚠️ Falling back to invoice number as ID (this may cause issues):', numericInvoiceNumber);
            // Fallback: use invoice number as ID (but this is wrong - should never happen)
            invoiceId = numericInvoiceNumber;
          }

          console.log('✅ Sale successfully saved to database. Invoice number:', savedInvoiceNumber);
          console.log('📋 Response message:', result.message || 'Success');
        } else {
          // Even if response doesn't have invoice_number, verify the one we generated is saved
          saveInvoiceNumber(finalInvoiceNumber);
          console.log('💾 Verified generated invoice number in storage:', finalInvoiceNumber);
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
      invoiceNumber: finalInvoiceNumber, // Use the final invoice number (generated or from API)
      invoiceDate,
      customerName,
      customerMobile,
      customerCity: customerCity || '',
      doctorName: doctorName || '',
      doctorMobile: doctorMobile || '',
      doctorEmail: doctorEmail || '',
      username: user?.username || 'Guest',
      patientType: patientType || 'Out Patient', // Include patient type
      totalAmount: parseFloat(totalPayableAmount) || 0,
      items: salesItems,
      paymentMode,
      insuranceCompany,
      totalValue,
      totalDiscount,
      taxAmount,
      totalPayableAmount,
    };
    saveSalesHistoryToStorage(historyItem, invoiceId);

    const successMessage = isEditMode
      ? 'Sale updated successfully!'
      : 'Sale submitted successfully!';

    requestAnimationFrame(() => {
      setTimeout(() => {
        showToast(successMessage, 'success');
      }, 200);
    });

    setTimeout(() => {
      resetForm();
      clearCart();

      // Navigate to sales history page (/sales) - the sale details will appear in the table
      navigate('/sales');
    }, 1000);
  } catch (error: unknown) {
    logError(error, 'SalesReceipt.executeSave');

    const errorMessage = extractErrorMessage(error, 'Failed to save receipt. Please try again.');

    showToast(errorMessage, 'error');
  }
};

