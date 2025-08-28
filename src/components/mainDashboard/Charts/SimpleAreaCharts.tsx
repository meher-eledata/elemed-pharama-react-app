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
        <Typography color="error">
          Failed to load chart data.
        </Typography>
      </Box>
    );
  }

  if (!kpis) {
    return null;
  }

  const formatDateForFile = (dateStr: string | null) => {
    if (!dateStr) return "NA";
    const date = new Date(dateStr);
    return date
      .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
      .replace(/ /g, "-");
  };

  const fileDuration = `${formatDateForFile(dateRange.startDate)}_to_${formatDateForFile(dateRange.endDate)}`;

  const prepareChartProps = (
    title: string,
    dataKey: keyof InvoiceKpisData,
    totalKey: keyof InvoiceKpisData,
    totalPrefix = ''
  ) => {
    const dailyData = kpis[dataKey] as DailyData[];

    const filteredData = dailyData.filter((item) => {
      const itemDate = new Date(item.date);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      return (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
    });

    const xAxis = filteredData.map((item: DailyData) =>
      new Date(item.date).toISOString()
    );

    const seriesData = filteredData.map((item: DailyData) => item.amount || item.count || 0);

    const maxDataValue = Math.max(...seriesData);
    const minDataValue = Math.min(...seriesData);

    const numberOfTicks = 5;

    // Set the y-axis minimum to 0 to ensure the zero line is always visible.
    const yAxisMin = 0;

    // Calculate the increment from the true minimum (0) to the maximum data value.
    const increment = (maxDataValue - yAxisMin) / (numberOfTicks - 1);

    const tickInterval = Array.from({ length: numberOfTicks }, (_, i) => {
      // Generate ticks starting from 0.
      return yAxisMin + i * increment;
    });

    return {
      title,
      metric: `${totalPrefix}${kpis[totalKey]}`,
      chartData: {
        xAxis,
        series1: seriesData,
        series2: seriesData,
      },
      yAxisConfig: {
        min: yAxisMin,
        max: maxDataValue,
        tickInterval: tickInterval,
      },
    };
  };
   // This is the function you need to use

  const getCsvData = (data: DailyData[], valueKey: 'amount' | 'count', header: string) => {
    const filteredForCsv = data.filter((item) => {
      const itemDate = new Date(item.date);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
      return (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
    });

    return filteredForCsv.map((item) => ({
      Date: new Date(item.date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      [header]: item[valueKey] || 0,
    }));
  };

  const revenueProps = prepareChartProps("Revenue", "revenueByDay", "totalRevenue", '$');
  const salesProps = prepareChartProps("Sales", "salesByDay", "totalSales");
  const patientsProps = prepareChartProps("Patients", "uniquePatientsByDay", "uniquePatients");

  return (
    <Box sx={{ p: 0, width: '100%' }}>
      <Typography sx={{ fontFamily: 'lexend', fontWeight: '600', mb: '12px', mt: '12px' }}>
        Sales Contracts
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} flexWrap="wrap" justifyContent="center">
        <ChartCard
          {...patientsProps}
          colors={{
            main: '#6A8EFF',
            area: '#CEDEFF',
            percentBg: '#F0FDF4',
            percentText: '#22C55E',
          }}
          csvData={getCsvData(kpis.uniquePatientsByDay, 'count', 'Unique Patients')}
          filename={`unique_patients_report_${fileDuration}.csv`}
        />
        <ChartCard
          {...revenueProps}
          colors={{
            main: '#FF6AA6',
            area: '#FFCEE6',
            percentBg: '#F0FDF4',
            percentText: '#22C55E',
          }}
          csvData={getCsvData(kpis.revenueByDay, 'amount', 'Total Revenue')}
          filename={`total_revenue_report_${fileDuration}.csv`}
        />
        <ChartCard
          {...salesProps}
          colors={{
            main: '#6AFF9E',
            area: '#CEFFEE',
            percentBg: '#F0FDF4',
            percentText: '#22C55E',
          }}
          csvData={getCsvData(kpis.salesByDay, 'count', 'Total Sales')}
          filename={`total_sales_report_${fileDuration}.csv`}
        />
      </Stack>
    </Box>
  );
};

export default ThreeChartsComponent;

// import * as React from 'react';
// import { Box, Stack, Grid, Typography, Skeleton } from '@mui/material';
// import ChartCard from './ChartsCard';
// import { useGetInvoiceKpisQuery } from '../../../redux/slices/dashboardApi';

// interface DailyData {
//   date: string;
//   amount?: number;
//   count?: number;
// }

// interface InvoiceKpisData {
//   startDate: string;
//   endDate: string;
//   dateField: string;
//   totalRevenue: number;
//   totalSales: number;
//   uniquePatients: number;
//   revenueByDay: DailyData[];
//   salesByDay: DailyData[];
//   uniquePatientsByDay: DailyData[];
// }

// interface ThreeChartsComponentProps {
//   dateRange: {
//     startDate: string | null;
//     endDate: string | null;
//   };
// }

// const ThreeChartsComponent: React.FC<ThreeChartsComponentProps> = ({ dateRange }) => {
//   const { data: kpis, isLoading, error } = useGetInvoiceKpisQuery(dateRange);

//   if (isLoading) {
//     return (
//       <Grid container spacing={4} mt={1}>
//         {[1, 2, 3].map((i) => (
//           <Grid item xs={12} md={4} key={i}>
//             <Skeleton variant="rectangular" height={300} />
//           </Grid>
//         ))}
//       </Grid>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ p: 2, textAlign: 'center' }}>
//         <Typography color="error">
//           Failed to load chart data.
//         </Typography>
//       </Box>
//     );
//   }

//   if (!kpis) {
//     return null;
//   }

//   const formatDateForFile = (dateStr: string | null) => {
//     if (!dateStr) return "NA";
//     const date = new Date(dateStr);
//     return date
//       .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
//       .replace(/ /g, "-");
//   };

//   const fileDuration = `${formatDateForFile(dateRange.startDate)}_to_${formatDateForFile(dateRange.endDate)}`;

//   const prepareChartProps = (
//     title: string,
//     dataKey: keyof InvoiceKpisData,
//     totalKey: keyof InvoiceKpisData,
//     totalPrefix = ''
//   ) => {
//     const dailyData = kpis[dataKey] as DailyData[];

//     const filteredData = dailyData.filter((item) => {
//       const itemDate = new Date(item.date);
//       const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
//       const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

//       return (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
//     });

//     const allDates = filteredData.map((item) => new Date(item.date));
//     const seriesDataMap = new Map(
//       filteredData.map((item) => [item.date, item.amount || item.count || 0])
//     );

//     if (allDates.length === 0) {
//       return {
//         title,
//         metric: `${totalPrefix}${kpis[totalKey]}`,
//         chartData: {
//           xAxis: [],
//           series1: [],
//           series2: [],
//         },
//         yAxisConfig: {
//           min: 0,
//           max: 10,
//           tickInterval: [0, 2.5, 5, 7.5, 10],
//         },
//       };
//     }

//     const firstDate = new Date(Math.min(...allDates.map((date) => date.getTime())));
//     const lastDate = new Date(Math.max(...allDates.map((date) => date.getTime())));

//     const dynamicDates = [];
//     const oneDay = 24 * 60 * 60 * 1000;
//     const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / oneDay);
//     const interval = Math.floor(totalDays / 4);

//     for (let i = 0; i < 5; i++) {
//       const newDate = new Date(firstDate.getTime() + i * interval * oneDay);
//       dynamicDates.push(newDate.toISOString().split('T')[0]);
//     }

//     const sampledSeriesData = dynamicDates.map((dateStr) => {
//       const originalDate = filteredData.find((d) => d.date.startsWith(dateStr));
//       return originalDate ? originalDate.amount || originalDate.count || 0 : 0;
//     });

//     const maxDataValue = sampledSeriesData.length > 0 ? Math.max(...sampledSeriesData) : 0;
//     const yAxisMin = 0;
//     const numberOfTicks = 5;
//     const increment = (maxDataValue - yAxisMin) / (numberOfTicks - 1) || 10 / (numberOfTicks - 1);
//     const tickInterval = Array.from({ length: numberOfTicks }, (_, i) => {
//       return yAxisMin + i * increment;
//     });

//     return {
//       title,
//       metric: `${totalPrefix}${kpis[totalKey]}`,
//       chartData: {
//         xAxis: dynamicDates,
//         series1: sampledSeriesData,
//         series2: sampledSeriesData,
//       },
//       yAxisConfig: {
//         min: yAxisMin,
//         max: maxDataValue,
//         tickInterval: tickInterval,
//       },
//     };
//   };

//   const getCsvData = (data: DailyData[], valueKey: 'amount' | 'count', header: string) => {
//     const filteredForCsv = data.filter((item) => {
//       const itemDate = new Date(item.date);
//       const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
//       const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
//       return (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
//     });

//     return filteredForCsv.map((item) => ({
//       Date: new Date(item.date).toLocaleDateString('en-US', {
//         day: 'numeric',
//         month: 'short',
//         year: 'numeric',
//       }),
//       [header]: item[valueKey] || 0,
//     }));
//   };

//   const revenueProps = prepareChartProps("Revenue", "revenueByDay", "totalRevenue", '$');
//   const salesProps = prepareChartProps("Sales", "salesByDay", "totalSales");
//   const patientsProps = prepareChartProps("Patients", "uniquePatientsByDay", "uniquePatients");

//   return (
//     <Box sx={{ p: 0, width: '100%' }}>
//       <Typography sx={{ fontFamily: 'lexend', fontWeight: '600', mb: '12px', mt: '12px' }}>
//         Sales Contracts
//       </Typography>
//       <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} flexWrap="wrap" justifyContent="center">
//         <ChartCard
//           {...patientsProps}
//           colors={{
//             main: '#6A8EFF',
//             area: '#CEDEFF',
//             percentBg: '#F0FDF4',
//             percentText: '#22C55E',
//           }}
//           csvData={getCsvData(kpis.uniquePatientsByDay, 'count', 'Unique Patients')}
//           filename={`unique_patients_report_${fileDuration}.csv`}
//         />
//         <ChartCard
//           {...revenueProps}
//           colors={{
//             main: '#FF6AA6',
//             area: '#FFCEE6',
//             percentBg: '#F0FDF4',
//             percentText: '#22C55E',
//           }}
//           csvData={getCsvData(kpis.revenueByDay, 'amount', 'Total Revenue')}
//           filename={`total_revenue_report_${fileDuration}.csv`}
//         />
//         <ChartCard
//           {...salesProps}
//           colors={{
//             main: '#6AFF9E',
//             area: '#CEFFEE',
//             percentBg: '#F0FDF4',
//             percentText: '#22C55E',
//           }}
//           csvData={getCsvData(kpis.salesByDay, 'count', 'Total Sales')}
//           filename={`total_sales_report_${fileDuration}.csv`}
//         />
//       </Stack>
//     </Box>
//   );
// };

// export default ThreeChartsComponent;