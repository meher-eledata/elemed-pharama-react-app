import { Customer } from '../../redux/slices/salesApi';
import { validateCustomerData, transformCustomerDataToApiPayload, extractErrorMessage } from './SalesReceipt.handlers';

interface HandleCustomerSubmitParams {
  customerData: any;
  addCustomer: (payload: any) => any;
  refetchCustomerNames: () => any;
  showToast: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  onCustomerAdded: (customer: Customer) => void;
  onClose: () => void;
}

export const handleCustomerSubmit = async ({
  customerData,
  addCustomer,
  refetchCustomerNames,
  showToast,
  onCustomerAdded,
  onClose,
}: HandleCustomerSubmitParams): Promise<void> => {
  try {
    // Validate customer data
    const validation = validateCustomerData(customerData);
    if (!validation.isValid) {
      showToast(validation.error || 'Validation failed', 'error');
      return;
    }

    // Transform to API payload
    const apiPayload = transformCustomerDataToApiPayload(customerData);
    
    const response = await addCustomer(apiPayload).unwrap();
    
    const newCustomer: Customer = {
      id: parseInt(response.id),
      name: response.name,
      mobile: customerData.mobileNumber,
      email: customerData.emailId,
      city: '',
      address: customerData.billingAddress,
    };
    
    onCustomerAdded(newCustomer);
    
    await refetchCustomerNames();
    
    showToast(`Customer "${newCustomer.name}" added successfully!`, 'success');
    onClose();
    
  } catch (error: any) {
    console.error('❌ Error adding customer:', error);
    const errorMessage = extractErrorMessage(error);
    showToast(errorMessage, 'error');
  }
};

