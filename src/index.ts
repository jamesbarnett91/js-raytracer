import {Colour} from './Colour';
import {Framebuffer} from './Framebuffer';
import {Plane, Sphere} from './Geometry';
import {Light} from './Light';
import {Material} from './Material';
import {RaytraceDispatcher} from './RaytraceDispatcher';
import {RaytraceContext, RaytracerOptions} from './RaytraceContext';
import {Vector} from './Vector';

function render() {
  const dispatcher = initDispatcher(parseOptions());
  dispatcher.requestRender();
}

function initDispatcher(options: RaytracerOptions): RaytraceDispatcher {
  const width = 960;
  const height = 720;
  const fov = Math.PI / 3;

  const framebuffer = new Framebuffer(width, height);

  const matWhite = new Material(new Colour(102, 102, 77), 0.6, 0.3, 0.1, 50);
  const matRed = new Material(new Colour(77, 26, 26), 0.9, 0.1, 0.0, 10);
  const matMirror = new Material(new Colour(193, 193, 193), 0.0, 10, 0.8, 1000);
  const matGreen = new Material(new Colour(77, 255, 26), 0.3, 0.1, 0.0, 2);

  const spheres = [
    new Sphere(2, new Vector(-3, 0, -16), matWhite),
    new Sphere(2, new Vector(-1, -1.5, -12), matGreen),
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

  return new RaytraceDispatcher(framebuffer, context);
}

function parseOptions(): RaytracerOptions {
  return {
    numThreads: getDesiredThreadCount(),
    shadows: getInputElement('shadows-toggle').checked,
    diffuseLighting: getInputElement('diffuse-toggle').checked,
    specularLighting: getInputElement('specular-toggle').checked,
    reflections: getInputElement('reflections-toggle').checked,
    maxRecurseDepth: 5,
    maxDrawDistance: 1000,
  };
}

function registerEventListeners() {
  document.getElementById('render')?.addEventListener('click', render); // TODO disable once clicked

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

function getInputElement(elementId: string) {
  return document.getElementById(elementId) as HTMLInputElement;
}

document.addEventListener('DOMContentLoaded', () => {
  registerEventListeners();
  render();
});
