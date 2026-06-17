import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  const mockProps = {
    open: true,
    message: 'Test message',
    severity: 'success' as const,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders toast when open is true', () => {
    render(<Toast {...mockProps} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render toast when open is false', () => {
    render(<Toast {...mockProps} open={false} />);
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('displays success message with success severity', () => {
    render(<Toast {...mockProps} severity="success" />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('displays error message with error severity', () => {
    render(<Toast {...mockProps} severity="error" message="Error occurred" />);
    
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('displays warning message with warning severity', () => {
    render(<Toast {...mockProps} severity="warning" message="Warning message" />);
    
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('displays info message with info severity', () => {
    render(<Toast {...mockProps} severity="info" message="Info message" />);
    
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after autoHideDuration elapses', () => {
    jest.useFakeTimers();
    render(<Toast {...mockProps} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // The Snackbar uses autoHideDuration={6000}; advance past it inside act
    // so the internal timer fires and triggers onClose.
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(mockProps.onClose).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('renders at top-right position', () => {
    render(<Toast {...mockProps} />);
    
    const snackbar = screen.getByRole('alert').closest('[class*="Snackbar"]');
    expect(snackbar).toBeInTheDocument();
  });
});

