import {Colour} from './Colour';
import {Framebuffer} from './Framebuffer';
import {Plane, Sphere} from './Geometry';
import {Light} from './Light';
import {Albedo, Material} from './Material';
import {RaytraceDispatcher} from './RaytraceDispatcher';
import {RaytraceContext, RaytracerOptions} from './RaytraceContext';
import {Vector} from './Vector';
import {Logger} from './Logger';

function render() {
  getRenderButton().classList.add('loading');
  const dispatcher = initDispatcher(parseOptions());
  dispatcher.requestRender();
}

function initDispatcher(options: RaytracerOptions): RaytraceDispatcher {
  const {width, height} = parseResolution();

  const fov = Math.PI / 3;

  const framebuffer = new Framebuffer(width, height);

  const matWhite = new Material(
    new Colour(102, 102, 77),
    new Albedo(0.6, 0.3, 0.1, 0.0),
    50,
    1
  );
  const matRed = new Material(
    new Colour(77, 26, 26),
    new Albedo(0.9, 0.1, 0.0, 0.0),
    10,
    1
  );
  const matMirror = new Material(
    new Colour(193, 193, 193),
    new Albedo(0.0, 10, 0.8, 0.0),
    1000,
    1
  );
  const matGreen = new Material(
    new Colour(77, 255, 26),
    new Albedo(0.3, 0.1, 0.0, 0.0),
    2,
    1
  );
  const matGlass = new Material(
    new Colour(153, 179, 204),
    new Albedo(0.0, 0.5, 0.1, 0.8),
    125,
    1.5
  );

  const spheres = [
    new Sphere(2, new Vector(-3, 0, -16), matWhite),
    new Sphere(2, new Vector(-1, -1.5, -12), matGlass),
    new Sphere(3, new Vector(1.5, -0.5, -18), matRed),
    new Sphere(4, new Vector(7, 5, -18), matMirror),
  ];

  const planes = [new Plane(-4, 10, -10, -30, 0.7)];

  const lights = [
    new Light(new Vector(-20, 20, 20), 1.5),
    new Light(new Vector(30, 50, -25), 1.8),
    new Light(new Vector(30, 20, 30), 1.7),
  ];

  const context = new RaytraceContext(
    height,
    width,
    fov,
    spheres,
    planes,
    lights,
    options
  );

  return new RaytraceDispatcher(
    framebuffer,
    context,
    new Logger(),
    onRenderComplete
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
    bufferDrawCalls: getInputElement('buffer-draw').checked,
    directMemoryTransfer: getInputElement('direct-transfer').checked,
  };
}

function parseResolution(): {width: number; height: number} {
  switch (getInputElement('res').value) {
    case '720p':
    default:
      return {width: 960, height: 720};
    case '1080p':
      return {width: 1440, height: 1080};
    case '1440p':
      return {width: 1920, height: 1440};
    case '4k':
      return {width: 2880, height: 2160};
    case '8k':
      return {width: 5760, height: 4320};
  }
}

function registerEventListeners() {
  getRenderButton().addEventListener('click', render);

  document.getElementById('view-full')!.addEventListener('click', () => {
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

function getDesiredThreadCount(): number {
  if (getInputElement('enable-threads-toggle').checked) {
    return Number.parseInt(getInputElement('threads').value);
  } else {
    return 1;
  }
}

function onRenderComplete() {
  getRenderButton().classList.remove('loading');
}

function getRenderButton(): HTMLElement {
  return document.getElementById('render')!;
}

function getInputElement(elementId: string) {
  return document.getElementById(elementId) as HTMLInputElement;
}

document.addEventListener('DOMContentLoaded', () => {
  registerEventListeners();
  render();
});
