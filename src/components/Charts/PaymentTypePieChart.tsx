import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface PaymentTypePieChartProps {
  data: Array<{ id: number; value: number; label: string; color: string }>;
}

const PaymentTypePieChart: React.FC<PaymentTypePieChartProps> = ({ data }) => {
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    
    if (midAngle === undefined || innerRadius === undefined || outerRadius === undefined || percent === undefined) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#1A212B"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '9px',
          fontWeight: 600,
          fontFamily: "'Lexend', sans-serif",
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <PieChart width={220} height={220}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={renderCustomLabel}
        outerRadius={90}
        innerRadius={50}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
    </PieChart>
  );
};

export default PaymentTypePieChart;
