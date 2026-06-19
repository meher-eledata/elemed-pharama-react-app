import React, { useState, Suspense, lazy, useRef, useMemo } from 'react';
import { Box, Typography, Card, Grid, Stack, CircularProgress, Tooltip, Button } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { BarChart } from '@mui/x-charts/BarChart';
import { useNavigate, useLocation } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import { CSVLink } from 'react-csv';
import { REPORTS_LABELS } from '../../config/label/Reports.labels';
import { REPORTS_CONSTANTS } from '../../config/constants/Reports.constants';
import { ADMIN_REPORTS_CONSTANTS } from '../../config/constants/AdminReports.constants';
import { SUPPLIER_RECEIPT_REPORT_LABELS } from '../../config/label/SupplierReceiptReport.labels';
import { SUPPLIER_PAYMENT_REPORT_LABELS } from '../../config/label/SupplierPaymentReport.labels';
import { PRODUCT_SALES_REPORT_LABELS } from '../../config/label/ProductSalesReport.labels';
import { SALES_TAX_REPORT_LABELS } from '../../config/label/SalesTaxReport.labels';
import { SUPPLIER_TAX_REPORT_LABELS } from '../../config/label/SupplierTaxReport.labels';
import { PharmaDatePicker } from '../../components/Common';
import { StandardButton } from '../../components/Common';
import RightArrow from '../../assets/Right.svg';
import DashboardMain from '../DashboardMain/DashboardMain';
import { useGetDailySalesReportQuery, useGetWeeklyBillCountsQuery } from '../../redux/slices/reportsApi';

// Lazy-loaded Pie Chart Component
const PaymentTypePieChart = lazy(() => import('../../components/Charts/PaymentTypePieChart'));

type ReportTab = 'kpis' | 'detailed';

const Reports: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ReportTab>(
    (location.state as any)?.activeTab === 'detailed' ? 'detailed' : 'kpis'
  );

  return (
    <Box sx={{ paddingBottom: REPORTS_CONSTANTS.PAGE.PADDING_BOTTOM }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button
          onClick={() => setActiveTab('kpis')}
          sx={{
            backgroundColor: activeTab === 'kpis' ? '#5C17E5' : 'transparent',
            color: activeTab === 'kpis' ? '#FFFFFF' : '#1A212B',
            border: activeTab === 'kpis' ? 'none' : '1px solid #D1D5DB',
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            padding: '8px 16px',
            minWidth: '120px',
            '&:hover': {
              backgroundColor: activeTab === 'kpis' ? '#4C14C7' : 'transparent',
            },
          }}
        >
          KPI's
        </Button>
        <Button
          onClick={() => setActiveTab('detailed')}
          sx={{
            backgroundColor: activeTab === 'detailed' ? '#5C17E5' : 'transparent',
            color: activeTab === 'detailed' ? '#FFFFFF' : '#1A212B',
            border: activeTab === 'detailed' ? 'none' : '1px solid #D1D5DB',
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            padding: '8px 16px',
            minWidth: '120px',
            '&:hover': {
              backgroundColor: activeTab === 'detailed' ? '#4C14C7' : 'transparent',
            },
          }}
        >
          Detailed Reports
        </Button>
      </Box>

      {activeTab === 'kpis' ? (
        <DashboardMain hideButtons={true} />
      ) : (
        <DetailedReportsView />
      )}
    </Box>
  );
};

