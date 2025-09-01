import React, { useState, useRef } from "react";
import {
  Box,
  Popper,
  Paper,
  Typography,
  ClickAwayListener,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { Dayjs } from "dayjs";

interface DateRangeFilterProps {
  dateRange: [Dayjs | null, Dayjs | null];
  onDateRangeChange: (newRange: [Dayjs | null, Dayjs | null]) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<"start" | "end">("start");
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (newDate: Dayjs | null) => {
    if (!newDate) return;
    const [start, end] = dateRange;

    if (editing === "start") {
      if (end && newDate.isAfter(end, "day")) {
        onDateRangeChange([newDate, null]);
      } else {
        onDateRangeChange([newDate, end]);
      }
    } else {
      if (!start || newDate.isBefore(start, "day")) {
        onDateRangeChange([newDate, null]);
        setEditing("start");
      } else {
        onDateRangeChange([start, newDate]);
        setOpen(false);
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#F5F5F5",
        borderRadius: "16px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontFamily: "Lexend",
      }}
    >
      <Typography
        sx={{
          fontFamily: "lexend",
          fontWeight: "500",
          color: "#728197",
          fontSize: "12px",
        }}
      >
        Filter by Dates
      </Typography>
      <Box
        ref={anchorRef}
        sx={{
          border: "1px solid #ccc",
          borderRadius: "12px",
          padding: "10px 14px",
          cursor: "pointer",
          width: "220px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          fontFamily: "lexend",
          fontSize: "14px",
        }}
      >
        <Box
          onClick={(e) => {
            setEditing("start");
            setOpen(true);
            e.stopPropagation();
          }}
          sx={{ flex: 2 }}
        >
          {dateRange[0] ? dateRange[0].format("DD/MM/YYYY") : "Start"}
        </Box>
        <Typography sx={{ mx: 2, color: "#666", flex: 3, textAlign: "center" }}>
          –
        </Typography>
        <Box
          onClick={(e) => {
            setEditing("end");
            setOpen(true);
            e.stopPropagation();
          }}
          sx={{ flex: 1 }}
        >
          {dateRange[1] ? dateRange[1].format("DD/MM/YYYY") : "End"}
        </Box>
      </Box>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper
            sx={{
              mt: 1,
              p: 2,
              boxShadow: 3,
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="body2"
              gutterBottom
              sx={{ fontFamily: "lexend" }}
            >
              {editing === "start" ? "Select Start Date" : "Select End Date"}
            </Typography>
            <DateCalendar
              value={editing === "start" ? dateRange[0] : dateRange[1] || dateRange[0]}
              onChange={handleSelect}
              sx={{
                "& .MuiDayCalendar-header": {
                  color: "#5C17E5",
                  fontWeight: "600",
                  fontSize: "14px",
                },
                "& .MuiDayCalendar-weekDayLabel": {
                  color: "#5C17E5",
                  fontWeight: 600,
                  fontSize: "14px",
                },
              }}
              slotProps={{
                day: {
                  sx: {
                    "&.Mui-selected": {
                      backgroundColor: "#5C17E5",
                      color: "#ffffff",
                      border: "1px solid #6C63FF",
                    },
                    "&.Mui-selected:hover, &.Mui-selected:focus, &.Mui-selected:active": {
                      backgroundColor: "#5C17E5",
                      border: "1px solid #6C63FF",
                    },
                    "& .MuiTouchRipple-root": {
                      display: "none",
                    },
                  },
                },
              }}
            />

          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default DateRangeFilter;
