import React from 'react'
import { ReportedTimelineGraph, ReferenceTimelineLineData, ReportedTimelineGraphData } from '../outageBreakdownAPItypes'
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2'

ChartJS.register(...registerables);

interface OutageBreakdownGraphProps {
  graphData: ReportedTimelineGraph
}


export const OutageBreakdownGraph: React.FC<OutageBreakdownGraphProps> = ({
  graphData
}) => {
  const labels = createGraphLabels(graphData[0].data.map(({ x }) => x))
  const lineDataset = createLineDataset(graphData.filter(({ label }) => label === 'Reference')[0] as ReferenceTimelineLineData)
  const barDataset = createBarDataset(graphData.filter(({ label }) => label === 'Reports')[0] as ReportedTimelineGraphData)
  return (
      <Chart
        type={'bar'}
        data={{
          labels,
          datasets: [lineDataset, barDataset]
        }}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: false,
            },
          },
          scales: {
            x: {
              ticks: {
                minRotation: 90,
                maxRotation: 90,
              }
            },
            y: {
              display: false
            },

          }
        }}
      />
  )
}
function createGraphLabels(isoDateTime: string[]): string[] {
  const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return isoDateTime
    .map(t => formatter.format(new Date(Date.parse(t))))
    .map((t, index) => (index % 6 === 0 ? t : ''))
}
function createLineDataset(lineData: ReferenceTimelineLineData): any {
  return {
    type: 'line' as const,
    data: lineData.data.map(({ y }) => y),
    borderColor: lineData.borderColor,
    borderDash: lineData.borderDash,
    borderWidth: lineData.borderWidth,
    fill: lineData.fill,
    pointHoverRadius: lineData.pointHoverRadius,
    pointRadius: lineData.pointRadius,
    tension: lineData.tension,
  }
}
function createBarDataset(barData: ReportedTimelineGraphData): any {
  return {
    type: 'bar' as const,
    data: barData.data.map(({ y }) => y),
    backgroundColor: barData.backgroundColor,
    borderColor: barData.borderColor,
    borderWidth: barData.borderWidth
  }
}