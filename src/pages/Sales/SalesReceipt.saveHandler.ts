import dayjs from 'dayjs';
import { Customer, AddCustomerRequest, InsufficientStockItem, SubmitSaleError } from '../../redux/slices/salesApi';
import { SalesReceiptItem } from './SalesReceipt.types';
import { getProductIdFromName } from './SalesReceipt.handlers';
import { saveSalesHistoryToStorage, clearCartFromStorage, clearFormDataFromStorage } from '../../utils/cartStorage';
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
  customerDetails: string;
  patientType: string;
  doctorName: string;
  doctorId?: number;
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
  splitPayments?: any[]; // Array of split payments
  submitSale: (payload: any) => any;
  editSale: (payload: any) => any;
  upsertInvoicePayments?: (payload: any) => any; // Function to call the new API
  updateSales?: (payload: any) => any;
  showToast: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  resetForm: () => void;
  clearCart: () => void;
  navigate: (path: string) => void;
  invoiceId?: number; // Invoice ID for edit mode
  isEditMode?: boolean; // Flag to indicate edit mode
  editModeData?: any; // Original state data from navigation
  originalSalesItems?: SalesReceiptItem[]; // For diff tracking in edit mode
  skipNavigation?: boolean; // Flag to skip navigation after save
  onSuccess?: () => void; // Optional callback after successful save
  // New-sale only: receives the server-assigned display number ("INV<n>") from the
  // submit-sale response so the UI (print preview / receipt) can show it.
  onInvoiceNumberAssigned?: (displayNumber: string) => void;
  onSaleSaved?: () => void | Promise<void>; // Runs once the sale is persisted (before nav) — used to discard a resumed draft
  // Renders a per-medicine "not enough stock" list (backend 409). When provided, the sale is
  // aborted cleanly (cart + resumed draft preserved) instead of surfacing a generic toast.
  onStockShortage?: (lines: string[]) => void;
}

