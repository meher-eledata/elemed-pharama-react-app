import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import dayjs, { Dayjs } from "dayjs";
import InventoryMetrics from "../../components/mainDashboard/InventoryMetrics/InventoryMetricsCard";
import DateRangeFilter from "../../components/mainDashboard/DateRangeFilter/DateRangeFilter";
import ThreeChartsComponent from "../../components/mainDashboard/Charts/SimpleAreaCharts";

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
    <Box sx={{ minHeight: '100vh', paddingBottom: '8px' }}>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography
          sx={{
            fontFamily: "lexend",
            fontWeight: "600",
            fontSize: "36px",
          }}
        >
          Welcome {username}
        </Typography>

        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disableRipple
            disableElevation
            sx={{
              backgroundColor: "#ffffff",
              textTransform: "none",
              fontFamily: "lexend",
              borderRadius: "12px",
              color: "#525E6F",
              border: "2px solid #27313F",
              boxShadow: "none",
              mr: "8px",
              padding: "4px 18px",
              "&:hover": { backgroundColor: "#ffffff", boxShadow: "none" },
              "&:focus": { backgroundColor: "#ffffff" }, // remove focus shade
            }}
          >
            Create Invoice
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disableRipple
            disableElevation
            sx={{
              backgroundColor: "#5C17E5",
              textTransform: "none",
              fontFamily: "lexend",
              borderRadius: "12px",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#5C17E5", boxShadow: "none" },
              "&:focus": { backgroundColor: "#5C17E5" },
            }}
          >
            Add Receive
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
      <Typography sx={{ fontFamily: 'lexend', fontWeight: '600', paddingTop: '24px', paddingBottom: '12px' }}>
        Inventory & key Metrics
      </Typography>

      <InventoryMetrics dateRange={apiDateRange} />
    </Box>
  );
};

export default DashboardMain;
