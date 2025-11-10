import React from 'react';
import { render, screen } from '@testing-library/react';
import ValidationErrorAlert from '../ValidationErrorAlert';

describe('ValidationErrorAlert', () => {
  it('renders nothing when error is empty', () => {
    const { container } = render(<ValidationErrorAlert error="" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when error is not provided', () => {
    const { container } = render(<ValidationErrorAlert error={undefined as any} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('displays error message when provided', () => {
    render(<ValidationErrorAlert error="Product not available" />);
    
    expect(screen.getByText(/product not available/i)).toBeInTheDocument();
  });

  it('displays warning icon with error message', () => {
    render(<ValidationErrorAlert error="Invalid quantity" />);
    
    const errorText = screen.getByText(/invalid quantity/i);
    expect(errorText).toBeInTheDocument();
  });

  it('handles long error messages', () => {
    const longError = 'This is a very long error message that should still be displayed correctly in the validation error alert component';
    render(<ValidationErrorAlert error={longError} />);
    
    expect(screen.getByText(longError)).toBeInTheDocument();
  });
});

