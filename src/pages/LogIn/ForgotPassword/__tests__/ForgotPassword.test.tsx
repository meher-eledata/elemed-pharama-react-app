import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import ForgotPassword from '../ForgotPassword';
import { authApi } from '../../../../redux/slices/authSlice';
import authReducer from '../../../../redux/slices/authSlice';

const theme = createTheme();

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
  });
};

// Helper to render component with all providers
const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>{component}</ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock state for usePasswordRecoveryMutation
let mockPasswordRecoveryState = {
  isLoading: false,
};

const mockPasswordRecovery = jest.fn();

// Mock the password recovery mutation
jest.mock('../../../../redux/slices/authSlice', () => {
  const actual = jest.requireActual('../../../../redux/slices/authSlice');
  return {
    ...actual,
    usePasswordRecoveryMutation: () => [
      mockPasswordRecovery,
      mockPasswordRecoveryState,
    ],
  };
});

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    mockPasswordRecoveryState.isLoading = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders forgot password form with all elements', () => {
      renderWithProviders(<ForgotPassword />);

      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
      expect(screen.getByText(/don't worry/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset my password/i })).toBeInTheDocument();
    });

    it('renders username field with correct label', () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      expect(usernameField).toBeInTheDocument();
      expect(usernameField).toHaveAttribute('type', 'text');
    });

    it('renders description text', () => {
      renderWithProviders(<ForgotPassword />);

      expect(screen.getByText(/don't worry. please enter your username/i)).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('updates username field when user types', () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      expect(usernameField).toHaveValue('testuser');
    });

    it('validates username on blur', async () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      
      fireEvent.focus(usernameField);
      fireEvent.blur(usernameField);

      await waitFor(() => {
        const errorText = screen.queryByText(/username is required/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it('validates username length on blur', async () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      
      fireEvent.change(usernameField, { target: { value: 'ab' } });
      fireEvent.blur(usernameField);

      await waitFor(() => {
        const errorText = screen.queryByText(/enter a valid username/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it('clears error when valid username is entered after error', async () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      
      // Trigger error
      fireEvent.blur(usernameField);
      
      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).toBeInTheDocument();
      });

      // Enter valid username
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('shows error when username is empty on submit', async () => {
      renderWithProviders(<ForgotPassword />);

      const submitButton = screen.getByRole('button', { name: /reset my password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorText = screen.queryByText(/username is required/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it('shows error when username is too short on submit', async () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'ab' } });

      const submitButton = screen.getByRole('button', { name: /reset my password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorText = screen.queryByText(/enter a valid username/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it('does not submit when validation fails', async () => {
      renderWithProviders(<ForgotPassword />);

      const submitButton = screen.getByRole('button', { name: /reset my password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPasswordRecovery).not.toHaveBeenCalled();
      });
    });

    it('trims whitespace from username before validation', async () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: '  testuser  ' } });

      const submitButton = screen.getByRole('button', { name: /reset my password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPasswordRecovery).toHaveBeenCalledWith({
          username: 'testuser',
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('calls password recovery mutation with correct username on valid submit', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({
        message: 'Password reset email sent',
      });
      mockPasswordRecovery.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPasswordRecovery).toHaveBeenCalledWith({
          username: 'testuser',
        });
      });
    });

    it('disables submit button when loading', () => {
      mockPasswordRecoveryState.isLoading = true;
      renderWithProviders(<ForgotPassword />);

      const submitButton = screen.getByRole('button', { name: /sending reset request/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading text on button when submitting', () => {
      mockPasswordRecoveryState.isLoading = true;
      renderWithProviders(<ForgotPassword />);

      expect(screen.getByText('Sending reset request...')).toBeInTheDocument();
    });
  });

  describe('Success Handling', () => {
    it('shows success snackbar on successful password recovery', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({
        message: 'Password reset email sent',
      });
      mockPasswordRecovery.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText(/if the username exists, a password reset email has been sent/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('does not navigate after successful recovery - user should check email', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({
        message: 'Password reset email sent',
      });
      mockPasswordRecovery.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockPasswordRecovery).toHaveBeenCalled();
      });

      // User should check email and click link - no automatic navigation
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows error snackbar on password recovery failure', async () => {
      const mockUnwrap = jest.fn().mockRejectedValue({
        data: { message: 'User not found' },
      });
      mockPasswordRecovery.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows default error message when error has no message', async () => {
      const mockUnwrap = jest.fn().mockRejectedValue({});
      mockPasswordRecovery.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText(/an error occurred. please try again/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Snackbar Behavior', () => {
    it('closes success snackbar when close button is clicked', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({
        message: 'Password reset email sent',
      });
      mockPasswordRecovery.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText(/if the username exists/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/if the username exists/i)).not.toBeInTheDocument();
      });
    });

    it('closes error snackbar when close button is clicked', async () => {
      const mockUnwrap = jest.fn().mockRejectedValue({
        data: { message: 'Error occurred' },
      });
      mockPasswordRecovery.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      }, { timeout: 3000 });

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const errorCloseButton = closeButtons.find(btn => 
        btn.closest('[role="alert"]')?.textContent?.includes('Error occurred')
      );
      
      if (errorCloseButton) {
        fireEvent.click(errorCloseButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      renderWithProviders(<ForgotPassword />);

      const form = screen.getByRole('button', { name: /reset my password/i }).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('has accessible form fields', () => {
      renderWithProviders(<ForgotPassword />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      expect(usernameField).toBeInTheDocument();
    });
  });
});

