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

  const handleDownload = () => {
    if (csvLinkRef.current) {
      csvLinkRef.current.link.click();
    }
  };

  // const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
  //   if (!chartRef.current) return;

  //   const svgElement = chartRef.current.querySelector('svg');
  //   if (!svgElement) return;

  //   const rect = svgElement.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   // Calculate the data index based on the mouse position
  //   const chartWidth = rect.width;
  //   const dataIndex = Math.floor((x / chartWidth) * chartData.xAxis.length);

  //   if (dataIndex >= 0 && dataIndex < chartData.xAxis.length) {
  //     const date = chartData.xAxis[dataIndex];
  //     const value = chartData.series2[dataIndex];

  //     const formattedDate = new Date(date).toLocaleDateString('en-US', {
  //       day: 'numeric',
  //       month: 'short',
  //       year: 'numeric',
  //     });

  //     setTooltip({
  //       visible: true,
  //       x: x + 10,
  //       y: y + 10,
  //       content: { date: formattedDate, value: value },
  //     });
  //   } else {
  //     setTooltip({ ...tooltip, visible: false });
  //   }
  // };
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
  if (!chartRef.current) return;

  const svgElement = chartRef.current.querySelector('svg');
  if (!svgElement) return;

  const rect = svgElement.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;

  // Get the width of the tooltip to check for overflow
  const tooltipWidth = 200; // This should match your minWidth in the tooltip Box
  const chartWidth = rect.width;

  // Check if the tooltip will be pushed off the right side
  if (x + 10 + tooltipWidth > chartWidth) {
    x = chartWidth - tooltipWidth - 10; // Adjust position to the left
  }

  // Calculate the data index based on the mouse position
  const dataIndex = Math.floor((x / chartWidth) * chartData.xAxis.length);

  if (dataIndex >= 0 && dataIndex < chartData.xAxis.length) {
    const date = chartData.xAxis[dataIndex];
    const value = chartData.series2[dataIndex];

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    setTooltip({
      visible: true,
      x: x + 10,
      y: y + 10,
      content: { date: formattedDate, value: value },
    });
  } else {
    setTooltip({ ...tooltip, visible: false });
  }
};

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <Card
      sx={{
        width: '445px',
        borderRadius: '20px',
        p: 0,
        marginTop: '64px',
      }}
    >
      <Box sx={{ p: '16px 16px 0 16px', position: 'relative' }}>
        <Box
          ref={chartRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          sx={{ cursor: 'pointer', position: 'relative' }}
        >
          <LineChart
            xAxis={[
              {
                data: chartData.xAxis,
                scaleType: 'point',
                tickPlacement: 'start',
                disableLine: true,
                disableTicks: true,
                tickLabelStyle: { fill: 'none' },
              },
            ]}
            yAxis={[
              {
                min: yAxisConfig.min,
                max: yAxisConfig.max,
                tickInterval: yAxisConfig.tickInterval,
                disableLine: true,
                disableTicks: true,
                label: '',
                tickLabelStyle: {
                  fill: '#BDBDBD',
                  fontSize: 12,
                  transform: 'translateX(3px)',
                },
              },
            ]}
            series={[
              {
                data: chartData.series1,
                color: colors.area,
                area: true,
                curve: 'catmullRom',
                showMark: false,
              },
              {
                data: chartData.series2,
                color: colors.main,
                area: false,
                curve: 'catmullRom',
                showMark: false,
              },
            ]}
            height={160}
            margin={{ top: 10, bottom: 20, left: -33, right: 20 }}
            disableAxisListener
            grid={{ vertical: false, horizontal: true }}
            slots={{
              tooltip: () => null,
            }}
            sx={{
              '.MuiChartsAxis-bottom .MuiChartsAxis-line, .MuiChartsAxis-left .MuiChartsAxis-line': {
                stroke: 'none',
              },
              '.MuiChartsAxis-bottom .MuiChartsAxis-tick, .MuiChartsAxis-left .MuiChartsAxis-tick': {
                stroke: 'none',
              },
              '.MuiChartsGrid-line': {
                stroke: '#E6EDF7',
                strokeWidth: 3,
                shapeRendering: 'crispEdges',
              },
              '.MuiChartsGrid-root': {
                zIndex: 2,
              },
              '.MuiAreaElement-root': {
                fillOpacity: 0.6,
                mixBlendMode: 'normal',
              },
              '.MuiLineElement-root': {
                strokeWidth: 2,
              },
              '.MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                transform: 'translateY(50px)',
              },
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
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant="body2">{tooltip.content.date}</Typography>
            <Typography variant="body2">Value: {tooltip.content.value}</Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          mt: 2,
          px: 2,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 1,
            width: '100%',
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ lineHeight: 1.2, fontFamily: 'lexend' }}
          >
            {metric}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              ml: 1,
              color: 'text.secondary',
              fontSize: '1rem',
              flexGrow: 1,
              fontFamily: 'lexend',
            }}
          >
            {title}
          </Typography>

          <Box
            onClick={handleDownload}
            sx={{
              display: 'flex',
              alignItems: 'center',
              ml: 'auto',
              cursor: 'pointer',
            }}
          >
            <IconButton
              aria-label="download"
              size="small"
              sx={{
                borderRadius: '8px',
                mr: 0.5,
              }}
            >
              <img
                src={DownloadSvg}
                alt="Download"
                style={{ width: '18px', height: '18px', color: '#0F172A' }}
              />
            </IconButton>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontSize: '0.8rem', fontFamily: 'lexend' }}
            >
              Download Report
            </Typography>
          </Box>
        </Box>
      </Box>

      <CSVLink
        data={csvData}
        filename={filename}
        ref={csvLinkRef}
        style={{ display: 'none' }}
      />
    </Card>
  );
};

