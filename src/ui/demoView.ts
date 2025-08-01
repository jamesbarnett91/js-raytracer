import {ChunkAllocationMode, RaytraceContext, RaytracerOptions} from "../models/RaytraceContext";
import {RaytraceDispatcher} from "../RaytraceDispatcher";
import {Framebuffer} from "../Framebuffer";
import {getScene} from "../models/Scene";
import {Colour} from "../models/Colour";
import {Logger} from "../Logger";

let dispatcher: RaytraceDispatcher;

const renderButton = document.getElementById('render')!;
const stopRenderButton = document.getElementById('stop-render')!;
const viewFullButton = document.getElementById('view-full')!;

export function registerEventListeners() {
  renderButton.addEventListener('click', render);
  stopRenderButton.addEventListener('click', stopRender);

  viewFullButton.addEventListener('click', () => {
    const canvas = document.getElementById(
      'render-output'
    ) as HTMLCanvasElement;
    window.open()!.document.body.innerHTML = `<img src=${canvas.toDataURL()}>`;
  });

  const threadsSlider = getInputElement('threads');
  threadsSlider.addEventListener('input', () => {
    getInputElement('threads-value').textContent = threadsSlider.value;
  });

  const threadToggle = getInputElement('enable-threads-toggle');
  threadToggle.addEventListener('change', () => {
    threadsSlider.disabled = !threadToggle.checked;
  });
}

export function render() {
  renderButton.classList.add('loading');
  stopRenderButton.classList.remove('d-hide');
  viewFullButton.classList.add('d-hide');

  const {width, height} = parseResolution();
  const options = parseOptions();
  dispatcher = initDispatcher(width, height, options, onRenderComplete);
  dispatcher.requestRender();
}

function stopRender() {
  dispatcher.stopRender();
  onRenderComplete();
}

function onRenderComplete() {
  renderButton.classList.remove('loading');
  stopRenderButton.classList.add('d-hide');
  viewFullButton.classList.remove('d-hide');
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
    new Colour(40, 40, 40),
    options
  );

  return new RaytraceDispatcher(
    framebuffer,
    context,
    new Logger(document.getElementById('console-demo')!),
    onComplete
  );
}

function parseOptions(): RaytracerOptions {
  return {
    numThreads: getDesiredThreadCount(),
    shadows: getInputElement('shadows-toggle').checked,
    diffuseLighting: getInputElement('diffuse-toggle').checked,
    specularLighting: getInputElement('specular-toggle').checked,
    reflections: getInputElement('reflections-toggle').checked,
    refractions: getInputElement('refractions-toggle').checked,
    maxRecurseDepth: 5,
    maxDrawDistance: 1000,
    directMemoryTransfer: getInputElement('direct-transfer').checked,
    chunkSize: parseInt(getInputElement('chunk-size').value, 10),
    chunkAllocationMode: getChunkAllocationMode(),
    chunkBorderColour: new Colour(220, 128, 128),
    chunkUnrenderedColour: new Colour(120, 120, 120)
  };
}

function parseResolution(): {width: number; height: number} {
  switch (getInputElement('res').value) {
    case '360p':
      return {width: 640, height: 360};
    case '480p':
      return {width: 832, height: 480};
    case '720p':
    default:
      return {width: 1280, height: 720};
    case '1080p':
      return {width: 1920, height: 1080};
    case '1440p':
      return {width: 2560, height: 1440};
    case '4k':
      return {width: 3840, height: 2160};
  }
}

function getChunkAllocationMode(): ChunkAllocationMode {
  switch (getInputElement('chunk-allocation-mode').value) {
    case 'SEQUENTIAL':
    default:
      return ChunkAllocationMode.SEQUENTIAL;
    case 'RANDOM':
      return ChunkAllocationMode.RANDOM
    case 'CENTER_TO_EDGE':
      return ChunkAllocationMode.CENTER_TO_EDGE
    case 'EDGE_TO_CENTER':
      return ChunkAllocationMode.EDGE_TO_CENTER
  }
}

function getDesiredThreadCount(): number {
  if (getInputElement('enable-threads-toggle').checked) {
    return Number.parseInt(getInputElement('threads').value);
  } else {
    return 1;
  }
}

function getInputElement(elementId: string) {
  return document.getElementById(elementId) as HTMLInputElement;
}