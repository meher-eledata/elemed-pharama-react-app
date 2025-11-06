import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCartItems } from '../../../redux/slices/cartSlice';
import { SalesReceiptItem } from '../SalesReceipt.types';
import { transformCartItems, calculateFinancialSummary } from '../SalesReceipt.utils';

interface UseCartLoaderParams {
  onCartLoaded: (items: SalesReceiptItem[], summary: ReturnType<typeof calculateFinancialSummary>) => void;
}

export const useCartLoader = ({ onCartLoaded }: UseCartLoaderParams) => {
  const cartItems = useSelector(selectCartItems);

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const transformedItems = transformCartItems(cartItems);
      const summary = calculateFinancialSummary(transformedItems);
      onCartLoaded(transformedItems, summary);
    }
  }, [cartItems, onCartLoaded]);
};

