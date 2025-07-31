import * as DemoView from "./demoView";
import * as BenchmarkView from "./benchmarkView";

let chartInitialised = false;

function registerEventListeners() {
  document.getElementById('demo-tab')!.addEventListener('click', (ev) => {
    ev.preventDefault();
    setActiveTab('demo');
  });

  document.getElementById('benchmark-tab')!.addEventListener('click', (ev) => {
    ev.preventDefault();
    setActiveTab('benchmark');
  });

  DemoView.registerEventListeners();
  BenchmarkView.registerEventListeners();
}

function setActiveTab(tab: string) {
  if (tab==='demo') {
    document.getElementById('demo-mode')!.classList.remove('d-hide');
    document.getElementById('benchmark-mode')!.classList.add('d-hide');

    document.getElementById('demo-tab')!.classList.add('active');
    document.getElementById('benchmark-tab')!.classList.remove('active');
  } else {
    // benchmark
    document.getElementById('demo-mode')!.classList.add('d-hide');
    document.getElementById('benchmark-mode')!.classList.remove('d-hide');

    document.getElementById('demo-tab')!.classList.remove('active');
    document.getElementById('benchmark-tab')!.classList.add('active');

    if (!chartInitialised) {
      // Init on tab click rather than window load so DOM element has correct size and animations play
      BenchmarkView.initChart();
      chartInitialised = true;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  registerEventListeners();
  if (window.location.hash === '#benchmark') {
    setActiveTab('benchmark');
  } else {
    DemoView.render();
  }
});