export default ChartCard;


// import * as React from 'react';
// import { Card, Box, Typography, IconButton } from '@mui/material';
// import { LineChart } from '@mui/x-charts/LineChart';
// import { CSVLink } from 'react-csv';

// import DownloadSvg from '../../../assets/Download.svg';

// interface ChartData {
//   xAxis: string[];
//   series1: number[];
//   series2: number[];
// }

// interface YAxisConfig {
//   min: number;
//   max: number;
//   tickInterval: number[];
// }

// interface ChartCardProps {
//   title: string;
//   metric: string;
//   chartData: ChartData;
//   colors: { main: string; area: string; percentBg: string; percentText: string };
//   yAxisConfig: YAxisConfig;
//   csvData: object[];
//   filename: string;
// }

// const ChartCard: React.FC<ChartCardProps> = ({
//   title,
//   metric,
//   chartData,
//   colors,
//   yAxisConfig,
//   csvData,
//   filename,
// }) => {
//   const csvLinkRef = React.useRef<any>(null);
//   const chartRef = React.useRef<HTMLDivElement>(null);
//   const [tooltip, setTooltip] = React.useState({
//     visible: false,
//     x: 0,
//     y: 0,
//     content: { date: '', value: 0 },
//   });

//   const handleDownload = () => {
//     if (csvLinkRef.current) {
//       csvLinkRef.current.link.click();
//     }
//   };

//   const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
//     if (!chartRef.current) return;

//     const svgElement = chartRef.current.querySelector('svg');
//     if (!svgElement) return;

//     const rect = svgElement.getBoundingClientRect();
//     let x = event.clientX - rect.left;
//     let y = event.clientY - rect.top;

//     const tooltipWidth = 200;
//     const chartWidth = rect.width;

//     if (x + 10 + tooltipWidth > chartWidth) {
//       x = chartWidth - tooltipWidth - 10;
//     }

//     const dataIndex = Math.floor((x / chartWidth) * chartData.xAxis.length);

//     if (dataIndex >= 0 && dataIndex < chartData.xAxis.length) {
//       const date = chartData.xAxis[dataIndex];
//       const value = chartData.series2[dataIndex];

//       const formattedDate = new Date(date).toLocaleDateString('en-US', {
//         day: 'numeric',
//         month: 'short',
//         year: 'numeric',
//       });

//       setTooltip({
//         visible: true,
//         x: x + 10,
//         y: y + 10,
//         content: { date: formattedDate, value: value },
//       });
//     } else {
//       setTooltip({ ...tooltip, visible: false });
//     }
//   };

//   const handleMouseLeave = () => {
//     setTooltip({ ...tooltip, visible: false });
//   };

