import * as echarts from 'echarts';
import {EChartsOption, EChartsType} from "echarts";

let scoreChart: EChartsType;
const userDeviceLabel = 'Your device';

let deviceScores = [
  { device: 'AMD Ryzen 9\n7950X\n(16c/32t)', multiCoreScore: 1294, singleCoreScore: 121 },
  { device: 'AMD Ryzen 7\n5700X\n(8c/16t)', multiCoreScore: 663, singleCoreScore: 104 },
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
  xAxis: {
    type: 'value',
    max: deviceScores[0].multiCoreScore,
    axisLabel: {
      showMaxLabel: false,
      showMinLabel: false
    },
    splitLine: {
      show: true,
      showMaxLine: false,
    },
  },
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
          fontSize: 20
        },
      },
      fontSize: 16
    },
    axisTick: {
      length: 20
    }
  },
  series: [
    {
      name: 'Multi-core',
      type: 'bar',
      label: {
        show: true,
        position: "right"
      },
    },
    {
      name: 'Single core',
      type: 'bar',
      label: {
        show: true,
        position: "right"
      },
    }
  ],
  grid: {
    left: '0%',
    top: '5%',
    bottom: '5%',
    containLabel: true
  },
  color: [
    '#5755d9',
    '#f1f1fc'
  ],
  backgroundColor: "#0a0a0a",
  textStyle: {
    fontSize: 16,
    fontFamily: "tamzen"
  },
}

export function initScoreChart(dom: HTMLElement) {
  scoreChart = echarts.init(dom, 'dark');
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