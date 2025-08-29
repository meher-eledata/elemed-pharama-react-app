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
  const [tooltip, setTooltip] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    content: { date: '', value: 0 },
  });

  const handleDownload = () => csvLinkRef.current?.link?.click();

  // Ensure exactly ~5 ticks on a band scale (first/last included)
  const bandTickInterval = React.useMemo(() => {
    const n = chartData.xAxis.length;
    if (n <= 5) return () => true;
    const step = Math.ceil((n - 1) / 4); // 5 ticks => 4 gaps
    return (_value: string, index: number) => index % step === 0 || index === n - 1;
  }, [chartData.xAxis.length]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const chartWidth = rect.width;
    const idx = Math.floor((x / chartWidth) * chartData.xAxis.length);

    if (idx >= 0 && idx < chartData.xAxis.length) {
      const date = chartData.xAxis[idx];
      const value = chartData.series2[idx];
      const formatted = new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      setTooltip({ visible: true, x: x, y: (event.clientY - rect.top) + 10, content: { date: formatted, value } });
    } else {
      setTooltip((t) => ({ ...t, visible: false }));
    }
  };

  const handleMouseLeave = () => setTooltip((t) => ({ ...t, visible: false }));

  return (
    <Card sx={{ width: '445px', borderRadius: '20px', p: 0, mt: '64px' }}>
      <Box sx={{ p: '16px 16px 0 16px', position: 'relative' }}>
        <Box
          ref={chartRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          sx={{ cursor: 'pointer', position: 'relative' }}
        >
          <LineChart
            xAxis={[{
              data: chartData.xAxis,           // full array
              scaleType: 'band',
              tickPlacement: 'middle',
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: { fill: '#000', fontSize: 12 },
              // show ~5 dates dynamically
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
              { data: chartData.series1, color: colors.area, area: true, curve: 'catmullRom', showMark: false },
              { data: chartData.series2, color: colors.main, area: false, curve: 'catmullRom', showMark: false },
            ]}
            height={160}
            // Give space for x labels & y labels (no negative margins)
            margin={{ top: 10, bottom: 10, left: -18, right: 20 }}
            disableAxisListener
            grid={{ horizontal: true, vertical: false }} // avoid duplicate key warnings
            slots={{ tooltip: () => null }}
            sx={{
              '.MuiChartsAxis-bottom .MuiChartsAxis-line, .MuiChartsAxis-left .MuiChartsAxis-line': { stroke: 'none' },
              '.MuiChartsAxis-bottom .MuiChartsAxis-tick, .MuiChartsAxis-left .MuiChartsAxis-tick': { stroke: 'none' },
              '.MuiChartsGrid-line': { stroke: '#E6EDF7', strokeWidth: 3, shapeRendering: 'crispEdges' },
              '.MuiChartsGrid-root': { zIndex: 2},
              '.MuiAreaElement-root': { fillOpacity: 0.6, mixBlendMode: 'normal' },
              '.MuiLineElement-root': { strokeWidth: 2 },
              // ❌ removed translateY(50px) which hid labels
            }}
          />
        </Box>

        {tooltip.visible && (
          <Box
            sx={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 1,
              pointerEvents: 'none',
              minWidth: '200px',
              p: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{title}</Typography>
            <Typography variant="body2">{tooltip.content.date}</Typography>
            <Typography variant="body2">Value: {tooltip.content.value}</Typography>
          </Box>
        )}
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