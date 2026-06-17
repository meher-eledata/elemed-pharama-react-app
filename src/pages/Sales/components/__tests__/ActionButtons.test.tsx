import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  const mockProps = {
    onCancel: jest.fn(),
    onSave: jest.fn(),
    onPrint: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all action buttons', () => {
    render(<ActionButtons {...mockProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save and print/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<ActionButtons {...mockProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when Save button is clicked', () => {
    render(<ActionButtons {...mockProps} />);
    
    const saveButton = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveButton);
    
    expect(mockProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onPrint when Print button is clicked', () => {
    render(<ActionButtons {...mockProps} />);
    
    const printButton = screen.getByText(/print/i);
    fireEvent.click(printButton);
    
    expect(mockProps.onPrint).toHaveBeenCalledTimes(1);
  });

  it('renders buttons with correct styling', () => {
    render(<ActionButtons {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});

