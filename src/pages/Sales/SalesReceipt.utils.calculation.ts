import { SalesReceiptItem } from './SalesReceipt.types';

/**
 * Recalculate amount, discount, and taxes for a sales item
 * This ensures that when discount or tax percentages change, the amount is recalculated correctly
 */
export const recalculateSalesItemAmount = (item: SalesReceiptItem): SalesReceiptItem => {
  const quantity = parseFloat(item.quantity || '0');
  const unitPrice = parseFloat(item.unitPrice || '0');
  const discountPercent = parseFloat(item.discountPercent || '0');
  const cgstPercent = parseFloat(item.cgstPercent || '0');
  const sgstPercent = parseFloat(item.sgstPercent || '0');
  const igstPercent = parseFloat(item.igstPercent || '0');

  if (quantity === 0 || unitPrice === 0) {
    return {
      ...item,
      amount: '0.00',
      discount: '0.00',
      cgst: '0.00',
      sgst: '0.00',
      igst: '0.00',
    };
  }

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
    ...item,
    amount: finalAmount.toFixed(2),
    discount: discountAmount,
    cgst: cgstAmount.toFixed(2),
    sgst: sgstAmount.toFixed(2),
    igst: igstAmount.toFixed(2),
  };
};

