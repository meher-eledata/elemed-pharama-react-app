import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Autocomplete
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { StandardButton, PharmaDatePicker } from '../../components/Common';
import { paymentMethods } from '../../config/constants/OrderDetail.constants';
import dayjs, { Dayjs } from 'dayjs';
import { SalesReceiptItem } from './SalesReceipt.types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { useSubmitSalesReturnMutation, useGetInvoiceDetailsMutation } from '../../redux/slices/salesApi';
import { useIdempotencyKey } from '../../hooks/useIdempotencyKey';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

interface ReturnItem extends SalesReceiptItem {
  returnQuantity: string;
  originalQuantity: string;
  originalAmount: string; // Store the original amount for proportional calculation
  invoice_line_id?: number;
  refundable_quantity?: number;
  product_id?: number; // Store product_id for product name lookup
  restock_action: string;
}

export default function SaleReturn() {
  const navigate = useNavigate();
  const location = useLocation();
  const invoiceData = location.state as {
    invoiceId: number;
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string;
    customerMobile: string;
    customerCity?: string;
    doctorName: string;
    doctorMobile?: string;
    doctorEmail?: string;
    username: string;
    totalAmount: number;
    totalDiscount?: number;
    taxAmount?: number;
    totalPayableAmount?: number;
    items?: SalesReceiptItem[];
    paymentMode?: string;
    insuranceCompany?: string;
  } | null;

  const user = useSelector((state: RootState) => state.auth.user);
  const [submitSalesReturn, { isLoading: isSubmittingReturn }] = useSubmitSalesReturnMutation();
  // One idempotency key per pending return submission: reused on retry of the
  // same failed payload, cleared after success.
  const { getKey: getIdempotencyKey, reset: resetIdempotencyKey } = useIdempotencyKey();
  const [getInvoiceDetails, { isLoading: isLoadingInvoiceDetails }] = useGetInvoiceDetailsMutation();

  const [returnDate, setReturnDate] = useState<Dayjs | null>(dayjs());
  const [returnPaymentType, setReturnPaymentType] = useState<string>('Cash');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [invoiceIdFromApi, setInvoiceIdFromApi] = useState<number | null>(null);
  const [invoiceNumberFromApi, setInvoiceNumberFromApi] = useState<number | null | undefined>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc'
  });
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilterKey, setCurrentFilterKey] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});
  const recalculateItemAmount = useCallback((item: ReturnItem, quantity: number) => {
    if (quantity === 0) {
      return {
        amount: '0.00',
        discount: '0.00',
        cgst: '0.00',
        sgst: '0.00',
        igst: '0.00',
      };
    }

    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discountPercent = parseFloat(item.discountPercent) || 0;
    const cgstPercent = parseFloat(item.cgstPercent) || 0;
    const sgstPercent = parseFloat(item.sgstPercent) || 0;
    const igstPercent = parseFloat(item.igstPercent) || 0;

    const baseAmount = unitPrice * quantity;

    const discountMultiplier = 1 - (discountPercent / 100);
    const discountedAmount = baseAmount * discountMultiplier;

    const discountAmount = (unitPrice * discountPercent / 100 * quantity).toFixed(2);

    // Calculate individual tax amounts for record (though removed from summary)
    const cgstAmount = discountedAmount * cgstPercent / 100;
    const sgstAmount = discountedAmount * sgstPercent / 100;
    const igstAmount = discountedAmount * igstPercent / 100;

    return {
      amount: discountedAmount.toFixed(2), // Refund the base amount after discount (Total Value - Discount)
      discount: discountAmount,
      cgst: cgstAmount.toFixed(2),
      sgst: sgstAmount.toFixed(2),
      igst: igstAmount.toFixed(2),
    };
  }, []);

  useEffect(() => {
    if (!invoiceData) {
      navigate('/sales');
      return;
    }

    let isMounted = true;


    let invoiceIdToFetch: number | null = null;

    if (invoiceData.invoiceId) {
      const idValue = typeof invoiceData.invoiceId === 'number'
        ? invoiceData.invoiceId
        : parseInt(String(invoiceData.invoiceId || '0'), 10);
      // Remove arbitrary 1,000,000 limit - trust the ID passed
      if (!isNaN(idValue) && idValue > 0) {
        invoiceIdToFetch = idValue;
        console.log('✅ Using invoiceId from state (database ID):', invoiceIdToFetch);
      }
    }


    console.log('📋 invoiceData received:', {
      invoiceId: invoiceData.invoiceId,
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceIdToFetch,
    });

    const fetchInvoiceDetails = async () => {
      const invoiceNumber = invoiceData.invoiceNumber;

      if (!invoiceNumber && !invoiceIdToFetch) {
        alert('Invalid invoice data passed to return page.');
        navigate('/sales');
        return;
      }

      try {

        let result;
        let lastError: any = null;

        if (invoiceIdToFetch) {
          console.log('🔍 Fetching invoice details for return using invoice_id (database ID):', invoiceIdToFetch);
          try {
            result = await getInvoiceDetails({ invoice_id: invoiceIdToFetch }).unwrap();
            console.log('✅ Invoice found using invoice_id');
          } catch (err: any) {
            lastError = err;
            console.log('❌ Invoice not found by invoice_id, trying with invoice_number...');
            if (invoiceNumber && err?.status === 404) {
              // Backend expects numeric part only (e.g., "26" instead of "INV26")
              // Strip the "INV" prefix before sending to backend
              let numericInvoiceNumber = invoiceNumber;
              if (typeof invoiceNumber === 'string') {
                const cleaned = invoiceNumber.replace(/^(INV-?|RB)/i, '').trim();
                numericInvoiceNumber = cleaned || invoiceNumber;
              }

              console.log('🔍 Trying with numeric invoice_number:', numericInvoiceNumber, '(original:', invoiceNumber, ')');
              try {
                result = await getInvoiceDetails({ invoice_number: numericInvoiceNumber }).unwrap();
                console.log('✅ Invoice found using numeric invoice_number');
              } catch (err2: any) {
                lastError = err2;
                throw err2;
              }
            } else {
              throw err;
            }
          }
        } else if (invoiceNumber) {
          // Backend expects numeric part only (e.g., "26" instead of "INV26")
          // Strip the "INV" prefix before sending to backend
          let numericInvoiceNumber = invoiceNumber;
          if (typeof invoiceNumber === 'string') {
            const cleaned = invoiceNumber.replace(/^(INV-?|RB)/i, '').trim();
            numericInvoiceNumber = cleaned || invoiceNumber;
          }

          console.log('🔍 Fetching invoice details using numeric invoice_number:', numericInvoiceNumber, '(original:', invoiceNumber, ')');
          try {
            result = await getInvoiceDetails({ invoice_number: numericInvoiceNumber }).unwrap();
            console.log('✅ Invoice found using numeric invoice_number');
          } catch (err: any) {
            lastError = err;
            throw err;
          }
        } else {
          throw new Error('No invoice_id or invoice_number available');
        }
        console.log('Invoice details response:', result);

        if (result && isMounted) {
          try {
            const invoice = result.invoice || {};
            const lines = result.lines || [];

            if (invoice.id) {
              setInvoiceIdFromApi(invoice.id);
              setInvoiceNumberFromApi(invoice.invoice_number);
              console.log('📝 Stored invoice id from API response:', invoice.id);
              console.log('📝 Invoice number from API response:', invoice.invoice_number);
            }

            console.log('📋 Invoice lines from API (full details):', lines);
            console.log('📋 Invoice lines summary:', lines.map((line: any) => ({
              invoice_line_id: line.invoice_line_id,
              invoice_id: line.invoice_id,
              id: line.id,
              product_name: line.name || line.product_name,
              is_same_as_invoice_id: line.invoice_line_id === line.invoice_id,
            })));
            // Backend currently returns voided payments alongside active ones; skip them.
            // Remove once getInvoiceDetails filters voided records.
            const payments = (result.payments || []).filter((p: any) => {
              const status = String(p?.status || '').toUpperCase();
              const paymentStatus = String(p?.payment_status || '').toUpperCase();
              return status !== 'VOID' && paymentStatus !== 'VOIDED';
            });
            const totalRefunded = result.total_refunded || 0;
            const netPaid = result.net_paid || 0;

            if (payments.length > 0 || totalRefunded > 0) {
              console.log('Invoice payment info:', { payments, totalRefunded, netPaid });
            }
            const originalItemsFromState = invoiceData.items || [];
            const originalItemsMap = new Map<string, any>();
            originalItemsFromState.forEach((item: any) => {
              const key = item.invoice_line_id?.toString() || item.id?.toString() || '';
              if (key) {
                originalItemsMap.set(key, item);
              }
            });

            if (lines.length > 0) {
              const items: ReturnItem[] = lines
                // Guard against legacy/inconsistent rows missing the required invoice_line_id —
                // without it the line cannot be returned, and dereferencing it downstream would
                // throw at render (ErrorBoundary "Something went wrong").
                .filter((line: any) => line && (line.invoice_line_id ?? line.id) != null)
                .map((line: any) => {
                const lineId = String(line.invoice_line_id ?? line.id ?? '');
                const originalItem = originalItemsMap.get(lineId);
                const productId = line.product_id || line.productId;

                const productName = line.name || line.product_name || line.productName || (productId ? `Product ID: ${productId}` : 'Unknown Product');

                let discountPercentValue = '0';
                const rawDisc = line.discount_percent ?? line.discountPercent ?? line.discount ?? 0;
                const discValue = Number(rawDisc) || 0;

                // Detection: if it looks like a fraction (e.g. 0.05 or 0.5), convert to percentage (5 or 50)
                discountPercentValue = (discValue > 0 && discValue <= 1)
                  ? (discValue * 100).toString()
                  : discValue.toString();


                const quantityValue = line.quantity !== undefined && line.quantity !== null
                  ? (typeof line.quantity === 'number' ? line.quantity : parseFloat(String(line.quantity)))
                  : (line.qty !== undefined && line.qty !== null
                    ? (typeof line.qty === 'number' ? line.qty : parseFloat(String(line.qty)))
                    : 0);
                const originalQty = isNaN(quantityValue) ? 0 : quantityValue;
                const returnedQty = Number.parseInt(String(line.returned_quantity ?? '0'), 10) || 0;
                const refundableQty = line.refundable_quantity !== undefined && line.refundable_quantity !== null
                  ? (Number.parseInt(String(line.refundable_quantity), 10) || 0)
                  : Math.max(0, originalQty - returnedQty);

                const unitPrice = Number(line.rate ?? line.unit_price) || 0;
                const quantity = originalQty > 0 ? originalQty : (Number(line.quantity ?? line.qty) || 1);
                const baseAmount = unitPrice * quantity;

                // Use refundable quantity for initial return quantity (not original quantity)
                // If refundable is 0, start with 0; otherwise start with refundable quantity
                const initialReturnQty = refundableQty;

                const discountAmount = Number(line.discount) || 0;
                const discountedAmount = baseAmount - discountAmount;


                const lineBaseForTax = baseAmount - discountAmount;

                // Helper for robust tax derivation with defaults (9/9/0)
                // Trust the stored value if it looks like a percentage (0.1 to 30)
                const deriveTaxPercent = (storedVal: any, base: number, defaultVal: string) => {
                  const val = parseFloat(storedVal || '0');

                  // Priority 1: If value is already a reasonable percentage (0.1% to 30%), USE IT DIRECTLY
                  if (val > 0.1 && val <= 30) return val.toString();

                  // Priority 2: If value is 0, check if we should use the mandatory default
                  if (val === 0) return defaultVal;

                  if (base === 0) return defaultVal;

                  // Priority 3: Fallback for OLD invoices storing absolute amounts
                  const calcPercent = (val / base) * 100;
                  const commonPercents = [2.5, 5, 6, 9, 12, 14, 18, 28];
                  const foundCommon = commonPercents.find(p => Math.abs(calcPercent - p) < 0.1);

                  if (foundCommon) {
                    return foundCommon.toString();
                  }

                  // If it's a small amount that looks like a percentage when calculated
                  if (calcPercent > 0.1 && calcPercent <= 30) return calcPercent.toFixed(1);

                  return defaultVal;
                };

                let cgstPercentValue = originalItem?.cgstPercent?.toString() || deriveTaxPercent(line.cgst || line.cgst_percent, lineBaseForTax, '9');
                let sgstPercentValue = originalItem?.sgstPercent?.toString() || deriveTaxPercent(line.sgst || line.sgst_percent, lineBaseForTax, '9');
                let igstPercentValue = originalItem?.igstPercent?.toString() || deriveTaxPercent(line.igst || line.igst_percent, lineBaseForTax, '0');

                const returnQty = originalQty || quantity || 0;

                const tempItem: ReturnItem = {
                  // Use invoice_line_id as the id (this is the unique identifier for the line item)
                  // DO NOT use line.id as fallback - it might be the invoice_id, not invoice_line_id
                  id: line.invoice_line_id?.toString() || '',
                  productName: productName || (productId ? `Product ID: ${productId}` : 'Unknown Product'),
                  manufacturer: line.brand_name || line.manufacturer || '', // API returns 'brand_name'
                  batch: line.batch_number || line.batch || '',
                  expiryDate: line.expiry_date || line.expiryDate || '',
                  quantity: String(returnQty),
                  type: line.product_type || line.type || 'N/A', // API returns 'product_type'
                  // Map backend 'selling_price' to 'unit_price', falling back to 'rate' or 'unit_price'
                  unitPrice: line.selling_price?.toString() || line.rate?.toString() || line.unit_price?.toString() || line.unitPrice?.toString() || '0',
                  mrp: line.mrp?.toString() || '0',
                  // Use calculated discount percentage
                  discountPercent: discountPercentValue,
                  // Use calculated tax percentages
                  cgstPercent: cgstPercentValue,
                  sgstPercent: sgstPercentValue,
                  igstPercent: igstPercentValue,
                  // Temporary values - will be recalculated
                  amount: '0',
                  discount: '0',
                  cgst: '0',
                  sgst: '0',
                  igst: '0',
                  returnQuantity: String(initialReturnQty), // Start with refundable quantity (0 if all returned)
                  originalQuantity: String(originalQty),
                  // Use selling_price for originalAmount as well
                  originalAmount: line.selling_price?.toString() || line.amount?.toString() || line.total?.toString() || '0',
                  // CRITICAL: Only use invoice_line_id from API response
                  // DO NOT fallback to line.id - it might be invoice_id, not invoice_line_id
                  // If invoice_line_id is missing, log an error and set to undefined
                  invoice_line_id: (() => {
                    if (line.invoice_line_id !== undefined && line.invoice_line_id !== null) {
                      const id = Number(line.invoice_line_id);
                      const invoiceId = line.invoice_id ? Number(line.invoice_id) : null;

                      // Note: invoice_line_id can sometimes match invoice_id if there's only one line item
                      // This is acceptable - we'll use the invoice_line_id as provided by the backend
                      if (invoiceId && id === invoiceId) {
                        console.warn(`⚠️ WARNING: invoice_line_id (${id}) matches invoice_id (${invoiceId})`);
                        console.warn(`   This can happen with single-line invoices. Proceeding with invoice_line_id: ${id}`);
                      }

                      console.log(`✅ Setting invoice_line_id from API: ${id} for product ${productName}`, {
                        invoice_line_id: id,
                        invoice_id: invoiceId,
                        status: 'OK',
                      });
                      return id;
                    } else {
                      console.error(`❌ Missing invoice_line_id in API response for product ${productName}:`, line);
                      return undefined;
                    }
                  })(),
                  refundable_quantity: refundableQty, // Use calculated refundable quantity from API
                  product_id: productId, // Store product_id for later lookup if needed
                  discountAuthorizedBy: line.discount_authority || undefined, // Map discount_authority if present
                  restock_action: 'RESTOCK', // Default action
                };

                // Recalculate amount based on the return quantity (which starts as refundable quantity)
                const calculated = recalculateItemAmount(tempItem, initialReturnQty);

                // Return the item with calculated values
                const finalItem = {
                  ...tempItem,
                  amount: calculated.amount,
                  discount: calculated.discount,
                  cgst: calculated.cgst,
                  sgst: calculated.sgst,
                  igst: calculated.igst,
                };

                // Debug: Log the invoice_line_id to verify it's correct
                console.log('📋 Created return item:', {
                  productName: finalItem.productName,
                  invoice_line_id: finalItem.invoice_line_id,
                  id: finalItem.id,
                  quantity: finalItem.returnQuantity,
                  // Warn if invoice_line_id looks suspicious (might be invoice_id instead)
                  warning: finalItem.invoice_line_id && finalItem.invoice_line_id > 10
                    ? '⚠️ invoice_line_id seems high, might be invoice_id!'
                    : 'OK',
                });

                return finalItem;
              });

              // Detailed debugging before setting returnItems
              console.group('🔍 DEBUG: About to set returnItems');
              console.log(`Total items from API: ${items.length}`);
              items.forEach((item, idx) => {
                console.log(`Return Item ${idx}:`, {
                  productName: item.productName,
                  invoice_line_id: item.invoice_line_id,
                  id: item.id,
                  hasInvoiceLineId: !!item.invoice_line_id,
                  type: typeof item.invoice_line_id,
                });
              });
              console.groupEnd();

              setReturnItems(items);
            }
          } catch (processError: any) {
            console.error('Error processing invoice data for return:', processError);
            alert(`Error processing invoice data: ${processError?.message || 'Unknown processing error'}`);
          }
        }
      } catch (error: any) {
        console.error('Error fetching invoice details for return:', error);
        alert(`Failed to fetch invoice details: ${error?.data?.error || error?.message || 'Unknown error'}`);
        navigate('/sales');
      }
    };

    fetchInvoiceDetails();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData?.invoiceId, invoiceData?.invoiceNumber]);

  useEffect(() => {
    console.log('Dialog state changed:', isConfirmDialogOpen);
  }, [isConfirmDialogOpen]);

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const originalQty = parseInt(returnItems[index].originalQuantity) || 0;
    // Use refundable_quantity if it's defined (even if 0), otherwise fall back to originalQty
    const refundableQty = returnItems[index].refundable_quantity !== undefined && returnItems[index].refundable_quantity !== null
      ? returnItems[index].refundable_quantity
      : originalQty;
    // Clamp between 0 and refundable quantity
    const clampedValue = Math.max(0, Math.min(numValue, refundableQty));

    setReturnItems(items => {
      const newItems = [...items];
      const item = newItems[index];
      newItems[index].returnQuantity = clampedValue.toString();

      const calculated = recalculateItemAmount(item, clampedValue);
      newItems[index].amount = calculated.amount;
      newItems[index].discount = calculated.discount;
      newItems[index].cgst = calculated.cgst;
      newItems[index].sgst = calculated.sgst;
      newItems[index].igst = calculated.igst;

      return newItems;
    });
  };

  const handleDiscountPercentChange = (index: number, value: string) => {
    setReturnItems(items => {
      const newItems = [...items];
      const item = newItems[index];
      const numValue = parseFloat(value) || 0;
      const clampedValue = Math.max(0, Math.min(numValue, 100)); // Clamp between 0 and 100

      // Update the discount percentage
      newItems[index].discountPercent = clampedValue.toString();

      // Recalculate amount, discount, and taxes with new discount percentage
      const quantity = parseInt(item.returnQuantity) || 0;
      const calculated = recalculateItemAmount(newItems[index], quantity);
      newItems[index].amount = calculated.amount;
      newItems[index].discount = calculated.discount;
      newItems[index].cgst = calculated.cgst;
      newItems[index].sgst = calculated.sgst;
      newItems[index].igst = calculated.igst;

      return newItems;
    });
  };

  const handleTaxPercentChange = (index: number, taxType: 'cgst' | 'sgst' | 'igst', value: string) => {
    setReturnItems(items => {
      const newItems = [...items];
      const item = newItems[index];
      const numValue = parseFloat(value) || 0;
      const clampedValue = Math.max(0, Math.min(numValue, 100));
      // Update the tax percentage
      if (taxType === 'cgst') {
        newItems[index].cgstPercent = clampedValue.toString();
      } else if (taxType === 'sgst') {
        newItems[index].sgstPercent = clampedValue.toString();
      } else if (taxType === 'igst') {
        newItems[index].igstPercent = clampedValue.toString();
      }

      // Recalculate amount and taxes with new tax percentage
      const quantity = parseInt(item.returnQuantity) || 0;
      const calculated = recalculateItemAmount(newItems[index], quantity);
      newItems[index].amount = calculated.amount;
      newItems[index].discount = calculated.discount;
      newItems[index].cgst = calculated.cgst;
      newItems[index].sgst = calculated.sgst;
      newItems[index].igst = calculated.igst;

      return newItems;
    });
  };

  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: '', direction: 'asc' });
      setCurrentPage(1);
      return;
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleFilterSelect = (key: string, value: string | null) => {
    setCurrentFilter(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    const dataToFilter = returnItems.filter(item => {
      // Filter to show only items with refundable quantity > 0
      const refundableQty = item.refundable_quantity !== undefined && item.refundable_quantity !== null
        ? item.refundable_quantity
        : parseInt(item.originalQuantity) || 0;
      return refundableQty > 0;
    });

    if (!currentSearchTerm.trim()) return dataToFilter;

    const searchTerm = currentSearchTerm.toLowerCase();
    return dataToFilter.filter(item =>
      item.productName.toLowerCase().includes(searchTerm) ||
      (item.batch && item.batch.toLowerCase().includes(searchTerm))
    );
  }, [returnItems, currentSearchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue === bValue) return 0;
      
      // Numeric sort for amount, unitPrice, discount
      if (['amount', 'unitPrice', 'discount'].includes(sortConfig.key)) {
        const aNum = parseFloat(String(aValue)) || 0;
        const bNum = parseFloat(String(bValue)) || 0;
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const handleCancel = () => {
    navigate('/sales');
  };

  const handleReturn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Return button clicked, opening dialog');
    console.log('Selected items:', selectedItems);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (isSubmittingReturn) return;
    console.log(' handleConfirmReturn called');

    if (!invoiceData) {
      console.error('❌ No invoiceData found');
      return;
    }

    if (!reason.trim()) {
      console.error('❌ Reason is empty');
      alert('Please provide a reason for the return');
      return;
    }

    if (selectedItems.length === 0) {
      console.error('❌ No items selected');
      alert('Please select at least one item to return');
      return;
    }

    console.log('✅ Validation passed, processing return...');
    console.log('📋 Selected items:', selectedItems);

    // Detailed debugging of selected items and their invoice_line_ids
    console.group('🔍 DEBUG: Selected Items Details');
    selectedItems.forEach((item, idx) => {
      console.log(`Item ${idx}:`, {
        productName: item.productName,
        invoice_line_id: item.invoice_line_id,
        id: item.id,
        returnQuantity: item.returnQuantity,
        restock_action: item.restock_action,
        type_invoice_line_id: typeof item.invoice_line_id,
        hasInvoiceLineId: !!item.invoice_line_id,
      });
    });
    console.groupEnd();

    try {
      // Try to get invoice_line_id from the item
      // It might be in invoice_line_id property, or in the id field if it's a number
      const lines = selectedItems
        .filter(item => {
          const returnQty = parseInt(item.returnQuantity) || 0;
          if (returnQty <= 0) {
            console.warn('⚠️ Item has zero return quantity:', item.productName);
            return false;
          }

          // Validate return quantity doesn't exceed refundable quantity
          const refundableQty = item.refundable_quantity !== undefined && item.refundable_quantity !== null
            ? item.refundable_quantity
            : parseInt(item.originalQuantity) || 0;

          if (returnQty > refundableQty) {
            console.error(`❌ Return quantity (${returnQty}) exceeds refundable quantity (${refundableQty}) for item:`, item.productName);
            alert(`Return quantity (${returnQty}) cannot exceed available quantity (${refundableQty}) for ${item.productName}`);
            return false;
          }

          // CRITICAL: Only proceed if invoice_line_id exists
          // Do NOT use item.id as fallback - it might be invoice_id, not invoice_line_id
          if (!item.invoice_line_id) {
            console.error('❌ Item missing invoice_line_id:', item);
            return false;
          }

          return true;
        })
        .map(item => {
          // CRITICAL: Only use invoice_line_id from the item
          // Do NOT fallback to item.id - it might be the invoice_id, not invoice_line_id
          if (!item.invoice_line_id) {
            console.error('❌ Missing invoice_line_id for item:', item);
            return null;
          }

          const line = {
            invoice_line_id: Number(item.invoice_line_id),
            batch_number: item.batch || '',
            quantity: parseInt(item.returnQuantity) || 0,
            restock_action: (item.restock_action || 'RESTOCK').toUpperCase(),
          };
          console.log('✅ Created line:', line);
          return line;
        })
        .filter((line): line is NonNullable<typeof line> => line !== null)
        .filter(line => {
          const hasValidId = line.invoice_line_id && Number(line.invoice_line_id) > 0;
          const hasValidQty = line.quantity && line.quantity > 0;
          return hasValidId && hasValidQty;
        });

      console.log('📦 Processed lines:', lines);

      if (lines.length === 0) {
        console.error('❌ No valid lines after processing. Selected items:', selectedItems);
        const hasInvalidIds = selectedItems.some(item => !item.invoice_line_id);
        if (hasInvalidIds) {
          alert('Cannot process return: Some items are missing invoice line IDs. Please ensure all selected items have valid invoice line IDs and return quantities.');
        } else {
          alert('No valid items selected for return. Please ensure items have valid invoice line IDs and return quantities greater than zero.');
        }
        return;
      }

      // Get invoice number from API response (for new invoices, invoice_number should always be set)
      // For new invoices only - invoice_number should exist in the database
      let invoiceNumber: string | number = '';

      // If invoiceNumberFromApi is set, it came directly from the backend (getInvoiceDetails)
      // This is the MOST reliable format to send back to the backend.
      if (invoiceNumberFromApi !== null && invoiceNumberFromApi !== undefined) {
        invoiceNumber = invoiceNumberFromApi;
        console.log('✅ Using database invoice_number from API response (PRIORITY 1):', invoiceNumber);
      } 
      // Priority 2: Use original invoiceNumber from location state (it might already be correct)
      else if (invoiceData.invoiceNumber) {
        // If it starts with INV or RB, it might be the full required string
        invoiceNumber = invoiceData.invoiceNumber;
        console.log('📝 Using original invoiceNumber from state (PRIORITY 2):', invoiceNumber);
      }

      console.log('📄 Final Invoice number resolved:', invoiceNumber, {
        fromApi: invoiceNumberFromApi,
        fromState: invoiceData.invoiceNumber,
      });

      const createdBy = user?.username || invoiceData.username || 'system';

      // Use the invoice ID from the API if we have it, otherwise fallback to navigation state
      const submissionInvoiceId = invoiceIdFromApi || (typeof invoiceData.invoiceId === 'number' ? invoiceData.invoiceId : null);

      if (!submissionInvoiceId) {
        console.error('❌ Cannot submit return: No invoice_id (database primary key) found.');
        alert('Cannot submit return because the backend ID for this invoice is missing. Please refresh the page and try again.');
        return;
      }

      const payload = {
        invoice_id: submissionInvoiceId,   // Database primary key is now the ONLY identifier
        created_by: createdBy,
        return_date: returnDate ? returnDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        reason: reason.trim(),
        notes: notes.trim(),
        lines: lines,
        payment_method: returnPaymentType, // FIXED: was missing — backend was always defaulting to Cash
      };

      console.log('🚀 SUBMITTING RETURN TO BACKEND');
      console.log('Final resolved invoice ID:', submissionInvoiceId);
      console.log('Prepared payload for submission:', payload);
      console.log('🌐 Endpoint: POST /sales/submit-sales-return/');

      const result = await submitSalesReturn({
        ...payload,
        idempotency_key: getIdempotencyKey(JSON.stringify(payload)),
      }).unwrap();
      resetIdempotencyKey();

      console.log('✅ Return submitted successfully:', result);
      setIsConfirmDialogOpen(false);

      // Navigate back to sale history after successful return
      navigate('/sales');
    } catch (error: any) {
      console.error('❌ Error submitting return:', error);
      console.error('❌ Error details:', {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        error: error?.error,
      });
      const errorMessage = error?.data?.error || error?.message || 'Failed to submit return. Please try again.';
      alert(errorMessage);
    }
  };

  const selectedItems = useMemo(() =>
    selectedRows.map(index => sortedData[index]).filter(Boolean),
    [selectedRows, sortedData]
  );

  const totalProducts = useMemo(() =>
    selectedItems.length,
    [selectedItems]
  );

  const totalQuantityReturned = useMemo(() =>
    selectedItems.reduce((sum, item) => sum + (parseInt(item.returnQuantity) || 0), 0),
    [selectedItems]
  );

  const totalAmountReturned = useMemo(() =>
    selectedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
    [selectedItems, returnItems] // Include returnItems to recalculate when amounts change
  );

  // Calculate total taxes for selected items
  const totalTaxAmount = useMemo(() =>
    selectedItems.reduce((sum, item) =>
      sum + (parseFloat(item.cgst || '0') + parseFloat(item.sgst || '0') + parseFloat(item.igst || '0')), 0
    ),
    [selectedItems, returnItems]
  );

  // Calculate total discount for selected items
  const totalDiscountAmount = useMemo(() =>
    selectedItems.reduce((sum, item) => sum + (parseFloat(item.discount || '0')), 0),
    [selectedItems, returnItems]
  );

  if (!invoiceData) {
    return null;
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F6F8FB', minHeight: '100vh' }}>
      {/* Header with Payment Type Section */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 3
      }}>
        {/* Title Section */}
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            Return items from invoice number {invoiceData.invoiceNumber}
          </Typography>
        </Box>

        {/* Payment Type Section - Right Side */}
        <Box sx={{
          display: 'flex',
          gap: 3,
          alignItems: 'flex-start'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#728197' }}>
              Return date
            </Typography>
            <PharmaDatePicker
              value={returnDate}
              onChange={(newValue) => setReturnDate(newValue)}
              width={200}
              height={40}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#728197' }}>
              Original payment type
            </Typography>
            <TextField
              value="Cash"
              disabled
              sx={{
                width: '150px',
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#F5F5F5',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #D1D5DB',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#F5F5F5',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid #D1D5DB',
                    },
                  },
                },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#728197' }}>
              Return payment type
            </Typography>
            <Autocomplete
              options={paymentMethods}
              value={returnPaymentType}
              onChange={(_, newValue) => {
                if (newValue) {
                  setReturnPaymentType(newValue);
                }
              }}
              disableClearable
              forcePopupIcon
              popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
              sx={{ width: '150px' }}
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiPaper-root": {
                      borderRadius: "12px",
                      marginTop: "4px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      border: "1px solid #E6ECF5",
                      height: "auto !important",
                      minHeight: "unset !important",
                      padding: "0px !important",
                      overflow: "hidden",
                      "& .MuiAutocomplete-listbox": {
                        padding: "0px !important",
                        maxHeight: "300px !important",
                        minHeight: "unset !important",
                        overflow: "auto",
                      },
                    },
                  },
                },
              }}
              ListboxProps={{
                sx: {
                  padding: '0px !important',
                  maxHeight: '300px !important',
                  minHeight: 'unset !important',
                  overflow: 'auto',
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select payment method"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #D1D5DB',
                      },
                    },
                  }}
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      {/* Product Selection Table */}
      <Box sx={{
        mb: 3,
        mt: 3,
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #E5E7EB'
      }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Select returned products
        </Typography>

        {/* Check if all items have been returned */}
        {returnItems.length > 0 && returnItems.every(item => {
          const refundableQty = item.refundable_quantity !== undefined && item.refundable_quantity !== null
            ? item.refundable_quantity
            : parseInt(item.originalQuantity) || 0;
          return refundableQty === 0;
        }) && (
            <Box sx={{
              mb: 2,
              p: 2,
              bgcolor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 500 }}>
                ℹ️ All items in this invoice have already been fully returned. No further returns are possible.
              </Typography>
            </Box>
          )}

        <ReusableTable
          data={sortedData}
          columns={[
            {
              key: 'checkbox',
              header: 'Select all',
              sortable: false,
            },
            {
              key: 'productName',
              header: 'Product',
              sortable: true,
            },
            {
              key: 'quantity',
              header: 'Quantity',
              sortable: false,
              render: (item: ReturnItem) => {
                const index = returnItems.findIndex(i => i.id === item.id);
                const refundableQty = item.refundable_quantity !== undefined && item.refundable_quantity !== null
                  ? item.refundable_quantity
                  : parseInt(item.originalQuantity) || 0;
                const isAllReturned = refundableQty === 0;

                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <TextField
                      type="number"
                      value={item.returnQuantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      disabled={isAllReturned}
                      inputProps={{
                        min: 0,
                        max: refundableQty,
                        style: { textAlign: 'center', padding: '4px 8px' }
                      }}
                      sx={{
                        width: '80px',
                        '& .MuiOutlinedInput-root': {
                          height: '32px',
                          '& input': {
                            padding: '4px 8px',
                          },
                          '&.Mui-disabled': {
                            backgroundColor: '#F3F4F6',
                          },
                        },
                      }}
                    />
                    {isAllReturned && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#DC2626',
                          fontSize: '11px',
                          fontWeight: 500,
                          fontStyle: 'italic'
                        }}
                      >
                        All items returned
                      </Typography>
                    )}
                  </Box>
                );
              },
            },
            {
              key: 'batch',
              header: 'Batch number',
              sortable: true,
              render: (item) => item.batch || '',
            },
            {
              key: 'type',
              header: 'Type',
              sortable: true,
            },
            {
              key: 'unitPrice',
              header: 'Unit price',
              sortable: true,
              render: (item) => parseFloat(item.unitPrice || '0').toFixed(2)
            },
            {
              key: 'discount',
              header: 'Disc (%)',
              sortable: false,
              render: (item: ReturnItem) => (
                <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', color: '#1A212B', textAlign: 'center' }}>
                  {item.discountPercent}
                </Typography>
              ),
            },

            {
              key: 'amount',
              header: 'Refund Amount (₹)',
              sortable: true,
              render: (item: ReturnItem) => (
                <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', color: '#1A212B' }}>
                  ₹{parseFloat(item.amount || '0').toFixed(2)}
                </Typography>
              ),
            },
            {
              key: 'restock_action',
              header: 'Restock Action',
              sortable: false,
              render: (item: ReturnItem) => {
                const index = returnItems.findIndex(i => i.id === item.id);
                return (
                  <Autocomplete
                    options={['RESTOCK', 'SCRAP']}
                    value={item.restock_action}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        setReturnItems(prev => {
                          const updated = [...prev];
                          const targetIndex = updated.findIndex(i => i.id === item.id);
                          if (targetIndex !== -1) {
                            updated[targetIndex] = { ...updated[targetIndex], restock_action: newValue };
                          }
                          return updated;
                        });
                      }
                    }}
                    disableClearable
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        sx={{
                          width: '120px',
                          '& .MuiOutlinedInput-root': {
                            height: '32px',
                            fontSize: '12px',
                            borderRadius: '8px',
                          }
                        }}
                      />
                    )}
                  />
                );
              }
            },
          ]}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          totalRows={sortedData.length}
          rowsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm={currentSearchTerm}
          onSearchChange={handleSearchChange}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters(!showFilters)}
          currentFilterKey={currentFilterKey}
          onFilterSelect={handleFilterSelect}
          currentFilter={currentFilter}
          emptyMessage="No products to return"
        />
      </Box>



      {/* Summary Section */}
      <Box sx={{
        backgroundColor: '#E0EDFF',
        borderRadius: '12px',
        padding: '16px',
        mb: 3,
        display: 'flex',
        gap: 4,
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
            Total products
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {totalProducts}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
            Total quantity returned
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {totalQuantityReturned}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
            Total discount (Rs)
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {totalDiscountAmount.toFixed(2)}
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
            Total amount to be returned (Rs)
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {totalAmountReturned.toFixed(0)}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <StandardButton
          onClick={handleCancel}
          variant="secondary"
          size="large"
          sx={{
            minWidth: '120px',
            borderRadius: '10px',
            backgroundColor: '#F5F5F5',
            border: '1px solid #E0E0E0',
            color: '#616161',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#E0E0E0',
            },
          }}
        >
          Cancel
        </StandardButton>
        <Box
          component="button"
          onClick={handleReturn}
          disabled={selectedItems.length === 0 || totalQuantityReturned === 0}
          sx={{
            minWidth: '120px',
            height: '48px',
            padding: '12px 24px',
            borderRadius: '10px',
            backgroundColor: '#5C17E5',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '16px',
            fontFamily: "'Lexend', sans-serif",
            textTransform: 'none',
            border: 'none',
            cursor: (selectedItems.length === 0 || totalQuantityReturned === 0) ? 'not-allowed' : 'pointer',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: (selectedItems.length === 0 || totalQuantityReturned === 0) ? '#9CA3AF' : '#4C14C7',
            },
            '&:focus': {
              backgroundColor: '#5C17E5',
              outline: 'none',
            },
            '&:active': {
              backgroundColor: '#5C17E5',
            },
            '&:disabled': {
              backgroundColor: '#9CA3AF',
              color: '#FFFFFF',
              cursor: 'not-allowed',
            },
          }}
        >
          Return
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            padding: 0,
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1A212B',
            padding: '24px 24px 16px',
            fontFamily: "'Lexend', sans-serif",
          }}
        >
          Confirm Return
        </DialogTitle>
        <DialogContent sx={{ padding: '0 24px 16px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Reason for Return"
              placeholder="Enter reason for return (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              fullWidth
              multiline
              rows={2}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9CA3AF',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5 !important',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#6B7280',
                  '&.Mui-focused': {
                    color: '#5C17E5 !important',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: '#1F2937',
                },
                '& .MuiInputBase-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#5C17E5 !important',
                    },
                  },
                },
              }}
            />
            <TextField
              label="Notes"
              placeholder="Enter any additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9CA3AF',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5 !important',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#6B7280',
                  '&.Mui-focused': {
                    color: '#5C17E5 !important',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: '#1F2937',
                },
                '& .MuiInputBase-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#5C17E5 !important',
                    },
                  },
                },
              }}
            />
          </Box>
          <Box
            sx={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px',
              mt: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: '15px',
                color: '#374151',
                lineHeight: 1.7,
                fontWeight: 500,
                mb: 1,
              }}
            >
              Are you sure you want to confirm the return of the selected items? This change cannot be reversed.
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#B91C1C',
                lineHeight: 1.7,
                fontWeight: 600,
              }}
            >
              Once you submit this return, this invoice can no longer be edited.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            padding: '16px 24px 24px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <StandardButton
            onClick={() => setIsConfirmDialogOpen(false)}
            variant="secondary"
            size="large"
            sx={{
              minWidth: '100px',
              borderRadius: '10px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #E0E0E0',
              color: '#616161',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
            }}
          >
            No
          </StandardButton>
          <StandardButton
            onClick={handleConfirmReturn}
            variant="primary"
            size="large"
            disabled={!reason.trim() || isSubmittingReturn}
            sx={{
              minWidth: '100px',
              borderRadius: '10px',
              backgroundColor: '#5C17E5',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            {isSubmittingReturn ? 'Submitting...' : 'Yes'}
          </StandardButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


