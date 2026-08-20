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
  /** True for currency series → y-axis / values formatted with ₹ grouping. */
  currency?: boolean;
  /** Axis titles so users can read what each axis represents. */
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const ReportBarChart: React.FC<ReportBarChartProps> = ({
  categories,
  values,
  seriesLabel,
  color = C.CHART.BAR_COLOR,
  emptyMessage,
  currency = false,
  xAxisLabel,
  yAxisLabel,
}) => {
  if (!categories.length) {
    return <ReportEmpty message={emptyMessage} />;
  }

  const maxVal = Math.max(...values, 0);
  const niceMax = maxVal > 0 ? Math.ceil(maxVal * 1.1) : 10;

  const formatValue = (v: number): string =>
    currency
      ? `₹${v.toLocaleString(C.CURRENCY.LOCALE, { maximumFractionDigits: 0 })}`
      : v.toLocaleString(C.CURRENCY.LOCALE, { maximumFractionDigits: 0 });

  // Compact y-axis ticks (₹60K / 6L) — full values would ellipsize inside the
  // fixed tick area at realistic spend ranges. Tooltips keep the full value.
  const formatAxisValue = (v: number): string => {
    const compact = v.toLocaleString(C.CURRENCY.LOCALE, {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return currency ? `₹${compact}` : compact;
  };

  // Angle date/category ticks once they get dense so labels stay readable.
  const angled = categories.length > 6;
  // At wide ranges (e.g. years of daily data) only label every Nth band tick.
  const xTickStep = Math.max(1, Math.ceil(categories.length / C.CHART.MAX_X_TICK_LABELS));
  const axisLabelStyle = {
    fontSize: 13,
    fill: C.COLORS.TEXT_PRIMARY,
    fontFamily: C.FONT_FAMILY,
    fontWeight: 600,
  } as const;
  const margin = {
    ...C.CHART.MARGIN,
    bottom: xAxisLabel ? C.CHART.MARGIN.bottom + 22 : C.CHART.MARGIN.bottom,
    left: yAxisLabel ? C.CHART.MARGIN.left + 20 : C.CHART.MARGIN.left,
  };

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
              label: xAxisLabel,
              labelStyle: axisLabelStyle,
              tickLabelInterval: (_value: unknown, index: number) => index % xTickStep === 0,
              tickLabelStyle: {
                fontSize: C.CHART.TICK_LABEL_FONT_SIZE,
                fill: C.CHART.TICK_LABEL_COLOR,
                fontFamily: C.FONT_FAMILY,
                angle: angled ? -35 : 0,
                textAnchor: angled ? 'end' : 'middle',
              },
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: niceMax,
              label: yAxisLabel,
              labelStyle: axisLabelStyle,
              tickLabelStyle: {
                fontSize: C.CHART.TICK_LABEL_FONT_SIZE,
                fill: C.CHART.TICK_LABEL_COLOR,
                fontFamily: C.FONT_FAMILY,
              },
              valueFormatter: (v: number) => formatAxisValue(v),
            },
          ]}
          series={[{ data: values, label: seriesLabel, color, valueFormatter: (v) => (v == null ? '' : formatValue(v)) }]}
          height={C.CHART.HEIGHT}
          margin={margin}
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
