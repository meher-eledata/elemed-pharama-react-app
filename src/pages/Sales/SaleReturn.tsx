import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
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

interface ReturnItem extends SalesReceiptItem {
  returnQuantity: string;
  originalQuantity: string;
  originalAmount: string; // Store the original amount for proportional calculation
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

  const [returnPaymentType, setReturnPaymentType] = useState<string>('Cash');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc'
  });
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilterKey, setCurrentFilterKey] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});

  // Load invoice items from navigation state or storage
  useEffect(() => {
    if (!invoiceData) {
      navigate('/sales');
      return;
    }

    // First, try to use items passed from navigation state
    if (invoiceData.items && invoiceData.items.length > 0) {
      const items: ReturnItem[] = invoiceData.items.map((item: SalesReceiptItem) => ({
        ...item,
        returnQuantity: item.quantity,
        originalQuantity: item.quantity,
        originalAmount: item.amount, // Store original amount
      }));
      setReturnItems(items);
      return;
    }

    // If no items in state, try to get from storage
    const savedHistory = getSalesHistoryFromStorage();
    const savedInvoice = savedHistory.find((item: any) => item.id === invoiceData.invoiceId);
    
    if (savedInvoice && savedInvoice.items && savedInvoice.items.length > 0) {
      const items: ReturnItem[] = savedInvoice.items.map((item: SalesReceiptItem) => ({
        ...item,
        returnQuantity: item.quantity,
        originalQuantity: item.quantity,
        originalAmount: item.amount, // Store original amount
      }));
      setReturnItems(items);
    } else if (savedInvoice && savedInvoice.salesItems && savedInvoice.salesItems.length > 0) {
      const items: ReturnItem[] = savedInvoice.salesItems.map((item: SalesReceiptItem) => ({
        ...item,
        returnQuantity: item.quantity,
        originalQuantity: item.quantity,
        originalAmount: item.amount, // Store original amount
      }));
      setReturnItems(items);
    } else {
      // If no items found, show empty state or navigate back
      console.warn('No invoice items found for return');
      setReturnItems([]);
    }
  }, [invoiceData, navigate]);

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
    const clampedValue = Math.max(0, Math.min(numValue, originalQty));
    
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

  const handleConfirmReturn = () => {
    setIsConfirmDialogOpen(false);
    // TODO: Implement actual return API call
    console.log('Return confirmed', {
      invoiceNumber: invoiceData?.invoiceNumber,
      returnPaymentType,
      items: selectedItems,
    });
    // Navigate back to sale history after successful return
    navigate('/sales');
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
          <Box
            sx={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px',
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
              Are you sure you want to confirm the return of the selected items. This change cannot be reversed.
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
            Yes
          </StandardButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

