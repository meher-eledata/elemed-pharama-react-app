import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CommonModal from '../CommonModal';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('CommonModal', () => {
  const mockOnClose = jest.fn();
  const mockContent = <div data-testid="modal-content">Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });

    it('does not render modal when open is false', () => {
      renderWithTheme(
        <CommonModal
          open={false}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
    });

    it('renders title correctly', () => {
      renderWithTheme(
        <CommonModal
          open={true}
          title="Custom Title"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders content correctly', () => {
      const customContent = <div data-testid="custom-content">Custom Content</div>;
      
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={customContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('renders Close button', () => {
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders action buttons when provided', () => {
      const actionButtons = (
        <>
          <button data-testid="action-button-1">Action 1</button>
          <button data-testid="action-button-2">Action 2</button>
        </>
      );

      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
          actionButtons={actionButtons}
        />
      );

      expect(screen.getByTestId('action-button-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-button-2')).toBeInTheDocument();
    });

    it('does not render action buttons when not provided', () => {
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      // Only Close button should be present
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
      expect(buttons[0]).toHaveTextContent('Close');
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when Close button is clicked', () => {
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

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
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has proper title association', () => {
      renderWithTheme(
        <CommonModal
          open={true}
          title="Test Modal"
          content={mockContent}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });
});

