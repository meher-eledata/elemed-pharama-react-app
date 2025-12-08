import React, { useEffect, useState, useRef } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export interface PharmaDatePickerProps {
  value: Dayjs | null;
  onChange: (newValue: Dayjs | null) => void;
  placeholder?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disabled?: boolean;
  width?: number | string;
  height?: number | string;
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
  height = 44,
  error = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.MuiPickersPopper-root') || 
          target.closest('.MuiPaper-root') ||
          target.closest('[role="dialog"]')) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      const popper = document.querySelector('.MuiPickersPopper-root') as HTMLElement;
      if (popper) {
        // Force popper to update its position by triggering a position update
        const popperInstance = (popper as any)._popper;
        if (popperInstance && popperInstance.update) {
          popperInstance.update();
        }
        // Also trigger resize as fallback
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
        /* Ensure text color is applied to the input value */
        .MuiPickersInputBase-root input::placeholder,
        .MuiPickersInputBase-root input::-webkit-input-placeholder,
        .MuiPickersInputBase-root input::-moz-placeholder {
          color: #728197 !important;
          opacity: 1;
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
      `;
      document.head.appendChild(style);
    }

    const styleCurrentMonthAndYear = () => {
      const currentMonth = dayjs().month();
      const currentYear = dayjs().year();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      // Remove previous classes
      document.querySelectorAll('.pharma-current-month, .pharma-current-year').forEach(el => {
        el.classList.remove('pharma-current-month', 'pharma-current-year');
      });

      // Style current month buttons - search in all poppers
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

      // Style current year buttons - try multiple selectors
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
          // Found year buttons, break
          break;
        }
      }
      
      if (yearButtons && yearButtons.length > 0) {
        yearButtons.forEach((button) => {
          // Get text from button or any child element
          let buttonText = button.textContent?.trim() || '';
          // If button has child elements, try to get text from the first text node
          if (!buttonText && button.firstChild) {
            buttonText = button.firstChild.textContent?.trim() || '';
          }
          
          // Try to parse the year as a number (handles cases with commas, spaces, etc.)
          const cleanedText = buttonText.replace(/[,\s]/g, '');
          const yearNumber = parseInt(cleanedText, 10);
          
          // Also try direct string comparison
          if ((yearNumber === currentYear || buttonText === currentYear.toString()) && !isNaN(yearNumber)) {
            const element = button as HTMLElement;
            if (!element.classList.contains('Mui-selected')) {
              element.classList.add('pharma-current-year');
            }
          }
        });
      }
    };

    // Use MutationObserver to watch for calendar popup
    const observer = new MutationObserver((mutations) => {
      // Check if year calendar was added
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as Element;
            if (element.querySelector?.('.MuiYearCalendar-root, .MuiPickersYear-root')) {
              // Year calendar detected, apply styles with a small delay
              setTimeout(styleCurrentMonthAndYear, 150);
            }
          }
        });
      });
      // Use longer delay to ensure year calendar is fully rendered
      setTimeout(styleCurrentMonthAndYear, 200);
    });

    // Observe the document body for popper elements
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Also listen for click events on the calendar header to detect view changes
    const handleCalendarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.MuiPickersCalendarHeader-labelContainer') || 
          target.closest('.MuiPickersCalendarHeader-switchViewButton')) {
        setTimeout(styleCurrentMonthAndYear, 300);
      }
    };
    
    document.addEventListener('click', handleCalendarClick);

    // Initial style application with multiple attempts
    const interval = setInterval(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        styleCurrentMonthAndYear();
        // Also try again after a short delay for year view
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          openTo="day"
          views={["year", "month", "day"]}
          format="MM/DD/YYYY"
          slots={{
            openPickerIcon: CalendarTodayIcon,
          }}
        slotProps={{
          monthButton: (ownerState) => {
            // Try multiple possible property names
            const month = (ownerState as any).month || (ownerState as any).value;
            const currentMonth = dayjs();
            const isCurrentMonth = month && dayjs.isDayjs(month) && 
              month.month() === currentMonth.month() && 
              month.year() === currentMonth.year();
            
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
            // Try multiple possible property names
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
            error: error,
            InputProps: {
              readOnly: true,
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
                fontSize: typeof height === 'number' && height <= 32 ? "13px" : "16px",
                lineHeight: typeof height === 'number' && height <= 32 ? "20px" : "24px",
                color: "#728197 !important",
                fontWeight: "normal !important",
              },
              "& .MuiPickersInputBase-input": {
                padding: typeof height === 'number' && height <= 32 ? "6px 8px" : "12px 16px",
                fontFamily: "'Lexend', sans-serif",
                fontSize: typeof height === 'number' && height <= 32 ? "13px" : "16px",
                lineHeight: typeof height === 'number' && height <= 32 ? "20px" : "24px",
                color: "#728197 !important",
                fontWeight: "normal !important",
              },
              "& input": {
                color: "#728197 !important",
                WebkitTextFillColor: "#728197 !important",
              },
              "& .MuiInputBase-input": {
                color: "#728197 !important",
                WebkitTextFillColor: "#728197 !important",
              },
              "& .MuiPickersInputBase-root input": {
                color: "#728197 !important",
                WebkitTextFillColor: "#728197 !important",
              },
              "& .MuiOutlinedInput-root input": {
                color: "#728197 !important",
                WebkitTextFillColor: "#728197 !important",
              },
              "& input[type='text']": {
                color: "#728197 !important",
                WebkitTextFillColor: "#728197 !important",
              },
              "& input[readonly]": {
                color: "#728197 !important",
                WebkitTextFillColor: "#728197 !important",
              },
              "& .MuiOutlinedInput-input::placeholder": {
                color: "#728197",
                opacity: 1,
              },
              "& .MuiInputAdornment-root": {
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
                  },
                  "&:focus": {
                    outline: "none",
                  },
                },
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
                  offset: [0, 8], // [horizontal, vertical] - 8px gap between input and calendar
                },
              },
              {
                name: "preventOverflow",
                enabled: true,
                options: {
                  rootBoundary: "viewport",
                  boundary: "clippingParents",
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
                padding: "16px",
                width: "242px",
                maxWidth: "242px",
                minWidth: "242px",
                height: "300px !important",
                minHeight: "300px !important",
                position: "relative",
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
                    fontFamily: "'Lexend', sans-serif",
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
                fontSize: "14px",
                fontWeight: 500,
                color: "#1A212B",
                fontFamily: "'Lexend', sans-serif",
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
      </div>
    </LocalizationProvider>
  );
};

export default PharmaDatePicker;


