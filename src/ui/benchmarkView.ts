import {ChunkAllocationMode, RaytraceContext, RaytracerOptions} from "../models/RaytraceContext";
import {RaytraceDispatcher} from "../RaytraceDispatcher";
import {Framebuffer} from "../Framebuffer";
import {getScene} from "../models/Scene";
import {Colour} from "../models/Colour";
import {Logger} from "../Logger";
import * as BenchmarkChart from "./benchmarkCharts";

let multiCoreDispatcher: RaytraceDispatcher;
let singleCoreDispatcher: RaytraceDispatcher;

let multiCoreScore = 0;
let singleCoreScore = 0;

const deviceAvailableThreadCount = navigator.hardwareConcurrency;

const logger = new Logger(document.getElementById('console-benchmark')!);

const benchmarkButton = document.getElementById('benchmark')!;
const multiCoreScoreElement = document.getElementById('multi-core-score')!;
const singleCoreScoreElement = document.getElementById('single-core-score')!;

export function registerEventListeners() {
  benchmarkButton.addEventListener('click', startBenchmark);
  logger.log(`Detected ${deviceAvailableThreadCount} available CPU threads, ready to run`);
}

export function initChart() {
  BenchmarkChart.initScoreChart(document.getElementById('benchmark-results-graph')!);
}

function startBenchmark() {
  benchmarkButton.classList.add('loading');
  multiCoreScoreElement.classList.add('loading');
  document.getElementById('single-core-score')!.classList.add('loading');

  multiCoreDispatcher = initDispatcher(
    1920,
    1080,
    getBenchmarkRenderOptions(true),
    onMultiCoreBenchmarkComplete
  )

  singleCoreDispatcher = initDispatcher(
    1920,
    1080,
    getBenchmarkRenderOptions(false),
    onSingleCoreBenchmarkComplete
  )

  logger.log("Started multi-core benchmark");
  multiCoreDispatcher.requestRender();
}

function onMultiCoreBenchmarkComplete(score: number) {
  multiCoreScore = score;
  multiCoreScoreElement.textContent = `${multiCoreScore}`;
  multiCoreScoreElement.classList.remove('loading');
  logger.log("Started single core benchmark");
  singleCoreDispatcher.requestRender();
}

function onSingleCoreBenchmarkComplete(score: number) {
  singleCoreScore = score;
  benchmarkButton.classList.remove('loading');
  singleCoreScoreElement.textContent = `${singleCoreScore}`;
  singleCoreScoreElement.classList.remove('loading');

  BenchmarkChart.addDeviceResult(multiCoreScore, singleCoreScore);
}

function initDispatcher(width: number, height: number, options: RaytracerOptions, onComplete: Function): RaytraceDispatcher {
  const fov = Math.PI / 3;
  const framebuffer = new Framebuffer(width, height);

  const {spheres, planes, lights} = getScene();

  const context = new RaytraceContext(
    height,
    width,
    fov,
    spheres,
    planes,
    lights,
    new Colour(221, 221, 221),
    options
  );

  return new RaytraceDispatcher(
    framebuffer,
    context,
    logger,
    onComplete
  );
}

function getBenchmarkRenderOptions(multiCore: boolean) {
  return {
    numThreads: multiCore ? deviceAvailableThreadCount: 1,
    shadows: true,
    diffuseLighting: true,
    specularLighting: true,
    reflections: true,
    refractions: true,
    maxRecurseDepth: 5,
    maxDrawDistance: 1000,
    directMemoryTransfer: true,
    chunkSize: 0,
    chunkAllocationMode: ChunkAllocationMode.SEQUENTIAL
  }
}
