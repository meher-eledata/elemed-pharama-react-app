import * as React from 'react';
import { Card, Box, Typography, IconButton } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { CSVLink } from 'react-csv';
import DownloadSvg from '../../../assets/Download.svg';
import { DASHBOARD_LABELS } from '../../../config/label/ChartsCard.labels';
import { DASHBOARD_CONSTANTS } from '../../../config/constants/ChartsCard.constants';

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

  const handleDownload = () => csvLinkRef.current?.link?.click();

  const bandTickInterval = React.useMemo(() => {
    const n = chartData.xAxis.length;
    if (n === 0) return () => false;
    if (n <= 5) return () => true; 

    const last = n - 1;
    const candidateIndices = [
      0,
      Math.round(last / 4),
      Math.round(last / 2),
      Math.round((3 * last) / 4),
      last,
    ];

    const uniqueSorted = Array.from(new Set(candidateIndices)).sort((a, b) => a - b);

    while (uniqueSorted.length < 5) {
      const probe = uniqueSorted[uniqueSorted.length - 1] + 1 < n
        ? uniqueSorted[uniqueSorted.length - 1] + 1
        : uniqueSorted[0] > 0
          ? uniqueSorted[0] - 1
          : uniqueSorted[uniqueSorted.length - 1];
      if (!uniqueSorted.includes(probe) && probe >= 0 && probe < n) uniqueSorted.push(probe);
      else break;
      uniqueSorted.sort((a, b) => a - b);
    }

    const indicesSet = new Set(uniqueSorted);
    return (_value: string, index: number) => indicesSet.has(index);
  }, [chartData.xAxis.length]);

  return (
    <Card sx={{ 
      width: DASHBOARD_CONSTANTS.CARD.WIDTH,
      // maxWidth: DASHBOARD_CONSTANTS.CARD.MAX_WIDTH,
      flex: DASHBOARD_CONSTANTS.CARD.FLEX,
      borderRadius: DASHBOARD_CONSTANTS.CARD.BORDER_RADIUS, 
      p: 0, 
      mt: DASHBOARD_CONSTANTS.CARD.MARGIN_TOP 
    }}>
      <Box sx={{ p: '16px 16px 0 16px', position: 'relative' }}>
        <Box sx={{ cursor: 'pointer', position: 'relative' }}>
          <LineChart
            xAxis={[{
              data: chartData.xAxis,          
              scaleType: 'band',
              tickPlacement: 'middle',
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: { fill: '#000', fontSize: 10 },
              tickInterval: bandTickInterval,
              valueFormatter: (date) =>
                new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
            }]}
            yAxis={[{
              min: yAxisConfig.min,
              max: yAxisConfig.max,
              tickInterval: yAxisConfig.tickInterval,
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: { fill: '#000', fontSize: 12 },
            }]}
            series={[{
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
            }]}
            height={DASHBOARD_CONSTANTS.CHART.HEIGHT}
            margin={{ top: 20, bottom: 20, left: -18, right: 40}}
            disableAxisListener
            grid={{ horizontal: true, vertical: false }}
            slots={{ tooltip: undefined }}
            sx={{
              '.MuiChartsAxis-bottom .MuiChartsAxis-line, .MuiChartsAxis-left .MuiChartsAxis-line': { stroke: 'none' },
              '.MuiChartsAxis-bottom .MuiChartsAxis-tick, .MuiChartsAxis-left .MuiChartsAxis-tick': { stroke: 'none' },
              '.MuiChartsGrid-line': { 
                stroke: DASHBOARD_CONSTANTS.CHART.GRID_COLOR, 
                strokeWidth: DASHBOARD_CONSTANTS.CHART.GRID_WIDTH, 
                shapeRendering: 'crispEdges' 
              },
              '.MuiChartsGrid-root': { zIndex: 2 },
              '.MuiAreaElement-root': { fillOpacity: 0.6, mixBlendMode: 'normal' },
              '.MuiLineElement-root': { strokeWidth: 2 },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, px: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, width: '100%' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1.2, fontFamily: DASHBOARD_CONSTANTS.CHART.FONT_FAMILY }}>
            {metric}
          </Typography>
          <Typography variant="body1" sx={{ ml: 1, color: 'text.secondary', fontSize: '1rem', flexGrow: 1, fontFamily: DASHBOARD_CONSTANTS.CHART.FONT_FAMILY }}>
            {title}
          </Typography>

          <Box onClick={handleDownload} sx={{ display: 'flex', alignItems: 'center', ml: 'auto', cursor: 'pointer' }}>
            <IconButton aria-label="download" size="small" sx={{ borderRadius: '8px', mr: 0.5 }}>
              <img src={DownloadSvg} alt={DASHBOARD_LABELS.DOWNLOAD_ALT} style={{ width: '18px', height: '18px', color: '#0F172A' }} />
            </IconButton>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontFamily: DASHBOARD_CONSTANTS.CHART.FONT_FAMILY }}>
              {DASHBOARD_LABELS.DOWNLOAD_REPORT}
            </Typography>
          </Box>
        </Box>
      </Box>

      <CSVLink data={csvData} filename={filename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Card>
  );
};

export default ChartCard;

