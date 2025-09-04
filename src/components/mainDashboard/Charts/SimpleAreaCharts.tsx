import * as React from 'react';
import { Box, Stack, Grid, Typography, Skeleton } from '@mui/material';
import ChartCard from './ChartsCard';
import { useGetInvoiceKpisQuery } from '../../../redux/slices/dashboardApi';

interface DailyData {
  date: string;
  amount?: number;
  count?: number;
}

interface InvoiceKpisData {
  startDate: string;
  endDate: string;
  dateField: string;
  totalRevenue: number;
  totalSales: number;
  uniquePatients: number;
  revenueByDay: DailyData[];
  salesByDay: DailyData[];
  uniquePatientsByDay: DailyData[];
}

interface ThreeChartsComponentProps {
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

const ThreeChartsComponent: React.FC<ThreeChartsComponentProps> = ({ dateRange }) => {
  const { data: kpis, isLoading, error } = useGetInvoiceKpisQuery(dateRange);

  if (isLoading) {
    return (
      <Grid container spacing={4} mt={1}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">Failed to load chart data.</Typography>
      </Box>
    );
  }

  if (!kpis) return null;

  const formatDateForFile = (dateStr: string | null) => {
    if (!dateStr) return 'NA';
    const date = new Date(dateStr);
    return date
      .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-');
  };

  const fileDuration = `${formatDateForFile(dateRange.startDate)}_to_${formatDateForFile(
    dateRange.endDate
  )}`;

  const prepareChartProps = (
    title: string,
    dataKey: keyof InvoiceKpisData,
    totalKey: keyof InvoiceKpisData,
    totalPrefix = ''
  ) => {
    const dailyData = (kpis[dataKey] as DailyData[]) ?? [];

    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

    const filteredData = dailyData
      .filter((item) => {
        const d = new Date(item.date);
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const seriesData = filteredData.map((d) => d.amount ?? d.count ?? 0);

    const xAxisDates = filteredData.map((d) => new Date(d.date).toISOString());

    const maxVal = Math.max(0, ...seriesData);
    const safeMax = maxVal <= 0 ? 1 : maxVal; 
    const ticks = 5;
    const inc = safeMax / (ticks - 1);
    const tickInterval = Array.from({ length: ticks }, (_, i) => +(i * inc).toFixed(2));

    return {
      title,
      metric: `${totalPrefix}${kpis[totalKey]}`,
      chartData: {
        xAxis: xAxisDates,
        series1: seriesData,
        series2: seriesData,
      },
      yAxisConfig: {
        min: 0,
        max: safeMax,
        tickInterval,
      },
    };
  };

  const getCsvData = (data: DailyData[], valueKey: 'amount' | 'count', header: string) => {
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

    return data
      .filter((item) => {
        const d = new Date(item.date);
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => ({
        Date: new Date(item.date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        [header]: item[valueKey] ?? 0,
      }));
  };

  const revenueProps = prepareChartProps('Revenue', 'revenueByDay', 'totalRevenue', '$');
  const salesProps = prepareChartProps('Sales', 'salesByDay', 'totalSales');
  const patientsProps = prepareChartProps('Patients', 'uniquePatientsByDay', 'uniquePatients');

  return (
    <Box sx={{ p: 0, width: '100%' }}>
      <Typography sx={{ fontFamily: 'lexend', fontWeight: 600, mb: '12px', mt: '12px' }}>
        Sales Contracts
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} flexWrap="wrap" justifyContent="flex-start" alignItems="stretch">
        <ChartCard
          {...patientsProps}
          colors={{ main: '#6A8EFF', area: '#CEDEFF', percentBg: '#F0FDF4', percentText: '#22C55E' }}
          csvData={getCsvData(kpis.uniquePatientsByDay, 'count', 'Unique Patients')}
          filename={`unique_patients_report_${fileDuration}.csv`}
        />
        <ChartCard
          {...revenueProps}
          colors={{ main: '#FF6AA6', area: '#FFCEE6', percentBg: '#F0FDF4', percentText: '#22C55E' }}
          csvData={getCsvData(kpis.revenueByDay, 'amount', 'Total Revenue')}
          filename={`total_revenue_report_${fileDuration}.csv`}
        />
        <ChartCard
          {...salesProps}
          colors={{ main: '#6AFF9E', area: '#CEFFEE', percentBg: '#F0FDF4', percentText: '#22C55E' }}
          csvData={getCsvData(kpis.salesByDay, 'count', 'Total Sales')}
          filename={`total_sales_report_${fileDuration}.csv`}
        />
      </Stack>
    </Box>
  );
};

export default ThreeChartsComponent;




