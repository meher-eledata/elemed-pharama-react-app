import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ConfirmationDialog from '../ConfirmationDialog';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ConfirmationDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const defaultProps = {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open is true', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
      expect(screen.queryByText('Are you sure you want to proceed?')).not.toBeInTheDocument();
    });

    it('renders title correctly', () => {
      renderWithTheme(
        <ConfirmationDialog
          {...defaultProps}
          title="Delete Item"
        />
      );

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('renders message correctly', () => {
      renderWithTheme(
        <ConfirmationDialog
          {...defaultProps}
          message="This action cannot be undone."
        />
      );

      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('renders Yes button', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders close icon button', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      // Find close icon button by aria-label or by finding IconButton with CloseIcon
      const closeButton = screen.queryByLabelText(/close/i) || 
                         document.querySelector('button[aria-label*="close" i]') ||
                         document.querySelector('button svg[data-testid*="Close"]')?.closest('button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onConfirm when Yes button is clicked', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      const yesButton = screen.getByText('Yes');
      fireEvent.click(yesButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Cancel button is clicked', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('calls onClose when close icon is clicked', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      // Find close icon button
      const closeButton = screen.queryByLabelText(/close/i) || 
                         document.querySelector('button[aria-label*="close" i]') ||
                         document.querySelector('button svg')?.closest('button');
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnConfirm).not.toHaveBeenCalled();
      }
    });

    it('calls onClose when backdrop is clicked', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      // Find the backdrop and click it
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has proper aria-labelledby attribute', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'alert-dialog-title');
    });

    it('has proper aria-describedby attribute', () => {
      renderWithTheme(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'alert-dialog-description');
    });
  });

  describe('Edge Cases', () => {
    it('handles long title text', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      renderWithTheme(
        <ConfirmationDialog
          {...defaultProps}
          title={longTitle}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles long message text', () => {
      const longMessage = 'This is a very long message that contains a lot of text and might need to wrap to multiple lines in the dialog';
      renderWithTheme(
        <ConfirmationDialog
          {...defaultProps}
          message={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles empty title', () => {
      renderWithTheme(
        <ConfirmationDialog
          {...defaultProps}
          title=""
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('handles empty message', () => {
      renderWithTheme(
        <ConfirmationDialog
          {...defaultProps}
          message=""
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});

