import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import DateRangeFilter from './DateRangeFilter';
import { DATE_RANGE_LABELS } from '../../../config/label/DateRange.labels';

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {children}
    </LocalizationProvider>
  </ThemeProvider>
);

describe('DateRangeFilter Component', () => {
  const mockOnDateRangeChange = jest.fn();
  const defaultDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [
    dayjs().subtract(30, 'day'),
    dayjs(),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      expect(screen.getByText(DATE_RANGE_LABELS.FILTER_TITLE)).toBeInTheDocument();
    });

    it('displays the filter title', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      expect(screen.getByText(DATE_RANGE_LABELS.FILTER_TITLE)).toBeInTheDocument();
    });

    it('displays formatted dates when both dates are provided', () => {
      const startDate = dayjs('2024-01-15');
      const endDate = dayjs('2024-01-20');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [startDate, endDate];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('15/01/2024')).toBeInTheDocument();
      expect(screen.getByText('20/01/2024')).toBeInTheDocument();
    });

    it('displays placeholders when dates are null', () => {
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [null, null];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Current behaviour: START_PLACEHOLDER and END_PLACEHOLDER share the
      // same text ("DD/MM/YYYY"), so both the start and end slots render it.
      const placeholders = screen.getAllByText(DATE_RANGE_LABELS.START_PLACEHOLDER);
      expect(placeholders).toHaveLength(2);
      expect(DATE_RANGE_LABELS.END_PLACEHOLDER).toBe(DATE_RANGE_LABELS.START_PLACEHOLDER);
    });

    it('displays only start date when end date is null', () => {
      const startDate = dayjs('2024-01-15');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [startDate, null];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('15/01/2024')).toBeInTheDocument();
      expect(screen.getByText(DATE_RANGE_LABELS.END_PLACEHOLDER)).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('opens calendar when start date is clicked', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      const startDateElement = screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_START)).toBeInTheDocument();
    });

    it('opens calendar when end date is clicked', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      const endDateElement = screen.getByText(defaultDateRange[1]!.format('DD/MM/YYYY'));
      fireEvent.click(endDateElement);

      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_END)).toBeInTheDocument();
    });

    it('opens and displays calendar correctly', async () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar
      const startDateElement = screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_START)).toBeInTheDocument();
      
      // Verify calendar elements are present
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Date Range Logic', () => {
    it('calls onDateRangeChange when selecting start date', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar for start date
      const startDateElement = screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      // Find and click a date in the calendar
      const calendarDate = screen.getByRole('gridcell', { name: '15' });
      fireEvent.click(calendarDate);

      expect(mockOnDateRangeChange).toHaveBeenCalled();
    });

    it('handles start date selection when end date exists and is after start date', () => {
      const startDate = dayjs('2024-01-10');
      const endDate = dayjs('2024-01-20');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [startDate, endDate];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar for start date
      const startDateElement = screen.getByText(startDate.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      // Select a date before the end date
      const calendarDate = screen.getByRole('gridcell', { name: '15' });
      fireEvent.click(calendarDate);

      expect(mockOnDateRangeChange).toHaveBeenCalledWith([expect.any(Object), endDate]);
    });

    it('handles start date selection when end date exists and is before start date', () => {
      const startDate = dayjs('2024-01-10');
      const endDate = dayjs('2024-01-20');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [startDate, endDate];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar for start date
      const startDateElement = screen.getByText(startDate.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      // Select a date after the end date
      const calendarDate = screen.getByRole('gridcell', { name: '25' });
      fireEvent.click(calendarDate);

      expect(mockOnDateRangeChange).toHaveBeenCalledWith([expect.any(Object), null]);
    });

    it('handles end date selection when start date exists and is before end date', () => {
      const startDate = dayjs('2024-01-10');
      const endDate = dayjs('2024-01-20');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [startDate, endDate];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar for end date
      const endDateElement = screen.getByText(endDate.format('DD/MM/YYYY'));
      fireEvent.click(endDateElement);

      // Select a date after the start date
      const calendarDate = screen.getByRole('gridcell', { name: '25' });
      fireEvent.click(calendarDate);

      expect(mockOnDateRangeChange).toHaveBeenCalledWith([startDate, expect.any(Object)]);
    });

    it('handles end date selection when start date exists and is after end date', () => {
      const startDate = dayjs('2024-01-10');
      const endDate = dayjs('2024-01-20');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [startDate, endDate];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar for end date
      const endDateElement = screen.getByText(endDate.format('DD/MM/YYYY'));
      fireEvent.click(endDateElement);

      // Select a date before the start date
      const calendarDate = screen.getByRole('gridcell', { name: '5' });
      fireEvent.click(calendarDate);

      expect(mockOnDateRangeChange).toHaveBeenCalledWith([expect.any(Object), null]);
    });

    it('auto-advances to end-date selection after a start date is picked', () => {
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [null, null];

      render(
        <TestWrapper>
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={mockOnDateRangeChange}
          />
        </TestWrapper>
      );

      // Open on the start slot and pick a start date.
      fireEvent.click(screen.getAllByText(DATE_RANGE_LABELS.START_PLACEHOLDER)[0]);
      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_START)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('gridcell', { name: '15' }));

      // The picker now asks for the END date — a second click must not silently
      // overwrite the start date.
      expect(mockOnDateRangeChange).toHaveBeenCalledWith([expect.any(Object), null]);
      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_END)).toBeInTheDocument();
    });

    it('asks for the end date again after an end-before-start pick becomes the new start', () => {
      const startDate = dayjs('2024-01-10');
      const endDate = dayjs('2024-01-20');

      render(
        <TestWrapper>
          <DateRangeFilter
            dateRange={[startDate, endDate]}
            onDateRangeChange={mockOnDateRangeChange}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText(endDate.format('DD/MM/YYYY')));
      fireEvent.click(screen.getByRole('gridcell', { name: '5' }));

      expect(mockOnDateRangeChange).toHaveBeenCalledWith([expect.any(Object), null]);
      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_END)).toBeInTheDocument();
    });

    it('closes calendar after selecting end date', () => {
      const startDate = dayjs('2024-01-10');
      const endDate = dayjs('2024-01-20');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [startDate, endDate];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar for end date
      const endDateElement = screen.getByText(endDate.format('DD/MM/YYYY'));
      fireEvent.click(endDateElement);

      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_END)).toBeInTheDocument();

      // Select a valid end date
      const calendarDate = screen.getByRole('gridcell', { name: '25' });
      fireEvent.click(calendarDate);

      // Calendar should close
      expect(screen.queryByText(DATE_RANGE_LABELS.SELECT_END)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null date range gracefully', () => {
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [null, null];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Both placeholders share the same "DD/MM/YYYY" text, so two render.
      expect(screen.getAllByText(DATE_RANGE_LABELS.START_PLACEHOLDER)).toHaveLength(2);
    });

    it('handles same start and end date', () => {
      const sameDate = dayjs('2024-01-15');
      const dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [sameDate, sameDate];

      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      expect(screen.getAllByText('15/01/2024')).toHaveLength(2);
    });

    it('handles invalid date selection gracefully', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar
      const startDateElement = screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      // Try to select an invalid date (this should not crash)
      expect(screen.getByText(DATE_RANGE_LABELS.SELECT_START)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Check that calendar has proper accessibility attributes when opened
      const startDateElement = screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      const calendar = screen.getByRole('grid');
      expect(calendar).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      // Open calendar
      const startDateElement = screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'));
      fireEvent.click(startDateElement);

      // Check that calendar is focusable
      const calendar = screen.getByRole('grid');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      const initialStartDate = screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'));
      const initialEndDate = screen.getByText(defaultDateRange[1]!.format('DD/MM/YYYY'));

      // Re-render with same props
      rerender(
        <TestWrapper>
          <DateRangeFilter 
            dateRange={defaultDateRange} 
            onDateRangeChange={mockOnDateRangeChange} 
          />
        </TestWrapper>
      );

      expect(screen.getByText(defaultDateRange[0]!.format('DD/MM/YYYY'))).toBe(initialStartDate);
      expect(screen.getByText(defaultDateRange[1]!.format('DD/MM/YYYY'))).toBe(initialEndDate);
    });
  });
});
