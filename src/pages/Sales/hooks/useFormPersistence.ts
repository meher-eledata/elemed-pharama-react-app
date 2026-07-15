import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { saveFormData, selectFormData } from '../../../redux/slices/cartSlice';
import { useSelector } from 'react-redux';
import { Customer } from '../../../redux/slices/salesApi';
import { useDebounce } from '../../../hooks/useDebounce';

interface FormData {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  patientType: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId?: number;
}

interface UseFormPersistenceParams {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  patientType: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  selectedCustomer: Customer | null;
  onFormDataLoaded: (formData: FormData) => void;
  onCustomerRestored: (customer: Customer | null) => void;
  isEditMode?: boolean; // Skip persistence in edit mode
}

export const useFormPersistence = ({
  customerName,
  customerMobile,
  customerCity,
  patientType,
  doctorName,
  doctorMobile,
  doctorEmail,
  paymentMode,
  insuranceCompany,
  invoiceNumber,
  invoiceDate,
  selectedCustomer,
  onFormDataLoaded,
  onCustomerRestored,
  isEditMode = false,
}: UseFormPersistenceParams) => {
  const dispatch = useDispatch();
  const formData = useSelector(selectFormData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load form data from Redux (skip in edit mode)
  useEffect(() => {
    // In edit mode, skip all form persistence operations
    if (isEditMode) {
      // Mark as loaded but don't load any data
      setIsDataLoaded(true);
      return;
    }

    // Only load form data if not in edit mode and formData exists
    if (formData) {
      const raw = formData.patientType;
      const initialPatientType = (Number(raw) === 1 || String(raw || '').toUpperCase().trim().startsWith('IN') && !String(raw || '').toUpperCase().trim().includes('OUT')) ? 'In Patient' : 'Out Patient';
      onFormDataLoaded({
        ...formData,
        patientType: initialPatientType,
      });

      // Only restore a customer that has a REAL id. Restoring an id-0 "selection"
      // for free-typed name/mobile text used to create a fresh Customer object on
      // every save→load cycle, re-triggering the save effect in an infinite loop
      // ("Maximum update depth exceeded" — whole-page crash while typing a mobile
      // number after a free-text customer name).
      if (formData.customerName && formData.customerMobile && (formData.customerId || 0) > 0) {
        const restoredCustomer: Customer = {
          id: formData.customerId as number,
          name: formData.customerName,
          mobile: formData.customerMobile,
          city: formData.customerCity || '',
        };
        onCustomerRestored(restoredCustomer);
      } else {
        onCustomerRestored(null);
      }
    }
    setIsDataLoaded(true);
  }, [formData, onFormDataLoaded, onCustomerRestored, isEditMode]);

  // Debounce insuranceCompany to prevent lag while typing
  const debouncedInsuranceCompany = useDebounce(insuranceCompany, 500);

  // Only the id is persisted, so depend on it (a primitive) rather than the
  // selectedCustomer object — its identity can change without any real change,
  // which would re-run this save and feed the load effect in a loop.
  const selectedCustomerId = selectedCustomer?.id || 0;

  // Save form data to Redux (skip in edit mode)
  useEffect(() => {
    if (isDataLoaded && !isEditMode) {
      const formDataToSave = {
        customerName,
        customerMobile,
        customerCity,
        patientType,
        doctorName,
        doctorMobile,
        doctorEmail,
        paymentMode,
        insuranceCompany: debouncedInsuranceCompany,
        invoiceNumber,
        invoiceDate,
        customerId: selectedCustomerId,
      };

      dispatch(saveFormData(formDataToSave));
    }
  }, [isDataLoaded, isEditMode, customerName, customerMobile, customerCity, patientType, doctorName, doctorMobile, doctorEmail, paymentMode, debouncedInsuranceCompany, invoiceNumber, invoiceDate, selectedCustomerId, dispatch]);

  return { isDataLoaded };
};

