import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkActionsBar from '../BulkActionsBar';

describe('BulkActionsBar', () => {
  const mockProps = {
    selectedCount: 0,
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when selectedCount is 0', () => {
    const { container } = render(<BulkActionsBar {...mockProps} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders when selectedCount is greater than 0', () => {
    render(<BulkActionsBar {...mockProps} selectedCount={3} />);
    
    // Text is split across text nodes but in same element, and also appears in button title
    // Use getAllByText and find the Typography element (P tag), not the button
    const elements = screen.getAllByText((content, element) => {
      const text = element?.textContent || '';
      return text.includes('3') && text.includes('item(s) selected');
    });
    const typographyElement = elements.find(el => el.tagName === 'P');
    expect(typographyElement).toBeInTheDocument();
  });

  it('displays correct selected count', () => {
    render(<BulkActionsBar {...mockProps} selectedCount={5} />);
    
    // Text is split across text nodes but in same element, and also appears in button title
    // Use getAllByText and find the Typography element (P tag), not the button
    const elements = screen.getAllByText((content, element) => {
      const text = element?.textContent || '';
      return text.includes('5') && text.includes('item(s) selected');
    });
    const typographyElement = elements.find(el => el.tagName === 'P');
    expect(typographyElement).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<BulkActionsBar {...mockProps} selectedCount={2} />);
    
    const deleteButton = screen.getByTitle(/delete/i) || 
      screen.getByRole('button', { name: /delete/i });
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    }
  });

  it('displays apply action label', () => {
    render(<BulkActionsBar {...mockProps} selectedCount={1} />);
    
    // Text is split across text nodes but in same element, check parent element's textContent
    // Use getAllByText since button title also contains this text, then find the Typography element
    const elements = screen.getAllByText((content, element) => {
      const text = element?.textContent || '';
      return text.includes('item(s) selected');
    });
    // Find the Typography element (not the button title)
    const typographyElement = elements.find(el => el.tagName === 'P');
    expect(typographyElement).toBeInTheDocument();
  });
});

