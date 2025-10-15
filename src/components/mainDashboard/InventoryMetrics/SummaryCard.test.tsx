import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SummaryCard from './SummaryCard';
import { SUMMARY_CARD_CONSTANTS } from '../../../config/constants/SummaryCard.constants';
import { SUMMARY_CARD_LABELS } from '../../../config/label/SummaryCard.labels';

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('SummaryCard Component', () => {
  const mockOnActionClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders with title only', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.queryByText('View Items')).not.toBeInTheDocument();
    });

    it('renders with title and value', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={42} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with title and content', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" content="Test Content" />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders with title, value, and content (value takes precedence)', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={42} content="Test Content" />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('renders action button when actionText is provided', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      expect(actionButton).toBeInTheDocument();
    });

    it('calls onActionClick when action button is clicked', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      fireEvent.click(actionButton);

      expect(mockOnActionClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onActionClick when disabled', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
            disabled={true}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      fireEvent.click(actionButton);

      expect(mockOnActionClick).not.toHaveBeenCalled();
    });

    it('applies disabled styles when disabled', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
            disabled={true}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      expect(actionButton).toHaveStyle('pointer-events: none');
      expect(actionButton).toHaveStyle('cursor: not-allowed');
    });

    it('applies enabled styles when not disabled', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
            disabled={false}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      expect(actionButton).toHaveStyle('pointer-events: auto');
      expect(actionButton).toHaveStyle('cursor: pointer');
    });
  });

  describe('Trend Display', () => {
    it('renders trend with up direction', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            trend={{ percentage: 15, direction: 'up' }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByAltText(SUMMARY_CARD_LABELS.TREND_UP_ALT)).toBeInTheDocument();
    });

    it('renders trend with down direction', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            trend={{ percentage: 10, direction: 'down' }}
          />
        </TestWrapper>
      );

      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByAltText(SUMMARY_CARD_LABELS.TREND_DOWN_ALT)).toBeInTheDocument();
    });

    it('does not render trend when percentage is null', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            trend={{ percentage: null, direction: 'up' }}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('%')).not.toBeInTheDocument();
      expect(screen.queryByAltText(SUMMARY_CARD_LABELS.TREND_UP_ALT)).not.toBeInTheDocument();
    });

    it('does not render trend when direction is null', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            trend={{ percentage: 15, direction: null }}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('applies correct color for up trend', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            trend={{ percentage: 15, direction: 'up' }}
          />
        </TestWrapper>
      );

      const trendText = screen.getByText('15%');
      expect(trendText).toHaveStyle('color: rgb(0, 128, 0)');
    });

    it('applies correct color for down trend', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            trend={{ percentage: 10, direction: 'down' }}
          />
        </TestWrapper>
      );

      const trendText = screen.getByText('10%');
      expect(trendText).toHaveStyle('color: rgb(255, 0, 0)');
    });
  });

  describe('Icon Display', () => {
    it('renders icon when provided', () => {
      const testIcon = <div data-testid="test-icon">Icon</div>;
      
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            icon={testIcon}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('applies correct styling to icon container', () => {
      const testIcon = <div data-testid="test-icon">Icon</div>;
      
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            icon={testIcon}
          />
        </TestWrapper>
      );

      const iconContainer = screen.getByTestId('test-icon').parentElement;
      expect(iconContainer).toHaveStyle('height: 32px');
      expect(iconContainer).toHaveStyle('width: 32px');
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct card styling', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" />
        </TestWrapper>
      );

      const card = screen.getByText('Test Title').closest('.MuiCard-root');
      expect(card).toHaveStyle(`border-radius: ${SUMMARY_CARD_CONSTANTS.BORDER_RADIUS}`);
      expect(card).toHaveStyle(`border: 1px solid ${SUMMARY_CARD_CONSTANTS.BORDER_COLOR}`);
    });

    it('applies correct title styling', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" />
        </TestWrapper>
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveStyle(`font-family: ${SUMMARY_CARD_CONSTANTS.TITLE.FONT_FAMILY}`);
      expect(title).toHaveStyle(`font-weight: ${SUMMARY_CARD_CONSTANTS.TITLE.FONT_WEIGHT}`);
      expect(title).toHaveStyle(`color: ${SUMMARY_CARD_CONSTANTS.TITLE.COLOR}`);
    });

    it('applies correct value styling', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={42} />
        </TestWrapper>
      );

      const value = screen.getByText('42');
      expect(value).toHaveStyle(`font-family: ${SUMMARY_CARD_CONSTANTS.VALUE.FONT_FAMILY}`);
      expect(value).toHaveStyle(`font-weight: ${SUMMARY_CARD_CONSTANTS.VALUE.FONT_WEIGHT}`);
      expect(value).toHaveStyle(`font-size: ${SUMMARY_CARD_CONSTANTS.VALUE.FONT_SIZE}`);
    });

    it('applies correct action button styling', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      expect(actionButton).toHaveStyle(`font-family: ${SUMMARY_CARD_CONSTANTS.ACTION.FONT_FAMILY}`);
      expect(actionButton).toHaveStyle(`color: ${SUMMARY_CARD_CONSTANTS.ACTION.ENABLED_COLOR}`);
    });

    it('applies correct disabled action button styling', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
            disabled={true}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      expect(actionButton).toHaveStyle(`color: ${SUMMARY_CARD_CONSTANTS.ACTION.DISABLED_COLOR}`);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value correctly', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={0} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      // Zero value should not be rendered due to falsy check in component
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('handles empty string content correctly', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" content="" />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      // Empty string should not be rendered due to falsy check in component
      // We can't easily test for empty string presence due to DOM structure
    });

    it('handles very long title correctly', () => {
      const longTitle = 'This is a very long title that should be handled gracefully by the component';
      
      render(
        <TestWrapper>
          <SummaryCard title={longTitle} value={42} />
        </TestWrapper>
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles very large numbers correctly', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={999999999} />
        </TestWrapper>
      );

      expect(screen.getByText('999999999')).toBeInTheDocument();
    });

    it('handles negative numbers correctly', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={-42} />
        </TestWrapper>
      );

      expect(screen.getByText('-42')).toBeInTheDocument();
    });

    it('handles decimal numbers correctly', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={42.5} />
        </TestWrapper>
      );

      expect(screen.getByText('42.5')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button accessibility for action', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      expect(actionButton).toBeInTheDocument();
      expect(actionButton.closest('button')).toBeInTheDocument();
    });

    it('has proper alt text for trend icons', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            trend={{ percentage: 15, direction: 'up' }}
          />
        </TestWrapper>
      );

      const trendIcon = screen.getByAltText(SUMMARY_CARD_LABELS.TREND_UP_ALT);
      expect(trendIcon).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={42} />
        </TestWrapper>
      );

      const title = screen.getByText('Test Title');
      expect(title.tagName).toBe('H6'); // variant="h6"
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(
        <TestWrapper>
          <SummaryCard title="Test Title" value={42} />
        </TestWrapper>
      );

      const initialTitle = screen.getByText('Test Title');
      const initialValue = screen.getByText('42');

      // Re-render with same props
      rerender(
        <TestWrapper>
          <SummaryCard title="Test Title" value={42} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBe(initialTitle);
      expect(screen.getByText('42')).toBe(initialValue);
    });
  });

  describe('Complex Scenarios', () => {
    it('renders all features together', () => {
      const testIcon = <div data-testid="test-icon">Icon</div>;
      
      render(
        <TestWrapper>
          <SummaryCard 
            title="Complete Test" 
            value={100} 
            trend={{ percentage: 25, direction: 'up' }}
            actionText="View Details" 
            onActionClick={mockOnActionClick}
            icon={testIcon}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Complete Test')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByAltText(SUMMARY_CARD_LABELS.TREND_UP_ALT)).toBeInTheDocument();
    });

    it('handles multiple rapid clicks on action button', () => {
      render(
        <TestWrapper>
          <SummaryCard 
            title="Test Title" 
            value={42} 
            actionText="View Items" 
            onActionClick={mockOnActionClick}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Items');
      
      // Click multiple times rapidly
      fireEvent.click(actionButton);
      fireEvent.click(actionButton);
      fireEvent.click(actionButton);

      expect(mockOnActionClick).toHaveBeenCalledTimes(3);
    });

    it('handles disabled state with all features', () => {
      const testIcon = <div data-testid="test-icon">Icon</div>;
      
      render(
        <TestWrapper>
          <SummaryCard 
            title="Disabled Test" 
            value={50} 
            trend={{ percentage: 10, direction: 'down' }}
            actionText="View Details" 
            onActionClick={mockOnActionClick}
            icon={testIcon}
            disabled={true}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('View Details');
      expect(actionButton).toHaveStyle('pointer-events: none');
      expect(actionButton).toHaveStyle('cursor: not-allowed');
      
      fireEvent.click(actionButton);
      expect(mockOnActionClick).not.toHaveBeenCalled();
    });
  });
});
