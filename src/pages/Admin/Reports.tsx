import React, { useState } from 'react';
import { Box, Typography, Card, Grid, Stack } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useNavigate } from 'react-router-dom';
import { REPORTS_LABELS } from '../../config/label/Reports.labels';
import { REPORTS_CONSTANTS } from '../../config/constants/Reports.constants';
import { PharmaDatePicker } from '../../components/Common';
import { StandardButton } from '../../components/Common';
import RightArrow from '../../assets/Right.svg';

const Reports: React.FC = () => {
  return (
    <Box sx={{ paddingBottom: REPORTS_CONSTANTS.PAGE.PADDING_BOTTOM }}>
      <DailySalesReport />
    </Box>
  );
};

const DailySalesReport: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  const reportData = {
    totalBills: 24,
    totalSales: 18007,
    totalDiscount: 0,
    totalTaxCollected: 1891.36,
    cashSales: {
      amount: 4993,
      bills: 4,
    },
    otherSales: {
      amount: 0,
      bills: 20,
    },
    cardSales: {
      amount: 3000,
      bills: 8,
    },
    upiSales: {
      amount: 2500,
      bills: 6,
    },
    insuranceSales: {
      amount: 1500,
      bills: 2,
    },
    paymentTypeData: [
      { id: 0, value: 4993, label: 'Cash', color: '#3B82F6' },
      { id: 1, value: 3000, label: 'Card', color: '#EF4444' },
      { id: 2, value: 2500, label: 'UPI', color: '#F59E0B' },
      { id: 3, value: 6514, label: 'X%', color: '#60A5FA' },
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
    },
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate total for percentage calculation
  const totalPaymentValue = reportData.paymentTypeData.reduce((sum, item) => sum + item.value, 0);

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
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {reportData.totalBills}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
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
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.totalSales)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
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
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.totalDiscount)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.PADDING,
              borderRadius: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER_RADIUS,
              boxShadow: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BOX_SHADOW,
              border: REPORTS_CONSTANTS.DAILY_SALES_REPORT.CARD.BORDER,
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
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {formatCurrency(reportData.totalTaxCollected)}
            </Typography>
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
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.cashSales.bills} bills
                </Typography>
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
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.otherSales.bills} bills
                </Typography>
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
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.cardSales.bills} bills
                </Typography>
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
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.upiSales.bills} bills
                </Typography>
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
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.SALES.FROM_BILLS} {reportData.insuranceSales.bills} bills
                </Typography>
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
                '& .MuiChartsLegend-root': {
                  display: 'none !important',
                },
                '& .MuiChartsLegend-container': {
                  display: 'none !important',
                },
              }}
            >
              <PieChart
                series={[
                  {
                    data: reportData.paymentTypeData,
                    innerRadius: 50,
                    outerRadius: 80,
                    paddingAngle: 0,
                    cornerRadius: 0,
                    arcLabel: (item) => {
                      const percentage = ((item.value / totalPaymentValue) * 100).toFixed(1);
                      return `${percentage}%`;
                    },
                    arcLabelMinAngle: 5,
                    arcLabelRadius: 58,
                  },
                ]}
                width={200}
                height={200}
                margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                sx={{
                  '& .MuiChartsPie-arcLabel': {
                    fontSize: '10px',
                    fontWeight: 600,
                    fill: '#1A212B',
                    fontFamily: "'Lexend', sans-serif",
                  },
                }}
              />
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

      {/* Tax Summary and Weekly Sales Trend */}
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
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_COLOR,
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
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_COLOR,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.TAX.CGST}
                </Typography>
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
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_COLOR,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.TAX.SGST}
                </Typography>
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
                <Typography
                  sx={{
                    fontSize: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_FONT_SIZE,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.TAX_SUMMARY.LABEL_COLOR,
                    fontFamily: "'Lexend', sans-serif",
                  }}
                >
                  {REPORTS_LABELS.DAILY_SALES_REPORT.TAX.IGST}
                </Typography>
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
                    data: reportData.weeklyTrend.values,
                    color: REPORTS_CONSTANTS.DAILY_SALES_REPORT.WEEKLY_TREND.CHART_COLOR,
                  },
                ]}
                width={475}
                height={200}
                margin={{ top: 10, bottom: 30, left: 40, right: 20 }}
                grid={{ vertical: false, horizontal: true }}
                sx={{
                  '& .MuiChartsAxis-root': {
                    stroke: '#6B7280',
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

    </Box>
  );
};

export default Reports;
