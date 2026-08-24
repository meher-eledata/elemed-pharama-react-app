import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportBarChart from '../ReportBarChart';

// Capture the props handed to the underlying MUI x-charts BarChart so axis
// bounds can be asserted without rendering SVG chart internals in jsdom.
let barChartProps: any;
jest.mock('@mui/x-charts/BarChart', () => ({
  __esModule: true,
  BarChart: (props: any) => {
    barChartProps = props;
    return <div data-testid="bar-chart" />;
  },
}));

const renderChart = (values: number[]) =>
  render(
    <ReportBarChart
      categories={values.map((_, i) => `c${i}`)}
      values={values}
      seriesLabel="Sales (₹)"
      emptyMessage="No data for the selected period."
      currency
    />
  );

beforeEach(() => {
  barChartProps = undefined;
});

describe('ReportBarChart y-axis bounds', () => {
  it('keeps a 0 floor for non-negative series', () => {
    renderChart([10, 50]);
    expect(barChartProps.yAxis[0].min).toBe(0);
    // Padded ~10% above the max value (exact integer varies with FP rounding).
    expect(barChartProps.yAxis[0].max).toBeGreaterThanOrEqual(55);
    expect(barChartProps.yAxis[0].max).toBeLessThanOrEqual(60);
  });

  it('drops the floor below zero for net series with heavy-return days', () => {
    renderChart([-100, 50]);
    // Floor sits below the most negative value so the bar renders fully.
    expect(barChartProps.yAxis[0].min).toBeLessThanOrEqual(-110);
    expect(barChartProps.yAxis[0].min).toBeGreaterThanOrEqual(-120);
    expect(barChartProps.yAxis[0].max).toBeGreaterThanOrEqual(55);
  });

  it('renders an all-negative range with a negative floor and default max', () => {
    renderChart([-20, -5]);
    expect(barChartProps.yAxis[0].min).toBeLessThanOrEqual(-22);
    expect(barChartProps.yAxis[0].min).toBeGreaterThanOrEqual(-25);
    expect(barChartProps.yAxis[0].max).toBe(10); // default niceMax when no positive value
  });

  it('shows the shared empty state when there are no categories', () => {
    render(
      <ReportBarChart
        categories={[]}
        values={[]}
        seriesLabel="Sales (₹)"
        emptyMessage="No data for the selected period."
      />
    );
    expect(screen.getByText('No data for the selected period.')).toBeInTheDocument();
    expect(barChartProps).toBeUndefined();
  });
});
