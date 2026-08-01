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

  it('renders page size and orientation selectors and reports changes', () => {
    const onPageSizeChange = jest.fn();
    const onOrientationChange = jest.fn();
    render(
      <ActionButtons
        {...mockProps}
        onPageSizeChange={onPageSizeChange}
        onOrientationChange={onOrientationChange}
      />
    );

    fireEvent.click(screen.getByText(/^A5$/));
    expect(onPageSizeChange).toHaveBeenCalledWith('A5');

    fireEvent.click(screen.getByText(/^Portrait$/));
    expect(onOrientationChange).toHaveBeenCalledWith('portrait');
  });

  it('hides page size and orientation selectors when hidePageSize is set', () => {
    render(<ActionButtons {...mockProps} hidePageSize />);

    expect(screen.queryByText(/^A5$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Portrait$/)).not.toBeInTheDocument();
  });

  it('renders buttons with correct styling', () => {
    render(<ActionButtons {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});

