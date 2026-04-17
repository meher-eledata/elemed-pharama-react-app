// Print and Field Styles for SalesReceipt

export const getPrintStyles = (pageSize: 'A4' | 'A5' = 'A4') => `
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body * {
      visibility: hidden !important;
    }
    
    #sales-receipt-content, #sales-receipt-content * {
      visibility: visible !important;
    }
    
    #sales-receipt-content {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: none !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
      transform: none !important;
    }
    
    .no-print {
      display: none !important;
    }
    
    .MuiTableContainer-root,
    .MuiTableContainer-root * {
      overflow: visible !important;
      max-width: none !important;
      width: 100% !important;
      box-shadow: none !important;
      transform: none !important;
    }
    
    .MuiTable-root,
    .MuiTable-root * {
      width: 100% !important;
      min-width: ${pageSize === 'A4' ? '1600px' : '100%'} !important;
      max-width: none !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      transform: none !important;
    }
    
    .MuiTableCell-root,
    .MuiTableCell-root * {
      white-space: nowrap !important;
      padding: ${pageSize === 'A4' ? '4px 6px' : '2px 4px'} !important;
      font-size: ${pageSize === 'A4' ? '11px' : '9px'} !important;
      border: 1px solid #ccc !important;
      overflow: visible !important;
      transform: none !important;
      display: table-cell !important;
      visibility: visible !important;
    }
    
    .MuiTableHead-root .MuiTableCell-root {
      background-color: #f5f5f5 !important;
      font-weight: 600 !important;
    }
    
    .MuiTable-root .MuiTableCell-root:nth-child(1) { width: ${pageSize === 'A4' ? '25%' : '20%'} !important; min-width: ${pageSize === 'A4' ? '160px' : '80px'} !important; max-width: none !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(2) { width: 5% !important; min-width: ${pageSize === 'A4' ? '45px' : '25px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(3) { width: 6% !important; min-width: ${pageSize === 'A4' ? '55px' : '30px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(4) { width: 7% !important; min-width: ${pageSize === 'A4' ? '65px' : '40px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(5) { width: 6% !important; min-width: ${pageSize === 'A4' ? '60px' : '35px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(6) { width: 5% !important; min-width: ${pageSize === 'A4' ? '45px' : '25px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(7) { width: 5% !important; min-width: ${pageSize === 'A4' ? '45px' : '25px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(8) { width: 5% !important; min-width: ${pageSize === 'A4' ? '45px' : '25px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(9) { width: 5% !important; min-width: ${pageSize === 'A4' ? '45px' : '25px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(10) { width: 18% !important; min-width: ${pageSize === 'A4' ? '90px' : '60px'} !important; }
    .MuiTable-root .MuiTableCell-root:nth-child(11) { width: 13% !important; min-width: 80px !important; display: none !important; }
    
    @page {
      size: ${pageSize} landscape !important;
      margin: 0 !important;
    }
    
    [class*="MuiTable"],
    [class*="MuiTableCell"],
    [class*="MuiTableContainer"] {
      transform: none !important;
      overflow: visible !important;
      max-width: none !important;
    }
  }
`;

export const fieldStyles = `
  body, html {
    overflow-x: hidden !important;
  }
  #sales-receipt-content {
    overflow-x: hidden !important;
  }
  .phone-no-field .MuiOutlinedInput-root,
  .city-field .MuiOutlinedInput-root {
    background-color: #FFFFFF !important;
  }
  .phone-no-field .MuiOutlinedInput-root:hover,
  .city-field .MuiOutlinedInput-root:hover {
    background-color: #FFFFFF !important;
  }
  .phone-no-field .MuiOutlinedInput-root.Mui-focused,
  .city-field .MuiOutlinedInput-root.Mui-focused {
    background-color: #FFFFFF !important;
  }
  .phone-no-field .MuiInputBase-input,
  .city-field .MuiInputBase-input {
    background-color: #FFFFFF !important;
  }
  .css-1sampav {
    margin-left: -1px !important;
  }
  .css-11fq6m1 {
    margin-right: 20px !important;
  }
  .css-kpoye4-MuiFormControl-root-MuiPickersTextField-root .MuiOutlinedInput-root,
  .css-kpoye4-MuiFormControl-root-MuiPickersTextField-root .MuiPickersInputBase-root {
    border-radius: 8px !important;
  }
  .css-kpoye4-MuiFormControl-root-MuiPickersTextField-root .MuiOutlinedInput-root fieldset,
  .css-kpoye4-MuiFormControl-root-MuiPickersTextField-root .MuiPickersInputBase-root fieldset {
    border-radius: 8px !important;
  }
`;

