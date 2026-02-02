import { Customer } from '../../redux/slices/salesApi';
import { validateCustomerData, transformCustomerDataToApiPayload } from './SalesReceipt.handlers';
import { extractErrorMessage, logError } from '../../utils/errorUtils';

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
    console.log('✨ Add Customer API Response:', response);

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

  } catch (error: unknown) {
    logError(error, 'SalesReceipt.handleCustomerSubmit');
    const errorMessage = extractErrorMessage(error, 'Failed to add customer. Please try again.');
    showToast(errorMessage, 'error');
  }
};

