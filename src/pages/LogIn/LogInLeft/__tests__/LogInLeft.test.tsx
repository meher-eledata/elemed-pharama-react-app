import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import LogInLeft from '../LogInLeft';
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
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock state for useLoginMutation
let mockLoginState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null as any,
  data: null as any,
};

const mockLogin = jest.fn();

// Mock the login mutation
jest.mock('../../../../redux/slices/authSlice', () => {
  const actual = jest.requireActual('../../../../redux/slices/authSlice');
  return {
    ...actual,
    useLoginMutation: () => [
      mockLogin,
      mockLoginState,
    ],
  };
});

// Mock useDispatch
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

describe('LogInLeft (LoginForm)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    mockLoginState = {
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    };
    // Default mock that returns an object with unwrap method
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        token: 'test-token',
        user: { id: 1, username: 'testuser', email: 'test@test.com' },
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders login form with all elements', () => {
      renderWithProviders(<LogInLeft />);

      expect(screen.getByText('Elemed')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('renders username field with correct label', () => {
      renderWithProviders(<LogInLeft />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      expect(usernameField).toBeInTheDocument();
      expect(usernameField).toHaveAttribute('type', 'text');
    });

    it('renders password field with correct type', () => {
      renderWithProviders(<LogInLeft />);

      const passwordField = screen.getByPlaceholderText('••••••••');
      expect(passwordField).toBeInTheDocument();
      expect(passwordField).toHaveAttribute('type', 'password');
    });

    it('renders password visibility toggle button', () => {
      renderWithProviders(<LogInLeft />);

      // Material-UI visibility toggle button contains an SVG icon
      const toggleButtons = screen.getAllByRole('button');
      const passwordToggle = toggleButtons.find(btn => 
        btn.querySelector('svg[data-testid="VisibilityOffIcon"]') || 
        btn.querySelector('svg[data-testid="VisibilityIcon"]')
      );
      expect(passwordToggle).toBeDefined();
      expect(passwordToggle).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('updates username field when user types', () => {
      renderWithProviders(<LogInLeft />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      expect(usernameField).toHaveValue('testuser');
    });

    it('updates password field when user types', () => {
      renderWithProviders(<LogInLeft />);

      const passwordField = screen.getByPlaceholderText('••••••••');
      fireEvent.change(passwordField, { target: { value: 'testpass123' } });

      expect(passwordField).toHaveValue('testpass123');
    });

    it('toggles password visibility when eye icon is clicked', () => {
      renderWithProviders(<LogInLeft />);

      const passwordField = screen.getByPlaceholderText('••••••••');
      const toggleButtons = screen.getAllByRole('button');
      const passwordToggle = toggleButtons.find(btn => 
        btn.querySelector('svg[data-testid="VisibilityOffIcon"]') || 
        btn.querySelector('svg[data-testid="VisibilityIcon"]')
      );

      // Initially password should be hidden
      expect(passwordField).toHaveAttribute('type', 'password');

      // Click to show password
      if (passwordToggle) {
        fireEvent.click(passwordToggle);
        expect(passwordField).toHaveAttribute('type', 'text');

        // Click to hide password again
        fireEvent.click(passwordToggle);
        expect(passwordField).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Form Validation', () => {
    it('shows error when username is empty on submit', async () => {
      renderWithProviders(<LogInLeft />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorText = screen.queryByText(/username is required/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it('shows error when password is empty on submit', async () => {
      renderWithProviders(<LogInLeft />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameField, { target: { value: 'testuser' } });

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorText = screen.queryByText(/password is required/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    it('shows error when both fields are empty on submit', async () => {
      renderWithProviders(<LogInLeft />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const usernameError = screen.queryByText(/username is required/i);
        const passwordError = screen.queryByText(/password is required/i);
        expect(usernameError || passwordError).toBeInTheDocument();
      });
    });

    it('trims whitespace from username and password before validation', async () => {
      renderWithProviders(<LogInLeft />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      const passwordField = screen.getByPlaceholderText('••••••••');

      fireEvent.change(usernameField, { target: { value: '  testuser  ' } });
      fireEvent.change(passwordField, { target: { value: '  testpass  ' } });

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'testpass',
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('calls login mutation with correct credentials on valid submit', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({
        token: 'test-token',
        user: { id: 1, username: 'testuser', email: 'test@test.com' },
      });
      mockLogin.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<LogInLeft />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      const passwordField = screen.getByPlaceholderText('••••••••');

      fireEvent.change(usernameField, { target: { value: 'testuser' } });
      fireEvent.change(passwordField, { target: { value: 'testpass' } });

      const form = screen.getByRole('button', { name: /login/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'testpass',
        });
      });
    });

    it('disables submit button when loading', () => {
      mockLoginState.isLoading = true;
      renderWithProviders(<LogInLeft />);

      const submitButton = screen.getByRole('button', { name: /logging in/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading text on button when submitting', () => {
      mockLoginState.isLoading = true;
      renderWithProviders(<LogInLeft />);

      expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });
  });

  describe('Success Handling', () => {
    it('navigates to dashboard on successful login', async () => {
      const mockUnwrap = jest.fn().mockResolvedValue({
        token: 'test-token',
        user: { id: 1, username: 'testuser', email: 'test@test.com' },
      });
      mockLogin.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<LogInLeft />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      const passwordField = screen.getByPlaceholderText('••••••••');

      fireEvent.change(usernameField, { target: { value: 'testuser' } });
      fireEvent.change(passwordField, { target: { value: 'testpass' } });

      const form = screen.getByRole('button', { name: /login/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('dispatches setCredentials on successful login', async () => {
      mockLoginState.isSuccess = true;
      mockLoginState.data = {
        token: 'test-token',
        user: { id: 1, username: 'testuser', email: 'test@test.com' },
      };

      renderWithProviders(<LogInLeft />);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('shows success snackbar on successful login', async () => {
      mockLoginState.isSuccess = true;
      mockLoginState.data = {
        token: 'test-token',
        user: { id: 1, username: 'testuser', email: 'test@test.com' },
      };

      renderWithProviders(<LogInLeft />);

      await waitFor(() => {
        expect(screen.getByText('Login successful!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error snackbar on 401 error', async () => {
      mockLoginState.isError = true;
      mockLoginState.error = {
        status: 401,
        data: null,
      };

      renderWithProviders(<LogInLeft />);

      await waitFor(() => {
        expect(screen.getByText('Invalid username or password.')).toBeInTheDocument();
      });
    });

    it('shows error snackbar on 400 error with message', async () => {
      mockLoginState.isError = true;
      mockLoginState.error = {
        status: 400,
        data: { error: 'Custom error message' },
      };

      renderWithProviders(<LogInLeft />);

      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
      });
    });

    it('shows default error message on generic error', async () => {
      mockLoginState.isError = true;
      mockLoginState.error = {
        status: 500,
        data: null,
      };

      renderWithProviders(<LogInLeft />);

      await waitFor(() => {
        expect(screen.getByText(/error: 500/i)).toBeInTheDocument();
      });
    });

    it('handles login failure in catch block', async () => {
      const mockUnwrap = jest.fn().mockRejectedValue({
        data: { error: 'Login failed' },
      });
      mockLogin.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderWithProviders(<LogInLeft />);

      const usernameField = screen.getByPlaceholderText('Enter your username');
      const passwordField = screen.getByPlaceholderText('••••••••');

      fireEvent.change(usernameField, { target: { value: 'testuser' } });
      fireEvent.change(passwordField, { target: { value: 'testpass' } });

      const form = screen.getByRole('button', { name: /login/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Navigation', () => {
    it('navigates to forgot password page when link is clicked', () => {
      renderWithProviders(<LogInLeft />);

      const forgotPasswordLink = screen.getByText('Forgot Password?');
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      renderWithProviders(<LogInLeft />);

      const form = screen.getByRole('button', { name: /login/i }).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('has accessible password toggle button', () => {
      renderWithProviders(<LogInLeft />);

      const toggleButtons = screen.getAllByRole('button');
      const passwordToggle = toggleButtons.find(btn => 
        btn.querySelector('svg[data-testid="VisibilityOffIcon"]') || 
        btn.querySelector('svg[data-testid="VisibilityIcon"]')
      );
      expect(passwordToggle).toBeDefined();
      expect(passwordToggle).toBeInTheDocument();
    });
  });
});
