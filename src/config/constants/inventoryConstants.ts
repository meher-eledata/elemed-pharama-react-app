// Reusable MUI styles
export const baseButtonStyle = {
  height: "2.25rem",
  width: "8rem",
  color: "#1A212B",
  fontSize: "1rem",
  lineHeight: "1.25rem",
  fontWeight: 500,
  fontFamily: "lexend",
  padding: 0,
  textTransform: "none",
  border: "none",
};

export const headerTitleStyle = {
  marginBottom: '1.5rem', // 24px = 1.5rem
  fontWeight: 600,
  fontSize: '2.25rem', // 36px = 2.25rem
  fontFamily: 'Lexend',
  marginTop: '1.25rem' // 20px = 1.25rem
};

export const checkboxStyle = {
  width: "1.5rem", // 24px = 1.5rem
  height: "1.5rem", // 24px = 1.5rem
  p: 0,
  "& .MuiSvgIcon-root": { display: "none" },
};

export const checkboxBoxStyle = {
  width: 18,
  height: 18,
  border: "0.09375rem solid #D0D5DD", // 1.5px = 0.09375rem
  borderRadius: "0.375rem", // 6px = 0.375rem
  backgroundColor: "#fff",
};

export const checkboxCheckedBoxStyle = {
  ...checkboxBoxStyle,
  border: "0.09375rem solid #1976d2", // 1.5px = 0.09375rem
  backgroundColor: "#1976d2",
};

export const productCellTextStyle = {
  color: '#1A212B',
  fontSize: '0.875rem', // 14px = 0.875rem
  fontFamily: 'Lexend'
};

export const secondaryQuantityTextStyle = {
  color: '#728197',
  fontSize: '0.875rem', // 14px = 0.875rem
  fontFamily: 'Lexend'
};

// Image Paths (assuming they are in the src/assets folder)
import vShapedArrow from '../../assets/v_shaped_arrow.svg';
import vShapedUp from '../../assets/v_shaped_up.svg';
import Cart from '../../assets/cart.svg';
import Chart1 from '../../assets/Chart1.svg';
import Chart2 from '../../assets/Chart2.svg';
import Chart3 from '../../assets/Chart3.svg';
import TrendDown from '../../assets/trend-down.svg';
import TrendUp from '../../assets/trend-up.svg';

export const ASSET_PATHS = {
  vShapedArrow,
  vShapedUp,
  Cart,
  Chart1,
  Chart2,
  Chart3,
  TrendDown,
  TrendUp
};

// Fixed numbers
export const ROWS_PER_PAGE = 10;