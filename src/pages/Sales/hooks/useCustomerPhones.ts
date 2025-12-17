import { useEffect, useRef } from 'react';
import { useGetCustomerPhonesMutation, useSearchCustomersMutation } from '../../../redux/slices/salesApi';
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
  const [searchCustomers] = useSearchCustomersMutation();
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
          
          // If it's an exact match, also search for the customer to get the ID
          if (isExactMatch) {
            try {
              const customers = await searchCustomers({ searchTerm: customerName.trim() }).unwrap();
              // Find the customer that matches the name exactly
              const matchedCustomer = customers.find(c => c.name.toLowerCase() === normalizedCustomerName);
              
              if (matchedCustomer && phones.length === 1) {
                // Use the customer from search (which has the ID) and update with phone
                const autoFilledCustomer: Customer = {
                  id: matchedCustomer.id,
                  name: matchedCustomer.name,
                  mobile: phones[0],
                  city: matchedCustomer.city || customerCity || '',
                  email: matchedCustomer.email,
                  address: matchedCustomer.address,
                };
                onCustomerAutoFill(autoFilledCustomer);
              } else if (phones.length === 1) {
                // If we found a phone but no customer match, use phone with ID 0
                const autoFilledCustomer: Customer = {
                  id: 0,
                  name: customerName.trim(),
                  mobile: phones[0],
                  city: customerCity || '',
                };
                onCustomerAutoFill(autoFilledCustomer);
              }
            } catch (searchError) {
              // If search fails, fall back to phone-only approach
              if (phones.length === 1) {
                const autoFilledCustomer: Customer = {
                  id: 0,
                  name: customerName.trim(),
                  mobile: phones[0],
                  city: customerCity || '',
                };
                onCustomerAutoFill(autoFilledCustomer);
              }
            }
          } else if (phones.length === 1 && (!customerMobile || customerMobile.trim() === '')) {
            // Not an exact match but we have a phone, use it with ID 0
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
  }, [customerName, getCustomerPhones, searchCustomers, customerNames, customerMobile, customerCity, onPhoneFetched, onCustomerAutoFill, onPhoneClear]);

  return { shouldFetchImmediatelyRef };
};