//   return (
//     <Card
//       sx={{
//         width: '445px',
//         borderRadius: '20px',
//         p: 0,
//         marginTop: '64px',
//       }}
//     >
//       <Box sx={{ p: '16px 16px 0 16px', position: 'relative' }}>
//         <Box
//           ref={chartRef}
//           onMouseMove={handleMouseMove}
//           onMouseLeave={handleMouseLeave}
//           sx={{ cursor: 'pointer', position: 'relative' }}
//         >
//           <LineChart
//             xAxis={[
//               {
//                 data: chartData.xAxis,
//                 scaleType: 'point',
//                 tickPlacement: 'start',
//                 disableLine: true,
//                 disableTicks: true,
//                 tickLabelStyle: { fill: 'none' },
//               },
//             ]}
//             yAxis={[
//               {
//                 min: yAxisConfig.min,
//                 max: yAxisConfig.max,
//                 tickInterval: yAxisConfig.tickInterval,
//                 disableLine: true,
//                 disableTicks: true,
//                 label: '',
//                 tickLabelStyle: {
//                   fill: '#BDBDBD',
//                   fontSize: 12,
//                   transform: 'translateX(3px)',
//                 },
//               },
//             ]}
//             series={[
//               {
//                 data: chartData.series1,
//                 color: colors.area,
//                 area: true,
//                 curve: 'catmullRom',
//                 showMark: false,
//                 id: 'area-series',
//               },
//               {
//                 data: chartData.series2,
//                 color: colors.main,
//                 area: false,
//                 curve: 'catmullRom',
//                 showMark: false,
//                 id: 'line-series',
//               },
//             ]}
//             height={160}
//             margin={{ top: 10, bottom: 20, left: -33, right: 20 }}
//             disableAxisListener
//             grid={{ vertical: false, horizontal: true }}
//             slots={{
//               tooltip: () => null,
//             }}
//             sx={{
//               '.MuiChartsAxis-bottom .MuiChartsAxis-line, .MuiChartsAxis-left .MuiChartsAxis-line': {
//                 stroke: 'none',
//               },
//               '.MuiChartsAxis-bottom .MuiChartsAxis-tick, .MuiChartsAxis-left .MuiChartsAxis-tick': {
//                 stroke: 'none',
//               },
//               '.MuiChartsGrid-line': {
//                 stroke: '#E6EDF7',
//                 strokeWidth: 3,
//                 shapeRendering: 'crispEdges',
//               },
//               '.MuiChartsGrid-root': {
//                 zIndex: 2,
//               },
//               '.MuiAreaElement-root': {
//                 fillOpacity: 0.6,
//                 mixBlendMode: 'normal',
//               },
//               '.MuiLineElement-root': {
//                 strokeWidth: 2,
//               },
//               '.MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
//                 transform: 'translateY(50px)',
//               },
//             }}
//           />
//         </Box>

//         {tooltip.visible && (
//           <Box
//             sx={{
//               position: 'absolute',
//               left: tooltip.x,
//               top: tooltip.y,
//               backgroundColor: 'rgba(255, 255, 255, 0.9)',
//               borderRadius: '4px',
//               boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
//               zIndex: 1,
//               pointerEvents: 'none',
//               minWidth: '200px',
//               p: 1,
//             }}
//           >
//             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//               {title}
//             </Typography>
//             <Typography variant="body2">{tooltip.content.date}</Typography>
//             <Typography variant="body2">Value: {tooltip.content.value}</Typography>
//           </Box>
//         )}
//       </Box>

//       <Box
//         sx={{
//           mt: 2,
//           px: 2,
//           pb: 2,
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'flex-start',
//         }}
//       >
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             mt: 1,
//             width: '100%',
//           }}
//         >
//           <Typography
//             variant="h4"
//             fontWeight="bold"
//             sx={{ lineHeight: 1.2, fontFamily: 'lexend' }}
//           >
//             {metric}
//           </Typography>
//           <Typography
//             variant="body1"
//             sx={{
//               ml: 1,
//               color: 'text.secondary',
//               fontSize: '1rem',
//               flexGrow: 1,
//               fontFamily: 'lexend',
//             }}
//           >
//             {title}
//           </Typography>

//           <Box
//             onClick={handleDownload}
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               ml: 'auto',
//               cursor: 'pointer',
//             }}
//           >
//             <IconButton
//               aria-label="download"
//               size="small"
//               sx={{
//                 borderRadius: '8px',
//                 mr: 0.5,
//               }}
//             >
//               <img
//                 src={DownloadSvg}
//                 alt="Download"
//                 style={{ width: '18px', height: '18px', color: '#0F172A' }}
//               />
//             </IconButton>
//             <Typography
//               variant="body2"
//               sx={{ color: 'text.secondary', fontSize: '0.8rem', fontFamily: 'lexend' }}
//             >
//               Download Report
//             </Typography>
//           </Box>
//         </Box>
//       </Box>

//       <CSVLink
//         data={csvData}
//         filename={filename}
//         ref={csvLinkRef}
//         style={{ display: 'none' }}
//       />
//     </Card>
//   );
// };

// export default ChartCard;