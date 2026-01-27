import * as React from 'react';
import { Box, Stack, Grid, Typography, Skeleton } from '@mui/material';
import ChartCard from './ChartsCard';
import { useGetInvoiceKpisQuery } from '../../../redux/slices/dashboardApi';
import { DASHBOARD_LABELS } from '../../../config/label/SimpleAreaChart.label';
import { DASHBOARD_CONSTANTS } from '../../../config/constants/SimpleAreaChart.constants';

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
  const { data: kpis, isLoading, error } = useGetInvoiceKpisQuery({
    startDate: dateRange.startDate || '',
    endDate: dateRange.endDate || '',
  }, {
    refetchOnMountOrArgChange: true
  });

  if (isLoading) {
    return (
      <Grid container spacing={4} mt={1}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Skeleton variant="rectangular" height={DASHBOARD_CONSTANTS.CHART_HEIGHT} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{DASHBOARD_LABELS.ERROR_LOADING}</Typography>
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
  )}` || DASHBOARD_CONSTANTS.DEFAULT_FILE_DURATION;

  const prepareChartProps = (
    title: string,
    dataKey: keyof InvoiceKpisData,
    totalKey: keyof InvoiceKpisData,
    totalPrefix = ''
  ) => {
    const dailyData = (kpis[dataKey] as DailyData[]) ?? [];

    if (!Array.isArray(dailyData)) {
      return {
        title,
        metric: `${totalPrefix}0`,
        chartData: {
          xAxis: [],
          series1: [],
          series2: [],
        },
        yAxisConfig: {
          min: 0,
          max: 1,
          tickInterval: [0, 1],
        },
      };
    }

    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

    const filteredData = dailyData
      .filter((item) => {
        if (!item || !item.date) return false;
        const d = new Date(item.date);
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const seriesData = filteredData.map((d) => Number(d.amount ?? d.count ?? 0));
    const xAxisDates = filteredData.map((d) => new Date(d.date).toISOString());

    const totalValue = seriesData.reduce((acc, val) => acc + val, 0);

    const maxVal = Math.max(0, ...seriesData);
    const safeMax = maxVal <= 0 ? 1 : maxVal;
    const ticks = DASHBOARD_CONSTANTS.Y_AXIS_TICKS;
    const inc = safeMax / (ticks - 1);
    const tickInterval = Array.from({ length: ticks }, (_, i) => +(i * inc).toFixed(2));

    const isRevenue = totalPrefix === '₹';
    const formattedValue = isRevenue
      ? totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : totalValue.toLocaleString('en-IN');

    return {
      title,
      metric: `${totalPrefix}${formattedValue}`,
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
    // Add safety check for undefined data
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

    return data
      .filter((item) => {
        if (!item || !item.date) return false;
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

  const revenueProps = prepareChartProps(DASHBOARD_LABELS.CHART_REVENUE, 'revenueByDay', 'totalRevenue', '₹');
  const salesProps = prepareChartProps(DASHBOARD_LABELS.CHART_SALES, 'salesByDay', 'totalSales');
  const patientsProps = prepareChartProps(DASHBOARD_LABELS.CHART_PATIENTS, 'uniquePatientsByDay', 'uniquePatients');

  return (
    <Box sx={{ p: 0, width: '100%' }}>
      <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 600, mb: '12px', mt: '28px' }}>
        {DASHBOARD_LABELS.SALES_CONTRACTS_TITLE}
      </Typography>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={4}
        flexWrap="wrap"
        justifyContent={{ xs: 'stretch', md: 'flex-start' }}
        alignItems={{ xs: 'stretch', md: 'stretch' }}
      >
        <ChartCard
          {...patientsProps}
          colors={{ main: '#6A8EFF', area: '#CEDEFF', percentBg: '#F0FDF4', percentText: '#22C55E' }}
          csvData={getCsvData(kpis?.uniquePatientsByDay || [], 'count', DASHBOARD_LABELS.CSV_UNIQUE_PATIENTS)}
          filename={`unique_patients_report_${fileDuration}.csv`}
        />
        <ChartCard
          {...revenueProps}
          colors={{ main: '#FF6AA6', area: '#FFCEE6', percentBg: '#F0FDF4', percentText: '#22C55E' }}
          csvData={getCsvData(kpis?.revenueByDay || [], 'amount', DASHBOARD_LABELS.CSV_TOTAL_REVENUE)}
          filename={`total_revenue_report_${fileDuration}.csv`}
        />
        <ChartCard
          {...salesProps}
          colors={{ main: '#6AFF9E', area: '#CEFFEE', percentBg: '#F0FDF4', percentText: '#22C55E' }}
          csvData={getCsvData(kpis?.salesByDay || [], 'count', DASHBOARD_LABELS.CSV_TOTAL_SALES)}
          filename={`total_sales_report_${fileDuration}.csv`}
        />
      </Stack>
    </Box>
  );
};

const arePropsEqual = (prevProps: ThreeChartsComponentProps, nextProps: ThreeChartsComponentProps) => {
  return (
    prevProps.dateRange.startDate === nextProps.dateRange.startDate &&
    prevProps.dateRange.endDate === nextProps.dateRange.endDate
  );
};

const MemoizedThreeChartsComponent = React.memo(ThreeChartsComponent, arePropsEqual);
MemoizedThreeChartsComponent.displayName = 'ThreeChartsComponent';

export default MemoizedThreeChartsComponent;


