import { handleLoginEffect } from '../loginHandlers';
import { setCredentials } from '../../../redux/slices/authSlice';
import { LOGIN_LABELS } from '../../label/loginLabels';

// Mock the auth slice
jest.mock('../../../redux/slices/authSlice', () => ({
  setCredentials: jest.fn(),
}));

// Mock the labels
jest.mock('../../label/loginLabels', () => ({
  LOGIN_LABELS: {
    SUCCESS_MESSAGE: 'Login successful!',
    ERROR_INVALID_CREDENTIALS: 'Invalid username or password.',
    ERROR_DEFAULT: 'Login failed. Please try again.',
  },
}));

describe('loginHandlers', () => {
  const mockDispatch = jest.fn();
  const mockNavigate = jest.fn();
  const mockSetSnackbarMessage = jest.fn();
  const mockSetSnackbarSeverity = jest.fn();
  const mockSetSnackbarOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLoginEffect - Success Cases', () => {
    it('handles successful login with data', () => {
      const mockData = {
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
        },
      };

      handleLoginEffect({
        isSuccess: true,
        isError: false,
        data: mockData,
        error: null,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockDispatch).toHaveBeenCalledWith(setCredentials(mockData));
      expect(mockSetSnackbarMessage).toHaveBeenCalledWith(LOGIN_LABELS.SUCCESS_MESSAGE);
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('success');
      expect(mockSetSnackbarOpen).toHaveBeenCalledWith(true);
    });

    it('does not navigate on success (navigation is handled in component)', () => {
      const mockData = {
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
        },
      };

      handleLoginEffect({
        isSuccess: true,
        isError: false,
        data: mockData,
        error: null,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      // Navigation is commented out in the handler, so it should not be called
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles success with minimal data', () => {
      const mockData = {
        token: 'token',
        user: {
          id: 1,
          username: 'user',
          email: 'email@test.com',
          first_name: 'First',
          last_name: 'Last',
        },
      };

      handleLoginEffect({
        isSuccess: true,
        isError: false,
        data: mockData,
        error: null,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockDispatch).toHaveBeenCalledWith(setCredentials(mockData));
      expect(mockSetSnackbarMessage).toHaveBeenCalledWith(LOGIN_LABELS.SUCCESS_MESSAGE);
    });
  });

  describe('handleLoginEffect - Error Cases', () => {
    it('handles 401 error (invalid credentials)', () => {
      const mockError = {
        status: 401,
        data: null,
      };

      handleLoginEffect({
        isSuccess: false,
        isError: true,
        data: null,
        error: mockError,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockSetSnackbarMessage).toHaveBeenCalledWith(LOGIN_LABELS.ERROR_INVALID_CREDENTIALS);
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('error');
      expect(mockSetSnackbarOpen).toHaveBeenCalledWith(true);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('handles 400 error with error message in data', () => {
      const mockError = {
        status: 400,
        data: {
          error: 'Custom error message',
        },
      };

      handleLoginEffect({
        isSuccess: false,
        isError: true,
        data: null,
        error: mockError,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockSetSnackbarMessage).toHaveBeenCalledWith('Custom error message');
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('error');
      expect(mockSetSnackbarOpen).toHaveBeenCalledWith(true);
    });

    it('handles 400 error without error message in data', () => {
      const mockError = {
        status: 400,
        data: {},
      };

      handleLoginEffect({
        isSuccess: false,
        isError: true,
        data: null,
        error: mockError,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockSetSnackbarMessage).toHaveBeenCalledWith('Error: 400');
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('error');
    });

    it('handles generic HTTP error with status code', () => {
      const mockError = {
        status: 500,
        data: null,
      };

      handleLoginEffect({
        isSuccess: false,
        isError: true,
        data: null,
        error: mockError,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockSetSnackbarMessage).toHaveBeenCalledWith('Error: 500');
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('error');
      expect(mockSetSnackbarOpen).toHaveBeenCalledWith(true);
    });

    it('handles error with message property', () => {
      const mockError = {
        message: 'Network error occurred',
      };

      handleLoginEffect({
        isSuccess: false,
        isError: true,
        data: null,
        error: mockError,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockSetSnackbarMessage).toHaveBeenCalledWith('Network error occurred');
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('error');
    });

    it('handles error without status or message (fallback to default)', () => {
      const mockError = {};

      handleLoginEffect({
        isSuccess: false,
        isError: true,
        data: null,
        error: mockError,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockSetSnackbarMessage).toHaveBeenCalledWith(LOGIN_LABELS.ERROR_DEFAULT);
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('error');
    });

    it('handles null error', () => {
      handleLoginEffect({
        isSuccess: false,
        isError: true,
        data: null,
        error: null,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockSetSnackbarMessage).toHaveBeenCalledWith(LOGIN_LABELS.ERROR_DEFAULT);
      expect(mockSetSnackbarSeverity).toHaveBeenCalledWith('error');
    });
  });

  describe('handleLoginEffect - Edge Cases', () => {
    it('does nothing when neither success nor error', () => {
      handleLoginEffect({
        isSuccess: false,
        isError: false,
        data: null,
        error: null,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockSetSnackbarMessage).not.toHaveBeenCalled();
      expect(mockSetSnackbarOpen).not.toHaveBeenCalled();
    });

    it('handles success with null data', () => {
      handleLoginEffect({
        isSuccess: true,
        isError: false,
        data: null,
        error: null,
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      // Should not dispatch credentials if data is null
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('prioritizes success over error when both are true', () => {
      const mockData = {
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
        },
      };

      handleLoginEffect({
        isSuccess: true,
        isError: true,
        data: mockData,
        error: { status: 401 },
        dispatch: mockDispatch,
        navigate: mockNavigate,
        setSnackbarMessage: mockSetSnackbarMessage,
        setSnackbarSeverity: mockSetSnackbarSeverity,
        setSnackbarOpen: mockSetSnackbarOpen,
      });

      // Success should be handled
      expect(mockDispatch).toHaveBeenCalledWith(setCredentials(mockData));
      expect(mockSetSnackbarMessage).toHaveBeenCalledWith(LOGIN_LABELS.SUCCESS_MESSAGE);
    });
  });
});

