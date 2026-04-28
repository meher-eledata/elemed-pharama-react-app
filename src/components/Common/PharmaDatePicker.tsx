import React, { useEffect, useState, useRef } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import "dayjs/locale/en-gb";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

dayjs.extend(customParseFormat);

export interface PharmaDatePickerProps {
  value: Dayjs | null;
  onChange: (newValue: Dayjs | null) => void;
  placeholder?: string;
  label?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disabled?: boolean;
  readOnly?: boolean;
  width?: number | string;
  height?: number | string;
  error?: boolean;
  useEndOfMonth?: boolean;
}

const PharmaDatePicker: React.FC<PharmaDatePickerProps> = ({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  label,
  minDate,
  maxDate,
  disabled = false,
  readOnly = true,
  width = 150,
  height = 44,
  error = false,
  useEndOfMonth = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We removed the global scroll listener that was closing the picker prematurely 
    // during view transitions (like Year to Month).
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      const popper = document.querySelector('.MuiPickersPopper-root') as HTMLElement;
      if (popper) {
        const popperInstance = (popper as any)._popper;
        if (popperInstance && popperInstance.update) {
          popperInstance.update();
        }
        window.dispatchEvent(new Event('resize'));
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    const styleId = 'pharma-datepicker-current-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Calendar popper min-width and min-height */
        .css-1rhbxvw-MuiPopper-root-MuiPickerPopper-root .MuiPaper-root,
        .css-qo1xbo-MuiPopper-root-MuiPickerPopper-root .MuiPaper-root,
        .MuiPopper-root .MuiPaper-root,
        [class*="MuiPopper-root"][class*="MuiPickerPopper-root"] .MuiPaper-root {
          min-width: 320px !important;
          min-height: 318px !important;
          overflow: visible !important;
        }
        /* Ensure calendar icon is always visible */
        .MuiPickersTextField-root .MuiInputAdornment-root,
        .MuiPickersTextField-root .MuiPickersInputAdornment-root,
        .MuiPickersTextField-root .MuiInputAdornment-positionEnd,
        .MuiPickersTextField-root .MuiPickersInputAdornment-root.MuiInputAdornment-positionEnd,
        .MuiPickersTextField-root .MuiOutlinedInput-adornedEnd .MuiInputAdornment-root,
        .MuiPickersTextField-root .MuiOutlinedInput-adornedEnd .MuiPickersInputAdornment-root {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          position: relative !important;
        }
        .MuiPickersTextField-root .MuiInputAdornment-root .MuiIconButton-root,
        .MuiPickersTextField-root .MuiPickersInputAdornment-root .MuiIconButton-root {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          color: #6B7280 !important;
        }
        .MuiPickersTextField-root .MuiInputAdornment-root .MuiIconButton-root svg,
        .MuiPickersTextField-root .MuiPickersInputAdornment-root .MuiIconButton-root svg {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 20px !important;
          height: 20px !important;
        }
        /* Table-specific: Larger icon for date picker in table */
        .MuiTableContainer-root .MuiPickersTextField-root .MuiInputAdornment-root .MuiIconButton-root svg,
        .MuiTableContainer-root .MuiPickersTextField-root .MuiPickersInputAdornment-root .MuiIconButton-root svg,
        .MuiPaper-root.MuiTableContainer-root .MuiPickersTextField-root .MuiInputAdornment-root .MuiIconButton-root svg,
        .MuiPaper-root.MuiTableContainer-root .MuiPickersTextField-root .MuiPickersInputAdornment-root .MuiIconButton-root svg {
          width: 28px !important;
          height: 28px !important;
          fontSize: 28px !important;
        }
        .pharma-current-month {
          background-color: #5C17E5 !important;
          color: #ffffff !important;
        }
        .pharma-current-month:hover {
          background-color: #4A14C7 !important;
          color: #ffffff !important;
        }
        .pharma-current-year,
        .pharma-current-year.MuiPickersYear-root,
        .MuiPickersYear-root.pharma-current-year,
        button.pharma-current-year,
        .MuiYearCalendar-root button.pharma-current-year {
          background-color: #5C17E5 !important;
          color: #ffffff !important;
        }
        .pharma-current-year:hover,
        .pharma-current-year.MuiPickersYear-root:hover,
        .MuiPickersYear-root.pharma-current-year:hover,
        button.pharma-current-year:hover,
        .MuiYearCalendar-root button.pharma-current-year:hover {
          background-color: #4A14C7 !important;
          color: #ffffff !important;
        }
        /* Override MUI DatePicker focus border color - Remove focus color */
        .MuiPickersInputBase-root.MuiPickersOutlinedInput-root.MuiPickersInputBase-colorPrimary.Mui-focused fieldset,
        .MuiPickersInputBase-root.MuiPickersOutlinedInput-root.Mui-focused fieldset,
        .MuiPickersInputBase-colorPrimary.Mui-focused fieldset,
        .MuiPickersInputBase-root.MuiPickersOutlinedInput-root.MuiPickersInputBase-colorPrimary.Mui-focused fieldset,
        [class*="MuiFormControl-root"][class*="MuiPickersTextField-root"] .MuiPickersInputBase-root.Mui-focused fieldset,
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root.Mui-focused fieldset,
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root.Mui-focused fieldset,
        .MuiPickersInputBase-root[class*="colorPrimary"].Mui-focused fieldset {
          border-color: #D1D5DB !important;
          border-width: 1px !important;
        }
        .MuiPickersInputBase-root.MuiPickersOutlinedInput-root.Mui-error.Mui-focused fieldset {
          border-color: #EF4444 !important;
          border-width: 2px !important;
        }
        /* Height for MuiFormControl-root-MuiPickersTextField-root .MuiPickersInputBase-root */
        .MuiFormControl-root.MuiPickersTextField-root .MuiPickersInputBase-root,
        [class*="MuiFormControl-root"][class*="MuiPickersTextField-root"] .MuiPickersInputBase-root {
          border-radius: 18px !important;
        }
        /* Border radius for MUI TextField classes */
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root,
        .MuiFormControl-root.MuiTextField-root .MuiOutlinedInput-root {
          border-radius: 18px !important;
        }
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root fieldset,
        .MuiFormControl-root.MuiTextField-root .MuiOutlinedInput-root fieldset {
          border-radius: 18px !important;
        }
        /* Remove outline on hover - Enhanced */
        .MuiPickersInputBase-root:hover,
        .MuiPickersInputBase-root.MuiPickersOutlinedInput-root:hover,
        .MuiOutlinedInput-root:hover,
        .MuiPickersInputBase-root:focus,
        .MuiPickersInputBase-root:focus-visible,
        .MuiOutlinedInput-root:focus,
        .MuiOutlinedInput-root:focus-visible,
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root:hover,
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root:focus,
        [class*="MuiFormControl-root"][class*="MuiTextField-root"] .MuiOutlinedInput-root:focus-visible,
        .MuiPickersInputBase-root:hover *,
        .MuiOutlinedInput-root:hover * {
          outline: none !important;
          outline-width: 0 !important;
          outline-style: none !important;
          outline-offset: 0 !important;
          box-shadow: none !important;
        }
        /* Force date picker input text color */
        .MuiPickersInputBase-root input,
        .MuiPickersInputBase-root .MuiInputBase-input,
        .MuiPickersInputBase-root .MuiPickersInputBase-input,
        .MuiPickersInputBase-root .MuiOutlinedInput-input,
        .MuiPickersInputBase-root input[type="text"],
        .MuiPickersInputBase-root input[type="tel"],
        .MuiPickersInputBase-root input[readonly],
        .MuiPickersInputBase-root.MuiPickersOutlinedInput-root input {
          color: #728197 !important;
          -webkit-text-fill-color: #728197 !important;
        }
        /* Reduce font size for smaller date pickers in tables */
        .MuiPickersInputBase-root-MuiPickersOutlinedInput-root input,
        .css-ilenfc-MuiPickersInputBase-root-MuiPickersOutlinedInput-root input {
          font-size: 12px !important;
        }
        /* Ensure text color is applied to the input value */
        .MuiPickersInputBase-root input::placeholder,
        .MuiPickersInputBase-root input::-webkit-input-placeholder,
        .MuiPickersInputBase-root input::-moz-placeholder {
          color: #728197 !important;
          opacity: 1;
          font-size: 10px !important;
        }
        /* Remove outline from fieldset on hover */
        .MuiPickersInputBase-root:hover fieldset,
        .MuiOutlinedInput-root:hover fieldset,
        .MuiPickersInputBase-root fieldset:hover,
        .MuiOutlinedInput-root fieldset:hover {
          outline: none !important;
          outline-width: 0 !important;
          outline-style: none !important;
          box-shadow: none !important;
        }
        /* Override label color to purple */
        .MuiPickersTextField-root .MuiInputLabel-root {
          color: #1A212B !important;
        }
        .MuiPickersTextField-root .MuiInputLabel-root.Mui-focused {
          color: #5C17E5 !important;
        }
        .MuiFormControl-root.MuiPickersTextField-root .MuiInputLabel-root {
          color: #1A212B !important;
        }
        .MuiFormControl-root.MuiPickersTextField-root .MuiInputLabel-root.Mui-focused {
          color: #5C17E5 !important;
        }
        /* Style today's date with border (not selected) */
        .MuiPickersDay-root.MuiPickersDay-today:not(.Mui-selected) {
          background-color: transparent !important;
          color: #5C17E5 !important;
          box-shadow: inset 0 0 0 2px #5C17E5 !important;
          border: none !important;
          font-weight: 600 !important;
        }
        .MuiPickersDay-root.MuiPickersDay-today:not(.Mui-selected):hover {
          background-color: #F3E8FF !important;
          color: #5C17E5 !important;
          box-shadow: inset 0 0 0 2px #5C17E5 !important;
          border: none !important;
        }
        /* When today's date is also selected, show as selected */
        .MuiPickersDay-root.MuiPickersDay-today.Mui-selected {
          background-color: #5C17E5 !important;
          color: #ffffff !important;
          box-shadow: inset 0 0 0 2px #5C17E5 !important;
          border: none !important;
        }
        .MuiPickersDay-root.MuiPickersDay-today.Mui-selected:hover {
          background-color: #4A14C7 !important;
          box-shadow: inset 0 0 0 2px #4A14C7 !important;
          border: none !important;
        }
        /* Fix clipping in Month/Week containers */
        .MuiDayCalendar-monthContainer,
        .MuiDayCalendar-weekContainer {
          overflow: visible !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
        .MuiPickersDay-root {
          overflow: visible !important;
        }
        .MuiDayCalendar-header {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
        /* Override text selection color to purple */
        .MuiPickersInputBase-root input::selection,
        .MuiPickersInputBase-root .MuiInputBase-input::selection,
        .MuiPickersInputBase-root .MuiPickersInputBase-input::selection,
        .MuiPickersInputBase-root .MuiOutlinedInput-input::selection,
        .MuiPickersInputBase-root input::-moz-selection,
        .MuiPickersInputBase-root .MuiInputBase-input::-moz-selection,
        .MuiPickersInputBase-root .MuiPickersInputBase-input::-moz-selection,
        .MuiPickersInputBase-root .MuiOutlinedInput-input::-moz-selection {
          background-color: #5C17E5 !important;
          color: #ffffff !important;
        }
      `;
      document.head.appendChild(style);
    }

    const styleCurrentMonthAndYear = () => {
      const currentMonth = dayjs().month();
      const currentYear = dayjs().year();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      document.querySelectorAll('.pharma-current-month, .pharma-current-year').forEach(el => {
        el.classList.remove('pharma-current-month', 'pharma-current-year');
      });

      const monthButtons = document.querySelectorAll('[role="dialog"] .MuiPickersMonth-root, [role="dialog"] .MuiMonthCalendar-button');
      monthButtons.forEach((button) => {
        const buttonText = button.textContent?.trim();
        const monthIndex = monthNames.findIndex(m => m === buttonText) !== -1
          ? monthNames.findIndex(m => m === buttonText)
          : fullMonthNames.findIndex(m => m === buttonText);

        if (monthIndex === currentMonth) {
          const element = button as HTMLElement;
          if (!element.classList.contains('Mui-selected')) {
            element.classList.add('pharma-current-month');
          }
        }
      });

      const yearSelectors = [
        '[role="dialog"] .MuiPickersYear-root',
        '[role="dialog"] .MuiYearCalendar-root button',
        '[role="dialog"] .MuiPickersYear-root button',
        '[role="dialog"] button[class*="PickersYear"]',
        '.MuiPickersYear-root',
        '.MuiYearCalendar-root button',
        'button[class*="PickersYear"]'
      ];

      let yearButtons: NodeListOf<Element> | null = null;
      for (const selector of yearSelectors) {
        yearButtons = document.querySelectorAll(selector);
        if (yearButtons.length > 0) {
          break;
        }
      }

      if (yearButtons && yearButtons.length > 0) {
        yearButtons.forEach((button) => {
          let buttonText = button.textContent?.trim() || '';
          if (!buttonText && button.firstChild) {
            buttonText = button.firstChild.textContent?.trim() || '';
          }

          const cleanedText = buttonText.replace(/[,\s]/g, '');
          const yearNumber = parseInt(cleanedText, 10);

          if ((yearNumber === currentYear || buttonText === currentYear.toString()) && !isNaN(yearNumber)) {
            const element = button as HTMLElement;
            if (!element.classList.contains('Mui-selected')) {
              element.classList.add('pharma-current-year');
            }
          }
        });
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as Element;
            if (element.querySelector?.('.MuiYearCalendar-root, .MuiPickersYear-root')) {
              setTimeout(styleCurrentMonthAndYear, 150);
            }
          }
        });
      });
      setTimeout(styleCurrentMonthAndYear, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const handleCalendarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.MuiPickersCalendarHeader-labelContainer') ||
        target.closest('.MuiPickersCalendarHeader-switchViewButton')) {
        setTimeout(styleCurrentMonthAndYear, 300);
      }
    };

    document.addEventListener('click', handleCalendarClick);

    const interval = setInterval(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        styleCurrentMonthAndYear();
        setTimeout(styleCurrentMonthAndYear, 300);
      }
    }, 300);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      document.removeEventListener('click', handleCalendarClick);
    };
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <div
        ref={containerRef}
        onClick={(e) => {
          if (!disabled) {
            const target = e.target as HTMLElement;
            if (target.closest('.MuiInputBase-root') || target.closest('.MuiIconButton-root') || target.closest('.MuiInputAdornment-root')) {
              if (!open) {
                setOpen(true);
              }
            }
          }
        }}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <DatePicker
          value={value}
          onChange={(newValue) => {
            onChange(newValue);
          }}
          onMonthChange={(newMonth) => {
            if (newMonth && useEndOfMonth) {
              onChange(newMonth.endOf('month'));
            }
          }}
          onYearChange={(newYear) => {
            if (newYear && useEndOfMonth) {
              onChange(newYear.endOf('month'));
            }
          }}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          openTo="day"
          views={["year", "month", "day"]}
          format="DD/MM/YYYY"
          slots={{
            openPickerIcon: CalendarTodayIcon,
          }}
          slotProps={{
            openPickerIcon: {
              sx: {
                display: 'flex !important',
                visibility: 'visible !important',
                opacity: '1 !important',
                color: '#6B7280 !important',
                fontSize: '20px !important',
              }
            },
            monthButton: (ownerState) => {
              const month = (ownerState as any).month || (ownerState as any).value;
              const currentMonth = dayjs();
              const isCurrentMonth = month && dayjs.isDayjs(month) &&
                month.month() === currentMonth.month() &&
                month.year() === currentMonth.year();

              return {
                sx: {
                  fontSize: "12px !important",
                  width: "48px",
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
              const year = (ownerState as any).year || (ownerState as any).value;
              const currentYear = dayjs().year();
              let isCurrentYear = false;

              if (year) {
                if (dayjs.isDayjs(year)) {
                  isCurrentYear = year.year() === currentYear;
                } else if (typeof year === 'number') {
                  isCurrentYear = year === currentYear;
                }
              }

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
              label,
              error: error,
              InputProps: {
                readOnly: readOnly,
              },
              sx: {
                cursor: disabled ? 'not-allowed' : 'pointer',
                width,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "18px !important",
                  height: typeof height === 'number' ? `${height}px !important` : `${height} !important`,
                  minHeight: typeof height === 'number' ? `${height}px !important` : `${height} !important`,
                  backgroundColor: "#ffffff",
                  outline: "none !important",
                  "& .MuiPickersInputBase-root": {
                    fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  },
                  "& fieldset": {
                    borderColor: error ? "#EF4444" : "#D1D5DB",
                    borderWidth: "1px",
                    borderRadius: "18px",
                  },
                  "&:hover": {
                    outline: "none !important",
                    outlineWidth: "0 !important",
                    outlineStyle: "none !important",
                    outlineOffset: "0 !important",
                    boxShadow: "none !important",
                  },
                  "&:hover *": {
                    outline: "none !important",
                  },
                  "&:hover fieldset": {
                    borderColor: error ? "#EF4444" : "#D1D5DB",
                    borderWidth: "1px",
                    borderRadius: "18px",
                    outline: "none !important",
                    boxShadow: "none !important",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: error ? "#EF4444 !important" : "#D1D5DB !important",
                    borderWidth: "1px !important",
                    borderRadius: "18px",
                    outline: "none !important",
                  },
                  "&.Mui-focused": {
                    outline: "none !important",
                  },
                  "&.Mui-error fieldset": {
                    borderColor: "#EF4444",
                    borderWidth: "1px",
                    borderRadius: "18px",
                  },
                },
                "& .MuiPickersInputBase-root": {
                  borderRadius: "18px !important",
                  height: typeof height === 'number' ? `${height}px !important` : `${height} !important`,
                  minHeight: typeof height === 'number' ? `${height}px !important` : `${height} !important`,
                  outline: "none !important",
                  color: "#728197 !important",
                  "&:hover": {
                    outline: "none !important",
                    outlineWidth: "0 !important",
                    outlineStyle: "none !important",
                    outlineOffset: "0 !important",
                    boxShadow: "none !important",
                  },
                  "&:hover *": {
                    outline: "none !important",
                  },
                  "&:focus": {
                    outline: "none !important",
                    outlineWidth: "0 !important",
                    outlineStyle: "none !important",
                  },
                  "&:focus-visible": {
                    outline: "none !important",
                    outlineWidth: "0 !important",
                    outlineStyle: "none !important",
                    boxShadow: "none !important",
                  },
                  "& fieldset": {
                    borderColor: "#D1D5DB",
                  },
                  "&:hover fieldset": {
                    borderColor: "#D1D5DB",
                    outline: "none !important",
                    boxShadow: "none !important",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: error ? "#EF4444 !important" : "#D1D5DB !important",
                    borderWidth: "1px !important",
                  },
                  "& input": {
                    color: "#728197 !important",
                  },
                },
                "& .MuiFormControl-root.MuiPickersTextField-root .MuiPickersInputBase-root": {
                  height: typeof height === 'number' ? `${height}px !important` : `${height} !important`,
                  minHeight: typeof height === 'number' ? `${height}px !important` : `${height} !important`,
                },
                "& .MuiPickersInputBase-colorPrimary": {
                  "&.Mui-focused fieldset": {
                    borderColor: error ? "#EF4444 !important" : "#D1D5DB !important",
                  },
                },
                "& .MuiPickersInputBase-root.MuiPickersOutlinedInput-root.MuiPickersInputBase-colorPrimary": {
                  "&.Mui-focused fieldset": {
                    borderColor: error ? "#EF4444 !important" : "#D1D5DB !important",
                    borderWidth: "1px !important",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  padding: typeof height === 'number' && height <= 32 ? "6px 8px" : "12px 16px",
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  lineHeight: typeof height === 'number' && height <= 32 ? "18px !important" : "20px !important",
                  color: "#728197 !important",
                  fontWeight: "normal !important",
                },
                "& .MuiPickersInputBase-input": {
                  padding: typeof height === 'number' && height <= 32 ? "6px 8px" : "12px 16px",
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  lineHeight: typeof height === 'number' && height <= 32 ? "18px !important" : "20px !important",
                  color: "#728197 !important",
                  fontWeight: "normal !important",
                },
                "& input": {
                  color: "#728197 !important",
                  WebkitTextFillColor: "#728197 !important",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  "&::selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                  "&::-moz-selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "#728197 !important",
                  WebkitTextFillColor: "#728197 !important",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  "&::selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                  "&::-moz-selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                },
                "& .MuiPickersInputBase-root input": {
                  color: "#728197 !important",
                  WebkitTextFillColor: "#728197 !important",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  "&::selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                  "&::-moz-selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                },
                "& .MuiOutlinedInput-root input": {
                  color: "#728197 !important",
                  WebkitTextFillColor: "#728197 !important",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  "&::selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                  "&::-moz-selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                },
                "& input[type='text']": {
                  color: "#728197 !important",
                  WebkitTextFillColor: "#728197 !important",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  "&::selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                  "&::-moz-selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                },
                "& input[readonly]": {
                  color: "#728197 !important",
                  WebkitTextFillColor: "#728197 !important",
                  fontSize: typeof height === 'number' && height <= 32 ? "12px !important" : "14px !important",
                  "&::selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                  "&::-moz-selection": {
                    backgroundColor: "#5C17E5 !important",
                    color: "#ffffff !important",
                  },
                },
                "& .MuiOutlinedInput-input::placeholder": {
                  color: "#728197",
                  opacity: 1,
                  fontSize: "10px !important",
                },
                "& input::placeholder": {
                  fontSize: "10px !important",
                  color: "#728197 !important",
                  opacity: "1 !important",
                },
                "& input::-webkit-input-placeholder": {
                  fontSize: "10px !important",
                  color: "#728197 !important",
                  opacity: "1 !important",
                },
                "& input::-moz-placeholder": {
                  fontSize: "10px !important",
                  color: "#728197 !important",
                  opacity: "1 !important",
                },
                "& .MuiPickersInputBase-input::placeholder": {
                  fontSize: "10px !important",
                  color: "#728197 !important",
                  opacity: "1 !important",
                },
                "& .MuiInputBase-input::placeholder": {
                  fontSize: "10px !important",
                  color: "#728197 !important",
                  opacity: "1 !important",
                },
                "& .MuiInputLabel-root": {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: "16px",
                  color: "#1A212B",
                  "&.Mui-focused": {
                    color: "#5C17E5 !important",
                  },
                },
                "& .MuiInputAdornment-root": {
                  display: "flex !important",
                  visibility: "visible !important",
                  opacity: "1 !important",
                  pointerEvents: "auto !important",
                  "& .MuiIconButton-root": {
                    color: "#6B7280 !important",
                    padding: "4px",
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: "flex !important",
                    visibility: "visible !important",
                    opacity: "1 !important",
                    pointerEvents: disabled ? 'none' : 'auto',
                    "&:hover": {
                      backgroundColor: disabled ? "transparent" : "rgba(0, 0, 0, 0.04)",
                    },
                    "& svg": {
                      fontSize: "20px !important",
                      display: "block !important",
                      visibility: "visible !important",
                      opacity: "1 !important",
                      width: "20px !important",
                      height: "20px !important",
                    },
                    "&:focus": {
                      outline: "none",
                    },
                  },
                },
                "& .MuiPickersInputAdornment-root": {
                  display: "flex !important",
                  visibility: "visible !important",
                  opacity: "1 !important",
                  "& .MuiIconButton-root": {
                    color: "#6B7280 !important",
                    padding: "4px",
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: "flex !important",
                    visibility: "visible !important",
                    opacity: "1 !important",
                    "&:hover": {
                      backgroundColor: disabled ? "transparent" : "rgba(0, 0, 0, 0.04)",
                    },
                    "& svg": {
                      fontSize: "20px !important",
                      display: "block !important",
                      visibility: "visible !important",
                      opacity: "1 !important",
                      width: "20px !important",
                      height: "20px !important",
                    },
                    "&:focus": {
                      outline: "none",
                    },
                  },
                },
                "& .MuiInputAdornment-positionEnd": {
                  display: "flex !important",
                  visibility: "visible !important",
                  opacity: "1 !important",
                  pointerEvents: "auto !important",
                  "& .MuiIconButton-root": {
                    display: "flex !important",
                    visibility: "visible !important",
                    opacity: "1 !important",
                  },
                },
                "& .MuiPickersInputAdornment-root.MuiInputAdornment-positionEnd": {
                  display: "flex !important",
                  visibility: "visible !important",
                  opacity: "1 !important",
                  pointerEvents: "auto !important",
                },
                "& .MuiInputBase-inputAdornedEnd": {
                  paddingRight: "40px !important",
                },
                "& .MuiOutlinedInput-adornedEnd": {
                  paddingRight: "8px !important",
                  "& .MuiInputAdornment-root": {
                    marginLeft: "0 !important",
                  },
                },
              },
            },
            popper: {
              placement: "bottom-start",
              disablePortal: false,
              modifiers: [
                {
                  name: "flip",
                  enabled: false,
                },
                {
                  name: "offset",
                  options: {
                    offset: [0, 8],
                  },
                },
                {
                  name: "preventOverflow",
                  enabled: true,
                  options: {
                    rootBoundary: "viewport",
                    boundary: "viewport",
                    tether: false,
                    altAxis: false,
                    padding: 8,
                  },
                },
                {
                  name: "computeStyles",
                  options: {
                    adaptive: true,
                    roundOffsets: true,
                  },
                },
              ],
              sx: {
                zIndex: 1300,
                "& .MuiPaper-root": {
                  borderRadius: "12px",
                  border: "1px solid #E6ECF5",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  padding: "16px 16px 8px 16px",
                  width: "320px",
                  maxWidth: "320px",
                  minWidth: "320px",
                  height: "auto",
                  minHeight: "270px !important",
                  position: "relative",
                  overflow: "hidden",
                  boxSizing: "border-box",
                },
                "& .MuiDateCalendar-root": {
                  height: "280px !important",
                  minHeight: "280px !important",
                  width: "288px !important",
                },
                "& .MuiDayCalendar-root": {
                  width: "288px",
                  maxWidth: "288px",
                  marginTop: "0px",
                  height: "auto",
                  minHeight: "210px !important",
                },
                "& .MuiYearCalendar-root": {
                  width: "288px",
                  maxWidth: "288px",
                  height: "auto",
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
                  width: "270px !important",
                  display: "grid !important",
                  gridTemplateColumns: "repeat(3, 1fr) !important",
                  // margin: "0 auto !important",
                  // marginRight: "10px !important",
                  marginLeft: "18px",
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
                  width: "288px",
                  marginTop: "0px",
                },
                "& .MuiPickersSlideTransition-root": {
                  display: "block",
                  position: "relative",
                  overflowX: "hidden",
                  minHeight: "220px",
                  height: "auto",
                  width: "288px",
                  maxWidth: "288px",
                },
                "& .MuiPickersCalendarHeader-root": {
                  padding: "0 0 12px 0",
                  width: "288px",
                  marginTop: "0px",


                  "& .MuiPickersCalendarHeader-labelContainer": {
                    "& .MuiPickersCalendarHeader-label": {
                      fontFamily: "'Lexend', sans-serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#202B3C",

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
                  fontFamily: "'Lexend', sans-serif",
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
                  minWidth: "32px",
                  minHeight: "32px",
                  maxWidth: "32px",
                  maxHeight: "32px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1A212B",
                  fontFamily: "'Lexend', sans-serif",
                  borderRadius: "50%",
                  margin: "2px",
                  padding: "0 !important",
                  backgroundColor: "transparent",
                  display: "flex !important",
                  alignItems: "center !important",
                  justifyContent: "center !important",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  "& > *": {
                    display: "flex !important",
                    alignItems: "center !important",
                    justifyContent: "center !important",
                    width: "100%",
                    height: "100%",
                  },
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
                    backgroundColor: "transparent !important",
                    color: "#5C17E5 !important",
                    border: "2px solid #5C17E5 !important",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "#F3E8FF !important",
                      color: "#5C17E5 !important",
                      border: "2px solid #5C17E5 !important",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "#5C17E5 !important",
                      color: "#ffffff !important",
                      border: "2px solid #5C17E5 !important",
                      "&:hover": {
                        backgroundColor: "#4A14C7 !important",
                        border: "2px solid #4A14C7 !important",
                      },
                    },
                  },
                },
              },
            },
          }}
        />
      </div>
    </LocalizationProvider>
  );
};

export default PharmaDatePicker;