const DetailedReportsView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<string | null>(
    (location.state as any)?.selectedReport || null
  );

  const reportCards: {
    id: string;
    title: string;
    description: string;
    route?: string;
  }[] = [
    {
      id: 'daily-sales',
      title: 'Daily Sales Report',
      description: 'View detailed daily sales information including payment methods, taxes, and trends',
    },
    {
      id: 'supplier-receipt',
      title: SUPPLIER_RECEIPT_REPORT_LABELS.DISCOVERY_CARD.TITLE,
      description: SUPPLIER_RECEIPT_REPORT_LABELS.DISCOVERY_CARD.DESCRIPTION,
      route: ADMIN_REPORTS_CONSTANTS.ROUTES.SUPPLIER_RECEIPT,
    },
    {
      id: 'supplier-payments',
      title: SUPPLIER_PAYMENT_REPORT_LABELS.DISCOVERY_CARD.TITLE,
      description: SUPPLIER_PAYMENT_REPORT_LABELS.DISCOVERY_CARD.DESCRIPTION,
      route: ADMIN_REPORTS_CONSTANTS.ROUTES.SUPPLIER_PAYMENTS,
    },
    {
      id: 'product-sales',
      title: PRODUCT_SALES_REPORT_LABELS.DISCOVERY_CARD.TITLE,
      description: PRODUCT_SALES_REPORT_LABELS.DISCOVERY_CARD.DESCRIPTION,
      route: ADMIN_REPORTS_CONSTANTS.ROUTES.PRODUCT_SALES,
    },
    {
      id: 'sales-tax',
      title: SALES_TAX_REPORT_LABELS.DISCOVERY_CARD.TITLE,
      description: SALES_TAX_REPORT_LABELS.DISCOVERY_CARD.DESCRIPTION,
      route: ADMIN_REPORTS_CONSTANTS.ROUTES.SALES_TAX,
    },
    {
      id: 'supplier-tax',
      title: SUPPLIER_TAX_REPORT_LABELS.DISCOVERY_CARD.TITLE,
      description: SUPPLIER_TAX_REPORT_LABELS.DISCOVERY_CARD.DESCRIPTION,
      route: ADMIN_REPORTS_CONSTANTS.ROUTES.SUPPLIER_TAX,
    },
  ];

  const handleCardClick = (report: { id: string; route?: string }) => {
    if (report.route) {
      navigate(report.route);
    } else {
      setSelectedReport(report.id);
    }
  };

  if (selectedReport === 'daily-sales') {
    return (
      <Box>
        <Button
          onClick={() => setSelectedReport(null)}
          sx={{
            mb: 2,
            textTransform: 'none',
            color: '#5C17E5',
          }}
        >
          ← Back to Reports
        </Button>
        <DailySalesReport />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {reportCards.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card
              sx={{
                p: 3,
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                border: '1px solid #E5E7EB',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => handleCardClick(report)}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#1A212B',
                  fontSize: '18px',
                  fontFamily: "'Lexend', sans-serif",
                  mb: 1,
                }}
              >
                {report.title}
              </Typography>
              <Typography
                sx={{
                  color: '#728197',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  fontFamily: "'Lexend', sans-serif",
                  mb: 2,
                  flexGrow: 1,
                }}
              >
                {report.description}
              </Typography>
              <StandardButton
                variant="primary"
                size="medium"
                sx={{
                  alignSelf: 'flex-start',
                }}
              >
                View Report
              </StandardButton>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const DailySalesReport: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const csvLinkRef = useRef<any>(null);

  const { data: apiData, isLoading, isError } = useGetDailySalesReportQuery(
    { date: selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') },
    {
      skip: !selectedDate,
      refetchOnMountOrArgChange: true
    }
  );

  const { data: weeklyApiData } = useGetWeeklyBillCountsQuery(
    { end_date: selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') },
    {
      skip: !selectedDate,
      refetchOnMountOrArgChange: true
    }
  );

  const PAYMENT_METHOD_COLORS: Record<string, string> = {
    'Cash': '#3B82F6', // Blue
    'Card': '#EF4444', // Red
    'UPI': '#10B981', // Green (Better for UPI/Payments)
    'Insurance': '#F59E0B', // Orange
    'Credit': '#6B7280', // Gray
    'Bank Transfer': '#6366F1', // Indigo
    'Cheque': '#8B5CF6', // Purple
    'Credit Card': '#EC4899', // Pink
    'Others': '#94A3B8'
  };

  const normalizeLabel = (label: string) => {
    if (!label) return 'Others';
    // Replace underscores with spaces and split into words
    return label.replace(/_/g, ' ').split(' ').map(word => {
      const upper = word.toUpperCase();
      // Keep these as all caps
      if (['UPI', 'UPI/QR', 'ATM'].includes(upper)) return upper;
      // Normal Title Case
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    }).join(' ');
  };

  const reportData = useMemo(() => {
    if (!apiData) return null;

    // Diagnostic log to verify if cash numbers are updating from backend
    console.log('📊 Daily Sales Report API Data:', {
      total_sales: apiData.total_sales,
      cash_in_hand: apiData.cash_in_hand_total,
      breakdown: apiData.payment_method_breakdown
    });

    const parseVal = (val: any) => {
      if (val === null || val === undefined) return 0;
      const parsed = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(parsed) ? 0 : parsed;
    };

    const totalSales = parseVal(apiData.total_sales);
    const totalReturns = parseVal(apiData.total_returns);
    const totalDeletions = parseVal(apiData.total_deletion_amount);
    const totalSalesInpatient = parseVal(apiData.inpatient_sales);
    const totalSalesOutpatient = parseVal(apiData.outpatient_sales);
    const totalReturnsInpatient = parseVal(apiData.inpatient_returns);
    const totalReturnsOutpatient = parseVal(apiData.outpatient_returns);
    const totalDeletionsInpatient = parseVal(apiData.inpatient_deletion_amount);
    const totalDeletionsOutpatient = parseVal(apiData.outpatient_deletion_amount);

    return {
      totalBills: parseVal(apiData.total_bills),
      totalSales,
      totalDiscount: parseVal(apiData.total_discount),
      totalTaxCollected: parseVal(apiData.total_tax),
      totalBillsBreakdown: {
        inpatient: parseVal(apiData.inpatient_bills),
        outpatient: parseVal(apiData.outpatient_bills),
      },
      totalSalesBreakdown: {
        inpatient: totalSalesInpatient,
        outpatient: totalSalesOutpatient,
      },
      totalDiscountBreakdown: {
        inpatient: parseVal(apiData.inpatient_discount),
        outpatient: parseVal(apiData.outpatient_discount),
      },
      totalTaxCollectedBreakdown: {
        inpatient: parseVal(apiData.inpatient_tax),
        outpatient: parseVal(apiData.outpatient_tax),
      },
      totalReturns,
      totalReturnsBreakdown: {
        inpatient: totalReturnsInpatient,
        outpatient: totalReturnsOutpatient,
      },
      // Net Sales = Total Sales - Returns - Deletions.
      // Deletions reverse the original sale, so they must subtract just like returns;
      // otherwise the report's Net Sales won't match the Detailed Sales table totals.
      netSales: totalSales - totalReturns - totalDeletions,
      netSalesBreakdown: {
        inpatient: totalSalesInpatient - totalReturnsInpatient - totalDeletionsInpatient,
        outpatient: totalSalesOutpatient - totalReturnsOutpatient - totalDeletionsOutpatient,
      },
      cashSales: {
        amount: parseVal(apiData.cash_in_hand_total),
        bills: apiData.payment_method_breakdown.find(p => p.payment_method.toUpperCase() === 'CASH')?.bill_count || 0,
        breakdown: {
          inpatient: parseVal(apiData.cash_in_hand_inpatient),
          outpatient: parseVal(apiData.cash_in_hand_outpatient),
        }
      },
      paymentTypeData: apiData.payment_method_breakdown.map((item, index) => {
        const normalizedLabel = normalizeLabel(item.payment_method);
        return {
          id: index,
          value: parseVal(item.total_sales),
          label: normalizedLabel,
          color: PAYMENT_METHOD_COLORS[normalizedLabel] || PAYMENT_METHOD_COLORS['Others']
        };
      }),
      taxSummary: {
        totalTax: parseVal(apiData.total_cgst) + parseVal(apiData.total_sgst) + parseVal(apiData.total_igst),
        cgst: parseVal(apiData.total_cgst),
        sgst: parseVal(apiData.total_sgst),
        igst: parseVal(apiData.total_igst),
      },
      weeklyTrend: {
        days: weeklyApiData ? weeklyApiData.map(item => dayjs(item.day).format('ddd')) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: weeklyApiData ? weeklyApiData.map(item => parseVal(item.total_bills)) : [0, 0, 0, 0, 0, 0, 0],
        inpatient: weeklyApiData ? weeklyApiData.map(item => parseVal(item.inpatient_bills)) : [0, 0, 0, 0, 0, 0, 0],
        outpatient: weeklyApiData ? weeklyApiData.map(item => parseVal(item.outpatient_bills)) : [0, 0, 0, 0, 0, 0, 0],
      },
    };
  }, [apiData, weeklyApiData]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate total for percentage calculation
  const totalPaymentValue = useMemo(() =>
    reportData?.paymentTypeData.reduce((sum, item) => sum + item.value, 0) || 0
    , [reportData]);

  const sortedPaymentData = useMemo(() => {
    if (!reportData) return [];
    return [...reportData.paymentTypeData].sort((a, b) => b.value - a.value);
  }, [reportData]);

  // Calculate max for Y axis
  const maxBills = useMemo(() => {
    if (!reportData?.weeklyTrend.values.length) return 60;
    const maxValue = Math.max(...reportData.weeklyTrend.values);
    return Math.ceil((maxValue + 5) / 10) * 10; // Round up to nearest 10 with some padding
  }, [reportData]);

  // Prepare CSV data
  const csvData = useMemo(() => {
    if (!reportData) return [];

    const csvRows = [
      // Summary Section
      { Section: 'Summary', Metric: 'Total Bills', Value: reportData.totalBills.toString(), Details: '' },
      { Section: 'Summary', Metric: 'Total Sales (₹)', Value: reportData.totalSales.toFixed(2), Details: '' },
      { Section: 'Summary', Metric: 'Total Discount (₹)', Value: reportData.totalDiscount.toFixed(2), Details: '' },
      { Section: 'Summary', Metric: 'Total Tax Collected (₹)', Value: reportData.totalTaxCollected.toFixed(2), Details: '' },
      { Section: '', Metric: '', Value: '', Details: '' }, // Empty row

      // Sales Breakdown Section
      ...reportData.paymentTypeData.map(item => ({
        Section: 'Sales Breakdown',
        Metric: `${item.label} Sales (₹)`,
        Value: item.value.toFixed(2),
        Details: ''
      })),
      { Section: '', Metric: '', Value: '', Details: '' }, // Empty row

      // Payment Type Breakdown
      ...reportData.paymentTypeData.map(item => ({
        Section: 'Payment Type Breakdown',
        Metric: item.label,
        Value: item.value.toFixed(2),
        Details: totalPaymentValue > 0 ? `${((item.value / totalPaymentValue) * 100).toFixed(2)}%` : '0%'
      })),
      { Section: '', Metric: '', Value: '', Details: '' }, // Empty row

      // Tax Summary
      { Section: 'Tax Summary', Metric: 'Total Tax (₹)', Value: reportData.taxSummary.totalTax.toFixed(2), Details: '' },
      { Section: 'Tax Summary', Metric: 'CGST (₹)', Value: reportData.taxSummary.cgst.toFixed(2), Details: '' },
      { Section: 'Tax Summary', Metric: 'SGST (₹)', Value: reportData.taxSummary.sgst.toFixed(2), Details: '' },
      { Section: 'Tax Summary', Metric: 'IGST (₹)', Value: reportData.taxSummary.igst.toFixed(2), Details: '' },
    ];

    return csvRows;
  }, [reportData, totalPaymentValue]);

  // Generate filename with selected date
  const csvFilename = useMemo(() => {
    const dateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    return `daily_sales_report_${dateStr}.csv`;
  }, [selectedDate]);

  const handleDownloadCSV = () => {
    csvLinkRef.current?.link?.click();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (isError || !reportData) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">Failed to load report data. Please try again later.</Typography>
        <Box sx={{ mt: 2 }}>
          <PharmaDatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            width={200}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          variant={REPORTS_CONSTANTS.DAILY_SALES_REPORT.HEADER.TITLE_VARIANT}
          fontWeight={REPORTS_CONSTANTS.DAILY_SALES_REPORT.HEADER.TITLE_FONT_WEIGHT}
          sx={{
            fontFamily: "'Lexend', sans-serif",
            color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.HEADER.TITLE_COLOR,
          }}
        >
          {REPORTS_LABELS.DAILY_SALES_REPORT.TITLE}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PharmaDatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            width={REPORTS_CONSTANTS.DAILY_SALES_REPORT.HEADER.DATE_PICKER.WIDTH}
            height={REPORTS_CONSTANTS.DAILY_SALES_REPORT.HEADER.DATE_PICKER.HEIGHT}
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

      {/* Key Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              backgroundColor: '#F9FAFB',
            }}
          >
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {REPORTS_LABELS.DAILY_SALES_REPORT.METRICS.TOTAL_BILLS}
            </Typography>
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {reportData.totalBills}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#3B82F6',
                }}
              >
                In Patient: {reportData.totalBillsBreakdown.inpatient}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#10B981',
                }}
              >
                Out Patient: {reportData.totalBillsBreakdown.outpatient}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              backgroundColor: '#F9FAFB',
            }}
          >
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {REPORTS_LABELS.DAILY_SALES_REPORT.METRICS.TOTAL_SALES}
            </Typography>
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.totalSales)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#3B82F6',
                }}
              >
                In Patient: {formatCurrency(reportData.totalSalesBreakdown.inpatient)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#10B981',
                }}
              >
                Out Patient: {formatCurrency(reportData.totalSalesBreakdown.outpatient)}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              backgroundColor: '#F9FAFB',
            }}
          >
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {REPORTS_LABELS.DAILY_SALES_REPORT.METRICS.TOTAL_DISCOUNT}
            </Typography>
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.totalDiscount)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#3B82F6',
                }}
              >
                In Patient: {formatCurrency(reportData.totalDiscountBreakdown.inpatient)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#10B981',
                }}
              >
                Out Patient: {formatCurrency(reportData.totalDiscountBreakdown.outpatient)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Returns Card */}
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              backgroundColor: '#F9FAFB',
            }}
          >
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              Returns
            </Typography>
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.totalReturns)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#3B82F6',
                }}
              >
                In Patient: {formatCurrency(reportData.totalReturnsBreakdown.inpatient)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#10B981',
                }}
              >
                Out Patient: {formatCurrency(reportData.totalReturnsBreakdown.outpatient)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Net Sales Card */}
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              backgroundColor: '#F9FAFB',
            }}
          >
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              Net Sales
            </Typography>
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.netSales)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#3B82F6',
                }}
              >
                In Patient: {formatCurrency(reportData.netSalesBreakdown.inpatient)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#10B981',
                }}
              >
                Out Patient: {formatCurrency(reportData.netSalesBreakdown.outpatient)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Cash In Hand Card */}
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              backgroundColor: '#F9FAFB',
            }}
          >
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {REPORTS_LABELS.DAILY_SALES_REPORT.METRICS.CASH_IN_HAND}
            </Typography>
            <Typography
              sx={{
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.FONT_WEIGHT,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                mb: 1,
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.cashSales.amount)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#3B82F6',
                }}
              >
                In Patient: {formatCurrency(reportData.cashSales.breakdown.inpatient)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#10B981',
                }}
              >
                Out Patient: {formatCurrency(reportData.cashSales.breakdown.outpatient)}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Breakdown and Payment Type */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Breakdown Section */}
        <Grid item xs={12} md={6}>
          <Typography
            sx={{
              fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_SIZE,
              fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_WEIGHT,
              color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
              mb: 2,
              fontFamily: "'Lexend', sans-serif",
            }}
          >
            {REPORTS_LABELS.DAILY_SALES_REPORT.SECTIONS.SALES_BREAKDOWN}
          </Typography>
          <Grid container spacing={2.5}>
            {reportData.paymentTypeData.map((item) => (
              <Grid item xs={12} sm={6} md={6} key={item.id}>
                <Card
                  sx={{
                    p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.PADDING,
                    borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
                    boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
                    border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_SIZE,
                      fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.TITLE_FONT_WEIGHT,
                      color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                      mb: 1,
                      fontFamily: "'Lexend', sans-serif",
                    }}
                  >
                    {item.label} Sales
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.AMOUNT_FONT_SIZE,
                      fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.AMOUNT_FONT_WEIGHT,
                      color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.METRIC_VALUE.COLOR,
                      mb: 0.5,
                      fontFamily: "'Lexend', sans-serif",
                    }}
                  >
                    {formatCurrency(item.value)}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Sales by Payment Type Section */}
        <Grid item xs={12} md={6}>
          <Typography
            sx={{
              fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_SIZE,
              fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_WEIGHT,
              color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
              mb: 2,
              fontFamily: "'Lexend', sans-serif",
            }}
          >
            {REPORTS_LABELS.DAILY_SALES_REPORT.SECTIONS.SALES_BY_PAYMENT_TYPE}
          </Typography>
          <Card
            sx={{
              p: 3,
              width: '100%',
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {totalPaymentValue > 0 ? (
                <Suspense
                  fallback={
                    <Box
                      sx={{
                        width: 380,
                        height: 380,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <CircularProgress size={40} />
                    </Box>
                  }
                >
                  <PaymentTypePieChart data={reportData.paymentTypeData} />
                </Suspense>
              ) : (
                <Box
                  sx={{
                    width: 380,
                    height: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '2px dashed #E5E7EB',
                    borderRadius: '50%',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#9CA3AF',
                      fontSize: '14px',
                      fontFamily: "'Lexend', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    No sales data
                  </Typography>
                  <Typography
                    sx={{
                      color: '#9CA3AF',
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                    }}
                  >
                    for this date
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ flexGrow: 1, ml: 4 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                {sortedPaymentData.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '2px',
                          backgroundColor: item.color,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: '#4B5563',
                          fontWeight: 500,
                          fontFamily: "'Lexend', sans-serif",
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#1A212B',
                        fontWeight: 600,
                        fontFamily: "'Lexend', sans-serif",
                      }}
                    >
                      {totalPaymentValue > 0 ? `${((item.value / totalPaymentValue) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4, mt: 3 }}>
        {/* Tax Summary Section */}
        <Grid item xs={12} md={6}>
          <Typography
            sx={{
              fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_SIZE,
              fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_WEIGHT,
              color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
              mb: 2,
              fontFamily: "'Lexend', sans-serif",
            }}
          >
            {REPORTS_LABELS.DAILY_SALES_REPORT.SECTIONS.TAX_SUMMARY}
          </Typography>
          <Card
            sx={{
              p: 2,
              width: '100%',
              maxWidth: '480px',
              height: 'auto',
              minHeight: '180px',
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack spacing={0.75}>
              {/* Total Tax Collected - with separator */}
              <Box
                sx={{
                  pb: 1,
                  borderBottom: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.BORDER_BOTTOM,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_FONT_SIZE,
                      color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
                      fontFamily: "'Lexend', sans-serif",
                    }}
                  >
                    {REPORTS_LABELS.DAILY_SALES_REPORT.TAX.TOTAL_TAX_COLLECTED}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_SIZE,
                      fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_WEIGHT,
                      color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_COLOR,
                      fontFamily: "'Lexend', sans-serif",
                    }}
                  >
                    {formatCurrency(reportData.taxSummary.totalTax)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#3B82F6',
                    }}
                  >
                    In Patient: {formatCurrency(reportData.totalTaxCollectedBreakdown.inpatient)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#10B981',
                    }}
                  >
                    Out Patient: {formatCurrency(reportData.totalTaxCollectedBreakdown.outpatient)}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 0.75,
                  borderBottom: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.BORDER_BOTTOM_LIGHT,
                }}
              >
                <Tooltip title="Central Goods and Services Tax - Tax collected by the central government" arrow placement="top">
                  <Typography
                    sx={{
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_FONT_SIZE,
                      color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
                      fontFamily: "'Lexend', sans-serif",
                      cursor: 'help',
                    }}
                  >
                    {REPORTS_LABELS.DAILY_SALES_REPORT.TAX.CGST}
                  </Typography>
                </Tooltip>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_SIZE,
                    fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_WEIGHT,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_COLOR,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {formatCurrency(reportData.taxSummary.cgst)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 0.75,
                  borderBottom: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.BORDER_BOTTOM_LIGHT,
                }}
              >
                <Tooltip title="State Goods and Services Tax - Tax collected by the state government" arrow placement="top">
                  <Typography
                    sx={{
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_FONT_SIZE,
                      color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
                      fontFamily: "'Lexend', sans-serif",
                      cursor: 'help',
                    }}
                  >
                    {REPORTS_LABELS.DAILY_SALES_REPORT.TAX.SGST}
                  </Typography>
                </Tooltip>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_SIZE,
                    fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_WEIGHT,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_COLOR,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {formatCurrency(reportData.taxSummary.sgst)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 0.75,
                }}
              >
                <Tooltip title="Integrated Goods and Services Tax - Tax collected on inter-state transactions" arrow placement="top">
                  <Typography
                    sx={{
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_FONT_SIZE,
                      color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
                      fontFamily: "'Lexend', sans-serif",
                      cursor: 'help',
                    }}
                  >
                    {REPORTS_LABELS.DAILY_SALES_REPORT.TAX.IGST}
                  </Typography>
                </Tooltip>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_SIZE,
                    fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_FONT_WEIGHT,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.VALUE_COLOR,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {formatCurrency(reportData.taxSummary.igst)}
                </Typography>
              </Box>
            </Stack>
          </Card>
          {/* View Detailed Sales Table Link */}
          <Box sx={{ mt: 2 }}>
            <Box
              onClick={() => navigate('/admin/reports/detailed-sales')}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.COLOR,
                fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.FONT_SIZE,
                fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.FONT_WEIGHT,
                textDecoration: 'none',
                fontFamily: "'Lexend', sans-serif",
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <Typography
                sx={{
                  color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.COLOR,
                  fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.FONT_SIZE,
                  fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.FONT_WEIGHT,
                  fontFamily: "'Lexend', sans-serif",
                }}
              >
                {REPORTS_LABELS.DAILY_SALES_REPORT.LINK.VIEW_DETAILED_SALES_TABLE}
              </Typography>
              <img
                src={RightArrow}
                alt="arrow"
                style={{ width: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.ARROW_SIZE, height: REPORTS_CONSTANTS.DAILY_SALES_REPORT.LINK.ARROW_SIZE }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Weekly Sales Trend Section */}
        <Grid item xs={12} md={6}>
          <Typography
            sx={{
              fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_SIZE,
              fontWeight: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.FONT_WEIGHT,
              color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.SECTION_TITLE.COLOR,
              mb: 2,
              fontFamily: "'Lexend', sans-serif",
            }}
          >
            {REPORTS_LABELS.DAILY_SALES_REPORT.SECTIONS.WEEKLY_SALES_TREND}
          </Typography>
          <Card
            sx={{
              p: 3,
              width: '100%',
              height: 'auto',
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <Box sx={{ width: '100%', height: '350px', mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <BarChart
                xAxis={[
                  {
                    data: reportData.weeklyTrend.days,
                    scaleType: 'band',
                    tickLabelStyle: {
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.WEEKLY_TREND.TICK_LABEL_FONT_SIZE,
                      fill: REPORTS_CONSTANTS.DAILY_SALES_REPORT.WEEKLY_TREND.TICK_LABEL_COLOR,
                      fontFamily: "'Lexend', sans-serif",
                    },
                    labelStyle: {
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.WEEKLY_TREND.TICK_LABEL_FONT_SIZE,
                      fill: REPORTS_CONSTANTS.DAILY_SALES_REPORT.WEEKLY_TREND.TICK_LABEL_COLOR,
                      fontFamily: "'Lexend', sans-serif",
                    },
                  },
                ]}
                yAxis={[
                  {
                    tickLabelStyle: {
                      fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.WEEKLY_TREND.TICK_LABEL_FONT_SIZE,
                      fill: REPORTS_CONSTANTS.DAILY_SALES_REPORT.WEEKLY_TREND.TICK_LABEL_COLOR,
                      fontFamily: "'Lexend', sans-serif",
                    },
                    min: 0,
                    max: maxBills,
                    tickInterval: [0, Math.floor(maxBills / 3), Math.floor((maxBills * 2) / 3), maxBills],
                  },
                ]}
                series={[
                  {
                    data: reportData.weeklyTrend.inpatient,
                    label: 'In Patient',
                    color: '#3B82F6',
                    stack: 'total',
                  },
                  {
                    data: reportData.weeklyTrend.outpatient,
                    label: 'Out Patient',
                    color: '#10B981',
                    stack: 'total',
                  },
                ]}
                width={650}
                height={320}
                margin={{ top: 20, bottom: 60, left: 50, right: 10 }}
                grid={{ vertical: false, horizontal: true }}
                sx={{
                  '& .MuiChartsAxis-root': {
                    stroke: '#6B7280',
                    strokeWidth: 1,
                  },
                  '& .MuiChartsAxis-line': {
                    stroke: '#6B7280',
                    strokeWidth: 1,
                  },
                  '& .MuiChartsAxis-tick': {
                    stroke: '#6B7280',
                    strokeWidth: 1,
                  },
                  '& .MuiChartsGrid-root': {
                    stroke: '#E5E7EB',
                    strokeDasharray: 'none',
                  },
                }}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

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

export default Reports;
