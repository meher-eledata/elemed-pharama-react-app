import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import CreatePassword from '../CreatePassword';
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

// Mock react-router-dom (navigate spy, keep real Router primitives)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock create/reset password mutations
const mockCreatePassword = jest.fn();
const mockResetPassword = jest.fn();
let mockCreateState = { isLoading: false };
let mockResetState = { isLoading: false };

jest.mock('../../../../redux/slices/authSlice', () => {
  const actual = jest.requireActual('../../../../redux/slices/authSlice');
  return {
    ...actual,
    useCreatePasswordMutation: () => [mockCreatePassword, mockCreateState],
    useResetPasswordMutation: () => [mockResetPassword, mockResetState],
  };
});

// The submit button is only enabled when a token is present in the URL, so the
// create-password flow is exercised with a token query param by default.
const renderWithProviders = (
  component: React.ReactElement,
  route = '/create-password?token=test-token'
) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider theme={theme}>{component}</ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
};

describe('CreatePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateState = { isLoading: false };
    mockResetState = { isLoading: false };
    // Default: mutation resolves successfully
    mockCreatePassword.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: 'ok' }),
    });
    mockResetPassword.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ message: 'ok' }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders create password form with all elements', () => {
      renderWithProviders(<CreatePassword />);

      // On the /create-password route the title/button use the create-flow copy
      expect(screen.getByText('Create Your Password')).toBeInTheDocument();
      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /submit password/i })
      ).toBeInTheDocument();
    });

    it('renders the create-flow description', () => {
      renderWithProviders(<CreatePassword />);

      expect(
        screen.getByText(/set up a strong password to secure your new account/i)
      ).toBeInTheDocument();
    });

    it('renders both password fields', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Form Input Handling', () => {
    it('updates new password field when user types', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });
      expect(newPasswordField).toHaveValue('Test123!');
    });

    it('updates confirm password field when user types', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      fireEvent.change(confirmPasswordField, { target: { value: 'Test123!' } });
      expect(confirmPasswordField).toHaveValue('Test123!');
    });

    it('toggles new password visibility when eye icon is clicked', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;

      expect(newPasswordField).toHaveAttribute('type', 'password');

      const toggleButtons = screen.getAllByRole('button');
      const newPasswordToggle = toggleButtons.find((btn) =>
        btn.getAttribute('aria-label')?.includes('toggle password visibility')
      );

      expect(newPasswordToggle).toBeDefined();
      if (newPasswordToggle) {
        fireEvent.click(newPasswordToggle);
        expect(newPasswordField).toHaveAttribute('type', 'text');
      }
    });

    it('toggles confirm password visibility when eye icon is clicked', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      expect(confirmPasswordField).toHaveAttribute('type', 'password');

      const toggleButtons = screen.getAllByRole('button');
      const passwordToggles = toggleButtons.filter((btn) =>
        btn.getAttribute('aria-label')?.includes('toggle password visibility')
      );

      expect(passwordToggles.length).toBeGreaterThan(1);
      fireEvent.click(passwordToggles[1]);
      expect(confirmPasswordField).toHaveAttribute('type', 'text');
    });
  });

  describe('Live Validation', () => {
    it('shows an inline validation error when the password is invalid', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;

      // Lowercase start fails the regex
      fireEvent.change(newPasswordField, { target: { value: 'test123!' } });

      await waitFor(() => {
        expect(
          screen.getByText(/password must start with a capital letter/i)
        ).toBeInTheDocument();
      });
    });

    it('does not show a validation error for a password meeting requirements', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/password must start with a capital letter/i)
        ).not.toBeInTheDocument();
      });
    });

    it('shows a mismatch message when passwords do not match', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'Test1234!' } });

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('shows a match message when passwords match', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'Test123!' } });

      await waitFor(() => {
        expect(screen.getByText('Passwords match')).toBeInTheDocument();
      });
    });
  });

  describe('Submit Button State', () => {
    it('disables the submit button when no password is entered', () => {
      renderWithProviders(<CreatePassword />);

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables the submit button when passwords do not match', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'Different1!' } });

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('disables the submit button when the token is missing', () => {
      renderWithProviders(<CreatePassword />, '/create-password');

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'Test123!' } });

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables the submit button for a valid, matching password with a token', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'Test123!' } });

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls the create-password mutation with the token and password', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      await waitFor(() => expect(submitButton).toBeEnabled());
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePassword).toHaveBeenCalledWith({
          token: 'test-token',
          password: validPassword,
        });
      });
    });

    it('navigates to the login page after a successful submission', async () => {
      jest.useFakeTimers();
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      // Button enabled check happens via state already flushed by the change events
      fireEvent.click(submitButton);

      // Flush the awaited unwrap() promise, then the 2s redirect timer
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(2000);

      expect(mockNavigate).toHaveBeenCalledWith('/');
      jest.useRealTimers();
    });

    it('does not call the mutation when the password is invalid (button disabled)', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;

      // Invalid password keeps the button disabled
      fireEvent.change(newPasswordField, { target: { value: 'test' } });

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      fireEvent.click(submitButton);

      expect(mockCreatePassword).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows an error snackbar when the mutation rejects', async () => {
      mockCreatePassword.mockReturnValue({
        unwrap: jest.fn().mockRejectedValue({ data: { error: 'Token expired' } }),
      });

      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;

      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /submit password/i });
      await waitFor(() => expect(submitButton).toBeEnabled());
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getAllByText('Token expired').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible password toggle buttons', () => {
      renderWithProviders(<CreatePassword />);

      const toggleButtons = screen.getAllByRole('button');
      const passwordToggles = toggleButtons.filter((btn) =>
        btn.getAttribute('aria-label')?.includes('toggle password visibility')
      );

      expect(passwordToggles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('accepts a password with various special characters', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;

      fireEvent.change(newPasswordField, { target: { value: 'Test123@#$' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/password must start with a capital letter/i)
        ).not.toBeInTheDocument();
      });
    });

    it('accepts a long valid password', async () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;

      fireEvent.change(newPasswordField, {
        target: { value: 'Test123!ThisIsAVeryLongPassword' },
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/password must start with a capital letter/i)
        ).not.toBeInTheDocument();
      });
    });
  });
});
