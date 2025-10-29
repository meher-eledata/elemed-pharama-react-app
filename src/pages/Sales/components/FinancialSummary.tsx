import React from 'react';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import {
  FinancialSummaryContainer,
  SummaryRow,
  SummaryFieldsGroup,
  SummaryField,
  SummaryFieldRight,
  SummaryLabel,
  SummaryInput,
  SummaryInputLarge,
} from '../SalesReceipt.styles';

interface FinancialSummaryProps {
  totalValue: string;
  totalDiscount: string;
  taxAmount: string;
  totalPayableAmount: string;
  onTotalValueChange: (value: string) => void;
  onTotalDiscountChange: (value: string) => void;
  onTaxAmountChange: (value: string) => void;
  onTotalPayableAmountChange: (value: string) => void;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  totalValue,
  totalDiscount,
  taxAmount,
  totalPayableAmount,
  onTotalValueChange,
  onTotalDiscountChange,
  onTaxAmountChange,
  onTotalPayableAmountChange,
}) => {
  return (
    <FinancialSummaryContainer>
      <SummaryRow>
        <SummaryFieldsGroup>
          <SummaryField>
            <SummaryLabel style={{ width: SALES_RECEIPT_CONSTANTS.SUMMARY_LABEL_TOTAL_VALUE_WIDTH }}>
              {SALES_RECEIPT_LABELS.TOTAL_VALUE_LABEL}
            </SummaryLabel>
            <SummaryInput 
              value={totalValue} 
              onChange={(e) => onTotalValueChange(e.target.value)}
            />
          </SummaryField>
          <SummaryField>
            <SummaryLabel style={{ width: SALES_RECEIPT_CONSTANTS.SUMMARY_LABEL_DISCOUNT_WIDTH }}>
              {SALES_RECEIPT_LABELS.TOTAL_DISCOUNT_LABEL}
            </SummaryLabel>
            <SummaryInput 
              value={totalDiscount} 
              onChange={(e) => onTotalDiscountChange(e.target.value)}
            />
          </SummaryField>
          <SummaryField>
            <SummaryLabel style={{ width: SALES_RECEIPT_CONSTANTS.SUMMARY_LABEL_TAX_WIDTH }}>
              {SALES_RECEIPT_LABELS.TAX_AMOUNT_LABEL}
            </SummaryLabel>
            <SummaryInput 
              value={taxAmount} 
              onChange={(e) => onTaxAmountChange(e.target.value)}
            />
          </SummaryField>
        </SummaryFieldsGroup>
        <SummaryFieldRight>
          <SummaryLabel style={{ width: SALES_RECEIPT_CONSTANTS.SUMMARY_LABEL_PAYABLE_WIDTH }}>
            {SALES_RECEIPT_LABELS.TOTAL_PAYABLE_LABEL}
          </SummaryLabel>
          <SummaryInputLarge 
            value={totalPayableAmount} 
            onChange={(e) => onTotalPayableAmountChange(e.target.value)}
            style={{ fontWeight: 700, fontSize: '18px' }} 
          />
        </SummaryFieldRight>
      </SummaryRow>
    </FinancialSummaryContainer>
  );
};

export default FinancialSummary;

