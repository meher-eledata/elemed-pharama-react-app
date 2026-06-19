/**
 * Single-series bar chart styled to match the Daily Sales Report weekly-trend
 * BarChart (MUI x-charts). Used by the Supplier Receipt / Payment overview tabs.
 */
import React from 'react';
import { Card, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { ReportEmpty } from './ReportShared';

interface ReportBarChartProps {
  categories: string[];
  values: number[];
  seriesLabel: string;
  color?: string;
  emptyMessage: string;
  /** True for currency series → y-axis formatted with ₹ grouping. */
  currency?: boolean;
}

const ReportBarChart: React.FC<ReportBarChartProps> = ({
  categories,
  values,
  seriesLabel,
  color = C.CHART.BAR_COLOR,
  emptyMessage,
  currency = false,
}) => {
  if (!categories.length) {
    return <ReportEmpty message={emptyMessage} />;
  }

  const maxVal = Math.max(...values, 0);
  const niceMax = maxVal > 0 ? Math.ceil(maxVal * 1.1) : 10;

  return (
    <Card
      sx={{
        p: 3,
        width: '100%',
        borderRadius: C.CARD.BORDER_RADIUS,
        boxShadow: C.CARD.BOX_SHADOW,
        border: C.CARD.BORDER,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', height: C.CHART.CONTAINER_HEIGHT, display: 'flex', justifyContent: 'center' }}>
        <BarChart
          xAxis={[
            {
              data: categories,
              scaleType: 'band',
              tickLabelStyle: {
                fontSize: C.CHART.TICK_LABEL_FONT_SIZE,
                fill: C.CHART.TICK_LABEL_COLOR,
                fontFamily: C.FONT_FAMILY,
                angle: categories.length > 8 ? -35 : 0,
                textAnchor: categories.length > 8 ? 'end' : 'middle',
              },
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: niceMax,
              tickLabelStyle: {
                fontSize: C.CHART.TICK_LABEL_FONT_SIZE,
                fill: C.CHART.TICK_LABEL_COLOR,
                fontFamily: C.FONT_FAMILY,
              },
              valueFormatter: (v: number) =>
                currency
                  ? `₹${v.toLocaleString(C.CURRENCY.LOCALE, { maximumFractionDigits: 0 })}`
                  : v.toLocaleString(C.CURRENCY.LOCALE, { maximumFractionDigits: 0 }),
            },
          ]}
          series={[{ data: values, label: seriesLabel, color }]}
          height={C.CHART.HEIGHT}
          margin={C.CHART.MARGIN}
          grid={{ vertical: false, horizontal: true }}
          sx={{
            '& .MuiChartsAxis-root': { stroke: C.CHART.AXIS_STROKE, strokeWidth: 1 },
            '& .MuiChartsAxis-line': { stroke: C.CHART.AXIS_STROKE, strokeWidth: 1 },
            '& .MuiChartsAxis-tick': { stroke: C.CHART.AXIS_STROKE, strokeWidth: 1 },
            '& .MuiChartsGrid-root': { stroke: C.CHART.GRID_STROKE, strokeDasharray: 'none' },
          }}
        />
      </Box>
    </Card>
  );
};

export default ReportBarChart;
