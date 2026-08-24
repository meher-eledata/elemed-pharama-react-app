import { seriesByDate, topNSeries, isReturnRow } from '../reportFormat';

interface Row {
  date: string;
  label: string;
  value: number;
}

const row = (date: string, value: number, label = ''): Row => ({ date, label, value });

describe('seriesByDate — per-day aggregation for the overview charts', () => {
  it('sorts mixed-order date rows ascending by date', () => {
    const rows = [row('2026-08-03', 30), row('2026-08-01', 10), row('2026-08-02', 20)];
    const series = seriesByDate(rows, (r) => r.date, (r) => r.value);
    expect(series.categories).toEqual(['01/08/2026', '02/08/2026', '03/08/2026']);
    expect(series.values).toEqual([10, 20, 30]);
  });

  it('sums multiple rows falling on the same date', () => {
    const rows = [row('2026-08-01', 10), row('2026-08-01', 15.5), row('2026-08-02', 5)];
    const series = seriesByDate(rows, (r) => r.date, (r) => r.value);
    expect(series.categories).toEqual(['01/08/2026', '02/08/2026']);
    expect(series.values).toEqual([25.5, 5]);
  });

  it('skips rows whose date key is null or empty', () => {
    const rows = [
      { date: '', value: 100 },
      { date: null as unknown as string, value: 200 },
      { date: '2026-08-01', value: 7 },
    ];
    const series = seriesByDate(rows, (r) => r.date, (r) => r.value);
    expect(series.categories).toEqual(['01/08/2026']);
    expect(series.values).toEqual([7]);
  });

  it('formats categories via formatReportDate (YYYY-MM-DD → DD/MM/YYYY)', () => {
    const series = seriesByDate([row('2026-01-09', 1)], (r) => r.date, (r) => r.value);
    expect(series.categories).toEqual(['09/01/2026']);
  });

  it('returns empty series for no rows', () => {
    const series = seriesByDate([] as Row[], (r) => r.date, (r) => r.value);
    expect(series).toEqual({ categories: [], values: [] });
  });
});

describe('topNSeries — per-label top-N aggregation', () => {
  it('sums values per label', () => {
    const rows = [row('', 10, 'A'), row('', 5, 'B'), row('', 2.5, 'A')];
    const series = topNSeries(rows, (r) => r.label, (r) => r.value, 10);
    expect(series.categories).toEqual(['A', 'B']);
    expect(series.values).toEqual([12.5, 5]);
  });

  it('orders labels by summed value descending', () => {
    const rows = [row('', 1, 'low'), row('', 100, 'high'), row('', 50, 'mid')];
    const series = topNSeries(rows, (r) => r.label, (r) => r.value, 10);
    expect(series.categories).toEqual(['high', 'mid', 'low']);
    expect(series.values).toEqual([100, 50, 1]);
  });

  it('truncates to the requested N after sorting', () => {
    const rows = [row('', 4, 'd'), row('', 9, 'a'), row('', 6, 'c'), row('', 8, 'b')];
    const series = topNSeries(rows, (r) => r.label, (r) => r.value, 2);
    expect(series.categories).toEqual(['a', 'b']);
    expect(series.values).toEqual([9, 8]);
  });

  it('defaults N to CHART.TOP_N (10) when omitted', () => {
    // 12 distinct labels with descending values 12..1 — only the top 10 survive.
    const rows = Array.from({ length: 12 }, (_, i) => row('', 12 - i, `label-${i}`));
    const series = topNSeries(rows, (r) => r.label, (r) => r.value);
    expect(series.categories).toHaveLength(10);
    expect(series.values).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
    expect(series.categories[0]).toBe('label-0');
    expect(series.categories[9]).toBe('label-9');
  });

  it('skips rows whose label is empty', () => {
    const rows = [row('', 10, ''), row('', 3, 'A')];
    const series = topNSeries(rows, (r) => r.label, (r) => r.value);
    expect(series.categories).toEqual(['A']);
    expect(series.values).toEqual([3]);
  });
});

describe('isReturnRow — shared daily-sales sign convention', () => {
  it('matches return and refund case/space-insensitively', () => {
    expect(isReturnRow('return')).toBe(true);
    expect(isReturnRow('Refund')).toBe(true);
    expect(isReturnRow(' RETURN ')).toBe(true);
  });

  it('is false for sales, deletions, null and empty', () => {
    expect(isReturnRow('Sale')).toBe(false);
    expect(isReturnRow('deletion')).toBe(false);
    expect(isReturnRow(null)).toBe(false);
    expect(isReturnRow(undefined)).toBe(false);
    expect(isReturnRow('')).toBe(false);
  });
});
