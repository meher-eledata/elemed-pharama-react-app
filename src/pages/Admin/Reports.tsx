import React, { useState, Suspense, lazy, useRef, useMemo } from 'react';
import { Box, Typography, Card, Grid, Stack, CircularProgress, Tooltip } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { REPORTS_LABELS } from '../../config/label/Reports.labels';
import { REPORTS_CONSTANTS } from '../../config/constants/Reports.constants';
import { ADMIN_REPORTS_CONSTANTS } from '../../config/constants/AdminReports.constants';
import { SUPPLIER_RECEIPT_REPORT_LABELS } from '../../config/label/SupplierReceiptReport.labels';
import { SUPPLIER_PAYMENT_REPORT_LABELS } from '../../config/label/SupplierPaymentReport.labels';
import { PRODUCT_SALES_REPORT_LABELS } from '../../config/label/ProductSalesReport.labels';
import { SALES_TAX_REPORT_LABELS } from '../../config/label/SalesTaxReport.labels';
import { SUPPLIER_TAX_REPORT_LABELS } from '../../config/label/SupplierTaxReport.labels';
import { StandardButton } from '../../components/Common';
import {
  BackLink,
  ReportHeader,
  ReportSwitcher,
  ReportLoading,
  ReportError,
  PieLegend,
} from '../../components/AdminReports/ReportShared';
import ReportBarChart from '../../components/AdminReports/ReportBarChart';
import DashboardMain from '../DashboardMain/DashboardMain';
import DetailedSalesTable, { DetailedSalesTableHandle } from './DetailedSalesTable';
import { useGetDailySalesReportQuery, useGetDailySalesTableQuery } from '../../redux/slices/reportsApi';
import { formatWholeCurrency, defaultDateRange, toNum, seriesByDate, isReturnRow } from '../../utils/reportFormat';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';

// Lazy-loaded Pie Chart Component
const PaymentTypePieChart = lazy(() => import('../../components/Charts/PaymentTypePieChart'));

type ReportTab = 'kpis' | 'detailed';
type SalesReportTab = 'overview' | 'invoice';

const Reports: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ReportTab>(
    (location.state as any)?.activeTab === 'detailed' ? 'detailed' : 'kpis'
  );
  const [selectedReport, setSelectedReport] = useState<string | null>(
    (location.state as any)?.selectedReport || null
  );
  // Consumed once from router state (legacy /admin/reports/detailed-sales deep link);
  // re-opening from the grid always starts on Overview.
  const [salesInitialTab, setSalesInitialTab] = useState<SalesReportTab>(
    (location.state as any)?.salesTab === 'invoice' ? 'invoice' : 'overview'
  );

  // A report is open — hide the landing tab pair, show only a back link + the report.
  if (selectedReport === 'daily-sales') {
    return (
      <Box sx={{ paddingBottom: REPORTS_CONSTANTS.PAGE.PADDING_BOTTOM }}>
        <BackLink onClick={() => setSelectedReport(null)} />
        <DailySalesReport initialTab={salesInitialTab} />
      </Box>
    );
  }

  return (
    <Box sx={{ paddingBottom: REPORTS_CONSTANTS.PAGE.PADDING_BOTTOM }}>
      <ReportSwitcher
        active={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'kpis', label: REPORTS_LABELS.TABS.KPIS },
          { value: 'detailed', label: REPORTS_LABELS.TABS.DETAILED_REPORTS },
        ]}
      />

      {activeTab === 'kpis' ? (
        <DashboardMain hideButtons={true} />
      ) : (
        <DetailedReportsView
          onOpenDailySales={() => {
            setSalesInitialTab('overview');
            setSelectedReport('daily-sales');
          }}
        />
      )}
    </Box>
  );
};

