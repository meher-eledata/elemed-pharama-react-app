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
import { DATE_RANGE_LABELS } from "../../../config/label/DateRange.labels";
import { DATE_RANGE_CONSTANTS } from "../../../config/constants/DateRange.constants";

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
        backgroundColor: DATE_RANGE_CONSTANTS.CONTAINER_BG,
        borderRadius: DATE_RANGE_CONSTANTS.CONTAINER_RADIUS,
        padding: DATE_RANGE_CONSTANTS.CONTAINER_PADDING,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontFamily: DATE_RANGE_CONSTANTS.FONT_FAMILY,
      }}
    >
      <Typography
        sx={{
          fontFamily: DATE_RANGE_CONSTANTS.FONT_FAMILY,
          fontWeight: "500",
          color: "#728197",
          fontSize: "12px",
        }}
      >
        {DATE_RANGE_LABELS.FILTER_TITLE}
      </Typography>
      <Box
        ref={anchorRef}
        sx={{
          border: DATE_RANGE_CONSTANTS.BOX_BORDER,
          borderRadius: DATE_RANGE_CONSTANTS.BOX_RADIUS,
          padding: DATE_RANGE_CONSTANTS.BOX_PADDING,
          cursor: "pointer",
          width: DATE_RANGE_CONSTANTS.BOX_WIDTH,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          fontFamily: DATE_RANGE_CONSTANTS.FONT_FAMILY,
          fontSize: DATE_RANGE_CONSTANTS.FONT_SIZE,
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
          {dateRange[0]
            ? dateRange[0].format("DD/MM/YYYY")
            : DATE_RANGE_LABELS.START_PLACEHOLDER}
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
          {dateRange[1]
            ? dateRange[1].format("DD/MM/YYYY")
            : DATE_RANGE_LABELS.END_PLACEHOLDER}
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
              borderRadius: DATE_RANGE_CONSTANTS.BOX_RADIUS,
            }}
          >
            <Typography
              variant="body2"
              gutterBottom
              sx={{ fontFamily: DATE_RANGE_CONSTANTS.FONT_FAMILY }}
            >
              {editing === "start"
                ? DATE_RANGE_LABELS.SELECT_START
                : DATE_RANGE_LABELS.SELECT_END}
            </Typography>
            <DateCalendar
              value={editing === "start" ? dateRange[0] : dateRange[1] || dateRange[0]}
              onChange={handleSelect}
              sx={{
                "& .MuiDayCalendar-header": {
                  color: DATE_RANGE_CONSTANTS.HEADER_COLOR,
                  fontWeight: "600",
                  fontSize: DATE_RANGE_CONSTANTS.HEADER_FONT_SIZE,
                },
                "& .MuiDayCalendar-weekDayLabel": {
                  color: DATE_RANGE_CONSTANTS.HEADER_COLOR,
                  fontWeight: 600,
                  fontSize: DATE_RANGE_CONSTANTS.HEADER_FONT_SIZE,
                },
              }}
              slotProps={{
                day: {
                  sx: {
                    "&.Mui-selected": {
                      backgroundColor: DATE_RANGE_CONSTANTS.DATE_SELECTED_BG,
                      color: DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT,
                      border: `1px solid ${DATE_RANGE_CONSTANTS.DATE_SELECTED_BORDER}`,
                    },
                    "&.Mui-selected:hover, &.Mui-selected:focus, &.Mui-selected:active": {
                      backgroundColor: DATE_RANGE_CONSTANTS.DATE_SELECTED_BG,
                      border: `1px solid ${DATE_RANGE_CONSTANTS.DATE_SELECTED_BORDER}`,
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