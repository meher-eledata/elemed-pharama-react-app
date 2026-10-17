import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';
import { ReportHeader, FilterLabel, FilterSelect } from '../ReportShared';

const theme = createTheme();

// The real DateRangeFilter pulls in MUI X pickers; a stub that records its props
// is enough to prove ReportHeader decides whether (and with what) to render it.
const mockDateRangeFilter = jest.fn();
jest.mock('../../mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: (props: any) => {
    mockDateRangeFilter(props);
    return <div data-testid="date-range-filter" />;
  },
}));

const RANGE: [Dayjs | null, Dayjs | null] = [dayjs('2026-10-01'), dayjs('2026-10-15')];

const renderHeader = (props: Partial<React.ComponentProps<typeof ReportHeader>> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ReportHeader title="My Report" subtitle="Report subtitle" downloadLabel="Download CSV" {...props} />
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReportHeader date slot', () => {
  it('renders DateRangeFilter with the given range + handler when both range props are passed (backward compat)', () => {
    const onDateRangeChange = jest.fn();
    renderHeader({ dateRange: RANGE, onDateRangeChange });

    expect(screen.getByText('My Report')).toBeInTheDocument();
    expect(screen.getByText('Report subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
    expect(mockDateRangeFilter).toHaveBeenCalledWith(
      expect.objectContaining({ dateRange: RANGE, onDateRangeChange })
    );
  });

  it('renders the custom dateControl and no DateRangeFilter when only dateControl is given', () => {
    renderHeader({ dateControl: <div data-testid="as-of-control">As of</div> });

    expect(screen.getByTestId('as-of-control')).toBeInTheDocument();
    expect(screen.queryByTestId('date-range-filter')).not.toBeInTheDocument();
    expect(mockDateRangeFilter).not.toHaveBeenCalled();
  });

  it('renders neither control when no date props are given', () => {
    renderHeader();

    expect(screen.queryByTestId('date-range-filter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('as-of-control')).not.toBeInTheDocument();
    expect(screen.getByText('My Report')).toBeInTheDocument();
  });

  it.each([
    ['dateRange without onDateRangeChange', { dateRange: RANGE }],
    ['onDateRangeChange without dateRange', { onDateRangeChange: jest.fn() }],
  ])('does not render DateRangeFilter with only %s', (_label, props) => {
    renderHeader(props);
    expect(screen.queryByTestId('date-range-filter')).not.toBeInTheDocument();
  });

  it('places children, then the dateControl, then the download button in the controls row', () => {
    renderHeader({
      children: <div data-testid="extra-filter" />,
      dateControl: <div data-testid="as-of-control" />,
      onDownloadCsv: jest.fn(),
    });

    const extra = screen.getByTestId('extra-filter');
    const dateControl = screen.getByTestId('as-of-control');
    const download = screen.getByRole('button', { name: /download csv/i });

    expect(extra.compareDocumentPosition(dateControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dateControl.compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('ReportHeader download button', () => {
  it('is omitted when onDownloadCsv is not provided', () => {
    renderHeader({ dateRange: RANGE, onDateRangeChange: jest.fn() });
    expect(screen.queryByRole('button', { name: /download csv/i })).not.toBeInTheDocument();
  });

  it('calls onDownloadCsv on click and honours downloadDisabled', () => {
    const onDownloadCsv = jest.fn();
    const { unmount } = renderHeader({ onDownloadCsv });

    fireEvent.click(screen.getByRole('button', { name: /download csv/i }));
    expect(onDownloadCsv).toHaveBeenCalledTimes(1);
    unmount();

    renderHeader({ onDownloadCsv, downloadDisabled: true });
    expect(screen.getByRole('button', { name: /download csv/i })).toBeDisabled();
  });

  it('is a plain button (no menu ARIA, no caret, no id) unless a download menu is configured', () => {
    renderHeader({ onDownloadCsv: jest.fn() });
    const button = screen.getByRole('button', { name: /download csv/i });
    ['id', 'aria-haspopup', 'aria-expanded', 'aria-controls'].forEach((attr) =>
      expect(button).not.toHaveAttribute(attr)
    );
    expect(screen.queryByTestId('KeyboardArrowDownIcon')).not.toBeInTheDocument();
  });

  it('wires the menu ARIA state when downloadMenuOpen / downloadMenuId are given', () => {
    const { unmount } = renderHeader({ onDownloadCsv: jest.fn(), downloadMenuOpen: false, downloadMenuId: 'dl-menu' });
    const button = screen.getByRole('button', { name: /download csv/i });
    expect(button).toHaveAttribute('id', 'dl-menu-button');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
    expect(screen.getByTestId('KeyboardArrowDownIcon')).toBeInTheDocument();

    unmount();

    renderHeader({ onDownloadCsv: jest.fn(), downloadMenuOpen: true, downloadMenuId: 'dl-menu' });
    const openButton = screen.getByRole('button', { name: /download csv/i });
    expect(openButton).toHaveAttribute('aria-expanded', 'true');
    expect(openButton).toHaveAttribute('aria-controls', 'dl-menu');
  });
});

describe('FilterLabel', () => {
  it('renders its children as a caption', () => {
    render(
      <ThemeProvider theme={theme}>
        <FilterLabel>As of Date</FilterLabel>
      </ThemeProvider>
    );
    expect(screen.getByText('As of Date')).toBeInTheDocument();
  });

  it('is used by FilterSelect to caption the select (refactor kept the label)', () => {
    render(
      <ThemeProvider theme={theme}>
        <FilterSelect
          label="Brand"
          value=""
          options={[{ value: '', label: 'All Brands' }]}
          onChange={jest.fn()}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('Brand')).toBeInTheDocument();
    // displayEmpty: the '' sentinel option's label shows in the closed control.
    expect(screen.getByText('All Brands')).toBeInTheDocument();
  });
});
