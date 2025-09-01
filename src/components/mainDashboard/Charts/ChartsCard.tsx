


import * as React from 'react';
import { Card, Box, Typography, IconButton } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { CSVLink } from 'react-csv';
import DownloadSvg from '../../../assets/Download.svg';

interface ChartData {
  xAxis: string[];
  series1: number[];
  series2: number[];
}

interface YAxisConfig {
  min: number;
  max: number;
  tickInterval: number[];
}

interface ChartCardProps {
  title: string;
  metric: string;
  chartData: ChartData;
  colors: { main: string; area: string; percentBg: string; percentText: string };
  yAxisConfig: YAxisConfig;
  csvData: object[];
  filename: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  metric,
  chartData,
  colors,
  yAxisConfig,
  csvData,
  filename,
}) => {
  const csvLinkRef = React.useRef<any>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = () => csvLinkRef.current?.link?.click();

  const bandTickInterval = React.useMemo(() => {
    const n = chartData.xAxis.length;
    if (n <= 5) return () => true;
    const step = Math.ceil((n - 1) / 4); 
    return (_value: string, index: number) => index % step === 0 || index === n - 1;
  }, [chartData.xAxis.length]);

  return (
    <Card sx={{ width: '445px', borderRadius: '20px', p: 0, mt: '64px' }}>
      <Box sx={{ p: '16px 16px 0 16px', position: 'relative' }}>
        <Box
          ref={chartRef}
          sx={{ cursor: 'pointer', position: 'relative' }}
        >
          <LineChart
            xAxis={[{
              data: chartData.xAxis,          
              scaleType: 'band',
              tickPlacement: 'middle',
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: { fill: '#000', fontSize: 12 },
              tickInterval: bandTickInterval,
              valueFormatter: (date) =>
                new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            }]}
            yAxis={[{
              min: yAxisConfig.min,
              max: yAxisConfig.max,
              tickInterval: yAxisConfig.tickInterval,
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: { fill: '#BDBDBD', fontSize: 12 },
            }]}
            series={[
              { 
                data: chartData.series1, 
                color: colors.main, 
                area: true, 
                curve: 'catmullRom', 
                showMark: false,
                valueFormatter: (value, context) => {
                  const date = new Date(chartData.xAxis[context.dataIndex]).toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  });
                  return `${title} - ${date} - Value: ${value}`;
                }
              },
            ]}
            height={160}
            margin={{ top: 20, bottom: 20, left: -18, right: 20 }}
            disableAxisListener
            grid={{ horizontal: true, vertical: false }} 
            slots={{ tooltip: undefined }}
            sx={{
              '.MuiChartsAxis-bottom .MuiChartsAxis-line, .MuiChartsAxis-left .MuiChartsAxis-line': { stroke: 'none' },
              '.MuiChartsAxis-bottom .MuiChartsAxis-tick, .MuiChartsAxis-left .MuiChartsAxis-tick': { stroke: 'none' },
              '.MuiChartsGrid-line': { stroke: '#E6EDF7', strokeWidth: 3, shapeRendering: 'crispEdges' },
              '.MuiChartsGrid-root': { zIndex: 2},
              '.MuiAreaElement-root': { fillOpacity: 0.6, mixBlendMode: 'normal' },
              '.MuiLineElement-root': { strokeWidth: 2 },
            }}
          />
        </Box>


      </Box>

      <Box sx={{ mt: 2, px: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, width: '100%' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1.2, fontFamily: 'lexend' }}>
            {metric}
          </Typography>
          <Typography variant="body1" sx={{ ml: 1, color: 'text.secondary', fontSize: '1rem', flexGrow: 1, fontFamily: 'lexend' }}>
            {title}
          </Typography>

          <Box onClick={handleDownload} sx={{ display: 'flex', alignItems: 'center', ml: 'auto', cursor: 'pointer' }}>
            <IconButton aria-label="download" size="small" sx={{ borderRadius: '8px', mr: 0.5 }}>
              <img src={DownloadSvg} alt="Download" style={{ width: '18px', height: '18px', color: '#0F172A' }} />
            </IconButton>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontFamily: 'lexend' }}>
              Download Report
            </Typography>
          </Box>
        </Box>
      </Box>

      <CSVLink data={csvData} filename={filename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Card>
  );
};

export default ChartCard;