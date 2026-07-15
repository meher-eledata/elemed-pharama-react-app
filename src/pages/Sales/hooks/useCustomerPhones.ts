import { useEffect, useRef } from 'react';
import React from 'react';
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
  isAddingCustomerRef?: React.MutableRefObject<boolean>; // ← pause flag
}

export const useCustomerPhones = ({
  customerName,
  customerMobile,
  customerCity,
  customerNames,
  onPhoneFetched,
  onCustomerAutoFill,
  onPhoneClear,
  isAddingCustomerRef,
}: UseCustomerPhonesParams) => {
  const [getCustomerPhones] = useGetCustomerPhonesMutation();
  const shouldFetchImmediatelyRef = useRef(false);

  useEffect(() => {
    // ⛔ Pause: A new customer is currently being added — skip to avoid overwriting its real ID
    if (isAddingCustomerRef?.current) return;

    const fetchPhonesForCustomer = async () => {
      if (customerName && customerName.trim()) {
        try {
          const normalizedCustomerName = customerName.trim().toLowerCase();
          const isExactMatch = customerNames.length > 0 && customerNames.some(name => (name || '').toLowerCase() === normalizedCustomerName);

          // Fetch phone numbers (backend returns `phones` and an aligned `ids` array).
          const result = await getCustomerPhones({ name: customerName.trim() }).unwrap();
          const rawPhones = result.phones || [];
          const rawIds = result.ids || [];

          // Collapse rows that share the SAME phone — the common case of one person
          // entered several times — down to their distinct phone(s), keeping the id
          // aligned to each phone so a later pick maps to the right customer.
          const seen = new Set<string>();
          const distinct: { phone: string; id: number }[] = [];
          rawPhones.forEach((p, i) => {
            const phone = (p || '').trim();
            if (phone && !seen.has(phone)) {
              seen.add(phone);
              distinct.push({ phone, id: Number(rawIds[i] ?? result.id ?? 0) });
            }
          });
          onPhoneFetched(distinct.map((d) => d.phone));

          // Auto-fill when the name resolves to a SINGLE distinct phone (covers
          // duplicate records of the same person). When several DIFFERENT people
          // share the name, leave it for the user to pick from the phone dropdown.
          if (distinct.length === 1 && (!customerMobile || customerMobile.trim() === '')) {
            const autoFilledCustomer: Customer = {
              id: distinct[0].id,
              name: customerName.trim(),
              mobile: distinct[0].phone,
              city: customerCity || '',
            };
            onCustomerAutoFill(autoFilledCustomer);
          } else if (distinct.length === 0) {
            if (isExactMatch && customerMobile) {
              onPhoneClear();
            }
          }

          // ID lookup and validation moved to SalesReceipt.tsx executeSaveWrapper for accuracy.
        } catch (error) {
          onPhoneFetched([]);
        }
      } else {
        onPhoneFetched([]);
      }
    };

    const normalizedCustomerName = customerName.trim().toLowerCase();
    const isExactMatch = customerNames.length > 0 && customerNames.some(name => (name || '').toLowerCase() === normalizedCustomerName);
    const shouldFetchImmediately = shouldFetchImmediatelyRef.current || isExactMatch;

    shouldFetchImmediatelyRef.current = false;

    // Only hit the backend for a resolvable name (an exact match or an explicit
    // selection). The lookup is exact, so partial text typed into the box would
    // only ever 404 — skip it to avoid the "No customers found" error noise.
    // The non-fetch clear is debounced (with cleanup) so it doesn't fire on every
    // render — clearing synchronously here would loop against unstable inputs.
    if (shouldFetchImmediately && customerName && customerName.trim()) {
      fetchPhonesForCustomer();
    } else {
      const timeoutId = setTimeout(() => {
        onPhoneFetched([]);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [customerName, getCustomerPhones, customerNames, customerMobile, customerCity, onPhoneFetched, onCustomerAutoFill, onPhoneClear]);

  return { shouldFetchImmediatelyRef };
};

