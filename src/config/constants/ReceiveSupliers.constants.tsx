// constants.ts

// Colors
export const PRIMARY_COLOR = "#5C17E5";
export const PRIMARY_HOVER_COLOR = "#6A50E5";
export const BORDER_COLOR = "#9AA8BC";
export const TEXT_COLOR = "#728197";
export const WHITE_COLOR = "#ffffff";

export const FONT_FAMILY = "lexend";


export const BORDER_RADIUS = "0.75rem"; // 12px = 0.75rem

// Button Styles
export const CANCEL_BUTTON_STYLE = {
  color: "black",
  fontWeight: 500,
  borderRadius: BORDER_RADIUS,
  fontFamily: FONT_FAMILY
};

export const NEXT_BUTTON_STYLE = {
  backgroundColor: PRIMARY_COLOR,
  fontFamily: FONT_FAMILY,
  borderRadius: BORDER_RADIUS,
  "&:hover": { backgroundColor: PRIMARY_HOVER_COLOR },
  px: 3
};

// Select Styles
export const SELECT_STYLE = {
  minWidth: 200,
  height: 40,
  backgroundColor: WHITE_COLOR,
  borderRadius: BORDER_RADIUS,
  "& .MuiSelect-select": {
    padding: "0.5rem 0.875rem", // 8px = 0.5rem, 14px = 0.875rem
    fontFamily: FONT_FAMILY,
    color: TEXT_COLOR
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: BORDER_COLOR
  }
};

export const MENU_PROPS = {
  PaperProps: {
    sx: {
      backgroundColor: WHITE_COLOR,
      borderRadius: "0.5rem", // 8px = 0.5rem
      "& .MuiMenuItem-root": {
        fontSize: "0.875rem", // 14px = 0.875rem
        padding: "0.5rem 1rem" // 8px = 0.5rem, 16px = 1rem
      }
    }
  }
};

