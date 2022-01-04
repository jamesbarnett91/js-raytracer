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

  const materialMirror = new Material(
    new Colour(220, 220, 220),
    new Albedo(0.1, 1, 0.8, 0.0),
    2500,
    1
  );

  const materialGlass = new Material(
    new Colour(153, 179, 204),
    new Albedo(0.0, 0.5, 0.1, 0.8),
    125,
    1.5
  );

  const spheres: Sphere[] = [
    new Sphere(1, new Vector(-6.5, -3, -26), matteMaterial(27, 118, 255)),
    new Sphere(1, new Vector(-14, -3, -25), matteMaterial(146, 80, 188)),
    new Sphere(1, new Vector(-10, -3, -25), matteMaterial(0, 146, 178)),
    new Sphere(1, new Vector(-10, -3, -20), matteMaterial(185, 18, 27)),
    new Sphere(1, new Vector(-2.5, -3, -20), matteMaterial(115, 45, 217)),
    new Sphere(1.5, new Vector(-10.5, -2.5, -16), materialMirror),
    new Sphere(1, new Vector(-3, -3, -16), matteMaterial(247, 178, 173)),
    new Sphere(1, new Vector(-6, -3, -18), matteMaterial(154, 188, 167)),
    new Sphere(1, new Vector(-6, -3, -12), matteMaterial(96, 125, 139)),
    new Sphere(1, new Vector(-9.5, -3, -12), matteMaterial(122, 186, 242)),
    new Sphere(1, new Vector(0, -3, -14), matteMaterial(250, 91, 15)),
    new Sphere(1, new Vector(-3, -3, -11), materialGlass),
    new Sphere(1, new Vector(-1, -3, -10), matteMaterial(54, 95, 182)),
    new Sphere(1, new Vector(-4.5, -3, -8), matteMaterial(139, 195, 74)),

    new Sphere(4, new Vector(4, 0, -18), materialMirror),
    new Sphere(1, new Vector(4, -3, -12), matteMaterial(115, 45, 217)),
    new Sphere(1.5, new Vector(8.5, -2.5, -10), materialMirror),
    new Sphere(1, new Vector(1, -3, -11.5), matteMaterial(255, 200, 0)),
    new Sphere(1, new Vector(1.2, -3, -8.2), materialGlass),
    new Sphere(1, new Vector(4, -3, -7), matteMaterial(244, 67, 54)),
    new Sphere(1, new Vector(5.5, -3, -9.5), matteMaterial(150, 237, 137)),
    new Sphere(1, new Vector(6.5, -3, -15), matteMaterial(14, 234, 255)),
    new Sphere(1, new Vector(10, -3, -16), matteMaterial(171, 71, 188)),
    new Sphere(1, new Vector(11, -3, -20), matteMaterial(190, 189, 191)),
  ];

  const planes = [
    new Plane(
      -4,
      50,
      40,
      -45,
      1.5,
      new Colour(116, 101, 87),
      new Colour(92, 78, 70)
    ),
  ];

  const lights = [
    new Light(new Vector(30, 50, 40), 2.5),
    new Light(new Vector(-20, 50, -25), 0.5),
  ];

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
    case '360p':
      return {width: 640, height: 360};
    case '480p':
      return {width: 854, height: 480};
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

function matteMaterial(r: number, g: number, b: number): Material {
  return new Material(
    new Colour(r, g, b),
    new Albedo(0.4, 0.0, 0.0, 0.0),
    0,
    1
  );
}

function glossMaterial(r: number, g: number, b: number): Material {
  return new Material(
    new Colour(r, g, b),
    new Albedo(0.4, 0.1, 0.05, 0),
    250,
    1
  );
}

document.addEventListener('DOMContentLoaded', () => {
  registerEventListeners();
  render();
});