export const executeSave = async ({
  customerName,
  customerMobile,
  customerCity,
  customerDetails,
  patientType,
  doctorName,
  doctorId,
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
  editSale,
  upsertInvoicePayments,
  showToast,
  resetForm,
  clearCart,
  navigate,
  invoiceId,
  isEditMode,
  editModeData,
  originalSalesItems,
  skipNavigation = false,
  onSuccess,
  onInvoiceNumberAssigned,
  onSaleSaved,
  onStockShortage,
  splitPayments = [],
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

    const customerId = (selectedCustomer && selectedCustomer.id && !isNaN(Number(selectedCustomer.id)))
      ? Number(selectedCustomer.id)
      : 0;

    if (customerId === 0) {
      console.log('⚠️ No customer ID available, sending customer_id = 0.');
    } else {
      console.log('✅ Final Customer ID for payload:', customerId);
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
      ? (salesItems.reduce((sum, item) => sum + parseFloat(item.discountPercent || '0'), 0) / salesItems.length)
      : 0;

    const lines = salesItems.map((item, index) => {
      // Use product_id from cart item if available (more reliable than looking up by name)
      // Fallback to lookup by name if product_id is not available
      let productId: number | null = null;

      if (item.product_id && item.product_id > 0) {
        productId = item.product_id;
      } else {
        // Fallback: lookup by name
        productId = getProductIdFromName(item.productName, apiProducts);
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
        cgst: cgstPercent, // Keep tax as is (might be 2.5) but fix precision below
        sgst: sgstPercent,
        igst: igstPercent,
        pack_qty: parseFloat(item.pack_qty?.toString() || '1'),
      };
      // Clean up tax precision (e.g., 2.5 instead of 2.50000001)
      lineItem.cgst = parseFloat(lineItem.cgst.toFixed(2));
      lineItem.sgst = parseFloat(lineItem.sgst.toFixed(2));
      lineItem.igst = parseFloat(lineItem.igst.toFixed(2));


      return lineItem;
    });

    // Display number used for the local history entry. Edit mode keeps the existing
    // number; for a new sale the backend assigns it at submit and we read it from the
    // response below ("INV" prefix stays a display-layer concern).
    let finalInvoiceNumber = isEditMode ? invoiceNumber : '';

    const patientTypeNumber = patientType === 'In Patient' ? 0 : 1;

    // The invoiceDate state is canonical ISO YYYY-MM-DD. Validate strictly and,
    // if it is not a real ISO date, block the save (never silently substitute today)
    // and surface the error the same way as the other validations above.
    const invoiceDateForBackend = (invoiceDate || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDateForBackend) || !dayjs(invoiceDateForBackend).isValid()) {
      showToast('Please select a valid invoice date', 'warning');
      return;
    }

    // Helper to map UI payment modes to backend keys
    // Aligned with other modules to send UPPERCASE strings (e.g., "CASH", "CREDIT CARD")
    // This ensures backend report logic can correctly categorize the payment type.
    const getBackendPaymentMethod = (mode: string) => {
      const normalized = (mode || 'CASH').trim().toUpperCase();
      // Handle "CASH" as the default if empty or invalid
      return normalized || 'CASH';
    };

    const backendPaymentMethod = getBackendPaymentMethod(paymentMode);

    const submitSalePayload = {
      disc: 0, // Backend expects a flat Rupee deduction here, but frontend only uses per-item discounts
      payment_method: backendPaymentMethod,
      payment_mode: backendPaymentMethod, // Dual naming sync
      payment_amount: parseFloat(totalPayableAmount || '0'),
      created_by: user?.username || 'Guest',
      customer_id: customerId,
      customer_name: customerName,
      customer_mobile: customerMobile,
      customer_phone: customerMobile, // Snapshotted onto the invoice alongside customer_id
      customer_city: customerCity,
      // Free-text "Details"; backend trims and stores blank as NULL (≤150 chars)
      customer_details: (customerDetails || '').trim(),
      doctor_id: doctorId,
      doctor_name: doctorName,
      doctor_mobile: doctorMobile,
      doctor_email: doctorEmail,
      patient_type: patientTypeNumber,
      // invoice_number is intentionally NOT sent — the backend assigns it at submit
      // and returns it in the 201 response.
      invoice_date: invoiceDateForBackend,
      lines: lines,
      payments: splitPayments && splitPayments.length > 0 ? splitPayments.map(p => ({
        payment_method: getBackendPaymentMethod(p.paymentMethod || p.payment_method || 'CASH'),
        amount: p.amount,
        details: p.details
      })) : undefined
    };

    // Override payment method if split payments exist
    if (splitPayments && splitPayments.length > 0) {
      submitSalePayload.payment_method = "MULTIPLE";
      submitSalePayload.payment_mode = "MULTIPLE";
    }

    // In edit mode, call the specialized editSale API to synchronize with database
    if (isEditMode && invoiceId) {
      console.log('Edit mode: Computing line item changes (Added/Edited/Deleted)...');

      const deletedLines: number[] = [];
      const addedLines: any[] = [];
      const editedLines: any[] = [];

      // 1. Identify Deleted lines (Lines that were in original but are not in current list)
      if (originalSalesItems) {
        originalSalesItems.forEach(orig => {
          const stillExists = salesItems.find(curr => curr.id === orig.id);
          if (!stillExists) {
            const lineId = parseInt(orig.id);
            if (!isNaN(lineId)) {
              deletedLines.push(lineId);
            }
          }
        });
      }

      // 2. Identify Added and Edited lines
      salesItems.forEach(curr => {
        const lineItem = {
          product_id: curr.product_id || 0,
          quantity: parseFloat(curr.quantity || '0'),
          batch_number: curr.batch,
          mrp: parseFloat(curr.mrp || '0'),
          sp: parseFloat(curr.unitPrice || '0'),
          discount: parseFloat(curr.discountPercent || '0'),
          cgst: parseFloat(parseFloat(curr.cgstPercent || '0').toFixed(2)),
          sgst: parseFloat(parseFloat(curr.sgstPercent || '0').toFixed(2)),
          igst: parseFloat(parseFloat(curr.igstPercent || '0').toFixed(2)),
          pack_qty: parseFloat(curr.pack_qty?.toString() || '1'),
          discount_authority: curr.discountAuthorizedBy,
        };

        const original = originalSalesItems?.find(orig => orig.id === curr.id);
        if (!original || isNaN(parseInt(curr.id))) {
          // No original item with this ID found OR ID is synthetic -> New item added during edit
          addedLines.push(lineItem);
        } else {
          // Original item found with valid numeric ID -> Send as edited
          editedLines.push({
            ...lineItem,
            invoice_line_id: parseInt(curr.id)
          });
        }
      });

      const editSalePayload = {
        invoice_id: Number(invoiceId),
        invoice_number: invoiceNumber,
        quantity: salesItems.length,
        disc: 0, // Overall discount in Rupees (set to 0 since we use per-item discount percentages)
        payment_method: backendPaymentMethod,
        payment_mode: backendPaymentMethod,
        payment_amount: parseFloat(totalPayableAmount || '0'),
        customer_id: (selectedCustomer?.id && selectedCustomer.id > 0)
          ? selectedCustomer.id
          : (editModeData?.customer_id && editModeData.customer_id > 0 ? editModeData.customer_id : null), // null = keep existing backend value, never overwrite with 0
        customer_name: customerName,
        customer_mobile: customerMobile,
        customer_phone: customerMobile, // Snapshotted onto the invoice alongside customer_id
        customer_city: customerCity,
        // Free-text "Details"; re-saved on every edit (backend trims, blank → NULL)
        customer_details: (customerDetails || '').trim(),
        doctor_id: doctorId,
        doctor_name: doctorName,
        doctor_mobile: doctorMobile,
        doctor_email: doctorEmail,
        patient_type: patientTypeNumber,
        created_by: user?.username || 'meher',
        invoice_date: invoiceDateForBackend,
        Deleted: deletedLines,
        Added: addedLines,
        Edited: editedLines,
      };

      console.log('📡 Calling backend API: POST /api/sales/edit-sale');
      console.log('📦 Payload:', JSON.stringify(editSalePayload, null, 2));
      const result = await editSale(editSalePayload).unwrap();
      console.log('✅ Backend API Response (edit-sale):', result);

      // Synchronize payments in Edit Mode (covers both split and single-payment cases).
      // editSale only updates the Invoice row; the Payment table is owned by upsert-invoice-payments,
      // so we always call it after editSale to keep payment records in sync with the new bill total.
      if (invoiceId && upsertInvoicePayments) {
        const hasSplit = Array.isArray(splitPayments) && splitPayments.length > 0;
        const paymentsPayload = hasSplit
          ? splitPayments.map(p => {
              const paymentId = (p.id && !p.id.toString().startsWith('payment-') && !p.id.toString().startsWith('existing-payment-')) ? parseInt(p.id.toString(), 10) : undefined;
              return {
                id: paymentId,
                payment_method: getBackendPaymentMethod(p.paymentMethod || p.payment_method || 'CASH'),
                direction: 'IN',
                payment_amount: Number(p.amount || p.payment_amount || 0),
                transaction_date: p.transaction_date || p.transactionDate || new Date().toISOString(),
                transaction_number: p.transaction_number || p.transactionNumber || '',
                payment_vendor: p.payment_vendor || p.paymentVendor || null,
                details: p.details || null
              };
            })
          : [{
              payment_method: backendPaymentMethod,
              direction: 'IN',
              payment_amount: parseFloat(totalPayableAmount || '0'),
              transaction_date: new Date().toISOString(),
              transaction_number: '',
              payment_vendor: null,
              details: null
            }];

        console.log(hasSplit ? '🔄 Syncing split payments during Edit Mode...' : '🔄 Syncing single payment during Edit Mode...');
        try {
          await upsertInvoicePayments({
            invoice_id: Number(invoiceId),
            created_by: user?.username || 'Guest',
            payments: paymentsPayload
          }).unwrap();
          console.log('✅ Edit-mode payments synced successfully');
        } catch (paymentError) {
          console.error('❌ Failed to sync payments during edit:', paymentError);
          showToast('Sale updated, but failed to sync updated payment details.', 'warning');
        }
      }
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

        // Check if response indicates success (has message or the assigned invoice_number).
        // 201 shape: { message, invoice_id, invoice_number, patient_type, totals, lines }
        const hasMessage = result.message;
        const hasTopLevelInvoiceNumber = result.invoice_number !== undefined;

        if (hasMessage || hasTopLevelInvoiceNumber) {
          // Database id of the created invoice (top-level invoice_id on the 201).
          let dbInvoiceId: number | undefined = undefined;
          if (result.invoice_id !== undefined && result.invoice_id !== null) {
            dbInvoiceId = typeof result.invoice_id === 'number'
              ? result.invoice_id
              : parseInt(String(result.invoice_id), 10);
            console.log('✅ Found invoice_id in response:', dbInvoiceId);
          }

          // Read the SERVER-ASSIGNED invoice number (top-level, plain numeric string,
          // e.g. "947"). The "INV" display prefix is added here (display-layer concern only).
          let savedInvoiceNumber = '';
          let numericInvoiceNumber = 0;
          const rawAssigned = result.invoice_number;
          const parsedAssigned = typeof rawAssigned === 'number'
            ? rawAssigned
            : parseInt(String(rawAssigned ?? ''), 10);
          if (!isNaN(parsedAssigned) && parsedAssigned > 0) {
            numericInvoiceNumber = parsedAssigned;
            savedInvoiceNumber = `INV${numericInvoiceNumber}`;
            console.log('✅ Server-assigned invoice number:', savedInvoiceNumber);
            if (onInvoiceNumberAssigned) {
              onInvoiceNumberAssigned(savedInvoiceNumber);
            }
          } else {
            console.warn('⚠️ No assigned invoice_number found in submit-sale response');
          }
          console.log('💾 Database invoice ID from response:', dbInvoiceId);

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

          // Call upsertInvoicePayments if we have an invoice ID and split payments
          if (dbInvoiceId && splitPayments && splitPayments.length > 0 && upsertInvoicePayments) {
            console.log('🔄 Calling upsert-invoice-payments...');
            try {
              await upsertInvoicePayments({
                invoice_id: dbInvoiceId,
                created_by: user?.username || 'Guest',
                payments: splitPayments.map(p => {
                  const paymentId = (p.id && !p.id.toString().startsWith('payment-') && !p.id.toString().startsWith('existing-payment-')) ? parseInt(p.id.toString(), 10) : undefined;
                  return {
                    id: paymentId,
                    payment_method: getBackendPaymentMethod(p.paymentMethod || p.payment_method || 'CASH'),
                    direction: 'IN',
                    payment_amount: Number(p.amount || p.payment_amount || 0),
                    transaction_date: p.transaction_date || p.transactionDate || new Date().toISOString(),
                    transaction_number: p.transaction_number || p.transactionNumber || '',
                    payment_vendor: p.payment_vendor || p.paymentVendor || null,
                    details: p.details || null
                  };
                })
              }).unwrap();
              console.log('✅ Payments upserted successfully');
            } catch (paymentError) {
              console.error('❌ Failed to upsert payments:', paymentError);
              showToast('Sale saved, but failed to save split payment details.', 'warning');
            }
          }

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

        // Structured out-of-stock response (HTTP 409): name each short medicine so the user
        // can fix quantities. Abort cleanly — do NOT throw (that would hit the generic toast),
        // and do NOT reach the success path, so the cart and any resumed draft are preserved.
        const short = (submitError?.data as SubmitSaleError | undefined)?.insufficient_stock;
        if (Array.isArray(short) && short.length) {
          const resolveName = (it: InsufficientStockItem): string => {
            if (it.product_name && it.product_name.trim()) return it.product_name;
            // Fall back to the local cart line: match product_id (+ batch when it disambiguates).
            const byIdAndBatch = salesItems.find(
              li => li.product_id != null && Number(li.product_id) === Number(it.product_id)
                && (li.batch || '').toString().trim() === it.batch_number
            );
            const match = byIdAndBatch
              || salesItems.find(li => li.product_id != null && Number(li.product_id) === Number(it.product_id));
            if (match?.productName && match.productName.trim()) return match.productName;
            return `Product ${it.product_id}`;
          };
          const lines = short.map(
            it => `• ${resolveName(it)} (batch ${it.batch_number}): need ${it.requested}, have ${it.available}`
          );
          if (onStockShortage) {
            onStockShortage(lines);
            return;
          }
          // Fallback when no dialog handler is wired: surface the list via the generic path.
          throw new Error(`Not enough stock for these items:\n${lines.join('\n')}`);
        }

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

    // Sale is now persisted — discard any resumed draft (non-fatal on failure).
    if (onSaleSaved) {
      try {
        await onSaleSaved();
      } catch (cleanupError) {
        logError(cleanupError, 'SalesReceipt.executeSave.onSaleSaved');
      }
    }

    const historyItem = {
      invoiceNumber: finalInvoiceNumber, // Edit: existing number; new sale: server-assigned ("INV<n>")
      invoiceDate,
      customerName,
      customerMobile,
      customerCity: customerCity || '',
      customerDetails: (customerDetails || '').trim(),
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
      splitPayments,
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

    if (skipNavigation) {
      if (onSuccess) {
        onSuccess();
      }
      return;
    }

    setTimeout(() => {
      resetForm();
      clearCart();
      // Explicitly clear local storage to prevent stale data on refresh/next sale
      clearCartFromStorage();
      clearFormDataFromStorage();

      // Navigate to sales history page (/sales) - the sale details will appear in the table
      navigate('/sales');
    }, 1000);
  } catch (error: unknown) {
    logError(error, 'SalesReceipt.executeSave');

    const errorMessage = extractErrorMessage(error, 'Failed to save receipt. Please try again.');

    showToast(errorMessage, 'error');
  }
};

