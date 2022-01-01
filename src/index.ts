import {Colour} from './Colour';
import {Framebuffer} from './Framebuffer';
import {Plane, Sphere} from './Geometry';
import {Light} from './Light';
import {Material} from './Material';
import {Raytracer, RaytracerOptions} from './Raytracer';
import {Vector} from './Vector';

function parseOptions(): RaytracerOptions {
  return {
    shadows: getInputElement('shadows-toggle').checked,
    diffuseLighting: getInputElement('diffuse-toggle').checked,
    specularLighting: getInputElement('specular-toggle').checked,
    reflections: getInputElement('reflections-toggle').checked,
    maxRecurseDepth: 5,
    maxDrawDistance: 1000,
  };
}

function initRaytracer(options: RaytracerOptions): Raytracer {
  const width = 960;
  const height = 720;
  const fov = Math.PI / 3;

  const framebuffer = new Framebuffer(width, height);

  const matWhite = new Material(new Colour(102, 102, 77), 0.6, 0.3, 0.1, 50);
  const matRed = new Material(new Colour(77, 26, 26), 0.9, 0.1, 0.0, 10);
  const matMirror = new Material(new Colour(193, 193, 193), 0.0, 10, 0.8, 1000);
  const matGreen= new Material(new Colour(77, 255, 26), 0.3, 0.1, 0.0, 2);

  const spheres = [
    new Sphere(new Vector(-3, 0, -16), 2, matWhite),
    new Sphere(new Vector(-1, -1.5, -12), 2, matGreen),
    new Sphere(new Vector(1.5, -0.5, -18), 3, matRed),
    new Sphere(new Vector(7, 5, -18), 4, matMirror),
  ];

  const planes = [
    new Plane(-4, 10, -10, -30, 0.7)
  ];

  const lights = [
    new Light(new Vector(-20, 20, 20), 1.5),
    new Light(new Vector(30, 50, -25), 1.8),
    new Light(new Vector(30, 20, 30), 1.7),
  ];

  return new Raytracer(framebuffer, fov, spheres, planes, lights, options);
}

function render() {
  const raytracer = initRaytracer(parseOptions());
  showLoadingIndicator();

  // Give browser time to repaint
  setTimeout(() => {
    const startMs = new Date().getTime();
    raytracer.render();
    console.log(`Render took ${new Date().getTime() - startMs}ms`);
    hideLoadingIndicator();
  }, 50);
}

function registerEventListeners() {
  document.getElementById('render')?.addEventListener('click', render); // TODO disable once clicked
}

function showLoadingIndicator() {
  document.getElementById('output-wrapper')?.classList.add('loading');
}

function hideLoadingIndicator() {
  document.getElementById('output-wrapper')?.classList.remove('loading');
}

function getInputElement(elementId: string) {
  return document.getElementById(elementId) as HTMLInputElement;
}

document.addEventListener('DOMContentLoaded', () => {
  registerEventListeners();
  render();
});
