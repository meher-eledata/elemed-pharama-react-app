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

  // The total tax percentage
  const totalTaxPercent = cgstPercent + sgstPercent + igstPercent;

  // The client pays the discounted amount, as the tax is ALREADY inclusive in the MRP.
  // Final amount represents the total payable amount, not getting larger because of tax.
  const finalAmount = discountedAmount;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  // Backward tax calculation (finding out how much OF the final amount was actually tax)
  if (totalTaxPercent > 0) {
    // Formula for extracting inclusive tax: Tax Amount = Total Price - (Total Price / (1 + (Total Tax Rate / 100)))
    const taxableValue = finalAmount / (1 + (totalTaxPercent / 100));

    // Distribute the tax logically based on the individual percentages 
    // Example: If CGST is 9% and SGST is 9%, each gets half of the extracted tax
    cgstAmount = taxableValue * (cgstPercent / 100);
    sgstAmount = taxableValue * (sgstPercent / 100);
    igstAmount = taxableValue * (igstPercent / 100);
  }

  return {
    ...item,
    amount: finalAmount.toFixed(2),
    discount: discountAmount,
    cgst: cgstAmount.toFixed(2),
    sgst: sgstAmount.toFixed(2),
    igst: igstAmount.toFixed(2),
  };
};

