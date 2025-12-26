import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { saveFormData, selectFormData } from '../../../redux/slices/cartSlice';
import { useSelector } from 'react-redux';
import { Customer } from '../../../redux/slices/salesApi';

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
}: UseFormPersistenceParams) => {
  const dispatch = useDispatch();
  const formData = useSelector(selectFormData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load form data from Redux
  useEffect(() => {
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
  }, [formData, onFormDataLoaded, onCustomerRestored]);

  // Save form data to Redux
  useEffect(() => {
    if (isDataLoaded) {
      const formDataToSave = {
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
      };
      
      dispatch(saveFormData(formDataToSave));
    }
  }, [isDataLoaded, customerName, customerMobile, customerCity, patientType, doctorName, doctorMobile, doctorEmail, paymentMode, insuranceCompany, invoiceNumber, invoiceDate, dispatch]);

  return { isDataLoaded };
};

