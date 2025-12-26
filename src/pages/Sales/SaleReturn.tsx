import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Autocomplete
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { StandardButton } from '../../components/Common';
import { paymentMethods } from '../../config/constants/OrderDetail.constants';
import { SalesReceiptItem } from './SalesReceipt.types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { getSalesHistoryFromStorage } from '../../utils/cartStorage';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { useSubmitSalesReturnMutation, useGetSalesProductsQuery, useGetInvoiceDetailsMutation } from '../../redux/slices/salesApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

interface ReturnItem extends SalesReceiptItem {
  returnQuantity: string;
  originalQuantity: string;
  originalAmount: string; // Store the original amount for proportional calculation
  invoice_line_id?: number;
  refundable_quantity?: number;
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
    doctorName: string;
    username: string;
    totalAmount: number;
    items?: SalesReceiptItem[];
    paymentMode?: string;
  } | null;

  const user = useSelector((state: RootState) => state.auth.user);
  const [submitSalesReturn, { isLoading: isSubmittingReturn }] = useSubmitSalesReturnMutation();
  const [getInvoiceDetails, { isLoading: isLoadingInvoiceDetails }] = useGetInvoiceDetailsMutation();
  // Skip products query if not needed - it's only used for product name lookup
  const { data: apiProducts = [] } = useGetSalesProductsQuery(undefined, { skip: true });
  
  const [returnPaymentType, setReturnPaymentType] = useState<string>('Cash');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc'
  });
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilterKey, setCurrentFilterKey] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});

  // Helper to get product name from product_id
  const getProductName = useCallback((productId: number): string => {
    if (!apiProducts || apiProducts.length === 0) {
      return `Product ID: ${productId}`;
    }
    
    // Try to find product in apiProducts
    const product = apiProducts.find((p: any) => {
      if (Array.isArray(p)) {
        return p[1] === productId; // [name, id] format
      } else if (p && typeof p === 'object') {
        return p.id === productId || p.product_id === productId;
      }
      return false;
    });
    
    if (product) {
      if (Array.isArray(product)) {
        return product[0]; // [name, id] format
      } else if (product.name) {
        return product.name;
      }
    }
    
    return `Product ID: ${productId}`;
  }, [apiProducts]);

  // Step 2: Load invoice items from API using /sales/get-invoice-details/
  useEffect(() => {
    if (!invoiceData) {
      navigate('/sales');
      return;
    }

    let isMounted = true;

    // Parse invoice ID from invoiceNumber (e.g., "RB1" -> 1, "INV-1234" -> 1234) or use invoiceId from state
    let invoiceIdToFetch: number | null = null;
    
    if (invoiceData.invoiceNumber) {
      // Remove common prefixes (RB, INV-, etc.) and extract numeric part
      let cleanedNumber = invoiceData.invoiceNumber
        .replace(/^(RB|INV-?)/i, '') // Remove RB or INV- prefix
        .replace(/[^0-9]/g, '') // Remove all non-numeric characters
        .trim();
      
      if (cleanedNumber) {
        const parsed = parseInt(cleanedNumber, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
          invoiceIdToFetch = parsed;
        }
      }
    }
    
    // Fallback to invoiceId from state if it's a reasonable number
    if (!invoiceIdToFetch && invoiceData.invoiceId) {
      const idValue = typeof invoiceData.invoiceId === 'number' 
        ? invoiceData.invoiceId 
        : parseInt(String(invoiceData.invoiceId || '0'), 10);
      if (!isNaN(idValue) && idValue > 0 && idValue < 1000000) {
        invoiceIdToFetch = idValue;
      }
    }

    // Step 2: Call /sales/get-invoice-details/ to fill the page with invoice data
    const fetchInvoiceDetails = async () => {
      // Backend accepts either invoice_id or invoice_number
      // Prefer invoice_number if available (more reliable)
      const invoiceNumber = invoiceData.invoiceNumber;
      
      if (!invoiceNumber && !invoiceIdToFetch) {
        // If no invoice number or ID, fall back to location state or storage
        loadItemsFromStateOrStorage();
        return;
      }

      try {
        // Try with invoice_number first, then fallback to invoice_id
        // Database stores invoice_number as integer (e.g., 3698), not "INV-3698"
        let result;
        let lastError: any = null;
        
        if (invoiceNumber) {
          // Extract numeric part from invoice number (e.g., "INV-3698" -> "3698")
          let numericInvoiceNumber = invoiceNumber;
          if (typeof invoiceNumber === 'string') {
            const cleaned = invoiceNumber.replace(/^(INV-?|RB)/i, '').trim();
            numericInvoiceNumber = cleaned || invoiceNumber;
          }
          
          console.log('Fetching invoice details for return, invoice_number:', numericInvoiceNumber, '(original:', invoiceNumber, ')');
          
          try {
            // Try with invoice_number as string
            result = await getInvoiceDetails({ invoice_number: numericInvoiceNumber }).unwrap();
          } catch (err: any) {
            lastError = err;
            // If 404 and we have invoiceIdToFetch, try with invoice_id instead
            if (err?.status === 404 && invoiceIdToFetch) {
              console.log('Invoice not found by number, trying with invoice_id:', invoiceIdToFetch);
              try {
                result = await getInvoiceDetails({ invoice_id: invoiceIdToFetch }).unwrap();
              } catch (err2: any) {
                lastError = err2;
                throw err2; // Re-throw if invoice_id also fails
              }
            } else {
              throw err; // Re-throw if it's not a 404 or we don't have invoiceIdToFetch
            }
          }
        } else if (invoiceIdToFetch) {
          console.log('Fetching invoice details for return, invoice_id:', invoiceIdToFetch);
          result = await getInvoiceDetails({ invoice_id: invoiceIdToFetch }).unwrap();
        } else {
          throw new Error('No invoice_number or invoice_id available');
        }
        console.log('Invoice details response:', result);
        
        if (result && isMounted) {
          // API response structure: { invoice: {...}, lines: [...], ... }
          const invoice = result.invoice || {};
          const lines = result.lines || [];
          
          // Transform API response to ReturnItem format
          if (lines.length > 0) {
            const items: ReturnItem[] = lines.map((line: any) => ({
              id: line.invoice_line_id?.toString() || line.id?.toString() || '',
              productName: line.product_name || line.productName || '',
              manufacturer: line.manufacturer || '',
              batch: line.batch_number || line.batch || '',
              expiryDate: line.expiry_date || line.expiryDate || '',
              quantity: line.quantity?.toString() || '0',
              unitPrice: line.unit_price?.toString() || line.unitPrice?.toString() || '0',
              discountPercent: line.discount?.toString() || line.discountPercent?.toString() || '0',
              cgstPercent: line.cgst?.toString() || line.cgstPercent?.toString() || '0',
              sgstPercent: line.sgst?.toString() || line.sgstPercent?.toString() || '0',
              igstPercent: line.igst?.toString() || line.igstPercent?.toString() || '0',
              amount: line.amount?.toString() || line.total?.toString() || '0',
              returnQuantity: line.quantity?.toString() || '0',
              originalQuantity: line.quantity?.toString() || '0',
              originalAmount: line.amount?.toString() || line.total?.toString() || '0',
              invoice_line_id: line.invoice_line_id || line.id,
              refundable_quantity: parseInt(line.quantity) || parseInt(line.refundable_quantity) || 0,
            }));
            setReturnItems(items);
            return; // Successfully loaded from API, exit early
          }
        }
      } catch (error: any) {
        console.error('Error fetching invoice details for return:', error);
        console.log('Falling back to location state or storage data...');
        // Continue to fallback below - don't return here
      }
      
      // Fallback: Load from location state or storage if API call fails or returns no data
      if (isMounted) {
        loadItemsFromStateOrStorage();
      }
    };

    // Helper function to load items from state or storage
    const loadItemsFromStateOrStorage = () => {
      console.log('Loading items from location state or storage...');
      // Try to use items passed from navigation state
      if (invoiceData.items && invoiceData.items.length > 0) {
        console.log('Loading items from location state:', invoiceData.items.length, 'items');
        const items: ReturnItem[] = invoiceData.items.map((item: SalesReceiptItem) => {
          const idAsNumber = parseInt(item.id);
          const invoiceLineId = !isNaN(idAsNumber) && idAsNumber > 0 ? idAsNumber : undefined;
          
          return {
            ...item,
            returnQuantity: item.quantity,
            originalQuantity: item.quantity,
            originalAmount: item.amount,
            invoice_line_id: invoiceLineId,
            refundable_quantity: parseInt(item.quantity) || 0,
          };
        });
        setReturnItems(items);
        console.log('Items loaded from location state:', items.length);
      } else {
        // If no items in state, try to get from storage
        console.log('No items in location state, checking storage...');
        const savedHistory = getSalesHistoryFromStorage();
        const savedInvoice = savedHistory.find((item: any) => item.id === invoiceData.invoiceId);
        
        if (savedInvoice && savedInvoice.items && savedInvoice.items.length > 0) {
          console.log('Loading items from storage (items):', savedInvoice.items.length, 'items');
          const items: ReturnItem[] = savedInvoice.items.map((item: SalesReceiptItem) => {
            const idAsNumber = parseInt(item.id);
            const invoiceLineId = !isNaN(idAsNumber) && idAsNumber > 0 ? idAsNumber : undefined;
            
            return {
              ...item,
              returnQuantity: item.quantity,
              originalQuantity: item.quantity,
              originalAmount: item.amount,
              invoice_line_id: invoiceLineId,
              refundable_quantity: parseInt(item.quantity) || 0,
            };
          });
          setReturnItems(items);
          console.log('Items loaded from storage:', items.length);
        } else if (savedInvoice && savedInvoice.salesItems && savedInvoice.salesItems.length > 0) {
          console.log('Loading items from storage (salesItems):', savedInvoice.salesItems.length, 'items');
          const items: ReturnItem[] = savedInvoice.salesItems.map((item: SalesReceiptItem) => {
            const idAsNumber = parseInt(item.id);
            const invoiceLineId = !isNaN(idAsNumber) && idAsNumber > 0 ? idAsNumber : undefined;
            
            return {
              ...item,
              returnQuantity: item.quantity,
              originalQuantity: item.quantity,
              originalAmount: item.amount,
              invoice_line_id: invoiceLineId,
              refundable_quantity: parseInt(item.quantity) || 0,
            };
          });
          setReturnItems(items);
          console.log('Items loaded from storage:', items.length);
        } else {
          console.warn('No invoice items found for return in state or storage');
          setReturnItems([]);
        }
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

  // Helper function to recalculate amount, taxes, and discount for an item
  const recalculateItemAmount = (item: ReturnItem, quantity: number) => {
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
    
    // Calculate base amount (unit price * quantity)
    const baseAmount = unitPrice * quantity;
    
    // Apply discount - calculate discounted amount
    const discountMultiplier = 1 - (discountPercent / 100);
    const discountedAmount = baseAmount * discountMultiplier;
    
    // Calculate discount amount
    const discountAmount = (unitPrice * discountPercent / 100 * quantity).toFixed(2);
    
    // Calculate taxes based on discounted amount
    const cgstAmount = discountedAmount * cgstPercent / 100;
    const sgstAmount = discountedAmount * sgstPercent / 100;
    const igstAmount = discountedAmount * igstPercent / 100;
    
    // Final amount = discounted amount + CGST + SGST + IGST
    const finalAmount = discountedAmount + cgstAmount + sgstAmount + igstAmount;
    
    return {
      amount: finalAmount.toFixed(2),
      discount: discountAmount,
      cgst: cgstAmount.toFixed(2),
      sgst: sgstAmount.toFixed(2),
      igst: igstAmount.toFixed(2),
    };
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const originalQty = parseInt(returnItems[index].originalQuantity) || 0;
    const refundableQty = returnItems[index].refundable_quantity || originalQty;
    // Clamp between 0 and refundable quantity (or original quantity if refundable not set)
    const maxQty = refundableQty > 0 ? refundableQty : originalQty;
    const clampedValue = Math.max(0, Math.min(numValue, maxQty));
    
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
      const clampedValue = Math.max(0, Math.min(numValue, 100)); // Clamp between 0 and 100
      
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
      return;
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
  };

  const handleFilterSelect = (key: string, value: string | null) => {
    setCurrentFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

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
    if (!invoiceData) return;

    if (!reason.trim()) {
      alert('Please provide a reason for the return');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    try {
      // Try to get invoice_line_id from the item
      // It might be in invoice_line_id property, or in the id field if it's a number
      const lines = selectedItems
        .filter(item => {
          const returnQty = parseInt(item.returnQuantity) || 0;
          if (returnQty <= 0) return false;
          
          // Check if invoice_line_id exists
          if (item.invoice_line_id) return true;
          
          // Try to use id if it's a valid invoice_line_id (numeric)
          const idAsNumber = parseInt(item.id);
          if (!isNaN(idAsNumber) && idAsNumber > 0) return true;
          
          return false;
        })
        .map(item => {
          // Use invoice_line_id if available, otherwise try to use id as invoice_line_id
          const invoiceLineId = item.invoice_line_id || (parseInt(item.id) || 0);
          
          return {
            invoice_line_id: invoiceLineId,
            batch_number: item.batch || '',
            quantity: parseInt(item.returnQuantity) || 0,
            restock_action: 'RESTOCK', // Default to RESTOCK, can be made configurable later
          };
        })
        .filter(line => line.invoice_line_id > 0 && line.quantity > 0);

      if (lines.length === 0) {
        console.error('Selected items:', selectedItems);
        alert('No valid items selected for return. Please ensure items have valid invoice line IDs and return quantities.');
        return;
      }

      // Get invoice number from location state
      // Database stores invoice_number as integer (e.g., 3698), not "INV-3698"
      // Parse invoiceNumber (e.g., "RB1" -> 1, "INV-1234" -> 1234, or "1" -> 1)
      let invoiceNumber: number = 0;
      
      if (invoiceData.invoiceNumber) {
        // Remove common prefixes (RB, INV-, etc.) and extract numeric part
        // Handles formats like: "RB1", "INV-1234", "1234", etc.
        let cleanedNumber = invoiceData.invoiceNumber
          .replace(/^(RB|INV-?)/i, '') // Remove RB or INV- prefix
          .replace(/[^0-9]/g, '') // Remove all non-numeric characters
          .trim();
        
        // If there's still a number after cleaning, parse it
        if (cleanedNumber) {
          const parsed = parseInt(cleanedNumber, 10);
          if (!isNaN(parsed) && parsed > 0) {
            invoiceNumber = parsed;
          }
        }
      }
      
      // Note: Database stores invoice_number as integer, so we send the numeric value
      
      // Fallback: try invoiceId if it's a reasonable number (not a timestamp)
      if (!invoiceNumber && invoiceData.invoiceId) {
        const invoiceId = typeof invoiceData.invoiceId === 'number' 
          ? invoiceData.invoiceId 
          : parseInt(String(invoiceData.invoiceId || '0'), 10);
        // Only use if it's a reasonable invoice ID (not a timestamp like 1766719204936)
        if (!isNaN(invoiceId) && invoiceId > 0 && invoiceId < 1000000) {
          invoiceNumber = invoiceId;
        }
      }
      
      if (!invoiceNumber || invoiceNumber <= 0) {
        console.error('Invoice number resolution failed:', {
          invoiceDataInvoiceNumber: invoiceData.invoiceNumber,
          invoiceDataInvoiceId: invoiceData.invoiceId,
          parsedInvoiceNumber: invoiceNumber
        });
        alert('Invalid invoice number. Cannot submit return. Please try again or contact support.');
        return;
      }
      
      const createdBy = user?.username || invoiceData.username || 'system';

      const result = await submitSalesReturn({
        invoice_number: invoiceNumber,
        created_by: createdBy,
        reason: reason.trim(),
        notes: notes.trim(),
        lines: lines,
      }).unwrap();

      setIsConfirmDialogOpen(false);
      console.log('Return submitted successfully:', result);
      
      // Navigate back to sale history after successful return
      navigate('/sales');
    } catch (error: any) {
      console.error('Error submitting return:', error);
      const errorMessage = error?.data?.error || error?.message || 'Failed to submit return. Please try again.';
      alert(errorMessage);
    }
  };

  const selectedItems = useMemo(() => 
    selectedRows.map(index => returnItems[index]).filter(Boolean),
    [selectedRows, returnItems]
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
              Original payment type
            </Typography>
            <TextField
              value="Cash"
              disabled
              sx={{
                width: '200px',
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
              sx={{ width: '200px' }}
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
        <ReusableTable
          data={returnItems}
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
                return (
                  <TextField
                    type="number"
                    value={item.returnQuantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    inputProps={{ 
                      min: 0, 
                      max: parseInt(item.originalQuantity) || 0,
                      style: { textAlign: 'center', padding: '4px 8px' }
                    }}
                    sx={{
                      width: '80px',
                      '& .MuiOutlinedInput-root': {
                        height: '32px',
                        '& input': {
                          padding: '4px 8px',
                        },
                      },
                    }}
                  />
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
            },
            {
              key: 'discount',
              header: 'Disc (%)',
              sortable: false,
              render: (item: ReturnItem) => {
                const index = returnItems.findIndex(i => i.id === item.id);
                return (
                  <TextField
                    type="number"
                    value={item.discountPercent}
                    onChange={(e) => handleDiscountPercentChange(index, e.target.value)}
                    inputProps={{
                      min: 0,
                      max: 100,
                      style: { textAlign: 'center', padding: '4px 8px' }
                    }}
                    sx={{
                      width: '80px',
                      '& .MuiOutlinedInput-root': {
                        height: '32px',
                        borderRadius: '8px',
                        '& input': {
                          padding: '4px 8px',
                        },
                      },
                    }}
                  />
                );
              },
            },
            {
              key: 'cgst',
              header: 'CGST (%)',
              sortable: false,
              render: (item: ReturnItem) => {
                const index = returnItems.findIndex(i => i.id === item.id);
                return (
                  <TextField
                    type="number"
                    value={item.cgstPercent}
                    onChange={(e) => handleTaxPercentChange(index, 'cgst', e.target.value)}
                    inputProps={{
                      min: 0,
                      max: 100,
                      style: { textAlign: 'center', padding: '4px 8px' }
                    }}
                    sx={{
                      width: '80px',
                      '& .MuiOutlinedInput-root': {
                        height: '32px',
                        borderRadius: '8px',
                        '& input': {
                          padding: '4px 8px',
                        },
                      },
                    }}
                  />
                );
              },
            },
            {
              key: 'sgst',
              header: 'SGST (%)',
              sortable: false,
              render: (item: ReturnItem) => {
                const index = returnItems.findIndex(i => i.id === item.id);
                return (
                  <TextField
                    type="number"
                    value={item.sgstPercent}
                    onChange={(e) => handleTaxPercentChange(index, 'sgst', e.target.value)}
                    inputProps={{
                      min: 0,
                      max: 100,
                      style: { textAlign: 'center', padding: '4px 8px' }
                    }}
                    sx={{
                      width: '80px',
                      '& .MuiOutlinedInput-root': {
                        height: '32px',
                        borderRadius: '8px',
                        '& input': {
                          padding: '4px 8px',
                        },
                      },
                    }}
                  />
                );
              },
            },
            {
              key: 'igst',
              header: 'IGST (%)',
              sortable: false,
              render: (item: ReturnItem) => {
                const index = returnItems.findIndex(i => i.id === item.id);
                return (
                  <TextField
                    type="number"
                    value={item.igstPercent}
                    onChange={(e) => handleTaxPercentChange(index, 'igst', e.target.value)}
                    inputProps={{
                      min: 0,
                      max: 100,
                      style: { textAlign: 'center', padding: '4px 8px' }
                    }}
                    sx={{
                      width: '80px',
                      '& .MuiOutlinedInput-root': {
                        height: '32px',
                        borderRadius: '8px',
                        '& input': {
                          padding: '4px 8px',
                        },
                      },
                    }}
                  />
                );
              },
            },
            {
              key: 'amount',
              header: 'Amount (₹)',
              sortable: true,
              render: (item: ReturnItem) => (
                <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', color: '#1A212B' }}>
                  ₹{parseFloat(item.amount || '0').toFixed(2)}
                </Typography>
              ),
            },
          ]}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          totalRows={returnItems.length}
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
            Total tax amount (Rs)
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {totalTaxAmount.toFixed(2)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '14px', color: '#728197', mb: 0.5 }}>
            Total amount to be returned (Rs)
          </Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
            {totalAmountReturned.toFixed(2)}
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
          disabled={selectedItems.length === 0}
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
            cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: selectedItems.length === 0 ? '#9CA3AF' : '#4C14C7',
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

