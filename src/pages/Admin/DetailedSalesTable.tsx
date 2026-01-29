import React, { useState, useMemo, useRef, ChangeEvent } from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { CSVLink } from 'react-csv';
import dayjs, { Dayjs } from 'dayjs';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { DETAILED_SALES_TABLE_CONSTANTS } from '../../config/constants/DetailedSalesTable.constants';
import { DETAILED_SALES_TABLE_LABELS } from '../../config/label/DetailedSalesTable.labels';
import { StandardButton, PharmaDatePicker } from '../../components/Common';
import { useGetDailySalesTableQuery } from '../../redux/slices/reportsApi';

interface SalesData {
  id: number;
  transactionDate: string;
  invoiceNumber: string;
  customerName: string;
  paymentType: string;
  saleAmount: number;
  discount: number;
  cgst: number;
  gst: number;
  igst: number;
  totalAmount: number;
  patientType: string;
}

const DetailedSalesTable: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  const { data: apiData, isLoading, isError } = useGetDailySalesTableQuery(
    { date: selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') },
    {
      skip: !selectedDate,
      refetchOnMountOrArgChange: true
    }
  );

  const tableData = useMemo(() => {
    if (!apiData) return [];

    return apiData.map((item, index) => ({
      id: index + 1,
      transactionDate: item.transaction_date, // Note: This might need formatting if it's just YYYY-MM-DD
      invoiceNumber: item.invoice_number,
      customerName: item.customer_name || 'N/A',
      paymentType: item.payment_type,
      saleAmount: parseFloat(item.sales_amount) || 0,
      discount: parseFloat(item.discount_amount) || 0,
      cgst: parseFloat(item.cgst) || 0,
      gst: parseFloat(item.sgst) || 0, // Mapping SGST to gst column as per plan
      igst: parseFloat(item.igst) || 0,
      totalAmount: parseFloat(item.total_amount) || 0,
      patientType: (() => {
        const raw = item.patient_type !== undefined ? item.patient_type : (item as any).patientType;
        if (raw === null || raw === undefined) return 'Out Patient';
        const str = String(raw).toUpperCase().trim();
        if (raw === 1 || str === '1' || str.includes('INPATIENT') || (str.includes('IN') && !str.includes('OUT'))) {
          return 'In Patient';
        }
        return 'Out Patient';
      })(),
      rawPatientType: item.patient_type || 'N/A',
    }));
  }, [apiData]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(DETAILED_SALES_TABLE_CONSTANTS.PAGINATION.ROWS_PER_PAGE);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: DETAILED_SALES_TABLE_CONSTANTS.PAGINATION.DEFAULT_SORT_KEY,
    direction: DETAILED_SALES_TABLE_CONSTANTS.PAGINATION.DEFAULT_SORT_DIRECTION
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // If it's already in DD/MM/YYYY format or similar
    if (dateString.includes('/')) return dateString;
    // If it's YYYY-MM-DD
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const filteredData = useMemo(() => {
    let filtered = [...tableData];

    if (currentSearchTerm) {
      filtered = filtered.filter(item =>
        item.customerName.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        item.paymentType.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        item.patientType.toLowerCase().includes(currentSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [tableData, currentSearchTerm]);

  const sortedData = useMemo(() => {
    const activeSortKey = sortConfig.key || DETAILED_SALES_TABLE_CONSTANTS.PAGINATION.DEFAULT_SORT_KEY;
    const activeSortDirection = sortConfig.direction || DETAILED_SALES_TABLE_CONSTANTS.PAGINATION.DEFAULT_SORT_DIRECTION;

    return [...filteredData].sort((a, b) => {
      const aValue = a[activeSortKey as keyof SalesData];
      const bValue = b[activeSortKey as keyof SalesData];

      // Special handling for transactionDate - parse as date for proper sorting
      if (activeSortKey === 'transactionDate' && typeof aValue === 'string' && typeof bValue === 'string') {
        const aDate = new Date(aValue.split(' ')[0].split('/').reverse().join('-') + ' ' + aValue.split(' ')[1]);
        const bDate = new Date(bValue.split(' ')[0].split('/').reverse().join('-') + ' ' + bValue.split(' ')[1]);
        const compareResult = aDate.getTime() - bDate.getTime();
        return activeSortDirection === 'asc' ? compareResult : -compareResult;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const compareResult = aValue.localeCompare(bValue, undefined, {
          numeric: true,
          sensitivity: 'base'
        });
        return activeSortDirection === 'asc' ? compareResult : -compareResult;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Fallback: convert to string and compare
      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, sortConfig]);

  const columns: TableColumn<SalesData>[] = [
    {
      key: 'transactionDate',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.TRANSACTION_DATE,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {formatDate(item.transactionDate)}
        </Typography>
      ),
    },
    {
      key: 'invoiceNumber',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.INVOICE_NUMBER,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {item.invoiceNumber}
        </Typography>
      ),
    },
    {
      key: 'customerName',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.CUSTOMER_NAME,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {item.customerName}
        </Typography>
      ),
    },
    {
      key: 'paymentType',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.PAYMENT_TYPE,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {item.paymentType}
        </Typography>
      ),
    },
    {
      key: 'saleAmount',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.SALE_AMOUNT,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {formatNumber(item.saleAmount)}
        </Typography>
      ),
    },
    {
      key: 'discount',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.DISCOUNT,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {formatNumber(item.discount)}
        </Typography>
      ),
    },
    {
      key: 'cgst',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.CGST,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {formatNumber(item.cgst)}
        </Typography>
      ),
    },
    {
      key: 'gst',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.GST,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {formatNumber(item.gst)}
        </Typography>
      ),
    },
    {
      key: 'igst',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.IGST,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {formatNumber(item.igst)}
        </Typography>
      ),
    },
    {
      key: 'totalAmount',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.TOTAL_AMOUNT,
      sortable: true,
      render: (item) => (
        <Typography sx={{
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontSize: '14px',
          color: '#1A212B',
        }}>
          {formatCurrency(item.totalAmount)}
        </Typography>
      ),
    },
    {
      key: 'patientType',
      header: DETAILED_SALES_TABLE_LABELS.TABLE.PATIENT_TYPE,
      sortable: true,
      render: (item) => {
        const val = item.patientType;
        const isActuallyIn = (val === 'In Patient' || String(val).toUpperCase().includes('IN') && !String(val).toUpperCase().includes('OUT'));
        return (
          <Typography sx={{
            fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
            fontSize: '14px',
            color: '#1A212B',
          }}>
            {isActuallyIn ? 'In Patient' : 'Out Patient'}
          </Typography>
        );
      },
    },
  ];

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSortRequest = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDownloadCSV = () => {
    csvLinkRef.current?.link?.click();
  };

  // Prepare CSV data
  const csvData = useMemo(() => {
    return sortedData.map(item => ({
      'Transaction Date': formatDate(item.transactionDate),
      'Invoice Number': item.invoiceNumber,
      'Customer Name': item.customerName,
      'Payment Type': item.paymentType,
      'Sale Amount (₹)': item.saleAmount.toFixed(2),
      'Discount (₹)': item.discount.toFixed(2),
      'CGST (₹)': item.cgst.toFixed(2),
      'GST (₹)': item.gst.toFixed(2),
      'IGST (₹)': item.igst.toFixed(2),
      'Total Amount (₹)': item.totalAmount.toFixed(2),
      'Patient Type': item.patientType,
    }));
  }, [sortedData]);

  // Generate filename with current date
  const csvFilename = `detailed_sales_table_${selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}.csv`;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: 2 }}>
        <Typography color="error">Failed to load detailed sales data.</Typography>
        <StandardButton variant="primary" onClick={() => window.location.reload()}>Retry</StandardButton>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box
          onClick={() => navigate('/admin/reports')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#5C17E5',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          <KeyboardArrowLeftIcon sx={{ fontSize: 24 }} />
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            fontFamily: "'Lexend', sans-serif",
            color: '#1A212B',
          }}
        >
          {DETAILED_SALES_TABLE_LABELS.PAGE_TITLE}
        </Typography>
      </Box>

      {/* Search Bar and Download Button */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        gap: 2,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#F6F8FB',
          borderRadius: '16px',
          border: '1px solid #9AABB',
          p: '12px',
          width: 'fit-content',
        }}>
          <TextField
            placeholder={DETAILED_SALES_TABLE_LABELS.SEARCH_PLACEHOLDER}
            value={currentSearchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: !currentSearchTerm.trim() ? (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#728197', fontSize: '20px', backgroundColor: '#ffffff' }} />
                </InputAdornment>
              ) : null,
              endAdornment: currentSearchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      const syntheticEvent = {
                        target: { value: '' }
                      } as ChangeEvent<HTMLInputElement>;
                      handleSearchChange(syntheticEvent);
                    }}
                    sx={{
                      padding: '4px',
                      color: '#728197',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#1A212B'
                      }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #9AA8bc',
                outline: 'none !important',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none !important',
                },
                '&:hover': {
                  border: '1px solid #9AA8bc !important',
                  outline: 'none !important',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none !important',
                  },
                },
                '&.Mui-focused': {
                  border: '1px solid #9AA8bc !important',
                  outline: 'none !important',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none !important',
                  },
                },
              },
            }}
            sx={{
              width: '600px',
              borderRadius: '12px',
              '& .MuiOutlinedInput-root': {
                outline: 'none !important',
                '&:focus': {
                  outline: 'none !important',
                },
                '&:focus-visible': {
                  outline: 'none !important',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none !important',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: 'none !important',
                },
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PharmaDatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            width={200}
            height={40}
          />
          <StandardButton
            variant="primary"
            size="medium"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCSV}
            sx={{
              whiteSpace: 'nowrap',
            }}
          >
            Download CSV
          </StandardButton>
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{
        marginTop: 1,
        overflowX: 'auto',
        backgroundColor: DETAILED_SALES_TABLE_CONSTANTS.TABLE.CONTAINER_BACKGROUND,
        borderRadius: DETAILED_SALES_TABLE_CONSTANTS.TABLE.CONTAINER_BORDER_RADIUS,
        border: 'none',
        fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
        padding: 0,
        '& .MuiTableContainer-root': {
          boxShadow: 'none',
          borderRadius: DETAILED_SALES_TABLE_CONSTANTS.TABLE.CONTAINER_BORDER_RADIUS,
          border: 'none',
        },
        '& .MuiTable-root': {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
        '& .MuiTableCell-root': {
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          padding: `${DETAILED_SALES_TABLE_CONSTANTS.TABLE.CELL_PADDING} !important`,
          border: DETAILED_SALES_TABLE_CONSTANTS.TABLE.CELL_BORDER,
          borderBottom: DETAILED_SALES_TABLE_CONSTANTS.TABLE.ROW_BORDER,
        },
        '& .MuiTableHead .MuiTableCell-root, & .MuiTableHead .MuiTableCell-root[class*="MuiTableCell-root"]': {
          fontFamily: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_FAMILY,
          fontWeight: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_WEIGHT,
          fontSize: `${DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_FONT_SIZE} !important`,
          lineHeight: `${DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_LINE_HEIGHT} !important`,
          color: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_COLOR,
          backgroundColor: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_BACKGROUND,
          padding: `${DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_PADDING} !important`,
          minHeight: 'auto !important',
          height: 'auto !important',
          borderRight: DETAILED_SALES_TABLE_CONSTANTS.TABLE.HEADER_CELL_BORDER_RIGHT,
          borderBottom: DETAILED_SALES_TABLE_CONSTANTS.TABLE.ROW_BORDER,
          '&:last-child': {
            borderRight: 'none',
          },
        },
        '& .MuiTableBody .MuiTableRow:nth-of-type(odd)': {
          backgroundColor: `${DETAILED_SALES_TABLE_CONSTANTS.TABLE.ROW_BACKGROUND_ODD} !important`,
        },
        '& .MuiTableBody .MuiTableRow:nth-of-type(even)': {
          backgroundColor: `${DETAILED_SALES_TABLE_CONSTANTS.TABLE.ROW_BACKGROUND_EVEN} !important`,
        },
        '& .MuiTableBody .MuiTableRow': {
          borderBottom: DETAILED_SALES_TABLE_CONSTANTS.TABLE.ROW_BORDER,
          '&:last-child': {
            borderBottom: 'none',
          },
          '&:hover': {
            backgroundColor: `${DETAILED_SALES_TABLE_CONSTANTS.TABLE.ROW_HOVER_BACKGROUND} !important`,
          },
          '&:focus': {
            backgroundColor: 'inherit !important',
          },
          '&:active': {
            backgroundColor: 'inherit !important',
          },
        },
        '& .MuiTableBody .MuiTableCell-root': {
          borderRight: 'none',
        },
        '&::-webkit-scrollbar': {
          height: DETAILED_SALES_TABLE_CONSTANTS.SCROLLBAR.HEIGHT,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: DETAILED_SALES_TABLE_CONSTANTS.SCROLLBAR.TRACK_COLOR,
          borderRadius: DETAILED_SALES_TABLE_CONSTANTS.SCROLLBAR.TRACK_BORDER_RADIUS,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: DETAILED_SALES_TABLE_CONSTANTS.SCROLLBAR.THUMB_COLOR,
          borderRadius: DETAILED_SALES_TABLE_CONSTANTS.SCROLLBAR.THUMB_BORDER_RADIUS,
          '&:hover': {
            backgroundColor: DETAILED_SALES_TABLE_CONSTANTS.SCROLLBAR.THUMB_HOVER_COLOR,
          },
        },
      }}>
        <ReusableTable
          columns={columns}
          data={sortedData}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          searchAndFilterConfig={{
            filterOptions: [],
          }}
          currentSearchTerm=""
          onSearchChange={() => { }}
          showFilters={false}
          onShowFiltersToggle={() => { }}
          currentFilterKey=""
          onFilterSelect={() => { }}
          totalRows={sortedData.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      </Box>

      {/* Hidden CSV Link */}
      <CSVLink
        data={csvData}
        filename={csvFilename}
        ref={csvLinkRef}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default DetailedSalesTable;
