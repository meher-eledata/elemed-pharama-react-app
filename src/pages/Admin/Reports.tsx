import React, { useState, Suspense, lazy, useRef, useMemo } from 'react';
import { Box, Typography, Card, Grid, Stack, CircularProgress, Tooltip, Button } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { BarChart } from '@mui/x-charts/BarChart';
import { useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import { CSVLink } from 'react-csv';
import { REPORTS_LABELS } from '../../config/label/Reports.labels';
import { REPORTS_CONSTANTS } from '../../config/constants/Reports.constants';
import { PharmaDatePicker } from '../../components/Common';
import { StandardButton } from '../../components/Common';
import RightArrow from '../../assets/Right.svg';
import DashboardMain from '../DashboardMain/DashboardMain';

// Lazy-loaded Pie Chart Component
const PaymentTypePieChart = lazy(() => import('../../components/Charts/PaymentTypePieChart'));

type ReportTab = 'kpis' | 'detailed';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('kpis');

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
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportCards = [
    {
      id: 'daily-sales',
      title: 'Daily Sales Report',
      description: 'View detailed daily sales information including payment methods, taxes, and trends',
    },
  ];

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
              onClick={() => setSelectedReport(report.id)}
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

  const reportData = {
    totalBills: 24,
    totalSales: 18007,
    totalDiscount: 0,
    totalTaxCollected: 1891.36,
    totalBillsBreakdown: {
      inpatient: 10,
      outpatient: 14,
    },
    totalSalesBreakdown: {
      inpatient: 8500,
      outpatient: 9507,
    },
    totalDiscountBreakdown: {
      inpatient: 0,
      outpatient: 0,
    },
    totalTaxCollectedBreakdown: {
      inpatient: 892.50,
      outpatient: 998.86,
    },
    cashSales: {
      amount: 4993,
      bills: 4,
      breakdown: {
        inpatient: 2000,
        outpatient: 2993,
      },
    },
    otherSales: {
      amount: 0,
      bills: 20,
      breakdown: {
        inpatient: 0,
        outpatient: 0,
      },
    },
    cardSales: {
      amount: 3000,
      bills: 8,
      breakdown: {
        inpatient: 1500,
        outpatient: 1500,
      },
    },
    upiSales: {
      amount: 2500,
      bills: 6,
      breakdown: {
        inpatient: 1000,
        outpatient: 1500,
      },
    },
    insuranceSales: {
      amount: 1500,
      bills: 2,
      breakdown: {
        inpatient: 800,
        outpatient: 700,
      },
    },
    paymentTypeData: [
      { id: 0, value: 4993, label: 'Cash', color: '#3B82F6' },
      { id: 1, value: 3000, label: 'Card', color: '#EF4444' },
      { id: 2, value: 2500, label: 'UPI', color: '#F59E0B' },
      { id: 3, value: 6514, label: 'Insurance', color: '#60A5FA' },
      { id: 4, value: 1000, label: 'Credit', color: '#9CA3AF' },
    ],
    taxSummary: {
      totalTax: 891.36,
      cgst: 945.68,
      sgst: 95,
      igst: 0,
    },
    weeklyTrend: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [28, 30, 26, 32, 38, 36, 50],
      inpatient: [12, 14, 11, 15, 18, 16, 22],
      outpatient: [16, 16, 15, 17, 20, 20, 28],
    },
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate total for percentage calculation
  const totalPaymentValue = reportData.paymentTypeData.reduce((sum, item) => sum + item.value, 0);

  // Prepare CSV data
  const csvData = useMemo(() => {
    const dateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    
    const csvRows = [
      // Summary Section
      { Section: 'Summary', Metric: 'Total Bills', Value: reportData.totalBills.toString(), Details: '' },
      { Section: 'Summary', Metric: 'Total Sales (₹)', Value: reportData.totalSales.toFixed(2), Details: '' },
      { Section: 'Summary', Metric: 'Total Discount (₹)', Value: reportData.totalDiscount.toFixed(2), Details: '' },
      { Section: 'Summary', Metric: 'Total Tax Collected (₹)', Value: reportData.totalTaxCollected.toFixed(2), Details: '' },
      { Section: '', Metric: '', Value: '', Details: '' }, // Empty row
      
      // Sales Breakdown Section
      { Section: 'Sales Breakdown', Metric: 'Cash Sales (₹)', Value: reportData.cashSales.amount.toFixed(2), Details: `From ${reportData.cashSales.bills} bills` },
      { Section: 'Sales Breakdown', Metric: 'Other Sales (₹)', Value: reportData.otherSales.amount.toFixed(2), Details: `From ${reportData.otherSales.bills} bills` },
      { Section: 'Sales Breakdown', Metric: 'Card Sales (₹)', Value: reportData.cardSales.amount.toFixed(2), Details: `From ${reportData.cardSales.bills} bills` },
      { Section: 'Sales Breakdown', Metric: 'UPI Sales (₹)', Value: reportData.upiSales.amount.toFixed(2), Details: `From ${reportData.upiSales.bills} bills` },
      { Section: 'Sales Breakdown', Metric: 'Insurance Sales (₹)', Value: reportData.insuranceSales.amount.toFixed(2), Details: `From ${reportData.insuranceSales.bills} bills` },
      { Section: '', Metric: '', Value: '', Details: '' }, // Empty row
      
      // Payment Type Breakdown
      ...reportData.paymentTypeData.map(item => ({
        Section: 'Payment Type Breakdown',
        Metric: item.label,
        Value: item.value.toFixed(2),
        Details: `${((item.value / totalPaymentValue) * 100).toFixed(2)}%`
      })),
      { Section: '', Metric: '', Value: '', Details: '' }, // Empty row
      
      // Tax Summary
      { Section: 'Tax Summary', Metric: 'Total Tax (₹)', Value: reportData.taxSummary.totalTax.toFixed(2), Details: '' },
      { Section: 'Tax Summary', Metric: 'CGST (₹)', Value: reportData.taxSummary.cgst.toFixed(2), Details: '' },
      { Section: 'Tax Summary', Metric: 'SGST (₹)', Value: reportData.taxSummary.sgst.toFixed(2), Details: '' },
      { Section: 'Tax Summary', Metric: 'IGST (₹)', Value: reportData.taxSummary.igst.toFixed(2), Details: '' },
      { Section: '', Metric: '', Value: '', Details: '' }, // Empty row
      
      // Weekly Trend
      ...reportData.weeklyTrend.days.map((day, index) => ({
        Section: 'Weekly Sales Trend',
        Metric: day,
        Value: reportData.weeklyTrend.values[index].toString(),
        Details: 'Sales count'
      })),
    ];
    
    return csvRows;
  }, [reportData, selectedDate, totalPaymentValue]);

  // Generate filename with selected date
  const csvFilename = useMemo(() => {
    const dateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    return `daily_sales_report_${dateStr}.csv`;
  }, [selectedDate]);

  const handleDownloadCSV = () => {
    csvLinkRef.current?.link?.click();
  };

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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
              {REPORTS_LABELS.DAILY_SALES_REPORT.METRICS.TOTAL_TAX_COLLECTED}
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
              {formatCurrency(reportData.totalTaxCollected)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
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
            {/* Cash Sales Card */}
            <Grid item xs={12} sm={6} md={6}>
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
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.CASH_SALES}
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
                  {formatCurrency(reportData.cashSales.amount)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_COLOR,
                    mb: 1,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.cashSales.bills} bills
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

            {/* Other Sales Card */}
            <Grid item xs={12} sm={6} md={6}>
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
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.OTHER_SALES}
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
                  {formatCurrency(reportData.otherSales.amount)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_COLOR,
                    mb: 1,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.otherSales.bills} bills
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#3B82F6',
                    }}
                  >
                    In Patient: {formatCurrency(reportData.otherSales.breakdown.inpatient)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#10B981',
                    }}
                  >
                    Out Patient: {formatCurrency(reportData.otherSales.breakdown.outpatient)}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Card Sales Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.PADDING,
                  borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
                  boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
                  border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
                  height: '100%',
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
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.CARD_SALES}
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
                  {formatCurrency(reportData.cardSales.amount)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_COLOR,
                    mb: 1,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.cardSales.bills} bills
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#3B82F6',
                    }}
                  >
                    In Patient: {formatCurrency(reportData.cardSales.breakdown.inpatient)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#10B981',
                    }}
                  >
                    Out Patient: {formatCurrency(reportData.cardSales.breakdown.outpatient)}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* UPI Sales Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.PADDING,
                  borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
                  boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
                  border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
                  height: '100%',
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
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.UPI_SALES}
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
                  {formatCurrency(reportData.upiSales.amount)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_COLOR,
                    mb: 1,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.upiSales.bills} bills
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#3B82F6',
                    }}
                  >
                    In Patient: {formatCurrency(reportData.upiSales.breakdown.inpatient)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#10B981',
                    }}
                  >
                    Out Patient: {formatCurrency(reportData.upiSales.breakdown.outpatient)}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Insurance Sales Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.PADDING,
                  borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
                  boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
                  border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
                  height: '100%',
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
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.INSURANCE_SALES}
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
                  {formatCurrency(reportData.insuranceSales.amount)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.SALES_CARD.SUBTEXT_COLOR,
                    mb: 1,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.insuranceSales.bills} bills
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#3B82F6',
                    }}
                  >
                    In Patient: {formatCurrency(reportData.insuranceSales.breakdown.inpatient)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontFamily: "'Lexend', sans-serif",
                      color: '#10B981',
                    }}
                  >
                    Out Patient: {formatCurrency(reportData.insuranceSales.breakdown.outpatient)}
                  </Typography>
                </Box>
              </Card>
            </Grid>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start', ml: 6, mr: 5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Suspense
                fallback={
                  <Box
                    sx={{
                      width: 220,
                      height: 220,
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
            </Box>
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {reportData.paymentTypeData.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                        color: '#1A212B',
                        fontFamily: "'Lexend', sans-serif",
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pb: 1,
                  borderBottom: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.BORDER_BOTTOM,
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
            <Box sx={{ width: '100%', height: '160px', mt: 1 }}>
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
                    max: 60,
                    tickInterval: [0, 20, 40, 60],
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
                width={475}
                height={200}
                margin={{ top: 10, bottom: 50, left: 40, right: 20 }}
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
