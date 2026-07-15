import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock the RTK Query hook so we can control the create-user outcome without a real store/middleware.
const createUserMock = jest.fn();
jest.mock('../../../../redux/slices/adminSlice', () => ({
  useCreateUserMutation: () => [createUserMock, { isLoading: false }],
}));

import AddUserModal from '../AddUserModal';

const renderModal = () => {
  const store = configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'superadmin' } }) => state,
    },
  });
  return render(
    <Provider store={store}>
      <AddUserModal open onClose={jest.fn()} onSuccess={jest.fn()} />
    </Provider>
  );
};

// Fills the minimum set of fields validateForm() requires for an Admin account.
const fillValidForm = async () => {
  fireEvent.change(screen.getByPlaceholderText('Enter first name'), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByPlaceholderText('Enter last name'), { target: { value: 'Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Enter email ID'), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Enter mobile number'), { target: { value: '9998887777' } });

  // Address line 1 lives in a collapsible block — reveal it first.
  fireEvent.click(screen.getByRole('button', { name: /add address/i }));
  fireEvent.change(screen.getByPlaceholderText('Enter street address'), { target: { value: '1 Main St' } });

  // Identity document is the first Select; picking it reveals the number field.
  fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
  fireEvent.click(await screen.findByRole('option', { name: 'Aadhar Card' }));
  fireEvent.change(screen.getByPlaceholderText('Enter Aadhar Card Number'), { target: { value: 'AADHAAR123' } });

  // Role is the second Select; Admin avoids the pharmacist-certificate requirement.
  fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
  fireEvent.click(await screen.findByRole('option', { name: 'Admin' }));
};

describe('AddUserModal — confirm dialog on create-user error', () => {
  beforeEach(() => jest.clearAllMocks());

  it('closes the confirmation dialog and surfaces the backend error when createUser rejects', async () => {
    createUserMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: 409, data: { error: 'A user with this email already exists' } }),
    });

    renderModal();
    await fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // The confirm-registration sub-dialog opens.
    const okButton = await screen.findByRole('button', { name: 'Ok' });
    fireEvent.click(okButton);

    // On rejection the confirm dialog must NOT hang open — it closes (regression guard).
    await waitFor(() => {
      expect(screen.queryByText(/Confirm User Reg/i)).not.toBeInTheDocument();
    });

    // The real backend message (error.data.error) reaches the toast, not a generic fallback.
    expect(await screen.findByText('A user with this email already exists')).toBeInTheDocument();

    // The Add User form stays open with data preserved so the user can correct and resubmit.
    expect(screen.getByPlaceholderText('Enter email ID')).toHaveValue('jane@example.com');
  });
});
