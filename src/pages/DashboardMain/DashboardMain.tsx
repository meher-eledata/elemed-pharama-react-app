import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import dayjs, { Dayjs } from "dayjs";
import InventoryMetrics from "../../components/mainDashboard/InventoryMetrics/InventoryMetricsCard";
import DateRangeFilter from "../../components/mainDashboard/DateRangeFilter/DateRangeFilter";
import ThreeChartsComponent from "../../components/mainDashboard/Charts/SimpleAreaCharts";
import { DASHBOARD_MAIN_CONSTANTS } from "../../config/constants/DashboardMain.constants";
import { DASHBOARD_MAIN_LABELS } from "../../config/label/DashboardMain.labels";

const useSelector = (selector: any) => selector({ auth: { user: { username: "Guest" } } });

interface RootState {
  auth: {
    user: {
      username: string;
    } | null;
  };
}

const DashboardMain: React.FC = () => {
  const username = useSelector((state: RootState) => state.auth.user?.username);

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const apiDateRange = {
    startDate: dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : null,
    endDate: dateRange[1] ? dateRange[1].format("YYYY-MM-DD") : null,
  };

  return (
    <Box sx={{ minHeight: DASHBOARD_MAIN_CONSTANTS.PAGE.MIN_HEIGHT, paddingBottom: DASHBOARD_MAIN_CONSTANTS.PAGE.PADDING_BOTTOM }}>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: 'wrap',
          columnGap: '12px',
          rowGap: '12px',
          mb: 1,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontFamily: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_FAMILY,
            fontWeight: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_WEIGHT,
            fontSize: {
              xs: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_SIZE_XS,
              sm: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_SIZE_SM,
              md: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_SIZE_MD,
              lg: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_SIZE_LG,
            },
            lineHeight: DASHBOARD_MAIN_CONSTANTS.HEADER.LINE_HEIGHT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} {username}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: DASHBOARD_MAIN_CONSTANTS.TOOLBAR.GAP }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disableRipple
            disableElevation
            sx={{
              backgroundColor: DASHBOARD_MAIN_CONSTANTS.BUTTON_SECONDARY.BACKGROUND,
              textTransform: "none",
              fontFamily: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_FAMILY,
              borderRadius: DASHBOARD_MAIN_CONSTANTS.BUTTON_SECONDARY.BORDER_RADIUS,
              color: DASHBOARD_MAIN_CONSTANTS.BUTTON_SECONDARY.COLOR,
              border: DASHBOARD_MAIN_CONSTANTS.BUTTON_SECONDARY.BORDER,
              boxShadow: "none",
              mr: "8px",
              padding: DASHBOARD_MAIN_CONSTANTS.BUTTON_SECONDARY.PADDING,
              "&:hover": { backgroundColor: DASHBOARD_MAIN_CONSTANTS.BUTTON_SECONDARY.BACKGROUND, boxShadow: "none" },
              "&:focus": { backgroundColor: DASHBOARD_MAIN_CONSTANTS.BUTTON_SECONDARY.BACKGROUND },
            }}
          >
            {DASHBOARD_MAIN_LABELS.CREATE_INVOICE}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disableRipple
            disableElevation
            sx={{
              backgroundColor: DASHBOARD_MAIN_CONSTANTS.BUTTON_PRIMARY.BACKGROUND,
              textTransform: "none",
              fontFamily: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_FAMILY,
              borderRadius: DASHBOARD_MAIN_CONSTANTS.BUTTON_PRIMARY.BORDER_RADIUS,
              boxShadow: "none",
              "&:hover": { backgroundColor: DASHBOARD_MAIN_CONSTANTS.BUTTON_PRIMARY.BACKGROUND, boxShadow: "none" },
              "&:focus": { backgroundColor: DASHBOARD_MAIN_CONSTANTS.BUTTON_PRIMARY.BACKGROUND },
            }}
          >
            {DASHBOARD_MAIN_LABELS.ADD_RECEIVE}
          </Button>

        </Box>
      </Box>
       <Box sx={{ mb: '24px' }}>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </Box>
       <Box >
        <ThreeChartsComponent dateRange={apiDateRange} />
      </Box>
      <Typography sx={{ fontFamily: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_FAMILY, fontWeight: DASHBOARD_MAIN_CONSTANTS.HEADER.FONT_WEIGHT, paddingTop: '28px', paddingBottom: '12px' }}>
        {DASHBOARD_MAIN_LABELS.INVENTORY_HEADER}
      </Typography>

      <InventoryMetrics dateRange={apiDateRange} />
    </Box>
  );
};

export default DashboardMain;