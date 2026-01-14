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
      onFormDataLoaded({
        ...formData,
        patientType: formData.patientType || 'Out Patient', // Default if missing
      });
      
      if (formData.customerName && formData.customerMobile) {
        const restoredCustomer: Customer = {
          id: 0,
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
      };
      
      dispatch(saveFormData(formDataToSave));
    }
  }, [isDataLoaded, isEditMode, customerName, customerMobile, customerCity, patientType, doctorName, doctorMobile, doctorEmail, paymentMode, debouncedInsuranceCompany, invoiceNumber, invoiceDate, dispatch]);

  return { isDataLoaded };
};

