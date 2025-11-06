import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

export interface PharmaDatePickerProps {
  value: Dayjs | null;
  onChange: (newValue: Dayjs | null) => void;
  placeholder?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disabled?: boolean;
  width?: number | string;
  error?: boolean;
}

const PharmaDatePicker: React.FC<PharmaDatePickerProps> = ({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  minDate,
  maxDate,
  disabled = false,
  width = 150,
  error = false,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        openTo="day"
        views={["year", "month", "day"]}
        slotProps={{
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
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                    color: "#ffffff !important",
                  },
                }),
                "&.Mui-selected": {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                  },
                },
                "&:hover": {
                  ...(!isCurrentMonth && {
                    backgroundColor: "#F3E8FF !important",
                    color: "#5C17E5 !important",
                  }),
                },
              },
            };
          },
          yearButton: (ownerState) => {
            const year = (ownerState as any).year;
            const value = (ownerState as any).value;
            const yearValue = year || value;
            const isCurrentYear = yearValue && dayjs.isDayjs(yearValue) && 
              yearValue.isSame(dayjs(), 'year');
            return {
              sx: {
                fontSize: "14px !important",
                ...(isCurrentYear && {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                    color: "#ffffff !important",
                  },
                }),
                "&.Mui-selected": {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                  },
                },
                "&:hover": {
                  ...(!isCurrentYear && {
                    backgroundColor: "#F3E8FF !important",
                    color: "#5C17E5 !important",
                  }),
                },
              },
            };
          },
          textField: {
            size: "small",
            placeholder,
            error: error,
            sx: {
              width,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                height: "48px",
                backgroundColor: "#ffffff",
                outline: "none !important",
                "& fieldset": { 
                  borderColor: error ? "#EF4444" : "transparent",
                  borderWidth: "1px",
                },
                "&:hover fieldset": { 
                  borderColor: error ? "#EF4444" : "transparent",
                  borderWidth: "1px",
                },
                "&.Mui-focused fieldset": { 
                  borderColor: error ? "#EF4444" : "#5C17E5",
                  borderWidth: "1px",
                  outline: "none !important",
                },
                "&.Mui-focused": {
                  outline: "none !important",
                },
                "&.Mui-error fieldset": {
                  borderColor: "#EF4444",
                  borderWidth: "1px",
                },
                "&.MuiPickersInputBase-root": {
                  borderRadius: "12px!important",
                  backgroundColor: "#ffffff",
                 
                
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "12px 16px",
                fontFamily: "Lexend",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#728197",
              },
              "& .MuiOutlinedInput-input::placeholder": {
                color: "#728197",
                opacity: 1,
              },
            },
          },
          popper: {
            placement: "bottom-start",
            sx: {
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
                height: "300px !important",
                minHeight: "300px !important",
              },
              "& .MuiYearCalendar-root": {
                width: "242px",
                maxWidth: "242px",
                height: "223px",
              },
              "& .MuiPickersYear-root": {
                borderRadius: "20px",
                padding: "8px 16px",
                fontSize: "14px !important",
                "&.Mui-selected": {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  borderRadius: "20px",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                  },
                },
                "&:hover": {
                  backgroundColor: "#F3E8FF !important",
                  color: "#5C17E5 !important",
                  borderRadius: "20px",
                },
              },
              "& .MuiMonthCalendar-root": {
                marginLeft: "-18px",
                width: "264px",
                columnGap: "38px",
              },
              "& .MuiPickersMonth-root": {
                fontSize: "14px !important",
                "&.Mui-selected": {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                  },
                },
                "&:hover": {
                  backgroundColor: "#F3E8FF !important",
                  color: "#5C17E5 !important",
                },
              },
              "& .MuiMonthCalendar-button": {
                fontSize: "14px !important",
                "&.Mui-selected": {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
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
                minHeight: "242px",
                height: "300px !important",
                width: "242px",
                maxWidth: "242px",
              },
              "& .MuiPickersCalendarHeader-root": {
                padding: "0 8px 16px 8px",
                width:"242px",
                marginTop:"-6px",


                "& .MuiPickersCalendarHeader-labelContainer": {
                  "& .MuiPickersCalendarHeader-label": {
                    fontFamily: "Lexend",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#202B3C",
                    width:"242px",

                  },
                },
                "& .MuiIconButton-root": {
                  color: "#5C17E5",
                  "&:hover": {
                    backgroundColor: "#F3E8FF",
                  },
                },
              },
              "& .MuiDayCalendar-weekContainer": {
                marginBottom: "4px",
              },
              "& .MuiDayCalendar-weekDayLabel": {
                color: "#5C17E5",
                fontFamily: "Lexend",
                fontWeight: 600,
                fontSize: "12px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
              "& .MuiPickersDay-root": {
                width: "32px",
                height: "32px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1A212B",
                fontFamily: "Lexend",
                borderRadius: "50%",
                margin: "2px",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "#F3E8FF !important",
                  color: "#5C17E5 !important",
                },
                "&.Mui-selected": {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                    color: "#ffffff !important",
                  },
                },
                "&.MuiPickersDay-today": {
                  backgroundColor: "#5C17E5 !important",
                  color: "#ffffff !important",
                  border: "none",
                  "&:hover": {
                    backgroundColor: "#4A14C7 !important",
                    color: "#ffffff !important",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                    border: "none",
                    "&:hover": {
                      backgroundColor: "#4A14C7 !important",
                    },
                  },
                },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default PharmaDatePicker;


