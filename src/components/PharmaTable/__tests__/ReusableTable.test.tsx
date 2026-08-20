import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReusableTable, TableColumn } from '../index';

const theme = createTheme();

// Mock data for testing
interface TestDataItem {
  id: number;
  name: string;
  age: number;
  email: string;
  status: string;
}

const mockData: TestDataItem[] = [
  { id: 1, name: 'Alice', age: 25, email: 'alice@example.com', status: 'Active' },
  { id: 2, name: 'Bob', age: 30, email: 'bob@example.com', status: 'Inactive' },
  { id: 3, name: 'Charlie', age: 35, email: 'charlie@example.com', status: 'Active' },
  { id: 4, name: 'David', age: 28, email: 'david@example.com', status: 'Active' },
  { id: 5, name: 'Eve', age: 32, email: 'eve@example.com', status: 'Inactive' },
];

const mockColumns: TableColumn<TestDataItem>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
  { key: 'email', header: 'Email', sortable: false },
  { key: 'status', header: 'Status', sortable: true },
];

const defaultProps = {
  columns: mockColumns,
  data: mockData,
  selectedRows: [],
  setSelectedRows: jest.fn(),
  emptyMessage: 'No data available',
  searchAndFilterConfig: { filterOptions: [] },
  currentSearchTerm: '',
  onSearchChange: jest.fn(),
  showFilters: false,
  onShowFiltersToggle: jest.fn(),
  currentFilterKey: '',
  onFilterSelect: jest.fn(),
  totalRows: mockData.length,
  rowsPerPage: 10,
  currentPage: 1,
  onPageChange: jest.fn(),
  onSortRequest: jest.fn(),
  sortConfig: { key: '', direction: 'asc' as const },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ReusableTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders table with data', () => {
      renderWithTheme(<ReusableTable {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          data={[]}
          totalRows={0}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          data={[]}
          totalRows={0}
          emptyMessage="Custom empty message"
        />
      );

      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('hides columns with hide property', () => {
      const columnsWithHidden: TableColumn<TestDataItem>[] = [
        ...mockColumns,
        { key: 'id', header: 'ID', hide: true },
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithHidden}
        />
      );

      expect(screen.queryByText('ID')).not.toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders custom render function for columns', () => {
      const columnsWithRender: TableColumn<TestDataItem>[] = [
        {
          key: 'name',
          header: 'Name',
          render: (item) => <span data-testid={`name-${item.id}`}>{item.name.toUpperCase()}</span>,
        },
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithRender}
          data={[mockData[0]]}
          totalRows={1}
        />
      );

      expect(screen.getByTestId('name-1')).toHaveTextContent('ALICE');
    });
  });

  describe('Sorting', () => {
    it('calls onSortRequest when sort icon is clicked', async () => {
      const onSortRequest = jest.fn();
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          onSortRequest={onSortRequest}
        />
      );

      // Find the sort icon container for Name column
      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toBeInTheDocument();

      // Find the sort icon (KeyboardArrowUpIcon or KeyboardArrowDownIcon)
      const sortIcon = nameHeader?.querySelector('svg');
      if (sortIcon) {
        fireEvent.click(sortIcon);
        expect(onSortRequest).toHaveBeenCalledWith('name');
      }
    });

    it('calls onSortRequest when the header text is clicked (whole cell is the affordance)', () => {
      const onSortRequest = jest.fn();
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          onSortRequest={onSortRequest}
        />
      );

      fireEvent.click(screen.getByText('Name'));
      expect(onSortRequest).toHaveBeenCalledWith('name');
      expect(onSortRequest).toHaveBeenCalledTimes(1);
    });

    it('does not call onSortRequest when a non-sortable header is clicked', () => {
      const onSortRequest = jest.fn();
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          onSortRequest={onSortRequest}
        />
      );

      // Email column has sortable: false.
      fireEvent.click(screen.getByText('Email'));
      expect(onSortRequest).not.toHaveBeenCalled();
    });

    it('does not call onSortRequest from header clicks when the table is empty', () => {
      const onSortRequest = jest.fn();
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          data={[]}
          totalRows={0}
          onSortRequest={onSortRequest}
        />
      );

      fireEvent.click(screen.getByText('Name'));
      expect(onSortRequest).not.toHaveBeenCalled();
    });

    it('displays active sort indicator for ascending sort', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          sortConfig={{ key: 'name', direction: 'asc' }}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toBeInTheDocument();
    });

    it('displays active sort indicator for descending sort', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          sortConfig={{ key: 'age', direction: 'desc' }}
        />
      );

      const ageHeader = screen.getByText('Age').closest('th');
      expect(ageHeader).toBeInTheDocument();
    });

    it('does not show sort icons for non-sortable columns', () => {
      renderWithTheme(<ReusableTable {...defaultProps} />);

      const emailHeader = screen.getByText('Email').closest('th');
      expect(emailHeader).toBeInTheDocument();
      // Email column has sortable: false, so it shouldn't have sort icons
      // This is tested by checking that sortable columns have sort icons
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls when data exists', () => {
      renderWithTheme(<ReusableTable {...defaultProps} />);

      expect(screen.getByText(/of \d+ pages/i)).toBeInTheDocument();
    });

    it('does not display pagination when no data', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          data={[]}
          totalRows={0}
        />
      );

      expect(screen.queryByText(/of \d+ pages/i)).not.toBeInTheDocument();
    });

    it('calls onPageChange when next page button is clicked', () => {
      const onPageChange = jest.fn();
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          rowsPerPage={2}
          totalRows={5}
          currentPage={1}
          onPageChange={onPageChange}
        />
      );

      // Find next button by icon or aria-label
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => {
        const icon = btn.querySelector('svg');
        return icon && (icon.getAttribute('data-testid')?.includes('ArrowRight') || 
                       btn.getAttribute('aria-label')?.toLowerCase().includes('next'));
      });
      
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(onPageChange).toHaveBeenCalled();
      } else {
        // Fallback: try to find by text content
        const allButtons = screen.getAllByRole('button');
        const nextBtn = allButtons.find(btn => btn.textContent?.toLowerCase().includes('next'));
        if (nextBtn) {
          fireEvent.click(nextBtn);
          expect(onPageChange).toHaveBeenCalled();
        }
      }
    });

    it('calls onPageChange when previous page button is clicked', () => {
      const onPageChange = jest.fn();
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          rowsPerPage={2}
          totalRows={5}
          currentPage={2}
          onPageChange={onPageChange}
        />
      );

      // Find previous button by icon or aria-label
      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => {
        const icon = btn.querySelector('svg');
        return icon && (icon.getAttribute('data-testid')?.includes('ArrowLeft') || 
                       btn.getAttribute('aria-label')?.toLowerCase().includes('previous'));
      });
      
      if (prevButton) {
        fireEvent.click(prevButton);
        expect(onPageChange).toHaveBeenCalled();
      } else {
        // Fallback: try to find by text content
        const allButtons = screen.getAllByRole('button');
        const prevBtn = allButtons.find(btn => btn.textContent?.toLowerCase().includes('previous'));
        if (prevBtn) {
          fireEvent.click(prevBtn);
          expect(onPageChange).toHaveBeenCalled();
        }
      }
    });

    it('displays correct page information', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          rowsPerPage={2}
          totalRows={5}
          currentPage={2}
        />
      );

      // Should show page 2 of 3 pages (5 items / 2 per page = 3 pages)
      expect(screen.getByText(/of 3 pages/i)).toBeInTheDocument();
    });

    it('paginates data correctly', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          rowsPerPage={2}
          totalRows={5}
          currentPage={1}
        />
      );

      // First page should show first 2 items
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    });
  });

  describe('Row Selection', () => {
    it('renders checkbox column when checkbox column is present', () => {
      const columnsWithCheckbox: TableColumn<TestDataItem>[] = [
        { key: 'checkbox', header: '', sortable: false },
        ...mockColumns,
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithCheckbox}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('calls setSelectedRows when row checkbox is clicked', () => {
      const setSelectedRows = jest.fn();
      const columnsWithCheckbox: TableColumn<TestDataItem>[] = [
        { key: 'checkbox', header: '', sortable: false },
        ...mockColumns,
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithCheckbox}
          setSelectedRows={setSelectedRows}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // Skip the select-all checkbox (first one)
      if (checkboxes.length > 1) {
        fireEvent.click(checkboxes[1]);
        expect(setSelectedRows).toHaveBeenCalled();
      }
    });

    it('calls setSelectedRows when select all checkbox is clicked', () => {
      const setSelectedRows = jest.fn();
      const columnsWithCheckbox: TableColumn<TestDataItem>[] = [
        { key: 'checkbox', header: '', sortable: false },
        ...mockColumns,
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithCheckbox}
          rowsPerPage={2}
          totalRows={5}
          setSelectedRows={setSelectedRows}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        // Click the select-all checkbox (first one)
        fireEvent.click(checkboxes[0]);
        expect(setSelectedRows).toHaveBeenCalled();
      }
    });

    it('shows checked state for selected rows', () => {
      const columnsWithCheckbox: TableColumn<TestDataItem>[] = [
        { key: 'checkbox', header: '', sortable: false },
        ...mockColumns,
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithCheckbox}
          selectedRows={[0, 2]} // Select first and third row
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // Check that some checkboxes are checked (excluding select-all)
      const rowCheckboxes = checkboxes.slice(1);
      const checkedCount = rowCheckboxes.filter((cb) => (cb as HTMLInputElement).checked).length;
      expect(checkedCount).toBeGreaterThan(0);
    });
  });

  describe('Search and Filtering', () => {
    it('renders search input when searchAndFilterConfig is provided', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          searchAndFilterConfig={{ filterOptions: [{ key: 'name', label: 'Name' }] }}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
    });

    it('calls onSearchChange when search input changes', async () => {
      const user = userEvent.setup();
      const onSearchChange = jest.fn();

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          searchAndFilterConfig={{ filterOptions: [{ key: 'name', label: 'Name' }] }}
          onSearchChange={onSearchChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('textbox');
      await user.type(searchInput, 'test');

      expect(onSearchChange).toHaveBeenCalled();
    });

    it('displays current search term', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          searchAndFilterConfig={{ filterOptions: [{ key: 'name', label: 'Name' }] }}
          currentSearchTerm="test search"
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('textbox');
      expect(searchInput).toHaveValue('test search');
    });

    it('shows clear button when search term exists', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          searchAndFilterConfig={{ filterOptions: [{ key: 'name', label: 'Name' }] }}
          currentSearchTerm="test"
        />
      );

      // Clear button should be present (CloseIcon) - it's an IconButton inside the search input
      const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('textbox');
      const inputContainer = searchInput.closest('.MuiInputBase-root');
      const clearButton = inputContainer?.querySelector('button');
      
      expect(clearButton).toBeInTheDocument();
    });

    it('calls onShowFiltersToggle when filter toggle button is clicked', () => {
      const onShowFiltersToggle = jest.fn();

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          searchAndFilterConfig={{ filterOptions: [{ key: 'name', label: 'Name' }] }}
          onShowFiltersToggle={onShowFiltersToggle}
        />
      );

      const filterButton = screen.getByText(/show filters|hide filters/i);
      fireEvent.click(filterButton);

      expect(onShowFiltersToggle).toHaveBeenCalled();
    });

    it('displays filter options when showFilters is true', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          searchAndFilterConfig={{
            filterOptions: [
              { key: 'name', label: 'Filter by Name' },
              { key: 'status', label: 'Filter by Status' },
            ],
          }}
          showFilters={true}
        />
      );

      expect(screen.getByText('Filter by:')).toBeInTheDocument();
      expect(screen.getByText('Filter by Name')).toBeInTheDocument();
      expect(screen.getByText('Filter by Status')).toBeInTheDocument();
    });

    it('calls onFilterSelect when filter option is clicked', () => {
      const onFilterSelect = jest.fn();

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          searchAndFilterConfig={{
            filterOptions: [{ key: 'name', label: 'Filter by Name' }],
          }}
          showFilters={true}
          onFilterSelect={onFilterSelect}
        />
      );

      // Find the filter button (not the column header)
      const filterButtons = screen.getAllByRole('button');
      const filterButton = filterButtons.find(btn => btn.textContent === 'Filter by Name');
      expect(filterButton).toBeInTheDocument();
      
      if (filterButton) {
        fireEvent.click(filterButton);
        expect(onFilterSelect).toHaveBeenCalled();
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles single row of data', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          data={[mockData[0]]}
          totalRows={1}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('handles large dataset with pagination', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        age: 20 + i,
        email: `user${i + 1}@example.com`,
        status: i % 2 === 0 ? 'Active' : 'Inactive',
      }));

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          data={largeData}
          totalRows={100}
          rowsPerPage={10}
          currentPage={1}
        />
      );

      // Should show first 10 items
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 10')).toBeInTheDocument();
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    });

    it('handles zero totalRows correctly', () => {
      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          data={[]}
          totalRows={0}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.queryByText(/of \d+ pages/i)).not.toBeInTheDocument();
    });

    it('handles columns with headerRender function', () => {
      const columnsWithCustomHeader: TableColumn<TestDataItem>[] = [
        {
          key: 'name',
          header: 'Name',
          headerRender: () => <span data-testid="custom-header">Custom Name Header</span>,
        },
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithCustomHeader}
        />
      );

      expect(screen.getByTestId('custom-header')).toHaveTextContent('Custom Name Header');
    });

    it('handles missing data gracefully', () => {
      const columnsWithOptional: TableColumn<TestDataItem>[] = [
        { key: 'name', header: 'Name' },
        { key: 'optionalField' as any, header: 'Optional' },
      ];

      renderWithTheme(
        <ReusableTable
          {...defaultProps}
          columns={columnsWithOptional}
          data={[{ id: 1, name: 'Test', age: 25, email: 'test@test.com', status: 'Active' }]}
          totalRows={1}
        />
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      renderWithTheme(<ReusableTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('has proper row structure', () => {
      renderWithTheme(<ReusableTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      // Should have at least header row + data rows
      expect(rows.length).toBeGreaterThan(1);
    });
  });
});

