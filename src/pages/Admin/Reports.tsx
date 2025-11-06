import React, { useState, useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import DateRangeFilter from '../../components/mainDashboard/DateRangeFilter/DateRangeFilter';
import ThreeChartsComponent from '../../components/mainDashboard/Charts/SimpleAreaCharts';
import InventoryMetrics from '../../components/mainDashboard/InventoryMetrics/InventoryMetricsCard';
import { REPORTS_LABELS } from '../../config/label/Reports.labels';
import { REPORTS_CONSTANTS } from '../../config/constants/Reports.constants';
import { DASHBOARD_MAIN_LABELS } from '../../config/label/DashboardMain.labels';
import { DASHBOARD_MAIN_CONSTANTS } from '../../config/constants/DashboardMain.constants';

type TabType = 'kpi' | 'detailed';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('kpi');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const apiDateRange = useMemo(() => ({
    startDate: dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null,
    endDate: dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null,
  }), [dateRange]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <Box sx={{ paddingBottom: REPORTS_CONSTANTS.PAGE.PADDING_BOTTOM }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {REPORTS_LABELS.PAGE_TITLE}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          display: 'inline-flex',
          gap: REPORTS_CONSTANTS.TABS.GAP,
          mb: 3,
        }}
      >
        <Button
          onClick={() => handleTabChange('kpi')}
          sx={{
            backgroundColor:
              activeTab === 'kpi'
                ? REPORTS_CONSTANTS.TABS.BUTTON.ACTIVE_BG
                : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_BG,
            color:
              activeTab === 'kpi'
                ? REPORTS_CONSTANTS.TABS.BUTTON.ACTIVE_COLOR
                : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_COLOR,
            border:
              activeTab === 'kpi'
                ? 'none'
                : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_BORDER,
            borderRadius: REPORTS_CONSTANTS.TABS.BUTTON.BORDER_RADIUS,
            textTransform: 'none',
            fontWeight: REPORTS_CONSTANTS.TABS.BUTTON.FONT_WEIGHT,
            fontSize: REPORTS_CONSTANTS.TABS.BUTTON.FONT_SIZE,
            padding: '8px 16px',
            minWidth: REPORTS_CONSTANTS.TABS.BUTTON.MIN_WIDTH,
            height: REPORTS_CONSTANTS.TABS.BUTTON.HEIGHT,
            '&:hover': {
              backgroundColor:
                activeTab === 'kpi'
                  ? '#4C14C7'
                  : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_BG,
            },
          }}
        >
          {REPORTS_LABELS.TABS.KPI}
        </Button>
        <Button
          onClick={() => handleTabChange('detailed')}
          sx={{
            backgroundColor:
              activeTab === 'detailed'
                ? REPORTS_CONSTANTS.TABS.BUTTON.ACTIVE_BG
                : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_BG,
            color:
              activeTab === 'detailed'
                ? REPORTS_CONSTANTS.TABS.BUTTON.ACTIVE_COLOR
                : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_COLOR,
            border:
              activeTab === 'detailed'
                ? 'none'
                : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_BORDER,
            borderRadius: REPORTS_CONSTANTS.TABS.BUTTON.BORDER_RADIUS,
            textTransform: 'none',
            fontWeight: REPORTS_CONSTANTS.TABS.BUTTON.FONT_WEIGHT,
            fontSize: REPORTS_CONSTANTS.TABS.BUTTON.FONT_SIZE,
            padding: '8px 16px',
            minWidth: REPORTS_CONSTANTS.TABS.BUTTON.MIN_WIDTH,
            height: REPORTS_CONSTANTS.TABS.BUTTON.HEIGHT,
            '&:hover': {
              backgroundColor:
                activeTab === 'detailed'
                  ? '#4C14C7'
                  : REPORTS_CONSTANTS.TABS.BUTTON.INACTIVE_BG,
            },
          }}
        >
          {REPORTS_LABELS.TABS.DETAILED_VIEW}
        </Button>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 'kpi' && (
          <Box
            sx={{
              contain: 'layout style paint',
              willChange: 'auto',
            }}
          >
            {/* Date Range Filter */}
            <Box sx={{ mb: '24px' }}>
              <DateRangeFilter
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </Box>

            {/* Sales Contracts Section */}
            <Box>
              <ThreeChartsComponent dateRange={apiDateRange} />
            </Box>

            {/* Inventory & Key Metrics Section */}
            <Typography
              sx={{
                fontFamily: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_FAMILY,
                fontWeight: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_WEIGHT,
                paddingTop: '28px',
                paddingBottom: '12px',
              }}
            >
              {DASHBOARD_MAIN_LABELS.INVENTORY_HEADER}
            </Typography>

            <InventoryMetrics dateRange={apiDateRange} />
          </Box>
        )}

        {activeTab === 'detailed' && (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: '#728197',
              border: '1px dashed #D1D5DB',
              borderRadius: '8px',
            }}
          >
            <Typography variant="body1">
              Detailed View Reports will be implemented here once the UI design is provided.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Reports;
