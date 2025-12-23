import { useEffect, useRef } from 'react';
import { useGetCustomerPhonesMutation } from '../../../redux/slices/salesApi';
import { Customer } from '../../../redux/slices/salesApi';

interface UseCustomerPhonesParams {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  customerNames: string[];
  onPhoneFetched: (phones: string[]) => void;
  onCustomerAutoFill: (customer: Customer) => void;
  onPhoneClear: () => void;
}

export const useCustomerPhones = ({
  customerName,
  customerMobile,
  customerCity,
  customerNames,
  onPhoneFetched,
  onCustomerAutoFill,
  onPhoneClear,
}: UseCustomerPhonesParams) => {
  const [getCustomerPhones] = useGetCustomerPhonesMutation();
  const shouldFetchImmediatelyRef = useRef(false);

  useEffect(() => {
    const fetchPhonesForCustomer = async () => {
      if (customerName && customerName.trim()) {
        try {
          const normalizedCustomerName = customerName.trim().toLowerCase();
          const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedCustomerName);
          
          // Fetch phone numbers
          const result = await getCustomerPhones({ name: customerName.trim() }).unwrap();
          const phones = result.phones || [];
          onPhoneFetched(phones);
          
          // Auto-fill customer if we have a phone number
          // Note: We skip the search-customers endpoint call since it returns 404
          // The customer ID is not critical - we can use ID 0 as per the comment in SalesReceipt
          if (phones.length === 1 && (!customerMobile || customerMobile.trim() === '')) {
            // Auto-fill with phone number, using ID 0 since we don't have the actual customer ID
            const autoFilledCustomer: Customer = {
              id: 0,
              name: customerName.trim(),
              mobile: phones[0],
              city: customerCity || '',
            };
            onCustomerAutoFill(autoFilledCustomer);
          } else if (phones.length === 0) {
            if (isExactMatch && customerMobile) {
              onPhoneClear();
            }
          }
          
          // Note: We intentionally skip calling searchCustomers endpoint
          // because it returns 404. The customer ID is not critical for the sales flow,
          // and we can use ID 0 as documented in SalesReceipt.tsx
        } catch (error) {
          onPhoneFetched([]);
        }
      } else {
        onPhoneFetched([]);
      }
    };

    const normalizedCustomerName = customerName.trim().toLowerCase();
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => name.toLowerCase() === normalizedCustomerName);
    const shouldFetchImmediately = shouldFetchImmediatelyRef.current || isExactMatch;

    shouldFetchImmediatelyRef.current = false;

    if (shouldFetchImmediately && customerName && customerName.trim()) {
      fetchPhonesForCustomer();
    } else {
      const timeoutId = setTimeout(() => {
        fetchPhonesForCustomer();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [customerName, getCustomerPhones, customerNames, customerMobile, customerCity, onPhoneFetched, onCustomerAutoFill, onPhoneClear]);

  return { shouldFetchImmediatelyRef };
};

