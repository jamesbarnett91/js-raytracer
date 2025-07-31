import * as echarts from 'echarts';
import {EChartsOption, EChartsType} from "echarts";

let scoreChart: EChartsType;
const userDeviceLabel = 'Your device';

let deviceScores = [
  { device: 'AMD Ryzen 7\n3700X\n(8c/16t)', multiCoreScore: 416, singleCoreScore: 74 },
  { device: 'Intel 11th Gen\ni5-1145G7\n(4c/8t)', multiCoreScore: 294, singleCoreScore: 73 },
  { device: 'Intel 8th Gen\ni7-8550U\n(4c/8t)', multiCoreScore: 221, singleCoreScore: 53 },
  { device: 'iPhone XS\n(6c/6t)\n(*WebKit)', multiCoreScore: 71, singleCoreScore: 28 },
  { device: 'Raspberry Pi4\nARM Cortex-A72\n(4c/4t)', multiCoreScore: 25, singleCoreScore: 9 }
]

let scoreDataset = {
  dimensions: ['device', 'multiCoreScore', 'singleCoreScore'],
  source: deviceScores
}

const option: EChartsOption = {
  legend: {},
  dataset: scoreDataset,
  xAxis: { type: 'value' },
  yAxis: {
    type: 'category',
    inverse: true,
    axisLabel: {
      formatter: function (label) {
        if (label == userDeviceLabel) {
          return `{usersDevice|${label}}`;
        }
        return label;
      },
      rich: {
        usersDevice: {
          color: "#5755d9",
          fontWeight: "bold",
          fontSize: "14px"
        },
      },
    },
  },
  series: [
    {
      name: 'Multi-core',
      type: 'bar',
      label: {
        show: true
      },
    },
    {
      name: 'Single core',
      type: 'bar',
      label: {
        show: true
      },
    }
  ],
  grid: {
    left: '0%',
    top: '5%',
    containLabel: true
  },
  color: [
    '#5755d9',
    '#f1f1fc'
  ],
}

export function initScoreChart(dom: HTMLElement) {
  scoreChart = echarts.init(dom);
  scoreChart.setOption(option);

  window.addEventListener('resize', function() {
    scoreChart.resize();
  });
}

export function addDeviceResult(multiCoreScore: number, singleCoreScore: number) {
  // Remove previous result if present
  const index = deviceScores.findIndex(d => d.device === userDeviceLabel);
  if (index >= 0) {
    deviceScores.splice(index, 1)
  }

  deviceScores.push({device: userDeviceLabel, multiCoreScore: multiCoreScore, singleCoreScore: singleCoreScore});
  deviceScores.sort((a, b) => b.multiCoreScore - a.multiCoreScore);

  scoreChart.setOption(option);
}