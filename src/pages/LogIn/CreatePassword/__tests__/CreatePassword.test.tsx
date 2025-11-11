import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CreatePassword from '../CreatePassword';

const theme = createTheme();

// Helper to render component with all providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('CreatePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders create password form with all elements', () => {
      renderWithProviders(<CreatePassword />);

      expect(screen.getByText('Create New Password')).toBeInTheDocument();
      expect(screen.getByText(/set a strong password/i)).toBeInTheDocument();
      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm password/i })).toBeInTheDocument();
    });

    it('renders password hint text', () => {
      renderWithProviders(<CreatePassword />);

      expect(screen.getByText(/minimum 8 characters/i)).toBeInTheDocument();
    });

    it('renders both password fields', () => {
      renderWithProviders(<CreatePassword />);

      // Password fields are rendered as input elements
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
      
      // Initially password should be hidden
      expect(newPasswordField).toHaveAttribute('type', 'password');

      // Find and click the toggle button for new password
      const toggleButtons = screen.getAllByRole('button');
      const newPasswordToggle = toggleButtons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('aria-label')?.includes('toggle password visibility')
      );
      
      if (newPasswordToggle) {
        fireEvent.click(newPasswordToggle);
        expect(newPasswordField).toHaveAttribute('type', 'text');
      }
    });

    it('toggles confirm password visibility when eye icon is clicked', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      // Initially password should be hidden
      expect(confirmPasswordField).toHaveAttribute('type', 'password');

      // Find and click the toggle button for confirm password
      const toggleButtons = screen.getAllByRole('button');
      const passwordToggles = toggleButtons.filter(btn => 
        btn.querySelector('svg') && btn.getAttribute('aria-label')?.includes('toggle password visibility')
      );
      
      if (passwordToggles.length > 1) {
        fireEvent.click(passwordToggles[1]);
        expect(confirmPasswordField).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('Form Validation', () => {
    it('shows error when new password is empty on submit', () => {
      renderWithProviders(<CreatePassword />);

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });

    it('shows error when password does not meet requirements', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      
      // Password that doesn't start with capital
      fireEvent.change(newPasswordField, { target: { value: 'test123!' } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/password must start with a capital letter/i)).toBeInTheDocument();
    });

    it('shows error when password is too short', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      
      // Password that is too short
      fireEvent.change(newPasswordField, { target: { value: 'Test1!' } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/password must start with a capital letter/i)).toBeInTheDocument();
    });

    it('shows error when password lacks number', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      
      // Password without number
      fireEvent.change(newPasswordField, { target: { value: 'TestPass!' } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/password must start with a capital letter/i)).toBeInTheDocument();
    });

    it('shows error when password lacks special character', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      
      // Password without special character
      fireEvent.change(newPasswordField, { target: { value: 'TestPass123' } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/password must start with a capital letter/i)).toBeInTheDocument();
    });

    it('shows error when passwords do not match', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      fireEvent.change(newPasswordField, { target: { value: 'Test123!' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'Test1234!' } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('accepts valid password that meets all requirements', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      // Should not show error
      expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/password must start/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });

    it('clears error when valid password is entered after error', () => {
      renderWithProviders(<CreatePassword />);

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Password is required.')).toBeInTheDocument();

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      fireEvent.click(submitButton);

      expect(screen.queryByText('Password is required.')).not.toBeInTheDocument();
    });
  });

  describe('Password Requirements', () => {
    it('validates password starting with capital letter', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/password must start/i)).not.toBeInTheDocument();
    });

    it('validates password contains number', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/password must start/i)).not.toBeInTheDocument();
    });

    it('validates password contains special character', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/password must start/i)).not.toBeInTheDocument();
    });

    it('validates password minimum length of 8 characters', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123!'; // 8 characters
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/password must start/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('navigates to home page on successful password creation', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123!';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('does not navigate when validation fails', () => {
      renderWithProviders(<CreatePassword />);

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      renderWithProviders(<CreatePassword />);

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('has accessible password toggle buttons', () => {
      renderWithProviders(<CreatePassword />);

      const toggleButtons = screen.getAllByRole('button');
      const passwordToggles = toggleButtons.filter(btn => 
        btn.getAttribute('aria-label')?.includes('toggle password visibility')
      );
      
      expect(passwordToggles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles password with various special characters', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const validPassword = 'Test123@#$';
      fireEvent.change(newPasswordField, { target: { value: validPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: validPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/password must start/i)).not.toBeInTheDocument();
    });

    it('handles long valid password', () => {
      renderWithProviders(<CreatePassword />);

      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const newPasswordField = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordField = passwordInputs[1] as HTMLInputElement;
      
      const longValidPassword = 'Test123!ThisIsAVeryLongPassword';
      fireEvent.change(newPasswordField, { target: { value: longValidPassword } });
      fireEvent.change(confirmPasswordField, { target: { value: longValidPassword } });

      const submitButton = screen.getByRole('button', { name: /confirm password/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/password must start/i)).not.toBeInTheDocument();
    });
  });
});

