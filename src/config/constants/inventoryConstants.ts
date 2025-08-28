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
  marginBottom: '24px',
  fontWeight: 600,
  fontSize: '36px',
  fontFamily: 'Lexend',
  marginTop: '20px'
};

export const checkboxStyle = {
  width: "24px",
  height: "24px",
  p: 0,
  "& .MuiSvgIcon-root": { display: "none" },
};

export const checkboxBoxStyle = {
  width: 18,
  height: 18,
  border: "1.5px solid #D0D5DD",
  borderRadius: "6px",
  backgroundColor: "#fff",
};

export const checkboxCheckedBoxStyle = {
  ...checkboxBoxStyle,
  border: "1.5px solid #1976d2",
  backgroundColor: "#1976d2",
};

export const productCellTextStyle = {
  color: '#1A212B',
  fontSize: '14px',
  fontFamily: 'Lexend'
};

export const secondaryQuantityTextStyle = {
  color: '#728197',
  fontSize: '14px',
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
export const ROWS_PER_PAGE = 3;