const DetailedReportsView: React.FC<{ onOpenDailySales: () => void }> = ({ onOpenDailySales }) => {
  const navigate = useNavigate();

  const reportCards: {
    id: string;
    title: string;
    description: string;
    route?: string;
  }[] = [
    {
      id: 'daily-sales',
      title: REPORTS_LABELS.DAILY_SALES_REPORT.DISCOVERY_CARD.TITLE,
      description: REPORTS_LABELS.DAILY_SALES_REPORT.DISCOVERY_CARD.DESCRIPTION,
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
      onOpenDailySales();
    }
  };

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
                {REPORTS_LABELS.CARD_ACTION}
              </StandardButton>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const DailySalesReport: React.FC<{ initialTab?: SalesReportTab }> = ({ initialTab = 'overview' }) => {
  const [tab, setTab] = useState<SalesReportTab>(initialTab);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [startDate, endDate] = dateRange;
  const tableRef = useRef<DetailedSalesTableHandle>(null);
  const [invoiceCanDownload, setInvoiceCanDownload] = useState(false);
  const csvLinkRef = useRef<any>(null);
  const [logDownload] = useLogDownloadMutation();

  const { data: apiData, isLoading, isError, refetch } = useGetDailySalesReportQuery(
    {
      start_date: (startDate ?? dayjs()).format('YYYY-MM-DD'),
      end_date: (endDate ?? dayjs()).format('YYYY-MM-DD'),
    },
    {
      skip: !startDate || !endDate,
      refetchOnMountOrArgChange: true
    }
  );

  // Same args as the Invoice-wise child's query — RTK Query dedupes the fetch.
  const { data: tableData } = useGetDailySalesTableQuery(
    {
      start_date: (startDate ?? dayjs()).format('YYYY-MM-DD'),
      end_date: (endDate ?? dayjs()).format('YYYY-MM-DD'),
    },
    {
      skip: !startDate || !endDate,
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
    };
  }, [apiData]);

  // Range-honoring per-day net sales, derived from the invoice-level table rows
  // (returns/refunds subtract, matching the Invoice-wise table's sign convention).
  const salesByDate = useMemo(() => {
    const rows = (tableData ?? []).map((item) => ({
      date: item.transaction_date,
      value: toNum(item.total_amount) * (isReturnRow(item.transaction_type) ? -1 : 1),
    }));
    return seriesByDate(rows, (r) => r.date, (r) => r.value);
  }, [tableData]);

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

  // Overview summary CSV (Summary / Sales Breakdown / Payment Type / Tax Summary rows).
  const csvData = useMemo(() => {
    if (!reportData) return [];

    const csvRows = [
      // Summary Section
      { Section: 'Summary', Metric: 'Total Bills', Value: reportData.totalBills.toString(), Details: '' },
      { Section: 'Summary', Metric: 'Total Sales (₹)', Value: reportData.totalSales.toFixed(0), Details: '' },
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

  // Generate filename with selected date range
  const csvFilename = useMemo(() => {
    const s = (startDate ?? dayjs()).format('YYYY-MM-DD');
    const e = (endDate ?? dayjs()).format('YYYY-MM-DD');
    return s === e ? `sales_report_${s}.csv` : `sales_report_${s}_to_${e}.csv`;
  }, [startDate, endDate]);

  const handleOverviewDownloadCSV = () => {
    if (!csvLinkRef.current?.link || !csvData.length) return;
    csvLinkRef.current.link.click();
    logDownload({ category: 'report', name: 'Sales Report', format: 'csv', count: csvData.length }).catch(() => {});
  };

  return (
    <Box>
      <ReportHeader
        title={REPORTS_LABELS.DAILY_SALES_REPORT.TITLE}
        subtitle={REPORTS_LABELS.DAILY_SALES_REPORT.SUBTITLE}
        downloadLabel={REPORTS_LABELS.DAILY_SALES_REPORT.DOWNLOAD_CSV}
        // Each tab keeps its own export: the Overview summary CSV (a pre-existing
        // feature) and the Invoice-wise table CSV.
        onDownloadCsv={
          tab === 'invoice' ? () => tableRef.current?.downloadCsv() : handleOverviewDownloadCSV
        }
        downloadDisabled={tab === 'invoice' ? !invoiceCanDownload : !reportData}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <ReportSwitcher
        active={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: REPORTS_LABELS.DAILY_SALES_REPORT.TABS.OVERVIEW },
          { value: 'invoice', label: REPORTS_LABELS.DAILY_SALES_REPORT.TABS.INVOICE },
        ]}
      />

      {tab === 'invoice' ? (
        <DetailedSalesTable
          ref={tableRef}
          startDate={startDate}
          endDate={endDate}
          onCanDownloadChange={setInvoiceCanDownload}
        />
      ) : isLoading ? (
        <ReportLoading />
      ) : isError || !reportData ? (
        <ReportError
          message={ADMIN_REPORTS_CONSTANTS.STATES.ERROR}
          retryLabel={ADMIN_REPORTS_CONSTANTS.STATES.RETRY}
          onRetry={refetch}
        />
      ) : (
        <Box>
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
              {/* Whole-rupee: backend ROUND-then-SUMs invoice grand totals */}
              {formatWholeCurrency(reportData.totalSales)}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#3B82F6',
                }}
              >
                In Patient: {formatWholeCurrency(reportData.totalSalesBreakdown.inpatient)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Lexend', sans-serif",
                  color: '#10B981',
                }}
              >
                Out Patient: {formatWholeCurrency(reportData.totalSalesBreakdown.outpatient)}
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
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {totalPaymentValue > 0 ? (
              <>
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
                <PieLegend
                  items={sortedPaymentData.map((item) => ({
                    id: item.id,
                    label: item.label,
                    color: item.color,
                    value: `${((item.value / totalPaymentValue) * 100).toFixed(1)}%`,
                  }))}
                />
              </>
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
        </Grid>

        {/* Sales by Date Section */}
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
            {REPORTS_LABELS.DAILY_SALES_REPORT.SECTIONS.SALES_BY_DATE}
          </Typography>
          <ReportBarChart
            categories={salesByDate.categories}
            values={salesByDate.values}
            seriesLabel={REPORTS_LABELS.DAILY_SALES_REPORT.CHART.SERIES_SALES}
            emptyMessage={REPORTS_LABELS.DAILY_SALES_REPORT.CHART.EMPTY}
            xAxisLabel={REPORTS_LABELS.DAILY_SALES_REPORT.CHART.AXIS_DATE}
            yAxisLabel={REPORTS_LABELS.DAILY_SALES_REPORT.CHART.SERIES_SALES}
            currency
          />
        </Grid>
      </Grid>
        </Box>
      )}

      {/* Hidden CSV Link (Overview summary export) */}
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
