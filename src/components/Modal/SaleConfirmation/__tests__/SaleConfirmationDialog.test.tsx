import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SaleConfirmationDialog from '../SaleConfirmationDialog';

describe('SaleConfirmationDialog', () => {
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog when open is true', () => {
    render(<SaleConfirmationDialog {...mockProps} />);
    
    expect(screen.getByText(/confirm sale/i)).toBeInTheDocument();
  });

  it('does not render dialog when open is false', () => {
    render(<SaleConfirmationDialog {...mockProps} open={false} />);
    
    expect(screen.queryByText(/confirm sale/i)).not.toBeInTheDocument();
  });

  it('displays confirmation message', () => {
    render(<SaleConfirmationDialog {...mockProps} />);
    
    expect(screen.getByText(/you are about to confirm this sale/i)).toBeInTheDocument();
  });

  it('displays irreversible warning', () => {
    render(<SaleConfirmationDialog {...mockProps} />);
    
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<SaleConfirmationDialog {...mockProps} />);
    
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    render(<SaleConfirmationDialog {...mockProps} />);
    
    // Use getAllByText and find the button element
    const confirmElements = screen.getAllByText(/confirm/i);
    const confirmButton = confirmElements.find(el => el.tagName === 'BUTTON' || el.closest('button'));
    expect(confirmButton).toBeInTheDocument();
    if (confirmButton) {
      fireEvent.click(confirmButton);
      expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
    }
  });

  it('disables buttons when isLoading is true', () => {
    render(<SaleConfirmationDialog {...mockProps} isLoading={true} />);
    
    const cancelButton = screen.getByText(/cancel/i);
    const confirmButton = screen.getByText(/processing/i);
    
    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it('shows processing text when isLoading is true', () => {
    render(<SaleConfirmationDialog {...mockProps} isLoading={true} />);
    
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('handles Escape key to close dialog', () => {
    render(<SaleConfirmationDialog {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('handles Enter key to confirm when not loading', () => {
    render(<SaleConfirmationDialog {...mockProps} isLoading={false} />);
    
    fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
    
    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not handle Enter key when loading', () => {
    render(<SaleConfirmationDialog {...mockProps} isLoading={true} />);
    
    fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
    
    expect(mockProps.onConfirm).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<SaleConfirmationDialog {...mockProps} />);
    
    unmount();
    
    // Event listeners should be cleaned up
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });
});

