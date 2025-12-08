global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartCard from '../../../components/mainDashboard/Charts/ChartsCard';
import { CSVLink } from 'react-csv';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// Mock the CSVLink component correctly by explicitly typing props as 'any'
jest.mock('react-csv', () => ({
  CSVLink: React.forwardRef((props: any, ref) => {
    const { data, filename, children } = props;
    
    React.useImperativeHandle(ref, () => ({
      link: {
        click: jest.fn(),
      },
    }));
    return (
      <div data-testid="mock-csv-link" data-filename={filename} data-data={JSON.stringify(data)}>
        {children}
      </div>
    );
  }),
}));

// Define mock props for the component
const mockProps = {
  title: 'Test Title',
  metric: '100',
  chartData: {
    xAxis: ['2025-01-01', '2025-01-02'],
    series1: [10, 20],
    series2: [], // Required by ChartData type
  },
  colors: { main: '#000', area: '#ccc', percentBg: '#eee', percentText: '#111' },
  yAxisConfig: {
    min: 0,
    max: 50,
    tickInterval: [10], // Required by YAxisConfig type
  },
  csvData: [{ date: '2025-01-01', value: 10 }],
  filename: 'test_report.csv',
};

describe('ChartsCard', () => {
  // Test Case 1: Renders correctly with given props
  it('renders the title, metric, and download button', () => {
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...mockProps} />
      </ThemeProvider>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/download report/i)).toBeInTheDocument();
    expect(screen.getByLabelText('download')).toBeInTheDocument();
  });

  // Test Case 2: Handles the download button click
  it('triggers a download when the download button is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...mockProps} />
      </ThemeProvider>
    );
    const downloadButton = screen.getByLabelText('download');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      const mockCsvLink = screen.getByTestId('mock-csv-link');
      expect(mockCsvLink).toHaveAttribute('data-filename', mockProps.filename);
      expect(mockCsvLink).toHaveAttribute('data-data', JSON.stringify(mockProps.csvData));
    });
  });

  // Test Case 3: Renders with different metric formats
  it('renders metric with currency symbol', () => {
    const currencyProps = {
      ...mockProps,
      metric: '₹50,000',
    };
    
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...currencyProps} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('₹50,000')).toBeInTheDocument();
  });

  it('handles empty chart data gracefully', () => {
    const emptyDataProps = {
      ...mockProps,
      chartData: {
        xAxis: [],
        series1: [],
        series2: [],
      },
    };
    
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...emptyDataProps} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  // Test Case 5: Handles large datasets
  it('handles large datasets efficiently', () => {
    const largeDataProps = {
      ...mockProps,
      chartData: {
        xAxis: Array.from({ length: 100 }, (_, i) => `2025-01-${i + 1}`),
        series1: Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000)),
        series2: [],
      },
    };
    
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...largeDataProps} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  // Test Case 6: Applies correct styling
  it('applies correct card styling', () => {
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...mockProps} />
      </ThemeProvider>
    );
    
    const card = screen.getByText('Test Title').closest('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  // Test Case 7: Handles different color schemes
  it('renders with different color schemes', () => {
    const colorProps = {
      ...mockProps,
      colors: {
        main: '#FF0000',
        area: '#FFCCCC',
        percentBg: '#FFFFFF',
        percentText: '#000000',
      },
    };
    
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...colorProps} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  // Test Case 8: Handles CSV data with different structures
  it('handles CSV data with different structures', () => {
    const csvProps = {
      ...mockProps,
      csvData: [
        { Date: '2025-01-01', Revenue: 1000, Sales: 50 },
        { Date: '2025-01-02', Revenue: 2000, Sales: 75 },
      ],
    };
    
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...csvProps} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  // Test Case 9: Handles different filename formats
  it('handles different filename formats', () => {
    const filenameProps = {
      ...mockProps,
      filename: 'custom_report_2025.csv',
    };
    
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...filenameProps} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  // Test Case 10: Accessibility
  it('has proper accessibility attributes', () => {
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...mockProps} />
      </ThemeProvider>
    );
    
    const downloadButton = screen.getByLabelText('download');
    expect(downloadButton).toBeInTheDocument();
    
    const downloadIcon = screen.getByAltText('Download');
    expect(downloadIcon).toBeInTheDocument();
  });

  // Test Case 11: Performance with multiple clicks
  it('handles multiple download clicks efficiently', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...mockProps} />
      </ThemeProvider>
    );
    
    const downloadButton = screen.getByLabelText('download');
    
    // Click multiple times rapidly
    fireEvent.click(downloadButton);
    fireEvent.click(downloadButton);
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      const mockCsvLink = screen.getByTestId('mock-csv-link');
      expect(mockCsvLink).toBeInTheDocument();
    });
  });

  // Test Case 12: Edge cases
  it('handles edge cases gracefully', () => {
    const edgeCaseProps = {
      ...mockProps,
      title: '',
      metric: '0',
      chartData: {
        xAxis: ['2025-01-01'],
        series1: [0],
        series2: [],
      },
    };
    
    render(
      <ThemeProvider theme={theme}>
        <ChartCard {...edgeCaseProps} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});