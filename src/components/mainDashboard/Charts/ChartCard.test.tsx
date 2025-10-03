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

describe('ChartCard', () => {
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
});