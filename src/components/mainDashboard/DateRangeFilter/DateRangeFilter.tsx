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
import dayjs from "dayjs";
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
      // Auto-advance: the next click picks the END date. Without this, two clicks in a
      // row silently overwrote the start date.
      setEditing("end");
    } else {
      if (!start || newDate.isBefore(start, "day")) {
        // An end before the start becomes the new start — so the next click is the end.
        onDateRangeChange([newDate, null]);
        setEditing("end");
      } else {
        onDateRangeChange([start, newDate]);
        setOpen(false);
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "transparent",
        borderRadius: DATE_RANGE_CONSTANTS.CONTAINER_RADIUS,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1,
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
          border: open ? "2px solid #728197" : DATE_RANGE_CONSTANTS.BOX_BORDER,
          borderRadius: DATE_RANGE_CONSTANTS.BOX_RADIUS,
          padding: DATE_RANGE_CONSTANTS.BOX_PADDING,
          cursor: "pointer",
          width: DATE_RANGE_CONSTANTS.BOX_WIDTH,
          height: '40px',
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          fontFamily: DATE_RANGE_CONSTANTS.FONT_FAMILY,
          fontSize: DATE_RANGE_CONSTANTS.FONT_SIZE,
          boxSizing: "border-box",
          transition: "border-color 0.2s ease",
          "&:hover": {
            border: open ? "2px solid #728197" : DATE_RANGE_CONSTANTS.BOX_BORDER,
          },
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
        style={{ zIndex: 9999 }}
        disablePortal={false}
        modifiers={[
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              rootBoundary: 'viewport',
              tether: false,
            },
          },
          {
            name: 'flip',
            enabled: true,
          },
        ]}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper
            sx={{
              mt: 1,
              p: 2,
              boxShadow: 3,
              borderRadius: DATE_RANGE_CONSTANTS.BOX_RADIUS,
              overflow: "visible",
              overflowY: "visible",
              overflowX: "visible",
              width: "242px",
              maxWidth: "242px",
              minWidth: "272px",
              // Sized by its content, floored at the old fixed height: a month spanning SIX
              // calendar weeks (e.g. August 2026) used to render its last row outside the card.
              // The day grid below reserves six rows, so the card height never changes between
              // months — only between the day / month / year views.
              height: "auto",
              minHeight: "312px",
              position: "relative",
              zIndex: 9999,
              "&::-webkit-scrollbar": {
                display: "none !important",
                width: "0 !important",
                height: "0 !important",
              },
              scrollbarWidth: "none !important",
              msOverflowStyle: "none !important",
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
              views={["year", "month", "day"]}
              sx={
                {
                  "& .MuiPaper-root": {
                    borderRadius: "12px",
                    border: "1px solid #E6ECF5",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "16px",
                    width: "242px",
                    maxWidth: "242px",
                    minWidth: "242px",
                    height: "300px !important",
                    minHeight: "300px !important",
                  },
                  "& .MuiDayCalendar-root": {
                    width: "242px",
                    maxWidth: "242px",
                    marginTop:"-6px",
                  },
                  "& .MuiYearCalendar-root": {
                    marginLeft: "-20px",
                    width: "273px"
                  },
                  "& .MuiPickersYear-root": {
                    borderRadius: "20px",
                    padding: "8px 16px",
                    fontSize: "14px !important",
                    "&.Mui-selected": {
                      backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                      color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                      borderRadius: "20px",
                      "&:hover": {
                        backgroundColor: "#4A14C7 !important",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "#F3E8FF",
                      color: DATE_RANGE_CONSTANTS.DATE_SELECTED_BG,
                      borderRadius: "20px",
                    },
                  },
                  "& .MuiMonthCalendar-root": {
                    marginLeft: "-16px",
                    width: "283px",
                    columnGap: "38px",
                    padding:"-2px",
                  },
                  "& .MuiPickersMonth-root": {
                    fontSize: "14px !important",
                    "&.Mui-selected": {
                      backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                      color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                      "&:hover": {
                        backgroundColor: "#4A14C7 !important",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "#F3E8FF",
                      color: DATE_RANGE_CONSTANTS.DATE_SELECTED_BG,
                    },
                  },
                  "& .MuiMonthCalendar-button": {
                    fontSize: "14px !important",
                    "&.Mui-selected": {
                      backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                      color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                      borderRadius: "18px",
                      "&:hover": {
                        backgroundColor: "#4A14C7 !important",
                      },
                    },
                  },
                
                  "& .MuiDayCalendar-header": {
                    width: "242px",
                    marginTop:"-6px",
                  },
                  "& .MuiPickersSlideTransition-root": {
                    display: "block",
                    position: "relative",
                    overflowX: "hidden",
                    // Six week-rows: 6 * (DAY_SIZE 36 + 2 * DAY_MARGIN 2) = 240px. Reserving
                    // them keeps every month the same height and keeps the 6th week INSIDE
                    // the card; the grid is free to grow past it rather than overflow.
                    minHeight: "242px",
                    width: "242px",
                    maxWidth: "242px",
                  },
                  "& .MuiPickersCalendarHeader-root": {
                    padding: "0 8px 16px 8px",
                    width:"242px",
                    marginTop:"-6px",
                    marginLeft: "-9px",
                   
    
    
                    "& .MuiPickersCalendarHeader-labelContainer": {
                      "& .MuiPickersCalendarHeader-label": {
                        fontFamily: "'Lexend', sans-serif",
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "#202B3C",
                        width:"242px",
                        marginTop: "20px",
                      },
                    },
                    "& .MuiIconButton-root": {
                      color: "#5C17E5",
                      "&:hover": {
                        backgroundColor: "#F3E8FF",
                      },
                    },
                  },
                  overflow: "hidden !important",
                  overflowY: "hidden !important",
                  overflowX: "hidden !important",
                  maxHeight: "none !important",
                  height: "auto !important",
                  "&::-webkit-scrollbar": {
                    display: "none !important",
                    width: "0 !important",
                    height: "0 !important",
                  },
                  scrollbarWidth: "none !important",
                  msOverflowStyle: "none !important",
                  "& .MuiDayCalendar-monthContainer": {
                    overflow: "hidden !important",
                    overflowY: "hidden !important",
                    overflowX: "hidden !important",
                    maxHeight: "none !important",
                    height: "auto !important",
                  },
                  "& .MuiDayCalendar-weekDayLabel": {
                    color: DATE_RANGE_CONSTANTS.HEADER_COLOR,
                    fontWeight: 600,
                    fontSize: DATE_RANGE_CONSTANTS.HEADER_FONT_SIZE,
                  },
                  "& *": {
                    "&::-webkit-scrollbar": {
                      display: "none !important",
                      width: "0 !important",
                      height: "0 !important",
                    },
                    scrollbarWidth: "none !important",
                    msOverflowStyle: "none !important",
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
                    "&.MuiPickersDay-today": {
                      backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                      color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                      border: "none",
                      "&:hover": {
                        backgroundColor: "#4A14C7 !important",
                        color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                      },
                      "&.Mui-selected": {
                        backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                        color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                        border: "none",
                        "&:hover": {
                          backgroundColor: "#4A14C7 !important",
                        },
                      },
                    },
                    "& .MuiTouchRipple-root": {
                      display: "none",
                    },
                  },
                },
                monthButton: (ownerState) => {
                  const month = (ownerState as any).month;
                  const isCurrentMonth = month && dayjs.isDayjs(month) && 
                    month.isSame(dayjs(), 'month') && 
                    month.isSame(dayjs(), 'year');
                  return {
                    sx: {
                      fontSize: "12px !important",
                      width:"48px",
                      ...(isCurrentMonth && {
                        backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                        color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                      }),
                      "&.Mui-selected": {
                        backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                        color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                        "&:hover": {
                          backgroundColor: "#4A14C7 !important",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "#F3E8FF !important",
                        color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                      },
                    },
                  };
                },
                yearButton: {
                  sx: {
                    fontSize: "14px !important",
                    "&.Mui-selected": {
                      backgroundColor: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_BG} !important`,
                      color: `${DATE_RANGE_CONSTANTS.DATE_SELECTED_TEXT} !important`,
                      "&:hover": {
                        backgroundColor: "#4A14C7 !important",
                      },
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